import re
import zlib
import logging
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import httpx
from google import genai
from google.genai import types

from backend.app.core.config import settings
from backend.app.core.prompts import SYSTEM_RAG_CHAT_PROMPT
from backend.app.models.schemas import ClauseAnalysis, ChatResponse

logger = logging.getLogger(__name__)


class RAGService:
    LOCAL_DIM = 512

    def __init__(self):
        self.doc_clauses: Dict[str, List[ClauseAnalysis]] = {}
        # Per dokumen: {"gemini": [vektor] atau None, "local": [vektor]}
        self.doc_vectors: Dict[str, Dict[str, Optional[List[np.ndarray]]]] = {}
        self.doc_signature: Dict[str, Tuple[str, ...]] = {}
        self.client: Optional[genai.Client] = None
        if settings.GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                logger.error(f"Failed to configure Gemini client for RAG: {e}")

    @staticmethod
    def _clause_text(c: ClauseAnalysis) -> str:
        return f"Pasal {c.nomor_pasal} {c.judul or ''} {c.isi}"

    def index_document(self, doc_id: str, clauses: List[ClauseAnalysis]):
        """Index clauses of a document for semantic retrieval (skip jika sudah terindeks)."""
        signature = tuple(self._clause_text(c) for c in clauses)
        if self.doc_signature.get(doc_id) == signature and doc_id in self.doc_vectors:
            return

        texts = list(signature)
        self.doc_clauses[doc_id] = clauses
        self.doc_vectors[doc_id] = {
            "gemini": self._gemini_embed(texts, task_type="RETRIEVAL_DOCUMENT"),
            "local": [self._local_embed(t) for t in texts],
        }
        self.doc_signature[doc_id] = signature

    def _gemini_embed(self, texts: List[str], task_type: str) -> Optional[List[np.ndarray]]:
        """Embedding via Gemini (satu request untuk banyak teks). None jika gagal."""
        if not self.client or not texts:
            return None
        try:
            result = self.client.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=texts,
                config=types.EmbedContentConfig(task_type=task_type),
            )
            if not result.embeddings or len(result.embeddings) != len(texts):
                return None
            vectors = []
            for e in result.embeddings:
                vec = np.array(e.values, dtype=np.float32)
                vectors.append(vec / (np.linalg.norm(vec) + 1e-9))
            return vectors
        except Exception as e:
            logger.warning(f"Gemini embedding ({settings.GEMINI_EMBEDDING_MODEL}) gagal, pakai vektor lokal: {e}")
            return None

    def _local_embed(self, text: str) -> np.ndarray:
        """
        Fallback offline: bag-of-words di-hash ke vektor tetap.
        Memakai crc32 (stabil antar restart), bukan hash() Python yang acak per proses.
        """
        words = re.findall(r"\w+", text.lower())
        vec = np.zeros(self.LOCAL_DIM, dtype=np.float32)
        for w in words:
            vec[zlib.crc32(w.encode("utf-8")) % self.LOCAL_DIM] += 1.0
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 0 else vec

    def retrieve_relevant_clauses(self, doc_id: str, query: str, top_k: int = 3) -> List[ClauseAnalysis]:
        """Finds top-k most relevant clauses for the query."""
        clauses = self.doc_clauses.get(doc_id, [])
        vectors = self.doc_vectors.get(doc_id)
        if not clauses or not vectors:
            return []

        # Pakai ruang vektor yang sama untuk dokumen dan pertanyaan
        doc_vecs = None
        q_vec = None
        if vectors.get("gemini"):
            q = self._gemini_embed([query], task_type="RETRIEVAL_QUERY")
            if q:
                doc_vecs, q_vec = vectors["gemini"], q[0]
        if q_vec is None:
            doc_vecs, q_vec = vectors["local"], self._local_embed(query)

        scores = [(float(np.dot(emb, q_vec)), idx) for idx, emb in enumerate(doc_vecs)]
        scores.sort(key=lambda x: x[0], reverse=True)
        return [clauses[idx] for _, idx in scores[:top_k]]

    async def answer_question(self, doc_id: str, query: str, clauses_input: Optional[List[ClauseAnalysis]] = None) -> ChatResponse:
        """
        Generates grounded answer strictly citing clause numbers.
        """
        if doc_id not in self.doc_clauses and clauses_input:
            self.index_document(doc_id, clauses_input)

        relevant_clauses = self.retrieve_relevant_clauses(doc_id, query, top_k=3)
        if not relevant_clauses and clauses_input:
            relevant_clauses = clauses_input[:3]

        if not relevant_clauses:
            return ChatResponse(
                reply="Dokumen kontrak tidak ditemukan atau belum dianalisis.",
                cited_clauses=[],
                is_grounded=False,
                model_used="heuristic"
            )

        context_str = "\n\n".join([
            f"[Pasal {c.nomor_pasal}] {c.judul or ''}\n{c.isi}"
            for c in relevant_clauses
        ])

        system_prompt = SYSTEM_RAG_CHAT_PROMPT.format(context=context_str)
        user_prompt = f"Pertanyaan Pengguna: {query}\n\nJawablah dengan tepat berdasarkan klausul relevan di atas dan wajib sebut nomor pasal rujukan."

        # 1. Try Gemini (model utama, lalu model cadangan bila sibuk/kena limit)
        if self.client:
            from backend.app.services.llm_service import llm_service  # cooldown dibagi dengan analisis
            for model in llm_service.gemini_models():
                try:
                    config = types.GenerateContentConfig(
                        system_instruction=system_prompt
                    )
                    response = await self.client.aio.models.generate_content(
                        model=model,
                        contents=user_prompt,
                        config=config
                    )
                    reply = (response.text or "").strip()
                    cited = self._extract_cited_clauses(reply, relevant_clauses)
                    return ChatResponse(
                        reply=reply,
                        cited_clauses=cited,
                        is_grounded=True,
                        model_used=f"gemini/{model}"
                    )
                except Exception as e:
                    logger.warning(f"RAG Gemini ({model}) answer failed: {str(e)[:300]}")
                    llm_service.handle_error(model, str(e))

        # 2. Try Groq
        if settings.GROQ_API_KEY:
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": settings.GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.2
                }
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code >= 400:
                        raise RuntimeError(f"Groq {resp.status_code} (model '{settings.GROQ_MODEL}'): {resp.text[:300]}")
                    data = resp.json()
                    reply = data["choices"][0]["message"]["content"].strip()
                    cited = self._extract_cited_clauses(reply, relevant_clauses)
                    return ChatResponse(
                        reply=reply,
                        cited_clauses=cited,
                        is_grounded=True,
                        model_used=f"groq/{settings.GROQ_MODEL}"
                    )
            except Exception as e:
                logger.warning(f"RAG Groq answer failed: {e}")

        # 3. Grounded Heuristic Extractor (FR-23, FR-24 compliant)
        return self._heuristic_rag_answer(query, relevant_clauses)

    def _extract_cited_clauses(self, text: str, relevant: List[ClauseAnalysis]) -> List[str]:
        """Ambil nomor pasal yang benar-benar disebut di jawaban (mendukung '3', 'Poin 6.3', 'IV')."""
        found = []
        for c in relevant:
            num = re.escape(c.nomor_pasal)
            if re.fullmatch(r"[0-9]+|[IVXLCDMivxlcdm]+", c.nomor_pasal):
                pattern = rf"Pasal\s+{num}(?!\d|\.\d)"  # angka polos wajib diawali "Pasal"
            else:
                pattern = rf"(?<![\w.]){num}(?!\d|\.\d)"  # mis. "Poin 6.3" tidak cocok dengan "Poin 6.30"
            if re.search(pattern, text, re.IGNORECASE) and c.nomor_pasal not in found:
                found.append(c.nomor_pasal)
        if not found:
            for m in re.findall(r"Pasal\s+([0-9]+|[IVXLCDM]+)", text, re.IGNORECASE):
                if m not in found:
                    found.append(m)
        if not found and relevant:
            found.append(relevant[0].nomor_pasal)
        return found

    def _heuristic_rag_answer(self, query: str, relevant: List[ClauseAnalysis]) -> ChatResponse:
        """Fallback grounded response generator ensuring FR-23 & FR-24 compliance."""
        q_lower = query.lower()
        
        # Check if query matches relevant clause content
        matched_clause = None
        for c in relevant:
            c_text = (c.isi + " " + (c.judul or "")).lower()
            overlap = set(re.findall(r"\w{4,}", q_lower)).intersection(set(re.findall(r"\w{4,}", c_text)))
            if overlap:
                matched_clause = c
                break

        if not matched_clause:
            return ChatResponse(
                reply="Pertanyaan Anda tidak ditemukan atau tidak diatur dalam dokumen kontrak yang dilampirkan. Sistem CekKontrak tidak akan mengarang jawaban di luar isi kontrak.",
                cited_clauses=[],
                is_grounded=True,
                model_used="heuristic"
            )

        reply = (
            f"Berdasarkan **[Pasal {matched_clause.nomor_pasal}]** "
            f"{f'({matched_clause.judul}) ' if matched_clause.judul else ''}"
            f"yang tercantum dalam kontrak:\n\n"
            f"> \"{matched_clause.isi[:300]}...\"\n\n"
            f"**Penjelasan untuk Anda:** {matched_clause.penjelasan_awam or 'Perhatikan klausul tersebut saat bertransaksi.'}"
        )
        return ChatResponse(
            reply=reply,
            cited_clauses=[matched_clause.nomor_pasal],
            is_grounded=True,
            model_used="heuristic"
        )


rag_service = RAGService()
