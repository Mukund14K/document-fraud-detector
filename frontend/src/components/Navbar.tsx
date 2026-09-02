// src/components/Navbar.tsx
import { FileText } from "lucide-react";

export default function Navbar() {
  return (
    <header className="w-full bg-white/80 backdrop-blur-md border-b border-[#CACEB5]/50 sticky top-0 z-50 shadow-xs">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4E6158] via-[#45574f] to-[#36453f] flex items-center justify-center text-white shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black text-[#1F2532] tracking-tight">
            DocVerify
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#ECE6DA] via-[#f2ece0] to-[#e4ded0] text-[#4E6158] border border-[#CACEB5] tracking-wide shadow-2xs">
            FORENSIC AI
          </span>
        </div>

        {/* Secure System Badge */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#2F3543]">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#4E6158] to-[#60796e] animate-pulse shadow-xs" />
          <span>Secure Government System</span>
        </div>
      </div>
    </header>
  );
}