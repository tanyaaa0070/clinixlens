# ClinixLens — Clinical Intelligence Workspace

> **"From Clinical Documents to Clear, Evidence-Linked Insight."**
>
> A production-grade clinical document intelligence workspace designed to ingest plain text notes, high-resolution PDFs, scanned encounter charts, and handwritten records — transforming unstructured healthcare documents into validated, evidence-grounded clinical intelligence.

---

## 1. Project Overview & Problem Statement

### The Problem
Healthcare reviewers, clinical chart auditors, and medical informatics teams spend countless hours manually parsing heterogeneous, unstructured documentation: clinical narratives, discharge summaries, emergency triage logs, and scanned multi-page PDFs. Traditional AI summarizers are dangerous in medical contexts because they:
- Hallucinate absent findings or invent normal vital signs.
- Fail to detect subtle clinical contradictions (e.g. penicillin allergy documented in the header while amoxicillin is prescribed at discharge).
- Omit verbatim source references, forcing clinicians to re-read the entire record.
- Lack strict type contracts and human-in-the-loop oversight.

### The ClinixLens Solution
ClinixLens is **not** an autonomous medical diagnostic tool or a naive ChatGPT wrapper. It is a **defensive clinical intelligence workspace** featuring:
1. **Multi-Modal Document Intake**: Direct plain text, digital vector PDFs, rasterized scanned PDFs, and medical photography.
2. **Dual-Path Text & OCR Pipeline**: Fast vector glyph extraction via PyMuPDF with automated fallback to Google Cloud Vision OCR ($300\text{ DPI}$).
3. **Structured AI Review Layer**: Google Gemini 1.5 Flash operating under strict zero-temperature JSON constraints.
4. **Pydantic Contract Validation**: 100% schema enforcement — unvalidated LLM output is never exposed to the frontend.
5. **Clinical Consistency Radar**: Rule-based detection of allergy contraindications, contradictory vitals, and conflicting patient ages.
6. **Information Completeness Map**: Objective matrix assessing the presence of cardinal clinical categories.
7. **Split-Screen Evidence Grounding**: Interactive bi-directional highlighting connecting extracted entities directly to verbatim quotes in the source text.
8. **Human-in-the-Loop Audit Trails**: Clinician verification (`Verify`, `Needs Review`, `Dismiss`) persisted to relational database storage with timestamps.

---

## 2. Key Features

- **Real-Time Processing Timeline**: 10-stage live execution stream powered by Server-Sent Events (SSE) with automated polling fallback.
- **Consistency Radar**: Flags document discrepancies with side-by-side Evidence A vs Evidence B comparisons.
- **Completeness Matrix**: Audits Demographics, Vitals, Symptoms, Diagnoses, Medications, Allergies, and Care Plan.
- **Split-Screen Evidence Viewer**: Click any extracted medication, diagnosis, or symptom to immediately highlight its verbatim location in the original document.
- **Synthetic Case Studio**: Evaluators can instantly test 6 diverse clinical scenarios (Routine, Polypharmacy, Acute Emergency, Incomplete, Conflicting, and Scanned Handwriting) in under 2 minutes without uploading files.
- **Dark & Light Mode**: Accessible clinical color tokens with high contrast typography.

---

## 3. Technology Stack

### Frontend Client
| Technology | Role |
|---|---|
| **React 19 + TypeScript** | Strongly typed user interface |
| **Vite 6** | Ultra-fast build tool and dev server |
| **Tailwind CSS 3.4** | Tailored Medical SaaS design tokens & dark mode |
| **TanStack React Query** | Asynchronous server-state caching & optimistic mutations |
| **React Router 7** | Client-side routing with clean breadcrumbs |
| **Lucide Icons** | Accessible clinical and technical iconography |

### Backend API
| Technology | Role |
|---|---|
| **FastAPI (Python 3.11)** | High-throughput asynchronous REST API |
| **Pydantic v2** | Strict schema validation and JSON serialization |
| **SQLAlchemy 2.0 (Async)** | Asynchronous ORM supporting SQLite and PostgreSQL |
| **PyMuPDF (`fitz`)** | Vector PDF text extraction & high-res page rasterization |
| **Pillow (`PIL`)** | Medical image validation and buffer normalization |
| **Google Cloud Vision API** | Enterprise OCR for scanned documents and cursive handwriting |
| **Google Gemini 1.5 Flash** | Clinical entity reasoning and structured synthesis |
| **Uvicorn** | ASGI production application server |

---

## 4. System Architecture

```
User (Clinician / Auditor)
       │
       ▼
React 19 Client (Vite + Tailwind CSS)
       │
       ├─── Multipart Upload / Text / Synthetic Trigger
       ▼
FastAPI API Gateway
       │
       ├─► Validation Layer (MIME signatures, file bounds)
       │
       ├─► Document Processing Pipeline (PyMuPDF)
       │        │
       │        ├─► Scanned? ──► Google Cloud Vision OCR
       │        └─► Digital? ──► Native Vector Text
       │
       ├─► AI Clinical Review Engine (Gemini 1.5 Flash / Fallback)
       │
       ├─► Strict Pydantic Schema Validation (StructuredClinicalReport)
       │
       ├─► Clinical Consistency Radar & Missing Information Map
       │
       ├─► Persistence Layer (PostgreSQL / SQLite via Async SQLAlchemy)
       │
       └─► Real-Time Status Channel (Server-Sent Events & Polling)
```

---

## 5. Repository & Folder Structure

```
clinixlens/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── analyses.py      # Intake, report retrieval, SSE events, human review
│   │   │   │   ├── health.py        # System health & engine diagnostics
│   │   │   │   └── synthetic.py     # Synthetic demo case endpoints
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   └── config.py            # Pydantic Settings & environment variables
│   │   ├── db/
│   │   │   └── database.py          # Async SQLAlchemy engine & session factory
│   │   ├── models/
│   │   │   └── models.py            # Analysis, Finding, ProcessingEvent models
│   │   ├── schemas/
│   │   │   └── schemas.py           # Pydantic request/response & clinical report schemas
│   │   ├── services/
│   │   │   ├── ai_service.py        # Gemini 1.5 Flash client with retry handling
│   │   │   ├── consistency_service.py # Consistency Radar & completeness logic
│   │   │   ├── deterministic_extractor.py # Fail-safe offline clinical parser
│   │   │   ├── document_processor.py # PyMuPDF & Pillow document intake
│   │   │   ├── ocr_service.py       # Google Cloud Vision OCR abstraction
│   │   │   ├── pipeline_orchestrator.py # Master 10-stage execution pipeline & EventBus
│   │   │   └── synthetic_data.py    # 6 prebuilt high-fidelity synthetic demo cases
│   │   └── main.py                  # FastAPI entrypoint, lifespan seeding & CORS
│   ├── tests/
│   │   └── test_api.py              # Automated backend test suite
│   ├── .env.example                 # Environment variable template
│   ├── Dockerfile                   # Production container definition
│   ├── render.yaml                  # Render cloud blueprint
│   └── requirements.txt             # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── AppLayout.tsx    # Responsive shell with theme provider
│   │   │       ├── Navbar.tsx       # Top bar with dark mode toggle & breadcrumb
│   │   │       └── Sidebar.tsx      # Sidebar navigation & live status indicators
│   │   ├── pages/
│   │   │   ├── EvidenceViewer.tsx   # Split-screen evidence & verbatim source grounding
│   │   │   ├── History.tsx          # Filterable analysis history & audit trail
│   │   │   ├── NewAnalysis.tsx      # Multi-modal ingestion (Text / PDF / Image)
│   │   │   ├── Overview.tsx         # Dashboard with metrics & recent reports
│   │   │   ├── ReportView.tsx       # AI Clinical Report, Radar & Review Mode
│   │   │   ├── Settings.tsx         # Health diagnostics & configuration guide
│   │   │   ├── SyntheticStudio.tsx  # Interactive demo case test studio
│   │   │   └── Workspace.tsx        # Real-time 10-stage timeline & trace log
│   │   ├── services/
│   │   │   └── api.ts               # HTTP client with SSE and polling support
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript domain interfaces
│   │   ├── App.tsx                  # React Router configuration
│   │   ├── index.css                # Custom medical SaaS tokens & typography
│   │   └── main.tsx                 # React DOM mount point
│   ├── index.html                   # HTML template with SEO meta tags
│   ├── tailwind.config.js           # Tailwind clinical color extensions
│   ├── tsconfig.json                # TypeScript compiler config
│   ├── vercel.json                  # Vercel SPA routing rewrite rules
│   └── vite.config.ts               # Vite proxy configuration
└── docs/
    ├── AI_ML_DESIGN.md              # Deep-dive AI/ML & NLP architecture document
    └── ARCHITECTURE.md             # System topology and real-time interaction diagrams
```

---

## 6. Local Quickstart Guide

### Prerequisites
- **Python**: 3.11+
- **Node.js**: 18+ or 20+
- **npm**: 9+

### 6.1 Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env to add your GEMINI_API_KEY and GOOGLE_CLOUD_VISION_API_KEY

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend API will be running at `http://localhost:8000`.
Interactive Swagger documentation is available at `http://localhost:8000/docs`.

### 6.2 Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 7. Environment Variables Reference

Create a `.env` file in `backend/`:

| Variable | Description | Default / Example |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for structured analysis | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini model variant | `gemini-1.5-flash` |
| `GOOGLE_CLOUD_VISION_API_KEY` | Google Cloud Vision API key for OCR | `AIzaSy...` |
| `DATABASE_URL` | Database connection URL | `sqlite+aiosqlite:///./clinixlens.db` |
| `APP_ENV` | Environment mode (`development` or `production`) | `development` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:5173,http://localhost:3000` |
| `MAX_UPLOAD_SIZE_MB` | Maximum file upload limit in MB | `20` |

---

## 8. Deployment Guide

### Deploying the Backend & Database to Render
1. Create a **Web Service** on [Render](https://render.com).
2. Connect your Git repository and select the `backend` root directory.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Create a **Render PostgreSQL Database** and set `DATABASE_URL` in the Web Service environment variables.
6. Set `GEMINI_API_KEY` and `GOOGLE_CLOUD_VISION_API_KEY`.
7. Set `CORS_ORIGINS` to your frontend domain (e.g. `https://clinixlens.vercel.app`).

Alternatively, deploy using the included `backend/render.yaml` Blueprint.

### Deploying the Frontend to Vercel
1. Import your repository into [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Framework Preset: `Vite`.
4. Environment Variables:
   - `VITE_API_URL`: Your hosted Render backend URL (e.g. `https://clinixlens-backend.onrender.com`).
5. Deploy. Vercel automatically honors `frontend/vercel.json` for client-side routing.

---

## 9. Synthetic Demonstration Cases

To facilitate rapid technical evaluation without requiring proprietary clinical uploads, ClinixLens includes 6 built-in synthetic cases:
1. **Routine Follow-up**: Controlled Type 2 Diabetes & Hypertension outpatient note with stable vitals and medication compliance.
2. **Medication Review**: Polypharmacy in an elderly patient taking 9 concurrent prescriptions; evaluates orthostasis and hyperkalemia risk.
3. **Emergency Visit**: Acute triage presentation with dyspnea, tachycardia, hypoxemia, positive D-dimer, and suspected pulmonary embolism.
4. **Incomplete Clinical Note**: Walk-in clinic note missing patient age, gender, vital signs, and medication dosages; evaluates the Missing Information Map.
5. **Conflicting Documentation**: Post-operative discharge note with conflicting patient ages, discordant blood pressure readings, and a severe penicillin allergy contradicted by an amoxicillin discharge order; tests the Clinical Consistency Radar.
6. **Scanned Handwritten Note**: Simulates noisy OCR text with medical shorthand (`SOB`, `WNL`, `PRN`, `QID`) and variable confidence scores.

---

## 10. Synthetic Data Policy & Safety Boundaries

ClinixLens enforces a strict **Synthetic Data Policy**:
- **0% Real Patient Identifiers**: All demonstration datasets are generated from synthetic clinical templates adhering to HIPAA Safe Harbor guidelines.
- **Not a Diagnostic Tool**: ClinixLens is an assistive clinical intelligence and structured data extraction workspace. It does not replace the clinical judgment of certified medical practitioners.
- **Never Inferred Data**: Absent clinical values are explicitly reported as `"Not available in submitted document"` to prevent dangerous extrapolation hallucinations.

---

## 11. Known Limitations & Future Roadmap

### Current Limitations
- Scanned document quality is bounded by OCR resolution; heavily degraded carbon copies or illegible provider handwriting may produce lower confidence extractions.
- DICOM and specialized imaging formats are not directly parsed (rasterized medical photography only).

### Future Roadmap
- Direct integration with FHIR (Fast Healthcare Interoperability Resources) R4 APIs for bidirectional EHR synchronization.
- SNOMED CT and RxNorm ontology mapping for standardized terminology coding.
- Audio transcription pipeline for ambient physician-patient clinical encounters.
