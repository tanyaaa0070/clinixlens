import {
  AnalysisDetail,
  AnalysisListItem,
  HealthData,
  StatsData,
  SyntheticCase,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMessage = `HTTP error ${res.status}`;
    try {
      const errJson = await res.json();
      errMessage = errJson.detail || errJson.message || errJson.error || errMessage;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Health
  async getHealth(): Promise<HealthData> {
    const res = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<HealthData>(res);
  },

  // Stats
  async getStats(): Promise<StatsData> {
    const res = await fetch(`${API_BASE_URL}/api/v1/analyses/stats`);
    return handleResponse<StatsData>(res);
  },

  // Analyses list
  async getAnalyses(status?: string, search?: string): Promise<AnalysisListItem[]> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/api/v1/analyses${qs}`);
    return handleResponse<AnalysisListItem[]>(res);
  },

  // Analysis detail
  async getAnalysisDetail(id: string): Promise<AnalysisDetail> {
    const res = await fetch(`${API_BASE_URL}/api/v1/analyses/${id}`);
    return handleResponse<AnalysisDetail>(res);
  },

  // Status check for polling
  async getAnalysisStatus(id: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/v1/analyses/${id}/status`);
    return handleResponse<any>(res);
  },

  // Submit Text
  async submitTextAnalysis(text: string, caseLabel?: string): Promise<{ analysis_id: string; case_id: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/analyses/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, case_label: caseLabel }),
    });
    return handleResponse<{ analysis_id: string; case_id: string }>(res);
  },

  // Upload File (PDF or Image)
  async uploadDocument(file: File): Promise<{ analysis_id: string; case_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/v1/analyses/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<{ analysis_id: string; case_id: string }>(res);
  },

  // Trigger Synthetic Case
  async analyzeSyntheticCase(caseId: string): Promise<{ analysis_id: string; case_id: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/analyses/synthetic/${caseId}`, {
      method: 'POST',
    });
    return handleResponse<{ analysis_id: string; case_id: string }>(res);
  },

  // Synthetic cases list
  async getSyntheticCases(): Promise<SyntheticCase[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/synthetic/cases`);
    return handleResponse<SyntheticCase[]>(res);
  },

  // Update Finding Verification Status
  async updateFindingVerification(
    analysisId: string,
    findingId: string,
    status: 'unreviewed' | 'verified' | 'needs_review' | 'dismissed',
    verifiedBy: string = 'Clinician Reviewer'
  ): Promise<{ finding_id: string; verification_status: string; review_progress: number }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/analyses/${analysisId}/findings/${findingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification_status: status, verified_by: verifiedBy }),
    });
    return handleResponse<{ finding_id: string; verification_status: string; review_progress: number }>(res);
  },

  // Delete Analysis
  async deleteAnalysis(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/v1/analyses/${id}`, {
      method: 'DELETE',
    });
    await handleResponse<any>(res);
    return true;
  },

  // Get EventSource instance for SSE streaming
  getEventsStream(analysisId: string): EventSource {
    return new EventSource(`${API_BASE_URL}/api/v1/analyses/${analysisId}/events`);
  }
};
