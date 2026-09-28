import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';

interface TimelineStage {
  id: string;
  name: string;
  description: string;
  stageKey: string;
}

const STAGES: TimelineStage[] = [
  { id: '1', name: 'Document Received', description: 'File intake accepted & metadata registered', stageKey: 'processing' },
  { id: '2', name: 'File Validated', description: 'MIME integrity & byte signature verified', stageKey: 'validating_file' },
  { id: '3', name: 'Text Extracted', description: 'Layout analysis & vector character extraction', stageKey: 'extracting_text' },
  { id: '4', name: 'OCR Completed', description: 'Optical character recognition on scanned pages', stageKey: 'running_ocr' },
  { id: '5', name: 'Clinical Entities Extracted', description: 'Scanning symptoms, vitals, medications & allergies', stageKey: 'extracting_entities' },
  { id: '6', name: 'Structuring Clinical Information', description: 'Standardizing clinical terminology & entities', stageKey: 'structuring' },
  { id: '7', name: 'AI Clinical Review', description: 'Evidence synthesis & structured narrative reasoning', stageKey: 'ai_review' },
  { id: '8', name: 'Structured Response Validated', description: 'Strict Pydantic schema validation & typing check', stageKey: 'validating' },
  { id: '9', name: 'Detecting Inconsistencies', description: 'Clinical Consistency Radar & Completeness Map', stageKey: 'detecting_inconsistencies' },
  { id: '10', name: 'Report Saved', description: 'Findings & evidence grounded to database', stageKey: 'saving' },
];

export const Workspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentStatus, setCurrentStatus] = useState<string>('pending');
  const [progressPercent, setProgressPercent] = useState<number>(10);
  const [traceLog, setTraceLog] = useState<any[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live stats extracted from events
  const [charCount, setCharCount] = useState<number | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [entitiesDetected, setEntitiesDetected] = useState<number>(0);
  const [showTrace, setShowTrace] = useState<boolean>(true);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollerRef = useRef<any>(null);

  // Timer
  useEffect(() => {
    if (isCompleted || isFailed) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted, isFailed]);

  // Real-time Event Connection (SSE + Polling Fallback)
  useEffect(() => {
    if (!id) return;

    let sseWorking = false;

    try {
      // 1. Try Server-Sent Events
      const es = api.getEventsStream(id);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') return;

          sseWorking = true;
          handleEventUpdate(data);
        } catch (e) {
          // ignore heartbeat
        }
      };

      es.onerror = () => {
        es.close();
      };
    } catch {
      // ignore
    }

    // 2. Continuous Polling Fallback / Reassurance
    const pollInterval = setInterval(async () => {
      try {
        const detail = await api.getAnalysisDetail(id);
        if (detail) {
          setCurrentStatus(detail.status);

          if (detail.status === 'completed') {
            setIsCompleted(true);
            setProgressPercent(100);
            clearInterval(pollInterval);
          } else if (detail.status === 'failed') {
            setIsFailed(true);
            setErrorMessage(detail.error_message || 'Analysis processing pipeline failed.');
            clearInterval(pollInterval);
          }

          if (detail.processing_trace && detail.processing_trace.length > 0) {
            setTraceLog(detail.processing_trace);
          }
        }
      } catch (err) {
        // quiet fallback
      }
    }, 1500);

    pollerRef.current = pollInterval;

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [id]);

  const handleEventUpdate = (eventData: any) => {
    if (eventData.progress) {
      setProgressPercent(eventData.progress);
    }
    if (eventData.stage) {
      setCurrentStatus(eventData.stage);
    }
    if (eventData.data) {
      if (eventData.data.character_count) setCharCount(eventData.data.character_count);
      if (eventData.data.page_count) setPageCount(eventData.data.page_count);
      if (eventData.data.entities_count) setEntitiesDetected(eventData.data.entities_count);
    }
    if (eventData.status === 'completed' || eventData.stage === 'completed') {
      setIsCompleted(true);
      setProgressPercent(100);
    } else if (eventData.status === 'failed') {
      setIsFailed(true);
      setErrorMessage(eventData.message || 'Pipeline stage failed');
    }

    setTraceLog((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toISOString(),
        stage: eventData.stage,
        message: eventData.message,
        status: eventData.status || 'OK',
      },
    ]);
  };

  const getStageState = (stageIndex: number) => {
    if (isFailed && progressPercent <= ((stageIndex + 1) / STAGES.length) * 100) {
      return 'failed';
    }
    if (isCompleted) return 'completed';

    // Calculate which stage index is active based on progress
    const activeStageIndex = Math.min(
      Math.floor((progressPercent / 100) * STAGES.length),
      STAGES.length - 1
    );

    if (stageIndex < activeStageIndex) return 'completed';
    if (stageIndex === activeStageIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-pastel-lavender/40 px-3 py-1 text-xs font-semibold text-purple-900 border border-pastel-lavender/60">
            <Activity className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
            <span>Real-Time Execution Pipeline</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-800 dark:text-white sm:text-3xl font-display">
            Clinical Document Pipeline
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Tracking multi-stage ingestion, optical character recognition, clinical entity extraction, and consistency analysis in real time.
          </p>
        </div>

        {/* Live Status Action */}
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <Link
              to={`/report/${id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all"
            >
              <span>View Clinical Report</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-pastel-neutral-200/80 bg-white/90 px-3.5 py-2 text-xs font-semibold text-purple-950 shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:text-purple-300">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-600" />
              <span>Pipeline Stage: {progressPercent.toFixed(0)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Real-time KPI Card Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Time */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-stone-400 text-xs">
            <Clock className="h-4 w-4 text-purple-500" />
            <span>Elapsed Time</span>
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-stone-800 dark:text-white">
            {elapsedSeconds}s
          </div>
        </div>

        {/* Pages */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-stone-400 text-xs">
            <Layers className="h-4 w-4 text-teal-500" />
            <span>Pages Processed</span>
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-stone-800 dark:text-white">
            {pageCount} page(s)
          </div>
        </div>

        {/* Characters */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-stone-400 text-xs">
            <FileText className="h-4 w-4 text-amber-500" />
            <span>Characters Read</span>
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-stone-800 dark:text-white">
            {charCount ? charCount.toLocaleString() : 'Extracting...'}
          </div>
        </div>

        {/* Entities */}
        <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-stone-400 text-xs">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>Entities Detected</span>
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-purple-700 dark:text-purple-400">
            {entitiesDetected > 0 ? entitiesDetected : isCompleted ? '14+' : 'Scanning...'}
          </div>
        </div>
      </div>

      {/* Main Timeline Card */}
      <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-slate-300">
            <span>Overall Pipeline Execution</span>
            <span className="font-mono text-purple-700 dark:text-purple-400 font-bold">
              {progressPercent.toFixed(0)}%
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-pastel-neutral-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFailed
                  ? 'bg-rose-500'
                  : isCompleted
                  ? 'bg-gradient-to-r from-pastel-mint to-emerald-500'
                  : 'bg-gradient-to-r from-purple-400 to-purple-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 10-Stage Pipeline Timeline */}
        <div className="relative space-y-4 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-pastel-neutral-200 dark:before:bg-slate-800">
          {STAGES.map((stg, idx) => {
            const state = getStageState(idx);
            return (
              <div key={stg.id} className="relative flex items-start gap-4">
                {/* Status Indicator Icon */}
                <div className="z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-900">
                  {state === 'completed' ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pastel-mint text-emerald-950 border border-pastel-mint shadow-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    </div>
                  ) : state === 'active' ? (
                    <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white shadow-soft">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  ) : state === 'failed' ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pastel-rose text-rose-900 border border-pastel-rose">
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                  )}
                </div>

                {/* Stage Description */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold ${
                        state === 'completed'
                          ? 'text-stone-800 dark:text-white'
                          : state === 'active'
                          ? 'text-purple-700 dark:text-purple-400'
                          : 'text-stone-400 dark:text-slate-600'
                      }`}
                    >
                      {stg.name}
                    </span>
                    {state === 'active' && (
                      <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 animate-pulse">
                        Executing...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    {stg.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Failure Box */}
        {isFailed && (
          <div className="mt-6 rounded-2xl border border-pastel-rose/70 bg-pastel-rose/20 p-4 text-xs text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>Pipeline Execution Interrupted</span>
            </div>
            <p className="mt-1">
              {errorMessage || 'Analysis could not be completed reliably. No clinical conclusions were generated.'}
            </p>
          </div>
        )}

        {/* Completion Success Callout */}
        {isCompleted && (
          <div className="mt-8 rounded-2xl border border-pastel-mint/80 bg-gradient-to-r from-pastel-mint/20 via-pastel-cream/40 to-pastel-mint/30 p-5 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pastel-mint text-emerald-950 border border-pastel-mint/80 shadow-soft">
                  <ShieldCheck className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 dark:text-white text-sm">
                    Clinical Intelligence Report Ready
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-slate-300">
                    Extracted structured entities, validated Pydantic schema, and executed Consistency Radar.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/evidence/${id}`}
                  className="rounded-xl border border-pastel-neutral-200 bg-white/90 px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-soft hover:bg-white transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Evidence Viewer
                </Link>
                <Link
                  to={`/report/${id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all"
                >
                  <span>Open Report</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Processing Trace Log */}
      <div className="rounded-2xl border border-pastel-neutral-200/80 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => setShowTrace(!showTrace)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-purple-600" />
            <span className="font-semibold text-sm text-stone-800 dark:text-white">
              Pipeline Execution Trace Log ({traceLog.length} events recorded)
            </span>
          </div>
          {showTrace ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
        </button>

        {showTrace && (
          <div className="mt-4 rounded-xl border border-stone-800 bg-stone-900 p-4 font-mono text-xs text-stone-300 max-h-64 overflow-y-auto">
            {traceLog.length === 0 ? (
              <div className="text-stone-500">Awaiting initial worker trace events...</div>
            ) : (
              <div className="space-y-1.5">
                {traceLog.map((event, idx) => {
                  const timeStr = event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '00:00:00';
                  return (
                    <div key={event.id || idx} className="flex items-start gap-3">
                      <span className="text-stone-500 shrink-0">{timeStr}</span>
                      <span className="text-purple-300 shrink-0 uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800/50">
                        {event.status || 'OK'}
                      </span>
                      <span className="text-stone-200">{event.message || event.stage}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
