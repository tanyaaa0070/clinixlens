"""
ClinixLens — Clinical Intelligence Workspace Backend API
Main FastAPI Application Entrypoint
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.database import init_db, close_db, async_session_maker
from app.api.endpoints import health, synthetic, analyses
from app.services.synthetic_data import get_synthetic_case
from app.services.pipeline_orchestrator import pipeline_orchestrator
from app.models.models import Analysis
from sqlalchemy import select, func

# Setup logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("clinixlens")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    logger.info("Initializing ClinixLens database...")
    await init_db()
    logger.info("Database initialized successfully.")

    # Seed initial demo cases if database is completely empty
    async with async_session_maker() as session:
        count_res = await session.execute(select(func.count(Analysis.id)))
        count = count_res.scalar() or 0
        if count == 0:
            logger.info("Seeding initial synthetic demonstration analyses...")
            demo_cases = ["SYNTH-001", "SYNTH-005"]
            for cid in demo_cases:
                c = get_synthetic_case(cid)
                if c:
                    try:
                        import uuid
                        analysis_id = str(uuid.uuid4())
                        case_num = f"{c['id']}-DEMO"
                        new_analysis = Analysis(
                            id=analysis_id,
                            case_id=case_num,
                            document_type="text",
                            original_filename=c["title"],
                            file_size_bytes=len(c["text"].encode()),
                            status="pending",
                            raw_text=c["text"],
                            is_synthetic=True,
                            synthetic_case_id=c["id"],
                        )
                        session.add(new_analysis)
                        await session.commit()

                        # Run orchestrator synchronously during seed
                        await pipeline_orchestrator.run_pipeline(
                            analysis_id=analysis_id,
                            session_factory=async_session_maker,
                            raw_text=c["text"],
                            doc_type="text",
                            is_synthetic=True,
                            synthetic_case_id=c["id"],
                        )
                    except Exception as ex:
                        logger.warning(f"Error seeding demo case {cid}: {ex}")

    yield

    logger.info("Shutting down ClinixLens database connection...")
    await close_db()


app = FastAPI(
    title="ClinixLens — Clinical Intelligence Workspace API",
    description="Production-grade API for clinical document processing, OCR, AI clinical review, consistency radar, and evidence-linked intelligence.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Register Routers
app.include_router(health.router)
app.include_router(synthetic.router)
app.include_router(analyses.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all unhandled exception handler returning consistent JSON format."""
    logger.error(f"Global unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal Server Error",
            "message": str(exc) if settings.debug else "An unexpected error occurred during processing.",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.app_host, port=settings.app_port, reload=True)
