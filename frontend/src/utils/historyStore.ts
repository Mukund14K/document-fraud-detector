// src/utils/historyStore.ts
import type { AnalysisResult } from "../api/analyze";

export interface HistoryItem extends AnalysisResult {
  id: string;
  documentType: string;
  holderName: string;
  timestamp: number;
  uploadedImage?: string;
}

const STORAGE_KEY = "verifai_forensic_history_v2";

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load history from localStorage:", err);
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save history to localStorage:", err);
  }
}

export async function fetchHistoryFromBackend(): Promise<HistoryItem[]> {
  try {
    const res = await fetch("/history");
    if (res.ok) {
      const data: HistoryItem[] = await res.json();
      saveHistory(data);
      return data;
    }
  } catch (err) {
    console.warn("Could not fetch history from backend, falling back to cache:", err);
  }
  return getHistory();
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
    : fileName?.toLowerCase().includes("passport")
    ? "Passport"
    : "Identity Document";

  const holderName =
    result.checks.find((c) => c.fieldsData)?.fieldsData?.find((f) => f.label.toLowerCase().includes("holder"))
      ?.value || fileName || "DOCUMENT HOLDER";

  const newItem: HistoryItem = {
    ...result,
    id: `doc-${Date.now().toString().slice(-6)}`,
    documentType,
    holderName,
    timestamp: Date.now(),
    processedAt: "Just now",
    uploadedImage: uploadedImage || result.document_path || undefined,
  };

  const updated = [newItem, ...current.filter((i) => i.docId !== result.docId)];
  saveHistory(updated);
  return newItem;
}

export async function deleteHistoryItem(id: string): Promise<HistoryItem[]> {
  try {
    const res = await fetch(`/history/${id}`, { method: "DELETE" });
    if (res.ok) {
      const data: HistoryItem[] = await res.json();
      saveHistory(data);
      return data;
    }
  } catch (err) {
    console.warn("Backend delete failed, removing locally:", err);
  }

  const current = getHistory();
  const updated = current.filter((item) => item.id !== id && item.docId !== id);
  saveHistory(updated);
  return updated;
}

export async function clearHistory(): Promise<void> {
  try {
    await fetch("/history", { method: "DELETE" });
  } catch (err) {
    console.warn("Backend clear failed:", err);
  }
  saveHistory([]);
}
