import fitz  # PyMuPDF
import hashlib
import re
from typing import Tuple


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
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            raise ValueError(f"Gagal membaca file PDF: {str(e)}")

        page_count = len(doc)
        if page_count > max_pages:
            raise ValueError(
                f"Jumlah halaman ({page_count}) melebihi batas maksimal {max_pages} halaman."
            )

        extracted_pages = []
        total_chars = 0

        for page_num in range(page_count):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            extracted_pages.append(text)
            total_chars += len(text.strip())

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
