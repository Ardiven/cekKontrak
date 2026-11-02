import sqlite3
import json
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from backend.app.core.config import settings
from backend.app.models.schemas import DocumentAnalysisResponse, DocumentMetadata, ClauseAnalysis, get_analysis_mode


class StorageService:
    def __init__(self, db_path: str = settings.DATABASE_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    doc_hash TEXT UNIQUE,
                    title TEXT,
                    contract_type TEXT,
                    overall_score INTEGER,
                    risk_level TEXT,
                    summary TEXT,
                    counts_json TEXT,
                    clauses_json TEXT,
                    questions_json TEXT,
                    created_at TEXT,
                    segmentation_fallback INTEGER DEFAULT 0
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_doc_hash ON documents (doc_hash)")
            conn.commit()

    def get_by_hash(self, doc_hash: str) -> Optional[DocumentAnalysisResponse]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM documents WHERE doc_hash = ?", (doc_hash,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_model(row, from_cache=True)

    def get_by_id(self, doc_id: str) -> Optional[DocumentAnalysisResponse]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_model(row, from_cache=False)

    def save_document(self, doc: DocumentAnalysisResponse):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO documents (
                    id, doc_hash, title, contract_type, overall_score,
                    risk_level, summary, counts_json, clauses_json,
                    questions_json, created_at, segmentation_fallback
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc.document_id,
                doc.doc_hash,
                doc.title,
                doc.contract_type,
                doc.overall_score,
                doc.risk_level,
                doc.summary,
                json.dumps(doc.counts),
                json.dumps([c.model_dump() for c in doc.clauses]),
                json.dumps([q.model_dump() for q in doc.questions]),
                doc.created_at,
                1 if doc.segmentation_fallback else 0
            ))
            conn.commit()

    def list_documents(self) -> List[DocumentMetadata]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, doc_hash, title, contract_type, overall_score, risk_level, created_at, clauses_json
                FROM documents ORDER BY created_at DESC
            """)
            rows = cursor.fetchall()
            results = []
            for r in rows:
                try:
                    clauses = json.loads(r["clauses_json"])
                    total_clauses = len(clauses)
                except Exception:
                    total_clauses = 0
                results.append(DocumentMetadata(
                    document_id=r["id"],
                    doc_hash=r["doc_hash"],
                    title=r["title"],
                    contract_type=r["contract_type"],
                    overall_score=r["overall_score"],
                    risk_level=r["risk_level"],
                    created_at=r["created_at"],
                    total_clauses=total_clauses
                ))
            return results

    def delete_document(self, doc_id: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
            conn.commit()
            return cursor.rowcount > 0

    def _row_to_model(self, row: sqlite3.Row, from_cache: bool) -> DocumentAnalysisResponse:
        counts = json.loads(row["counts_json"]) if row["counts_json"] else {}
        clauses = json.loads(row["clauses_json"]) if row["clauses_json"] else []
        questions = json.loads(row["questions_json"]) if row["questions_json"] else []
        clause_models = [ClauseAnalysis(**c) for c in clauses]

        return DocumentAnalysisResponse(
            document_id=row["id"],
            doc_hash=row["doc_hash"],
            title=row["title"],
            contract_type=row["contract_type"],
            overall_score=row["overall_score"],
            risk_level=row["risk_level"],
            summary=row["summary"],
            counts=counts,
            clauses=clause_models,
            questions=questions,
            created_at=row["created_at"],
            from_cache=from_cache,
            segmentation_fallback=bool(row["segmentation_fallback"]),
            analysis_mode=get_analysis_mode(clause_models)
        )


storage_service = StorageService()
