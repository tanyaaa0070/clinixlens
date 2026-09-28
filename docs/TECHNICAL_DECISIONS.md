# ClinixLens — Technical Decisions, Architecture Trade-Offs & Engineering Rationale

> **Assignment Submission Document**: Technical Decisions & Engineering Architecture  
> **Project**: ClinixLens — End-to-End AI Clinical Document Reviewer  
> **Candidate**: Tanya Singh (AI/ML Engineering Internship)

---

## 1. Executive Summary of Technology Choices

| Layer | Selected Technology | Alternative Evaluated | Key Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 19 + Vite + TypeScript | Next.js, Vue.js, Streamlit | Zero-latency client-side state, fine-grained DOM highlighting for evidence grounding, lightweight Single Page Application (SPA). |
| **Backend** | Python 3.11 + FastAPI + Pydantic v2 | Flask, Django, Express.js | Native asynchronous I/O (`asyncio`), native integration with Python ML/NLP ecosystem, strict JSON Schema enforcement via Pydantic. |
| **Database** | PostgreSQL (Neon Serverless) + SQLite (dev) | MongoDB, DynamoDB, Firebase | Strongly typed relational schema for findings, audit logs, and status transitions; async connection pooling with `asyncpg`. |
| **AI / LLM Engine** | Google Gemini 1.5 Flash | GPT-4o-mini, Claude 3.5 Haiku, Local LLaMA 3 | Native multimodal processing for medical charts, massive context window (1M+ tokens), ultra-low latency, and free/generous tier. |
| **Document / OCR** | PyMuPDF (`fitz`) + Google Cloud Vision | Tesseract OCR, AWS Textract | 10x faster digital PDF text extraction, 300 DPI high-res page rasterization, and superior handwritten cursive recognition. |
| **Streaming** | Server-Sent Events (SSE) | WebSockets, Long Polling | Unidirectional, HTTP/2-friendly streaming with automatic reconnection, lower protocol overhead than full WebSockets. |

---

## 2. Frontend Framework Selection: React 19 + TypeScript + Vite

### Why React 19 & TypeScript:
1. **Interactive Evidence Anchoring**: The core differentiator of ClinixLens is the interactive Split-Screen Evidence Viewer. Clinicians can click on any extracted finding (e.g., medication, symptom, diagnosis) and have the exact verbatim quote in the original text instantly highlighted and scrolled into view. React's virtual DOM and state management make this bidirectional synchronization instant ($<16\text{ ms}$).
2. **Type Safety & Schema Synchronization**: TypeScript interfaces in `frontend/src/types/index.ts` mirror the backend Pydantic models (`schemas.py`), eliminating runtime shape mismatch bugs.
3. **Streamlit / Dash Rejection**: While Streamlit is common for rapid ML prototypes, it is incapable of delivering production-grade interactive evidence split-screens, custom Server-Sent Event timelines, or dark/light clinical UI aesthetics suitable for actual healthcare workflows.

### Why Vite:
* Instant Hot Module Replacement (HMR) during development.
* Optimized Rollup bundling for production ($<450\text{ KB}$ gzipped), deploying smoothly to static CDNs (Vercel).

---

## 3. Backend Framework Selection: FastAPI (Python 3.11)

### Why FastAPI:
1. **Python AI Ecosystem Integration**: Directly interfaces with `PyMuPDF`, `Pillow`, `google-generativeai`, and `google-cloud-vision` without inter-process communication overhead.
2. **Asynchronous Concurrency**: Asynchronous endpoints (`async def`) handle multi-step document pipelines without blocking the event loop. The 10-stage pipeline runs concurrently while streaming SSE events to the client.
3. **Pydantic v2 Core Validation**: Automatically generates OpenAPI/Swagger schemas (`/docs`), validates input payloads, and serializes clinical findings with microsecond performance.
4. **Django / Flask Rejection**: Django is overly monolithic and synchronous by default. Flask lacks built-in asynchronous task streaming and automatic Pydantic request/response parsing.

---

## 4. Database Selection: PostgreSQL (Neon Serverless) & SQLite

### Why Relational PostgreSQL with SQLite Fallback:
1. **Relational Integrity for Clinical Audit Trails**: Clinical reviews require relational consistency between an `Analysis`, its granular extracted `Findings`, and the individual clinician `Verification` actions (`Verified`, `Needs Review`, `Dismissed`).
2. **Async SQLAlchemy 2.0 & asyncpg**: The backend uses SQLAlchemy 2.0 with the high-performance asynchronous `asyncpg` driver for PostgreSQL and `aiosqlite` for local offline development.
3. **Neon Serverless PostgreSQL**: Provides zero-configuration cloud database pooling with branch isolation, SSL encryption, and high availability on Render.
4. **NoSQL / Document Store Rejection**: While clinical documents are semi-structured, storing them purely in MongoDB makes relational audit queries (e.g., "Find all analyses where penicillin allergy was dismissed") slow and prone to orphan state.

---

## 5. AI/ML Strategy & Prompt Engineering

### Dual-Path Document Ingestion:
* **Path 1 (Digital Vector PDF / Text)**: PyMuPDF directly extracts Unicode glyphs in under 20 milliseconds.
* **Path 2 (Scanned / Handwritten / Image)**: If glyph density is low ($<20$ characters) or the file is an image, the page is rasterized at 300 DPI and processed through Google Cloud Vision OCR with word-level confidence scoring.

### LLM Reasoning & Defensive Guardrails:
1. **Grounded Extraction Prompting**: The Gemini prompt explicitly commands the model to only extract information explicitly stated in the source text, strictly forbidding inference or extrapolation.
2. **Verbatim Evidence Anchoring**: For every extracted symptom, diagnosis, and medication, the model is required to return an exact `source_quote` substring matching the original text.
3. **Determinism (Temperature = 0.1)**: Low temperature minimizes sampling randomness and hallucination.
4. **Strict JSON Schema Contracts**: Structured Pydantic validation ensures that malformed JSON is rejected or repaired before reaching the database.
5. **Deterministic Heuristic Cross-Consistency Engine**: Independent of the LLM, a rule-based engine cross-checks:
   - Documented allergy classes vs prescribed medications (e.g., Penicillin allergy vs Amoxicillin prescription).
   - Conflicting patient demographics (e.g., Age 64 in header vs Age 46 in narrative).
   - Discordant vitals (e.g., Nursing triage BP vs discharge exam BP).
   - Incomplete clinical fields (e.g., missing dosages, unrecorded allergies, omitted vitals).

---

## 6. Architecture Trade-Offs & Decisions

| Decision | Pros | Cons / Trade-off | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Server-Sent Events (SSE) over WebSockets** | Lightweight, unidirectional, works over standard HTTP/HTTPS through corporate firewalls. | Client cannot send upstream data over the same connection. | Client uses standard REST POST/PATCH endpoints for interactions and mutations. |
| **Multi-Stage Pipeline Orchestrator** | Modular, testable, emits granular progress events for UI feedback. | Slightly higher code surface area than a single monolothic function. | Clean dependency injection with stage-by-stage event bus logging. |
| **In-Memory Buffer Processing** | Zero disk footprint, enhances privacy, fast processing. | High memory spike if handling very large PDF files ($>100\text{ MB}$). | Strict file size ceiling ($20\text{ MB}$) enforced at the API gateway layer. |
| **Client-Side Polling Fallback** | Ensures UI updates even if SSE connection drops through proxy. | Extra HTTP GET requests every 2 seconds during active processing. | Polling immediately stops once terminal state (`completed` or `failed`) is reached. |

---

## 7. Known Weaknesses & Limitations

1. **OCR Quality Dependency**: Heavily degraded carbon copies, multi-generation faxes, or extreme cursive shorthand can degrade extraction confidence.
2. **Non-Standard Medical Abbreviations**: Unique regional shorthand without context may be flagged as `needs_review` or `missing_information`.
3. **Stateless Processing**: Currently, each submitted document is analyzed independently; multi-encounter longitudinal history aggregation across months/years is not yet implemented.

---

## 8. Future Improvements & Scalability Roadmap

1. **FHIR (Fast Healthcare Interoperability Resources) R4 Export**: Direct bi-directional synchronization with EHRs (Epic, Cerner).
2. **Medical Ontology Normalization**: Automatic mapping of extracted entities to SNOMED CT, ICD-10-CM, LOINC, and RxNorm standard codes.
3. **Ambient Audio Dictation**: Direct integration with Whisper / Google Speech-to-Text for live doctor-patient encounter transcription.
4. **Active Learning Feedback Loop**: Clinician review feedback (`Verified` vs `Dismissed`) stored to fine-tune a domain-adapted clinical SLM (e.g., Med-Gemma).
