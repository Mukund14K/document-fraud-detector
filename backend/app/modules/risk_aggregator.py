"""
Combines MRZ, ELA, and Field Cross-Verification results into a single
risk score and verdict.

Weights: MRZ checksum failure is near-deterministic evidence of tampering,
so it is weighted heaviest. ELA is a softer signal (scans/lighting cause
noise). Field cross-verification sits in between.
"""

WEIGHTS = {
    "mrz": 0.5,
    "ela": 0.25,
    "field_crossverify": 0.25,
}

VERDICT_THRESHOLDS = {
    "fake": 0.6,
    "suspicious": 0.3,
}


def aggregate(mrz_passed: bool, ela_passed: bool, crossverify_passed) -> dict:
    """
    mrz_passed: bool -- True if MRZ checksum validation passed
    ela_passed: bool -- True if ELA did NOT flag tampering
    crossverify_passed: bool or None -- True if fields matched,
                         None if cross-verification was skipped
    """
    score = 0.0

    if not mrz_passed:
        score += WEIGHTS["mrz"]

    if not ela_passed:
        score += WEIGHTS["ela"]

    # only penalize cross-verify if it actually ran (not skipped)
    if crossverify_passed is False:
        score += WEIGHTS["field_crossverify"]

    score = round(score, 2)

    if score >= VERDICT_THRESHOLDS["fake"]:
        verdict = "Fake"
    elif score >= VERDICT_THRESHOLDS["suspicious"]:
        verdict = "Suspicious"
    else:
        verdict = "Genuine"

    return {
        "verdict": verdict,
        "risk_score": score,
    }


if __name__ == "__main__":
    # Test 1: everything passes -> should be Genuine, low score
    result1 = aggregate(mrz_passed=True, ela_passed=True, crossverify_passed=True)
    print(f"Test 1 (all pass): {result1}  -- expected Genuine")

    # Test 2: only MRZ fails -> should be Suspicious (0.5)
    result2 = aggregate(mrz_passed=False, ela_passed=True, crossverify_passed=True)
    print(f"Test 2 (MRZ fails): {result2}  -- expected Suspicious, score 0.5")

    # Test 3: MRZ + ELA both fail -> should be Fake (0.75)
    result3 = aggregate(mrz_passed=False, ela_passed=False, crossverify_passed=True)
    print(f"Test 3 (MRZ+ELA fail): {result3}  -- expected Fake, score 0.75")

    # Test 4: only ELA fails -> should be Suspicious (0.25 -> actually below 0.3, check)
    result4 = aggregate(mrz_passed=True, ela_passed=False, crossverify_passed=True)
    print(f"Test 4 (only ELA fails): {result4}")

    # Test 5: crossverify skipped (None) shouldn't add to score
    result5 = aggregate(mrz_passed=True, ela_passed=True, crossverify_passed=None)
    print(f"Test 5 (crossverify skipped): {result5}  -- expected Genuine")
