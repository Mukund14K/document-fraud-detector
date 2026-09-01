// src/pages/Results.tsx
// TEMPORARY placeholder — Person B will replace this with the full Results/Evidence UI.
import { useLocation, Link } from "react-router-dom";
import type { AnalysisResult } from "../api/analyze";

interface ResultsLocationState {
  result: AnalysisResult;
  uploadedImage: string;
}

export default function Results() {
  const location = useLocation();
  const state = location.state as ResultsLocationState | null;

  if (!state?.result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">No analysis result found.</p>
        <Link to="/" className="text-blue-600 underline">Go back home</Link>
      </div>
    );
  }

  const { result, uploadedImage } = state;

  return (
    <div className="min-h-screen p-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Results (placeholder)</h1>
      <p className="mb-2"><strong>Verdict:</strong> {result.verdict}</p>
      <p className="mb-4"><strong>Risk score:</strong> {result.risk_score}</p>
      {uploadedImage && <img src={uploadedImage} alt="Analyzed document" className="w-40 mb-4" />}
      <ul className="space-y-2">
        {result.checks.map((check) => (
          <li key={check.name} className="border p-3 rounded">
            <strong>{check.name}</strong>: {check.passed ? "Passed" : "Failed"} — {check.detail}
          </li>
        ))}
      </ul>
      <Link to="/" className="text-blue-600 underline mt-6 inline-block">← Back to Home</Link>
    </div>
  );
}