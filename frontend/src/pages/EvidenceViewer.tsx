import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';
import { AnalysisDetail, ClinicalEntity } from '../types';

export const EvidenceViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEntity, setSelectedEntity] = useState<ClinicalEntity | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api.getAnalysisDetail(id);
        setAnalysis(data);
        if (data.extracted_entities && data.extracted_entities.length > 0) {
          setSelectedEntity(data.extracted_entities[0]);
        }
      } catch (err) {
        console.error('Failed to load evidence', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-purple-500 border-t-transparent" />
        <h2 className="mt-3 font-semibold text-stone-700 dark:text-stone-300">Loading Evidence Viewer...</h2>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="py-12 text-center text-stone-500">
        Analysis record not found.
      </div>
    );
  }

  const rawDocumentText = analysis.raw_text || 'No document text recorded.';
  const entities = analysis.extracted_entities || [];

  const filteredEntities = entities.filter((e) => {
    const matchCategory = filterCategory === 'all' || e.category.toLowerCase() === filterCategory.toLowerCase();
    const matchSearch = !searchFilter || e.label.toLowerCase().includes(searchFilter.toLowerCase()) || (e.value && e.value.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // Highlight selected source text in the left pane
  const renderHighlightedDocument = () => {
    if (!selectedEntity || !selectedEntity.source_text) {
      return (
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-stone-800 dark:text-stone-200">
          {rawDocumentText}
        </pre>
      );
    }

    const targetQuote = selectedEntity.source_text.trim();
    const parts = rawDocumentText.split(targetQuote);

    if (parts.length < 2) {
      return (
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-stone-800 dark:text-stone-200">
          {rawDocumentText}
        </pre>
      );
    }

    return (
      <div className="font-mono text-xs leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <mark className="rounded-lg bg-pastel-lavender/90 px-1.5 py-0.5 font-bold text-purple-950 border border-purple-300 shadow-sm">
                {targetQuote}
              </mark>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/report/${id}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-pastel-neutral-200 bg-white text-stone-600 hover:bg-pastel-cream/40 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400">
                {analysis.case_id}
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-xs text-stone-500">Document Evidence Grounding</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-800 dark:text-white sm:text-2xl font-display">
              Split-Screen Evidence Grounding
            </h1>
          </div>
        </div>

        <Link
          to={`/report/${id}`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all"
        >
          <span>View Full Report</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Split-Screen Container */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 min-h-[650px]">
        {/* LEFT PANE: Original Document / Extracted Text (Col 7) */}
        <div className="flex flex-col rounded-2xl border border-pastel-neutral-200/80 bg-white/95 shadow-soft dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-pastel-neutral-200/60 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              <span className="font-semibold text-sm text-stone-800 dark:text-white">
                Source Document Text
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span>{analysis.page_count || 1} Page(s)</span>
              <span>•</span>
              <span className="uppercase font-semibold">{analysis.document_type}</span>
            </div>
          </div>

          {/* Active Highlight Banner */}
          {selectedEntity && (
            <div className="border-b border-pastel-lavender/60 bg-pastel-lavender/30 px-4 py-2.5 text-xs">
              <span className="font-semibold text-purple-950">
                Active Grounding Target:
              </span>{' '}
              <span className="text-purple-900 font-medium">
                {selectedEntity.label} ({selectedEntity.category})
              </span>
            </div>
          )}

          {/* Document Content Scroll View */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[600px] bg-pastel-cream/20 dark:bg-slate-950/40 rounded-b-2xl">
            {renderHighlightedDocument()}
          </div>
        </div>

        {/* RIGHT PANE: Extracted Clinical Entities (Col 5) */}
        <div className="flex flex-col rounded-2xl border border-pastel-neutral-200/80 bg-white/95 shadow-soft dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          <div className="border-b border-pastel-neutral-200/60 p-4 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="font-semibold text-sm text-stone-800 dark:text-white">
                  Extracted Clinical Entities ({filteredEntities.length})
                </span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {['all', 'symptom', 'diagnosis', 'medication', 'vital', 'allergy', 'observation'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 font-medium capitalize transition-all ${
                    filterCategory === cat
                      ? 'bg-pastel-lavender text-purple-950 font-bold border border-pastel-lavender shadow-sm'
                      : 'border border-pastel-neutral-200 bg-pastel-cream/40 text-stone-600 hover:bg-pastel-lavender/20 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Entity List */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[580px] space-y-2.5">
            {filteredEntities.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                No clinical entities found matching filters.
              </div>
            ) : (
              filteredEntities.map((ent, idx) => {
                const isSelected = selectedEntity?.label === ent.label && selectedEntity?.category === ent.category;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedEntity(ent)}
                    className={`w-full text-left rounded-xl border p-3.5 text-xs transition-all ${
                      isSelected
                        ? 'border-purple-300 bg-pastel-lavender/30 shadow-soft ring-1 ring-purple-300/50'
                        : 'border-pastel-neutral-200/60 bg-pastel-cream/30 hover:border-pastel-neutral-200 hover:bg-pastel-cream/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-pastel-lavender/50 border border-pastel-lavender px-2 py-0.5 text-[10px] font-bold uppercase text-purple-900">
                        {ent.category}
                      </span>
                      {ent.confidence && (
                        <span className="font-semibold text-emerald-700">
                          {Math.round(ent.confidence * 100)}% Conf
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 font-bold text-stone-800 dark:text-white">
                      {ent.label}
                    </div>

                    {ent.value && (
                      <div className="mt-0.5 text-stone-600 dark:text-slate-300">
                        {ent.value}
                      </div>
                    )}

                    {ent.source_text ? (
                      <div className="mt-2 rounded-lg bg-white/90 border border-pastel-neutral-200/60 p-2 font-mono text-[11px] text-stone-500 line-clamp-2">
                        Source: "{ent.source_text}"
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-stone-400 italic">
                        Derived from document synthesis
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400">
                      <span>Page {ent.page_reference || 1}</span>
                      <span className="font-semibold text-purple-700 dark:text-purple-400">
                        Click to Highlight Source →
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
