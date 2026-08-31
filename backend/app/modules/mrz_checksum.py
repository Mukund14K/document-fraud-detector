"""
ICAO 9303 MRZ checksum algorithm + TD3 (passport) parsing.
"""


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
    passport_check = line2[9]
    nationality = line2[10:13]
    dob = line2[13:19]
    dob_check = line2[19]
    sex = line2[20]
    expiry = line2[21:27]
    expiry_check = line2[27]

    checks = {
        "passport_number": {
            "value": passport_number,
            "expected": int(passport_check) if passport_check.isdigit() else None,
            "computed": compute_check_digit(passport_number),
        },
        "date_of_birth": {
            "value": dob,
            "expected": int(dob_check) if dob_check.isdigit() else None,
            "computed": compute_check_digit(dob),
        },
        "expiry_date": {
            "value": expiry,
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


def run_test(label, line1, line2):
    print(f"=== {label} ===")
    result = parse_td3_mrz(line1, line2)
    for field, c in result["checks"].items():
        print(f"{field}: value={c['value']} expected={c['expected']} computed={c['computed']} match={c['match']}")
    print(f"Overall MRZ checksum passed: {result['mrz_checksum_passed']}")
    print()


if __name__ == "__main__":
    # Test A: GENUINE - real ICAO reference sample, should all pass
    genuine_line1 = "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<"
    genuine_line2 = "L898902C36UTO7408122F1204159ZE184226B<<<<<10"
    run_test("GENUINE (expected: all pass)", genuine_line1, genuine_line2)

    # Test B: TAMPERED - DOB changed from 740812 to 740813,
    # but check digit (2) was NOT recalculated -- simulates a forger
    # editing the visible date without knowing the checksum algorithm
    tampered_line1 = "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<"
    tampered_line2 = "L898902C36UTO7408132F1204159ZE184226B<<<<<10"
    run_test("TAMPERED DOB (expected: date_of_birth match=False)", tampered_line1, tampered_line2)
