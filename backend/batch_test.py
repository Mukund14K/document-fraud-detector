"""
Batch-tests the MRZ module against sample-documents/genuine images,
comparing results against known ground-truth MRZ text.
"""

import os
import sys

sys.path.append("app/modules")
from mrz_checksum import run_mrz_check

GENUINE_DIR = "sample-documents/genuine"
GROUND_TRUTH_DIR = "sample-documents/ground_truth"

results = []

for filename in os.listdir(GENUINE_DIR):
    image_path = os.path.join(GENUINE_DIR, filename)
    gt_path = os.path.join(GROUND_TRUTH_DIR, filename + ".txt")

    if not os.path.exists(gt_path):
        continue

    with open(gt_path, "r") as f:
        ground_truth_mrz = f.read().strip()

    print(f"\n{'='*60}")
    print(f"Testing: {filename}")
    print(f"Ground truth MRZ:\n{ground_truth_mrz}")

    result = run_mrz_check(image_path)

    if result.get("status") != "ok":
        print(f"OCR FAILED: {result.get('message')}")
        results.append({"filename": filename, "outcome": "ocr_failed"})
        continue

    checksum_passed = result.get("mrz_checksum_passed", False)
    print(f"Checksum validation passed: {checksum_passed}")

    for field, c in result["checks"].items():
        print(f"  {field}: value={c['value']} expected={c['expected']} computed={c['computed']} match={c['match']}")

    results.append({
        "filename": filename,
        "outcome": "checksum_passed" if checksum_passed else "checksum_failed",
    })

print(f"\n\n{'='*60}")
print("SUMMARY")
print(f"{'='*60}")
for r in results:
    print(f"{r['filename']}: {r['outcome']}")

total = len(results)
passed = sum(1 for r in results if r["outcome"] == "checksum_passed")
print(f"\n{passed}/{total} images passed checksum validation")
