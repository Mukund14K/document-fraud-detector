"""
OWNER: Field Cross-Verification Specialist (Role 6)

Classic forgery pattern: a forger edits the VISIBLE printed field (the
name/DOB/document number/expiry you can read with your eyes) but forgets to
also update the encoded value in the Machine Readable Zone at the
bottom, because the MRZ checksum algorithm isn't something a casual
forger knows about. This module OCRs the whole document, decodes the
MRZ, and checks the visible fields agree with what the MRZ says.
"""

import re
import unicodedata
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple

from app.models.schemas import CheckResult
from app.modules.mrz_checksum import parse_td3_mrz
from app.utils.ocr_helpers import extract_text_lines, find_mrz_lines

# Month mapping supporting multiple languages (English, French, German, Spanish, etc.)
MONTH_MAP: Dict[str, int] = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
    "JANVIER": 1, "FEVRIER": 2, "MARS": 3, "AVRIL": 4, "MAI": 5, "JUIN": 6,
    "JUILLET": 7, "AOUT": 8, "SEPTEMBRE": 9, "OCTOBRE": 10, "NOVEMBRE": 11, "DECEMBRE": 12,
    "FEV": 2, "MRZ": 3, "AVR": 4, "JUIL": 7, "AOU": 8, "SEPT": 9, "OKT": 10, "DEZ": 12,
    "ENE": 1, "ABR": 4, "AGO": 8, "DIC": 12,
}

SURNAME_LABELS = [
    "surname", "surnane", "nom / surname", "nom", "apellidos", "apellido",
    "nachname", "cognome", "ho /", "ho:", "ho / surname", "efternamn"
]

GIVEN_NAME_LABELS = [
    "given names", "given name", "given nanies", "given narnes", "given",
    "prenoms", "prénoms", "prenom", "nombres", "nombre", "vorname",
    "chu dem va ten", "chu dem vi ten", "chu dem", "ten", "fornamn", "förnamn"
]

FULL_NAME_LABELS = [
    "full name", "name / nom", "name:", "nom et prenoms",
    "nom et prénoms", "nombre completo", "vollstaendiger name"
]

DOB_LABELS = [
    "date of birth", "dale of birth", "dale 0f birth", "date 0f birth",
    "ngay sinh", "date de naissance", "fecha de nacimiento", "geburtsdatum",
    "data di nascita", "fodelsedatum", "födelsedatum", "birth date", "dob", "birth"
]

EXPIRY_LABELS = [
    "date of expiry", "date of expiration", "ngay het han", "expiry date",
    "expiration date", "date dexpiration", "date d expiration", "date d'expiration",
    "fecha de caducidad", "sista giltighetsdag", "valable jusqu'au", "expiry", "expiration", "valid until"
]

DOC_NUM_LABELS = [
    "passport no", "passport na", "passport number", "pass no", "pass nr",
    "so ho chieu", "document no", "doc no", "numero de passeport", "passnummer",
    "no de passeport", "document number"
]

SEX_LABELS = [
    "gioi tinh", "sex / sexe", "sex", "gender", "sexe", "sexo", "geschlecht", "kon", "kön"
]

ALL_LABEL_PATTERNS = [
    r"\bsurname\b", r"\bsurnane\b", r"\bnom\b", r"\bapellidos?\b", r"\bnachname\b", r"\bcognome\b", r"\bho\b", r"\befternamn\b",
    r"\bgiven\b", r"\bnanies\b", r"\bnarnes\b", r"\bnames?\b", r"\bprenoms?\b", r"\bprénoms?\b", r"\bnombres?\b", r"\bchu\s*dem\b", r"\bten\b", r"\bfornamn\b", r"\bförnamn\b",
    r"\bpassport\b", r"\bpass\s*(?:no|nr)\b", r"\bdoc\s*no\b", r"\bdocument\b", r"\bso\s*ho\s*chieu\b",
    r"\bdate\s*(?:of|0f)\s*birth\b", r"\bdale\s*(?:of|0f)\s*birth\b", r"\bngay\s*sinh\b", r"\bbirth\b", r"\bdob\b", r"\bfodelsedatum\b", r"\bfödelsedatum\b",
    r"\bdate\s*(?:of|0f)\s*expiry\b", r"\bdate\s*(?:of|0f)\s*expiration\b", r"\bngay\s*het\s*han\b", r"\bexpiry\b", r"\bexpiration\b", r"\bsista\s*giltighetsdag\b",
    r"\bdate\s*(?:of|0f)\s*issue\b", r"\bngay\s*cap\b", r"\butfardad\b", r"\butfärdad\b",
    r"\bsex\b", r"\bgender\b", r"\bsexe\b", r"\bgioi\s*tinh\b", r"\bkon\b", r"\bkön\b",
    r"\bplace\s*(?:of|0f)\s*birth\b", r"\bnoi\s*sinh\b", r"\bfodelseort\b", r"\bfödelseort\b",
    r"\bnationality\b", r"\bnationalitet\b", r"\bquoc\s*t[i|j]ch\b",
    r"\btype\b", r"\bloai\b", r"\btyp\b", r"\bcode\b", r"\bma\b", r"\bkod\b", r"\bid\s*na\b", r"\bcmnd\b", r"\bddcn\b",
    r"\brepublic\b", r"\bsocialist\b", r"\bcong\s*hoa\b", r"\bauthority\b", r"\bsignature\b"
]


def run_check(image_path: str) -> CheckResult:
    text_lines = extract_text_lines(image_path)
    mrz_pair = find_mrz_lines(text_lines)

    if not mrz_pair:
        return CheckResult(
            name="field_crossverify",
            passed=None,
            detail="Could not locate a readable MRZ on this document - field cross-verification skipped.",
        )

    mrz_data = parse_td3_mrz(*mrz_pair)
    mrz_name = _mrz_name_to_readable(mrz_data.get("name_field", ""))
    mrz_dob_yymmdd = mrz_data.get("checks", {}).get("date_of_birth", {}).get("value", "")
    mrz_expiry_yymmdd = mrz_data.get("checks", {}).get("expiry_date", {}).get("value", "")
    mrz_doc_number = _clean_alnum(mrz_data.get("checks", {}).get("passport_number", {}).get("value", ""))
    mrz_sex = mrz_data.get("sex", "").replace("<", "").strip().upper()

    # Extract visible fields
    visible_name = _extract_visible_name(text_lines)
    visible_dob, visible_dob_yymmdd = _extract_visible_date(text_lines, DOB_LABELS)
    visible_expiry, visible_expiry_yymmdd = _extract_visible_expiry(text_lines, EXPIRY_LABELS, mrz_expiry_yymmdd)
    visible_doc_number = _extract_visible_doc_number(text_lines, DOC_NUM_LABELS, mrz_doc_number)
    visible_sex = _extract_visible_sex(text_lines, SEX_LABELS)

    mismatches: List[str] = []
    verified_fields: List[str] = []

    # 1. Name cross-verification
    if visible_name:
        if _names_match(visible_name, mrz_name):
            verified_fields.append(f"Name ('{visible_name}')")
        else:
            mismatches.append(f"Visible name '{visible_name}' does not match MRZ name '{mrz_name}'")

    # 2. Date of Birth cross-verification
    if visible_dob and visible_dob_yymmdd:
        if mrz_dob_yymmdd and visible_dob_yymmdd == mrz_dob_yymmdd:
            verified_fields.append(f"DOB ('{visible_dob}' -> {visible_dob_yymmdd})")
        elif mrz_dob_yymmdd:
            mismatches.append(f"Visible DOB '{visible_dob}' ({visible_dob_yymmdd}) does not match MRZ DOB '{mrz_dob_yymmdd}'")

    # 3. Expiry Date cross-verification
    if visible_expiry and visible_expiry_yymmdd:
        if mrz_expiry_yymmdd and visible_expiry_yymmdd == mrz_expiry_yymmdd:
            verified_fields.append(f"Expiry ('{visible_expiry}' -> {visible_expiry_yymmdd})")
        elif mrz_expiry_yymmdd:
            mismatches.append(f"Visible Expiry '{visible_expiry}' ({visible_expiry_yymmdd}) does not match MRZ Expiry '{mrz_expiry_yymmdd}'")

    # 4. Document Number cross-verification
    if visible_doc_number:
        if mrz_doc_number and _doc_numbers_match(visible_doc_number, mrz_doc_number):
            verified_fields.append(f"Document No ('{visible_doc_number}')")
        elif mrz_doc_number:
            mismatches.append(f"Visible document number '{visible_doc_number}' does not match MRZ '{mrz_doc_number}'")

    # 5. Sex / Gender cross-verification
    if visible_sex and mrz_sex and mrz_sex not in ("", "<"):
        if _sex_matches(visible_sex, mrz_sex):
            verified_fields.append(f"Sex ('{visible_sex}')")
        else:
            mismatches.append(f"Visible sex '{visible_sex}' does not match MRZ sex '{mrz_sex}'")

    # If no visible fields could be verified
    if not verified_fields and not mismatches:
        return CheckResult(
            name="field_crossverify",
            passed=None,
            detail="Readable MRZ located, but no visible printed fields could be extracted from document to cross-verify.",
        )

    passed = len(mismatches) == 0
    if passed:
        detail = f"All {len(verified_fields)} cross-verified visible fields ({', '.join(verified_fields)}) match the MRZ."
    else:
        detail = f"Field cross-verification failed ({len(mismatches)} mismatch{'es' if len(mismatches) > 1 else ''}): " + "; ".join(mismatches)

    return CheckResult(
        name="field_crossverify",
        passed=passed,
        detail=detail,
    )


def _strip_accents(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def _is_label_noise_line(text: str) -> bool:
    clean = _strip_accents(text).lower().strip()
    return any(re.search(pat, clean) for pat in ALL_LABEL_PATTERNS)


def _clean_alnum(text: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", text.upper())


def _normalize_ocr_digits(text: str) -> str:
    """Normalize common OCR letter/digit confusions for code matching."""
    text = text.upper()
    trans = str.maketrans({"O": "0", "Q": "0", "D": "0", "I": "1", "L": "1", "Z": "2", "B": "8", "S": "5"})
    return text.translate(trans)


def _doc_numbers_match(visible: str, mrz_doc_num: str) -> bool:
    c_vis = _clean_alnum(visible)
    c_mrz = _clean_alnum(mrz_doc_num)
    if not c_vis or not c_mrz:
        return False
    if c_vis == c_mrz or c_vis in c_mrz or c_mrz in c_vis:
        return True
    norm_vis = _normalize_ocr_digits(c_vis)
    norm_mrz = _normalize_ocr_digits(c_mrz)
    return norm_vis == norm_mrz or norm_vis in norm_mrz or norm_mrz in norm_vis


def _mrz_name_to_readable(mrz_name_field: str) -> str:
    surname_part, _, given_part = mrz_name_field.partition("<<")
    surname = surname_part.replace("<", " ").strip()
    given = given_part.replace("<", " ").strip()
    return f"{surname} {given}".strip()


def _tokenize_name(name: str) -> List[str]:
    clean = _strip_accents(name).upper()
    tokens = re.findall(r"[A-Z]{2,}", clean)
    noise_words = {
        "PASSPORT", "REPUBLIC", "TYPE", "CODE", "SURNAME", "GIVEN", "NAMES", "NAME",
        "SEX", "NATIONALITY", "NOM", "PRENOMS", "VIETNAMESE", "VIETNAM", "SWEDEN", "SVERIGE"
    }
    return [t for t in tokens if t not in noise_words]


def _names_match(visible: str, mrz_name: str) -> bool:
    vis_tokens = _tokenize_name(visible)
    mrz_tokens = _tokenize_name(mrz_name)
    if not vis_tokens or not mrz_tokens:
        return False

    vis_set = set(vis_tokens)
    mrz_set = set(mrz_tokens)

    # 1. Exact set equality
    if vis_set == mrz_set:
        return True
    # 2. Subset matching (visible is subset of MRZ or MRZ is subset of visible)
    if vis_set.issubset(mrz_set) or mrz_set.issubset(vis_set):
        return True
    # 3. High token overlap
    intersection = vis_set.intersection(mrz_set)
    union = vis_set.union(mrz_set)
    return len(intersection) / len(union) >= 0.5


def _sex_matches(visible: str, mrz_sex: str) -> bool:
    vis = visible.upper().strip()
    mrz = mrz_sex.upper().strip()
    if not vis or not mrz or mrz == "<":
        return True
    if mrz in ("F", "M", "X"):
        if mrz == "F" and any(k in vis for k in ("F", "FEMALE", "FEMME", "FRAU", "MUJER", "NU", "KVINNA", "K")):
            return True
        if mrz == "M" and any(k in vis for k in ("M", "MALE", "HOMME", "MANN", "VARON", "NAM", "MAN")):
            return True
        if mrz == "X" and "X" in vis:
            return True
    return vis == mrz


def _normalize_date_to_yymmdd(text: str) -> Optional[str]:
    if not text:
        return None
    clean = _strip_accents(text)
    clean = re.sub(r"[^A-Za-z0-9/\-.\s]", " ", clean).strip()

    # Pattern 1: Text month (12 AUG 1974, 12 AUG / AOUT 1974, 12-AUG-74)
    m_text = re.search(r"\b(\d{1,2})[\s\-/.A-Za-z]*\b([A-Za-z]{3,10})\b[\s\-/.A-Za-z]*(\d{2,4})\b", clean)
    if m_text:
        day_s, mon_s, year_s = m_text.group(1), m_text.group(2).upper(), m_text.group(3)
        if mon_s in MONTH_MAP:
            month = MONTH_MAP[mon_s]
            day = int(day_s)
            year = int(year_s) if len(year_s) == 4 else (1900 + int(year_s) if int(year_s) > 40 else 2000 + int(year_s))
            try:
                return datetime(year, month, day).strftime("%y%m%d")
            except ValueError:
                pass

    # Pattern 2: Numeric date (DD/MM/YYYY, YYYY/MM/DD, DD/MM/YY)
    for pat in [
        r"\b(\d{1,2})[/\-. ]+(\d{1,2})[/\-. ]+(\d{4})\b",
        r"\b(\d{4})[/\-. ]+(\d{1,2})[/\-. ]+(\d{1,2})\b",
        r"\b(\d{1,2})[/\-. ]+(\d{1,2})[/\-. ]+(\d{2})\b",
    ]:
        m_num = re.search(pat, clean)
        if m_num:
            p1, p2, p3 = m_num.group(1), m_num.group(2), m_num.group(3)
            if len(p1) == 4:
                year, month, day = int(p1), int(p2), int(p3)
            elif len(p3) == 4:
                day, month, year = int(p1), int(p2), int(p3)
            else:
                day, month, year_2d = int(p1), int(p2), int(p3)
                year = 1900 + year_2d if year_2d > 40 else 2000 + year_2d
            try:
                return datetime(year, month, day).strftime("%y%m%d")
            except ValueError:
                pass
    return None


def _extract_visible_name(text_lines: List[str]) -> Optional[str]:
    surname = None
    given = None

    for i, line in enumerate(text_lines):
        low = line.lower()
        if "so ho chieu" in low:
            continue
        if re.search(r"\b(surname|surnane|nom|apellidos?|nachname|cognome|ho|efternamn)\b", low):
            idx = low.find(":")
            if idx != -1:
                after = line[idx + 1:].strip()
                if after and not _is_label_noise_line(after) and re.search(r"[A-Za-z]{2,}", after):
                    surname = after.strip()
                    break
            for j in range(i + 1, min(i + 4, len(text_lines))):
                cand = text_lines[j]
                if "<<" in cand or cand.startswith("P<"):
                    break
                if not _is_label_noise_line(cand) and re.match(r"^[A-Za-z\s]{2,}$", cand.strip()):
                    surname = cand.strip()
                    break
            if surname:
                break

    for i, line in enumerate(text_lines):
        low = line.lower()
        if re.search(r"\b(given|prenoms?|prénoms?|nombres?|chu dem|fornamn|förnamn)\b", low):
            idx = low.find(":")
            if idx != -1:
                after = line[idx + 1:].strip()
                if after and not _is_label_noise_line(after) and re.search(r"[A-Za-z]{2,}", after):
                    given = after.strip()
                    break
            for j in range(i + 1, min(i + 4, len(text_lines))):
                cand = text_lines[j]
                if "<<" in cand or cand.startswith("P<"):
                    break
                if not _is_label_noise_line(cand) and re.match(r"^[A-Za-z\s]{2,}$", cand.strip()):
                    given = cand.strip()
                    break
            if given:
                break

    if surname and given:
        return f"{surname} {given}"
    if surname:
        return surname
    if given:
        return given

    # Fallback to full name labels
    for i, line in enumerate(text_lines):
        low = line.lower()
        for label in FULL_NAME_LABELS:
            if re.search(r"\b" + re.escape(label) + r"\b", low):
                idx = low.find(label)
                after = line[idx + len(label):].lstrip(" :/-._")
                if after and not _is_label_noise_line(after) and re.search(r"[A-Za-z]{2,}", after):
                    return after.strip()
                for j in range(i + 1, min(i + 4, len(text_lines))):
                    cand = text_lines[j]
                    if "<<" in cand or cand.startswith("P<"):
                        break
                    if not _is_label_noise_line(cand) and re.match(r"^[A-Za-z\s]{2,}$", cand.strip()):
                        return cand.strip()
    return None


def _extract_visible_date(text_lines: List[str], labels: List[str]) -> Tuple[Optional[str], Optional[str]]:
    for i, line in enumerate(text_lines):
        low = line.lower()
        for label in labels:
            if re.search(r"\b" + re.escape(label) + r"\b", low):
                idx = low.find(":")
                if idx != -1:
                    after = line[idx + 1:].strip()
                    yymmdd = _normalize_date_to_yymmdd(after)
                    if yymmdd:
                        return after, yymmdd
                for j in range(i + 1, min(i + 5, len(text_lines))):
                    cand = text_lines[j]
                    if "<<" in cand or cand.startswith("P<"):
                        break
                    yymmdd_cand = _normalize_date_to_yymmdd(cand)
                    if yymmdd_cand:
                        return cand, yymmdd_cand
    return None, None


def _extract_visible_expiry(
    text_lines: List[str], labels: List[str], mrz_expiry: str
) -> Tuple[Optional[str], Optional[str]]:
    candidates: List[Tuple[str, str]] = []
    for i, line in enumerate(text_lines):
        low = line.lower()
        for label in labels:
            if label in low or re.search(r"\b" + re.escape(label) + r"\b", low):
                idx = low.find(":")
                if idx != -1:
                    after = line[idx + 1:].strip()
                    yymmdd = _normalize_date_to_yymmdd(after)
                    if yymmdd:
                        candidates.append((after, yymmdd))
                for j in range(i + 1, min(i + 5, len(text_lines))):
                    cand = text_lines[j]
                    if "<<" in cand or cand.startswith("P<"):
                        break
                    yymmdd_cand = _normalize_date_to_yymmdd(cand)
                    if yymmdd_cand:
                        candidates.append((cand, yymmdd_cand))
    if not candidates:
        return None, None
    for text_val, yymmdd in candidates:
        if mrz_expiry and yymmdd == mrz_expiry:
            return text_val, yymmdd
    return candidates[-1]


def _extract_visible_doc_number(
    text_lines: List[str], labels: List[str], mrz_doc_num: str
) -> Optional[str]:
    for i, line in enumerate(text_lines):
        low = line.lower()
        for label in labels:
            if label in low or re.search(r"\b" + re.escape(label) + r"\b", low):
                idx = low.find(":")
                if idx != -1:
                    after = line[idx + 1:].strip()
                    m_after = re.search(r"\b[A-Za-z0-9]{7,12}\b", after)
                    if m_after and not _is_label_noise_line(m_after.group(0)):
                        return m_after.group(0)
                for j in range(i + 1, min(i + 5, len(text_lines))):
                    cand = text_lines[j]
                    if "<<" in cand or cand.startswith("P<"):
                        break
                    cand_alnum = re.sub(r"[^A-Za-z0-9]", "", cand.upper())
                    if 7 <= len(cand_alnum) <= 12 and not _is_label_noise_line(cand):
                        return cand.strip()

    if mrz_doc_num:
        for line in text_lines:
            if "<<" in line or line.startswith("P<"):
                continue
            for token in re.findall(r"\b[A-Za-z0-9]{7,12}\b", line):
                if _doc_numbers_match(token, mrz_doc_num) and not _is_label_noise_line(token):
                    return token
    return None


def _extract_visible_sex(text_lines: List[str], labels: List[str]) -> Optional[str]:
    sex_val_pattern = re.compile(
        r"\b(M|F|X|FEMALE|MALE|HOMME|FEMME|FRAU|MANN|MUJER|VARON|NU\s*/\s*F|NAM\s*/\s*M|K\s*/\s*F)\b",
        re.IGNORECASE,
    )
    for i, line in enumerate(text_lines):
        low = line.lower()
        for label in labels:
            if label in low or re.search(r"\b" + re.escape(label) + r"\b", low):
                idx = low.find(":")
                if idx != -1:
                    after = line[idx + 1:].strip()
                    m = sex_val_pattern.search(after)
                    if m:
                        return m.group(0).strip()
                for j in range(i + 1, min(i + 5, len(text_lines))):
                    cand = text_lines[j]
                    if "<<" in cand or cand.startswith("P<"):
                        break
                    if _is_label_noise_line(cand):
                        continue
                    m = sex_val_pattern.search(cand)
                    if m:
                        return cand.strip()
    return None

