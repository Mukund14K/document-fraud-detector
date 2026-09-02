// src/api/analyze.ts
import { addHistoryItem } from "../utils/historyStore";

const USE_MOCK_API = true;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ForensicCheck {
  id: "mrz" | "field_verification" | "tampering";
  name: string;
  passed: boolean;
  badgeText: string;
  detail: string;
  mrzData?: string[];
  fieldsData?: { label: string; value: string; status: string }[];
  tamperData?: {
    elaScore: string;
    compressionUniformity: string;
    photoIntegrity: string;
  };
}

export interface AnalysisResult {
  docId: string;
  processedAt: string;
  verdict: string;
  risk_score: number;
  checksPassed: string;
  checks: ForensicCheck[];
}

const MOCK_RESPONSE: AnalysisResult = {
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
      detail: "Machine Readable Zone cryptographic hash verified against standard algorithmic patterns.",
      mrzData: [
        "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<",
        "L898902C36UT07408122F1204159ZE184226B<<<<10"
      ]
    },
    {
      id: "field_verification",
      name: "Field Verification",
      passed: true,
      badgeText: "Passed",
      detail: "Typographical baseline analysis confirms consistent kerning and cross-field cryptographic matching. No evidence of discrepancy.",
      fieldsData: [
        { label: "Document Holder", value: "ANNA MARIA ERIKSSON", status: "Verified ✓" },
        { label: "Document Number", value: "L898902C36", status: "Matched ✓" },
        { label: "Date of Birth", value: "12 AUG 1984", status: "Valid ✓" },
        { label: "Expiry Date", value: "31 DEC 2028", status: "Active ✓" }
      ]
    },
    {
      id: "tampering",
      name: "Check if Tampered (Tampering Detection)",
      passed: true,
      badgeText: "Passed",
      detail: "Error Level Analysis (ELA) and surface pixel noise density inspection confirm uniform compression layers. No physical or digital tampering detected.",
      tamperData: {
        elaScore: "0.02 (Low)",
        compressionUniformity: "99.8%",
        photoIntegrity: "No photo overlay detected"
      }
    }
  ],
};

export async function analyzeDocument(file: File, previewUrl?: string): Promise<AnalysisResult> {
  let result: AnalysisResult;

  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // Generate dynamic ID for new uploads so history gets distinct records
    const randomId = Math.floor(1000 + Math.random() * 9000);
    result = {
      ...MOCK_RESPONSE,
      docId: `#FR-2026-${randomId}`,
      processedAt: "Just now",
    };
  } else {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Analysis failed with status ${response.status}`);
    }

    result = await response.json();
  }

  // Automatically save to history store
  addHistoryItem(result, file.name, previewUrl);

  return result;
}
