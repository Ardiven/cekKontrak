from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum
from datetime import datetime


class RiskLevel(str, Enum):
    MERAH = "merah"
    KUNING = "kuning"
    HIJAU = "hijau"


class ContractType(str, Enum):
    SEWA_KOS = "sewa_kos"
    KERJA_MAGANG = "kerja_magang"
    PINJAMAN = "pinjaman"
    SNK_APLIKASI = "snk_aplikasi"
    LAINNYA = "lainnya"


class ClauseAnalysis(BaseModel):
    nomor_pasal: str = Field(description="Nomor pasal, misal '1', '2', 'IV'")
    judul: Optional[str] = Field(default=None, description="Judul pasal bila ada, misal 'UANG JAMINAN'")
    isi: str = Field(description="Teks asli dari pasal")
    level: RiskLevel = Field(description="Tingkat risiko: merah, kuning, atau hijau")
    alasan: str = Field(description="Alasan penilaian risiko secara obyektif")
    penjelasan_awam: str = Field(description="Penjelasan dalam bahasa santai dan mudah dipahami orang awam")
    saran_revisi: Optional[str] = Field(default=None, description="Usulan redaksional alternatif yang lebih adil dan seimbang")


class QuestionItem(BaseModel):
    id: str
    nomor_pasal: Optional[str] = None
    pertanyaan: str
    tujuan: str
    target_pihak: Optional[str] = "Pihak Kedua / Pengelola"


class DocumentMetadata(BaseModel):
    document_id: str
    doc_hash: str
    title: str
    contract_type: str
    overall_score: int
    risk_level: str
    created_at: str
    total_clauses: int


class DocumentAnalysisResponse(BaseModel):
    document_id: str
    doc_hash: str
    title: str
    contract_type: str
    overall_score: int
    risk_level: str
    summary: str
    counts: Dict[str, int]
    clauses: List[ClauseAnalysis]
    questions: List[QuestionItem]
    created_at: str
    from_cache: bool = False
    segmentation_fallback: bool = False
    disclaimer: str = (
        "Analisis ini bersifat edukatif dan BUKAN merupakan nasihat hukum resmi. "
        "Untuk kepastian hukum dalam hal-hal berisiko tinggi, silakan berkonsultasi dengan ahli hukum."
    )


class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., min_length=20, description="Isi teks kontrak yang ingin dianalisis")
    title: Optional[str] = Field(default="Kontrak Tanpa Judul", description="Judul atau label dokumen")
    contract_type: Optional[ContractType] = Field(default=ContractType.LAINNYA)


class ChatMessage(BaseModel):
    role: str
    content: str
    cited_clauses: Optional[List[str]] = []


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=2, description="Pertanyaan seputar kontrak")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Riwayat obrolan sebelumnya")


class ChatResponse(BaseModel):
    reply: str
    cited_clauses: List[str] = []
    is_grounded: bool = True
    disclaimer: str = "Jawaban didasarkan pada isi kontrak yang dianalisis dan bukan nasihat hukum."
