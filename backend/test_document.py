"""
Interactive / CLI test script to run every single fraud detection function on a document:
1. MRZ Checksum Validation (mrz_checksum.py)
2. Error Level Analysis / Tamper Heatmap (ela_tamper.py)
3. Field Cross-Verification (field_crossverify.py)
4. Risk Aggregation (risk_aggregator.py)
5. Full End-to-End API /analyze Endpoint (FastAPI TestClient)
"""

import sys
import os
import json
from PIL import Image

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ==============================================================================
# SET YOUR IMAGE PATH HERE (or pass as a command-line argument)
# ==============================================================================
IMAGE_TO_TEST = r"E:\document-fraud-detector\sample-documents\genuine"
# ==============================================================================

from app.modules.mrz_checksum import run_mrz_check
from app.modules.ela_tamper import analyze as run_ela_tamper
from app.modules.field_crossverify import run_check as run_crossverify
from app.modules.risk_aggregator import aggregate
from fastapi.testclient import TestClient
from app.main import app



def test_single_document(image_path: str):
    if not os.path.exists(image_path):
        print(f"Error: File not found: {image_path}")
        return

    print("=" * 80)
    print(f"  TESTING DOCUMENT: {os.path.basename(image_path)}")
    print(f"  Path: {os.path.abspath(image_path)}")
    print("=" * 80)

    # -------------------------------------------------------------
    # 1. ELA TAMPER DETECTION
    # -------------------------------------------------------------
    print("\n" + "-" * 40)
    print(" [1/4] Error Level Analysis (ELA)")
    print("-" * 40)
    ela_res = run_ela_tamper(image_path)
    print(f"  Passed       : {ela_res['passed']} (True = Clean, False = Tampered)")
    print(f"  Score        : {ela_res.get('score', 0.0):.3f}")
    print(f"  Detail       : {ela_res['detail']}")
    print(f"  Heatmap Path : {ela_res.get('heatmap_path')}")

    # -------------------------------------------------------------
    # 2. MRZ CHECKSUM VALIDATION
    # -------------------------------------------------------------
    print("\n" + "-" * 40)
    print(" [2/4] MRZ Checksum Validation (ICAO 9303)")
    print("-" * 40)
    mrz_res = run_mrz_check(image_path)
    mrz_passed = mrz_res.get("mrz_checksum_passed", False)
    print(f"  Status       : {mrz_res.get('status')}")
    print(f"  Passed       : {mrz_passed}")
    if mrz_res.get("checks"):
        print("  Check Digits :")
        for k, v in mrz_res["checks"].items():
            match_str = "MATCH (OK)" if v.get("match") else "MISMATCH (FAIL)"
            print(f"    - {k:15}: Value={v.get('value')} | Expected={v.get('expected')} | Computed={v.get('computed')} -> {match_str}")
    else:
        print(f"  Message      : {mrz_res.get('message')}")

    # -------------------------------------------------------------
    # 3. FIELD CROSS-VERIFICATION
    # -------------------------------------------------------------
    print("\n" + "-" * 40)
    print(" [3/4] Field Cross-Verification (Visual OCR vs MRZ)")
    print("-" * 40)
    cross_res = run_crossverify(image_path)
    print(f"  Passed       : {cross_res.passed} (True = Matched, False = Inconsistent, None = Skipped)")
    print(f"  Detail       : {cross_res.detail}")

    # -------------------------------------------------------------
    # 4. RISK AGGREGATION
    # -------------------------------------------------------------
    print("\n" + "-" * 40)
    print(" [4/4] Risk Aggregation")
    print("-" * 40)
    risk_res = aggregate(
        mrz_passed=mrz_passed,
        ela_passed=ela_res.get("passed", True),
        crossverify_passed=cross_res.passed,
        ela_score=ela_res.get("score", 0.0),
        is_photo_splice=ela_res.get("is_photo_splice", False),
    )
    print(f"  Verdict      : {risk_res['verdict']}")
    print(f"  Risk Score   : {risk_res['risk_score']:.2f}")

    # -------------------------------------------------------------
    # 5. END-TO-END API TEST (/analyze)
    # -------------------------------------------------------------
    print("\n" + "=" * 80)
    print("  [API Test] POST /analyze Endpoint (Includes PDF Report & Storage)")
    print("=" * 80)
    client = TestClient(app)
    with open(image_path, "rb") as f:
        ext = os.path.splitext(image_path)[1].lower()
        mime = "image/png" if ext == ".png" else "image/jpeg"
        response = client.post(
            "/analyze",
            files={"file": (os.path.basename(image_path), f, mime)},
        )
    print(f"  HTTP Status Code : {response.status_code}")
    res_data = response.json()
    print("  JSON Response    :")
    print(json.dumps(res_data, indent=4))
    
    # Check stored document and PDF on disk
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if res_data.get("pdf_report_path"):
        pdf_disk = os.path.join(base_dir, "app", res_data["pdf_report_path"].lstrip("/"))
        if os.path.exists(pdf_disk):
            print(f"\n  [SUCCESS] Generated PDF Report verified on disk: {pdf_disk} ({os.path.getsize(pdf_disk):,} bytes)")
        else:
            print(f"\n  [INFO] PDF Report path returned: {res_data['pdf_report_path']}")

    if res_data.get("document_path"):
        doc_disk = os.path.join(base_dir, "app", res_data["document_path"].lstrip("/"))
        if os.path.exists(doc_disk):
            print(f"  [SUCCESS] Stored Document verified on disk: {doc_disk} ({os.path.getsize(doc_disk):,} bytes)")
    print("=" * 80 + "\n")


def test_document(target_path: str):
    if os.path.isdir(target_path):
        valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
        files = [
            os.path.join(target_path, f)
            for f in os.listdir(target_path)
            if os.path.splitext(f)[1].lower() in valid_exts
        ]
        if not files:
            print(f"No valid images found in directory: {target_path}")
            return
        print(f"Found {len(files)} image(s) in folder '{target_path}'. Testing all:\n")
        for f in files:
            test_single_document(f)
    else:
        test_single_document(target_path)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_path = sys.argv[1]
    else:
        target_path = IMAGE_TO_TEST

    test_document(target_path)


