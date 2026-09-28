# ClinixLens — AI Clinical Document Reviewer & Intelligence Workspace

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React: 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg)](https://www.typescriptlang.org/)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-336791.svg)](https://neon.tech/)
[![AI Engine: Gemini 1.5 Flash](https://img.shields.io/badge/AI%20Engine-Gemini%201.5%20Flash-8E75B2.svg)](https://deepmind.google/technologies/gemini/)

> **Technical Assignment Submission — AI/ML Engineering Internship**  
> **Candidate**: Tanya Singh  
> **Repository**: [https://github.com/tanyaaa0070/clinixlens](https://github.com/tanyaaa0070/clinixlens)  
> **Live Web Application**: [https://clinixlens.vercel.app](https://clinixlens.vercel.app)  
> **Live Backend API**: [https://clinixlens-1.onrender.com](https://clinixlens-1.onrender.com)  
> **API Swagger Documentation**: [https://clinixlens-1.onrender.com/docs](https://clinixlens-1.onrender.com/docs)  
> **Health Check Endpoint**: [https://clinixlens-1.onrender.com/health](https://clinixlens-1.onrender.com/health)

---

## 1. Executive Summary & Problem Statement

### The Healthcare Challenge
Healthcare reviewers, medical chart auditors, and clinicians spend hundreds of hours manually parsing heterogeneous, unstructured medical documentation — including typed progress notes, scanned multi-page discharge summaries, emergency triage logs, and cursive handwritten encounter slips.

Standard conversational LLMs and naive summarization wrappers introduce severe clinical safety risks:
* **Hallucination & Fabrication**: Inventing normal vital signs or missing lab values.
* **Failure to Detect Critical Conflicts**: Overlooking dangerous drug-allergy contradictions (e.g., documented severe penicillin allergy paired with an amoxicillin discharge order).
* **Black-Box Opacity**: Omitting verbatim source grounding, forcing clinicians to re-read the entire document.
* **Lack of Schema Enforcement**: Unpredictable output formats that break downstream systems.

### The ClinixLens Solution
**ClinixLens** is a defensive, end-to-end clinical document intelligence workspace. It ingests multi-format documents (plain text, high-res PDF, scanned images), extracts granular clinical entities with verbatim evidence quotes, executes deterministic cross-consistency verification, and delivers an interactive clinician review interface with audit trails.

---

## 2. Key Features & Capabilities

* **Multi-Modal Document Intake**: Accepts raw clinical text, digital PDFs, scanned multi-page documents, and medical photography (PNG/JPG).
* **Dual-Path Document Parsing & OCR**: High-speed digital vector extraction via PyMuPDF with automated fallback to Google Cloud Vision OCR ($300\text{ DPI}$).
* **Structured Clinical Review Report**: Generates an executive **Report Summary** followed by structured, validated sections matching the required schema:
  - Patient Demographics & Encounter Metadata
  - Symptoms & Clinical Observations
  - Diagnoses & Clinical Conditions (with ICD-10 suggestions)
  - Medications & Prescriptions (with dosage, route, frequency)
  - Vital Signs with Normal/Abnormal Range Evaluation
  - Allergies & Documented Reactions
  - Primary Clinical Concerns & Acuity Rating
  - Missing Information Map (identifies unrecorded vitals, omitted dosages, absent demographics)
  - Potential Inconsistencies & Clinical Consistency Radar (cross-checks allergies vs meds, discordant vitals, conflicting patient ages)
  - Items Requiring Review & Clinician Sign-Off Workflow
* **Interactive Split-Screen Evidence Viewer**: Click any extracted medication, diagnosis, or symptom to immediately highlight and scroll to its exact verbatim quote in the original source document.
* **Human-in-the-Loop Verification**: Reviewers can interactively mark findings as `Verified`, `Needs Review`, or `Dismissed` with complete audit trails saved to the database.
* **Real-Time 10-Stage Processing Timeline**: Live Server-Sent Events (SSE) stream with automated polling fallback.
* **Synthetic Demonstration Studio**: 6 pre-built clinical challenge cases available for instant evaluation with zero file upload needed.
* **Zero Real Patient Data**: 100% HIPAA Safe Harbor synthetic data guarantee.

---

## 3. Technology Stack

### Frontend Client
* **Framework**: React 19 + TypeScript + Vite 6
* **Styling & Theme**: Tailwind CSS 3.4 (Tailored Medical SaaS design tokens, Dark & Light mode)
* **Icons & UI**: Lucide React Icons
* **Data Fetching**: Native Fetch with SSE streaming (`EventSource`) and polling fallback
* **Routing**: React Router 7 with client-side SPA rewrites
* **Hosting**: Vercel CDN Edge Network

### Backend API
* **Language & Framework**: Python 3.11 + FastAPI (Async ASGI)
* **Schema Validation**: Pydantic v2 (Strict contract enforcement)
* **Database & ORM**: PostgreSQL (Neon Serverless) / SQLite with SQLAlchemy 2.0 (Async) + `asyncpg` + `aiosqlite`
* **Document Engine**: PyMuPDF (`fitz`) for PDF vector parsing & rasterization, Pillow (`PIL`) for image normalization
* **OCR Service**: Google Cloud Vision API with confidence scoring
* **AI / LLM Engine**: Google Gemini 1.5 Flash (zero-temperature structured extraction)
* **Server & Hosting**: Uvicorn ASGI on Render Web Service

---

## 4. System Architecture & Interaction Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLINIXLENS FRONTEND                           │
│                      (React 19 + Vite + TypeScript)                     │
│  [New Analysis Intake]   [Split-Screen Evidence]   [History & Sign-off] │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP POST / GET / PATCH / SSE
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI API GATEWAY                            │
│                 (Python 3.11 Async ASGI + Pydantic v2)                  │
│       [Rate Limiting]   [Payload Sanitization]   [CORS Security]        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ DOCUMENT PARSING │       │  AI / ML ENGINE  │       │ CROSS-CONSISTENCY│
│  (PyMuPDF 300DPI │       │ (Gemini 1.5 Flash│       │  RADAR & MISSING │
│ + Vision OCR)    │       │ Structured JSON) │       │  INFORMATION MAP │
└─────────┬────────┘       └─────────┬────────┘       └─────────┬────────┘
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      RELATIONAL PERSISTENCE LAYER                       │
│             PostgreSQL (Neon Serverless) / SQLite (Async SQLAlchemy)    │
│    [Analyses Table]     [Findings Index]     [Clinician Audit Trail]    │
└─────────────────────────────────────────────────────────────────────────┘
```

For detailed component interaction diagrams and SSE lifecycle flowcharts, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 5. Output Data Schema

ClinixLens produces strongly-typed JSON reports validated via Pydantic:

```json
{
  "report_summary": "Concise executive overview of primary concerns, diagnoses, and missing items.",
  "patient_information": {
    "name": "Eleanor Vance (Synthetic)",
    "age": "58",
    "gender": "Female",
    "mrn": "SYNTH-842109",
    "visit_date": "2026-08-14"
  },
  "symptoms": [
    {
      "name": "Bilateral toe numbness",
      "severity": "mild",
      "duration": "past year",
      "source_quote": "Reports mild bilateral numbness in toes at bedtime"
    }
  ],
  "diagnoses": [
    {
      "condition": "Type 2 Diabetes Mellitus",
      "icd10_code": "E11.9",
      "status": "active",
      "confidence": 0.96,
      "source_quote": "Type 2 Diabetes Mellitus without acute complications (E11.9)"
    }
  ],
  "medications": [
    {
      "name": "Metformin",
      "dosage": "1000 mg",
      "route": "PO",
      "frequency": "BID with meals",
      "adherent": true,
      "source_quote": "Metformin 1000 mg PO BID with meals"
    }
  ],
  "vitals": {
    "blood_pressure": "128/82 mmHg",
    "heart_rate": "72 bpm",
    "respiratory_rate": "16 breaths/min",
    "temperature": "98.4 F",
    "spo2": "98% on room air"
  },
  "allergies": [
    {
      "allergen": "NKDA (No Known Drug Allergies)",
      "reaction": "none reported"
    }
  ],
  "clinical_observations": [
    "Monofilament test indicates slightly diminished fine touch at distal 1st metatarsals"
  ],
  "clinical_concerns": [
    {
      "concern": "Early diabetic peripheral neuropathy progression risk",
      "acuity": "moderate"
    }
  ],
  "missing_information": [
    "Serum creatinine value not documented in current note"
  ],
  "potential_inconsistencies": [],
  "requires_review": [
    "Verify adherence to annual diabetic retinal examination"
  ]
}
```

---

## 6. Repository Structure

```
clinixlens/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── analyses.py          # Intake, report retrieval, SSE events, clinician review
│   │   │   │   ├── health.py            # System health & telemetry diagnostics
│   │   │   │   └── synthetic.py         # 6 synthetic demonstration cases
│   │   ├── core/
│   │   │   └── config.py                # Pydantic Settings & environment variables
│   │   ├── db/
│   │   │   └── database.py              # Async SQLAlchemy engine & connection pooler
│   │   ├── models/
│   │   │   └── models.py                # Analysis, Finding, ProcessingEvent models
│   │   ├── schemas/
│   │   │   └── schemas.py               # Pydantic clinical report schemas & request models
│   │   ├── services/
│   │   │   ├── ai_service.py            # Gemini 1.5 Flash structured review client
│   │   │   ├── consistency_service.py   # Consistency Radar & completeness analyzer
│   │   │   ├── deterministic_extractor.py # Fail-safe offline clinical rule parser
│   │   │   ├── document_processor.py    # PyMuPDF & Pillow document intake
│   │   │   ├── ocr_service.py           # Google Cloud Vision OCR abstraction
│   │   │   ├── pipeline_orchestrator.py # 10-stage execution pipeline & SSE EventBus
│   │   │   └── synthetic_data.py        # 6 pre-built high-fidelity clinical cases
│   │   └── main.py                      # FastAPI app entrypoint, CORS & DB lifespan
│   ├── tests/
│   │   └── test_api.py                  # Pytest async test suite
│   ├── .env.example                     # Backend environment variable template
│   ├── Dockerfile                       # Production container definition
│   ├── render.yaml                      # Render Infrastructure-as-Code blueprint
│   └── requirements.txt                 # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/layout/           # AppLayout, Navbar, Sidebar
│   │   ├── pages/
│   │   │   ├── EvidenceViewer.tsx       # Split-screen evidence & verbatim source grounding
│   │   │   ├── History.tsx              # Filterable history & audit trail
│   │   │   ├── NewAnalysis.tsx          # Multi-modal ingestion (Text / PDF / Image)
│   │   │   ├── Overview.tsx             # Clinical analytics dashboard
│   │   │   ├── ReportView.tsx           # Structured report, consistency radar & review mode
│   │   │   ├── Settings.tsx             # Real-time infrastructure diagnostics & telemetry
│   │   │   ├── SyntheticStudio.tsx      # Pre-built clinical evaluation suite
│   │   │   └── Workspace.tsx            # Live 10-stage execution stream
│   │   ├── services/api.ts              # API client with SSE streaming & polling
│   │   ├── types/index.ts               # TypeScript domain interfaces
│   │   ├── App.tsx                      # Routing & navigation
│   │   └── main.tsx                     # DOM entrypoint
│   ├── .env.production                  # Production API configuration
│   ├── tailwind.config.js               # Clinical theme tokens
│   ├── vercel.json                      # Vercel SPA routing rewrites
│   └── vite.config.ts                   # Vite bundler configuration
└── docs/
    ├── AI_ML_DESIGN.md                  # Comprehensive AI/ML & NLP pipeline documentation
    ├── ARCHITECTURE.md                 # System topology & interaction diagrams
    └── TECHNICAL_DECISIONS.md          # Technology choices, trade-offs & future roadmap
```

---

## 7. Local Quickstart Guide

### Prerequisites
* **Python**: 3.11+
* **Node.js**: 18+ or 20+
* **npm**: 9+

### 7.1 Backend Setup
```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY

# 5. Launch FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend API: `http://localhost:8000`
* Interactive API Documentation (Swagger): `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/health`

### 7.2 Frontend Setup
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite dev server
npm run dev
```
* Frontend Application: `http://localhost:5173`

---

## 8. Automated Testing & Verification

Run the automated backend test suite using `pytest`:

```bash
cd backend
.\venv\Scripts\pytest tests/ -v
```

The test suite validates:
* System health & telemetry endpoint response contracts (`GET /health`)
* Plain text clinical note intake and extraction (`POST /api/v1/analyses/text`)
* Synthetic case instant analysis (`POST /api/v1/analyses/synthetic/{id}`)
* Granular finding verification updates (`PATCH /api/v1/analyses/{id}/findings/{id}`)
* Consistency radar conflict detection on contradictory cases
* Missing information map flagging on incomplete records

---

## 9. Synthetic Demonstration Cases

For rapid evaluator testing without uploading clinical files:

1. **Case 1: Routine Follow-up (Type 2 Diabetes & HTN)**: Outpatient encounter with well-controlled vitals, adherence check, and routine care plan.
2. **Case 2: Complex Polypharmacy & Orthostasis**: Geriatric patient on 9 concurrent prescriptions; evaluates drug-drug interactions, orthostasis drop, and hyperkalemia risk.
3. **Case 3: Emergency Encounter (Acute Dyspnea & Suspected PE)**: High-acuity triage note with hypoxemia, tachycardia, positive D-dimer, and stat anticoagulation.
4. **Case 4: Incomplete Clinical Note**: Urgent care note lacking patient age, gender, date, vitals, and medication dosage; evaluates the Missing Information Map.
5. **Case 5: Conflicting Post-Op Discharge Summary**: Tests the Consistency Radar against contradictory patient ages (64 vs 46), discordant vitals, and a severe penicillin allergy contradicted by an amoxicillin discharge order.
6. **Case 6: Scanned Handwritten Progress Note**: Simulates OCR extraction of cursive shorthand (`SOB`, `WNL`, `PRN`, `BID`) with confidence variation.

---

## 10. Technical Documentation Index

* **[AI/ML Design Documentation](docs/AI_ML_DESIGN.md)**: Details model selection, OCR fallback logic, prompt engineering, structured Pydantic JSON contracts, hallucination mitigation, and failure recovery.
* **[Technical Decisions & Trade-Offs](docs/TECHNICAL_DECISIONS.md)**: Explains the rationale behind framework choices (FastAPI, React, PostgreSQL, Gemini), architectural decisions (SSE vs WebSockets), trade-offs, and future scalability roadmap.
* **[System Architecture](docs/ARCHITECTURE.md)**: Complete system topology, component interactions, and live data flow diagrams.

---

## 11. Ethical, Regulatory & Synthetic Data Guarantee

* **100% Synthetic Data**: All patient names, MRNs, encounter notes, and diagnostic records used in this workspace are entirely synthetic and HIPAA Safe Harbor compliant.
* **Clinical Decision Support Boundary**: ClinixLens is strictly an administrative document review and intelligence extraction workspace. It does not provide autonomous clinical diagnoses, treatment recommendations, or direct patient care.
