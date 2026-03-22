import io
from pdfminer.high_level import extract_text as pdf_extract_text
from docx import Document


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    filename_lower = filename.lower()

    if filename_lower.endswith(".pdf"):
        return _extract_from_pdf(file_bytes)
    elif filename_lower.endswith(".docx"):
        return _extract_from_docx(file_bytes)
    elif filename_lower.endswith(".doc"):
        return ""
    else:
        try:
            return file_bytes.decode("utf-8")
        except Exception:
            return ""


def _extract_from_pdf(file_bytes: bytes) -> str:
    try:
        return pdf_extract_text(io.BytesIO(file_bytes)) or ""
    except Exception:
        return ""


def _extract_from_docx(file_bytes: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception:
        return ""