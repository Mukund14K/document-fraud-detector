// src/components/HistoryView.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getHistory,
  fetchHistoryFromBackend,
  deleteHistoryItem,
  clearHistory,
  type HistoryItem
} from "../utils/historyStore";
import { useLanguage } from "../utils/useLanguage";
import {
  Search,
  History,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Filter,
  Plus
} from "lucide-react";

interface HistoryViewProps {
  initialSearchQuery?: string;
  onStartAnalysis?: () => void;
}

export default function HistoryView({ initialSearchQuery = "", onStartAnalysis }: HistoryViewProps) {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeTab, setActiveTab] = useState<"all" | "genuine" | "suspicious">("all");
  const [sortBy, setSortBy] = useState<"recent" | "risk_high" | "risk_low">("recent");

  useEffect(() => {
    setHistory(getHistory());
    fetchHistoryFromBackend().then((data) => {
      if (data) setHistory(data);
    });
  }, []);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  async function handleDelete(id: string) {
    const updated = await deleteHistoryItem(id);
    setHistory(updated);
  }

  async function handleClearAll() {
    const msg = lang === "hi"
      ? "क्या आप निश्चित रूप से सभी फोरेंसिक विश्लेषण इतिहास को साफ़ करना चाहते हैं?"
      : "Are you sure you want to clear all forensic analysis history?";
    if (window.confirm(msg)) {
      await clearHistory();
      setHistory([]);
    }
  }


  function handleViewReport(item: HistoryItem) {
    navigate("/results", {
      state: {
        result: item,
        uploadedImage: item.uploadedImage,
      },
    });
  }

  // Filter items
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.docId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.holderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.verdict.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "genuine") return item.verdict.toLowerCase() === "genuine";
    if (activeTab === "suspicious")
      return (
        item.verdict.toLowerCase() === "suspicious" ||
        item.verdict.toLowerCase() === "tampered" ||
        item.verdict.toLowerCase() === "high risk"
      );

    return true;
  });

  // Sort items
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortBy === "risk_high") return b.risk_score - a.risk_score;
    if (sortBy === "risk_low") return a.risk_score - b.risk_score;
    return b.timestamp - a.timestamp;
  });

  const genuineCount = history.filter((i) => i.verdict.toLowerCase() === "genuine").length;
  const suspiciousCount = history.filter(
    (i) =>
      i.verdict.toLowerCase() === "suspicious" ||
      i.verdict.toLowerCase() === "tampered" ||
      i.verdict.toLowerCase() === "high risk"
  ).length;

  function renderVerdict(verdict: string) {
    const lower = verdict.toLowerCase();
    if (lower === "genuine") return t("verdict_genuine");
    if (lower === "suspicious") return t("verdict_suspicious");
    if (lower === "tampered") return t("verdict_tampered");
    return verdict;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#CACEB5]/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1F2532] tracking-tight">
            {t("history_title")}
          </h1>
          <p className="text-xs text-[#2F3543] font-bold mt-1">
            {t("history_subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t("clear_history")}</span>
            </button>
          )}

          <button
            onClick={onStartAnalysis || (() => navigate("/"))}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#4E6158] via-[#45574f] to-[#36453f] hover:from-[#566b61] hover:to-[#3e4e47] text-white text-sm font-extrabold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-[#4E6158]/30"
          >
            <Plus className="w-4 h-4" />
            <span>{t("new_analysis_btn")}</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR & FILTERS */}
      <div className="bg-gradient-to-b from-white via-[#fefdfb] to-[#f8f5ee] border border-[#CACEB5] rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-[#2F3543] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search_placeholder")}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#CACEB5] rounded-xl focus:outline-none focus:border-[#4E6158] text-[#1F2532] placeholder-[#2F3543]/60 font-bold transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#2F3543] hover:text-[#1F2532]"
              >
                {t("clear_search")}
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs font-bold text-[#2F3543]">
            <Filter className="w-3.5 h-3.5 text-[#4E6158]" />
            <span>{t("sort_by")}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-[#CACEB5] rounded-xl px-3 py-1.5 text-xs font-extrabold text-[#1F2532] focus:outline-none focus:border-[#4E6158]"
            >
              <option value="recent">{t("sort_recent")}</option>
              <option value="risk_high">{t("sort_risk_high")}</option>
              <option value="risk_low">{t("sort_risk_low")}</option>
            </select>
          </div>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#CACEB5]/60 text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-gradient-to-r from-[#4E6158] to-[#36453f] text-white shadow-xs"
                : "bg-[#ECE6DA]/60 text-[#2F3543] hover:bg-[#ECE6DA]"
            }`}
          >
            {t("tab_all_scans")} ({history.length})
          </button>

          <button
            onClick={() => setActiveTab("genuine")}
            className={`px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              activeTab === "genuine"
                ? "bg-gradient-to-r from-[#4E6158] to-[#36453f] text-white shadow-xs"
                : "bg-[#ECE6DA]/60 text-[#2F3543] hover:bg-[#ECE6DA]"
            }`}
          >
            {t("tab_genuine")} ({genuineCount})
          </button>

          <button
            onClick={() => setActiveTab("suspicious")}
            className={`px-3.5 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
              activeTab === "suspicious"
                ? "bg-gradient-to-r from-amber-700 to-amber-900 text-white shadow-xs"
                : "bg-amber-50 text-amber-900 border border-amber-200/70 hover:bg-amber-100"
            }`}
          >
            {t("tab_suspicious")} ({suspiciousCount})
          </button>
        </div>
      </div>

      {/* HISTORY CARDS LIST */}
      {sortedHistory.length === 0 ? (
        <div className="bg-gradient-to-b from-white to-[#f7f4ee] border border-[#CACEB5] rounded-2xl p-12 text-center text-[#2F3543]">
          <History className="w-12 h-12 mx-auto mb-3 text-[#4E6158]/40" />
          <h3 className="text-base font-black text-[#1F2532] mb-1">{t("no_history_title")}</h3>
          <p className="text-xs font-bold max-w-sm mx-auto">
            {searchQuery ? t("no_history_search") : t("no_history_empty")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedHistory.map((item) => {
            const isGenuine = item.verdict.toLowerCase() === "genuine";
            return (
              <div
                key={item.id}
                className="bg-gradient-to-b from-white via-[#faf8f4] to-[#f4efe6]/60 border border-[#CACEB5] rounded-2xl p-5 shadow-2xs hover:border-[#4E6158] transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                {/* Left Section: Document ID & Metadata */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                      isGenuine
                        ? "bg-gradient-to-br from-[#ECE6DA] to-[#e4dccb] text-[#4E6158] border-[#CACEB5]"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {isGenuine ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-[#1F2532] font-mono">
                        {item.docId}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                          isGenuine
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {renderVerdict(item.verdict)}
                      </span>
                    </div>

                    <p className="text-xs font-extrabold text-[#2F3543] mt-1">
                      {t("holder_label")} <span className="text-[#1F2532] font-black">{item.holderName}</span> •{" "}
                      {t("type_label")} <span className="text-[#1F2532]">{item.documentType}</span>
                    </p>

                    <p className="text-[11px] text-[#2F3543]/80 font-bold mt-1">
                      {t("processed_label")} {item.processedAt} • {t("checks_label")} {item.checksPassed}
                    </p>
                  </div>
                </div>

                {/* Middle/Right Section: Risk Score & Action Buttons */}
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#CACEB5]/60">
                  {/* Risk Score Pill */}
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#2F3543]">
                      {t("fraud_risk")}
                    </span>
                    <p className="text-lg font-black text-[#1F2532]">
                      {item.risk_score} <span className="text-xs text-[#2F3543] font-bold">/ 100</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewReport(item)}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#4E6158] via-[#45574f] to-[#36453f] hover:from-[#566b61] hover:to-[#3e4e47] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <span>{t("view_report")}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      title={t("delete_record")}
                      className="p-2 rounded-xl text-rose-700 hover:bg-rose-50 hover:text-rose-900 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
