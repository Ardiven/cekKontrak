import re
import math
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
    def __init__(self):
        self.doc_clauses: Dict[str, List[ClauseAnalysis]] = {}
        self.doc_embeddings: Dict[str, List[np.ndarray]] = {}
        self.client: Optional[genai.Client] = None
        if settings.GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                logger.error(f"Failed to configure Gemini client for RAG: {e}")

    def index_document(self, doc_id: str, clauses: List[ClauseAnalysis]):
        """Index clauses of a document for semantic retrieval."""
        self.doc_clauses[doc_id] = clauses
        embeddings = []
        for c in clauses:
            emb = self._get_embedding(f"Pasal {c.nomor_pasal} {c.judul or ''} {c.isi}")
            embeddings.append(emb)
        self.doc_embeddings[doc_id] = embeddings

    def _get_embedding(self, text: str) -> np.ndarray:
        """
        Embeds text using Gemini embedding if available, otherwise builds a normalized token vector.
        """
        if self.client:
            try:
                result = self.client.models.embed_content(
                    model="text-embedding-004",
                    contents=text,
                )
                if result.embeddings and len(result.embeddings) > 0:
                    vec = np.array(result.embeddings[0].values, dtype=np.float32)
                    norm = np.linalg.norm(vec)
                    return vec / (norm + 1e-9)
            except Exception as e:
                logger.warning(f"Gemini embedding failed, falling back to local vectorizer: {e}")

        # Local frequency-based dense hashing vectorizer for zero-dependency offline resilience
        words = re.findall(r"\w+", text.lower())
        vec = np.zeros(256, dtype=np.float32)
        for w in words:
            h = hash(w) % 256
            vec[h] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def _get_query_embedding(self, query: str) -> np.ndarray:
        if self.client:
            try:
                result = self.client.models.embed_content(
                    model="text-embedding-004",
                    contents=query,
                )
                if result.embeddings and len(result.embeddings) > 0:
                    vec = np.array(result.embeddings[0].values, dtype=np.float32)
                    norm = np.linalg.norm(vec)
                    return vec / (norm + 1e-9)
            except Exception as e:
                logger.warning(f"Gemini query embedding failed: {e}")

        words = re.findall(r"\w+", query.lower())
        vec = np.zeros(256, dtype=np.float32)
        for w in words:
            h = hash(w) % 256
            vec[h] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def retrieve_relevant_clauses(self, doc_id: str, query: str, top_k: int = 3) -> List[ClauseAnalysis]:
        """Finds top-k most relevant clauses for the query."""
        clauses = self.doc_clauses.get(doc_id, [])
        embeddings = self.doc_embeddings.get(doc_id, [])
        if not clauses or not embeddings:
            return []

        q_vec = self._get_query_embedding(query)
        scores = []
        for idx, emb in enumerate(embeddings):
            # Check length alignment
            if len(emb) == len(q_vec):
                sim = float(np.dot(emb, q_vec))
            else:
                sim = 0.0
            scores.append((sim, idx))

        scores.sort(key=lambda x: x[0], reverse=True)
        top_indices = [idx for _, idx in scores[:top_k]]
        return [clauses[i] for i in top_indices]

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

        # 1. Try Gemini
        if self.client:
            try:
                config = types.GenerateContentConfig(
                    system_instruction=system_prompt
                )
                response = await self.client.aio.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=user_prompt,
                    config=config
                )
                reply = (response.text or "").strip()
                cited = self._extract_cited_clauses(reply, relevant_clauses)
                return ChatResponse(
                    reply=reply,
                    cited_clauses=cited,
                    is_grounded=True,
                    model_used=f"gemini/{settings.GEMINI_MODEL}"
                )
            except Exception as e:
                logger.warning(f"RAG Gemini answer failed: {e}")

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
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    resp.raise_for_status()
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
        found = set()
        # Find [Pasal X] or Pasal X
        matches = re.findall(r"Pasal\s+([0-9]+|[IVXLCDM]+)", text, re.IGNORECASE)
        for m in matches:
            found.add(m)
        if not found and relevant:
            found.add(relevant[0].nomor_pasal)
        return sorted(list(found))

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
