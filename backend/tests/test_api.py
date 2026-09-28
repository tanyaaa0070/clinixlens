"""
ClinixLens — Backend API & Pipeline Automated Test Suite
Covers: health checks, text input, validation, synthetic cases, error states, and persistence.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.database import init_db, close_db


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    yield
    await close_db()


@pytest.mark.asyncio
async def test_health_endpoint():
    """Verify health endpoint returns 200 with engine & database statuses."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "ai_engine" in data
        assert "database" in data


@pytest.mark.asyncio
async def test_list_synthetic_cases():
    """Verify prebuilt synthetic demo cases are accessible."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/synthetic/cases")
        assert response.status_code == 200
        res = response.json()
        assert res["success"] is True
        assert len(res["data"]) >= 6


@pytest.mark.asyncio
async def test_submit_empty_text_validation():
    """Verify empty text input is rejected with 422/400 validation error."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/analyses/text", json={"text": "   "})
        assert response.status_code in [400, 422]


@pytest.mark.asyncio
async def test_text_analysis_flow():
    """Test text submission, status check, and report retrieval."""
    clinical_note = """
    Patient: Harold Finch | Age: 61 | Male | Date: 2026-08-10
    CC: Routine follow up for hypertension.
    Vitals: BP 130/84 mmHg, HR 74 bpm, Temp 98.4 F, SpO2 98%.
    Medications: Lisinopril 20 mg PO daily.
    Allergies: NKDA.
    Assessment: Essential Hypertension (I10). Controlled.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Submit
        create_res = await ac.post("/api/v1/analyses/text", json={"text": clinical_note})
        assert create_res.status_code == 200
        data = create_res.json()["data"]
        analysis_id = data["analysis_id"]

        # Check status
        status_res = await ac.get(f"/api/v1/analyses/{analysis_id}/status")
        assert status_res.status_code == 200
        assert status_res.json()["success"] is True

        # Check report detail
        detail_res = await ac.get(f"/api/v1/analyses/{analysis_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()["data"]
        assert detail["id"] == analysis_id


@pytest.mark.asyncio
async def test_unsupported_file_upload():
    """Verify unsupported file formats are rejected."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        files = {"file": ("malicious.exe", b"binarycontent", "application/octet-stream")}
        response = await ac.post("/api/v1/analyses/upload", files=files)
        assert response.status_code == 400
        assert "unsupported" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_synthetic_case_trigger():
    """Verify synthetic case execution creates analysis and persists."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/analyses/synthetic/SYNTH-001")
        assert response.status_code == 200
        data = response.json()["data"]
        assert "analysis_id" in data
