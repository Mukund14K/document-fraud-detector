"""
Shared OCR utilities.

The EasyOCR model is heavy (~1.5 GB). We create a single reader instance
here so that every module (mrz_checksum, field_crossverify, …) reuses the
same reader instead of each loading its own copy.
"""

import re
import easyocr

reader = easyocr.Reader(["en"], gpu=False)


def extract_text_lines(image_path: str) -> list[str]:
    """
    Run EasyOCR on the full document image and return every detected
    text line, stripped but otherwise unmodified.  This is the raw
    material that downstream modules (field cross-verify, MRZ extraction,
    etc.) filter further.
    """
    return reader.readtext(image_path, detail=0)


def _is_valid_mrz_line(line: str) -> bool:
    """
    A real TD3 MRZ line is exactly 44 characters.  OCR occasionally
    drops or adds a character at the edges, so allow a small tolerance.

    Length alone is used as the signal (not '<' count) -- some genuine
    MRZ lines have very few '<' fillers when optional fields like the
    personal number are fully used with digits instead of padding.
    """
    return 42 <= len(line) <= 46


def find_mrz_lines(text_lines: list[str]) -> tuple[str, str] | None:
    """
    Given a list of raw OCR text lines (from extract_text_lines),
    find the two TD3 MRZ lines.

    Returns a (line1, line2) tuple if found, or None if fewer than
    2 valid MRZ lines are detected.
    """
    loose_pattern = re.compile(r"^[A-Z0-9<]{15,}$")
    candidates = []
    for line in text_lines:
        cleaned = line.upper().replace(" ", "")
        if loose_pattern.match(cleaned):
            candidates.append(cleaned)

    strict = [line for line in candidates if _is_valid_mrz_line(line)]

    if len(strict) < 2:
        return None

    return (strict[-2], strict[-1])
