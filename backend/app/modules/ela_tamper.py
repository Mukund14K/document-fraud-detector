"""
ela_tamper.py
Error Level Analysis (ELA) based tamper detection for document images.

Team role: ELA / Tamper Detection Specialist
Used by: backend/app/modules/ela_tamper.py

Public entrypoint: analyze(image_path) -> dict
Matches the JSON contract expected by risk_aggregator.py:
    { "name": "ela_tamper", "passed": bool, "detail": str, "heatmap_path": str, "score": float }
"""

import os
import uuid
import tempfile
from PIL import Image, ImageChops, ImageEnhance
import numpy as np
import cv2

# ---------------------------------------------------------------------------
# CONFIG — the numbers you'll be tuning on Day 2
# ---------------------------------------------------------------------------
JPEG_RESAVE_QUALITY = 90       # quality used for the re-compression step
ELA_SCALE = 15                 # brightness amplification factor for visibility
SUSPICIOUS_MEAN_THRESHOLD = 8.0   # avg error level above this = flagged
SUSPICIOUS_MAX_THRESHOLD = 60.0   # a single very hot region = flagged
HOTSPOT_AREA_FRACTION = 0.02      # min fraction of image that must be "hot"
                                    # to count as a real tampered region (vs noise)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEATMAP_DIR = os.path.join(BASE_DIR, "static", "heatmaps")
os.makedirs(HEATMAP_DIR, exist_ok=True)



def _compute_ela_image(pil_img: Image.Image, quality: int = JPEG_RESAVE_QUALITY):
    """
    Core ELA computation.
    Returns (ela_pil_image, ela_gray_np_array)
    """
    # Ensure consistent format — ELA only makes sense on RGB
    pil_img = pil_img.convert("RGB")

    tmp_path = os.path.join(tempfile.gettempdir(), f"_ela_resave_{uuid.uuid4().hex}.jpg")
    pil_img.save(tmp_path, "JPEG", quality=quality)
    resaved = Image.open(tmp_path)

    # Pixel-wise difference between original and the resaved copy
    diff = ImageChops.difference(pil_img, resaved)

    # Amplify so the differences are visible / usable numerically
    extrema = diff.getextrema()  # per-channel (min, max)
    max_diff = max([ex[1] for ex in extrema]) or 1
    scale = 255.0 / max_diff
    diff = ImageEnhance.Brightness(diff).enhance(scale * (ELA_SCALE / 15.0))

    os.remove(tmp_path)

    # Grayscale array for numeric analysis (mean / max / hotspot detection)
    diff_np = np.array(diff.convert("L")).astype(np.float32)

    return diff, diff_np


def _find_hotspots(diff_np: np.ndarray):
    """
    Threshold the ELA map and find contiguous 'hot' regions.
    Returns (hotspot_mask, list_of_bounding_boxes, hot_area_fraction)
    """
    h, w = diff_np.shape
    total_pixels = h * w

    # Otsu-ish adaptive threshold — works better than a fixed cutoff
    # across different scan qualities / lighting
    _, mask = cv2.threshold(
        diff_np.astype(np.uint8), 0, 255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    # Clean up tiny noise specks — real tampered regions are blobs, not dust
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes = []
    hot_area = 0
    for c in contours:
        area = cv2.contourArea(c)
        if area < (0.001 * total_pixels):  # ignore specks under 0.1% of image
            continue
        x, y, bw, bh = cv2.boundingRect(c)
        boxes.append((x, y, bw, bh))
        hot_area += area

    hot_fraction = hot_area / total_pixels
    return mask, boxes, hot_fraction


def _save_heatmap(diff_pil: Image.Image, boxes, out_path: str):
    """
    Render a colorized heatmap with bounding boxes drawn on suspicious regions,
    save to disk for the frontend to display.
    """
    diff_np = np.array(diff_pil.convert("L"))
    heatmap = cv2.applyColorMap(diff_np, cv2.COLORMAP_JET)

    for (x, y, w, h) in boxes:
        cv2.rectangle(heatmap, (x, y), (x + w, y + h), (0, 255, 0), 2)

    cv2.imwrite(out_path, heatmap)


def analyze(image_path: str) -> dict:
    """
    Main entrypoint called by the backend route / risk_aggregator.

    Returns a dict matching the shared JSON schema:
    {
        "name": "ela_tamper",
        "passed": bool,          # True = no tampering signal found
        "detail": str,           # human-readable evidence for the officer
        "heatmap_path": str,     # relative/served path to the heatmap image
        "score": float           # 0.0 (clean) to 1.0 (strongly suspicious)
    }
    """
    try:
        pil_img = Image.open(image_path)
        diff_pil, diff_np = _compute_ela_image(pil_img)

        mean_err = float(np.mean(diff_np))
        max_err = float(np.max(diff_np))
        mask, boxes, hot_fraction = _find_hotspots(diff_np)

        flagged = (
            mean_err > SUSPICIOUS_MEAN_THRESHOLD
            or (max_err > SUSPICIOUS_MAX_THRESHOLD and hot_fraction > HOTSPOT_AREA_FRACTION)
        )

        # Normalize a 0-1 "confidence" score for the risk aggregator to weight
        score = min(1.0, (mean_err / (SUSPICIOUS_MEAN_THRESHOLD * 2)) * 0.5
                    + (hot_fraction / HOTSPOT_AREA_FRACTION) * 0.5)
        score = round(min(max(score, 0.0), 1.0), 3)

        heatmap_filename = f"ela_{uuid.uuid4().hex}.png"
        heatmap_disk_path = os.path.join(HEATMAP_DIR, heatmap_filename)
        _save_heatmap(diff_pil, boxes, heatmap_disk_path)
        heatmap_url_path = f"/static/heatmaps/{heatmap_filename}"

        if flagged:
            region_note = f"{len(boxes)} suspicious region(s) detected" if boxes else "elevated compression inconsistency"
            detail = (
                f"ELA flagged: mean error level {mean_err:.1f}, "
                f"max {max_err:.1f}, {region_note} "
                f"({hot_fraction*100:.1f}% of image area)."
            )
        else:
            detail = f"ELA clean: mean error level {mean_err:.1f}, no significant compression inconsistency found."

        return {
            "name": "ela_tamper",
            "passed": not flagged,
            "detail": detail,
            "heatmap_path": heatmap_url_path,
            "score": score,
        }
    except Exception as e:
        return {
            "name": "ela_tamper",
            "passed": True,
            "detail": f"ELA check encountered an error: {str(e)}",
            "heatmap_path": None,
            "score": 0.0,
        }


# ---------------------------------------------------------------------------
# Standalone test — run this file directly to sanity check on a sample image
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python ela_tamper.py <path_to_image>")
        sys.exit(1)

    result = analyze(sys.argv[1])
    print("\n--- ELA Analysis Result ---")
    for k, v in result.items():
        print(f"{k}: {v}")