"""
ClinixLens — Pydantic Schemas for API Request/Response Validation
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================
# Enums
# ============================================

class AnalysisStatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    EXTRACTING_TEXT = "extracting_text"
    RUNNING_OCR = "running_ocr"
    EXTRACTING_ENTITIES = "extracting_entities"
    STRUCTURING = "structuring"
    AI_REVIEW = "ai_review"
    VALIDATING = "validating"
    DETECTING_INCONSISTENCIES = "detecting_inconsistencies"
    SAVING = "saving"
    COMPLETED = "completed"
    FAILED = "failed"
    NEEDS_REVIEW = "needs_review"


class DocumentTypeEnum(str, Enum):
    TEXT = "text"
    PDF = "pdf"
    IMAGE = "image"


class VerificationStatusEnum(str, Enum):
    UNREVIEWED = "unreviewed"
    VERIFIED = "verified"
    NEEDS_REVIEW = "needs_review"
    DISMISSED = "dismissed"


# ============================================
# Request Schemas
# ============================================

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=50000, description="Clinical text to analyze")
    case_label: Optional[str] = Field(None, description="Optional label for this case")


class FindingUpdateRequest(BaseModel):
    verification_status: VerificationStatusEnum
    verified_by: Optional[str] = "reviewer"


# ============================================
# AI Report Schemas (Pydantic-validated LLM output)
# ============================================

class PatientInformation(BaseModel):
    name: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    patient_id: Optional[str] = None
    date_of_visit: Optional[str] = None
    additional: Optional[Dict[str, str]] = None


class ClinicalEntity(BaseModel):
    category: str = Field(..., description="Entity category: symptom, diagnosis, medication, vital, allergy, observation")
    label: str = Field(..., description="Entity name/label")
    value: Optional[str] = Field(None, description="Entity value if applicable")
    confidence: float = Field(0.5, ge=0.0, le=1.0, description="Detection confidence 0-1")
    source_text: Optional[str] = Field(None, description="Source text from document")
    page_reference: Optional[int] = Field(None, description="Page number if from PDF")


class ClinicalConcern(BaseModel):
    concern: str
    severity: str = Field("low", description="low, medium, high")
    evidence: Optional[str] = None
    recommendation: Optional[str] = None


class MissingInfoItem(BaseModel):
    category: str
    description: str
    clinical_importance: str = Field("medium", description="low, medium, high")


class InconsistencyItem(BaseModel):
    description: str
    evidence_a: Optional[str] = None
    evidence_b: Optional[str] = None
    explanation: str
    severity: str = Field("medium", description="low, medium, high")


class ReviewItem(BaseModel):
    item: str
    reason: str
    priority: str = Field("medium", description="low, medium, high")


class MedicationInfo(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    confidence: float = Field(0.5, ge=0.0, le=1.0)
    source_text: Optional[str] = None


class VitalSigns(BaseModel):
    blood_pressure: Optional[str] = None
    heart_rate: Optional[str] = None
    temperature: Optional[str] = None
    respiratory_rate: Optional[str] = None
    oxygen_saturation: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None
    bmi: Optional[str] = None
    additional: Optional[Dict[str, str]] = None


class StructuredClinicalReport(BaseModel):
    """The master Pydantic model for validated AI clinical report output."""
    report_summary: str = Field(..., description="Concise clinical summary")
    patient_information: PatientInformation = Field(default_factory=PatientInformation)
    symptoms: List[ClinicalEntity] = Field(default_factory=list)
    diagnoses: List[ClinicalEntity] = Field(default_factory=list)
    medications: List[MedicationInfo] = Field(default_factory=list)
    vitals: VitalSigns = Field(default_factory=VitalSigns)
    allergies: List[ClinicalEntity] = Field(default_factory=list)
    clinical_observations: List[ClinicalEntity] = Field(default_factory=list)
    clinical_concerns: List[ClinicalConcern] = Field(default_factory=list)
    missing_information: List[MissingInfoItem] = Field(default_factory=list)
    potential_inconsistencies: List[InconsistencyItem] = Field(default_factory=list)
    requires_review: List[ReviewItem] = Field(default_factory=list)
    overall_confidence: float = Field(0.5, ge=0.0, le=1.0)
    document_quality_score: float = Field(0.5, ge=0.0, le=1.0)


# ============================================
# Response Schemas
# ============================================

class ProcessingEventResponse(BaseModel):
    id: str
    stage: str
    status: str
    message: Optional[str]
    details: Optional[Dict[str, Any]]
    timestamp: datetime

    class Config:
        from_attributes = True


class FindingResponse(BaseModel):
    id: str
    analysis_id: str
    category: str
    label: str
    value: Optional[str]
    confidence: Optional[float]
    source_text: Optional[str]
    page_reference: Optional[int]
    verification_status: str
    verified_by: Optional[str]
    verified_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisListItem(BaseModel):
    id: str
    case_id: str
    document_type: str
    original_filename: Optional[str]
    status: str
    overall_confidence: Optional[float]
    concerns_count: int
    missing_info_count: int
    review_status: str
    review_progress: float
    is_synthetic: bool
    processing_duration_ms: Optional[int]
    created_at: datetime
    updated_at: datetime
    report_summary: Optional[str] = None

    class Config:
        from_attributes = True


class AnalysisDetailResponse(BaseModel):
    id: str
    case_id: str
    document_type: str
    original_filename: Optional[str]
    file_size_bytes: Optional[int]
    page_count: Optional[int]
    status: str
    processing_started_at: Optional[datetime]
    processing_completed_at: Optional[datetime]
    processing_duration_ms: Optional[int]
    raw_text: Optional[str]
    ocr_required: bool
    ocr_confidence: Optional[float]
    extracted_entities: Optional[List[Dict[str, Any]]]
    ai_report: Optional[Dict[str, Any]]
    consistency_issues: Optional[List[Dict[str, Any]]]
    missing_information: Optional[List[Dict[str, Any]]]
    overall_confidence: Optional[float]
    concerns_count: int
    missing_info_count: int
    review_status: str
    review_progress: float
    processing_trace: Optional[List[Dict[str, Any]]]
    error_message: Optional[str]
    is_synthetic: bool
    synthetic_case_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    findings: List[FindingResponse] = []
    processing_events: List[ProcessingEventResponse] = []

    class Config:
        from_attributes = True


class AnalysisStatusResponse(BaseModel):
    id: str
    status: str
    processing_trace: Optional[List[Dict[str, Any]]]
    current_stage: Optional[str] = None
    progress_percent: Optional[float] = None
    events: List[ProcessingEventResponse] = []


class HealthResponse(BaseModel):
    status: str
    version: str
    ai_engine: str
    database: str
    ocr_service: str
    uptime_seconds: float


class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None


class StatsResponse(BaseModel):
    total_analyses: int
    completed_analyses: int
    needs_review_count: int
    failed_count: int
    average_processing_time_ms: Optional[float]
    average_confidence: Optional[float]
