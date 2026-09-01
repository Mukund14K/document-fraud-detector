"""
ICAO 9303 MRZ checksum algorithm + TD3 (passport) parsing + OCR extraction.
"""

import re
import easyocr

reader = easyocr.Reader(["en"], gpu=False)

# common OCR misreads at digit-only positions
OCR_DIGIT_CORRECTIONS = {
    "O": "0", "Q": "0", "D": "0",
    "I": "1", "L": "1",
    "Z": "2",
    "S": "5",
    "G": "6",
    "B": "8",
}


def correct_digit_char(c: str) -> str:
    """If c is a letter commonly confused with a digit, correct it. Else leave as-is."""
    if c.isdigit():
        return c
    return OCR_DIGIT_CORRECTIONS.get(c, c)


def char_value(c: str) -> int:
    if c == "<":
        return 0
    if c.isdigit():
        return int(c)
    if c.isalpha():
        return ord(c.upper()) - ord("A") + 10
    return 0


def compute_check_digit(data: str) -> int:
    weights = [7, 3, 1]
    total = 0
    for i, c in enumerate(data):
        total += char_value(c) * weights[i % 3]
    return total % 10


def parse_td3_mrz(line1: str, line2: str) -> dict:
    line1 = line1.ljust(44, "<")[:44]
    line2 = line2.ljust(44, "<")[:44]

    doc_type = line1[0:2]
    country = line1[2:5]
    name_field = line1[5:44]

    passport_number = line2[0:9]
    passport_check_raw = line2[9]
    passport_check = correct_digit_char(passport_check_raw)

    nationality = line2[10:13]
    dob = line2[13:19]
    dob_check_raw = line2[19]
    dob_check = correct_digit_char(dob_check_raw)

    sex = line2[20]
    expiry = line2[21:27]
    expiry_check_raw = line2[27]
    expiry_check = correct_digit_char(expiry_check_raw)

    checks = {
        "passport_number": {
            "value": passport_number,
            "ocr_raw_check_char": passport_check_raw,
            "expected": int(passport_check) if passport_check.isdigit() else None,
            "computed": compute_check_digit(passport_number),
        },
        "date_of_birth": {
            "value": dob,
            "ocr_raw_check_char": dob_check_raw,
            "expected": int(dob_check) if dob_check.isdigit() else None,
            "computed": compute_check_digit(dob),
        },
        "expiry_date": {
            "value": expiry,
            "ocr_raw_check_char": expiry_check_raw,
            "expected": int(expiry_check) if expiry_check.isdigit() else None,
            "computed": compute_check_digit(expiry),
        },
    }

    for field, c in checks.items():
        c["match"] = (c["expected"] == c["computed"]) if c["expected"] is not None else False

    all_passed = all(c["match"] for c in checks.values())

    return {
        "doc_type": doc_type,
        "country": country,
        "nationality": nationality,
        "sex": sex,
        "name_field": name_field,
        "checks": checks,
        "mrz_checksum_passed": all_passed,
    }


def extract_mrz_lines(image_path: str) -> list:
    raw_results = reader.readtext(image_path, detail=0)
    mrz_pattern = re.compile(r"^[A-Z0-9<]{20,}$")
    candidates = []
    for line in raw_results:
        cleaned = line.upper().replace(" ", "")
        if mrz_pattern.match(cleaned):
            candidates.append(cleaned)
    return candidates


def run_mrz_check(image_path: str) -> dict:
    lines = extract_mrz_lines(image_path)
    if len(lines) < 2:
        return {
            "status": "error",
            "message": f"Could not detect 2 MRZ lines. Found: {lines}",
            "mrz_checksum_passed": False,
        }
    result = parse_td3_mrz(lines[-2], lines[-1])
    result["status"] = "ok"
    result["raw_ocr_lines"] = lines
    return result


if __name__ == "__main__":
    import sys
    image_path = sys.argv[1] if len(sys.argv) > 1 else "test_image.jpg"
    result = run_mrz_check(image_path)
    print(result)
