from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.app.models.schemas import DocumentAnalysisResponse, DocumentMetadata, QuestionItem
from backend.app.db.storage import storage_service

router = APIRouter()


@router.get("/documents", response_model=List[DocumentMetadata])
def list_user_documents():
    """FR-29: Get history of analyzed documents."""
    return storage_service.list_documents()


@router.get("/documents/{doc_id}", response_model=DocumentAnalysisResponse)
def get_document_details(doc_id: str):
    """FR-29: Get detailed analysis of a specific document."""
    doc = storage_service.get_by_id(doc_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dokumen dengan ID {doc_id} tidak ditemukan."
        )
    return doc


@router.get("/documents/{doc_id}/questions", response_model=List[QuestionItem])
def get_document_questions(doc_id: str):
    """FR-16: Get list of questions before signing."""
    doc = storage_service.get_by_id(doc_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dokumen dengan ID {doc_id} tidak ditemukan."
        )
    return doc.questions


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    """FR-29: Delete document from storage."""
    deleted = storage_service.delete_document(doc_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dokumen dengan ID {doc_id} tidak ditemukan."
        )
    return {"message": "Dokumen berhasil dihapus."}
