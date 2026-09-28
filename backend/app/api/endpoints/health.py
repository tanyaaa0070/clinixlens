"""
ClinixLens — Health and System Status API Endpoints
"""

import time
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.core.config import settings
from app.services.ai_service import ai_service
from app.services.ocr_service import ocr_service
from app.schemas.schemas import HealthResponse

router = APIRouter(tags=["Health"])

START_TIME = time.time()


@router.get("/health", response_model=HealthResponse)
@router.get("/api/v1/health", response_model=HealthResponse)
async def check_health(db: AsyncSession = Depends(get_db)):
    """System health check and component operational status."""
    # Check DB connectivity
    db_status = "Connected (SQLite)" if settings.is_sqlite else "Connected (PostgreSQL)"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"Degraded: {str(e)[:50]}"

    # Check AI Engine
    ai_status = f"Google Gemini ({settings.gemini_model}) - Online" if ai_service.is_available else "Deterministic Intelligence Engine - Online (Fallback Ready)"

    # Check OCR
    ocr_status = f"Google Cloud Vision API - Active" if ocr_service.is_available() else "PyMuPDF Document Parser - Active"

    return HealthResponse(
        status="healthy",
        version="1.0.0",
        ai_engine=ai_status,
        database=db_status,
        ocr_service=ocr_status,
        uptime_seconds=round(time.time() - START_TIME, 2),
    )
