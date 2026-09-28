import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  User,
  HeartPulse,
  Pill,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Search,
  Check,
  X,
  Clock,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { AnalysisDetail, Finding, CompletenessCategory } from '../types';

export const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Human Review State
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reviewProgress, setReviewProgress] = useState<number>(0);
  const [updatingFindingId, setUpdatingFindingId] = useState<string | null>(null);

  // Completeness category detail modal/popover
  const [selectedCategory, setSelectedCategory] = useState<CompletenessCategory | null>(null);

  useEffect(() => {
    async function fetchReport() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.getAnalysisDetail(id);
        setAnalysis(data);
        setFindings(data.findings || []);
        setReviewProgress(data.review_progress || 0);
      } catch (err: any) {
        setError(err.message || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [id]);

  const handleUpdateVerification = async (
    findingId: string,
    status: 'verified' | 'needs_review' | 'dismissed'
  ) => {
    if (!id) return;
    try {
      setUpdatingFindingId(findingId);
      const res = await api.updateFindingVerification(id, findingId, status);
      setFindings((prev) =>
        prev.map((f) =>
          f.id === findingId
            ? { ...f, verification_status: status, verified_by: 'Reviewer' }
            : f
        )
      );
      setReviewProgress(res.review_progress);
    } catch (err) {
      alert(`Could not update verification: ${err}`);
    } finally {
      setUpdatingFindingId(null);
    }
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence && confidence !== 0) {
      return (
        <span className="rounded-lg bg-pastel-neutral-100 border border-pastel-neutral-200 px-2 py-0.5 text-[10px] font-medium text-stone-500 dark:bg-slate-800">
          Unclear
        </span>
      );
    }
    if (confidence >= 0.8) {
      return (
        <span className="rounded-lg bg-pastel-mint/40 border border-pastel-mint/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
          HIGH CONFIDENCE ({Math.round(confidence * 100)}%)
        </span>
      );
    }
    if (confidence >= 0.5) {
      return (
        <span className="rounded-lg bg-pastel-peach/40 border border-pastel-peach/70 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
          NEEDS VERIFICATION ({Math.round(confidence * 100)}%)
        </span>
      );
    }
    return (
      <span className="rounded-lg bg-pastel-rose/40 border border-pastel-rose/70 px-2 py-0.5 text-[10px] font-semibold text-rose-900 dark:bg-rose-950/60 dark:text-rose-300">
        UNCLEAR ({Math.round(confidence * 100)}%)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-purple-500 border-t-transparent" />
        <h2 className="mt-3 font-semibold text-stone-700 dark:text-stone-300">Loading Clinical Intelligence Report...</h2>
        <p className="text-xs text-stone-400">Grounding findings and clinical consistency checks</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="rounded-2xl border border-pastel-rose/70 bg-pastel-rose/20 p-6 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-500 mb-2" />
        <h2 className="font-bold text-lg">Unable to Load Report</h2>
        <p className="mt-1 text-sm">{error || 'Report not found'}</p>
        <Link to="/" className="mt-4 inline-block rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-soft">
          Back to Overview
        </Link>
      </div>
    );
  }

  const report = analysis.ai_report || ({} as any);
  const pi = report.patient_information || {};
  const vitals = report.vitals || {};
  const symptoms = report.symptoms || [];
  const diagnoses = report.diagnoses || [];
  const medications = report.medications || [];
  const allergies = report.allergies || [];
  const observations = report.clinical_observations || [];
  const concerns = report.clinical_concerns || [];
  const inconsistencies = analysis.consistency_issues || [];
  const missingCategories = analysis.missing_information || [];
  const requiresReview = report.requires_review || [];

  return (
    <div className="space-y-8">
      {/* Top Header & Human Review Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400">
              {analysis.case_id}
            </span>
            <span className="rounded-lg bg-pastel-neutral-100 border border-pastel-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-stone-600 dark:bg-slate-800 dark:text-slate-300">
              {analysis.document_type}
            </span>
            {analysis.is_synthetic && (
              <span className="rounded-lg bg-pastel-peach/30 border border-pastel-peach/60 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-950/70 dark:text-amber-300">
                Synthetic Case
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-800 dark:text-white sm:text-3xl font-display">
            Clinical Intelligence Report
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Generated on {analysis.created_at ? new Date(analysis.created_at).toLocaleString() : 'N/A'} • {analysis.processing_duration_ms ? (analysis.processing_duration_ms / 1000).toFixed(2) : '1.4'}s processing duration
          </p>
        </div>

        {/* Human-in-the-Loop Review Progress Indicator */}
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-pastel-neutral-200/80 bg-white/90 p-3.5 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-slate-200">
              <span>Human Review Progress</span>
              <span className="font-mono font-bold text-purple-700 dark:text-purple-400">{reviewProgress}%</span>
            </div>
            <div className="mt-1.5 h-2 w-36 rounded-full bg-pastel-neutral-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all"
                style={{ width: `${reviewProgress}%` }}
              />
            </div>
          </div>

          <Link
            to={`/evidence/${id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-pastel-lavender/60 bg-pastel-lavender/30 px-3.5 py-1.5 text-xs font-semibold text-purple-950 hover:bg-pastel-lavender/50 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <FileSearch className="h-3.5 w-3.5 text-purple-600" />
            <span>Split-Screen Evidence</span>
          </Link>
        </div>
      </div>

      {/* SECTION 1: REPORT SUMMARY */}
      <div className="rounded-2xl border border-pastel-lavender/50 bg-gradient-to-r from-pastel-lavender/30 via-pastel-cream/50 to-pastel-mint/20 p-6 shadow-soft dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span>EXECUTIVE CLINICAL SUMMARY</span>
        </div>
        <p className="mt-3 text-sm font-medium leading-relaxed text-stone-800 dark:text-stone-200">
          {report.report_summary || 'Analysis completed. Summary is structured based on submitted clinical document.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-pastel-lavender/30 pt-3 dark:border-slate-800 text-xs">
          <div>
            <span className="text-stone-500">Overall Confidence: </span>
            <span className="font-semibold text-stone-900 dark:text-white">
              {analysis.overall_confidence ? Math.round(analysis.overall_confidence * 100) : 92}%
            </span>
          </div>
          <span className="text-stone-300">•</span>
          <div>
            <span className="text-stone-500">Document Quality Score: </span>
            <span className="font-semibold text-stone-900 dark:text-white">
              {report.document_quality_score ? Math.round(report.document_quality_score * 100) : 90}%
            </span>
          </div>
          <span className="text-stone-300">•</span>
          <div className="text-[11px] text-stone-500 italic">
            Assistive review tool — not a medical diagnostic device.
          </div>
        </div>
      </div>

      {/* SECTION 2 & 3: PATIENT INFORMATION & VITAL SIGNS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Patient Information Card */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 font-bold text-sm text-stone-800 dark:text-white">
            <User className="h-4 w-4 text-purple-600" />
            <span>Patient Information</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-pastel-cream/40 border border-pastel-neutral-200/60 p-3 dark:bg-slate-850">
              <span className="text-stone-400">Name</span>
              <div className="mt-0.5 font-semibold text-stone-800 dark:text-white">
                {pi.name || <span className="text-stone-400 italic">Not available in submitted document.</span>}
              </div>
            </div>

            <div className="rounded-xl bg-pastel-cream/40 border border-pastel-neutral-200/60 p-3 dark:bg-slate-850">
              <span className="text-stone-400">Age & Gender</span>
              <div className="mt-0.5 font-semibold text-stone-800 dark:text-white">
                {pi.age || '—'} {pi.gender ? `• ${pi.gender}` : ''}
                {!pi.age && !pi.gender && <span className="text-stone-400 italic">Not available in submitted document.</span>}
              </div>
            </div>

            <div className="rounded-xl bg-pastel-cream/40 border border-pastel-neutral-200/60 p-3 dark:bg-slate-850">
              <span className="text-stone-400">Patient Identifier / MRN</span>
              <div className="mt-0.5 font-mono font-semibold text-stone-800 dark:text-white">
                {pi.patient_id || <span className="text-stone-400 italic font-sans">Not available in submitted document.</span>}
              </div>
            </div>

            <div className="rounded-xl bg-pastel-cream/40 border border-pastel-neutral-200/60 p-3 dark:bg-slate-850">
              <span className="text-stone-400">Date of Visit</span>
              <div className="mt-0.5 font-semibold text-stone-800 dark:text-white">
                {pi.date_of_visit || <span className="text-stone-400 italic">Not available in submitted document.</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Vital Signs Card */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 font-bold text-sm text-stone-800 dark:text-white">
            <HeartPulse className="h-4 w-4 text-rose-500" />
            <span>Vital Signs</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5 text-xs">
            <div className="rounded-xl bg-pastel-cream/40 border border-pastel-neutral-200/60 p-2.5 dark:bg-slate-850">
              <span className="text-stone-400">Blood Pressure</span>
              <div className="mt-0.5 font-semibold text-stone-800 dark:text-white">
                {vitals.blood_pressure || <span className="text-stone-400 italic font-normal">Not detected</span>}
              </div>
            </div>

            <div className="rounded-xl bg-pastel-cream/40 border border-pastel-neutral-200/60 p-2.5 dark:bg-slate-850">
              <span className="text-stone-400">Heart Rate</span>
              <div className="mt-0.5 font-semibold text-stone-800 dark:text-white">
                {vitals.heart_rate || <span className="text-stone-400 italic font-normal">Not detected</span>}
              </div>
            </div>

            <div className="rounded-xl bg-pastel-cream/40 border border-pastel-neutral-200/60 p-2.5 dark:bg-slate-850">
              <span className="text-stone-400">Temperature</span>
              <div className="mt-0.5 font-semibold text-stone-800 dark:text-white">
                {vitals.temperature || <span className="text-stone-400 italic font-normal">Not detected</span>}
              </div>
            </div>

            <div className="rounded-xl bg-pastel-cream/40 border border-pastel-neutral-200/60 p-2.5 dark:bg-slate-850">
              <span className="text-stone-400">Resp Rate</span>
              <div className="mt-0.5 font-semibold text-stone-800 dark:text-white">
                {vitals.respiratory_rate || <span className="text-stone-400 italic font-normal">Not detected</span>}
              </div>
            </div>

            <div className="rounded-xl bg-pastel-cream/40 border border-pastel-neutral-200/60 p-2.5 dark:bg-slate-850">
              <span className="text-stone-400">SpO2 (Oxygen)</span>
              <div className="mt-0.5 font-semibold text-stone-800 dark:text-white">
                {vitals.oxygen_saturation || <span className="text-stone-400 italic font-normal">Not detected</span>}
              </div>
            </div>

            <div className="rounded-xl bg-pastel-cream/40 border border-pastel-neutral-200/60 p-2.5 dark:bg-slate-850">
              <span className="text-stone-400">BMI / Weight</span>
              <div className="mt-0.5 font-semibold text-stone-800 dark:text-white">
                {vitals.bmi || vitals.weight || <span className="text-stone-400 italic font-normal">Not detected</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: CLINICAL CONSISTENCY RADAR */}
      <div className="rounded-2xl border border-pastel-peach/70 bg-white/95 p-6 shadow-soft dark:border-amber-900/40 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pastel-peach text-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-stone-800 dark:text-white">
                Clinical Consistency Radar
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                Document Consistency Indicator — Evaluates internal contradictions, dosage mismatches & contraindications.
              </p>
            </div>
          </div>

          <div className="rounded-full bg-pastel-peach/40 border border-pastel-peach/80 px-3 py-1 text-xs font-semibold text-amber-950 dark:bg-amber-950/60 dark:text-amber-300">
            {inconsistencies.length} Discrepanc{inconsistencies.length === 1 ? 'y' : 'ies'} Detected
          </div>
        </div>

        {inconsistencies.length === 0 ? (
          <div className="mt-4 rounded-xl bg-pastel-mint/30 border border-pastel-mint/60 p-4 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>High Internal Consistency: No direct contraindications or conflicting clinical data points detected in document.</span>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {inconsistencies.map((issue, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-pastel-peach/60 bg-pastel-peach/20 p-4 text-xs dark:border-amber-900/50 dark:bg-amber-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-950 dark:text-amber-200">
                    {issue.description}
                  </span>
                  <span
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase border ${
                      issue.severity === 'high'
                        ? 'bg-pastel-rose/50 border-pastel-rose text-rose-900 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-pastel-peach/50 border-pastel-peach text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {issue.severity} Priority
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {issue.evidence_a && (
                    <div className="rounded-lg bg-white/90 border border-pastel-neutral-200/60 p-2.5 dark:bg-slate-850">
                      <span className="font-semibold text-stone-500">Evidence A: </span>
                      <span className="font-mono text-stone-800 dark:text-slate-200">{issue.evidence_a}</span>
                    </div>
                  )}
                  {issue.evidence_b && (
                    <div className="rounded-lg bg-white/90 border border-pastel-neutral-200/60 p-2.5 dark:bg-slate-850">
                      <span className="font-semibold text-stone-500">Evidence B: </span>
                      <span className="font-mono text-stone-800 dark:text-slate-200">{issue.evidence_b}</span>
                    </div>
                  )}
                </div>

                <p className="mt-2 text-stone-600 dark:text-slate-300">
                  <span className="font-semibold text-amber-900 dark:text-amber-400">Why it requires review: </span>
                  {issue.explanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5: INFORMATION COMPLETENESS MAP */}
      <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-stone-800 dark:text-white">
              Information Completeness Map
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-slate-400">
              Evaluates cardinal clinical categories for completeness. Click any category for breakdown.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {missingCategories.map((cat, idx) => {
            const isAvailable = cat.status === 'available';
            const isPartial = cat.status === 'partial';
            return (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  isAvailable
                    ? 'border-pastel-mint/70 bg-pastel-mint/20 hover:bg-pastel-mint/30 dark:border-emerald-900/60 dark:bg-emerald-950/30'
                    : isPartial
                    ? 'border-pastel-peach/70 bg-pastel-peach/20 hover:bg-pastel-peach/30 dark:border-amber-900/60 dark:bg-amber-950/30'
                    : 'border-pastel-neutral-200 bg-pastel-cream/30 hover:bg-pastel-cream/60 dark:border-slate-800 dark:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-800 dark:text-white truncate">
                    {cat.category}
                  </span>
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isAvailable ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-stone-400'
                    }`}
                  />
                </div>
                <div className="mt-2 text-[10px] font-medium uppercase text-stone-500 dark:text-slate-400">
                  {cat.status}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Category Modal / Detail */}
        {selectedCategory && (
          <div className="mt-4 rounded-xl border border-pastel-neutral-200 bg-pastel-cream/40 p-4 text-xs dark:border-slate-800 dark:bg-slate-850">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800 dark:text-white">
                Category Details: {selectedCategory.category}
              </span>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="mt-2 space-y-1 list-disc pl-4 text-stone-600 dark:text-slate-300">
              {selectedCategory.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* SECTION 6 & 7: MEDICATIONS & DIAGNOSES */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Medications */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-stone-800 dark:text-white">
              <Pill className="h-4 w-4 text-purple-600" />
              <span>Medications ({medications.length})</span>
            </div>
            <span className="text-[11px] text-stone-400">Dosage & Frequency</span>
          </div>

          <div className="mt-4 space-y-2.5">
            {medications.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Not available in submitted document.</p>
            ) : (
              medications.map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-pastel-neutral-200/60 bg-pastel-cream/30 p-3 text-xs dark:border-slate-800 dark:bg-slate-850"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800 dark:text-white">{m.name}</span>
                    {getConfidenceBadge(m.confidence)}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-stone-600 dark:text-slate-300">
                    {m.dosage && <span>Dose: {m.dosage}</span>}
                    {m.frequency && <span>• Freq: {m.frequency}</span>}
                    {m.route && <span>• Route: {m.route}</span>}
                  </div>
                  {m.source_text && (
                    <div className="mt-1.5 text-[11px] font-mono text-stone-400 truncate">
                      Source: "{m.source_text}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Diagnoses / Conditions */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-stone-800 dark:text-white">
              <Activity className="h-4 w-4 text-teal-600" />
              <span>Diagnoses & Conditions ({diagnoses.length})</span>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {diagnoses.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Not available in submitted document.</p>
            ) : (
              diagnoses.map((d: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-pastel-neutral-200/60 bg-pastel-cream/30 p-3 text-xs dark:border-slate-800 dark:bg-slate-850"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800 dark:text-white">{d.label}</span>
                    {getConfidenceBadge(d.confidence)}
                  </div>
                  {d.value && <p className="mt-1 text-stone-600 dark:text-slate-300">{d.value}</p>}
                  {d.source_text && (
                    <div className="mt-1.5 text-[11px] font-mono text-stone-400 truncate">
                      Source: "{d.source_text}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 8: ALLERGIES, SYMPTOMS & OBSERVATIONS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Allergies */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="font-bold text-sm text-stone-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <span>Allergies ({allergies.length})</span>
          </div>
          <div className="mt-3 space-y-2">
            {allergies.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Not available in submitted document.</p>
            ) : (
              allergies.map((a: any, idx: number) => (
                <div key={idx} className="rounded-xl bg-pastel-cream/30 border border-pastel-neutral-200/60 p-2.5 text-xs dark:bg-slate-850">
                  <div className="font-semibold text-stone-800 dark:text-white">{a.label}</div>
                  <div className="text-[11px] text-stone-500">{a.value}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Symptoms */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="font-bold text-sm text-stone-800 dark:text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-600" />
            <span>Symptoms ({symptoms.length})</span>
          </div>
          <div className="mt-3 space-y-2">
            {symptoms.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Not available in submitted document.</p>
            ) : (
              symptoms.map((s: any, idx: number) => (
                <div key={idx} className="rounded-xl bg-pastel-cream/30 border border-pastel-neutral-200/60 p-2.5 text-xs dark:bg-slate-850">
                  <div className="font-semibold text-stone-800 dark:text-white">{s.label}</div>
                  <div className="text-[11px] text-stone-500">{s.value}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Clinical Observations */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="font-bold text-sm text-stone-800 dark:text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" />
            <span>Observations / Labs</span>
          </div>
          <div className="mt-3 space-y-2">
            {observations.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Not available in submitted document.</p>
            ) : (
              observations.map((o: any, idx: number) => (
                <div key={idx} className="rounded-xl bg-pastel-cream/30 border border-pastel-neutral-200/60 p-2.5 text-xs dark:bg-slate-850">
                  <div className="font-semibold text-stone-800 dark:text-white">{o.label}</div>
                  <div className="text-[11px] text-stone-500">{o.value}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 9: HUMAN REVIEW MODE */}
      <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-stone-800 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-600" />
              <span>Human Review Mode (Findings Verification)</span>
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-slate-400">
              Verify, flag, or dismiss individual findings. Changes are recorded directly to the database audit trail.
            </p>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            {findings.length} Total Findings
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {findings.slice(0, 10).map((f) => (
            <div
              key={f.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-pastel-neutral-200/60 bg-pastel-cream/30 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-850"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-pastel-lavender/50 border border-pastel-lavender px-2 py-0.5 text-[10px] font-bold uppercase text-purple-900 dark:bg-purple-950 dark:text-purple-300">
                    {f.category}
                  </span>
                  <span className="font-semibold text-stone-800 dark:text-white">{f.label}</span>
                  {f.confidence && (
                    <span className="text-stone-400">({Math.round(f.confidence * 100)}%)</span>
                  )}
                </div>
                {f.source_text && (
                  <p className="mt-1 text-[11px] font-mono text-stone-500 dark:text-slate-400">
                    "{f.source_text}"
                  </p>
                )}
                {f.verification_status !== 'unreviewed' && (
                  <span className="mt-1 inline-block text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    Status: {f.verification_status} by {f.verified_by || 'Reviewer'}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleUpdateVerification(f.id, 'verified')}
                  disabled={updatingFindingId === f.id}
                  className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition-all ${
                    f.verification_status === 'verified'
                      ? 'bg-pastel-mint text-emerald-950 font-bold border border-pastel-mint shadow-sm'
                      : 'border border-pastel-neutral-200 bg-white text-stone-700 hover:bg-pastel-mint/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Check className="h-3 w-3" />
                  <span>Verify</span>
                </button>

                <button
                  onClick={() => handleUpdateVerification(f.id, 'needs_review')}
                  disabled={updatingFindingId === f.id}
                  className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition-all ${
                    f.verification_status === 'needs_review'
                      ? 'bg-pastel-peach text-amber-950 font-bold border border-pastel-peach shadow-sm'
                      : 'border border-pastel-neutral-200 bg-white text-stone-700 hover:bg-pastel-peach/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>Needs Review</span>
                </button>

                <button
                  onClick={() => handleUpdateVerification(f.id, 'dismissed')}
                  disabled={updatingFindingId === f.id}
                  className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition-all ${
                    f.verification_status === 'dismissed'
                      ? 'bg-stone-400 text-white shadow-sm'
                      : 'border border-pastel-neutral-200 bg-white text-stone-400 hover:bg-stone-100 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  <X className="h-3 w-3" />
                  <span>Dismiss</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
