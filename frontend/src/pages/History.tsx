import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History as HistoryIcon,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Trash2,
  FileText,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { AnalysisListItem } from '../types';

export const History: React.FC = () => {
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyses();
  }, [selectedStatus]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalyses(selectedStatus, searchQuery);
      setAnalyses(data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalyses();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this analysis report?')) return;
    try {
      setDeletingId(id);
      await api.deleteAnalysis(id);
      setAnalyses((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(`Delete failed: ${err}`);
    } finally {
      setDeletingId(null);
    }
  };

  const statusFilters = [
    { label: 'All Cases', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Needs Review', value: 'needs_review' },
    { label: 'Processing', value: 'processing' },
    { label: 'Failed', value: 'failed' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-pastel-lavender/40 px-3 py-1 text-xs font-semibold text-purple-900 border border-pastel-lavender/60">
          <HistoryIcon className="h-3.5 w-3.5 text-purple-600" />
          <span>Clinical Audit Trail</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-800 dark:text-white sm:text-3xl font-display">
          Analysis History & Audit Log
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
          Search, filter, and inspect previously processed clinical notes, verification logs, and structured reports.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-pastel-neutral-200/80 bg-white/90 p-4 shadow-soft backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statusFilters.map((flt) => (
            <button
              key={flt.value}
              onClick={() => setSelectedStatus(flt.value)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                selectedStatus === flt.value
                  ? 'bg-pastel-lavender text-purple-950 font-bold shadow-sm border border-pastel-lavender/80'
                  : 'border border-pastel-neutral-200 bg-pastel-cream/40 text-stone-600 hover:bg-pastel-lavender/20 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300'
              }`}
            >
              {flt.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative sm:w-72">
          <input
            type="text"
            placeholder="Search Case ID or file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-pastel-neutral-200 bg-pastel-cream/30 py-2 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 focus:border-purple-400 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-850 dark:text-slate-100 dark:placeholder:text-slate-600"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
        </form>
      </div>

      {/* Analyses List */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-purple-500 border-t-transparent" />
          <p className="mt-2 text-xs text-stone-500 font-medium">Loading clinical records...</p>
        </div>
      ) : analyses.length === 0 ? (
        <div className="rounded-2xl border border-pastel-neutral-200 bg-white/80 p-12 text-center shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <FileText className="mx-auto h-10 w-10 text-stone-300 dark:text-slate-600" />
          <h3 className="mt-3 font-semibold text-stone-800 dark:text-white text-sm">No clinical records found</h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
            Try adjusting your search criteria or submit a new synthetic clinical note.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {analyses.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-5 shadow-soft transition-all hover:border-pastel-lavender hover:shadow-soft-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-900 dark:text-white">
                      {item.case_id}
                    </span>
                    <span className="rounded-lg bg-pastel-neutral-100 border border-pastel-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-stone-600 dark:bg-slate-800 dark:text-slate-300">
                      {item.document_type}
                    </span>
                    {item.is_synthetic && (
                      <span className="rounded-lg bg-pastel-peach/30 border border-pastel-peach/60 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-950/70 dark:text-amber-300">
                        Synthetic Demo
                      </span>
                    )}

                    {item.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-pastel-mint/40 border border-pastel-mint/70 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>Completed</span>
                      </span>
                    ) : item.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-pastel-rose/40 border border-pastel-rose/70 px-2.5 py-0.5 text-[10px] font-semibold text-rose-900 dark:bg-rose-950/60 dark:text-rose-300">
                        <AlertTriangle className="h-3 w-3 text-rose-600" />
                        <span>Failed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-pastel-lavender/40 border border-pastel-lavender/70 px-2.5 py-0.5 text-[10px] font-semibold text-purple-900 dark:bg-purple-950/60 dark:text-purple-300">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />
                        <span>Processing</span>
                      </span>
                    )}
                  </div>

                  <h3 className="mt-1 font-semibold text-sm text-stone-800 dark:text-slate-100">
                    {item.original_filename || 'Clinical Progress Record'}
                  </h3>

                  {item.report_summary && (
                    <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-slate-400 line-clamp-2">
                      {item.report_summary}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      <span>{item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</span>
                    </span>
                    {item.processing_duration_ms && (
                      <span>Duration: {(item.processing_duration_ms / 1000).toFixed(2)}s</span>
                    )}
                    {item.overall_confidence && (
                      <span>Confidence: {Math.round(item.overall_confidence * 100)}%</span>
                    )}
                    {item.concerns_count > 0 && (
                      <span className="font-semibold text-amber-700 dark:text-amber-400">
                        {item.concerns_count} Flagged Concern(s)
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 border-t border-pastel-neutral-200/60 pt-3 sm:border-0 sm:pt-0 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      disabled={deletingId === item.id}
                      className="rounded-xl p-2 text-stone-400 hover:bg-pastel-rose/30 hover:text-rose-700 transition-colors dark:hover:bg-slate-800"
                      title="Delete record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <Link
                      to={item.status === 'completed' ? `/report/${item.id}` : `/workspace/${item.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all"
                    >
                      <span>{item.status === 'completed' ? 'View Report' : 'Track Pipeline'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {item.review_progress > 0 && (
                    <span className="text-[10px] text-emerald-700 font-medium">
                      Human Review: {item.review_progress}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
