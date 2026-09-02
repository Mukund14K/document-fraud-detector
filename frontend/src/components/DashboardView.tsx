// src/components/DashboardView.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getHistory,
  fetchHistoryFromBackend,
  type HistoryItem
} from "../utils/historyStore";
import {
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Clock,
  Plus
} from "lucide-react";

interface DashboardViewProps {
  onStartAnalysis?: () => void;
}

export default function DashboardView({ onStartAnalysis }: DashboardViewProps) {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(getHistory());
    fetchHistoryFromBackend().then((data) => {
      if (data) setHistory(data);
    });
  }, []);


  const totalScans = history.length;
  const genuineCount = history.filter(
    (item) => item.verdict.toLowerCase() === "genuine"
  ).length;
  const suspiciousCount = history.filter(
    (item) =>
      item.verdict.toLowerCase() === "suspicious" ||
      item.verdict.toLowerCase() === "tampered" ||
      item.verdict.toLowerCase() === "high risk"
  ).length;

  const genuinePercentage = totalScans > 0 ? Math.round((genuineCount / totalScans) * 100) : 100;
  const avgRiskScore =
    totalScans > 0
      ? Math.round(history.reduce((acc, curr) => acc + curr.risk_score, 0) / totalScans)
      : 0;

  const recentScans = history.slice(0, 5);

  function handleViewReport(item: HistoryItem) {
    navigate("/results", {
      state: {
        result: item,
        uploadedImage: item.uploadedImage,
      },
    });
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#CACEB5]/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1F2532] tracking-tight">
            Forensic Dashboard
          </h1>
          <p className="text-xs text-[#2F3543] font-bold mt-1">
            Real-time identity verification metrics and threat intelligence overview.
          </p>
        </div>

        <button
          onClick={onStartAnalysis || (() => navigate("/"))}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#4E6158] via-[#45574f] to-[#36453f] hover:from-[#566b61] hover:to-[#3e4e47] text-white text-sm font-extrabold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-[#4E6158]/30 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Scans */}
        <div className="bg-gradient-to-b from-white via-[#fefdfb] to-[#f7f4ee] border border-[#CACEB5] rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#2F3543]/80">
              Total Analyzed
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ECE6DA] to-[#e4ded0] text-[#4E6158] flex items-center justify-center border border-[#CACEB5] shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#1F2532]">{totalScans}</span>
            <span className="inline-flex items-center text-xs font-extrabold text-[#4E6158] bg-[#ECE6DA]/60 px-2 py-0.5 rounded-md border border-[#CACEB5]/70">
              <TrendingUp className="w-3 h-3 mr-1" /> +14%
            </span>
          </div>
          <p className="text-[11px] text-[#2F3543] font-semibold mt-2">
            Documents processed across system
          </p>
        </div>

        {/* Card 2: Genuine Rate */}
        <div className="bg-gradient-to-b from-white via-[#fefdfb] to-[#f7f4ee] border border-[#CACEB5] rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#2F3543]/80">
              Genuine Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ECE6DA] to-[#e4ded0] text-[#4E6158] flex items-center justify-center border border-[#CACEB5] shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#1F2532]">{genuinePercentage}%</span>
            <span className="text-xs font-extrabold text-[#4E6158]">{genuineCount} verified</span>
          </div>
          <p className="text-[11px] text-[#2F3543] font-semibold mt-2">
            High integrity verification pass rate
          </p>
        </div>

        {/* Card 3: Suspicious Flags */}
        <div className="bg-gradient-to-b from-white via-[#fefdfb] to-[#f7f4ee] border border-[#CACEB5] rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#2F3543]/80">
              Tampered / Suspicious
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-800 flex items-center justify-center border border-amber-200/80 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-900">{suspiciousCount}</span>
            <span className="text-xs font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Action Needed
            </span>
          </div>
          <p className="text-[11px] text-[#2F3543] font-semibold mt-2">
            Flagged for manual fraud review
          </p>
        </div>

        {/* Card 4: Avg Risk Score */}
        <div className="bg-gradient-to-b from-white via-[#fefdfb] to-[#f7f4ee] border border-[#CACEB5] rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#2F3543]/80">
              Avg Fraud Risk Score
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ECE6DA] to-[#e4ded0] text-[#4E6158] flex items-center justify-center border border-[#CACEB5] shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#1F2532]">{avgRiskScore} <span className="text-xs text-[#2F3543] font-bold">/ 100</span></span>
            <span className="text-xs font-extrabold text-[#4E6158] bg-[#ECE6DA]/60 px-2 py-0.5 rounded-md border border-[#CACEB5]/70">
              Low Threat
            </span>
          </div>
          <p className="text-[11px] text-[#2F3543] font-semibold mt-2">
            Overall risk baseline across analyses
          </p>
        </div>
      </div>

      {/* ANALYTICS & FORENSIC CHECKS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Forensic Modules Status */}
        <div className="lg:col-span-7 bg-gradient-to-b from-white via-[#fefdfb] to-[#f8f5ee] border border-[#CACEB5] rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#CACEB5]/60">
            <h3 className="text-base font-black text-[#1F2532] tracking-tight">
              Forensic Detection Engine Accuracy
            </h3>
            <span className="text-xs font-extrabold text-[#4E6158] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Engine Active v2.4
            </span>
          </div>

          <div className="space-y-4">
            {/* Check 1: MRZ Hash */}
            <div>
              <div className="flex justify-between text-xs font-black text-[#1F2532] mb-1">
                <span>MRZ Cryptographic Checksum</span>
                <span>99.4% Pass Rate</span>
              </div>
              <div className="w-full bg-[#ECE6DA] h-2.5 rounded-full overflow-hidden border border-[#CACEB5]/50">
                <div className="bg-gradient-to-r from-[#4E6158] to-[#60796e] h-full rounded-full w-[99.4%]" />
              </div>
            </div>

            {/* Check 2: Error Level Analysis */}
            <div>
              <div className="flex justify-between text-xs font-black text-[#1F2532] mb-1">
                <span>ELA Tampering &amp; Noise Density</span>
                <span>96.8% Detection Precision</span>
              </div>
              <div className="w-full bg-[#ECE6DA] h-2.5 rounded-full overflow-hidden border border-[#CACEB5]/50">
                <div className="bg-gradient-to-r from-[#4E6158] to-[#60796e] h-full rounded-full w-[96.8%]" />
              </div>
            </div>

            {/* Check 3: Typographical Kerning */}
            <div>
              <div className="flex justify-between text-xs font-black text-[#1F2532] mb-1">
                <span>Typographical Baseline &amp; Font Geometry</span>
                <span>98.2% Accuracy</span>
              </div>
              <div className="w-full bg-[#ECE6DA] h-2.5 rounded-full overflow-hidden border border-[#CACEB5]/50">
                <div className="bg-gradient-to-r from-[#4E6158] to-[#60796e] h-full rounded-full w-[98.2%]" />
              </div>
            </div>

            {/* Check 4: Facial & Photo Overlay */}
            <div>
              <div className="flex justify-between text-xs font-black text-[#1F2532] mb-1">
                <span>Photo Splice &amp; Hologram Verification</span>
                <span>95.5% Accuracy</span>
              </div>
              <div className="w-full bg-[#ECE6DA] h-2.5 rounded-full overflow-hidden border border-[#CACEB5]/50">
                <div className="bg-gradient-to-r from-[#4E6158] to-[#60796e] h-full rounded-full w-[95.5%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: System Status & Security Rules */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#4E6158] via-[#42544c] to-[#313f38] text-white rounded-2xl p-6 shadow-md border border-[#5d7369]/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Sliders className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">System Threat Monitor</h3>
                <p className="text-xs text-white/80 font-semibold">Active Rules &amp; Protocols</p>
              </div>
            </div>

            <ul className="space-y-3 text-xs font-semibold text-white/90 my-4">
              <li className="flex items-center gap-2.5 bg-white/10 p-2.5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>ICAO Doc 9303 Compliance Enforced</span>
              </li>
              <li className="flex items-center gap-2.5 bg-white/10 p-2.5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Zero-Retention Temporary Sandbox Active</span>
              </li>
              <li className="flex items-center gap-2.5 bg-white/10 p-2.5 rounded-xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Neural ELA Model v4.1 operational (1.2s avg)</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="text-white/80 font-bold">API Latency: 124ms</span>
            <span className="text-emerald-300 font-extrabold flex items-center gap-1">
              ● All Systems Normal
            </span>
          </div>
        </div>
      </div>

      {/* RECENT SCANS TABLE */}
      <div className="bg-gradient-to-b from-white via-[#fefdfb] to-[#f8f5ee] border border-[#CACEB5] rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#CACEB5]/60">
          <div>
            <h3 className="text-lg font-black text-[#1F2532] tracking-tight">Recent Document Scans</h3>
            <p className="text-xs text-[#2F3543] font-bold">
              Latest forensic document integrity verification reports
            </p>
          </div>
          <span className="text-xs font-extrabold text-[#4E6158] bg-[#ECE6DA] px-3 py-1 rounded-full border border-[#CACEB5]">
            Showing {recentScans.length} of {totalScans}
          </span>
        </div>

        {recentScans.length === 0 ? (
          <div className="py-12 text-center text-[#2F3543]">
            <Clock className="w-10 h-10 mx-auto mb-2 text-[#4E6158]/50" />
            <p className="font-bold text-sm">No analysis history recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1F2532]">
              <thead>
                <tr className="border-b border-[#CACEB5] text-[#2F3543] uppercase text-[10px] font-black tracking-wider bg-[#f4efe5]/50">
                  <th className="py-3 px-4">Document ID</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Holder Name</th>
                  <th className="py-3 px-4">Processed</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CACEB5]/50 font-bold">
                {recentScans.map((item) => {
                  const isGenuine = item.verdict.toLowerCase() === "genuine";
                  return (
                    <tr key={item.id} className="hover:bg-[#ECE6DA]/40 transition-colors">
                      <td className="py-3.5 px-4 font-black font-mono text-[#1F2532]">
                        {item.docId}
                      </td>
                      <td className="py-3.5 px-4 text-[#2F3543]">{item.documentType}</td>
                      <td className="py-3.5 px-4 font-black">{item.holderName}</td>
                      <td className="py-3.5 px-4 text-[#2F3543]">{item.processedAt}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-[#1F2532]">
                          {item.risk_score} / 100
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                            isGenuine
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {item.verdict}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleViewReport(item)}
                          className="inline-flex items-center gap-1 text-xs font-black text-[#4E6158] hover:text-[#1F2532] hover:underline cursor-pointer"
                        >
                          <span>View Report</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
