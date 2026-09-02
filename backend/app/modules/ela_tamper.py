"""
ela_tamper.py
Enhanced Error Level Analysis (ELA) and Photo Substitution / Splice Detection
for identity documents.

Public entrypoint: analyze(image_path) -> dict
"""

import os
import uuid
import tempfile
from PIL import Image, ImageChops, ImageEnhance
import numpy as np
import cv2

JPEG_RESAVE_QUALITY = 90
ELA_SCALE = 15
SEVERE_MEAN_THRESHOLD = 28.0       # Only extremely high global mismatch triggers global flag
HOTSPOT_AREA_THRESHOLD = 0.02      # Min 2% contiguous hot area required for localized anomaly

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEATMAP_DIR = os.path.join(BASE_DIR, "static", "heatmaps")
os.makedirs(HEATMAP_DIR, exist_ok=True)


def _compute_ela_image(pil_img: Image.Image, quality: int = JPEG_RESAVE_QUALITY):
    pil_img = pil_img.convert("RGB")
    tmp_path = os.path.join(tempfile.gettempdir(), f"_ela_resave_{uuid.uuid4().hex}.jpg")
    pil_img.save(tmp_path, "JPEG", quality=quality)
    resaved = Image.open(tmp_path)

    diff = ImageChops.difference(pil_img, resaved)
    extrema = diff.getextrema()
    max_diff = max([ex[1] for ex in extrema]) or 1
    scale = 255.0 / max_diff
    diff = ImageEnhance.Brightness(diff).enhance(scale * (ELA_SCALE / 15.0))

    try:
        os.remove(tmp_path)
    except Exception:
        pass

    diff_np = np.array(diff.convert("L")).astype(np.float32)
    return diff, diff_np


def _detect_photo_splice(img_np: np.ndarray, diff_np: np.ndarray):
    """
    Detects photo substitution / splicing:
    - Artificial solid background overlay in portrait zone (e.g. bright blue/cyan box)
    - Sharp rectangular splice border lines in portrait zone
    - Severe compression layer discrepancy in portrait zone
    """
    if img_np is None or diff_np is None:
        return False, [], ""

    h, w = diff_np.shape[:2]
    splice_boxes = []
    details = []

    # Passport photo region: left 3% to 50% width and 15% to 85% height
    photo_roi_x1, photo_roi_y1 = int(w * 0.03), int(h * 0.15)
    photo_roi_x2, photo_roi_y2 = int(w * 0.50), int(h * 0.85)

    photo_crop = img_np[photo_roi_y1:photo_roi_y2, photo_roi_x1:photo_roi_x2]
    if photo_crop.size == 0:
        return False, [], ""

    total_crop_area = photo_crop.shape[0] * photo_crop.shape[1]

    # 1. Check for unnatural solid blue/cyan background in portrait region
    if len(photo_crop.shape) == 3:
        hsv_crop = cv2.cvtColor(photo_crop, cv2.COLOR_BGR2HSV)
        # Saturated blue/cyan background typical of pasted passport photos
        blue_mask = cv2.inRange(hsv_crop, np.array([90, 100, 70]), np.array([130, 255, 255]))
        blue_ratio = np.sum(blue_mask > 0) / float(total_crop_area)
        if blue_ratio > 0.18:
            details.append(f"Synthetic solid background overlay in portrait zone ({blue_ratio*100:.1f}%)")
            splice_boxes.append((photo_roi_x1, photo_roi_y1, photo_roi_x2 - photo_roi_x1, photo_roi_y2 - photo_roi_y1))

    # 2. Check for sharp rectangular pasted borders in portrait zone
    gray_crop = cv2.cvtColor(photo_crop, cv2.COLOR_BGR2GRAY) if len(photo_crop.shape) == 3 else photo_crop
    edges = cv2.Canny(gray_crop, 80, 200)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for c in contours:
        area = cv2.contourArea(c)
        if area > (0.15 * total_crop_area):
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.03 * peri, True)
            if len(approx) == 4:
                rx, ry, rw, rh = cv2.boundingRect(c)
                aspect_ratio = rh / float(rw) if rw > 0 else 0
                if 1.1 <= aspect_ratio <= 1.6:
                    abs_box = (photo_roi_x1 + rx, photo_roi_y1 + ry, rw, rh)
                    splice_boxes.append(abs_box)
                    details.append("Sharp rectangular photo splice border detected")

    splice_detected = len(details) > 0
    return splice_detected, splice_boxes, "; ".join(details)


def _find_hotspots(diff_np: np.ndarray):
    h, w = diff_np.shape
    total_pixels = h * w

    # Otsu thresholding for significant local difference peaks
    _, mask = cv2.threshold(
        diff_np.astype(np.uint8), 0, 255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    kernel = np.ones((7, 7), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes = []
    hot_area = 0
    for c in contours:
        area = cv2.contourArea(c)
        if area < (0.005 * total_pixels):
            continue
        x, y, bw, bh = cv2.boundingRect(c)
        boxes.append((x, y, bw, bh))
        hot_area += area

    hot_fraction = hot_area / total_pixels
    return mask, boxes, hot_fraction


def _save_heatmap(diff_pil: Image.Image, boxes, splice_boxes, out_path: str):
    diff_np = np.array(diff_pil.convert("L"))
    heatmap = cv2.applyColorMap(diff_np, cv2.COLORMAP_JET)

    # Draw regular ELA hotspot boxes in Yellow
    for (x, y, w, h) in boxes:
        cv2.rectangle(heatmap, (x, y), (x + w, y + h), (0, 255, 255), 2)

    # Draw critical Photo Splice / Tamper boxes in Red with label
    for (x, y, w, h) in splice_boxes:
        cv2.rectangle(heatmap, (x, y), (x + w, y + h), (0, 0, 255), 3)
        cv2.putText(heatmap, "TAMPER DETECTED", (x + 5, y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    cv2.imwrite(out_path, heatmap)


def analyze(image_path: str) -> dict:
    try:
        pil_img = Image.open(image_path)
        img_bgr = cv2.imread(image_path)
        diff_pil, diff_np = _compute_ela_image(pil_img)

        mean_err = float(np.mean(diff_np))
        max_err = float(np.max(diff_np))
        mask, boxes, hot_fraction = _find_hotspots(diff_np)

        # Detect photo substitution / image splicing
        is_splice, splice_boxes, splice_detail = _detect_photo_splice(img_bgr, diff_np)

        flagged = (
            is_splice
            or (hot_fraction >= HOTSPOT_AREA_THRESHOLD and len(boxes) > 0)
            or mean_err >= SEVERE_MEAN_THRESHOLD
        )

        if is_splice:
            score = 0.85
        elif flagged:
            score = min(0.70, (hot_fraction / HOTSPOT_AREA_THRESHOLD) * 0.4 + (mean_err / SEVERE_MEAN_THRESHOLD) * 0.3)
        else:
            score = min(0.20, (mean_err / SEVERE_MEAN_THRESHOLD) * 0.2)
        score = round(float(score), 3)

        heatmap_filename = f"ela_{uuid.uuid4().hex}.png"
        heatmap_disk_path = os.path.join(HEATMAP_DIR, heatmap_filename)
        _save_heatmap(diff_pil, boxes, splice_boxes, heatmap_disk_path)
        heatmap_url_path = f"/static/heatmaps/{heatmap_filename}"

        if is_splice:
            detail = f"Photo Tampering Detected: {splice_detail} (mean ELA: {mean_err:.1f})."
        elif flagged:
            detail = (
                f"ELA flagged: mean error level {mean_err:.1f}, "
                f"{len(boxes)} suspicious region(s) detected "
                f"({hot_fraction*100:.1f}% of image area)."
            )
        else:
            detail = f"ELA clean: mean error level {mean_err:.1f}, uniform compression layer across document."

        return {
            "name": "ela_tamper",
            "passed": not flagged,
            "detail": detail,
            "heatmap_path": heatmap_url_path,
            "score": score,
            "is_photo_splice": is_splice,
        }
    except Exception as e:
        return {
            "name": "ela_tamper",
            "passed": True,
            "detail": f"ELA check encountered an error: {str(e)}",
            "heatmap_path": None,
            "score": 0.0,
            "is_photo_splice": False,
        }


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python ela_tamper.py <path_to_image>")
        sys.exit(1)

    res = analyze(sys.argv[1])
    print("\n--- ELA Analysis Result ---")
    for k, v in res.items():
        print(f"{k}: {v}")