# ============================================================
# HealthTriage AI - PDF Service
# Safe extraction and validation of medical PDF documents
# ============================================================

import io
from typing import Tuple, Optional
from pypdf import PdfReader

MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024  # 15MB


def validate_pdf_bytes(data: bytes) -> Tuple[bool, Optional[str]]:
    """
    Validate that bytes represent a readable PDF file within size limits.
    Returns (is_valid, error_message).
    """
    if not data:
        return False, "PDF payload is empty."

    if len(data) > MAX_PDF_SIZE_BYTES:
        return False, f"PDF file size exceeds maximum limit of {MAX_PDF_SIZE_BYTES // (1024 * 1024)}MB."

    try:
        reader = PdfReader(io.BytesIO(data))
        if len(reader.pages) == 0:
            return False, "PDF file contains no pages."
        return True, None
    except Exception:
        return False, "Invalid or corrupted PDF document."


def extract_text_from_pdf(data: bytes, max_pages: int = 10) -> str:
    """
    Extract readable text content from a PDF document up to max_pages.
    """
    try:
        reader = PdfReader(io.BytesIO(data))
        pages_text = []
        for i, page in enumerate(reader.pages[:max_pages]):
            text = page.extract_text() or ""
            if text.strip():
                pages_text.append(f"--- Page {i + 1} ---\n{text.strip()}")
        return "\n\n".join(pages_text)
    except Exception as e:
        print("Notice: Error extracting text from PDF:", e)
        return ""
