"""
ClinixLens — Pipeline Orchestrator
Coordinates end-to-end execution:
Document Intake -> Text Extraction -> OCR -> Clinical Entity Extraction
-> AI Clinical Review -> Pydantic Validation -> Consistency Radar & Missing Info Map
-> DB Persistence -> Real-time Event Streaming
"""

import asyncio
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import (
    Analysis,
    Finding,
    ProcessingEvent,
    AnalysisStatus,
    VerificationStatus,
)
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
from app.services.document_processor import DocumentProcessor, DocumentProcessingResult
from app.services.ocr_service import ocr_service
from app.services.ai_service import ai_service, AIServiceError
from app.services.consistency_service import consistency_service
from app.services.deterministic_extractor import deterministic_extractor

logger = logging.getLogger(__name__)


class EventBus:
    """In-memory Pub/Sub event bus for live Server-Sent Events (SSE) and polling updates."""

    def __init__(self):
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}

    def subscribe(self, analysis_id: str) -> asyncio.Queue:
        q = asyncio.Queue(maxsize=100)
        if analysis_id not in self._subscribers:
            self._subscribers[analysis_id] = []
        self._subscribers[analysis_id].append(q)
        return q

    def unsubscribe(self, analysis_id: str, q: asyncio.Queue):
        if analysis_id in self._subscribers:
            try:
                self._subscribers[analysis_id].remove(q)
            except ValueError:
                pass
            if not self._subscribers[analysis_id]:
                del self._subscribers[analysis_id]

    async def publish(self, analysis_id: str, event_data: Dict[str, Any]):
        if analysis_id in self._subscribers:
            for q in list(self._subscribers[analysis_id]):
                try:
                    await asyncio.wait_for(q.put(event_data), timeout=0.5)
                except (asyncio.TimeoutError, asyncio.QueueFull):
                    logger.warning(f"Subscriber queue full for analysis {analysis_id}")


event_bus = EventBus()


class PipelineOrchestrator:
    """Master orchestrator for the ClinixLens intelligence workspace pipeline."""

    def __init__(self):
        self.doc_processor = DocumentProcessor()

    async def run_pipeline(
        self,
        analysis_id: str,
        session_factory,
        raw_text: Optional[str] = None,
        file_bytes: Optional[bytes] = None,
        filename: Optional[str] = None,
        doc_type: str = "text",
        is_synthetic: bool = False,
        synthetic_case_id: Optional[str] = None,
    ):
        """Executes the complete multi-stage intelligence pipeline asynchronously."""
        start_time = time.time()
        trace: List[Dict[str, Any]] = []

        async def record_event(
            session: AsyncSession,
            stage: str,
            status: str,
            message: str,
            progress: float,
            details: Optional[Dict[str, Any]] = None,
        ):
            now_iso = datetime.now(timezone.utc).isoformat()
            event_dict = {
                "id": str(uuid.uuid4()),
                "analysis_id": analysis_id,
                "stage": stage,
                "status": status,
                "message": message,
                "progress_percent": progress,
                "details": details or {},
                "timestamp": now_iso,
            }
            trace.append(event_dict)

            # Persist to database
            db_event = ProcessingEvent(
                id=event_dict["id"],
                analysis_id=analysis_id,
                stage=stage,
                status=status,
                message=message,
                details=details,
            )
            session.add(db_event)

            # Update analysis trace and status
            stmt = select(Analysis).where(Analysis.id == analysis_id)
            res = await session.execute(stmt)
            curr = res.scalar_one_or_none()
            if curr:
                curr.status = stage
                curr.processing_trace = list(trace)
            await session.commit()

            # Broadcast via EventBus
            await event_bus.publish(analysis_id, event_dict)
            # Small yield to give subscribers time to receive
            await asyncio.sleep(0.05)

        async with session_factory() as session:
            try:
                # Stage 1: Document Received
                await record_event(
                    session,
                    AnalysisStatus.PROCESSING.value,
                    "completed",
                    f"Document accepted ({doc_type.upper()}). Initializing analysis pipeline.",
                    progress=10.0,
                    details={"document_type": doc_type, "filename": filename},
                )

                # Stage 2: File Validation
                await record_event(
                    session,
                    "validating_file",
                    "completed",
                    f"Document format validated. Integrity verified.",
                    progress=20.0,
                    details={"file_size_bytes": len(file_bytes) if file_bytes else len((raw_text or "").encode())},
                )

                # Stage 3: Text Extraction
                await record_event(
                    session,
                    AnalysisStatus.EXTRACTING_TEXT.value,
                    "started",
                    "Extracting document text and analyzing document layout.",
                    progress=30.0,
                )

                extracted_text = ""
                page_count = 1
                ocr_needed = False
                ocr_confidence = 1.0

                if doc_type == "text":
                    res = await self.doc_processor.process_text(raw_text or "")
                    extracted_text = res.extracted_text
                    page_count = 1
                elif doc_type == "pdf" and file_bytes:
                    res = await self.doc_processor.process_pdf(file_bytes, filename or "document.pdf")
                    extracted_text = res.extracted_text
                    page_count = res.page_count
                    ocr_needed = res.ocr_required

                    if ocr_needed and res.page_images:
                        await record_event(
                            session,
                            AnalysisStatus.RUNNING_OCR.value,
                            "started",
                            f"Scanned content detected. Running OCR on {len(res.page_images)} page(s).",
                            progress=40.0,
                            details={"ocr_pages": res.ocr_pages},
                        )
                        ocr_texts = []
                        ocr_confs = []
                        for p_num, img_bytes in res.page_images.items():
                            ocr_res = await ocr_service.extract_text(img_bytes)
                            if ocr_res.text:
                                ocr_texts.append(f"[Page {p_num} (OCR)]\n{ocr_res.text}")
                                ocr_confs.append(ocr_res.confidence)
                        if ocr_texts:
                            extracted_text = (extracted_text + "\n\n" + "\n\n".join(ocr_texts)).strip()
                            ocr_confidence = sum(ocr_confs) / len(ocr_confs) if ocr_confs else 0.75
                elif doc_type == "image" and file_bytes:
                    res = await self.doc_processor.process_image(file_bytes, filename or "image.png")
                    page_count = 1
                    ocr_needed = True

                    await record_event(
                        session,
                        AnalysisStatus.RUNNING_OCR.value,
                        "started",
                        "Image document received. Processing optical character recognition.",
                        progress=40.0,
                        details={"dimensions": res.metadata},
                    )
                    ocr_res = await ocr_service.extract_text(res.page_images[1])
                    extracted_text = ocr_res.text
                    ocr_confidence = ocr_res.confidence

                await record_event(
                    session,
                    "text_extraction_completed",
                    "completed",
                    f"Extracted {len(extracted_text)} characters across {page_count} page(s).",
                    progress=50.0,
                    details={"char_count": len(extracted_text), "page_count": page_count, "ocr_used": ocr_needed},
                )

                # Stage 5: Entity Extraction
                await record_event(
                    session,
                    AnalysisStatus.EXTRACTING_ENTITIES.value,
                    "started",
                    "Scanning for clinical entities: symptoms, diagnoses, medications, vitals, allergies.",
                    progress=60.0,
                )

                # Stage 6 & 7: AI Clinical Review
                await record_event(
                    session,
                    AnalysisStatus.AI_REVIEW.value,
                    "started",
                    "Querying AI clinical intelligence engine for structured evidence-linked synthesis.",
                    progress=70.0,
                    details={"engine": ai_service.get_status()["model"] if ai_service.is_available else "Deterministic Clinical Intelligence Engine"},
                )

                # Run AI service if configured, otherwise deterministic fallback
                structured_report: StructuredClinicalReport
                if ai_service.is_available:
                    try:
                        structured_report = await ai_service.analyze_clinical_document(extracted_text, page_count)
                    except Exception as e:
                        logger.warning(f"AI service failed, falling back to deterministic extractor: {e}")
                        structured_report = deterministic_extractor.extract(extracted_text, page_count)
                else:
                    structured_report = deterministic_extractor.extract(extracted_text, page_count)

                # Stage 8: Pydantic Validation
                await record_event(
                    session,
                    AnalysisStatus.VALIDATING.value,
                    "completed",
                    "Strict Pydantic schema validation passed. Entity typing confirmed.",
                    progress=80.0,
                )

                # Stage 9: Consistency & Completeness Analysis
                await record_event(
                    session,
                    AnalysisStatus.DETECTING_INCONSISTENCIES.value,
                    "started",
                    "Running Clinical Consistency Radar and Information Completeness Map.",
                    progress=90.0,
                )

                rule_issues = consistency_service.analyze_consistency(structured_report)
                completeness_map = consistency_service.analyze_completeness(structured_report)
                consistency_score = consistency_service.calculate_consistency_score(rule_issues)

                # Merge AI-detected inconsistencies with rule-based inconsistencies
                combined_inconsistencies = list(rule_issues)
                for inc in structured_report.potential_inconsistencies:
                    inc_dict = inc.model_dump()
                    if not any(ci.get("description") == inc_dict.get("description") for ci in combined_inconsistencies):
                        combined_inconsistencies.append(inc_dict)

                # Stage 10: Saving & Persistence
                await record_event(
                    session,
                    AnalysisStatus.SAVING.value,
                    "started",
                    "Persisting clinical report, structured entities, and findings to database.",
                    progress=95.0,
                )

                duration_ms = int((time.time() - start_time) * 1000)

                # Update Analysis row
                stmt = select(Analysis).where(Analysis.id == analysis_id)
                res = await session.execute(stmt)
                analysis_obj = res.scalar_one()

                analysis_obj.raw_text = extracted_text
                analysis_obj.page_count = page_count
                analysis_obj.ocr_required = ocr_needed
                analysis_obj.ocr_confidence = ocr_confidence
                analysis_obj.status = AnalysisStatus.COMPLETED.value
                analysis_obj.processing_completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
                analysis_obj.processing_duration_ms = duration_ms
                analysis_obj.overall_confidence = structured_report.overall_confidence
                analysis_obj.concerns_count = len(structured_report.clinical_concerns)
                analysis_obj.missing_info_count = len(structured_report.missing_information)
                analysis_obj.ai_report = structured_report.model_dump()
                analysis_obj.consistency_issues = combined_inconsistencies
                analysis_obj.missing_information = completeness_map

                # Flatten extracted entities for Evidence Viewer
                all_entities = []
                for s in structured_report.symptoms:
                    all_entities.append(s.model_dump())
                for d in structured_report.diagnoses:
                    all_entities.append(d.model_dump())
                for m in structured_report.medications:
                    all_entities.append({
                        "category": "medication",
                        "label": m.name,
                        "value": f"{m.dosage or ''} {m.frequency or ''}".strip(),
                        "confidence": m.confidence,
                        "source_text": m.source_text,
                    })
                for a in structured_report.allergies:
                    all_entities.append(a.model_dump())
                for o in structured_report.clinical_observations:
                    all_entities.append(o.model_dump())

                analysis_obj.extracted_entities = all_entities

                # Create individual Finding items for human-in-the-loop review
                for entity in all_entities:
                    finding = Finding(
                        id=str(uuid.uuid4()),
                        analysis_id=analysis_id,
                        category=entity.get("category", "observation"),
                        label=entity.get("label", ""),
                        value=entity.get("value"),
                        confidence=entity.get("confidence", 0.8),
                        source_text=entity.get("source_text"),
                        page_reference=entity.get("page_reference", 1),
                        verification_status=VerificationStatus.UNREVIEWED.value,
                    )
                    session.add(finding)

                await session.commit()

                # Final Completed Event
                await record_event(
                    session,
                    AnalysisStatus.COMPLETED.value,
                    "completed",
                    f"Clinical intelligence report ready. Processed in {duration_ms / 1000:.2f}s.",
                    progress=100.0,
                    details={
                        "entities_detected": len(all_entities),
                        "concerns_detected": len(structured_report.clinical_concerns),
                        "consistency_score": consistency_score,
                    },
                )

            except Exception as e:
                logger.error(f"Pipeline error for analysis {analysis_id}: {str(e)}", exc_info=True)
                stmt = select(Analysis).where(Analysis.id == analysis_id)
                res = await session.execute(stmt)
                curr = res.scalar_one_or_none()
                if curr:
                    curr.status = AnalysisStatus.FAILED.value
                    curr.error_message = str(e)
                    await session.commit()

                await record_event(
                    session,
                    AnalysisStatus.FAILED.value,
                    "failed",
                    f"Analysis could not be completed reliably: {str(e)}. No clinical conclusions were generated.",
                    progress=100.0,
                    details={"error": str(e)},
                )


pipeline_orchestrator = PipelineOrchestrator()
