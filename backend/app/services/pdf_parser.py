import hashlib
import io
import logging
import re
from typing import List, Tuple

logger = logging.getLogger(__name__)

# PyMuPDF dipakai bila tersedia. Di sebagian laptop Windows (mis. Smart App Control aktif)
# file native PyMuPDF bisa diblokir sehingga muncul "No module named 'mupdf'".
# Karena itu ada cadangan pypdf (murni Python) agar upload PDF tetap jalan.
try:
    import pymupdf as fitz  # PyMuPDF (replaces deprecated `import fitz`)
except Exception as _e:  # ImportError / DLL diblokir
    fitz = None
    logger.warning(f"PyMuPDF tidak dapat dimuat ({_e}); memakai pypdf sebagai pengganti.")


class ScannedPdfError(Exception):
    """Exception raised when PDF contains no extractable text (scanned PDF)."""
    pass


class PdfParser:
    @staticmethod
    def calculate_hash(text: str) -> str:
        """Calculate SHA256 hash of normalized text for caching."""
        normalized = re.sub(r"\s+", " ", text).strip()
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    @staticmethod
    def extract_text_from_bytes(file_bytes: bytes, max_pages: int = 25) -> Tuple[str, str, int]:
        """
        Extract text from PDF bytes.
        Returns: (full_text, doc_hash, page_count)
        Raises:
            ScannedPdfError: If PDF has no extractable text
            ValueError: If PDF exceeds max_pages
        """
        if fitz is not None:
            extracted_pages = PdfParser._pages_pymupdf(file_bytes, max_pages)
        else:
            extracted_pages = PdfParser._pages_pypdf(file_bytes, max_pages)
        page_count = len(extracted_pages)
        total_chars = sum(len(t.strip()) for t in extracted_pages)

        full_text = "\n\n".join(extracted_pages).strip()

        # If less than 60 characters across entire document, it's likely scanned/image-only
        if total_chars < 60:
            raise ScannedPdfError(
                "Dokumen PDF ini tidak mengandung teks digital yang dapat diekstrak "
                "(kemungkinan merupakan hasil scan atau foto dokumen). "
                "Sistem CekKontrak saat ini hanya mendukung dokumen PDF berbasis teks."
            )

        doc_hash = PdfParser.calculate_hash(full_text)
        return full_text, doc_hash, page_count

    @staticmethod
    def _check_pages(page_count: int, max_pages: int):
        if page_count > max_pages:
            raise ValueError(
                f"Jumlah halaman ({page_count}) melebihi batas maksimal {max_pages} halaman."
            )

    @staticmethod
    def _pages_pymupdf(file_bytes: bytes, max_pages: int) -> List[str]:
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            raise ValueError(f"Gagal membaca file PDF: {str(e)}")
        PdfParser._check_pages(len(doc), max_pages)
        return [doc.load_page(i).get_text("text") for i in range(len(doc))]

    @staticmethod
    def _pages_pypdf(file_bytes: bytes, max_pages: int) -> List[str]:
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            pages = reader.pages
            page_count = len(pages)
        except Exception as e:
            raise ValueError(f"Gagal membaca file PDF: {str(e)}")
        PdfParser._check_pages(page_count, max_pages)
        return [(page.extract_text() or "") for page in pages]
