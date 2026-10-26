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
