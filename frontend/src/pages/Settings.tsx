import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  Database,
  Eye,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Terminal,
  KeyRound,
  Server,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { HealthData } from '../types';

export const Settings: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      setLoading(true);
      const data = await api.getHealth();
      setHealth(data);
    } catch (err) {
      console.error('Failed to probe health', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHealth();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-pastel-lavender/40 px-3 py-1 text-xs font-semibold text-purple-900 border border-pastel-lavender/60">
            <SettingsIcon className="h-3.5 w-3.5 text-purple-600" />
            <span>Diagnostics & Architecture</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-800 dark:text-white sm:text-3xl font-display">
            System Settings & Diagnostics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Real-time status of backend services, AI models, OCR engines, and database connectivity.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-pastel-neutral-200 bg-white/90 px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-soft hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          <span>Probe Health</span>
        </button>
      </div>

      {/* Component Status Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* AI Engine Status */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">AI Intelligence Core</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pastel-lavender/60 text-purple-700">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-bold text-sm text-stone-800 dark:text-white">
              {health?.ai_engine || 'Checking...'}
            </div>
            <p className="mt-1 text-[11px] text-stone-400">
              Structured JSON schema with Pydantic contract validation
            </p>
          </div>
        </div>

        {/* OCR Engine Status */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">OCR & Document Parser</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pastel-mint/60 text-emerald-700">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-bold text-sm text-stone-800 dark:text-white">
              {health?.ocr_service || 'Checking...'}
            </div>
            <p className="mt-1 text-[11px] text-stone-400">
              High-resolution 300 DPI rasterizer with layout detection
            </p>
          </div>
        </div>

        {/* Database Status */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Relational Persistence</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pastel-peach/60 text-amber-800">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-bold text-sm text-stone-800 dark:text-white">
              {health?.database || 'Connected'}
            </div>
            <p className="mt-1 text-[11px] text-stone-400">
              Async SQLAlchemy connection with migration schema
            </p>
          </div>
        </div>
      </div>

      {/* Environment & API Key Reference Guide */}
      <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-bold text-sm text-stone-800 dark:text-white">
          <KeyRound className="h-4 w-4 text-purple-600" />
          <span>Environment Variable Configuration</span>
        </div>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          ClinixLens adheres strictly to zero-secret repository practices. Configure your credentials in <code className="font-mono font-bold text-purple-700">backend/.env</code>.
        </p>

        <div className="mt-4 rounded-xl border border-stone-800 bg-stone-900 p-4 font-mono text-xs text-stone-300 overflow-x-auto">
          <div className="text-stone-500"># Google Gemini AI Key (Fast & Free Tier Available)</div>
          <div className="text-purple-300">GEMINI_API_KEY=your_gemini_api_key_here</div>
          <div className="text-stone-500 mt-2"># Google Cloud Vision OCR Key (Optional - Fallbacks built in)</div>
          <div className="text-emerald-400">GOOGLE_CLOUD_VISION_API_KEY=your_vision_key_here</div>
          <div className="text-stone-500 mt-2"># Relational Database Connection (SQLite locally, PostgreSQL on Render/Railway)</div>
          <div className="text-amber-300">DATABASE_URL=sqlite+aiosqlite:///./clinixlens.db</div>
        </div>
      </div>

      {/* Regulatory & Synthetic Data Guarantee */}
      <div className="rounded-2xl border border-pastel-mint/80 bg-gradient-to-r from-pastel-mint/30 via-pastel-cream/40 to-pastel-mint/20 p-6 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
              Synthetic Data Guarantee & Medical Scope Limitation
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-emerald-900/80 dark:text-emerald-300">
              ClinixLens is strictly engineered as an administrative document review and clinical intelligence extraction tool. All demonstration cases and synthetic data generated within this workspace contain <strong>zero real patient identifiers</strong> (HIPAA Safe Harbor compliant). This system does not deliver autonomous clinical care or replace certified healthcare practitioner judgment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
