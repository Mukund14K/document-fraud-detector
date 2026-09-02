"""
Combines MRZ, ELA, and Field Cross-Verification results into a single
risk score and verdict with explainable multi-signal reasoning.

Rules:
- MRZ Checksum or Country Code Failure: Critical security violation -> Fake / High Risk.
- Photo Substitution / Image Tampering: Physical or digital splice -> Fake / High Risk.
- Field Mismatch: Visual OCR vs MRZ conflict -> Fake.
- Genuine: Only when all active forensic checks pass cleanly.
"""

def aggregate(
    mrz_passed: bool,
    ela_passed: bool,
    crossverify_passed,
    ela_score: float = 0.0,
    is_photo_splice: bool = False,
) -> dict:
    score = 0.0

    # 1. MRZ Checksum / Country Code Failure
    if not mrz_passed:
        score += 0.65

    # 2. ELA Tamper & Photo Substitution
    if not ela_passed:
        if is_photo_splice or ela_score >= 0.70:
            score += 0.75  # Photo substitution is a direct forgery
        else:
            score += 0.45  # Compression anomaly

    # 3. Field Cross-Verification Mismatch
    if crossverify_passed is False:
        score += 0.60

    # Cap score between 0.0 and 1.0
    score = round(min(max(score, 0.0), 1.0), 2)

    # Decision Boundaries
    if score >= 0.50:
        verdict = "Fake"
    elif score >= 0.30:
        verdict = "Suspicious"
    else:
        verdict = "Genuine"

    return {
        "verdict": verdict,
        "risk_score": score,
    }


if __name__ == "__main__":
    # Test 1: all pass -> Genuine (0.0)
    print("Test 1 (all pass):", aggregate(True, True, True))
    # Test 2: MRZ fails -> Fake (0.65)
    print("Test 2 (MRZ fails):", aggregate(False, True, True))
    # Test 3: Photo splice / high ELA -> Fake (0.75)
    print("Test 3 (Photo splice):", aggregate(True, False, True, is_photo_splice=True))
    # Test 4: General ELA anomaly -> Suspicious (0.45)
    print("Test 4 (ELA anomaly):", aggregate(True, False, True, ela_score=0.4))
    # Test 5: Field mismatch -> Fake (0.60)
    print("Test 5 (Field mismatch):", aggregate(True, True, False))
