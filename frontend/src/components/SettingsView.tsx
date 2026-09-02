// src/components/SettingsView.tsx
import { useState } from "react";
import { Sliders, Shield, Save, Database, Check } from "lucide-react";

export default function SettingsView() {
  const [sensitivity, setSensitivity] = useState("standard");
  const [autoDelete, setAutoDelete] = useState("30");
  const [mrzStrict, setMrzStrict] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleSave() {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="pb-2 border-b border-[#CACEB5]/80">
        <h1 className="text-2xl sm:text-3xl font-black text-[#1F2532] tracking-tight">
          Forensic Settings
        </h1>
        <p className="text-xs text-[#2F3543] font-bold mt-1">
          Configure AI inspection sensitivity, tamper threshold sensitivity, and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Settings Controls */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: AI Forensic Sensitivity */}
          <div className="bg-gradient-to-b from-white via-[#fefdfb] to-[#f8f5ee] border border-[#CACEB5] rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#CACEB5]/60">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ECE6DA] to-[#e4ded0] text-[#4E6158] flex items-center justify-center border border-[#CACEB5] shadow-xs">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1F2532]">Inspection Sensitivity</h3>
                <p className="text-xs text-[#2F3543] font-bold">
                  Set how strictly anomalous artifacts and kerning discrepancies are flagged.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <label
                onClick={() => setSensitivity("permissive")}
                className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  sensitivity === "permissive"
                    ? "bg-white border-[#4E6158] shadow-xs ring-1 ring-[#4E6158]"
                    : "bg-[#ECE6DA]/30 border-[#CACEB5] hover:bg-[#ECE6DA]/60"
                }`}
              >
                <span className="text-xs font-black text-[#1F2532]">Permissive</span>
                <span className="text-[11px] text-[#2F3543] font-semibold mt-1">
                  Flag major tampering only
                </span>
              </label>

              <label
                onClick={() => setSensitivity("standard")}
                className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  sensitivity === "standard"
                    ? "bg-white border-[#4E6158] shadow-xs ring-1 ring-[#4E6158]"
                    : "bg-[#ECE6DA]/30 border-[#CACEB5] hover:bg-[#ECE6DA]/60"
                }`}
              >
                <span className="text-xs font-black text-[#1F2532]">Standard (Recommended)</span>
                <span className="text-[11px] text-[#2F3543] font-semibold mt-1">
                  Balanced forensic baseline
                </span>
              </label>

              <label
                onClick={() => setSensitivity("strict")}
                className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                  sensitivity === "strict"
                    ? "bg-white border-[#4E6158] shadow-xs ring-1 ring-[#4E6158]"
                    : "bg-[#ECE6DA]/30 border-[#CACEB5] hover:bg-[#ECE6DA]/60"
                }`}
              >
                <span className="text-xs font-black text-[#1F2532]">Strict Government</span>
                <span className="text-[11px] text-[#2F3543] font-semibold mt-1">
                  Flag micro-pixel irregularities
                </span>
              </label>
            </div>
          </div>

          {/* Card 2: Security & Retention */}
          <div className="bg-gradient-to-b from-white via-[#fefdfb] to-[#f8f5ee] border border-[#CACEB5] rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#CACEB5]/60">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ECE6DA] to-[#e4ded0] text-[#4E6158] flex items-center justify-center border border-[#CACEB5] shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1F2532]">Data Retention & Privacy</h3>
                <p className="text-xs text-[#2F3543] font-bold">
                  Manage local browser storage retention for scanned reports.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold text-[#1F2532]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-sm">Automatic History Purge</p>
                  <p className="text-[#2F3543] text-xs font-semibold">
                    Automatically clear verification logs older than specified threshold.
                  </p>
                </div>
                <select
                  value={autoDelete}
                  onChange={(e) => setAutoDelete(e.target.value)}
                  className="bg-white border border-[#CACEB5] rounded-xl px-3 py-2 text-xs font-black text-[#1F2532] focus:outline-none focus:border-[#4E6158]"
                >
                  <option value="never">Keep Indefinitely</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#CACEB5]/50">
                <div>
                  <p className="font-black text-sm">Enforce Cryptographic MRZ Checksum Strictness</p>
                  <p className="text-[#2F3543] text-xs font-semibold">
                    Reject document analysis if MRZ fail condition is triggered.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={mrzStrict}
                  onChange={(e) => setMrzStrict(e.target.checked)}
                  className="w-4 h-4 accent-[#4E6158] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Engine Info & Save */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-[#4E6158] via-[#42544c] to-[#313f38] text-white rounded-2xl p-6 shadow-md border border-[#5d7369]/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-black text-white">System Environment</h3>
            </div>

            <div className="space-y-2 text-xs font-semibold text-white/90">
              <p>
                <strong className="text-white">Engine Version:</strong> v2.4.0-Forensic
              </p>
              <p>
                <strong className="text-white">Ruleset:</strong> ICAO Doc 9303 / ELA v4
              </p>
              <p>
                <strong className="text-white">API Mode:</strong> Client-Side Local Execution
              </p>
            </div>

            <div className="pt-4 border-t border-white/20">
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 bg-white text-[#4E6158] hover:bg-[#ECE6DA] font-black text-xs py-3 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span className="text-emerald-800">Preferences Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#4E6158]" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
