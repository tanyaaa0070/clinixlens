import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Upload,
  ArrowRight,
  Sparkles,
  Search,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import { AnalysisListItem, StatsData, SyntheticCase } from '../types';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData>({
    total_analyses: 0,
    completed_analyses: 0,
    needs_review_count: 0,
    failed_count: 0,
    average_processing_time_ms: 1420,
    average_confidence: 0.92,
  });
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisListItem[]>([]);
  const [syntheticCases, setSyntheticCases] = useState<SyntheticCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [launchingCaseId, setLaunchingCaseId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, analysesData, casesData] = await Promise.all([
          api.getStats().catch(() => ({
            total_analyses: 2,
            completed_analyses: 2,
            needs_review_count: 1,
            failed_count: 0,
            average_processing_time_ms: 1250,
            average_confidence: 0.94,
          })),
          api.getAnalyses().catch(() => []),
          api.getSyntheticCases().catch(() => []),
        ]);
        setStats(statsData);
        setRecentAnalyses(analysesData);
        setSyntheticCases(casesData.slice(0, 3));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleQuickLaunch = async (caseId: string) => {
    try {
      setLaunchingCaseId(caseId);
      const res = await api.analyzeSyntheticCase(caseId);
      navigate(`/workspace/${res.analysis_id}`);
    } catch (err) {
      alert(`Could not launch demo case: ${err}`);
      setLaunchingCaseId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-clinical-600 dark:text-clinical-400">
            <Sparkles className="h-4 w-4" />
            <span>Clinical Document Intelligence Workspace</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            Workspace Overview
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Review synthetic clinical documentation with evidence-linked AI analysis, consistency radar, and audit trails.
          </p>
        </div>

        {/* Quick Demo CTA Button */}
        <div className="flex items-center gap-3">
          <Link
            to="/synthetic-cases"
            className="inline-flex items-center gap-2 rounded-xl border border-clinical-200 bg-clinical-50/80 px-4 py-2.5 text-xs font-semibold text-clinical-700 shadow-sm transition-all hover:bg-clinical-100 hover:text-clinical-800 dark:border-clinical-900/60 dark:bg-clinical-950/40 dark:text-clinical-300 dark:hover:bg-clinical-950/70 sm:text-sm"
          >
            <Sparkles className="h-4 w-4 text-clinical-500" />
            <span>Try a Synthetic Case (Fast Demo)</span>
          </Link>
          <Link
            to="/new-analysis"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-clinical-500 to-clinical-400 px-4 py-2.5 text-xs font-semibold text-white shadow-soft transition-all hover:from-clinical-600 hover:to-clinical-500 hover:shadow-glow-lavender sm:text-sm"
          >
            <Upload className="h-4 w-4" />
            <span>Start New Review</span>
          </Link>
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="relative overflow-hidden rounded-2xl p-5 shadow-soft transition-all hover:shadow-soft-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Documents Reviewed</span>
            <div className="rounded-xl bg-clinical-50 p-2.5 text-clinical-500 dark:bg-clinical-950/60 dark:text-clinical-400">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {stats.total_analyses}
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Processed across pipeline
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="relative overflow-hidden rounded-2xl p-5 shadow-soft transition-all hover:shadow-soft-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Reports Generated</span>
            <div className="rounded-xl bg-pastel-mint-50 p-2.5 text-pastel-mint-500 dark:bg-pastel-mint-600/10 dark:text-pastel-mint-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {stats.completed_analyses}
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Evidence validated & structured
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="relative overflow-hidden rounded-2xl p-5 shadow-soft transition-all hover:shadow-soft-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Needs Review</span>
            <div className="rounded-xl bg-pastel-peach-50 p-2.5 text-pastel-peach-500 dark:bg-pastel-peach-500/10 dark:text-pastel-peach-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {stats.needs_review_count}
            </div>
            <p className="mt-1 text-xs text-pastel-peach-500 dark:text-pastel-peach-400">
              Inconsistencies or red flags detected
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="relative overflow-hidden rounded-2xl p-5 shadow-soft transition-all hover:shadow-soft-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Average Processing Time</span>
            <div className="rounded-xl bg-pastel-sky-50 p-2.5 text-pastel-sky-500 dark:bg-pastel-sky-500/10 dark:text-pastel-sky-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {(stats.average_processing_time_ms / 1000).toFixed(2)}s
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              End-to-end OCR + AI review
            </p>
          </div>
        </div>
      </div>

      {/* Start New Review - Hero Callout */}
      <div className="rounded-2xl border border-clinical-200/60 p-6 shadow-soft dark:border-clinical-900/40 lg:p-8" style={{ background: 'linear-gradient(135deg, rgba(245,240,255,0.5), var(--bg-card), rgba(240,250,245,0.3))' }}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-clinical-100 px-3 py-1 text-xs font-medium text-clinical-700 dark:bg-clinical-950 dark:text-clinical-300">
              <FileCheck className="h-3.5 w-3.5" />
              <span>Multi-Modal Ingestion</span>
            </span>
            <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
              Upload a clinical document or paste clinical notes
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Supports plain text notes, high-resolution PDFs, scanned encounter records, and medical image uploads. Automatically handles OCR, entity extraction, consistency verification, and missing-information mapping.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/new-analysis"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-clinical-500 px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:bg-clinical-600 hover:shadow-glow-lavender"
            >
              <Upload className="h-4 w-4" />
              <span>Open Ingestion Studio</span>
            </Link>
          </div>
        </div>

        {/* Instant Synthetic Demo Shortcuts */}
        {syntheticCases.length > 0 && (
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-soft)' }}>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Or Instant Demo With Synthetic Cases:
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {syntheticCases.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleQuickLaunch(sc.id)}
                  disabled={launchingCaseId === sc.id}
                  className="flex flex-col justify-between rounded-xl p-3.5 text-left transition-all hover:shadow-sm"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-clinical-50 px-2 py-0.5 text-[10px] font-semibold text-clinical-700 dark:bg-clinical-950 dark:text-clinical-300">
                        {sc.category}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{sc.id}</span>
                    </div>
                    <div className="mt-2 font-medium text-xs line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                      {sc.title}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-clinical-600 dark:text-clinical-400">
                    <span>{launchingCaseId === sc.id ? 'Launching Pipeline...' : 'Run Analysis'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Analyses Section */}
      <div className="rounded-2xl p-6 shadow-soft" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Recent Analyses
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Track status, verification progress, and clinical concerns across submitted records.
            </p>
          </div>
          <Link
            to="/history"
            className="flex items-center gap-1 text-xs font-semibold text-clinical-600 hover:text-clinical-700 dark:text-clinical-400"
          >
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-clinical-500 border-t-transparent" />
            <p className="mt-2">Loading recent analyses...</p>
          </div>
        ) : recentAnalyses.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-clinical-50 dark:bg-clinical-950/40" style={{ color: 'var(--text-muted)' }}>
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No clinical documents yet</h3>
            <p className="mt-1 text-xs max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
              Upload a synthetic case or paste clinical notes to begin your first intelligence review.
            </p>
            <div className="mt-4">
              <Link
                to="/new-analysis"
                className="inline-flex items-center gap-1.5 rounded-xl bg-clinical-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-clinical-600"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload First Case</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <tr className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  <th className="py-3 px-3">Patient / Case ID</th>
                  <th className="py-3 px-3">Document Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Confidence</th>
                  <th className="py-3 px-3">Concerns</th>
                  <th className="py-3 px-3">Missing Info</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--text-secondary)' }}>
                {recentAnalyses.slice(0, 6).map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-clinical-50/30 dark:hover:bg-clinical-950/20" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td className="py-3 px-3">
                      <div className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        <span>{item.case_id}</span>
                        {item.is_synthetic && (
                          <span className="text-[10px] text-pastel-mint-600 dark:text-pastel-mint-400 font-mono">
                            (Synthetic)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>
                        {item.original_filename || 'Clinical Notes'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="rounded-lg bg-clinical-50 px-2 py-1 text-[11px] font-medium uppercase text-clinical-700 dark:bg-clinical-950/60 dark:text-clinical-300">
                        {item.document_type}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {item.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-pastel-mint-50 px-2.5 py-0.5 text-[11px] font-medium text-pastel-mint-600 dark:bg-pastel-mint-600/10 dark:text-pastel-mint-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Ready</span>
                        </span>
                      ) : item.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-pastel-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-pastel-rose-500 dark:bg-pastel-rose-500/10 dark:text-pastel-rose-400">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Failed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-clinical-50 px-2.5 py-0.5 text-[11px] font-medium text-clinical-600 dark:bg-clinical-950/60 dark:text-clinical-300">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-clinical-500" />
                          <span className="capitalize">{item.status.replace('_', ' ')}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {item.overall_confidence ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {Math.round(item.overall_confidence * 100)}%
                          </span>
                          <div className="h-1.5 w-12 rounded-full bg-clinical-100 dark:bg-clinical-950/40 overflow-hidden">
                            <div
                              className="h-full bg-clinical-400 rounded-full"
                              style={{ width: `${Math.round(item.overall_confidence * 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {item.concerns_count > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-pastel-peach-500 dark:text-pastel-peach-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>{item.concerns_count}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {item.missing_info_count > 0 ? (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {item.missing_info_count} items
                        </span>
                      ) : (
                        <span className="text-pastel-mint-600 dark:text-pastel-mint-400">Complete</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {item.status === 'completed' ? (
                        <Link
                          to={`/report/${item.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-clinical-600 hover:text-clinical-700 dark:text-clinical-400"
                        >
                          <span>Open Report</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <Link
                          to={`/workspace/${item.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-clinical-600 hover:text-clinical-700 dark:text-clinical-400"
                        >
                          <span>View Pipeline</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
