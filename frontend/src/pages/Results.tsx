// src/pages/Results.tsx
import { useLocation, useNavigate } from "react-router-dom";
import type { AnalysisResult } from "../api/analyze";
import SettingsDropdown from "../components/SettingsDropdown";
import Footer from "../components/Footer";
import { useLanguage } from "../utils/useLanguage";
import {
  ShieldCheck,
  FileText,
  History,
  Plus,
  QrCode,
  Sliders,
  Shield,
  CheckCircle2,
  Check,
  Image as ImageIcon
} from "lucide-react";

interface ResultsLocationState {
  result?: AnalysisResult;
  uploadedImage?: string;
}

export default function Results() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsLocationState | null;

  // Fallback mock data if accessed directly
  const result: AnalysisResult = state?.result || {
    docId: "#FR-2023-8824",
    processedAt: "Just now",
    verdict: "Genuine",
    risk_score: 8,
    checksPassed: "12/12 Passed",
    checks: [
      {
        id: "mrz",
        name: "MRZ Checksum",
        passed: true,
        badgeText: "Passed",
        detail:
          "Machine Readable Zone cryptographic hash verified against standard algorithmic patterns.",
        mrzData: [
          "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<",
          "L898902C36UT07408122F1204159ZE184226B<<<<10",
        ],
      },
      {
        id: "field_verification",
        name: "Field Verification",
        passed: true,
        badgeText: "Passed",
        detail:
          "Typographical baseline analysis confirms consistent kerning and cross-field cryptographic matching. No evidence of discrepancy.",
        fieldsData: [
          { label: "Document Holder", value: "ANNA MARIA ERIKSSON", status: "Verified ✓" },
          { label: "Document Number", value: "L898902C36", status: "Matched ✓" },
          { label: "Date of Birth", value: "12 AUG 1984", status: "Valid ✓" },
          { label: "Expiry Date", value: "31 DEC 2028", status: "Active ✓" },
        ],
      },
      {
        id: "tampering",
        name: "Check if Tampered",
        passed: true,
        badgeText: "Passed",
        detail:
          "Error Level Analysis (ELA) and surface pixel noise density inspection confirm uniform compression layers. No evidence of physical or digital tampering.",
        tamperData: {
          elaScore: "0.02 (Low)",
          compressionUniformity: "99.8%",
          photoIntegrity: "No photo overlay detected",
        },
      },
    ],
  };

  const uploadedImage = state?.uploadedImage;

  function renderVerdict(verdict: string) {
    const lower = verdict.toLowerCase();
    if (lower === "genuine") return t("verdict_genuine");
    if (lower === "suspicious") return t("verdict_suspicious");
    if (lower === "tampered") return t("verdict_tampered");
    return verdict;
  }

  return (
    <div className="min-h-screen flex bg-canvas text-[#1F2532] font-sans">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-[#f9f6f0] via-[#f4efe5] to-[#eae4d5]/40 border-r border-[#CACEB5]/70 flex flex-col shrink-0">
        {/* Brand Logo Header */}
        <div className="p-6 border-b border-[#CACEB5]/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4E6158] via-[#45574f] to-[#36453f] flex items-center justify-center text-white shadow-sm shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-[#1F2532] leading-tight text-base">
                {t("brand_title")}
              </h2>
              <p className="text-xs text-[#2F3543] font-bold">{t("brand_subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          {/* Active Navigation item: Analysis */}
          <div className="relative">
            <button
              onClick={() => navigate("/analysis")}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-extrabold text-[#4E6158] bg-gradient-to-r from-[#ECE6DA] via-[#f2ece0] to-[#e4ded0] border border-[#CACEB5]/80 shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#4E6158]" />
              <span>{t("nav_analysis")}</span>
            </button>
            <div className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-[#4E6158] rounded-l-full" />
          </div>

          <button
            onClick={() => navigate("/history")}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-[#2F3543] hover:bg-[#ECE6DA]/70 transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-[#2F3543]" />
            <span>{t("nav_history")}</span>
          </button>
        </nav>
      </aside>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="h-16 bg-white/85 backdrop-blur-md border-b border-[#CACEB5]/60 px-8 flex items-center justify-end gap-4 sticky top-0 z-30 shadow-2xs">
          {/* Right Controls: Settings Dropdown */}
          <div className="flex items-center gap-4 text-sm">
            <SettingsDropdown />
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Header Row: Title & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#CACEB5]/80">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1F2532] tracking-tight">
                {t("results_title")}
              </h1>
              <p className="text-xs text-[#2F3543] font-bold mt-1">
                {t("doc_id_label")} <span className="font-extrabold text-[#1F2532]">{result.docId}</span> • {t("processed_at_label")} {result.processedAt}
              </p>
            </div>

            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#4E6158] via-[#45574f] to-[#36453f] hover:from-[#566b61] hover:to-[#3e4e47] text-white text-sm font-extrabold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-[#4E6158]/30 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              {t("analyze_another")}
            </button>
          </div>

          {/* GRID LAYOUT: Left Column (Verdict & Risk) + Right Column (Forensic Checks) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-4 space-y-6">
              {/* FINAL VERDICT CARD */}
              <div className="bg-gradient-to-br from-[#4E6158] via-[#42544c] to-[#313f38] text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col items-center text-center border border-[#5d7369]/30">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-white text-[#4E6158] flex items-center justify-center shadow-xs">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                </div>

                <p className="text-[11px] font-black tracking-widest uppercase text-white/90 mb-1">
                  {t("final_verdict")}
                </p>
                <h3 className="text-3xl font-black tracking-tight text-white mb-2">
                  {renderVerdict(result.verdict)}
                </h3>
              </div>

              {/* FRAUD RISK SCORE CARD */}
              <div className="bg-gradient-to-b from-white via-[#fefdfb] to-[#f7f4ee] border border-[#CACEB5] rounded-2xl p-6 shadow-xs">
                <h3 className="text-base font-black text-[#1F2532] mb-4 pb-3 border-b border-[#CACEB5]/60">
                  {t("fraud_risk_score")}
                </h3>

                {/* Donut Chart Display */}
                <div className="flex flex-col items-center justify-center my-4">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#ECE6DA]"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#4E6158]"
                        strokeDasharray={`${result.risk_score}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-black text-[#1F2532] tracking-tight">
                        {result.risk_score < 10 ? `0${result.risk_score}` : result.risk_score}
                      </span>
                      <span className="text-xs text-[#2F3543] font-black">/ 100</span>
                    </div>
                  </div>

                  <span className="mt-4 px-3.5 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#ECE6DA] via-[#f2ece0] to-[#e4ded0] text-[#4E6158] border border-[#CACEB5] shadow-2xs">
                    {result.risk_score < 30 ? t("low_risk_badge") : result.risk_score < 70 ? t("moderate_risk_badge") : t("high_risk_badge")}
                  </span>
                  <p className="text-xs text-[#2F3543] text-center mt-4 leading-relaxed font-bold">
                    {result.risk_score < 30 ? t("no_anomalies_desc") : t("anomalies_detected_desc")}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: FORENSIC CHECKS COMPARTMENT */}
            <div className="lg:col-span-8 bg-gradient-to-b from-white via-[#fefdfb] to-[#f8f5ee] border border-[#CACEB5] rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#CACEB5]/60">
                <h3 className="text-lg font-black text-[#1F2532] tracking-tight">
                  {t("forensic_checks_title")}
                </h3>
                <span className="text-xs font-extrabold text-[#2F3543] tracking-wide">
                  {result.checksPassed}
                </span>
              </div>

              <div className="space-y-6">
                {/* ROW 1: MRZ Checksum */}
                <div className="border border-[#CACEB5] rounded-2xl p-5 bg-gradient-to-b from-white via-[#faf8f4] to-[#f4efe6]/50 space-y-4 hover:border-[#4E6158] shadow-2xs transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ECE6DA] via-[#f0eae0] to-[#e4dccb] text-[#4E6158] flex items-center justify-center shrink-0 border border-[#CACEB5] shadow-xs">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#1F2532]">{t("mrz_title")}</h4>
                        <p className="text-xs text-[#2F3543] mt-0.5 leading-relaxed font-semibold">
                          {t("mrz_desc")}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-md text-xs font-extrabold bg-gradient-to-r from-[#ECE6DA] via-[#f2ece0] to-[#e4ded0] text-[#4E6158] border border-[#CACEB5] shrink-0 shadow-2xs">
                      {t("passed_badge")}
                    </span>
                  </div>

                  {/* Inner Box Code snippet */}
                  <div className="bg-gradient-to-br from-[#f7f4ee] to-[#f0ebdf] border border-[#CACEB5]/80 rounded-xl p-3.5 font-mono text-[11px] sm:text-xs text-[#1F2532] font-black leading-relaxed overflow-x-auto shadow-inner">
                    <div>P&lt;UTOERIKSSON&lt;&lt;ANNA&lt;MARIA&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                    <div>L898902C36UT07408122F1204159ZE184226B&lt;&lt;&lt;&lt;10</div>
                  </div>
                </div>

                {/* ROW 2: Field Verification */}
                <div className="border border-[#CACEB5] rounded-2xl p-5 bg-gradient-to-b from-white via-[#faf8f4] to-[#f4efe6]/50 space-y-4 hover:border-[#4E6158] shadow-2xs transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ECE6DA] via-[#f0eae0] to-[#e4dccb] text-[#4E6158] flex items-center justify-center shrink-0 border border-[#CACEB5] shadow-xs">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#1F2532]">{t("field_verif_title")}</h4>
                        <p className="text-xs text-[#2F3543] mt-0.5 leading-relaxed font-semibold">
                          {t("field_verif_desc")}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-md text-xs font-extrabold bg-gradient-to-r from-[#ECE6DA] via-[#f2ece0] to-[#e4ded0] text-[#4E6158] border border-[#CACEB5] shrink-0 shadow-2xs">
                      {t("passed_badge")}
                    </span>
                  </div>

                  {/* Field Verification Box */}
                  <div className="bg-gradient-to-br from-[#f7f4ee] to-[#f0ebdf] border border-[#CACEB5]/80 rounded-xl p-4 flex flex-col justify-center items-center text-center shadow-inner">
                    {uploadedImage ? (
                      <img
                        src={uploadedImage}
                        alt="Document field preview"
                        className="max-h-36 object-contain rounded-lg shadow-xs border border-[#CACEB5] mb-2"
                      />
                    ) : (
                      <div className="py-6 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ECE6DA] to-[#e4ded0] text-[#4E6158] border border-[#CACEB5] flex items-center justify-center mb-2 shadow-xs">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-black text-[#4E6158]">
                          {t("extracted_matched_text")}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-2 pt-3 border-t border-[#CACEB5] text-left">
                      <div>
                        <p className="text-[10px] uppercase font-black text-[#2F3543]">{t("holder_field")}</p>
                        <p className="text-xs font-black text-[#1F2532] truncate">ANNA MARIA</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-[#2F3543]">{t("doc_no_field")}</p>
                        <p className="text-xs font-black text-[#1F2532]">L898902C36</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-[#2F3543]">{t("dob_field")}</p>
                        <p className="text-xs font-black text-[#1F2532]">12 AUG 1984</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-[#2F3543]">{t("status_field")}</p>
                        <p className="text-xs font-black text-[#4E6158]">{t("verified_status")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROW 3: Check if Tampered */}
                <div className="border border-[#CACEB5] rounded-2xl p-5 bg-gradient-to-b from-white via-[#faf8f4] to-[#f4efe6]/50 space-y-4 hover:border-[#4E6158] shadow-2xs transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ECE6DA] via-[#f0eae0] to-[#e4dccb] text-[#4E6158] flex items-center justify-center shrink-0 border border-[#CACEB5] shadow-xs">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#1F2532]">{t("tampering_check_title")}</h4>
                        <p className="text-xs text-[#2F3543] mt-0.5 leading-relaxed font-semibold">
                          {t("tampering_check_desc")}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-md text-xs font-extrabold bg-gradient-to-r from-[#ECE6DA] via-[#f2ece0] to-[#e4ded0] text-[#4E6158] border border-[#CACEB5] shrink-0 shadow-2xs">
                      {t("passed_badge")}
                    </span>
                  </div>

                  {/* Tampering Check summary box */}
                  <div className="bg-gradient-to-br from-[#f7f4ee] to-[#f0ebdf] border border-[#CACEB5]/80 rounded-xl p-3.5 text-xs text-[#1F2532] flex items-center justify-between gap-3 font-bold shadow-inner">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#4E6158] shrink-0" />
                      <span>
                        {t("ela_score_label")} <strong className="text-[#1F2532] font-black">0.02 (Normal)</strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-[#4E6158] bg-white px-2.5 py-1 rounded-md border border-[#CACEB5] shadow-2xs">
                      {t("no_tampering_badge")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* PROFESSIONAL FOOTER */}
        <Footer />
      </div>
    </div>
  );
}