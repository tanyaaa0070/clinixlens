export interface PatientInformation {
  name?: string | null;
  age?: string | null;
  gender?: string | null;
  patient_id?: string | null;
  date_of_visit?: string | null;
  additional?: Record<string, string>;
}

export interface ClinicalEntity {
  category: string;
  label: string;
  value?: string | null;
  confidence?: number;
  source_text?: string | null;
  page_reference?: number | null;
}

export interface MedicationInfo {
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  route?: string | null;
  confidence?: number;
  source_text?: string | null;
}

export interface VitalSigns {
  blood_pressure?: string | null;
  heart_rate?: string | null;
  temperature?: string | null;
  respiratory_rate?: string | null;
  oxygen_saturation?: string | null;
  weight?: string | null;
  height?: string | null;
  bmi?: string | null;
  additional?: Record<string, string>;
}

export interface ClinicalConcern {
  concern: string;
  severity: 'low' | 'medium' | 'high';
  evidence?: string | null;
  recommendation?: string | null;
}

export interface MissingInfoItem {
  category: string;
  description: string;
  clinical_importance: 'low' | 'medium' | 'high';
}

export interface InconsistencyItem {
  description: string;
  evidence_a?: string | null;
  evidence_b?: string | null;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ReviewItem {
  item: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export interface StructuredClinicalReport {
  report_summary: string;
  patient_information: PatientInformation;
  symptoms: ClinicalEntity[];
  diagnoses: ClinicalEntity[];
  medications: MedicationInfo[];
  vitals: VitalSigns;
  allergies: ClinicalEntity[];
  clinical_observations: ClinicalEntity[];
  clinical_concerns: ClinicalConcern[];
  missing_information: MissingInfoItem[];
  potential_inconsistencies: InconsistencyItem[];
  requires_review: ReviewItem[];
  overall_confidence: number;
  document_quality_score: number;
}

export interface Finding {
  id: string;
  analysis_id: string;
  category: string;
  label: string;
  value?: string | null;
  confidence?: number;
  source_text?: string | null;
  page_reference?: number | null;
  verification_status: 'unreviewed' | 'verified' | 'needs_review' | 'dismissed';
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
}

export interface ProcessingEvent {
  id: string;
  stage: string;
  status: 'started' | 'completed' | 'failed' | 'warning';
  message?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface CompletenessCategory {
  category: string;
  status: 'available' | 'partial' | 'missing';
  available_count: number;
  total_expected: number | null;
  details: string[];
}

export interface AnalysisDetail {
  id: string;
  case_id: string;
  document_type: 'text' | 'pdf' | 'image';
  original_filename?: string;
  file_size_bytes?: number;
  page_count?: number;
  status: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_duration_ms?: number;
  raw_text?: string;
  ocr_required: boolean;
  ocr_confidence?: number;
  extracted_entities: ClinicalEntity[];
  ai_report: StructuredClinicalReport;
  consistency_issues: InconsistencyItem[];
  missing_information: CompletenessCategory[];
  overall_confidence?: number;
  concerns_count: number;
  missing_info_count: number;
  review_status: string;
  review_progress: number;
  processing_trace: any[];
  error_message?: string;
  is_synthetic: boolean;
  synthetic_case_id?: string;
  created_at: string;
  updated_at: string;
  findings: Finding[];
  processing_events: ProcessingEvent[];
}

export interface AnalysisListItem {
  id: string;
  case_id: string;
  document_type: string;
  original_filename?: string;
  status: string;
  overall_confidence?: number;
  concerns_count: number;
  missing_info_count: number;
  review_status: string;
  review_progress: number;
  is_synthetic: boolean;
  processing_duration_ms?: number;
  created_at: string;
  updated_at: string;
  report_summary?: string;
}

export interface SyntheticCase {
  id: string;
  title: string;
  category: string;
  patient_identifier: string;
  patient_name: string;
  patient_age: string;
  patient_gender: string;
  visit_date: string;
  expected_challenge: string;
  text: string;
}

export interface StatsData {
  total_analyses: number;
  completed_analyses: number;
  needs_review_count: number;
  failed_count: number;
  average_processing_time_ms: number;
  average_confidence: number;
}

export interface HealthData {
  status: string;
  version: string;
  ai_engine: string;
  database: string;
  ocr_service: string;
  uptime_seconds: number;
}
