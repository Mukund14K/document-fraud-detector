"""
Downloads sample MRZ document images + their ground-truth MRZ text
from the tony-xlh/MRZ-dataset data.json file.
"""

import json
import os
import requests

with open("data.json") as f:
    data = json.load(f)

images = data["images"]

os.makedirs("sample-documents/genuine", exist_ok=True)
os.makedirs("sample-documents/ground_truth", exist_ok=True)

success_count = 0
fail_count = 0

# try ALL entries this time, not just the first 6
for entry in images:
    filename = entry["filename"]
    url = entry["url"]
    mrz_text = entry["boxes"][0]["text"]

    print(f"Downloading {filename} ...")
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        img_path = os.path.join("sample-documents/genuine", filename)
        with open(img_path, "wb") as f:
            f.write(r.content)

        gt_path = os.path.join("sample-documents/ground_truth", filename + ".txt")
        with open(gt_path, "w") as f:
            f.write(mrz_text)

        print(f"  saved image + ground truth")
        success_count += 1
    except Exception as e:
        print(f"  FAILED: {e}")
        fail_count += 1

print()
print(f"Done. {success_count} succeeded, {fail_count} failed out of {len(images)} total.")
