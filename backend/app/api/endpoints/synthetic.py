"""
ClinixLens — Synthetic Case Studio API Endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.synthetic_data import get_all_synthetic_cases, get_synthetic_case
from app.schemas.schemas import APIResponse

router = APIRouter(prefix="/api/v1/synthetic", tags=["Synthetic Studio"])


@router.get("/cases", response_model=APIResponse)
async def list_synthetic_cases():
    """List all pre-configured synthetic clinical demo cases."""
    cases = get_all_synthetic_cases()
    return APIResponse(
        success=True,
        data=cases,
        message=f"Retrieved {len(cases)} synthetic clinical demonstration cases.",
    )


@router.get("/cases/{case_id}", response_model=APIResponse)
async def get_case_detail(case_id: str):
    """Retrieve details for a single synthetic case."""
    case = get_synthetic_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Synthetic case '{case_id}' not found.")
    return APIResponse(
        success=True,
        data=case,
    )
