# ClinixLens — System Architecture & Data Flow

> **ClinixLens**: "From Clinical Documents to Clear, Evidence-Linked Insight."

---

## 1. System Topology & End-to-End Flow Diagram

```mermaid
graph TD
    User([Clinician / Auditor / Evaluator])
    
    subgraph Frontend_Layer ["Frontend Client (React 19 + TypeScript + Vite)"]
        UI_Dashboard["Overview Dashboard"]
        UI_NewAnalysis["New Analysis Studio (Text/PDF/Image)"]
        UI_LiveTimeline["Real-Time Processing Workspace (SSE/Polling)"]
        UI_Report["AI Clinical Intelligence Report"]
        UI_Evidence["Split-Screen Evidence Viewer"]
        UI_Radar["Clinical Consistency Radar"]
        UI_Completeness["Information Completeness Map"]
        UI_HumanReview["Human-in-the-Loop Review Mode"]
        UI_Synthetic["Synthetic Case Studio"]
    end

    subgraph API_Gateway ["Backend Gateway & API Layer (FastAPI)"]
        Router_Health["/api/v1/health"]
        Router_Synthetic["/api/v1/synthetic/cases"]
        Router_Analyses["/api/v1/analyses"]
        Router_Upload["/api/v1/analyses/upload"]
        Router_SSE["/api/v1/analyses/{id}/events (SSE)"]
        Router_Review["/api/v1/analyses/{id}/findings (PATCH)"]
        Event_Bus["In-Memory Async EventBus (Pub/Sub)"]
    end

    subgraph Ingestion_Pipeline ["Document Processing & Ingestion Engine"]
        Doc_Validator["MIME / Byte Signature Validator"]
        PyMuPDF_Extractor["PyMuPDF Digital Text & Layout Extractor"]
        Scanned_Detector{"Scanned / Image Page?"}
        Page_Rasterizer["High-Res 300 DPI Rasterizer"]
        OCR_Service["Google Cloud Vision OCR Service"]
        Text_Normalizer["Clinical Text Normalizer & Cleaner"]
    end

    subgraph Intelligence_Core ["AI Analysis & Reasoning Core"]
        AI_Prompt_Builder["Clinical System Prompt Builder"]
        External_LLM["Google Gemini 1.5 Flash (JSON Mode)"]
        Pydantic_Validator["Strict Pydantic Schema Validator"]
        Deterministic_Engine["Deterministic Clinical Parser (Fail-Safe Fallback)"]
    end

    subgraph Validation_Engines ["Clinical Verification & Rule Engines"]
        Consistency_Radar["Clinical Consistency Radar (Safety & Bounds)"]
        Completeness_Mapper["Information Completeness Matrix"]
    end

    subgraph Persistence_Layer ["Persistence & Storage Layer"]
        DB[(PostgreSQL / SQLite via SQLAlchemy Async)]
        Table_Analyses[("analyses")]
        Table_Findings[("findings")]
        Table_Events[("processing_events")]
    end

    %% User Interactions
    User --> UI_Dashboard
    User --> UI_NewAnalysis
    User --> UI_Report
    User --> UI_HumanReview

    %% Frontend to API
    UI_NewAnalysis -->|Multipart Upload / JSON| Router_Upload
    UI_NewAnalysis -->|Plain Text| Router_Analyses
    UI_LiveTimeline <-->|SSE Stream / Polling| Router_SSE
    UI_HumanReview -->|Verify / Dismiss| Router_Review

    %% API to Orchestration
    Router_Upload --> Doc_Validator
    Router_Analyses --> Doc_Validator
    Doc_Validator --> PyMuPDF_Extractor
    PyMuPDF_Extractor --> Scanned_Detector
    Scanned_Detector -->|No| Text_Normalizer
    Scanned_Detector -->|Yes| Page_Rasterizer
    Page_Rasterizer --> OCR_Service
    OCR_Service --> Text_Normalizer

    %% Intelligence Core
    Text_Normalizer --> AI_Prompt_Builder
    AI_Prompt_Builder --> External_LLM
    External_LLM --> Pydantic_Validator
    External_LLM -.->|API Error / Fallback| Deterministic_Engine
    Deterministic_Engine --> Pydantic_Validator

    %% Verification Engines
    Pydantic_Validator --> Consistency_Radar
    Pydantic_Validator --> Completeness_Mapper

    %% Persistence
    Consistency_Radar --> DB
    Completeness_Mapper --> DB
    Pydantic_Validator --> DB
    DB --- Table_Analyses
    DB --- Table_Findings
    DB --- Table_Events

    %% Real-time Feedback
    Doc_Validator -.-> Event_Bus
    OCR_Service -.-> Event_Bus
    External_LLM -.-> Event_Bus
    Consistency_Radar -.-> Event_Bus
    Event_Bus --> Router_SSE
```

---

## 2. Component Breakdown

### 2.1 React 19 Frontend
- **Design System**: Tailored Medical SaaS design system with slate/indigo/teal visual hierarchy, subtle glassmorphic headers, crisp typography, and high-contrast clinical badges.
- **State & Data Synchronization**: TanStack Query handles server caching, background revalidation, and optimistic updates for human verification badges.
- **Real-Time Client**: Dual-mode stream listener (Server-Sent Events with automated fallback to 1-second interval polling).
- **Split-Screen Evidence Linking**: Bidirectional selection linking extracted structured findings (e.g. `Metformin 1000 mg BID`) to source document character spans and page numbers.

### 2.2 FastAPI Backend
- **Asynchronous Execution**: Native async/await throughout all I/O pathways prevents thread exhaustion during long-running OCR or LLM API calls.
- **Background Tasks**: Document processing pipelines run asynchronously in background tasks, instantly returning a unique `analysis_id` so the frontend can immediately mount the Live Processing Timeline.
- **Decoupled Architecture**: Clean separation into `core/`, `api/`, `models/`, `schemas/`, and `services/` ensures high maintainability and testability.

### 2.3 Document Processing Layer
- **PyMuPDF (`fitz`)**: Directly extracts text, bounding coordinates, and font metadata from vector PDFs in under 50ms per page.
- **Scanned Page Detection**: Inspects glyph presence; triggers high-resolution rasterization ($300\text{ DPI}$, RGB) only when pages contain bitmap data without embedded fonts.
- **Google Cloud Vision OCR**: Sends base64-encoded page buffers to Google Vision's `DOCUMENT_TEXT_DETECTION` endpoint, recovering dense multi-column tabular text and cursive provider handwriting.

### 2.4 AI Intelligence & Pydantic Validation
- **Model**: Google Gemini 1.5 Flash configured with low temperature ($0.1$) and response schema enforcement.
- **Pydantic Validation**: Converts untrusted LLM JSON output into strictly typed Python instances (`StructuredClinicalReport`). If validation fails, defensive healing logic repairs malformed fragments or invokes the rule-based clinical engine.

### 2.5 Consistency Radar & Missing Information Map
- **Consistency Radar**: A dedicated rule engine that evaluates clinical logic independently of the LLM:
  - Allergy vs. prescription contraindication checks (e.g., Penicillin allergy vs. Amoxicillin prescription).
  - Orthostatic and extreme vital sign bounds checking.
  - Conflicting demographic attributes across document sections.
- **Information Completeness Map**: Analyzes the presence of cardinal clinical components (Demographics, Vitals, Symptoms, Diagnoses, Medications, Allergies, Plan) and computes an objective completeness score.

### 2.6 Persistence Layer
- **PostgreSQL**: Production relational store on Render or Railway using async connection pooling (`asyncpg`).
- **SQLite Fallback**: Local zero-configuration database (`aiosqlite`) for instant onboarding and automated CI/CD test runs.
- **Audit Trails**: Every human verification action (`verify`, `needs_review`, `dismiss`) persists the reviewer handle, timestamp, and updated progress metrics.

---

## 3. Real-Time Streaming Architecture

```
[Browser Client]               [FastAPI Endpoint]            [EventBus]            [Pipeline Task]
       │                               │                          │                       │
       ├─── GET /analyses/{id}/events ─►                          │                       │
       │    (Accept: text/event-stream)│                          │                       │
       │                               ├───── Subscribe(id) ──────►                       │
       │                               │                          │                       │
       │                               │                          │◄── Record Event ──────┤
       │                               │                          │    (stage: OCR)       │
       │◄── data: {"stage": "ocr"} ────┤◄──── Receive Event ──────┤                       │
       │                               │                          │                       │
       │                               │                          │◄── Record Event ──────┤
       │                               │                          │    (stage: AI Review) │
       │◄── data: {"stage": "ai_rev"} ─┤◄──── Receive Event ──────┤                       │
       │                               │                          │                       │
       │                               │                          │◄── Record Event ──────┤
       │                               │                          │    (stage: Completed) │
       │◄── data: {"stage": "done"} ───┤◄──── Receive Event ──────┤                       │
       │                               │                          │                       │
       └─── Close EventSource ─────────┴───── Unsubscribe ────────►                       │
```

---

## 4. Production Deployment Architecture

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│         Vercel (Edge)           │       │          Render (Cloud)         │
│                                 │       │                                 │
│  React 19 SPA (Vite Static)     │ HTTPS │  FastAPI Python 3.11 Container  │
│  Global CDN Distribution        ├──────►│  Uvicorn Multi-Worker Service   │
│  Custom Domain & SSL            │       │  Environment Variable Secrets   │
└─────────────────────────────────┘       └────────────────┬────────────────┘
                                                           │
                                                           │ Internal Network
                                                           ▼
                                          ┌─────────────────────────────────┐
                                          │      Managed PostgreSQL DB      │
                                          │                                 │
                                          │  Render Managed Database Engine │
                                          │  Encrypted Storage at Rest      │
                                          │  Automated Backups              │
                                          └─────────────────────────────────┘
```
