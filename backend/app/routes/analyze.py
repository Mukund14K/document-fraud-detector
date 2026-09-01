"""
The /analyze endpoint. MRZ checksum is REAL (role 4's module).
Risk scoring now uses the real, tested risk_aggregator.
ELA and field cross-verification are still DUMMY -- swap them in
the same way once roles 5 and 6 hand off their functions.
"""

from fastapi import APIRouter, UploadFile, File
import shutil
import os
import uuid

from app.models.schemas import AnalyzeResponse
from app.modules.mrz_checksum import run_mrz_check
from app.modules.risk_aggregator import aggregate

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_document(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    saved_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ---- REAL: MRZ checksum validation ----
    mrz_result = run_mrz_check(saved_path)
    mrz_passed = mrz_result.get("mrz_checksum_passed", False)

    mrz_check_entry = {
        "name": "MRZ Checksum Validation",
        "passed": mrz_passed,
        "detail": mrz_result.get("checks", mrz_result.get("message", "No MRZ detected")),
    }

    # ---- DUMMY: still waiting on roles 5 and 6 ----
    ela_passed = True  # placeholder -- role 5 will return a real bool
    ela_check_entry = {
        "name": "Error Level Analysis (Tamper Detection)",
        "passed": ela_passed,
        "detail": "Dummy data — waiting on Role 5's module",
    }

    crossverify_passed = True  # placeholder -- role 6 will return real bool or None
    crossverify_check_entry = {
        "name": "Field Cross-Verification",
        "passed": crossverify_passed,
        "detail": "Dummy data — waiting on Role 6's module",
    }

    # ---- REAL: risk aggregation ----
    risk_result = aggregate(
        mrz_passed=mrz_passed,
        ela_passed=ela_passed,
        crossverify_passed=crossverify_passed,
    )

    all_checks = [mrz_check_entry, ela_check_entry, crossverify_check_entry]

    return {
        "verdict": risk_result["verdict"],
        "risk_score": risk_result["risk_score"],
        "checks": all_checks,
    }