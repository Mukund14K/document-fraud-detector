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
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#c5b293]/40 p-6 shadow-[0_8px_30px_rgba(108,90,70,0.07)]">
      <p className="text-sm font-semibold text-[#6c5a46] mb-4">Forensic Analysis in Progress</p>
      <ul className="space-y-3">
        {STAGES.map((stage, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={stage} className="flex items-center gap-3 text-sm">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold shadow-sm transition-all
                  ${done ? "bg-[#6c5a46] text-[#f6f1e6]" : active ? "bg-gradient-to-r from-[#9a8265] to-[#6c5a46] text-white animate-pulse" : "bg-[#e0d4bf]/40 text-[#9a8265]"}`}
              >
                {done ? "✓" : active ? "→" : "○"}
              </span>
              <span className={done || active ? "text-[#6c5a46] font-medium" : "text-[#9a8265]"}>{stage}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}