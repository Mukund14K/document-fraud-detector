// src/pages/Results.tsx
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-cream-canvas text-[#6c5a46]">
        <p className="text-[#9a8265]">No analysis result found.</p>
        <Link to="/" className="text-[#9a8265] hover:text-[#6c5a46] underline font-medium">Go back home</Link>
      </div>
    );
  }

  const { result, uploadedImage } = state;

  return (
    <div className="min-h-screen p-10 max-w-2xl mx-auto bg-cream-canvas text-[#6c5a46]">
      <h1 className="text-2xl font-bold mb-4 text-[#6c5a46]">Results</h1>
      <p className="mb-2"><strong>Verdict:</strong> <span className="text-[#6c5a46] font-bold">{result.verdict}</span></p>
      <p className="mb-4"><strong>Risk score:</strong> <span className="text-[#9a8265] font-semibold">{result.risk_score}</span></p>
      {uploadedImage && <img src={uploadedImage} alt="Analyzed document" className="w-40 mb-4 rounded-lg border border-[#c5b293]/40 shadow-sm" />}
      <ul className="space-y-2.5">
        {result.checks.map((check) => (
          <li key={check.name} className="border border-[#c5b293]/40 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-[0_4px_20px_rgba(108,90,70,0.05)]">
            <strong className="text-[#6c5a46]">{check.name}</strong>:{" "}
            <span className={check.passed ? "text-[#5b6c46] font-semibold" : "text-[#8c4a40] font-semibold"}>
              {check.passed ? "Passed" : "Failed"}
            </span>{" "}
            — <span className="text-[#9a8265]">{check.detail}</span>
          </li>
        ))}
      </ul>
      <Link to="/" className="text-[#9a8265] hover:text-[#6c5a46] underline mt-6 inline-block font-semibold">← Back to Home</Link>
    </div>
  );
}