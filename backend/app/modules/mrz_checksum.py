"""
ICAO 9303 MRZ checksum algorithm + TD3 (passport) parsing + OCR extraction.
Includes check digit computation, ISO 3166-1 alpha-3 / ICAO country code validation,
and composite check digit validation.
"""

import re
from app.utils.ocr_helpers import extract_text_lines, _is_valid_mrz_line

OCR_DIGIT_CORRECTIONS = {
    "O": "0", "Q": "0", "D": "0",
    "I": "1", "L": "1",
    "Z": "2",
    "S": "5",
    "G": "6",
    "B": "8",
}

# Standard ICAO 9303 / ISO 3166-1 alpha-3 official country code set
VALID_ICAO_COUNTRY_CODES = {
    "AFG", "ALB", "DZA", "AND", "AGO", "ATG", "ARG", "ARM", "AUS", "AUT", "AZE", "BHS",
    "BHR", "BGD", "BRB", "BLR", "BEL", "BLZ", "BEN", "BTN", "BOL", "BIH", "BWA", "BRA",
    "BRN", "BGR", "BFA", "BDI", "KHM", "CMR", "CAN", "CPV", "CAF", "TCD", "CHL", "CHN",
    "COL", "COM", "COG", "COD", "CRI", "CIV", "HRV", "CUB", "CYP", "CZE", "DNK", "DJI",
    "DMA", "DOM", "ECU", "EGY", "SLV", "GNQ", "ERI", "EST", "SWZ", "ETH", "FJI", "FIN",
    "FRA", "GAB", "GMB", "GEO", "DEU", "GHA", "GRC", "GRD", "GTM", "GIN", "GNB", "GUY",
    "HTI", "HND", "HUN", "ISL", "IND", "IDN", "IRN", "IRQ", "IRL", "ISR", "ITA", "JAM",
    "JPN", "JOR", "KAZ", "KEN", "KIR", "PRK", "KOR", "KWT", "KGZ", "LAO", "LVA", "LBN",
    "LSO", "LBR", "LBY", "LIE", "LTU", "LUX", "MDG", "MWI", "MYS", "MDV", "MLI", "MLT",
    "MHL", "MRT", "MUS", "MEX", "FSM", "MDA", "MCO", "MNG", "MNE", "MAR", "MOZ", "MMR",
    "NAM", "NRU", "NPL", "NLD", "NZL", "NIC", "NER", "NGA", "MKD", "NOR", "OMN", "PAK",
    "PLW", "PAN", "PNG", "PRY", "PER", "PHL", "POL", "PRT", "QAT", "ROU", "RUS", "RWA",
    "KNA", "LCA", "VCT", "WSM", "SMR", "STP", "SAU", "SEN", "SRB", "SYC", "SLE", "SGP",
    "SVK", "SVN", "SLB", "SOM", "ZAF", "SSD", "ESP", "LKA", "SDN", "SUR", "SWE", "CHE",
    "SYR", "TWN", "TJK", "TZA", "THA", "TLS", "TGO", "TON", "TTO", "TUN", "TUR", "TKM",
    "TUV", "UGA", "UKR", "ARE", "GBR", "USA", "URY", "UZB", "VUT", "VEN", "VNM", "YEM",
    "ZMB", "ZWE", "D<<", "UTO", "UNA", "UNK", "XOM", "XXA", "XXB", "XXX"
}


def correct_digit_char(c: str) -> str:
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
    issuing_country = line1[2:5].replace("<", "")
    name_field = line1[5:44]

    passport_number = line2[0:9]
    passport_check_raw = line2[9]
    passport_check = correct_digit_char(passport_check_raw)

    nationality = line2[10:13].replace("<", "")
    dob = line2[13:19]
    dob_check_raw = line2[19]
    dob_check = correct_digit_char(dob_check_raw)

    sex = line2[20]
    expiry = line2[21:27]
    expiry_check_raw = line2[27]
    expiry_check = correct_digit_char(expiry_check_raw)

    # Optional personal number / data + check digit
    optional_data = line2[28:42]
    composite_check_raw = line2[43] if len(line2) > 43 else "<"
    composite_check = correct_digit_char(composite_check_raw)

    # Validate Country Code
    is_valid_issuing_country = issuing_country in VALID_ICAO_COUNTRY_CODES or issuing_country.ljust(3, "<") in VALID_ICAO_COUNTRY_CODES
    is_valid_nationality = nationality in VALID_ICAO_COUNTRY_CODES or nationality.ljust(3, "<") in VALID_ICAO_COUNTRY_CODES

    country_warning = None
    if not is_valid_issuing_country:
        country_warning = f"Invalid ICAO issuing state code '{issuing_country}' (expected valid 3-letter country code like GBR, USA, JPN)."
    elif issuing_country == "GBP":
        country_warning = "Invalid country code 'GBP' detected (GBP is a currency code; official UK country code is GBR)."

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

    # Composite check digit (covers passport_number + check + dob + check + expiry + check + optional + check)
    composite_data = passport_number + passport_check_raw + dob + dob_check_raw + expiry + expiry_check_raw + optional_data
    computed_composite = compute_check_digit(composite_data)
    if composite_check.isdigit():
        checks["composite"] = {
            "value": composite_data,
            "ocr_raw_check_char": composite_check_raw,
            "expected": int(composite_check),
            "computed": computed_composite,
            "match": int(composite_check) == computed_composite,
        }

    all_passed = all(c["match"] for c in checks.values()) and (country_warning is None)

    return {
        "doc_type": doc_type,
        "country": issuing_country,
        "nationality": nationality,
        "sex": sex,
        "name_field": name_field,
        "checks": checks,
        "country_warning": country_warning,
        "mrz_checksum_passed": all_passed,
    }


def extract_mrz_lines(image_path: str) -> list:
    raw_results = extract_text_lines(image_path)

    loose_pattern = re.compile(r"^[A-Z0-9<]{15,}$")
    candidates = []
    for line in raw_results:
        cleaned = line.upper().replace(" ", "")
        if loose_pattern.match(cleaned):
            candidates.append(cleaned)

    # filter down to lines that actually look like real MRZ lines
    strict_candidates = [line for line in candidates if _is_valid_mrz_line(line)]
    return strict_candidates


def run_mrz_check(image_path: str) -> dict:
    lines = extract_mrz_lines(image_path)

    if len(lines) < 2:
        return {
            "status": "error",
            "message": (
                f"Could not confidently detect 2 valid MRZ lines "
                f"(found {len(lines)} candidate(s) after strict filtering). "
                f"This may mean the document has no MRZ, image quality is too "
                f"low, or the MRZ zone was not fully captured."
            ),
            "mrz_checksum_passed": False,
            "candidates_found": lines,
        }

    result = parse_td3_mrz(lines[-2], lines[-1])
    result["status"] = "ok"
    result["raw_ocr_lines"] = lines

    if result.get("country_warning"):
        result["message"] = result["country_warning"]

    return result


if __name__ == "__main__":
    import sys
    import json
    image_path = sys.argv[1] if len(sys.argv) > 1 else "sample-documents/genuine/001926.jpg"
    res = run_mrz_check(image_path)
    print(json.dumps(res, indent=2))