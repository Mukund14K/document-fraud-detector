// src/components/AnalysisLoader.tsx
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { useLanguage } from "../utils/useLanguage";

const STAGES_EN = [
  "Uploading document securely",
  "Extracting machine-readable zone (MRZ)",
  "Verifying field cryptographic checksums",
  "Executing Error Level Analysis (ELA) tampering check",
  "Generating multi-signal forensic score",
];

const STAGES_HI = [
  "दस्तावेज़ को सुरक्षित रूप से अपलोड किया जा रहा है",
  "मशीन पठनीय क्षेत्र (MRZ) निकाला जा रहा है",
  "क्षेत्र क्रिप्टोग्राफिक चेकसम का सत्यापन किया जा रहा है",
  "एरर लेवल एनालिसिस (ELA) छेड़छाड़ जांच निष्पादित की जा रही है",
  "मल्टी-सिग्नल फोरेंसिक स्कोर उत्पन्न किया जा रहा है",
];

export default function AnalysisLoader() {
  const { lang, t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  const stages = lang === "hi" ? STAGES_HI : STAGES_EN;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= stages.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [stages.length]);

  return (
    <div className="w-full max-w-xl mx-auto bg-gradient-to-b from-white to-[#fbf9f4] rounded-2xl border border-[#CACEB5] p-6 shadow-xs">
      <div className="flex items-center gap-2.5 mb-4">
        <Loader2 className="w-5 h-5 text-[#4E6158] animate-spin" />
        <p className="text-sm font-black text-[#1F2532] tracking-tight">
          {t("analyzing_btn")}
        </p>
      </div>

      <ul className="space-y-3">
        {stages.map((stage, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={stage} className="flex items-center gap-3 text-sm">
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-[#4E6158] shrink-0" />
              ) : active ? (
                <Loader2 className="w-5 h-5 text-[#4E6158] animate-spin shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-[#CACEB5]/80 shrink-0" />
              )}
              <span
                className={`text-xs sm:text-sm font-extrabold ${
                  done || active ? "text-[#1F2532]" : "text-[#2F3543]/50"
                }`}
              >
                {stage}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}