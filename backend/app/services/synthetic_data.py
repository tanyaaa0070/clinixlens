"""
ClinixLens — Synthetic Clinical Demonstration Cases
High-fidelity, realistic synthetic clinical data for demonstration and testing.
Strictly synthetic — contains NO real patient data.
"""

from typing import List, Dict, Any

SYNTHETIC_CASES: List[Dict[str, Any]] = [
    {
        "id": "SYNTH-001",
        "title": "Routine Follow-up: Type 2 Diabetes & HTN",
        "category": "Routine",
        "patient_identifier": "SYNTH-PT-8421",
        "patient_name": "Eleanor Vance (Synthetic)",
        "patient_age": "58",
        "patient_gender": "Female",
        "visit_date": "2026-08-14",
        "expected_challenge": "Clear structured note; evaluates baseline extraction accuracy, normal vital parsing, and medication validation.",
        "text": """CLINICAL PROGRESS NOTE — OUTPATIENT ADULT MEDICINE
Patient Name: Eleanor Vance (SYNTHETIC PATIENT)
DOB: 11/04/1967 | Age: 58 | Sex: Female
MRN: SYNTH-842109 | Visit Date: August 14, 2026
Attending Physician: Dr. Marcus Reed, MD | Clinic: Oakridge Medical Associates

CHIEF COMPLAINT:
Follow-up for ongoing management of Type 2 Diabetes Mellitus and Essential Hypertension.

HISTORY OF PRESENT ILLNESS:
Patient is a 58-year-old female presenting for routine 6-month chronic care follow-up. Reports good medication adherence. Denies chest pain, shortness of breath, orthopnea, dizziness, or peripheral edema. Reports mild bilateral numbness in toes at bedtime, stable over past year. Self-monitored fasting blood glucose ranges 110-135 mg/dL. Denies hypoglycemia episodes.

CURRENT MEDICATIONS:
1. Metformin 1000 mg PO BID with meals (Adherent)
2. Lisinopril 20 mg PO daily (Adherent)
3. Atorvastatin 40 mg PO QHS (Adherent)
4. Aspirin 81 mg PO daily

ALLERGIES:
NKDA (No Known Drug Allergies). No food or environmental allergies reported.

VITAL SIGNS:
BP: 128/82 mmHg (Sitting, right arm)
HR: 72 bpm, regular rhythm
RR: 16 breaths/min
Temp: 98.4 F (Oral)
SpO2: 98% on ambient air
Height: 5 ft 5 in (165 cm) | Weight: 168 lbs (76.2 kg) | BMI: 28.0 kg/m2

PHYSICAL EXAMINATION:
- General: Alert, oriented x3, well-nourished, in no acute distress.
- HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive to light.
- Cardiovascular: Regular rate and rhythm, normal S1/S2, no murmurs, rubs, or gallops.
- Pulmonary: Clear to auscultation bilaterally, no wheezes, rales, or rhonchi.
- Abdomen: Soft, non-tender, non-distended, active bowel sounds.
- Extremities: No lower extremity edema. Bilateral pedal pulses 2+ palpable. Monofilament test reveals intact protective sensation with slightly diminished fine touch at distal 1st metatarsals.

ASSESSMENT & DIAGNOSES:
1. Type 2 Diabetes Mellitus without acute complications (E11.9) — HbA1c 7.1% (well-controlled).
2. Essential Hypertension (I10) — blood pressure controlled on Lisinopril.
3. Hyperlipidemia (E78.5) — lipid panel stable on statin therapy.
4. Early mild diabetic peripheral neuropathy (E11.40).

PLAN & RECOMMENDATIONS:
- Continue Metformin 1000 mg BID, Lisinopril 20 mg daily, Atorvastatin 40 mg QHS.
- Repeat comprehensive metabolic panel, HbA1c, and urine microalbumin in 6 months.
- Annual diabetic retinal examination scheduled for September 2026.
- Reinforce Mediterranean diet and 150 minutes weekly aerobic activity.
- Follow up in clinic in 6 months or sooner if symptoms arise.
""",
    },
    {
        "id": "SYNTH-002",
        "title": "Medication Review: Complex Polypharmacy",
        "category": "Medication Review",
        "patient_identifier": "SYNTH-PT-3104",
        "patient_name": "Arthur Pendelton (Synthetic)",
        "patient_age": "76",
        "patient_gender": "Male",
        "visit_date": "2026-07-22",
        "expected_challenge": "Multiple overlapping cardio-renal medications, dosage reconciliation, and potential drug interaction review.",
        "text": """GERIATRIC CLINICAL CONSULTATION NOTE
Patient: Arthur Pendelton (SYNTHETIC PATIENT)
Age: 76 | Gender: Male | MRN: SYNTH-310488
Date of Evaluation: July 22, 2026
Consulting Physician: Dr. Sarah Lin, MD, FACP | Division of Geriatric Medicine

REASON FOR CONSULTATION:
Comprehensive medication reconciliation and polypharmacy evaluation following recent episode of near-syncope at home.

CLINICAL NARRATIVE:
76-year-old male with history of coronary artery disease s/p PCI (2021), chronic heart failure with preserved ejection fraction (HFpEF, EF 52%), stage 3a chronic kidney disease, atrial fibrillation, and benign prostatic hyperplasia. Patient's daughter notes he takes 9 different daily prescription medications and experienced lightheadedness upon standing three days ago.

CURRENT RECONCILED MEDICATIONS:
1. Apixaban 5 mg PO BID (Anticoagulation for non-valvular Afib)
2. Carvedilol 12.5 mg PO BID
3. Furosemide 40 mg PO every morning
4. Spironolactone 25 mg PO daily
5. Losartan 50 mg PO daily
6. Atorvastatin 80 mg PO QHS
7. Tamsulosin 0.4 mg PO QHS
8. Finasteride 5 mg PO daily
9. Omeprazole 20 mg PO daily (takes continuously for >4 years)

ALLERGIES:
Codeine — reported severe nausea and hives in 2015.

OBJECTIVE VITALS & LABS:
- Supine BP: 114/70 mmHg, HR: 62 bpm
- Standing BP (3 min): 96/60 mmHg (Drop of 18 mmHg systolic - positive for orthostatic hypotension), HR: 74 bpm
- Temp: 97.9 F | RR: 14 breaths/min | SpO2: 96% room air
- Recent Labs (07/20/2026): Serum Creatinine 1.62 mg/dL (eGFR 44 mL/min/1.73m2), Serum Potassium 5.1 mEq/L (borderline high), BUN 28 mg/dL.

ASSESSMENT & FINDINGS:
1. Symptomatic Orthostatic Hypotension: Exacerbated by concurrent antihypertensives, Furosemide diuresis, and alpha-blocker (Tamsulosin).
2. Hyperkalemia Risk: Dual RAAS blockade and potassium-sparing effect from Losartan 50 mg plus Spironolactone 25 mg in setting of stage 3a CKD (eGFR 44).
3. Prolonged PPI therapy: Long-term Omeprazole without active peptic ulcer documentation.
4. Fall Risk: Elevated due to orthostasis and polypharmacy.

PLAN:
- Reduce Furosemide to 20 mg daily; monitor weight daily (call if weight drops >3 lbs or rises >4 lbs).
- Hold Spironolactone temporarily; repeat basic metabolic panel in 10 days to reassess potassium.
- Educate on postural transitions and compression stockings.
- Taper Omeprazole towards H2 blocker trial.
""",
    },
    {
        "id": "SYNTH-003",
        "title": "Emergency Department Encounter: Acute Dyspnea & Chest Discomfort",
        "category": "Emergency Visit",
        "patient_identifier": "SYNTH-PT-9012",
        "patient_name": "David Ramirez (Synthetic)",
        "patient_age": "49",
        "patient_gender": "Male",
        "visit_date": "2026-09-02",
        "expected_challenge": "Acute triage documentation, urgent abnormal vitals (hypoxemia, tachycardia), and diagnostic ruling out of acute coronary syndrome vs PE.",
        "text": """EMERGENCY DEPARTMENT CLINICAL SUMMARY
Patient: David Ramirez (SYNTHETIC PATIENT)
Age: 49 | Gender: Male | Record #: SYNTH-901231
Arrival Time: 09/02/2026 03:14 AM | Triage Level: ESI Level 2 (High Acuity)
Attending Physician: Dr. Helena Vance, MD | ED Service

CHIEF COMPLAINT:
Sudden onset shortness of breath and pleuritic right-sided chest pain starting 3 hours prior to arrival.

HPI:
49-year-old male with history of obesity and recent right knee arthroscopy 10 days ago presents via EMS with sudden acute dyspnea and sharp right chest discomfort worsened with deep inspiration. Pain rated 7/10. Patient admits to prolonged bed rest over the last week following orthopedic surgery. Denies productive cough, fever, or prior DVT history.

EMERGENCY VITALS:
- BP: 146/92 mmHg
- HR: 118 bpm (Sinus tachycardia on bedside telemetry)
- RR: 26 breaths/min (Tachypneic, accessory muscle use noted)
- SpO2: 91% on room air -> placed on 3L nasal cannula with improvement to 95%
- Temp: 99.1 F oral

PHYSICAL FINDINGS:
- Respiratory: Tachypneic, shallow breathing. Decreased breath sounds at right lung base.
- Cardiovascular: Tachycardic, regular rhythm, prominent P2 component. No murmurs.
- Right Lower Extremity: Mild right calf swelling and tenderness on palpation, circumference +2.5 cm compared to left.

EMERGENCY DIAGNOSTICS:
- 12-Lead ECG: Sinus tachycardia at 116 bpm, S1Q3T3 pattern with T-wave inversions in V1-V3.
- High-sensitivity Troponin I: 22 ng/L (mild elevation, reference <14 ng/L).
- D-Dimer: 1,840 ng/mL FEU (Markedly elevated).
- Bedside Venous Duplex: Non-compressible right popliteal vein consistent with acute Deep Vein Thrombosis.

ALLERGIES:
Penicillin (Rash in childhood).

DIAGNOSIS:
1. Acute Pulmonary Embolism with right ventricular strain pattern (I26.92) — Submassive.
2. Acute Deep Vein Thrombosis of right lower extremity (I82.431).
3. Recent postoperative status post right knee arthroscopy.

IMMEDIATE MANAGEMENT:
- Oxygen therapy titrated to SpO2 >94%.
- Weight-based Enoxaparin sodium 1 mg/kg subcutaneous administered stat at 04:10 AM.
- Urgent CTA Chest (PE protocol) ordered.
- Pulmonary Embolism Response Team (PERT) notified.
- Transfer to Intensive Care Unit for continuous hemodynamic monitoring.
""",
    },
    {
        "id": "SYNTH-004",
        "title": "Incomplete Clinical Note: Urgent Care Drop-in",
        "category": "Incomplete",
        "patient_identifier": "SYNTH-PT-5520",
        "patient_name": "Jordan Casey (Synthetic)",
        "patient_age": "Unknown",
        "patient_gender": "Unknown",
        "visit_date": "Not Recorded",
        "expected_challenge": "Tests Missing Information Map and confidence scoring: note lacks patient age, gender, date, vital signs, allergy check, and precise dosage details.",
        "text": """URGENT CARE RAPID ENCOUNTER
Patient: Jordan Casey (SYNTHETIC PATIENT)
Clinic: CityCare Express Walk-in Clinic
Provider: Nurse Practitioner Staff

CC: Sore throat and fever x 3 days.

Notes:
Patient came in complaining of painful swallowing, bilateral swollen glands, and low grade fever starting Tuesday. Missed work yesterday. Also has intermittent dry cough and headache.

Exam:
Throat shows erythematous posterior pharynx with tonsillar exudate. Cervical lymphadenopathy present.
Lungs clear.

Rapid Strep: Positive.

Rx:
- Amoxicillin (no dose recorded in chart, prescribed electronic)
- Ibuprofen OTC for pain

Plan:
Finish all antibiotics. Return if difficulty breathing or unable to swallow fluids.
""",
    },
    {
        "id": "SYNTH-005",
        "title": "Conflicting Documentation: Post-Op Discharge",
        "category": "Conflicting",
        "patient_identifier": "SYNTH-PT-7719",
        "patient_name": "Margaret Thorne (Synthetic)",
        "patient_age": "64 (Header) vs 46 (HPI)",
        "patient_gender": "Female",
        "visit_date": "2026-06-15",
        "expected_challenge": "Tests Consistency Radar: conflicting patient age (64 vs 46), documented severe penicillin allergy yet Amoxicillin-Clavulanate listed in discharge meds, conflicting BP values (122/78 vs 174/102).",
        "text": """HOSPITAL SURGICAL DISCHARGE SUMMARY
Patient: Margaret Thorne (SYNTHETIC PATIENT)
Age: 64 | Gender: Female | MRN: SYNTH-771902
Admission Date: June 12, 2026 | Discharge Date: June 15, 2026
Service: General Surgery

ALLERGIES & CONTRAINDICATIONS:
*** SEVERE ALLERGY: PENICILLIN (Anaphylaxis - Intubated in 2018) ***
NKFA (No Known Food Allergies)

HOSPITAL COURSE & CLINICAL NARRATIVE:
Patient is a 46-year-old female who was admitted for laparoscopic cholecystectomy due to symptomatic cholelithiasis. Procedure performed without acute intraoperative complications. Recovery on floor was uneventful.

DISCHARGE PHYSICAL & VITALS:
At 08:00 AM nursing check: BP 122/78 mmHg, HR 70 bpm, Temp 98.6 F.
At 10:30 AM discharge exam note: BP 174/102 mmHg, HR 96 bpm, patient anxious about home care. Note says "Vitals completely stable and within normal limits."

DISCHARGE MEDICATIONS:
1. Augmentin (Amoxicillin-Clavulanate) 875/125 mg PO BID x 7 days
2. Acetaminophen 500 mg PO Q6H PRN pain
3. Docusate sodium 100 mg PO BID
4. Lisinopril 10 mg PO daily (Patient history mentions no hypertension diagnosis)

DISCHARGE INSTRUCTIONS:
No heavy lifting >10 lbs for 2 weeks. Follow up with surgical clinic in 10 days.
""",
    },
    {
        "id": "SYNTH-006",
        "title": "Scanned Handwritten Progress Note: Field Clinic",
        "category": "Scanned / Handwritten",
        "patient_identifier": "SYNTH-PT-1108",
        "patient_name": "Samuel K. Miller (Synthetic)",
        "patient_age": "52",
        "patient_gender": "Male",
        "visit_date": "2026-08-01",
        "expected_challenge": "Simulates realistic OCR extraction with medical abbreviations (SOB, NKA, BID, PRN, QHS, Hx, WNL), handwritten noise markers, and OCR confidence variations.",
        "text": """[DOCUMENT SOURCE: Transcribed from Scanned Handwritten Clinical Encounter Slip]
[OCR Confidence: 78.4% | Provider Note: Semi-legible cursive script]

Pt: Samuel K. Miller (SYNTHETIC)
Age: 52 yo M | DOB: 03/19/1974 | Date: 08/01/26
Clinic: Community Outreach Health Van

S/O:
Pt presents c/o persistent cough x 2 wks, productive of whitish sputum. Occasional night sweats.
Denies hemoptysis. Mild SOB on climbing stairs. Hx of mild asthma in childhood.
Smoker: 1/2 ppd x 20 yrs.

Vitals:
BP 132/86 | P 84 reg | T 99.2 F | R 18 | SpO2 96% on room air

O/E:
Lungs: scattered expiratory wheezes, Rt base slightly coarse. No stridor.
Cor: S1 S2 wnl.
Abdo: soft, nontender.

Allergies:
Sulfa drugs -> rash.

Assessment:
1. Subacute bronchitis vs atypical respiratory infection.
2. Tobacco use disorder.
3. Rule out chronic obstructive component.

Rx / Plan:
1. Albuterol HFA 90 mcg 2 puffs Q4-6H PRN wheezing / SOB.
2. Azithromycin 250 mg: 500 mg Day 1, then 250 mg daily Days 2-5 (Z-pack).
3. Chest X-ray PA & Lateral ordered.
4. Smoking cessation counseling provided.
5. RTC in 1 wk if fever > 101 F or worsening dyspnea.
""",
    },
]


def get_synthetic_case(case_id: str) -> Dict[str, Any]:
    """Retrieve synthetic case by ID."""
    for case in SYNTHETIC_CASES:
        if case["id"] == case_id:
            return case
    return None


def get_all_synthetic_cases() -> List[Dict[str, Any]]:
    """Retrieve all synthetic demo cases."""
    return SYNTHETIC_CASES
