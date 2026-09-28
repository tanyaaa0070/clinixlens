"""
ClinixLens — SQLAlchemy Database Models
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, DateTime, Float, Integer, Boolean, JSON, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class AnalysisStatus(str, enum.Enum):
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


class DocumentType(str, enum.Enum):
    TEXT = "text"
    PDF = "pdf"
    IMAGE = "image"


class VerificationStatus(str, enum.Enum):
    UNREVIEWED = "unreviewed"
    VERIFIED = "verified"
    NEEDS_REVIEW = "needs_review"
    DISMISSED = "dismissed"


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, nullable=False, index=True)
    
    # Document info
    document_type = Column(String, nullable=False)
    original_filename = Column(String, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    page_count = Column(Integer, nullable=True)
    
    # Processing
    status = Column(String, default=AnalysisStatus.PENDING.value, nullable=False)
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)
    processing_duration_ms = Column(Integer, nullable=True)
    
    # Extracted text
    raw_text = Column(Text, nullable=True)
    ocr_required = Column(Boolean, default=False)
    ocr_confidence = Column(Float, nullable=True)
    
    # AI analysis results (stored as JSON)
    extracted_entities = Column(JSON, nullable=True)
    ai_report = Column(JSON, nullable=True)
    consistency_issues = Column(JSON, nullable=True)
    missing_information = Column(JSON, nullable=True)
    
    # Confidence & review
    overall_confidence = Column(Float, nullable=True)
    concerns_count = Column(Integer, default=0)
    missing_info_count = Column(Integer, default=0)
    review_status = Column(String, default="unreviewed")
    review_progress = Column(Float, default=0.0)
    
    # Processing trace log
    processing_trace = Column(JSON, nullable=True)
    
    # Error info
    error_message = Column(Text, nullable=True)
    
    # Synthetic case flag
    is_synthetic = Column(Boolean, default=False)
    synthetic_case_id = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    findings = relationship("Finding", back_populates="analysis", cascade="all, delete-orphan")
    processing_events = relationship("ProcessingEvent", back_populates="analysis", cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True, default=generate_uuid)
    analysis_id = Column(String, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(String, nullable=False)  # symptom, diagnosis, medication, etc.
    label = Column(String, nullable=False)
    value = Column(Text, nullable=True)
    
    confidence = Column(Float, nullable=True)
    source_text = Column(Text, nullable=True)
    page_reference = Column(Integer, nullable=True)
    
    verification_status = Column(String, default=VerificationStatus.UNREVIEWED.value)
    verified_by = Column(String, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="findings")


class ProcessingEvent(Base):
    __tablename__ = "processing_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    analysis_id = Column(String, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    stage = Column(String, nullable=False)
    status = Column(String, nullable=False)  # started, completed, failed, warning
    message = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="processing_events")
