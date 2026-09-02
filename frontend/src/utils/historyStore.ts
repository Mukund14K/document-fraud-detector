// src/utils/historyStore.ts
import type { AnalysisResult } from "../api/analyze";

export interface HistoryItem extends AnalysisResult {
  id: string;
  documentType: string;
  holderName: string;
  timestamp: number;
  uploadedImage?: string;
}

const STORAGE_KEY = "verifai_forensic_history_v1";

const DEFAULT_INITIAL_HISTORY: HistoryItem[] = [
  {
    id: "doc-8824",
    docId: "#FR-2023-8824",
    documentType: "EU Passport",
    holderName: "ANNA MARIA ERIKSSON",
    processedAt: "Today, 08:30 AM",
    timestamp: Date.now() - 3600000 * 2,
    verdict: "Genuine",
    risk_score: 8,
    checksPassed: "12/12 Passed",
    checks: [
      {
        id: "mrz",
        name: "MRZ Checksum",
        passed: true,
        badgeText: "Passed",
        detail:
          "Machine Readable Zone cryptographic hash verified against standard algorithmic patterns.",
        mrzData: [
          "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<",
          "L898902C36UT07408122F1204159ZE184226B<<<<10",
        ],
      },
      {
        id: "field_verification",
        name: "Field Verification",
        passed: true,
        badgeText: "Passed",
        detail:
          "Typographical baseline analysis confirms consistent kerning and cross-field cryptographic matching.",
        fieldsData: [
          { label: "Document Holder", value: "ANNA MARIA ERIKSSON", status: "Verified ✓" },
          { label: "Document Number", value: "L898902C36", status: "Matched ✓" },
          { label: "Date of Birth", value: "12 AUG 1984", status: "Valid ✓" },
          { label: "Expiry Date", value: "31 DEC 2028", status: "Active ✓" },
        ],
      },
      {
        id: "tampering",
        name: "Check if Tampered",
        passed: true,
        badgeText: "Passed",
        detail:
          "Error Level Analysis (ELA) and surface pixel noise density inspection confirm uniform compression layers.",
        tamperData: {
          elaScore: "0.02 (Low)",
          compressionUniformity: "99.8%",
          photoIntegrity: "No photo overlay detected",
        },
      },
    ],
  },
  {
    id: "doc-9481",
    docId: "#DL-2024-9481",
    documentType: "Driver's License",
    holderName: "ROBERT CHEN",
    processedAt: "Yesterday, 14:15",
    timestamp: Date.now() - 3600000 * 24,
    verdict: "Suspicious",
    risk_score: 64,
    checksPassed: "8/12 Passed",
    checks: [
      {
        id: "mrz",
        name: "MRZ Checksum",
        passed: false,
        badgeText: "Mismatch",
        detail:
          "Checksum digit mismatch detected in document ID field sequence.",
        mrzData: [
          "D1USA9481028347<<<<<<<<<<<<<<<",
          "7401124M2809121USA<9481CHEN<<2",
        ],
      },
      {
        id: "field_verification",
        name: "Field Verification",
        passed: true,
        badgeText: "Passed",
        detail: "Name and date formats match state issuing authority templates.",
        fieldsData: [
          { label: "Document Holder", value: "ROBERT CHEN", status: "Verified ✓" },
          { label: "Document Number", value: "D94810283", status: "Warning ⚠️" },
          { label: "Issue Date", value: "14 JAN 2020", status: "Valid ✓" },
          { label: "Class", value: "Class C Standard", status: "Active ✓" },
        ],
      },
      {
        id: "tampering",
        name: "Check if Tampered",
        passed: false,
        badgeText: "Inconsistency",
        detail:
          "Pixel grid alignment anomaly detected around expiry date block. Potential font manipulation.",
        tamperData: {
          elaScore: "0.48 (Elevated)",
          compressionUniformity: "84.2%",
          photoIntegrity: "Minor edge blur detected",
        },
      },
    ],
  },
  {
    id: "doc-3310",
    docId: "#ID-2024-3310",
    documentType: "National ID Card",
    holderName: "ELENA ROSTOVA",
    processedAt: "2 days ago",
    timestamp: Date.now() - 3600000 * 48,
    verdict: "Genuine",
    risk_score: 5,
    checksPassed: "12/12 Passed",
    checks: [
      {
        id: "mrz",
        name: "MRZ Checksum",
        passed: true,
        badgeText: "Passed",
        detail: "Cryptographic hash verified.",
      },
      {
        id: "field_verification",
        name: "Field Verification",
        passed: true,
        badgeText: "Passed",
        detail: "All fields authentic.",
        fieldsData: [
          { label: "Document Holder", value: "ELENA ROSTOVA", status: "Verified ✓" },
          { label: "ID Number", value: "ID-3310-904", status: "Matched ✓" },
        ],
      },
      {
        id: "tampering",
        name: "Check if Tampered",
        passed: true,
        badgeText: "Passed",
        detail: "Zero tampering anomalies found.",
      },
    ],
  },
  {
    id: "doc-7721",
    docId: "#FR-2024-7721",
    documentType: "International Passport",
    holderName: "MARCUS VANCE",
    processedAt: "3 days ago",
    timestamp: Date.now() - 3600000 * 72,
    verdict: "Tampered",
    risk_score: 89,
    checksPassed: "4/12 Passed",
    checks: [
      {
        id: "mrz",
        name: "MRZ Checksum",
        passed: false,
        badgeText: "Failed",
        detail: "Synthetic MRZ line sequence detected.",
      },
      {
        id: "field_verification",
        name: "Field Verification",
        passed: false,
        badgeText: "Mismatch",
        detail: "Font typeface does not match issuing government standard.",
      },
      {
        id: "tampering",
        name: "Check if Tampered",
        passed: false,
        badgeText: "Tampering Detected",
        detail: "Digital photo overlay detected with high confidence (ELA 0.82).",
        tamperData: {
          elaScore: "0.82 (High Risk)",
          compressionUniformity: "61.3%",
          photoIntegrity: "Photo splice boundary detected",
        },
      },
    ],
  },
  {
    id: "doc-5102",
    docId: "#DL-2024-5102",
    documentType: "Driver's License",
    holderName: "SOPHIA MARTINEZ",
    processedAt: "4 days ago",
    timestamp: Date.now() - 3600000 * 96,
    verdict: "Genuine",
    risk_score: 11,
    checksPassed: "12/12 Passed",
    checks: [
      {
        id: "mrz",
        name: "MRZ Checksum",
        passed: true,
        badgeText: "Passed",
        detail: "Valid checksums.",
      },
      {
        id: "field_verification",
        name: "Field Verification",
        passed: true,
        badgeText: "Passed",
        detail: "All details verified.",
      },
      {
        id: "tampering",
        name: "Check if Tampered",
        passed: true,
        badgeText: "Passed",
        detail: "No tampering detected.",
      },
    ],
  },
];

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_HISTORY));
      return DEFAULT_INITIAL_HISTORY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_INITIAL_HISTORY;
  } catch (err) {
    console.error("Failed to load history from localStorage:", err);
    return DEFAULT_INITIAL_HISTORY;
  }
}

export function saveHistory(items: HistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save history to localStorage:", err);
  }
}

export function addHistoryItem(
  result: AnalysisResult,
  fileName?: string,
  uploadedImage?: string
): HistoryItem {
  const current = getHistory();
  const documentType = fileName?.toLowerCase().includes("dl")
    ? "Driver's License"
    : fileName?.toLowerCase().includes("id")
    ? "National ID Card"
    : "Identity Document";

  const holderName =
    result.checks.find((c) => c.fieldsData)?.fieldsData?.find((f) => f.label.includes("Holder"))
      ?.value || "DOCUMENT HOLDER";

  const newItem: HistoryItem = {
    ...result,
    id: `doc-${Date.now().toString().slice(-6)}`,
    documentType,
    holderName,
    timestamp: Date.now(),
    processedAt: "Just now",
    uploadedImage,
  };

  const updated = [newItem, ...current];
  saveHistory(updated);
  return newItem;
}

export function deleteHistoryItem(id: string): HistoryItem[] {
  const current = getHistory();
  const updated = current.filter((item) => item.id !== id && item.docId !== id);
  saveHistory(updated);
  return updated;
}

export function clearHistory(): void {
  saveHistory([]);
}
