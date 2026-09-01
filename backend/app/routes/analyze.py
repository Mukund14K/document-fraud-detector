"""
The /analyze endpoint. MRZ checksum is now REAL (role 4's module).
ELA and field cross-verification are still DUMMY -- swap them in
the same way once roles 5 and 6 hand off their functions.
"""

from fastapi import APIRouter, UploadFile, File
import shutil
import os
import uuid

from app.models.schemas import AnalyzeResponse
from app.modules.mrz_checksum import run_mrz_check

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

    mrz_check_entry = {
        "name": "MRZ Checksum Validation",
        "passed": mrz_result.get("mrz_checksum_passed", False),
        "detail": mrz_result.get("checks", mrz_result.get("message", "No MRZ detected")),
    }

    # ---- DUMMY: still waiting on roles 5 and 6 ----
    ela_check_entry = {
        "name": "Error Level Analysis (Tamper Detection)",
        "passed": True,
        "detail": "Dummy data — waiting on Role 5's module",
    }

    crossverify_check_entry = {
        "name": "Field Cross-Verification",
        "passed": True,
        "detail": "Dummy data — waiting on Role 6's module",
    }

    all_checks = [mrz_check_entry, ela_check_entry, crossverify_check_entry]

    # simple scoring for now: MRZ failing alone pushes to Suspicious
    # (final weighted logic comes from the risk_aggregator once all 3 are real)
    if not mrz_check_entry["passed"]:
        verdict = "Suspicious"
        risk_score = 0.5
    else:
        verdict = "Genuine"
        risk_score = 0.1

    return {
        "verdict": verdict,
        "risk_score": risk_score,
        "checks": all_checks,
    }
