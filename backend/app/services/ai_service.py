"""
ClinixLens — AI Analysis Service
Uses Google Gemini for clinical document analysis with structured JSON output.
Includes Pydantic validation, retry logic, and hallucination mitigation.
"""
import json
import logging
import re
from typing import Optional, Dict, Any
import google.generativeai as genai
from app.core.config import settings
from app.schemas.schemas import (
    StructuredClinicalReport,
    PatientInformation,
    ClinicalEntity,
    MedicationInfo,
    VitalSigns,
    ClinicalConcern,
    MissingInfoItem,
    InconsistencyItem,
    ReviewItem,
)

logger = logging.getLogger(__name__)


CLINICAL_ANALYSIS_PROMPT = """You are a clinical document analysis assistant. Your role is to extract and structure clinical information from documents. You do NOT provide medical diagnosis or treatment recommendations.

IMPORTANT RULES:
1. Extract ONLY information explicitly stated in the document.
2. Never invent, hallucinate, or assume information not present.
3. If information is not found, leave the field empty or null — do NOT fabricate values.
4. Assign confidence scores honestly: high (>0.8) only for clearly stated information.
5. Flag any potential inconsistencies you detect in the document.
6. Note missing information that would typically be expected in a clinical document.
7. All data used here is synthetic/demonstration data only.

DOCUMENT TEXT:
---
{document_text}
---

Analyze this clinical document and return a JSON object with EXACTLY this structure:

{{
  "report_summary": "A concise 2-3 sentence summary of the clinical document",
  "patient_information": {{
    "name": "patient name or null",
    "age": "age or null",
    "gender": "gender or null",
    "patient_id": "patient ID or null",
    "date_of_visit": "visit date or null",
    "additional": {{}}
  }},
  "symptoms": [
    {{
      "category": "symptom",
      "label": "symptom name",
      "value": "details if any",
      "confidence": 0.0-1.0,
      "source_text": "exact quote from document"
    }}
  ],
  "diagnoses": [
    {{
      "category": "diagnosis",
      "label": "diagnosis name",
      "value": "details",
      "confidence": 0.0-1.0,
      "source_text": "exact quote from document"
    }}
  ],
  "medications": [
    {{
      "name": "medication name",
      "dosage": "dosage or null",
      "frequency": "frequency or null",
      "route": "route or null",
      "confidence": 0.0-1.0,
      "source_text": "exact quote"
    }}
  ],
  "vitals": {{
    "blood_pressure": "value or null",
    "heart_rate": "value or null",
    "temperature": "value or null",
    "respiratory_rate": "value or null",
    "oxygen_saturation": "value or null",
    "weight": "value or null",
    "height": "value or null",
    "bmi": "value or null",
    "additional": {{}}
  }},
  "allergies": [
    {{
      "category": "allergy",
      "label": "allergen",
      "value": "reaction details",
      "confidence": 0.0-1.0,
      "source_text": "exact quote"
    }}
  ],
  "clinical_observations": [
    {{
      "category": "observation",
      "label": "observation title",
      "value": "details",
      "confidence": 0.0-1.0,
      "source_text": "exact quote"
    }}
  ],
  "clinical_concerns": [
    {{
      "concern": "description of concern",
      "severity": "low/medium/high",
      "evidence": "supporting evidence",
      "recommendation": "suggested action"
    }}
  ],
  "missing_information": [
    {{
      "category": "category of missing info",
      "description": "what is missing",
      "clinical_importance": "low/medium/high"
    }}
  ],
  "potential_inconsistencies": [
    {{
      "description": "what is inconsistent",
      "evidence_a": "first piece of evidence",
      "evidence_b": "conflicting evidence",
      "explanation": "why this is inconsistent",
      "severity": "low/medium/high"
    }}
  ],
  "requires_review": [
    {{
      "item": "what needs review",
      "reason": "why it needs review",
      "priority": "low/medium/high"
    }}
  ],
  "overall_confidence": 0.0-1.0,
  "document_quality_score": 0.0-1.0
}}

Return ONLY valid JSON. No markdown code fences, no explanations outside the JSON."""


class AIServiceError(Exception):
    """Raised when AI analysis fails."""
    pass


class AIService:
    """
    AI analysis service using Google Gemini.
    Features: structured output, Pydantic validation, retry logic, fallback handling.
    """

    MAX_RETRIES = 3
    
    def __init__(self):
        self._configured = False
        if settings.gemini_api_key:
            try:
                genai.configure(api_key=settings.gemini_api_key)
                self._configured = True
                self._model = genai.GenerativeModel(
                    settings.gemini_model,
                    generation_config=genai.GenerationConfig(
                        temperature=0.1,
                        top_p=0.95,
                        max_output_tokens=8192,
                        response_mime_type="application/json",
                    )
                )
            except Exception as e:
                logger.error(f"Failed to configure Gemini: {e}")
                self._configured = False

    @property
    def is_available(self) -> bool:
        return self._configured

    def get_status(self) -> dict:
        return {
            "provider": "google_gemini",
            "model": settings.gemini_model,
            "available": self.is_available,
        }

    async def analyze_clinical_document(
        self, document_text: str, page_count: int = 1
    ) -> StructuredClinicalReport:
        """
        Analyze clinical document text using Gemini.
        Returns a Pydantic-validated StructuredClinicalReport.
        Retries on malformed responses.
        """
        if not self.is_available:
            raise AIServiceError("AI service is not configured. Set GEMINI_API_KEY.")

        if not document_text or len(document_text.strip()) < 10:
            raise AIServiceError("Document text is too short for meaningful analysis.")

        prompt = CLINICAL_ANALYSIS_PROMPT.format(document_text=document_text)

        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                logger.info(f"AI analysis attempt {attempt}/{self.MAX_RETRIES}")
                
                response = self._model.generate_content(prompt)
                
                if not response.text:
                    raise AIServiceError("AI returned empty response.")

                # Parse and validate the JSON
                report = self._parse_and_validate(response.text)
                return report

            except AIServiceError:
                raise
            except Exception as e:
                last_error = e
                logger.warning(f"AI attempt {attempt} failed: {str(e)}")
                if attempt < self.MAX_RETRIES:
                    continue

        raise AIServiceError(
            f"AI analysis failed after {self.MAX_RETRIES} attempts. Last error: {str(last_error)}"
        )

    def _parse_and_validate(self, response_text: str) -> StructuredClinicalReport:
        """
        Parse AI response text as JSON and validate through Pydantic.
        Handles common LLM output issues (markdown fences, trailing commas, etc.)
        """
        cleaned_text = response_text.strip()

        # Remove markdown code fences if present
        if cleaned_text.startswith("```"):
            lines = cleaned_text.split("\n")
            # Remove first line (```json or ```)
            lines = lines[1:]
            # Remove last line if it's ```)
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned_text = "\n".join(lines).strip()

        # Try parsing JSON
        try:
            data = json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            # Attempt to fix common JSON issues
            try:
                # Remove trailing commas
                fixed = re.sub(r',\s*([}\]])', r'\1', cleaned_text)
                data = json.loads(fixed)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse AI response as JSON: {e}")
                logger.debug(f"Response text: {cleaned_text[:500]}")
                raise AIServiceError(f"AI returned malformed JSON: {str(e)}")

        # Validate through Pydantic
        try:
            report = StructuredClinicalReport(**data)
            return report
        except Exception as e:
            logger.error(f"Pydantic validation failed: {e}")
            # Try to salvage what we can with defaults
            try:
                report = StructuredClinicalReport(
                    report_summary=data.get("report_summary", "Report generated with partial data."),
                    patient_information=PatientInformation(**data.get("patient_information", {})) if data.get("patient_information") else PatientInformation(),
                    symptoms=self._safe_parse_entities(data.get("symptoms", []), "symptom"),
                    diagnoses=self._safe_parse_entities(data.get("diagnoses", []), "diagnosis"),
                    medications=self._safe_parse_medications(data.get("medications", [])),
                    vitals=VitalSigns(**data.get("vitals", {})) if data.get("vitals") else VitalSigns(),
                    allergies=self._safe_parse_entities(data.get("allergies", []), "allergy"),
                    clinical_observations=self._safe_parse_entities(data.get("clinical_observations", []), "observation"),
                    clinical_concerns=self._safe_parse_concerns(data.get("clinical_concerns", [])),
                    missing_information=self._safe_parse_missing(data.get("missing_information", [])),
                    potential_inconsistencies=self._safe_parse_inconsistencies(data.get("potential_inconsistencies", [])),
                    requires_review=self._safe_parse_review(data.get("requires_review", [])),
                    overall_confidence=float(data.get("overall_confidence", 0.5)),
                    document_quality_score=float(data.get("document_quality_score", 0.5)),
                )
                return report
            except Exception as e2:
                raise AIServiceError(f"Could not validate AI output: {str(e2)}")

    def _safe_parse_entities(self, items: list, category: str) -> list:
        result = []
        for item in items:
            try:
                if isinstance(item, dict):
                    item.setdefault("category", category)
                    item.setdefault("label", "Unknown")
                    result.append(ClinicalEntity(**item))
            except Exception:
                continue
        return result

    def _safe_parse_medications(self, items: list) -> list:
        result = []
        for item in items:
            try:
                if isinstance(item, dict):
                    item.setdefault("name", "Unknown")
                    result.append(MedicationInfo(**item))
            except Exception:
                continue
        return result

    def _safe_parse_concerns(self, items: list) -> list:
        result = []
        for item in items:
            try:
                if isinstance(item, dict):
                    item.setdefault("concern", "Unknown concern")
                    result.append(ClinicalConcern(**item))
            except Exception:
                continue
        return result

    def _safe_parse_missing(self, items: list) -> list:
        result = []
        for item in items:
            try:
                if isinstance(item, dict):
                    item.setdefault("category", "unknown")
                    item.setdefault("description", "Information not specified")
                    result.append(MissingInfoItem(**item))
            except Exception:
                continue
        return result

    def _safe_parse_inconsistencies(self, items: list) -> list:
        result = []
        for item in items:
            try:
                if isinstance(item, dict):
                    item.setdefault("description", "Unknown inconsistency")
                    item.setdefault("explanation", "Requires review")
                    result.append(InconsistencyItem(**item))
            except Exception:
                continue
        return result

    def _safe_parse_review(self, items: list) -> list:
        result = []
        for item in items:
            try:
                if isinstance(item, dict):
                    item.setdefault("item", "Unknown item")
                    item.setdefault("reason", "Requires verification")
                    result.append(ReviewItem(**item))
            except Exception:
                continue
        return result


# Singleton
ai_service = AIService()
