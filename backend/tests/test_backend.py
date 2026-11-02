import asyncio
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.clause_segmenter import ClauseSegmenter
from backend.app.services.pdf_parser import PdfParser
from backend.app.services.risk_scorer import RiskScorer, QuestionGenerator
from backend.app.services.llm_service import llm_service
from backend.app.services.rag_service import rag_service
from backend.app.services.sample_contracts import SAMPLE_CONTRACTS
from backend.app.models.schemas import ClauseAnalysis, RiskLevel

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "CekKontrak" in data["app"]


def test_clause_segmenter_standard():
    sample_text = SAMPLE_CONTRACTS["sewa_kos"]["text"]
    clauses, is_fallback = ClauseSegmenter.segment(sample_text)
    
    assert not is_fallback
    assert len(clauses) >= 5
    assert clauses[0].number == "1"
    assert clauses[1].number == "2"
    assert clauses[0].title is not None
    assert "IDENTITAS" in clauses[0].title.upper()


def test_clause_segmenter_fallback():
    bullet_text = """
    1. Pihak pertama menyewakan ruangan kantor.
    2. Pihak kedua wajib membayar sewa tiap tanggal 1.
    3. Denda keterlambatan sebesar 5 persen per minggu.
    """
    clauses, is_fallback = ClauseSegmenter.segment(bullet_text)
    assert is_fallback
    assert len(clauses) >= 2


def test_pdf_parser_hash():
    text1 = "Perjanjian sewa menyewa pasal 1."
    text2 = "Perjanjian   sewa  menyewa  pasal 1. "
    hash1 = PdfParser.calculate_hash(text1)
    hash2 = PdfParser.calculate_hash(text2)
    assert hash1 == hash2


def test_risk_scorer():
    clauses = [
        ClauseAnalysis(
            nomor_pasal="1",
            judul="Deposit",
            isi="Deposit hangus jika keluar awal",
            level=RiskLevel.MERAH,
            alasan="Uang jaminan hangus sepihak",
            penjelasan_awam="Uang Anda hilang",
            saran_revisi="Deposit dikembalikan dipotong biaya nyata"
        ),
        ClauseAnalysis(
            nomor_pasal="2",
            judul="Perbaikan",
            isi="Penyewa tanggung segala kerusakan",
            level=RiskLevel.KUNING,
            alasan="Tanggung jawab ambigu",
            penjelasan_awam="Bisa disuruh ganti rugi pemakaian wajar",
            saran_revisi="Kerusakan wajar ditanggung pemilik"
        ),
        ClauseAnalysis(
            nomor_pasal="3",
            judul="Ketentuan Umum",
            isi="Kamar kos untuk 1 orang",
            level=RiskLevel.HIJAU,
            alasan="Aturan wajar",
            penjelasan_awam="Wajar",
            saran_revisi=None
        )
    ]
    score, risk_label, summary, counts = RiskScorer.calculate_score(clauses)
    assert score >= 50
    assert counts["merah"] == 1
    assert counts["kuning"] == 1
    assert counts["hijau"] == 1

    questions = QuestionGenerator.generate_questions(clauses)
    assert len(questions) >= 1


def test_llm_service_heuristic():
    async def run():
        clause_content = "Apabila penyewa keluar sebelum waktu, uang deposit hangus tanpa syarat apapun."
        res = await llm_service.analyze_clause("3", "UANG DEPOSIT", clause_content)
        assert res["level"] == "merah"
        assert "deposit" in res["alasan"].lower() or "klausul" in res["alasan"].lower()
    asyncio.run(run())


def test_rag_service():
    async def run():
        doc_id = "test_doc_123"
        clauses = [
            ClauseAnalysis(
                nomor_pasal="5",
                judul="Denda Keterlambatan",
                isi="Keterlambatan pembayaran dikenakan denda sebesar Rp 50.000 per hari.",
                level=RiskLevel.KUNING,
                alasan="Denda harian",
                penjelasan_awam="Ada denda 50rb per hari",
                saran_revisi="Masa tenggang 3 hari"
            )
        ]
        rag_service.index_document(doc_id, clauses)
        chat_resp = await rag_service.answer_question(doc_id, "Berapa denda keterlambatan per hari?")
        assert "5" in chat_resp.cited_clauses
        assert chat_resp.is_grounded
    asyncio.run(run())


def test_api_analyze_endpoint():
    sample_text = SAMPLE_CONTRACTS["sewa_kos"]["text"]
    response = client.post(
        "/api/analyze/json",
        json={"text": sample_text, "title": "Uji Coba Kontrak Kos", "contract_type": "sewa_kos"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "document_id" in data
    assert data["overall_score"] > 0
    assert len(data["clauses"]) >= 5
    assert len(data["questions"]) >= 1

    # Test Caching (FR-31)
    response_cached = client.post(
        "/api/analyze/json",
        json={"text": sample_text, "title": "Uji Coba Kontrak Kos", "contract_type": "sewa_kos"}
    )
    assert response_cached.status_code == 200
    cached_data = response_cached.json()
    assert cached_data["from_cache"] is True
    assert cached_data["document_id"] == data["document_id"]


def test_heuristic_unknown_clause_is_not_green():
    """Pasal yang tidak dikenali heuristik harus kuning (cek manual), bukan dianggap aman."""
    async def run():
        res = await llm_service.analyze_clause("9", "LAIN-LAIN", "Para pihak sepakat menyelesaikan perselisihan di Pengadilan Negeri Surabaya.")
        if res["model_used"] == "heuristic":
            assert res["level"] == "kuning"
    asyncio.run(run())


def test_analysis_mode():
    from backend.app.models.schemas import get_analysis_mode

    def mk(model):
        return ClauseAnalysis(nomor_pasal="1", isi="x", level=RiskLevel.HIJAU, alasan="a",
                              penjelasan_awam="b", model_used=model)

    assert get_analysis_mode([mk("gemini/gemini-3.8-flash"), mk("groq/llama")]) == "ai"
    assert get_analysis_mode([mk("heuristic"), mk("heuristic")]) == "heuristik"
    assert get_analysis_mode([mk("gemini/gemini-3.8-flash"), mk("heuristic")]) == "sebagian_heuristik"
    assert get_analysis_mode([mk(None)]) == "sebagian_heuristik"


def test_local_embedding_is_stable_and_retrieves():
    """Vektor cadangan offline harus sama antar restart (bukan hash() acak) dan tetap bisa menemukan pasal."""
    import zlib
    vec = rag_service._local_embed("denda keterlambatan")
    expected_idx = zlib.crc32("denda".encode()) % rag_service.LOCAL_DIM
    assert vec[expected_idx] > 0

    doc_id = "test_doc_retrieval"
    clauses = [
        ClauseAnalysis(nomor_pasal="1", isi="Pihak pertama menyewakan satu kamar kos.", level=RiskLevel.HIJAU,
                       alasan="a", penjelasan_awam="b"),
        ClauseAnalysis(nomor_pasal="2", isi="Uang deposit dikembalikan setelah masa sewa berakhir.", level=RiskLevel.HIJAU,
                       alasan="a", penjelasan_awam="b"),
        ClauseAnalysis(nomor_pasal="3", isi="Keterlambatan pembayaran dikenakan denda harian.", level=RiskLevel.KUNING,
                       alasan="a", penjelasan_awam="b"),
    ]
    rag_service.index_document(doc_id, clauses)
    top = rag_service.retrieve_relevant_clauses(doc_id, "berapa denda kalau pembayaran terlambat", top_k=1)
    assert top[0].nomor_pasal == "3"


def test_pdf_parser_pypdf_fallback():
    """Upload PDF tetap jalan walau PyMuPDF diblokir (pakai pypdf)."""
    from reportlab.pdfgen import canvas
    import io
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.drawString(72, 750, "Pasal 1 Para pihak sepakat menyewa satu kamar kos selama dua belas bulan penuh.")
    c.save()
    pages = PdfParser._pages_pypdf(buf.getvalue(), max_pages=25)
    assert "kamar kos" in "".join(pages)


def test_batch_analysis_uses_one_request_and_falls_back(monkeypatch):
    """Semua pasal dikirim dalam 1 request; bila model utama 503, pindah ke model cadangan."""
    import json as _json
    from backend.app.services.llm_service import LLMService
    from backend.app.core.config import settings

    svc = LLMService()
    svc.gemini_ready, svc.groq_ready = True, False
    monkeypatch.setattr(settings, "GEMINI_MODEL", "model-utama")
    monkeypatch.setattr(settings, "GEMINI_FALLBACK_MODEL", "model-cadangan")
    calls = []

    async def fake_gemini(prompt, model=None, system_prompt=None):
        calls.append(model)
        if model == "model-utama":
            raise RuntimeError("400 INVALID_ARGUMENT")  # langsung pindah model
        # hanya mengembalikan pasal id=0, id=1 sengaja hilang
        return _json.dumps({"hasil": [{"id": 0, "level": "merah", "alasan": "a", "penjelasan_awam": "b", "saran_revisi": "c"}]})

    monkeypatch.setattr(svc, "_call_gemini", fake_gemini)
    clauses = [("1", "DENDA", "Denda keluar awal sebesar seluruh sisa sewa."), ("2", None, "Para pihak tunduk pada hukum Indonesia.")]
    res = asyncio.run(svc.analyze_clauses(clauses))

    assert calls == ["model-utama", "model-cadangan"]  # 1 request per model, bukan per pasal
    assert res[0]["level"] == "merah" and res[0]["model_used"] == "gemini/model-cadangan"
    assert res[1]["model_used"] == "heuristic"  # pasal yang tidak dijawab LLM jatuh ke heuristik


def test_retry_wait_parsing():
    from backend.app.services.llm_service import LLMService
    assert LLMService._retry_wait("Please retry in 5.2s") == 6.2
    assert LLMService._retry_wait("Please retry in 45.4s") is None  # terlalu lama, pindah model
    assert LLMService._retry_wait("503 UNAVAILABLE") is None  # sibuk -> langsung pindah model


def test_segmenter_drops_toc_splits_long_and_cleans_footer():
    """Daftar isi tidak jadi pasal, pasal sangat panjang dipecah per subjudul, header/footer halaman dibuang."""
    header = "9/8/26, 7:17 PM Terms and Conditions of Use - Example"
    def para(topic):
        return (f"You agree that the provider may change the {topic} at any time and will notify you "
                "by email at least thirty days before any material change takes effect. ") * 6
    pages = [
        "1. Introduction\n2. Problems and Disputes\n" + header + "\nhttps://example.com/terms 1/3",
        "1. Introduction\nPlease read these Terms carefully. They govern your use of the service.\n" + header + "\nhttps://example.com/terms 2/3",
        "2. Problems and Disputes\n" + para("service") + "\nWarranty disclaimers\n" + para("warranty") + "\nLimitation of liability\n" + para("liability")
        + "\nCOMPANY\nAbout\nJobs\nFor the Record\nCOMMUNITIES\nFor Artists\nDevelopers\nAdvertising\nInvestors\n"
        + header + "\nhttps://example.com/terms 3/3",
    ]
    ClauseSegmenter.SPLIT_THRESHOLD, old = 1500, ClauseSegmenter.SPLIT_THRESHOLD
    try:
        clauses, _ = ClauseSegmenter.segment("\n\n".join(pages))
    finally:
        ClauseSegmenter.SPLIT_THRESHOLD = old
    numbers = [c.number for c in clauses]
    assert len(numbers) == len(set(numbers))                       # nomor unik
    assert all(len(c.content) > 80 for c in clauses)               # tidak ada entri daftar isi
    assert "Poin 2.2" in numbers and any(c.title == "Warranty disclaimers" for c in clauses)
    full = "\n".join(c.content for c in clauses)
    assert "7:17 PM" not in full and "COMMUNITIES" not in full     # header & menu situs dibuang


def test_citation_extraction_for_sub_clauses():
    def mk(n):
        return ClauseAnalysis(nomor_pasal=n, isi="x", level=RiskLevel.HIJAU, alasan="a", penjelasan_awam="b")
    rel = [mk("Poin 6.1"), mk("Poin 6.10"), mk("3")]
    cited = rag_service._extract_cited_clauses("Menurut [Poin 6.10] dan Pasal 3, biaya Rp 3 juta.", rel)
    assert cited == ["Poin 6.10", "3"]


def test_highlight_locates_quotes_across_line_breaks():
    from backend.app.services.highlighter import locate_highlights
    content = ("You agree to indemnify and hold Spotify harmless from and against all damages, losses, and\n"
               "expenses of any kind (including reasonable attorneys' fees and costs) arising out of THIRD-\n"
               "PARTY APPLICATIONS.")
    items = [
        {"kutipan": "indemnify and hold Spotify harmless from and against all damages, losses, and expenses of any kind",
         "keterangan": "Pengguna menanggung kerugian Spotify"},
        {"kutipan": "arising out of third-party applications", "keterangan": "beda huruf besar & terpotong baris"},
        {"kutipan": "Spotify will pay you one million dollars", "keterangan": "tidak ada di teks -> dibuang"},
    ]
    spans = locate_highlights(content, items, "merah")
    assert len(spans) == 2
    assert content[spans[0]["start"]:spans[0]["end"]].startswith("indemnify and hold Spotify harmless")
    assert content[spans[0]["start"]:spans[0]["end"]].endswith("expenses of any kind")
    assert content[spans[1]["start"]:spans[1]["end"]] == "arising out of THIRD-\nPARTY APPLICATIONS"
    assert locate_highlights(content, items, "hijau") == []   # pasal aman tidak disorot


def test_analyze_returns_highlights_offline():
    """Tanpa API key, pasal merah dari heuristik tetap mendapat sorotan kalimat yang memuat kata kuncinya."""
    text = ("PASAL 1 - SEWA\nPenyewa menyewa satu kamar untuk dua belas bulan.\n"
            "PASAL 2 - DEPOSIT\nDeposit sebesar Rp 1.000.000 hangus tanpa syarat apabila penyewa keluar lebih awal.")
    resp = client.post("/api/analyze/json", json={"text": text, "title": "Uji sorotan", "contract_type": "sewa_kos"})
    assert resp.status_code == 200
    clause2 = [c for c in resp.json()["clauses"] if c["nomor_pasal"] == "2"][0]
    if clause2["model_used"] == "heuristic":
        assert clause2["level"] == "merah"
        h = clause2["sorotan"][0]
        assert clause2["isi"][h["start"]:h["end"]] == h["kutipan"]
        assert "hangus" in h["kutipan"]


def test_busy_model_is_skipped_and_batches_run_in_parallel(monkeypatch):
    """Model yang 503 langsung dilewati (tanpa retry) dan tidak dicoba lagi oleh batch berikutnya;
    batch-batch dikirim bersamaan."""
    import json as _json
    from backend.app.services.llm_service import LLMService
    from backend.app.core.config import settings

    svc = LLMService()
    svc.gemini_ready, svc.groq_ready = True, False
    monkeypatch.setattr(settings, "GEMINI_MODEL", "sibuk")
    monkeypatch.setattr(settings, "GEMINI_FALLBACK_MODEL", "cadangan")
    monkeypatch.setattr(settings, "LLM_BATCH_SIZE", 2)
    calls, active, peak = [], [0], [0]

    async def fake_gemini(prompt, model=None, system_prompt=None):
        calls.append(model)
        active[0] += 1
        peak[0] = max(peak[0], active[0])
        await asyncio.sleep(0.05)
        active[0] -= 1
        if model == "sibuk":
            raise RuntimeError("503 UNAVAILABLE. high demand")
        ids = [int(x) for x in __import__("re").findall(r"### id=(\d+)", prompt)]
        return _json.dumps({"hasil": [{"id": i, "level": "kuning", "alasan": "a", "penjelasan_awam": "b"} for i in ids]})

    monkeypatch.setattr(svc, "_call_gemini", fake_gemini)
    clauses = [(str(n), None, f"Isi pasal nomor {n} yang cukup panjang.") for n in range(1, 7)]  # 3 batch
    res = asyncio.run(svc.analyze_clauses(clauses))

    assert all(r["model_used"] == "gemini/cadangan" for r in res)
    assert calls.count("sibuk") <= 3          # tiap batch paling banyak 1x, tanpa retry
    assert peak[0] >= 2                       # batch berjalan bersamaan
    assert "sibuk" not in svc.gemini_models() # model sibuk sedang dilewati
