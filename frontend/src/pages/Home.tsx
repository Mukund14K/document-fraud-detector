// src/pages/Home.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UploadZone from "../components/UploadZone";
import ImagePreview from "../components/ImagePreview";
import AnalysisLoader from "../components/AnalysisLoader";
import HistoryView from "../components/HistoryView";
import SettingsDropdown from "../components/SettingsDropdown";
import Footer from "../components/Footer";
import { analyzeDocument } from "../api/analyze";
import { useLanguage } from "../utils/useLanguage";
import {
  ShieldCheck,
  FileText,
  History
} from "lucide-react";

export default function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Active tab state: "analysis" or "history"
  const [activeTab, setActiveTab] = useState<"analysis" | "history">(() => {
    if (location.pathname === "/history") return "history";
    return "analysis";
  });

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync route changes
  useEffect(() => {
    if (location.pathname === "/history") setActiveTab("history");
    else if (location.pathname === "/" || location.pathname === "/analysis") setActiveTab("analysis");
  }, [location.pathname]);

  function handleTabChange(tab: "analysis" | "history") {
    setActiveTab(tab);
    if (tab === "analysis") navigate("/analysis");
    else if (tab === "history") navigate("/history");
  }

  function handleFileSelected(selectedFile: File) {
    setErrorMessage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  function handleRemove() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  }

  async function handleAnalyze() {
    if (!file || isAnalyzing) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const result = await analyzeDocument(file, previewUrl!);
      navigate("/results", {
        state: {
          result,
          uploadedImage: previewUrl,
        },
      });
    } catch (err) {
      setErrorMessage("Something went wrong during analysis. Please try again.");
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-canvas text-[#1F2532] font-sans">
      {/* LEFT SIDEBAR navigation */}
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

        {/* Navigation Items: Analysis & History */}
        <nav className="p-4 space-y-1.5 flex-1">
          {/* Analysis Tab */}
          <div className="relative">
            <button
              onClick={() => handleTabChange("analysis")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                activeTab === "analysis"
                  ? "font-extrabold text-[#4E6158] bg-gradient-to-r from-[#ECE6DA] via-[#f2ece0] to-[#e4ded0] border border-[#CACEB5]/80 shadow-2xs"
                  : "font-bold text-[#2F3543] hover:bg-[#ECE6DA]/70"
              }`}
            >
              <FileText className={`w-4 h-4 ${activeTab === "analysis" ? "text-[#4E6158]" : "text-[#2F3543]"}`} />
              <span>{t("nav_analysis")}</span>
            </button>
            {activeTab === "analysis" && (
              <div className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-[#4E6158] rounded-l-full" />
            )}
          </div>

          {/* History Tab */}
          <div className="relative">
            <button
              onClick={() => handleTabChange("history")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                activeTab === "history"
                  ? "font-extrabold text-[#4E6158] bg-gradient-to-r from-[#ECE6DA] via-[#f2ece0] to-[#e4ded0] border border-[#CACEB5]/80 shadow-2xs"
                  : "font-bold text-[#2F3543] hover:bg-[#ECE6DA]/70"
              }`}
            >
              <History className={`w-4 h-4 ${activeTab === "history" ? "text-[#4E6158]" : "text-[#2F3543]"}`} />
              <span>{t("nav_history")}</span>
            </button>
            {activeTab === "history" && (
              <div className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-[#4E6158] rounded-l-full" />
            )}
          </div>
        </nav>
      </aside>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR */}
        <header className="h-16 bg-white/85 backdrop-blur-md border-b border-[#CACEB5]/60 px-8 flex items-center justify-end gap-4 sticky top-0 z-30 shadow-2xs">
          {/* Right Controls: Settings Dropdown */}
          <div className="flex items-center gap-4 text-sm">
            <SettingsDropdown />
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 p-8 max-w-6xl w-full mx-auto flex flex-col">
          {activeTab === "history" && (
            <HistoryView
              onStartAnalysis={() => handleTabChange("analysis")}
            />
          )}

          {activeTab === "analysis" && (
            <div className="flex flex-col items-center justify-center text-center py-4 space-y-8 animate-fadeIn flex-1">
              {/* Header Title */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-[#1F2532] tracking-tight mb-2">
                  {t("hero_title")}
                </h1>
                <p className="text-[#2F3543] text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-bold">
                  {t("hero_subtitle")}
                </p>
              </div>

              {/* Upload Zone / Preview / Loader */}
              <div className="w-full max-w-xl mx-auto">
                {!file && (
                  <UploadZone onFileSelected={handleFileSelected} onError={setErrorMessage} />
                )}

                {file && !isAnalyzing && (
                  <ImagePreview
                    file={file}
                    previewUrl={previewUrl!}
                    onRemove={handleRemove}
                    onChange={handleRemove}
                  />
                )}

                {isAnalyzing && <AnalysisLoader />}

                {errorMessage && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                    {errorMessage}
                  </div>
                )}

                {/* Analyze Document Button */}
                <div className="mt-6 w-full">
                  <button
                    onClick={handleAnalyze}
                    disabled={!file || isAnalyzing}
                    className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm transition-all duration-200 ${
                      file && !isAnalyzing
                        ? "bg-gradient-to-r from-[#4E6158] via-[#45574f] to-[#36453f] hover:from-[#566b61] hover:to-[#3e4e47] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer border border-[#4E6158]/30"
                        : "bg-gradient-to-r from-[#ECE6DA]/80 to-[#e4ded0]/80 text-[#2F3543]/50 cursor-not-allowed border border-[#CACEB5]"
                    }`}
                  >
                    {isAnalyzing ? t("analyzing_btn") : t("analyze_btn")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* PROFESSIONAL FOOTER */}
        <Footer />
      </div>
    </div>
  );
}