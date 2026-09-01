// src/components/Navbar.tsx
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-[#6c5a46]/95 backdrop-blur-md border-b border-[#c5b293]/30 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#c5b293] to-[#9a8265] flex items-center justify-center font-bold text-white shadow-sm border border-[#e0d4bf]/40">
            D
          </div>
          <div>
            <p className="text-white font-semibold leading-tight">DocuShield AI</p>
            <p className="text-xs text-[#e0d4bf]/85 leading-tight font-medium">
              AI-Based Identity &amp; Document Screening
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-[#f6f1e6]/90">
          <a href="#home" className="hover:text-white transition-colors">Home</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </div>
      </div>
    </nav>
  );
}