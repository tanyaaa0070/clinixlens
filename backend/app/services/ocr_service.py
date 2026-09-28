"""
ClinixLens — OCR Service Abstraction
Supports Google Cloud Vision API with fallback.
Designed so OCR providers can be swapped later.
"""
import base64
import httpx
import io
import logging
from typing import Optional, Tuple
from abc import ABC, abstractmethod
from app.core.config import settings

logger = logging.getLogger(__name__)


class OCRResult:
    """Container for OCR output."""
    def __init__(self, text: str = "", confidence: float = 0.0, provider: str = "none"):
        self.text = text
        self.confidence = confidence
        self.provider = provider
        self.warnings: list = []


class OCRProvider(ABC):
    """Abstract OCR provider interface — allows swapping OCR backends."""

    @abstractmethod
    async def extract_text(self, image_bytes: bytes) -> OCRResult:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass


class GoogleVisionOCR(OCRProvider):
    """Google Cloud Vision API OCR provider."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = "https://vision.googleapis.com/v1/images:annotate"

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def extract_text(self, image_bytes: bytes) -> OCRResult:
        """Extract text from image using Google Cloud Vision API."""
        result = OCRResult(provider="google_cloud_vision")

        if not self.api_key:
            result.warnings.append("Google Cloud Vision API key not configured.")
            return result

        try:
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")

            payload = {
                "requests": [{
                    "image": {"content": image_b64},
                    "features": [
                        {"type": "DOCUMENT_TEXT_DETECTION", "maxResults": 1}
                    ]
                }]
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.endpoint}?key={self.api_key}",
                    json=payload
                )

                if response.status_code != 200:
                    error_detail = response.text[:200]
                    logger.error(f"Google Vision API error: {response.status_code} - {error_detail}")
                    result.warnings.append(f"OCR API returned status {response.status_code}")
                    return result

                data = response.json()
                responses = data.get("responses", [])

                if responses and responses[0].get("fullTextAnnotation"):
                    annotation = responses[0]["fullTextAnnotation"]
                    result.text = annotation.get("text", "")

                    # Calculate average confidence from pages
                    pages = annotation.get("pages", [])
                    confidences = []
                    for page in pages:
                        for block in page.get("blocks", []):
                            if "confidence" in block:
                                confidences.append(block["confidence"])
                    
                    if confidences:
                        result.confidence = sum(confidences) / len(confidences)
                    else:
                        result.confidence = 0.7  # Default if not reported

                elif responses and responses[0].get("textAnnotations"):
                    # Fallback to simpler annotation
                    annotations = responses[0]["textAnnotations"]
                    if annotations:
                        result.text = annotations[0].get("description", "")
                        result.confidence = 0.6
                else:
                    result.warnings.append("No text detected in image by OCR.")
                    result.confidence = 0.0

                # Check for errors in response
                if responses and responses[0].get("error"):
                    error = responses[0]["error"]
                    result.warnings.append(f"OCR error: {error.get('message', 'Unknown')}")

        except httpx.TimeoutException:
            logger.error("Google Vision API timeout")
            result.warnings.append("OCR request timed out.")
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            result.warnings.append(f"OCR processing error: {str(e)}")

        return result


class FallbackOCR(OCRProvider):
    """
    Fallback OCR when no external service is available.
    Returns a descriptive message instead of silently failing.
    """

    def is_available(self) -> bool:
        return True

    async def extract_text(self, image_bytes: bytes) -> OCRResult:
        result = OCRResult(provider="fallback")
        result.text = "[OCR service not configured. Image contains text that could not be extracted automatically. Please configure Google Cloud Vision API or another OCR provider.]"
        result.confidence = 0.0
        result.warnings.append("No OCR provider configured. Set GOOGLE_CLOUD_VISION_API_KEY in environment.")
        return result


class OCRService:
    """
    OCR service with provider abstraction and fallback chain.
    Providers are tried in order; first available provider is used.
    """

    def __init__(self):
        self.providers: list[OCRProvider] = []
        self._active_provider: Optional[OCRProvider] = None

        # Register providers in priority order
        if settings.google_cloud_vision_api_key:
            self.providers.append(GoogleVisionOCR(settings.google_cloud_vision_api_key))

        # Always add fallback last
        self.providers.append(FallbackOCR())

        # Select first available provider
        for provider in self.providers:
            if provider.is_available():
                self._active_provider = provider
                break

    @property
    def provider_name(self) -> str:
        if self._active_provider:
            return self._active_provider.__class__.__name__
        return "none"

    def is_available(self) -> bool:
        return self._active_provider is not None and not isinstance(self._active_provider, FallbackOCR)

    async def extract_text(self, image_bytes: bytes) -> OCRResult:
        """Extract text from image bytes using the active OCR provider."""
        if not self._active_provider:
            return OCRResult(text="", confidence=0.0, provider="none")
        return await self._active_provider.extract_text(image_bytes)

    def get_status(self) -> dict:
        return {
            "provider": self.provider_name,
            "available": self.is_available(),
            "providers_registered": len(self.providers),
        }


# Singleton instance
ocr_service = OCRService()
