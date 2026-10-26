from fastapi import APIRouter, HTTPException, status
from backend.app.models.schemas import ChatRequest, ChatResponse
from backend.app.services.rag_service import rag_service
from backend.app.db.storage import storage_service

router = APIRouter()


@router.post("/documents/{doc_id}/chat", response_model=ChatResponse)
async def chat_with_document(doc_id: str, payload: ChatRequest):
    """
    FR-20 to FR-26: RAG Chatbot answering questions strictly based on the document's clauses.
    Returns reply, cited clause numbers, and grounding status.
    """
    # Verify document exists in storage
    doc = storage_service.get_by_id(doc_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dokumen dengan ID {doc_id} tidak ditemukan."
        )

    # Ensure document is indexed in RAG service
    rag_service.index_document(doc_id, doc.clauses)

    response = await rag_service.answer_question(
        doc_id=doc_id,
        query=payload.message,
        clauses_input=doc.clauses
    )

    return response
