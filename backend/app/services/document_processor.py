"""
ClinixLens — Document Processing Service
Handles PDF text extraction, image processing, and text normalization.
Clean abstraction layer for document intake.
"""
import io
import os
import re
import hashlib
from typing import Optional, Tuple, Dict, Any, List
from datetime import datetime, timezone
import fitz  # PyMuPDF
from PIL import Image


class DocumentProcessingResult:
    """Result container for document processing."""
    def __init__(self):
        self.extracted_text: str = ""
        self.page_count: int = 0
        self.ocr_required: bool = False
        self.ocr_pages: List[int] = []
        self.file_type: str = ""
        self.file_size_bytes: int = 0
        self.page_texts: Dict[int, str] = {}
        self.page_images: Dict[int, bytes] = {}  # For OCR
        self.warnings: List[str] = []
        self.metadata: Dict[str, Any] = {}


class DocumentProcessor:
    """
    Processes clinical documents — PDFs, images, and plain text.
    Extracts text, detects OCR requirements, and normalizes content.
    """

    SUPPORTED_IMAGE_TYPES = {".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".webp"}
    SUPPORTED_PDF_TYPES = {".pdf"}
    MAX_TEXT_LENGTH = 50000

    def __init__(self):
        pass

    async def process_text(self, text: str) -> DocumentProcessingResult:
        """Process plain text input."""
        result = DocumentProcessingResult()
        result.file_type = "text"
        result.file_size_bytes = len(text.encode("utf-8"))
        result.extracted_text = self._normalize_text(text)
        result.page_count = 1
        result.page_texts = {1: result.extracted_text}
        result.ocr_required = False
        return result

    async def process_pdf(self, file_bytes: bytes, filename: str) -> DocumentProcessingResult:
        """
        Process a PDF file. Extracts text from each page.
        Detects scanned/image-only pages that need OCR.
        """
        result = DocumentProcessingResult()
        result.file_type = "pdf"
        result.file_size_bytes = len(file_bytes)

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            result.page_count = len(doc)
            result.metadata = {
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
                "page_count": len(doc),
            }

            all_text_parts = []

            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text("text").strip()

                if page_text and len(page_text) > 20:
                    # Page has extractable text
                    result.page_texts[page_num + 1] = page_text
                    all_text_parts.append(f"[Page {page_num + 1}]\n{page_text}")
                else:
                    # Page likely scanned/image — needs OCR
                    result.ocr_required = True
                    result.ocr_pages.append(page_num + 1)

                    # Render page as image for OCR
                    try:
                        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
                        img_bytes = pix.tobytes("png")
                        result.page_images[page_num + 1] = img_bytes
                    except Exception as e:
                        result.warnings.append(f"Could not render page {page_num + 1}: {str(e)}")

            doc.close()

            result.extracted_text = self._normalize_text("\n\n".join(all_text_parts))

            if result.ocr_required and not result.extracted_text.strip():
                result.warnings.append("PDF appears to be fully scanned. OCR is required for text extraction.")

        except Exception as e:
            raise DocumentProcessingError(f"Failed to process PDF: {str(e)}")

        return result

    async def process_image(self, file_bytes: bytes, filename: str) -> DocumentProcessingResult:
        """
        Process an image file. Validates the image and prepares it for OCR.
        """
        result = DocumentProcessingResult()
        result.file_type = "image"
        result.file_size_bytes = len(file_bytes)
        result.page_count = 1
        result.ocr_required = True
        result.ocr_pages = [1]

        try:
            img = Image.open(io.BytesIO(file_bytes))
            result.metadata = {
                "width": img.width,
                "height": img.height,
                "format": img.format,
                "mode": img.mode,
            }

            # Convert to PNG bytes for OCR
            buf = io.BytesIO()
            if img.mode != "RGB":
                img = img.convert("RGB")
            img.save(buf, format="PNG")
            buf.seek(0)
            result.page_images[1] = buf.read()

        except Exception as e:
            raise DocumentProcessingError(f"Failed to process image: {str(e)}")

        return result

    def validate_file(self, filename: str, file_bytes: bytes) -> Tuple[str, str]:
        """
        Validate uploaded file. Returns (document_type, extension).
        Raises DocumentProcessingError for invalid files.
        """
        if not filename:
            raise DocumentProcessingError("No filename provided.")

        ext = os.path.splitext(filename.lower())[1]

        if ext in self.SUPPORTED_PDF_TYPES:
            doc_type = "pdf"
        elif ext in self.SUPPORTED_IMAGE_TYPES:
            doc_type = "image"
        else:
            raise DocumentProcessingError(
                f"Unsupported file type: {ext}. Supported: PDF, PNG, JPG, JPEG, TIFF, BMP, WEBP"
            )

        if len(file_bytes) == 0:
            raise DocumentProcessingError("Uploaded file is empty.")

        if len(file_bytes) > 20 * 1024 * 1024:
            raise DocumentProcessingError("File exceeds maximum size of 20 MB.")

        # Basic corruption check for PDFs
        if doc_type == "pdf":
            if not file_bytes[:5] == b"%PDF-":
                raise DocumentProcessingError("File does not appear to be a valid PDF.")

        # Basic corruption check for images
        if doc_type == "image":
            try:
                img = Image.open(io.BytesIO(file_bytes))
                img.verify()
            except Exception:
                raise DocumentProcessingError("File does not appear to be a valid image.")

        return doc_type, ext

    def _normalize_text(self, text: str) -> str:
        """Normalize clinical text for processing."""
        if not text:
            return ""
        # Remove excessive whitespace but preserve paragraph structure
        text = re.sub(r'\r\n', '\n', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        # Trim
        text = text.strip()
        # Truncate if too long
        if len(text) > self.MAX_TEXT_LENGTH:
            text = text[:self.MAX_TEXT_LENGTH] + "\n\n[Text truncated at 50,000 characters]"
        return text


class DocumentProcessingError(Exception):
    """Raised when document processing fails."""
    pass
