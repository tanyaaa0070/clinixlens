"""
ClinixLens — Pipeline, Consistency Radar & Extractor Unit Tests
"""

import pytest
import io
import fitz
from app.services.document_processor import DocumentProcessor, DocumentProcessingError
from app.services.consistency_service import consistency_service
from app.services.deterministic_extractor import deterministic_extractor
from app.schemas.schemas import (
    StructuredClinicalReport,
    PatientInformation,
    ClinicalEntity,
    MedicationInfo,
    VitalSigns,
)


@pytest.fixture
def doc_processor():
    return DocumentProcessor()


@pytest.mark.asyncio
async def test_process_text(doc_processor):
    sample_text = "Patient has fever and dry cough for 3 days."
    res = await doc_processor.process_text(sample_text)
    assert res.file_type == "text"
    assert "fever and dry cough" in res.extracted_text
    assert res.ocr_required is False


@pytest.mark.asyncio
async def test_process_pdf_digital(doc_processor):
    # Generate a digital test PDF in memory
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "CLINICAL SUMMARY: Patient presents with chest pain and dyspnea.")
    pdf_bytes = doc.tobytes()
    doc.close()

    res = await doc_processor.process_pdf(pdf_bytes, "test_digital.pdf")
    assert res.file_type == "pdf"
    assert res.page_count == 1
    assert "chest pain" in res.extracted_text


def test_consistency_radar_allergy_conflict():
    """Verify Consistency Radar flags penicillin allergy with amoxicillin prescription."""
    report = StructuredClinicalReport(
        report_summary="Test report with penicillin contraindication",
        patient_information=PatientInformation(name="John Doe", age="45"),
        symptoms=[],
        diagnoses=[ClinicalEntity(category="diagnosis", label="Sinusitis")],
        medications=[MedicationInfo(name="Amoxicillin-Clavulanate", dosage="875 mg", frequency="BID")],
        vitals=VitalSigns(blood_pressure="120/80 mmHg", heart_rate="72 bpm"),
        allergies=[ClinicalEntity(category="allergy", label="Penicillin", value="Anaphylaxis")],
        clinical_observations=[],
        clinical_concerns=[],
        missing_information=[],
        potential_inconsistencies=[],
        requires_review=[],
        overall_confidence=0.9,
        document_quality_score=0.7,
    )

    issues = consistency_service.analyze_consistency(report)
    assert len(issues) > 0
    assert any("allergy" in i["description"].lower() for i in issues)
    score = consistency_service.calculate_consistency_score(issues)
    assert score < 1.0


def test_completeness_map_missing_vitals():
    """Verify Completeness Map detects missing vitals."""
    report = StructuredClinicalReport(
        report_summary="Report without documented vitals",
        patient_information=PatientInformation(name="Jane Doe"),
        symptoms=[ClinicalEntity(category="symptom", label="Cough")],
        diagnoses=[],
        medications=[],
        vitals=VitalSigns(),  # Empty vitals
        allergies=[],
        clinical_observations=[],
        clinical_concerns=[],
        missing_information=[],
        potential_inconsistencies=[],
        requires_review=[],
        overall_confidence=0.7,
        document_quality_score=0.6,
    )

    completeness = consistency_service.analyze_completeness(report)
    vitals_entry = next((c for c in completeness if c["category"] == "Vital Signs"), None)
    assert vitals_entry is not None
    assert vitals_entry["status"] == "missing"


def test_deterministic_extractor_pipeline():
    """Verify offline fallback extractor generates full Pydantic report."""
    clinical_text = """
    Patient: Margaret Thorne | Age: 64 yo | Female | Date: 06/15/2026
    Vitals: BP 122/78 mmHg, HR 70 bpm, Temp 98.6 F.
    Allergies: Penicillin (Anaphylaxis).
    Medications: Augmentin 875/125 mg PO BID, Lisinopril 10 mg PO daily.
    Diagnosis: Symptomatic Cholelithiasis s/p Cholecystectomy.
    """
    report = deterministic_extractor.extract(clinical_text)
    assert isinstance(report, StructuredClinicalReport)
    assert report.patient_information.name is not None
    assert report.patient_information.age == "64"
    assert len(report.medications) >= 1
    assert len(report.allergies) >= 1
    # Should flag the Augmentin vs Penicillin conflict
    assert len(report.potential_inconsistencies) >= 1
