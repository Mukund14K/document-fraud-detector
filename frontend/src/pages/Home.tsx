// src/pages/Home.tsx
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import UploadZone from "../components/UploadZone";
import ImagePreview from "../components/ImagePreview";
import AnalysisLoader from "../components/AnalysisLoader";
import { analyzeDocument } from "../api/analyze";

const SIGNALS = [
  {
    title: "MRZ Checksum Validation",
    description:
      "Validates ICAO 9303 check digits embedded in passport and visa machine-readable zones.",
  },
  {
    title: "Tamper Detection",
    description:
      "Uses Error Level Analysis to identify unusual compression patterns that may indicate edited regions.",
  },
  {
    title: "Field Cross-Verification",
    description:
      "Compares visible document fields against MRZ-decoded data to identify inconsistencies.",
  },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  function scrollToUpload() {
    uploadSectionRef.current?.scrollIntoView({ behavior: "smooth" });
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
      const result = await analyzeDocument(file);
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
    <div className="min-h-screen flex flex-col bg-cream-canvas">
      <Navbar />

      {/* HERO */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-b from-[#6c5a46] via-[#5b4b39] to-[#4c3d2e] text-white py-24 shadow-md">
        {/* Soft background ambient glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#c5b293]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#e0d4bf]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#e0d4bf] text-sm font-semibold tracking-wider uppercase mb-4">
            AI-BASED IDENTITY &amp; DOCUMENT SCREENING
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-6 tracking-tight text-[#f6f1e6]">
            Detect Document Tampering Before It Becomes a Security Threat
          </h1>
          <p className="text-[#e0d4bf]/90 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            An explainable multi-signal forensic engine that analyzes identity documents using
            MRZ checksum validation, image tamper detection, and field cross-verification.
          </p>
          <button
            onClick={scrollToUpload}
            className="bg-gradient-to-r from-[#9a8265] to-[#6c5a46] hover:from-[#a78e70] hover:to-[#78644e] text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 border border-[#e0d4bf]/20"
          >
            Analyze Document
          </button>
          <p className="text-[#e0d4bf]/70 text-xs mt-6 font-medium">
            Human-in-the-loop • Explainable Evidence • Designed for Rapid Screening
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-[#6c5a46] text-center mb-2">How It Works</h2>
        <p className="text-[#9a8265] text-center mb-12">
          Three independent forensic checks, combined into one explainable verdict.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {SIGNALS.map((signal) => (
            <div key={signal.title} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#c5b293]/40 p-6 shadow-[0_8px_30px_rgba(108,90,70,0.06)] hover:border-[#9a8265]/60 hover:shadow-[0_12px_35px_rgba(108,90,70,0.12)] hover:-translate-y-1 transition-all duration-250">
              <h3 className="font-semibold text-[#6c5a46] mb-2">{signal.title}</h3>
              <p className="text-sm text-[#9a8265] leading-relaxed">{signal.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* UPLOAD SECTION */}
      <section
        id="security"
        ref={uploadSectionRef}
        className="max-w-2xl mx-auto px-6 py-20 w-full"
      >
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
          <p className="text-[#8c4a40] font-medium text-sm mt-4 text-center">{errorMessage}</p>
        )}

        {file && !isAnalyzing && (
          <button
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className="mt-6 w-full bg-gradient-to-r from-[#9a8265] to-[#6c5a46] hover:from-[#a78e70] hover:to-[#78644e] text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border border-[#e0d4bf]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Analyze Document
          </button>
        )}
      </section>

      <Footer />
    </div>
  );
}