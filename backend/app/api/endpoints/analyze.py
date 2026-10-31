import uuid
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import ValidationError

from backend.app.core.config import settings
from backend.app.models.schemas import (
    DocumentAnalysisResponse, AnalyzeTextRequest, ClauseAnalysis,
    RiskLevel, ContractType, get_analysis_mode
)
from backend.app.services.pdf_parser import PdfParser, ScannedPdfError
from backend.app.services.clause_segmenter import ClauseSegmenter
from backend.app.services.llm_service import llm_service
from backend.app.services.highlighter import locate_highlights
from backend.app.services.risk_scorer import RiskScorer, QuestionGenerator
from backend.app.services.rag_service import rag_service
from backend.app.db.storage import storage_service

router = APIRouter()


# Naikkan angka ini setiap kali cara segmentasi/analisis berubah, agar hasil cache lama tidak dipakai lagi.
ANALYSIS_VERSION = 3


async def process_text_analysis(text: str, title: str, contract_type: str, doc_hash: str) -> DocumentAnalysisResponse:
    doc_hash = f"{doc_hash}-v{ANALYSIS_VERSION}"
    # 1. Check Cache first (FR-31)
    cached = storage_service.get_by_hash(doc_hash)
    llm_available = llm_service.gemini_ready or llm_service.groq_ready
    # Hasil cache yang (sebagian) masih heuristik dianalisis ulang bila LLM sudah tersedia,
    # supaya hasil kata-kunci tidak tersimpan selamanya.
    if cached and (cached.analysis_mode == "ai" or not llm_available):
        # Re-index into RAG service memory if needed
        await asyncio.to_thread(rag_service.index_document, cached.document_id, cached.clauses)
        return cached

    # 2. Segment document into clauses (FR-07, FR-08, FR-09)
    raw_clauses, is_fallback = ClauseSegmenter.segment(text)
    if not raw_clauses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak dapat mengidentifikasi pasal atau paragraf dalam teks kontrak."
        )

    # 3. Analisis pasal secara batch: 1 request LLM untuk banyak pasal (FR-10, FR-11).
    #    Kuota gratis Gemini hanya ~5 request/menit, jadi 1 request per pasal pasti kena limit.
    results = await llm_service.analyze_clauses([(rc.number, rc.title, rc.content) for rc in raw_clauses])
    analyzed_clauses = [
        ClauseAnalysis(
            nomor_pasal=raw.number,
            judul=raw.title,
            isi=raw.content,
            level=RiskLevel(res.get("level", "kuning")),
            alasan=res.get("alasan", "Klausul dianalisis"),
            penjelasan_awam=res.get("penjelasan_awam", ""),
            saran_revisi=res.get("saran_revisi"),
            sorotan=locate_highlights(raw.content, res.get("sorotan"), res.get("level", "kuning")),
            model_used=res.get("model_used")
        )
        for raw, res in zip(raw_clauses, results)
    ]

    # 4. Calculate Risk Score & Summary (FR-12)
    overall_score, risk_level, summary, counts = RiskScorer.calculate_score(analyzed_clauses)

    # 5. Generate Pre-signing Questions (FR-16)
    questions = QuestionGenerator.generate_questions(analyzed_clauses)

    doc_id = str(uuid.uuid4())
    from datetime import timezone
    now_iso = datetime.now(timezone.utc).isoformat()

    response = DocumentAnalysisResponse(
        document_id=doc_id,
        doc_hash=doc_hash,
        title=title,
        contract_type=contract_type,
        overall_score=overall_score,
        risk_level=risk_level,
        summary=summary,
        counts=counts,
        clauses=analyzed_clauses,
        questions=questions,
        created_at=now_iso,
        from_cache=False,
        segmentation_fallback=is_fallback,
        analysis_mode=get_analysis_mode(analyzed_clauses)
    )

    # 6. Index into RAG and save to persistent storage (FR-20, FR-29, FR-31)
    await asyncio.to_thread(rag_service.index_document, doc_id, analyzed_clauses)
    storage_service.save_document(response)

    return response


@router.post("/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    contract_type: Optional[str] = Form("lainnya")
):
    """
    FR-01, FR-02: Receives PDF file or text, checks cache, segments clauses,
    performs structured LLM risk analysis, calculates overall score.
    """
    if file:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File yang diunggah harus berformat PDF (.pdf)."
            )
        try:
            content_bytes = await file.read()
            if len(content_bytes) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ukuran file melebihi batas {settings.MAX_FILE_SIZE_MB}MB."
                )

            extracted_text, doc_hash, _ = PdfParser.extract_text_from_bytes(
                content_bytes, max_pages=settings.MAX_PAGES
            )
            doc_title = title or file.filename.rsplit(".", 1)[0].replace("_", " ").title()
            return await process_text_analysis(extracted_text, doc_title, contract_type, doc_hash)
        except ScannedPdfError as spe:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(spe))
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    
    elif text:
        cleaned_text = text.strip()
        if len(cleaned_text) < 20:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teks kontrak terlalu pendek (minimal 20 karakter)."
            )
        doc_hash = PdfParser.calculate_hash(cleaned_text)
        doc_title = title or "Kontrak Input Teks"
        return await process_text_analysis(cleaned_text, doc_title, contract_type, doc_hash)

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Silakan unggah file PDF atau masukkan teks kontrak."
        )


@router.post("/analyze/json", response_model=DocumentAnalysisResponse)
async def analyze_document_json(payload: AnalyzeTextRequest):
    """Convenience JSON endpoint for text input."""
    doc_hash = PdfParser.calculate_hash(payload.text)
    return await process_text_analysis(
        payload.text,
        payload.title or "Kontrak Input Teks",
        payload.contract_type.value if payload.contract_type else "lainnya",
        doc_hash
    )
