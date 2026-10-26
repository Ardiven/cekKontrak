import urllib.parse
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from backend.app.services.pdf_exporter import PdfExporter
from backend.app.db.storage import storage_service

router = APIRouter()


@router.get("/documents/{doc_id}/export")
def export_document_pdf(doc_id: str):
    """
    FR-19: Export pre-signing questions, risk analysis, and fair revision drafts to PDF.
    """
    doc = storage_service.get_by_id(doc_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dokumen dengan ID {doc_id} tidak ditemukan."
        )

    pdf_stream = PdfExporter.generate_pdf(doc)
    safe_title = urllib.parse.quote(doc.title.replace(" ", "_")[:30])
    filename = f"CekKontrak_Laporan_{safe_title}.pdf"

    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{filename}"
        }
    )
