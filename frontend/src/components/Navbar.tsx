// src/components/Navbar.tsx
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-navy-950/90 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-white">
            D
          </div>
          <div>
            <p className="text-white font-semibold leading-tight">DocuShield AI</p>
            <p className="text-xs text-slate-400 leading-tight">
              AI-Based Identity &amp; Document Screening
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <a href="#home" className="hover:text-white transition-colors">Home</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </div>
      </div>
    </nav>
  );
}