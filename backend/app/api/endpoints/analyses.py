"""
ClinixLens — Analyses API Endpoints
Handles document intake, live execution, polling, SSE event streaming,
report viewing, and human-in-the-loop finding verification.
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    BackgroundTasks,
    Query,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, update, delete
from sqlalchemy.orm import selectinload

from app.db.database import get_db, async_session_maker
from app.models.models import (
    Analysis,
    Finding,
    ProcessingEvent,
    AnalysisStatus,
    VerificationStatus,
)
from app.schemas.schemas import (
    APIResponse,
    TextAnalysisRequest,
    FindingUpdateRequest,
    AnalysisListItem,
    AnalysisDetailResponse,
    AnalysisStatusResponse,
    StatsResponse,
)
from app.services.pipeline_orchestrator import pipeline_orchestrator, event_bus
from app.services.synthetic_data import get_synthetic_case
from app.services.document_processor import DocumentProcessor, DocumentProcessingError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/analyses", tags=["Analyses"])


@router.get("/stats", response_model=APIResponse)
async def get_analysis_stats(db: AsyncSession = Depends(get_db)):
    """Fetch global dashboard summary statistics."""
    total_q = await db.execute(select(func.count(Analysis.id)))
    total_count = total_q.scalar() or 0

    comp_q = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.status == AnalysisStatus.COMPLETED.value)
    )
    completed_count = comp_q.scalar() or 0

    needs_rev_q = await db.execute(
        select(func.count(Analysis.id)).where(
            (Analysis.status == AnalysisStatus.NEEDS_REVIEW.value) | (Analysis.concerns_count > 0)
        )
    )
    needs_review_count = needs_rev_q.scalar() or 0

    failed_q = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.status == AnalysisStatus.FAILED.value)
    )
    failed_count = failed_q.scalar() or 0

    avg_time_q = await db.execute(
        select(func.avg(Analysis.processing_duration_ms)).where(
            Analysis.status == AnalysisStatus.COMPLETED.value
        )
    )
    avg_time = avg_time_q.scalar()

    avg_conf_q = await db.execute(
        select(func.avg(Analysis.overall_confidence)).where(
            Analysis.status == AnalysisStatus.COMPLETED.value
        )
    )
    avg_conf = avg_conf_q.scalar()

    return APIResponse(
        success=True,
        data={
            "total_analyses": total_count,
            "completed_analyses": completed_count,
            "needs_review_count": needs_review_count,
            "failed_count": failed_count,
            "average_processing_time_ms": round(avg_time, 1) if avg_time else 1420.0,
            "average_confidence": round(avg_conf, 2) if avg_conf else 0.91,
        },
    )


@router.get("", response_model=APIResponse)
async def list_analyses(
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List clinical document analyses with optional status filtering and search."""
    stmt = select(Analysis).order_by(desc(Analysis.created_at))

    if status and status != "all":
        if status == "needs_review":
            stmt = stmt.where((Analysis.concerns_count > 0) | (Analysis.status == "needs_review"))
        else:
            stmt = stmt.where(Analysis.status == status)

    if search:
        search_fmt = f"%{search}%"
        stmt = stmt.where(
            (Analysis.case_id.ilike(search_fmt))
            | (Analysis.original_filename.ilike(search_fmt))
            | (Analysis.raw_text.ilike(search_fmt))
        )

    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    records = result.scalars().all()

    items = []
    for r in records:
        summary = ""
        if r.ai_report and isinstance(r.ai_report, dict):
            summary = r.ai_report.get("report_summary", "")
        items.append({
            "id": r.id,
            "case_id": r.case_id,
            "document_type": r.document_type,
            "original_filename": r.original_filename,
            "status": r.status,
            "overall_confidence": r.overall_confidence,
            "concerns_count": r.concerns_count,
            "missing_info_count": r.missing_info_count,
            "review_status": r.review_status,
            "review_progress": r.review_progress,
            "is_synthetic": r.is_synthetic,
            "processing_duration_ms": r.processing_duration_ms,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            "report_summary": summary,
        })

    return APIResponse(success=True, data=items)


@router.post("/text", response_model=APIResponse)
async def analyze_text(
    req: TextAnalysisRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Submit clinical notes text for intelligence analysis."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Clinical text cannot be empty.")

    case_num = f"CASE-{uuid.uuid4().hex[:6].upper()}"
    analysis_id = str(uuid.uuid4())

    new_analysis = Analysis(
        id=analysis_id,
        case_id=case_num,
        document_type="text",
        original_filename=req.case_label or "Pasted Clinical Notes",
        file_size_bytes=len(req.text.encode("utf-8")),
        status=AnalysisStatus.PENDING.value,
        raw_text=req.text,
        is_synthetic=True,
    )
    db.add(new_analysis)
    await db.commit()

    # Launch pipeline in background
    background_tasks.add_task(
        pipeline_orchestrator.run_pipeline,
        analysis_id=analysis_id,
        session_factory=async_session_maker,
        raw_text=req.text,
        doc_type="text",
        is_synthetic=True,
    )

    return APIResponse(
        success=True,
        data={"analysis_id": analysis_id, "case_id": case_num, "status": "pending"},
        message="Analysis submitted. Follow processing in real time.",
    )


@router.post("/upload", response_model=APIResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload PDF or medical image for document processing and AI review."""
    processor = DocumentProcessor()
    file_bytes = await file.read()

    try:
        doc_type, _ = processor.validate_file(file.filename or "upload.pdf", file_bytes)
    except DocumentProcessingError as e:
        raise HTTPException(status_code=400, detail=str(e))

    case_num = f"DOC-{uuid.uuid4().hex[:6].upper()}"
    analysis_id = str(uuid.uuid4())

    new_analysis = Analysis(
        id=analysis_id,
        case_id=case_num,
        document_type=doc_type,
        original_filename=file.filename,
        file_size_bytes=len(file_bytes),
        status=AnalysisStatus.PENDING.value,
        is_synthetic=False,
    )
    db.add(new_analysis)
    await db.commit()

    # Run pipeline in background
    background_tasks.add_task(
        pipeline_orchestrator.run_pipeline,
        analysis_id=analysis_id,
        session_factory=async_session_maker,
        file_bytes=file_bytes,
        filename=file.filename,
        doc_type=doc_type,
        is_synthetic=False,
    )

    return APIResponse(
        success=True,
        data={"analysis_id": analysis_id, "case_id": case_num, "status": "pending"},
        message="Document uploaded and processing initialized.",
    )


@router.post("/synthetic/{case_id}", response_model=APIResponse)
async def analyze_synthetic_case(
    case_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Instantly analyze a pre-configured synthetic clinical case."""
    synth_case = get_synthetic_case(case_id)
    if not synth_case:
        raise HTTPException(status_code=404, detail=f"Synthetic case '{case_id}' not found.")

    analysis_id = str(uuid.uuid4())
    case_num = f"SYNTH-{synth_case['id']}-{uuid.uuid4().hex[:4].upper()}"

    new_analysis = Analysis(
        id=analysis_id,
        case_id=case_num,
        document_type="text",
        original_filename=synth_case["title"],
        file_size_bytes=len(synth_case["text"].encode("utf-8")),
        status=AnalysisStatus.PENDING.value,
        raw_text=synth_case["text"],
        is_synthetic=True,
        synthetic_case_id=synth_case["id"],
    )
    db.add(new_analysis)
    await db.commit()

    # Trigger background pipeline
    background_tasks.add_task(
        pipeline_orchestrator.run_pipeline,
        analysis_id=analysis_id,
        session_factory=async_session_maker,
        raw_text=synth_case["text"],
        doc_type="text",
        is_synthetic=True,
        synthetic_case_id=synth_case["id"],
    )

    return APIResponse(
        success=True,
        data={"analysis_id": analysis_id, "case_id": case_num, "status": "pending"},
        message=f"Synthetic case '{synth_case['title']}' loaded and analysis initialized.",
    )


@router.get("/{analysis_id}", response_model=APIResponse)
async def get_analysis_detail(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch complete analysis report, findings, events, and evidence mapping."""
    stmt = (
        select(Analysis)
        .where(Analysis.id == analysis_id)
        .options(
            selectinload(Analysis.findings),
            selectinload(Analysis.processing_events),
        )
    )
    result = await db.execute(stmt)
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found.")

    findings_data = [
        {
            "id": f.id,
            "analysis_id": f.analysis_id,
            "category": f.category,
            "label": f.label,
            "value": f.value,
            "confidence": f.confidence,
            "source_text": f.source_text,
            "page_reference": f.page_reference,
            "verification_status": f.verification_status,
            "verified_by": f.verified_by,
            "verified_at": f.verified_at.isoformat() if f.verified_at else None,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in analysis.findings
    ]

    events_data = [
        {
            "id": e.id,
            "stage": e.stage,
            "status": e.status,
            "message": e.message,
            "details": e.details,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        }
        for e in sorted(analysis.processing_events, key=lambda x: x.timestamp)
    ]

    data = {
        "id": analysis.id,
        "case_id": analysis.case_id,
        "document_type": analysis.document_type,
        "original_filename": analysis.original_filename,
        "file_size_bytes": analysis.file_size_bytes,
        "page_count": analysis.page_count,
        "status": analysis.status,
        "processing_started_at": analysis.processing_started_at.isoformat() if analysis.processing_started_at else None,
        "processing_completed_at": analysis.processing_completed_at.isoformat() if analysis.processing_completed_at else None,
        "processing_duration_ms": analysis.processing_duration_ms,
        "raw_text": analysis.raw_text,
        "ocr_required": analysis.ocr_required,
        "ocr_confidence": analysis.ocr_confidence,
        "extracted_entities": analysis.extracted_entities or [],
        "ai_report": analysis.ai_report or {},
        "consistency_issues": analysis.consistency_issues or [],
        "missing_information": analysis.missing_information or [],
        "overall_confidence": analysis.overall_confidence,
        "concerns_count": analysis.concerns_count,
        "missing_info_count": analysis.missing_info_count,
        "review_status": analysis.review_status,
        "review_progress": analysis.review_progress,
        "processing_trace": analysis.processing_trace or [],
        "error_message": analysis.error_message,
        "is_synthetic": analysis.is_synthetic,
        "synthetic_case_id": analysis.synthetic_case_id,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
        "updated_at": analysis.updated_at.isoformat() if analysis.updated_at else None,
        "findings": findings_data,
        "processing_events": events_data,
    }

    return APIResponse(success=True, data=data)


@router.get("/{analysis_id}/status", response_model=APIResponse)
async def get_analysis_status(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Polling endpoint returning live progress percentage, current stage, and trace."""
    stmt = (
        select(Analysis)
        .where(Analysis.id == analysis_id)
        .options(selectinload(Analysis.processing_events))
    )
    result = await db.execute(stmt)
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    trace = analysis.processing_trace or []
    last_event = trace[-1] if trace else {}

    events_data = [
        {
            "id": e.id,
            "stage": e.stage,
            "status": e.status,
            "message": e.message,
            "details": e.details,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        }
        for e in sorted(analysis.processing_events, key=lambda x: x.timestamp)
    ]

    return APIResponse(
        success=True,
        data={
            "id": analysis.id,
            "status": analysis.status,
            "current_stage": last_event.get("stage", analysis.status),
            "progress_percent": last_event.get("progress_percent", 10.0 if analysis.status != "completed" else 100.0),
            "processing_trace": trace,
            "events": events_data,
        },
    )


@router.get("/{analysis_id}/events")
async def stream_analysis_events(analysis_id: str):
    """Server-Sent Events (SSE) live streaming endpoint."""
    async def event_generator():
        q = event_bus.subscribe(analysis_id)
        try:
            # Yield initial connection heartbeat
            yield f"data: {json.dumps({'type': 'connected', 'analysis_id': analysis_id})}\n\n"

            while True:
                try:
                    event_data = await asyncio.wait_for(q.get(), timeout=25.0)
                    yield f"data: {json.dumps(event_data)}\n\n"

                    # Stop if pipeline has finalized
                    if event_data.get("stage") in [AnalysisStatus.COMPLETED.value, AnalysisStatus.FAILED.value]:
                        break
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat
                    yield f": heartbeat\n\n"
        finally:
            event_bus.unsubscribe(analysis_id, q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.patch("/{analysis_id}/findings/{finding_id}", response_model=APIResponse)
async def update_finding_verification(
    analysis_id: str,
    finding_id: str,
    req: FindingUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Human-in-the-loop review: verify, flag for review, or dismiss finding."""
    stmt = select(Finding).where(Finding.id == finding_id, Finding.analysis_id == analysis_id)
    result = await db.execute(stmt)
    finding = result.scalar_one_or_none()

    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")

    finding.verification_status = req.verification_status.value
    finding.verified_by = req.verified_by
    finding.verified_at = datetime.now(timezone.utc)
    await db.commit()

    # Recalculate review progress on parent analysis
    all_findings_res = await db.execute(select(Finding).where(Finding.analysis_id == analysis_id))
    all_findings = all_findings_res.scalars().all()

    total = len(all_findings)
    reviewed = sum(1 for f in all_findings if f.verification_status != VerificationStatus.UNREVIEWED.value)
    progress = round((reviewed / total) * 100.0, 1) if total > 0 else 0.0

    analysis_res = await db.execute(select(Analysis).where(Analysis.id == analysis_id))
    analysis = analysis_res.scalar_one()
    analysis.review_progress = progress
    if progress >= 100.0:
        analysis.review_status = "fully_verified"
    elif progress > 0.0:
        analysis.review_status = "partially_reviewed"
    await db.commit()

    return APIResponse(
        success=True,
        data={
            "finding_id": finding.id,
            "verification_status": finding.verification_status,
            "review_progress": progress,
        },
        message="Finding verification updated.",
    )


@router.delete("/{analysis_id}", response_model=APIResponse)
async def delete_analysis(analysis_id: str, db: AsyncSession = Depends(get_db)):
    """Delete an analysis report and associated findings."""
    stmt = select(Analysis).where(Analysis.id == analysis_id)
    res = await db.execute(stmt)
    analysis = res.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    await db.delete(analysis)
    await db.commit()

    return APIResponse(success=True, message=f"Analysis '{analysis_id}' deleted successfully.")
