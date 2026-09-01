// src/api/analyze.ts
//
// This is the single place that talks to the backend.
// Toggle USE_MOCK_API to switch between fake data (for building the UI now)
// and the real FastAPI backend (once it's ready).

const USE_MOCK_API = true;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ForensicCheck {
  name: string;
  passed: boolean;
  detail: string;
  heatmap_path: string | null;
}

export interface AnalysisResult {
  verdict: string;
  risk_score: number;
  checks: ForensicCheck[];
}

// Fake response so we can build/demo the UI before the backend exists.
const MOCK_RESPONSE: AnalysisResult = {
  verdict: "Suspicious",
  risk_score: 0.42,
  checks: [
    {
      name: "MRZ Checksum Validation",
      passed: true,
      detail: "ICAO checksum validation passed.",
      heatmap_path: null,
    },
    {
      name: "Error Level Analysis",
      passed: false,
      detail: "Compression anomalies detected near the portrait region.",
      heatmap_path: null,
    },
    {
      name: "Field Cross-Verification",
      passed: true,
      detail: "Visible document fields match MRZ data.",
      heatmap_path: null,
    },
  ],
};

/**
 * Sends the uploaded document image to the backend for forensic analysis.
 */
export async function analyzeDocument(file: File): Promise<AnalysisResult> {
  if (USE_MOCK_API) {
    // Simulate network + processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return MOCK_RESPONSE;
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Analysis failed with status ${response.status}`);
  }

  return response.json();
}