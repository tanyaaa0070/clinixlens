"""
ClinixLens — Consistency & Validation Service
Detects inconsistencies, missing information, and validates document quality.
Operates on extracted structured data — independent of the AI model.
"""
from typing import List, Dict, Any, Optional
from app.schemas.schemas import (
    StructuredClinicalReport,
    InconsistencyItem,
    MissingInfoItem,
)
import re
import logging

logger = logging.getLogger(__name__)


class ConsistencyService:
    """
    Analyzes structured clinical data for potential inconsistencies
    and document completeness. This is a rule-based engine that
    supplements the AI analysis.
    """

    # Categories expected in a complete clinical document
    COMPLETENESS_CATEGORIES = {
        "patient_information": {
            "label": "Patient Information",
            "fields": ["name", "age", "gender", "patient_id", "date_of_visit"],
            "importance": "high",
        },
        "symptoms": {
            "label": "Symptoms",
            "importance": "high",
        },
        "diagnoses": {
            "label": "Diagnosis",
            "importance": "high",
        },
        "medications": {
            "label": "Medications",
            "importance": "medium",
        },
        "vitals": {
            "label": "Vital Signs",
            "fields": ["blood_pressure", "heart_rate", "temperature"],
            "importance": "medium",
        },
        "allergies": {
            "label": "Allergies",
            "importance": "medium",
        },
        "observations": {
            "label": "Clinical Observations",
            "importance": "low",
        },
    }

    def analyze_consistency(self, report: StructuredClinicalReport) -> List[Dict[str, Any]]:
        """Run all consistency checks and return found issues."""
        issues = []

        issues.extend(self._check_age_consistency(report))
        issues.extend(self._check_medication_consistency(report))
        issues.extend(self._check_vital_signs_consistency(report))
        issues.extend(self._check_diagnosis_symptom_alignment(report))
        issues.extend(self._check_duplicate_entries(report))

        return issues

    def analyze_completeness(self, report: StructuredClinicalReport) -> List[Dict[str, Any]]:
        """Analyze information completeness across expected categories."""
        completeness = []

        # Patient Information
        pi = report.patient_information
        pi_fields_present = sum(1 for v in [pi.name, pi.age, pi.gender, pi.patient_id, pi.date_of_visit] if v)
        pi_total = 5
        if pi_fields_present == pi_total:
            status = "available"
        elif pi_fields_present > 0:
            status = "partial"
        else:
            status = "missing"
        
        completeness.append({
            "category": "Patient Information",
            "status": status,
            "available_count": pi_fields_present,
            "total_expected": pi_total,
            "details": self._get_patient_info_details(pi),
        })

        # Symptoms
        completeness.append({
            "category": "Symptoms",
            "status": "available" if report.symptoms else "missing",
            "available_count": len(report.symptoms),
            "total_expected": None,
            "details": [s.label for s in report.symptoms] if report.symptoms else ["No symptoms documented"],
        })

        # Diagnoses
        completeness.append({
            "category": "Diagnosis",
            "status": "available" if report.diagnoses else "missing",
            "available_count": len(report.diagnoses),
            "total_expected": None,
            "details": [d.label for d in report.diagnoses] if report.diagnoses else ["No diagnoses documented"],
        })

        # Medications
        completeness.append({
            "category": "Medications",
            "status": "available" if report.medications else "missing",
            "available_count": len(report.medications),
            "total_expected": None,
            "details": [m.name for m in report.medications] if report.medications else ["No medications documented"],
        })

        # Vitals
        vitals = report.vitals
        vital_fields = [vitals.blood_pressure, vitals.heart_rate, vitals.temperature,
                       vitals.respiratory_rate, vitals.oxygen_saturation, vitals.weight]
        vitals_present = sum(1 for v in vital_fields if v)
        if vitals_present >= 4:
            v_status = "available"
        elif vitals_present > 0:
            v_status = "partial"
        else:
            v_status = "missing"
        
        completeness.append({
            "category": "Vital Signs",
            "status": v_status,
            "available_count": vitals_present,
            "total_expected": 6,
            "details": self._get_vitals_details(vitals),
        })

        # Allergies
        completeness.append({
            "category": "Allergies",
            "status": "available" if report.allergies else "missing",
            "available_count": len(report.allergies),
            "total_expected": None,
            "details": [a.label for a in report.allergies] if report.allergies else ["No allergies documented"],
        })

        # Observations
        completeness.append({
            "category": "Clinical Observations",
            "status": "available" if report.clinical_observations else "missing",
            "available_count": len(report.clinical_observations),
            "total_expected": None,
            "details": [o.label for o in report.clinical_observations] if report.clinical_observations else ["No observations documented"],
        })

        return completeness

    def calculate_consistency_score(self, issues: List[Dict[str, Any]]) -> float:
        """Calculate a document consistency score based on issues found."""
        if not issues:
            return 1.0

        severity_weights = {"high": 0.15, "medium": 0.08, "low": 0.03}
        total_penalty = 0.0
        for issue in issues:
            severity = issue.get("severity", "medium")
            total_penalty += severity_weights.get(severity, 0.05)

        score = max(0.0, 1.0 - total_penalty)
        return round(score, 2)

    # ---- Internal consistency checks ----

    def _check_age_consistency(self, report: StructuredClinicalReport) -> List[Dict[str, Any]]:
        """Check for age-related inconsistencies."""
        issues = []
        age_str = report.patient_information.age
        if not age_str:
            return issues

        # Extract numeric age
        age_match = re.search(r'(\d+)', str(age_str))
        if not age_match:
            return issues
        age = int(age_match.group(1))

        # Check pediatric medications given to adults or vice versa
        pediatric_indicators = ["pediatric", "infant", "child", "neonatal"]
        geriatric_indicators = ["geriatric", "elderly"]

        for med in report.medications:
            med_lower = (med.name or "").lower()
            if age > 18:
                for indicator in pediatric_indicators:
                    if indicator in med_lower:
                        issues.append({
                            "description": f"Pediatric medication '{med.name}' prescribed to {age}-year-old patient",
                            "evidence_a": f"Patient age: {age_str}",
                            "evidence_b": f"Medication: {med.name}",
                            "explanation": "This medication is typically indicated for pediatric use",
                            "severity": "medium",
                        })

        return issues

    def _check_medication_consistency(self, report: StructuredClinicalReport) -> List[Dict[str, Any]]:
        """Check for medication-related inconsistencies."""
        issues = []

        # Check for potential duplicate medications
        med_names = [m.name.lower().strip() for m in report.medications if m.name]
        seen = set()
        for name in med_names:
            if name in seen:
                issues.append({
                    "description": f"Medication '{name}' appears to be listed multiple times",
                    "evidence_a": f"First occurrence: {name}",
                    "evidence_b": f"Duplicate occurrence: {name}",
                    "explanation": "Duplicate medication entries may indicate a documentation error",
                    "severity": "medium",
                })
            seen.add(name)

        # Check allergy vs medication conflicts including clinical drug-class cross-reactivity
        drug_class_cross_reactions = {
            "penicillin": ["penicillin", "amoxicillin", "augmentin", "ampicillin", "piperacillin", "amoxil"],
            "sulfa": ["sulfa", "sulfamethoxazole", "bactrim", "septra", "sulfasalazine"],
            "codeine": ["codeine", "morphine", "oxycodone", "hydrocodone"],
            "aspirin": ["aspirin", "ibuprofen", "naproxen", "nsaid", "ketorolac", "meloxicam"],
        }

        allergy_names = [a.label.lower().strip() for a in report.allergies if a.label]
        for med in report.medications:
            med_lower = (med.name or "").lower().strip()
            for allergy in allergy_names:
                conflict_found = False

                # Direct match
                if allergy in med_lower or med_lower in allergy:
                    conflict_found = True

                # Cross-reactivity class check
                for class_key, related_drugs in drug_class_cross_reactions.items():
                    if class_key in allergy:
                        if any(drug in med_lower for drug in related_drugs):
                            conflict_found = True
                            break

                if conflict_found:
                    issues.append({
                        "description": f"Medication '{med.name}' may conflict with documented allergy to '{allergy}'",
                        "evidence_a": f"Allergy: {allergy}",
                        "evidence_b": f"Medication: {med.name}",
                        "explanation": "A documented allergy or known cross-reactive drug class overlaps with a prescribed medication. Requires clinical verification.",
                        "severity": "high",
                    })

        return issues

    def _check_vital_signs_consistency(self, report: StructuredClinicalReport) -> List[Dict[str, Any]]:
        """Check for vital signs that seem outside normal ranges."""
        issues = []
        vitals = report.vitals

        # Check heart rate
        if vitals.heart_rate:
            hr_match = re.search(r'(\d+)', str(vitals.heart_rate))
            if hr_match:
                hr = int(hr_match.group(1))
                if hr < 30 or hr > 200:
                    issues.append({
                        "description": f"Heart rate of {hr} bpm is significantly outside normal range",
                        "evidence_a": f"Documented heart rate: {vitals.heart_rate}",
                        "evidence_b": "Expected range: 60-100 bpm",
                        "explanation": "This value may indicate a documentation error or critical condition requiring verification",
                        "severity": "high" if (hr < 30 or hr > 180) else "medium",
                    })

        # Check temperature
        if vitals.temperature:
            temp_match = re.search(r'(\d+\.?\d*)', str(vitals.temperature))
            if temp_match:
                temp = float(temp_match.group(1))
                # Handle both F and C
                if temp > 50:  # Likely Fahrenheit
                    if temp < 90 or temp > 110:
                        issues.append({
                            "description": f"Temperature of {temp}°F is significantly outside normal range",
                            "evidence_a": f"Documented temperature: {vitals.temperature}",
                            "evidence_b": "Expected range: 97-100.4°F",
                            "explanation": "This value may indicate a documentation error",
                            "severity": "medium",
                        })
                else:  # Likely Celsius
                    if temp < 32 or temp > 43:
                        issues.append({
                            "description": f"Temperature of {temp}°C is significantly outside normal range",
                            "evidence_a": f"Documented temperature: {vitals.temperature}",
                            "evidence_b": "Expected range: 36.1-37.2°C",
                            "explanation": "This value may indicate a documentation error",
                            "severity": "medium",
                        })

        return issues

    def _check_diagnosis_symptom_alignment(self, report: StructuredClinicalReport) -> List[Dict[str, Any]]:
        """Basic check that diagnoses have some related symptoms."""
        issues = []

        if report.diagnoses and not report.symptoms:
            issues.append({
                "description": "Diagnoses are listed but no symptoms are documented",
                "evidence_a": f"Diagnoses: {', '.join(d.label for d in report.diagnoses[:3])}",
                "evidence_b": "Symptoms: None documented",
                "explanation": "Clinical diagnoses typically have associated symptoms. The absence of documented symptoms may indicate incomplete documentation.",
                "severity": "low",
            })

        return issues

    def _check_duplicate_entries(self, report: StructuredClinicalReport) -> List[Dict[str, Any]]:
        """Check for duplicate entries across categories."""
        issues = []

        # Check duplicate symptoms
        symptom_labels = [s.label.lower().strip() for s in report.symptoms if s.label]
        seen = set()
        for label in symptom_labels:
            if label in seen:
                issues.append({
                    "description": f"Symptom '{label}' appears to be documented multiple times",
                    "evidence_a": f"First occurrence: {label}",
                    "evidence_b": f"Duplicate: {label}",
                    "explanation": "Duplicate entries may affect analysis accuracy",
                    "severity": "low",
                })
            seen.add(label)

        return issues

    def _get_patient_info_details(self, pi) -> List[str]:
        details = []
        if pi.name: details.append(f"Name: {pi.name}")
        else: details.append("Name: Not documented")
        if pi.age: details.append(f"Age: {pi.age}")
        else: details.append("Age: Not documented")
        if pi.gender: details.append(f"Gender: {pi.gender}")
        else: details.append("Gender: Not documented")
        if pi.patient_id: details.append(f"Patient ID: {pi.patient_id}")
        else: details.append("Patient ID: Not documented")
        if pi.date_of_visit: details.append(f"Date of Visit: {pi.date_of_visit}")
        else: details.append("Date of Visit: Not documented")
        return details

    def _get_vitals_details(self, vitals) -> List[str]:
        details = []
        if vitals.blood_pressure: details.append(f"BP: {vitals.blood_pressure}")
        else: details.append("Blood Pressure: Not documented")
        if vitals.heart_rate: details.append(f"HR: {vitals.heart_rate}")
        else: details.append("Heart Rate: Not documented")
        if vitals.temperature: details.append(f"Temp: {vitals.temperature}")
        else: details.append("Temperature: Not documented")
        if vitals.respiratory_rate: details.append(f"RR: {vitals.respiratory_rate}")
        else: details.append("Respiratory Rate: Not documented")
        if vitals.oxygen_saturation: details.append(f"SpO2: {vitals.oxygen_saturation}")
        else: details.append("SpO2: Not documented")
        if vitals.weight: details.append(f"Weight: {vitals.weight}")
        else: details.append("Weight: Not documented")
        return details


# Singleton
consistency_service = ConsistencyService()
