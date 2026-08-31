from fastapi import APIRouter, UploadFile, File
import shutil
import os
import uuid

from app.models.schemas import AnalyzeResponse

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

    return {
        "verdict": "Suspicious",
        "risk_score": 0.45,
        "checks": [
            {"name": "MRZ Checksum Validation", "passed": False, "detail": "Dummy data — waiting on Role 4's module"},
            {"name": "Error Level Analysis (Tamper Detection)", "passed": True, "detail": "Dummy data — waiting on Role 5's module"},
            {"name": "Field Cross-Verification", "passed": True, "detail": "Dummy data — waiting on Role 6's module"},
        ],
    }
