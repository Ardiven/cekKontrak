import asyncio
import json
import logging
import time
import re
import httpx
from typing import Optional, Dict, Any, List, Tuple
from google import genai
from google.genai import types

from backend.app.core.config import settings
from backend.app.core.prompts import SYSTEM_ANALYZE_CLAUSE_PROMPT, BATCH_OUTPUT_INSTRUCTION
from backend.app.models.schemas import RiskLevel

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        self.gemini_ready = False
        self.groq_ready = bool(settings.GROQ_API_KEY)
        self.client: Optional[genai.Client] = None
        # Model yang baru saja sibuk (503) / kena limit (429) dilewati sementara: {model: waktu_boleh_dipakai_lagi}
        self._cooldown: Dict[str, float] = {}
        
        if settings.GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
                self.gemini_ready = True
            except Exception as e:
                logger.error(f"Failed to configure Gemini: {e}")

    async def analyze_clause(self, clause_number: str, clause_title: Optional[str], clause_content: str, max_retries: int = 3) -> Dict[str, Any]:
        """
        Analyzes a single clause using Gemini -> Fallback Groq -> Heuristic Fallback.
        Ensures valid JSON schema output.
        """
        prompt = (
            f"Nomor Pasal: {clause_number}\n"
            f"Judul Pasal: {clause_title or '-'}\n"
            f"Isi Pasal:\n{clause_content}\n\n"
            f"Berikan hasil telaah risiko dalam format JSON sesuai instruksi sistem."
        )

        # 1. Try Gemini (retry dengan jeda bertahap, mis. saat kena limit 429)
        if self.gemini_ready:
            for attempt in range(max_retries):
                try:
                    result = await self._call_gemini(prompt)
                    validated = self._validate_and_parse_json(result, clause_number)
                    if validated:
                        validated["model_used"] = f"gemini/{settings.GEMINI_MODEL}"
                        return validated
                except Exception as e:
                    logger.warning(f"Gemini error on attempt {attempt+1}: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(1.5 * (attempt + 1))

        # 2. Fallback to Groq (FR-32)
        if self.groq_ready:
            for attempt in range(max_retries):
                try:
                    result = await self._call_groq(prompt)
                    validated = self._validate_and_parse_json(result, clause_number)
                    if validated:
                        validated["model_used"] = f"groq/{settings.GROQ_MODEL}"
                        return validated
                except Exception as e:
                    logger.warning(f"Groq fallback error on attempt {attempt+1}: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(1.5 * (attempt + 1))

        # 3. Heuristic fallback (kata kunci) - hasilnya ditandai agar tidak dikira analisis AI
        if self.gemini_ready or self.groq_ready:
            logger.error(f"Semua LLM gagal untuk Pasal {clause_number}; memakai heuristik.")
        result = self._heuristic_analyze(clause_number, clause_title, clause_content)
        result["model_used"] = "heuristic"
        return result

    async def _call_gemini(self, prompt: str, model: Optional[str] = None, system_prompt: str = SYSTEM_ANALYZE_CLAUSE_PROMPT) -> str:
        if not self.client:
            raise RuntimeError("Gemini client not initialized")
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json"
        )
        response = await self.client.aio.models.generate_content(
            model=model or settings.GEMINI_MODEL,
            contents=prompt,
            config=config
        )
        return response.text or ""

    async def _call_groq(self, prompt: str, system_prompt: str = SYSTEM_ANALYZE_CLAUSE_PROMPT) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code >= 400:
                # Tampilkan pesan asli Groq (mis. "model ... does not exist") agar mudah dilacak
                raise RuntimeError(f"Groq {resp.status_code} (model '{settings.GROQ_MODEL}'): {resp.text[:300]}")
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    def _validate_and_parse_json(self, raw_text: str, default_number: str) -> Optional[Dict[str, Any]]:
        try:
            # Clean possible markdown wrap
            cleaned = raw_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned.strip())

            level = str(data.get("level", "")).lower()
            if level not in ["merah", "kuning", "hijau"]:
                return None

            return {
                "nomor_pasal": str(data.get("nomor_pasal", default_number)),
                "level": level,
                "alasan": str(data.get("alasan", "Klausul dianalisis")),
                "penjelasan_awam": str(data.get("penjelasan_awam", "")),
                "saran_revisi": data.get("saran_revisi"),
                "sorotan": data.get("sorotan") if isinstance(data.get("sorotan"), list) else []
            }
        except Exception:
            return None


    # ------------------------------------------------------------------
    # Analisis banyak pasal dalam satu request (hemat kuota gratis)
    # ------------------------------------------------------------------
    async def analyze_clauses(self, clauses: List[Tuple[str, Optional[str], str]]) -> List[Dict[str, Any]]:
        """
        clauses: list (nomor, judul, isi). Mengembalikan hasil dengan urutan sama.
        Urutan penyedia: Gemini utama -> Gemini cadangan -> Groq -> heuristik (per pasal yang tersisa).
        """
        results: List[Optional[Dict[str, Any]]] = [None] * len(clauses)
        size = max(1, settings.LLM_BATCH_SIZE)
        chunks = [list(range(s, min(s + size, len(clauses)))) for s in range(0, len(clauses), size)]
        # Batch dikirim BERSAMAAN (maks. LLM_PARALLEL_BATCHES), bukan bergantian -> jauh lebih cepat
        sem = asyncio.Semaphore(max(1, settings.LLM_PARALLEL_BATCHES))

        async def run(idxs: List[int]):
            async with sem:
                await self._analyze_chunk(clauses, idxs, results)

        await asyncio.gather(*(run(c) for c in chunks))

        for i, r in enumerate(results):
            if r is None:
                num, title, content = clauses[i]
                if self.gemini_ready or self.groq_ready:
                    logger.error(f"Semua LLM gagal untuk Pasal {num}; memakai heuristik.")
                r = self._heuristic_analyze(num, title, content)
                r["model_used"] = "heuristic"
                r["sorotan"] = self._heuristic_highlight(content, r["level"])
                results[i] = r
        return results  # type: ignore[return-value]

    # --- cooldown: lewati model yang sedang sibuk agar tidak buang waktu menunggu error yang sama ---
    def is_available(self, model: str) -> bool:
        return self._cooldown.get(model, 0) <= time.monotonic()

    def mark_unavailable(self, model: str, seconds: float):
        self._cooldown[model] = max(self._cooldown.get(model, 0), time.monotonic() + seconds)
        logger.warning(f"Model {model} dilewati selama {int(seconds)} detik.")

    def gemini_models(self) -> List[str]:
        """Model Gemini yang sedang bisa dipakai, urut dari yang utama (dipakai juga oleh chat)."""
        models = [settings.GEMINI_MODEL]
        if settings.GEMINI_FALLBACK_MODEL and settings.GEMINI_FALLBACK_MODEL != settings.GEMINI_MODEL:
            models.append(settings.GEMINI_FALLBACK_MODEL)
        return [m for m in models if self.is_available(m)]

    def handle_error(self, model: str, msg: str) -> Optional[float]:
        """Catat error model. Return lama tunggu sebelum mencoba model yang sama, atau None = pindah model."""
        wait = self._retry_wait(msg)
        if wait is None:
            if "503" in msg or "UNAVAILABLE" in msg:
                self.mark_unavailable(model, settings.LLM_BUSY_COOLDOWN)
            else:
                m = re.search(r"retry in ([0-9.]+)s", msg)
                if m:
                    self.mark_unavailable(model, float(m.group(1)))
        return wait

    def _providers(self) -> List[Tuple[str, str]]:
        providers: List[Tuple[str, str]] = []
        if self.gemini_ready:
            providers.extend(("gemini", m) for m in self.gemini_models())
        if self.groq_ready and self.is_available(settings.GROQ_MODEL):
            providers.append(("groq", settings.GROQ_MODEL))
        return providers

    async def _analyze_chunk(self, clauses, idxs: List[int], results: List[Optional[Dict[str, Any]]]):
        system_prompt = SYSTEM_ANALYZE_CLAUSE_PROMPT + BATCH_OUTPUT_INSTRUCTION
        for provider, model in self._providers():
            pending = [i for i in idxs if results[i] is None]
            if not pending:
                return
            if not self.is_available(model):
                continue  # baru saja ditandai sibuk oleh batch lain
            prompt = self._build_batch_prompt(clauses, pending)
            for attempt in range(2):
                try:
                    if provider == "gemini":
                        raw = await self._call_gemini(prompt, model=model, system_prompt=system_prompt)
                    else:
                        raw = await self._call_groq(prompt, system_prompt=system_prompt)
                    parsed = self._parse_batch(raw, clauses, pending)
                    for i, item in parsed.items():
                        item["model_used"] = f"{provider}/{model}"
                        results[i] = item
                    break
                except Exception as e:
                    msg = str(e)
                    logger.warning(f"{provider}/{model} gagal (percobaan {attempt+1}): {msg[:300]}")
                    wait = self.handle_error(model, msg)
                    if attempt == 0 and wait is not None:
                        await asyncio.sleep(wait)
                    else:
                        break  # langsung coba penyedia berikutnya

    @staticmethod
    def _retry_wait(msg: str) -> Optional[float]:
        """Lama tunggu sebelum mencoba lagi model yang sama, atau None jika lebih baik pindah model."""
        m = re.search(r"retry in ([0-9.]+)s", msg)
        if m:
            secs = float(m.group(1))
            return secs + 1 if secs <= settings.LLM_MAX_RETRY_WAIT else None
        # 503 "high demand": jangan menunggu, langsung pindah ke model cadangan
        return None

    @staticmethod
    def _build_batch_prompt(clauses, idxs: List[int]) -> str:
        parts = []
        for i in idxs:
            num, title, content = clauses[i]
            parts.append(f"### id={i}\nNomor Pasal: {num}\nJudul Pasal: {title or '-'}\nIsi Pasal:\n{content}")
        return (
            f"Telaah {len(idxs)} pasal berikut. Kembalikan tepat {len(idxs)} hasil, satu untuk setiap id.\n\n"
            + "\n\n".join(parts)
        )

    def _parse_batch(self, raw_text: str, clauses, pending: List[int]) -> Dict[int, Dict[str, Any]]:
        cleaned = raw_text.strip()
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
        data = json.loads(cleaned)
        items = data.get("hasil") if isinstance(data, dict) else data
        if not isinstance(items, list):
            raise ValueError("Format JSON batch tidak berisi daftar 'hasil'")
        out: Dict[int, Dict[str, Any]] = {}
        for item in items:
            try:
                i = int(item.get("id"))
            except Exception:
                continue
            if i not in pending:
                continue
            validated = self._validate_and_parse_json(json.dumps(item), clauses[i][0])
            if validated:
                validated["nomor_pasal"] = clauses[i][0]
                out[i] = validated
        if not out:
            raise ValueError("Tidak ada hasil pasal yang valid di respons LLM")
        return out

    HEURISTIC_TERMS = [
        "seluruh sisa", "seluruh biaya sewa", "hangus", "sepihak", "tanpa hak menuntut",
        "dilarang bekerja di tempat lain", "ganti rugi penuh", "tanpa pengembalian",
        "tidak dapat dikembalikan", "tidak berhak atas pengembalian", "perpanjangan otomatis",
        "ditentukan kemudian", "kerusakan apapun", "menanggung segala biaya", "sewaktu-waktu",
        "denda", "keterlambatan",
    ]

    def _heuristic_highlight(self, content: str, level: str) -> list:
        """Sorot kalimat yang memuat kata kunci risiko (dipakai saat LLM tidak tersedia)."""
        if level == "hijau":
            return []
        lower = content.lower()
        for term in self.HEURISTIC_TERMS:
            pos = lower.find(term)
            if pos < 0:
                continue
            start = max(content.rfind(".", 0, pos), content.rfind("\n", 0, pos)) + 1
            end_dot = content.find(".", pos)
            end = len(content) if end_dot < 0 else end_dot + 1
            sentence = content[start:end].strip()
            if len(sentence) > 300:
                sentence = content[max(0, pos - 60):pos + 120].strip()
            return [{"kutipan": sentence, "keterangan": f"Mengandung kata kunci berisiko: \"{term}\""}]
        return []

    def _heuristic_analyze(self, number: str, title: Optional[str], content: str) -> Dict[str, Any]:
        """
        High-accuracy legal pattern matching for Indonesian contracts.
        Used as resilient fallback when API quota is exhausted or running without external keys.
        """
        content_lower = content.lower()
        title_lower = (title or "").lower()
        combined = f"{title_lower} {content_lower}"

        # RED: Unreasonable penalties, deposit forfeiture, unilateral changes, full non-compete
        if any(term in combined for term in [
            "seluruh sisa", "seluruh biaya sewa", "hangus tanpa", "sepihak tanpa persetujuan", 
            "tanpa hak menuntut", "dilarang bekerja di tempat lain", "ganti rugi penuh tanpa batasan",
            "tanpa pengembalian", "tidak berhak atas pengembalian deposit"
        ]):
            return {
                "nomor_pasal": number,
                "level": "merah",
                "alasan": "Terdapat klausul penalti/denda sangat berat atau klausul sepihak yang menghilangkan hak Anda secara sepihak.",
                "penjelasan_awam": "Pasal ini sangat memberatkan posisi Anda. Jika Anda ingin mengakhiri kontrak lebih awal atau terjadi sengketa, Anda berisiko kehilangan uang tanpa perlindungan yang setara.",
                "saran_revisi": "Penalti atau pemotongan dana sebaiknya dihitung secara proporsional sesuai jangka waktu pemakaian nyata, bukan dibebankan sekaligus secara penuh."
            }
        
        # RED: High forfeit deposit or early exit penalty
        if ("deposit" in combined or "uang jaminan" in combined) and ("tidak dapat dikembalikan" in combined or "hangus" in combined):
            return {
                "nomor_pasal": number,
                "level": "merah",
                "alasan": "Uang deposit dinyatakan hangus atau tidak dikembalikan secara mutlak tanpa mekanisme verifikasi kerusakan yang objektif.",
                "penjelasan_awam": "Uang jaminan yang Anda bayarkan di awal berisiko hilang begitu saja tanpa rincian bukti kerusakan yang jelas.",
                "saran_revisi": "Uang jaminan wajib dikembalikan selambat-lambatnya 7 hari kerja setelah masa sewa berakhir, setelah dipotong biaya perbaikan riil yang dibuktikan dengan nota pembayaran."
            }

        # YELLOW: Ambiguous repairs, auto-renewal, ambiguous notice period
        if any(term in combined for term in [
            "perpanjangan otomatis", "tata tertib yang akan ditentukan kemudian", 
            "kerusakan apapun", "menanggung segala biaya", "pemberitahuan 1 hari", "sewaktu-waktu"
        ]):
            return {
                "nomor_pasal": number,
                "level": "kuning",
                "alasan": "Klausul mengandung ketidakpastian batasan tanggung jawab atau perpanjangan otomatis yang perlu diperjelas.",
                "penjelasan_awam": "Ada kalimat yang multitafsir atau berpotensi membuat Anda dibebankan biaya perbaikan rutin yang seharusnya ditanggung pihak pemilik.",
                "saran_revisi": "Perlu ditegaskan bahwa biaya akibat usia pemakaian wajar (wear and tear) ditanggung pemilik, sedangkan biaya akibat kelalaian ditanggung pihak pengguna."
            }

        if "denda" in combined or "keterlambatan" in combined:
            return {
                "nomor_pasal": number,
                "level": "kuning",
                "alasan": "Terdapat ketentuan denda keterlambatan pembayaran yang perlu dipastikan besarannya wajar.",
                "penjelasan_awam": "Pastikan Anda memahami batas tanggal jatuh tempo pembayaran dan toleransi waktu tenggang (grace period) sebelum denda mulai berlaku.",
                "saran_revisi": "Diberikan masa tenggang minimal 3 hari kerja sebelum pengenaan denda keterlambatan sebesar persentase yang disepakati bersama."
            }

        # Tidak cocok dengan pola mana pun: JANGAN dianggap aman.
        # Heuristik hanya mengenali sedikit pola, jadi pasal lain harus dicek manual.
        return {
            "nomor_pasal": number,
            "level": "kuning",
            "alasan": "Pasal ini belum dapat dinilai otomatis oleh AI (analisis cadangan berbasis kata kunci tidak menemukan pola risiko yang dikenal).",
            "penjelasan_awam": "Sistem belum bisa memastikan pasal ini aman. Baca pasal ini sendiri dengan teliti, atau coba analisis ulang saat koneksi AI tersedia.",
            "saran_revisi": None
        }


llm_service = LLMService()
