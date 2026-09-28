import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Image as ImageIcon,
  Sparkles,
  FileCheck,
  AlertCircle,
  X,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { SyntheticCase } from '../types';

type Mode = 'text' | 'pdf' | 'image';

export const NewAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('text');
  const [textInput, setTextInput] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);

  const [syntheticCases, setSyntheticCases] = useState<SyntheticCase[]>([]);
  const [selectedSyntheticId, setSelectedSyntheticId] = useState<string>('');
  const [loadingCases, setLoadingCases] = useState<boolean>(true);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  useEffect(() => {
    async function loadCases() {
      try {
        setLoadingCases(true);
        const cases = await api.getSyntheticCases();
        setSyntheticCases(cases);
      } catch (err) {
        console.error('Failed to load synthetic cases', err);
      } finally {
        setLoadingCases(false);
      }
    }
    loadCases();
  }, []);

  // Handle synthetic case selection
  const handleSelectSynthetic = (caseId: string) => {
    setSelectedSyntheticId(caseId);
    setValidationError(null);
    const chosen = syntheticCases.find((c) => c.id === caseId);
    if (chosen) {
      setMode('text');
      setTextInput(chosen.text);
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  // Validate File
  const handleFileChange = (file: File) => {
    setValidationError(null);

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      setValidationError('File exceeds maximum size of 20 MB.');
      return;
    }

    if (file.size === 0) {
      setValidationError('Selected file is empty.');
      return;
    }

    const nameLower = file.name.toLowerCase();
    if (mode === 'pdf') {
      if (!nameLower.endsWith('.pdf')) {
        setValidationError('Invalid file format. Please upload a .pdf document.');
        return;
      }
      setPdfPageCount(1); // Estimated minimum
    } else if (mode === 'image') {
      const validExts = ['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.bmp'];
      if (!validExts.some((ext) => nameLower.endsWith(ext))) {
        setValidationError('Invalid image format. Supported: PNG, JPG, JPEG, WEBP, TIFF, BMP.');
        return;
      }
      // Create thumbnail preview
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    }

    setSelectedFile(file);
    setSelectedSyntheticId('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      const isPdf = dropped.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        setMode('pdf');
      } else {
        setMode('image');
      }
      handleFileChange(dropped);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setPdfPageCount(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Pre-submission validation & dispatch
  const handleAnalyze = async () => {
    setValidationError(null);

    if (mode === 'text') {
      if (!textInput.trim()) {
        setValidationError('Please paste or type clinical text before analyzing.');
        return;
      }
      if (textInput.trim().length < 20) {
        setValidationError('Clinical note is too short for meaningful analysis (minimum 20 characters).');
        return;
      }
    } else {
      if (!selectedFile) {
        setValidationError(`Please select a ${mode.toUpperCase()} file to upload.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      let res;
      if (mode === 'text') {
        res = await api.submitTextAnalysis(textInput, selectedSyntheticId ? `Synthetic: ${selectedSyntheticId}` : 'Clinical Text Note');
      } else if (selectedFile) {
        res = await api.uploadDocument(selectedFile);
      } else {
        throw new Error('No input provided.');
      }

      // Navigate to Real-Time Processing Workspace
      navigate(`/workspace/${res.analysis_id}`);
    } catch (err: any) {
      setValidationError(err.message || 'Analysis submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
          New Clinical Review
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Upload medical records, scanned PDFs, or clinical narratives to generate structured evidence-linked intelligence.
        </p>
      </div>

      {/* Synthetic Demo Case Selector Bar */}
      <div className="rounded-2xl border border-clinical-200/60 bg-clinical-50/40 p-4 dark:border-clinical-900/50 dark:bg-clinical-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-clinical-500 dark:text-clinical-400" />
            <span className="text-xs font-semibold text-clinical-800 dark:text-clinical-200">
              Use Synthetic Demo Case:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {loadingCases ? (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading cases...</span>
            ) : (
              syntheticCases.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleSelectSynthetic(sc.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedSyntheticId === sc.id
                      ? 'bg-clinical-500 text-white shadow-sm'
                      : 'bg-white/80 hover:bg-clinical-50 dark:bg-clinical-950/40 dark:hover:bg-clinical-950/60'
                  }`}
                  style={selectedSyntheticId !== sc.id ? { border: '1px solid var(--border-soft)', color: 'var(--text-secondary)' } : undefined}
                >
                  <span>{sc.category}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mode Selection Tabs (Visually Distinct) */}
      <div className="grid grid-cols-3 gap-3">
        {/* Tab 1: Paste Text */}
        <button
          onClick={() => {
            setMode('text');
            setValidationError(null);
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all ${
            mode === 'text'
              ? 'border-clinical-400 bg-clinical-50/70 text-clinical-800 ring-2 ring-clinical-400/20 shadow-sm dark:border-clinical-400 dark:bg-clinical-950/60 dark:text-white'
              : 'hover:bg-clinical-50/30 dark:hover:bg-clinical-950/20'
          }`}
          style={mode !== 'text' ? { border: '1px solid var(--border-soft)', color: 'var(--text-secondary)' } : undefined}
        >
          <FileText className={`h-6 w-6 ${mode === 'text' ? 'text-clinical-500 dark:text-clinical-400' : ''}`} style={mode !== 'text' ? { color: 'var(--text-muted)' } : undefined} />
          <div className="text-center">
            <div className="font-semibold text-sm">Paste Clinical Text</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Progress notes, narrative records</div>
          </div>
        </button>

        {/* Tab 2: Upload PDF */}
        <button
          onClick={() => {
            setMode('pdf');
            setValidationError(null);
            handleClearFile();
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all ${
            mode === 'pdf'
              ? 'border-pastel-mint-400 bg-pastel-mint-50/70 text-pastel-mint-600 ring-2 ring-pastel-mint-400/20 shadow-sm dark:border-pastel-mint-400 dark:bg-pastel-mint-600/10 dark:text-white'
              : 'hover:bg-pastel-mint-50/30 dark:hover:bg-pastel-mint-600/5'
          }`}
          style={mode !== 'pdf' ? { border: '1px solid var(--border-soft)', color: 'var(--text-secondary)' } : undefined}
        >
          <Upload className={`h-6 w-6 ${mode === 'pdf' ? 'text-pastel-mint-500 dark:text-pastel-mint-400' : ''}`} style={mode !== 'pdf' ? { color: 'var(--text-muted)' } : undefined} />
          <div className="text-center">
            <div className="font-semibold text-sm">Upload PDF</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Digital or scanned multipage PDF</div>
          </div>
        </button>

        {/* Tab 3: Upload Image */}
        <button
          onClick={() => {
            setMode('image');
            setValidationError(null);
            handleClearFile();
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all ${
            mode === 'image'
              ? 'border-pastel-lavender-400 bg-pastel-lavender-50/70 text-pastel-lavender-500 ring-2 ring-pastel-lavender-400/20 shadow-sm dark:border-pastel-lavender-400 dark:bg-pastel-lavender-500/10 dark:text-white'
              : 'hover:bg-pastel-lavender-50/30 dark:hover:bg-pastel-lavender-500/5'
          }`}
          style={mode !== 'image' ? { border: '1px solid var(--border-soft)', color: 'var(--text-secondary)' } : undefined}
        >
          <ImageIcon className={`h-6 w-6 ${mode === 'image' ? 'text-pastel-lavender-500 dark:text-pastel-lavender-400' : ''}`} style={mode !== 'image' ? { color: 'var(--text-muted)' } : undefined} />
          <div className="text-center">
            <div className="font-semibold text-sm">Upload Medical Image</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Handwritten charts, lab slips, photo</div>
          </div>
        </button>
      </div>

      {/* Main Input Area */}
      <div className="rounded-2xl p-6 shadow-soft" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}>
        {mode === 'text' ? (
          /* Mode 1: Paste Text */
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="clinical-text" className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Clinical Note Content
              </label>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {textInput.length} characters (up to 50,000)
              </span>
            </div>
            <textarea
              id="clinical-text"
              rows={12}
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                setValidationError(null);
              }}
              placeholder="Paste clinical progress note, discharge summary, consultation record, or medication reconciliation sheet here..."
              className="w-full rounded-xl border p-4 font-mono text-xs leading-relaxed focus:border-clinical-400 focus:outline-none focus:ring-2 focus:ring-clinical-400/20"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-soft)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        ) : (
          /* Mode 2 & 3: File Upload (PDF / Image) */
          <div>
            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-clinical-400 bg-clinical-50/60 dark:bg-clinical-950/40'
                    : ''
                }`}
                style={!isDragOver ? { borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' } : undefined}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mode === 'pdf' ? '.pdf' : '.png,.jpg,.jpeg,.webp,.tiff,.bmp'}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-clinical-50 text-clinical-500 dark:bg-clinical-950/60 dark:text-clinical-400">
                  {mode === 'pdf' ? <Upload className="h-7 w-7" /> : <ImageIcon className="h-7 w-7" />}
                </div>

                <div className="mt-4 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Drag and drop your {mode.toUpperCase()} file here
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  or <span className="font-semibold text-clinical-600 hover:underline">browse files</span> on your computer
                </p>

                <div className="mt-4 flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  <span>Supported: {mode === 'pdf' ? 'PDF (digital & scanned)' : 'PNG, JPG, TIFF, BMP, WEBP'}</span>
                  <span>•</span>
                  <span>Max 20 MB</span>
                </div>
              </div>
            ) : (
              /* Selected File Preview Card */
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-soft)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="h-16 w-16 rounded-xl object-cover shadow-sm"
                        style={{ border: '1px solid var(--border-soft)' }}
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-pastel-mint-100 text-pastel-mint-600 dark:bg-pastel-mint-600/10 dark:text-pastel-mint-400">
                        <Upload className="h-8 w-8" />
                      </div>
                    )}

                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {selectedFile.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span className="uppercase">{selectedFile.type || mode}</span>
                        {pdfPageCount && (
                          <>
                            <span>•</span>
                            <span>Multi-page supported</span>
                          </>
                        )}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-pastel-mint-50 px-2 py-0.5 text-[10px] font-semibold text-pastel-mint-600 dark:bg-pastel-mint-600/10 dark:text-pastel-mint-400">
                        <FileCheck className="h-3 w-3" />
                        <span>Ready for Optical Character Recognition & Entity Extraction</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleClearFile}
                    className="rounded-lg p-1.5 hover:bg-pastel-rose-50 hover:text-pastel-rose-500 dark:hover:bg-pastel-rose-500/10"
                    style={{ color: 'var(--text-muted)' }}
                    title="Remove file"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-pastel-rose-200 bg-pastel-rose-50 p-3.5 text-xs text-pastel-rose-500 dark:border-pastel-rose-500/30 dark:bg-pastel-rose-500/10 dark:text-pastel-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 pt-5 sm:flex-row" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <ShieldAlert className="h-4 w-4 text-pastel-mint-500" />
            <span>Synthetic Demonstration Data Policy: All uploaded information processed securely in-memory.</span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-clinical-500 to-clinical-400 px-6 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:from-clinical-600 hover:to-clinical-500 hover:shadow-glow-lavender disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Initializing Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Analyze Document</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
