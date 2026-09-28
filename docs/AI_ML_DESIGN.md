# ClinixLens — AI/ML System & Clinical Intelligence Architecture Design

> **Medical Disclaimer & Regulatory Notice**: ClinixLens is an assistive clinical document intelligence and structured data extraction workspace. It is designed solely for administrative, research, and assistive clinical review by qualified healthcare professionals. **It does NOT provide medical diagnoses, treatment decisions, or autonomous clinical recommendations.** All demonstration datasets are 100% synthetic.

---

## 1. Executive Overview

ClinixLens addresses a pervasive challenge in healthcare data engineering: transforming unstructured, heterogeneous clinical documentation (progress notes, discharge summaries, laboratory transcripts, scanned PDFs, and cursive handwritten encounter forms) into structured, validated, evidence-linked clinical intelligence.

Unlike generic conversational LLM wrappers or naive summarizers, ClinixLens employs a **defensive, multi-stage hybrid intelligence pipeline**:
1. Deterministic layout and document parsing
2. OCR fallback with confidence scoring
3. Entity extraction with verbatim source quote grounding
4. Zero-temperature structured LLM generation with strict Pydantic contract validation
5. Independent rule-based consistency analysis ("Consistency Radar")
6. Information completeness mapping ("Missing Information Map")
7. Human-in-the-loop verification

```
[Document Ingestion]
         │ (PDF / Image / Text)
         ▼
[Document Processing Layer] ─── (PyMuPDF / Pillow)
         │
    ┌────┴────────────────────────┐
    │ Native Text Found?          │
    ├──────────────┬──────────────┤
    │ YES          │ NO / Scanned │
    ▼              ▼              ▼
[Direct Text]   [OCR Service (Google Cloud Vision)]
    │              │ (Confidence >= 0.70)
    └──────────────┴──────────────┐
                                  ▼
                     [Text Normalization Pipeline]
                                  │
                                  ▼
                     [AI Clinical Review Engine]
                   (Gemini 1.5 Flash / Fallback)
                                  │
                                  ▼
                     [Strict Pydantic Validation]
                                  │
                                  ▼
             ┌────────────────────┴────────────────────┐
             ▼                                         ▼
   [Consistency Radar]                       [Missing Info Map]
(Allergy contraindications,              (Required clinical fields:
 vitals anomalies, age conflicts)         vitals, dosages, allergies)
             │                                         │
             └────────────────────┬────────────────────┘
                                  ▼
                      [PostgreSQL / SQLite Store]
                                  │
                                  ▼
                    [Human Review & Verification]
```

---

## 2. Input Processing & Ingestion

### Supported Formats & Constraints
- **Plain Text / Narrative Notes**: Direct stream ingestion up to 50,000 characters.
- **Portable Document Format (PDF)**: Both digital native PDFs and scanned rasterized PDFs up to 20 MB.
- **Medical Images**: PNG, JPEG, TIFF, BMP, WEBP (up to 20 MB).

### Security & Sanitization
- File extensions and magic byte signatures (`%PDF-`, `\x89PNG`, `\xFF\xD8\xFF`) are verified to prevent file extension spoofing.
- Malicious payload detection and stripping of executable byte sequences.
- Uploaded files are isolated and processed in-memory or securely temp-buffered.

---

## 3. PDF Extraction & OCR Strategy

### Dual-Path Ingestion (PyMuPDF + Google Cloud Vision)
1. **PyMuPDF (`fitz`)**: Rapidly parses digital vectors and character blocks. For each page:
   - If character count $> 20$ and font glyphs are extractable, native text is captured with page coordinate metadata.
   - If text extraction yields $< 20$ characters or zero glyphs, the page is flagged as `ocr_required`.
2. **Page Rasterization**: Scanned pages are rendered at 2× scale matrix ($300\text{ DPI}$) into uncompressed memory buffers.
3. **Google Cloud Vision OCR**:
   - Executes `DOCUMENT_TEXT_DETECTION` optimized for dense, multi-column medical records and handwritten provider scripts.
   - Preserves reading order and block/paragraph hierarchies.
   - Extracts character-level and word-level confidence metrics ($\text{Confidence} \in [0.0, 1.0]$).
4. **Provider-Agnostic Abstraction (`OCRProvider`)**:
   - Enables hot-swapping between Google Cloud Vision, Tesseract, AWS Textract, or Azure Document Intelligence without refactoring downstream pipeline services.

---

## 4. Text Normalization Pipeline

Raw clinical transcriptions frequently contain OCR noise, hyphenated line wraps, non-standard abbreviations, and irregular whitespace. The normalizer applies:
- Unicode canonical decomposition (NFKD) and ASCII preservation.
- Linebreak reconciliation preserving paragraph boundaries (`\r\n` $\rightarrow$ `\n`).
- Medical whitespace collapsing without corrupting table-like alignment.
- Preservation of clinical shorthand (`s/p`, `c/o`, `NKDA`, `WNL`, `PRN`, `QID`, `BID`, `PO`).

---

## 5. Clinical Entity Extraction & Grounding

ClinixLens extracts six primary clinical entity classes:
1. **Patient Demographics**: Name, Age, Gender, MRN/Record ID, Encounter Date.
2. **Symptoms**: Chief complaints, associated symptoms, timeline, severity.
3. **Diagnoses & Conditions**: Provisional and confirmed diagnoses mapped alongside ICD-10 qualifiers where documented.
4. **Medications**: Drug name, active ingredient, dosage, frequency, administration route (`PO`, `IV`, `SubQ`, `Inhaled`).
5. **Vital Signs**: Systolic/Diastolic BP ($\text{mmHg}$), Heart Rate ($\text{bpm}$), Respiratory Rate ($\text{rpm}$), Temperature ($^\circ\text{F}/^\circ\text{C}$), Oxygen Saturation ($\text{SpO}_2$), Weight, Height, BMI.
6. **Allergies & Contraindications**: Specific allergens and documented reaction phenotypes (anaphylaxis, hives, rash).

### Verbatim Grounding Rule
Every extracted entity **MUST** retain:
- `source_text`: Exact verbatim quotation from the original document.
- `page_reference`: The exact page or section index where the evidence was located.
- `confidence`: Calibrated confidence coefficient ($0.0 - 1.0$).

---

## 6. AI Prompt Architecture & Structured JSON Contract

ClinixLens uses **Google Gemini 1.5 Flash** with low sampling temperature ($T = 0.1$) and nucleus sampling ($p = 0.95$) to prioritize determinism and factual adherence.

### Prompt System Directives
```
1. Extract ONLY information explicitly stated in the document.
2. Never invent, hallucinate, or extrapolate facts not present.
3. If information is not found, leave the field null — do NOT fabricate values.
4. Assign confidence honestly: high (>0.8) only for clearly stated information.
5. Flag any potential inconsistencies detected in the document.
6. Note missing information that would typically be expected in a clinical record.
7. Return strictly valid JSON adhering to the target schema.
```

---

## 7. Strict Pydantic Validation & Defensive Recovery

Raw LLM responses are **never trusted**. Every AI output passes through the `StructuredClinicalReport` Pydantic validator:

```python
class StructuredClinicalReport(BaseModel):
    report_summary: str
    patient_information: PatientInformation
    symptoms: List[ClinicalEntity]
    diagnoses: List[ClinicalEntity]
    medications: List[MedicationInfo]
    vitals: VitalSigns
    allergies: List[ClinicalEntity]
    clinical_observations: List[ClinicalEntity]
    clinical_concerns: List[ClinicalConcern]
    missing_information: List[MissingInfoItem]
    potential_inconsistencies: List[InconsistencyItem]
    requires_review: List[ReviewItem]
    overall_confidence: float = Field(ge=0.0, le=1.0)
    document_quality_score: float = Field(ge=0.0, le=1.0)
```

### Self-Healing & Parsing Recovery
1. **Markdown Fence Stripping**: Regex removes unintended ```json ... ``` enclosures.
2. **Trailing Comma Remediation**: Removes syntax errors common in LLM JSON streams (`,\s*([}\]])`).
3. **Graceful Attribute Degradation**: If an individual entity fails type validation, valid sibling entities are retained while the malformed element is flagged for manual review rather than failing the entire request.
4. **Deterministic Fallback Pipeline**: If the LLM service exceeds timeout thresholds or exhausts retries, the deterministic clinical parser (`DeterministicExtractor`) executes immediately, ensuring 100% operational uptime.

---

## 8. Clinical Consistency Radar (Rule-Based Detection)

Clinical inconsistencies are dangerous and easily overlooked during hurried chart reviews. ClinixLens runs an autonomous consistency check across the validated structured data:

| Consistency Category | Logic / Heuristic | Severity |
|---|---|---|
| **Allergy vs. Prescription** | Documented penicillin allergy with prescription for amoxicillin, augmentin, or ampicillin | **HIGH** |
| **Vital Sign Extremes** | Heart rate $<30$ or $>180\text{ bpm}$; SpO2 $<92\%$ without oxygen documentation | **HIGH** |
| **Conflicting Vitals** | Baseline BP differing by $>35\text{ mmHg}$ systolic from discharge exam within same encounter | **HIGH** |
| **Age Conflicts** | Discrepant age mentions (e.g. Header says 64 yo, HPI narrative states 46 yo) | **MEDIUM** |
| **Duplicate Medications** | Identical chemical agent prescribed multiple times with differing dosages | **MEDIUM** |
| **Pediatric Contraindications** | Pediatric-specific formulation prescribed to adult patient | **MEDIUM** |

*Crucial UX Note*: This feature is explicitly designated in the UI as a **"Document Consistency Indicator"** to prevent misleading users into treating it as diagnostic medical advice.

---

## 9. Missing Information Map

Rather than leaving absent information ambiguous, ClinixLens renders a comprehensive **Information Completeness Matrix**:
- **Patient Demographics**: Checks presence of Name, Age, Gender, Patient ID, Visit Date.
- **Vital Signs**: Checks 6 cardinal parameters (BP, HR, RR, Temp, SpO2, Weight).
- **Allergies**: Actively flags whether allergy status was explicitly evaluated (even if NKDA) vs. omitted.
- **Care Plan**: Checks for follow-up timeline and return precautions.

Status indicators:
- 🟢 **Available**: All core parameters detected.
- 🟡 **Partially Available**: Incomplete fields identified.
- 🔴 **Missing**: Essential clinical baseline absent from chart.

---

## 10. Hallucination Mitigation & Uncertainty Modeling

### The Three Hallucination Vectors & Countermeasures
1. **Extrapolation Hallucination**: The model assumes a diagnosis based on a symptom (e.g., patient has cough $\rightarrow$ model outputs pneumonia).
   - *Defense*: System prompt restricts diagnosis extraction strictly to named diagnoses. Uncorroborated symptoms remain in the symptom bucket.
2. **Imputation Hallucination**: Model invents standard normal vitals when omitted.
   - *Defense*: Strict nullability in Pydantic schema. Missing vitals yield explicit `"Not available in submitted document"` notices.
3. **Fabricated Citations**: Model quotes text that does not exist in the document.
   - *Defense*: UI evidence viewer cross-references `source_text` against `raw_text`.

---

## 11. Human-in-the-Loop Verification Workflow

ClinixLens enforces clinician oversight through the **Human Review Mode**:
- Each clinical finding is instantiated with `verification_status = "unreviewed"`.
- Reviewers can mark findings as:
  - ✓ **Verify**: Confirms entity and evidence link.
  - ⚠ **Needs Review**: Flags for senior physician or chart auditor attention.
  - ✕ **Dismiss**: Removes erroneous or irrelevant extraction.
- An interactive **Review Progress Bar** calculates completion percentage in real time.
- All verification actions record `verified_by` and UTC timestamps for audit logging.

---

## 12. Technical Trade-offs & Architecture Decisions

| Design Choice | Alternative Considered | Selected Rationale |
|---|---|---|
| **Gemini 1.5 Flash** | GPT-4o / Claude 3.5 Sonnet | Sub-second latency, native JSON structured schema mode, cost efficiency, robust medical vocabulary handling. |
| **PyMuPDF (`fitz`)** | `pypdf` / `pdfminer.six` | 10x faster C-based rendering, superior font glyph extraction, high-res rasterization for OCR. |
| **Hybrid Rules + LLM** | Pure LLM for consistency | LLMs can suffer from attention blind spots on subtle numeric discrepancies; deterministic regex & bounds checks provide infallible safety nets for vitals and allergy contraindications. |
| **Server-Sent Events (SSE)** | WebSockets | Simpler reconnection semantics, standard HTTP/2 multiplexing, zero protocol overhead through cloud proxies like Render and Vercel. |
