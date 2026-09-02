"""
Persistent JSON History Manager for analyzed documents.
Saves records to backend/app/data/history.json.
"""

import os
import json
import time
from typing import List, Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")

os.makedirs(DATA_DIR, exist_ok=True)


def _load_history_file() -> List[Dict[str, Any]]:
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_history_file(items: List[Dict[str, Any]]) -> None:
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(items, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[HistoryManager] Error saving history: {e}")


def get_all_history() -> List[Dict[str, Any]]:
    """Returns all history items, sorted newest first."""
    items = _load_history_file()
    return sorted(items, key=lambda x: x.get("timestamp", 0), reverse=True)


def add_history_entry(
    doc_id: str,
    document_filename: str,
    verdict: str,
    risk_score: float,
    checks: List[Dict[str, Any]],
    document_path: Optional[str] = None,
    pdf_report_path: Optional[str] = None,
    holder_name: Optional[str] = None,
    document_type: Optional[str] = None,
) -> Dict[str, Any]:
    """Appends a new analyzed document record to the history file."""
    items = _load_history_file()
    now_ts = int(time.time() * 1000)

    # Inferred document type
    if not document_type:
        fn = document_filename.lower()
        if "passport" in fn:
            document_type = "Passport"
        elif "license" in fn or "dl" in fn:
            document_type = "Driver's License"
        elif "id" in fn or "card" in fn:
            document_type = "National ID"
        else:
            document_type = "Identity Document"

    # Count passed checks
    passed_count = sum(1 for c in checks if c.get("passed") is True)
    total_count = len(checks)

    entry = {
        "id": f"doc-{doc_id}",
        "docId": document_filename,
        "document_filename": document_filename,
        "documentType": document_type,
        "holderName": holder_name or "DOCUMENT HOLDER",
        "timestamp": now_ts,
        "processedAt": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        "verdict": verdict,
        "risk_score": round(risk_score * 100) if risk_score <= 1.0 else round(risk_score),
        "checksPassed": f"{passed_count}/{total_count} Passed",
        "document_path": document_path,
        "pdf_report_path": pdf_report_path,
        "checks": checks,
    }

    # Prepend and save
    items.insert(0, entry)
    _save_history_file(items)
    return entry


def delete_history_entry(item_id: str) -> List[Dict[str, Any]]:
    """Deletes an entry by ID or docId."""
    items = _load_history_file()
    filtered = [i for i in items if i.get("id") != item_id and i.get("docId") != item_id]
    _save_history_file(filtered)
    return filtered


def clear_all_history() -> None:
    """Clears all history records."""
    _save_history_file([])
