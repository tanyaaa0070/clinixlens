import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TestTube2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertTriangle,
  HelpCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { SyntheticCase } from '../types';

export const SyntheticStudio: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<SyntheticCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [previewCase, setPreviewCase] = useState<SyntheticCase | null>(null);

  useEffect(() => {
    async function loadCases() {
      try {
        setLoading(true);
        const data = await api.getSyntheticCases();
        setCases(data);
      } catch (err) {
        console.error('Failed to load synthetic cases', err);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, []);

  const handleLaunchCase = async (caseId: string) => {
    try {
      setLaunchingId(caseId);
      const res = await api.analyzeSyntheticCase(caseId);
      navigate(`/workspace/${res.analysis_id}`);
    } catch (err) {
      alert(`Could not analyze case: ${err}`);
      setLaunchingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-pastel-lavender/40 px-3 py-1 text-xs font-semibold text-purple-900 border border-pastel-lavender/60">
            <TestTube2 className="h-3.5 w-3.5 text-purple-600" />
            <span>Demonstration & Evaluation Suite</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-800 dark:text-white sm:text-3xl font-display">
            Synthetic Case Studio
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Pre-configured synthetic patient encounters designed to evaluate OCR, consistency radar, and entity extraction in under 2 minutes.
          </p>
        </div>

        {/* Synthetic Data Certification Notice */}
        <div className="inline-flex items-center gap-2 rounded-2xl border border-pastel-mint/80 bg-pastel-mint/20 px-4 py-2.5 text-xs font-semibold text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-soft">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Strictly Synthetic — 0% Real Patient Identifiers Used</span>
        </div>
      </div>

      {/* Grid of 6 Demonstration Cases */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-purple-500 border-t-transparent" />
          <p className="mt-2 text-xs text-stone-500 font-medium">Loading synthetic patient studio...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <div
              key={c.id}
              className="flex flex-col justify-between rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-6 shadow-soft transition-all hover:border-pastel-lavender hover:shadow-soft-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div>
                {/* Category & ID */}
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-pastel-lavender/40 border border-pastel-lavender/60 px-2.5 py-1 text-[11px] font-bold text-purple-900 dark:bg-purple-950 dark:text-purple-300">
                    {c.category}
                  </span>
                  <span className="font-mono text-xs text-stone-400">{c.patient_identifier}</span>
                </div>

                {/* Case Title */}
                <h3 className="mt-3 font-bold text-base text-stone-800 dark:text-white">
                  {c.title}
                </h3>

                {/* Patient Specs */}
                <div className="mt-2 flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
                  <span>{c.patient_name}</span>
                  <span>•</span>
                  <span>Age {c.patient_age}</span>
                  {c.patient_gender && (
                    <>
                      <span>•</span>
                      <span>{c.patient_gender}</span>
                    </>
                  )}
                </div>

                {/* Expected Pipeline Challenge */}
                <div className="mt-4 rounded-xl bg-pastel-cream/40 border border-pastel-neutral-200/60 p-3 text-xs dark:bg-slate-850">
                  <span className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    <span>Expected Challenge:</span>
                  </span>
                  <p className="text-stone-600 dark:text-slate-400 leading-relaxed text-[11px]">
                    {c.expected_challenge}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 flex items-center justify-between border-t border-pastel-neutral-200/60 pt-4 dark:border-slate-800">
                <button
                  onClick={() => setPreviewCase(c)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-300 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview Text</span>
                </button>

                <button
                  onClick={() => handleLaunchCase(c.id)}
                  disabled={launchingId === c.id}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all disabled:opacity-50"
                >
                  {launchingId === c.id ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Launching...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze Case</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Case Preview Modal */}
      {previewCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-pastel-neutral-200/80 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-pastel-neutral-200/60 p-4 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-stone-800 dark:text-white">
                  {previewCase.title}
                </h3>
                <span className="font-mono text-xs text-stone-400">
                  {previewCase.patient_identifier} • {previewCase.category}
                </span>
              </div>
              <button
                onClick={() => setPreviewCase(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-pastel-neutral-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap font-mono text-xs text-stone-700 dark:text-slate-300 leading-relaxed bg-pastel-cream/40 border border-pastel-neutral-200/60 p-4 rounded-xl dark:bg-slate-950">
                {previewCase.text}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-pastel-neutral-200/60 p-4 dark:border-slate-800">
              <button
                onClick={() => setPreviewCase(null)}
                className="rounded-xl border border-pastel-neutral-200 px-4 py-2 text-xs font-semibold text-stone-700 dark:border-slate-700 dark:text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const cid = previewCase.id;
                  setPreviewCase(null);
                  handleLaunchCase(cid);
                }}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-soft"
              >
                Launch This Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
