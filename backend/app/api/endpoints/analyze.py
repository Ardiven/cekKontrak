import uuid
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import ValidationError

from backend.app.core.config import settings
from backend.app.models.schemas import (
    DocumentAnalysisResponse, AnalyzeTextRequest, ClauseAnalysis,
    RiskLevel, ContractType
)
from backend.app.services.pdf_parser import PdfParser, ScannedPdfError
from backend.app.services.clause_segmenter import ClauseSegmenter
from backend.app.services.llm_service import llm_service
from backend.app.services.risk_scorer import RiskScorer, QuestionGenerator
from backend.app.services.rag_service import rag_service
from backend.app.db.storage import storage_service

router = APIRouter()


async def process_text_analysis(text: str, title: str, contract_type: str, doc_hash: str) -> DocumentAnalysisResponse:
    # 1. Check Cache first (FR-31)
    cached = storage_service.get_by_hash(doc_hash)
    if cached:
        # Re-index into RAG service memory if needed
        rag_service.index_document(cached.document_id, cached.clauses)
        return cached

    # 2. Segment document into clauses (FR-07, FR-08, FR-09)
    raw_clauses, is_fallback = ClauseSegmenter.segment(text)
    if not raw_clauses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak dapat mengidentifikasi pasal atau paragraf dalam teks kontrak."
        )

    # 3. Analyze each clause concurrently (FR-10, FR-11)
    async def analyze_single(raw):
        res = await llm_service.analyze_clause(raw.number, raw.title, raw.content)
        return ClauseAnalysis(
            nomor_pasal=res.get("nomor_pasal", raw.number),
            judul=raw.title,
            isi=raw.content,
            level=RiskLevel(res.get("level", "hijau")),
            alasan=res.get("alasan", "Klausul dianalisis"),
            penjelasan_awam=res.get("penjelasan_awam", ""),
            saran_revisi=res.get("saran_revisi")
        )

    # Process in batches to balance speed and rate limits
    analyzed_clauses = await asyncio.gather(*(analyze_single(rc) for rc in raw_clauses))

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
        segmentation_fallback=is_fallback
    )

    # 6. Index into RAG and save to persistent storage (FR-20, FR-29, FR-31)
    rag_service.index_document(doc_id, analyzed_clauses)
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
