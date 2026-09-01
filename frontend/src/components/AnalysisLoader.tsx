// src/components/AnalysisLoader.tsx
import { useEffect, useState } from "react";

const STAGES = [
  "Uploading document",
  "Extracting machine-readable zone",
  "Validating ICAO checksums",
  "Performing image tamper analysis",
  "Cross-verifying document fields",
];

export default function AnalysisLoader() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= STAGES.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <p className="text-sm font-medium text-navy-900 mb-4">Forensic Analysis in Progress</p>
      <ul className="space-y-3">
        {STAGES.map((stage, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={stage} className="flex items-center gap-3 text-sm">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs
                  ${done ? "bg-green-500 text-white" : active ? "bg-cyan-500 text-white animate-pulse" : "bg-slate-200 text-slate-400"}`}
              >
                {done ? "✓" : active ? "→" : "○"}
              </span>
              <span className={done || active ? "text-navy-900" : "text-slate-400"}>{stage}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}