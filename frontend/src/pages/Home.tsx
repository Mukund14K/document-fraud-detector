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
      // Person B's Results page reads result.verdict, result.risk_score, result.checks
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
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* HERO */}
      <section id="home" className="bg-navy-950 text-white">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <p className="text-cyan-400 text-sm font-medium tracking-wide mb-4">
            AI-BASED IDENTITY &amp; DOCUMENT SCREENING
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-6">
            Detect Document Tampering Before It Becomes a Security Threat
          </h1>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            An explainable multi-signal forensic engine that analyzes identity documents using
            MRZ checksum validation, image tamper detection, and field cross-verification.
          </p>
          <button
            onClick={scrollToUpload}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Analyze Document
          </button>
          <p className="text-slate-400 text-xs mt-6">
            Human-in-the-loop • Explainable Evidence • Designed for Rapid Screening
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-navy-900 text-center mb-2">How It Works</h2>
        <p className="text-slate-500 text-center mb-12">
          Three independent forensic checks, combined into one explainable verdict.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {SIGNALS.map((signal) => (
            <div key={signal.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-navy-900 mb-2">{signal.title}</h3>
              <p className="text-sm text-slate-500">{signal.description}</p>
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
          <p className="text-red-600 text-sm mt-4 text-center">{errorMessage}</p>
        )}

        {file && !isAnalyzing && (
          <button
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className="mt-6 w-full bg-navy-900 text-white font-medium py-3 rounded-xl hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Document
          </button>
        )}
      </section>

      <Footer />
    </div>
  );
}