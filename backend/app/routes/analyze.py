"""
The /analyze endpoint.
Executes MRZ Checksum Validation, Error Level Analysis (Tamper Detection),
Field Cross-Verification, Risk Aggregation, and generates an official
forensic PDF report while storing the uploaded document for officer review.
"""

from fastapi import APIRouter, UploadFile, File
import shutil
import os
import uuid

from app.models.schemas import AnalyzeResponse
from app.modules.mrz_checksum import run_mrz_check
from app.modules.ela_tamper import analyze as run_ela_tamper
from app.modules.field_crossverify import run_check as run_crossverify
from app.modules.risk_aggregator import aggregate
from app.modules.pdf_generator import generate_forensic_report
from app.utils.history_manager import add_history_entry


router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_document(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    original_filename = file.filename or "document.jpg"
    safe_stored_name = f"{file_id}_{original_filename}"
    saved_path = os.path.join(UPLOAD_DIR, safe_stored_name)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    document_web_path = f"/static/uploads/{safe_stored_name}"

    # ---- 1. MRZ checksum validation ----
    mrz_result = run_mrz_check(saved_path)
    mrz_passed = mrz_result.get("mrz_checksum_passed", False)

    mrz_check_entry = {
        "name": "MRZ Checksum Validation",
        "passed": mrz_passed,
        "detail": mrz_result.get("checks", mrz_result.get("message", "No MRZ detected")),
    }

    # ---- 2. ELA tamper detection ----
    ela_result = run_ela_tamper(saved_path)
    ela_passed = ela_result.get("passed", True)
    ela_check_entry = {
        "name": "Error Level Analysis (Tamper Detection)",
        "passed": ela_passed,
        "detail": ela_result.get("detail", ""),
        "heatmap_path": ela_result.get("heatmap_path"),
    }

    # ---- 3. Field cross-verification ----
    crossverify_result = run_crossverify(saved_path)
    crossverify_passed = crossverify_result.passed  # True, False, or None (skipped)
    crossverify_check_entry = {
        "name": crossverify_result.name,
        "passed": crossverify_passed,
        "detail": crossverify_result.detail,
    }

    # ---- 4. Risk aggregation ----
    risk_result = aggregate(
        mrz_passed=mrz_passed,
        ela_passed=ela_passed,
        crossverify_passed=crossverify_passed,
    )

    all_checks = [mrz_check_entry, ela_check_entry, crossverify_check_entry]

    # ---- 5. Generate Forensic PDF Report ----
    try:
        pdf_report_path = generate_forensic_report(
            document_filename=original_filename,
            document_image_path=saved_path,
            verdict=risk_result["verdict"],
            risk_score=risk_result["risk_score"],
            checks=all_checks,
            case_id=file_id,
        )
    except Exception as e:
        pdf_report_path = None

    # ---- 6. Save to History Store ----
    try:
        add_history_entry(
            doc_id=file_id[:8],
            document_filename=original_filename,
            verdict=risk_result["verdict"],
            risk_score=risk_result["risk_score"],
            checks=all_checks,
            document_path=document_web_path,
            pdf_report_path=pdf_report_path,
        )
    except Exception as e:
        print(f"[AnalyzeRoute] Error logging to history: {e}")

    return {
        "verdict": risk_result["verdict"],
        "risk_score": risk_result["risk_score"],
        "document_filename": original_filename,
        "document_path": document_web_path,
        "pdf_report_path": pdf_report_path,
        "checks": all_checks,
    }