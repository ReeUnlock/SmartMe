"""Heuristic-based parser for Polish receipt OCR text.

Extracts: store name, date, total amount, suggested category.
Does NOT parse individual items — only the final total.
"""

import logging
import re
from datetime import datetime

logger = logging.getLogger(__name__)

# Known Polish store names (case-insensitive matching)
KNOWN_STORES = [
    "Biedronka", "Lidl", "Kaufland", "Auchan", "Carrefour", "Tesco",
    "Netto", "Dino", "Stokrotka", "Lewiatan", "Polo Market", "Polomarket",
    "Intermarche", "Delikatesy Centrum", "Freshmarket", "Mila",
    "Żabka", "Zabka", "Rossmann", "Hebe", "Media Expert", "Media Markt",
    "RTV Euro AGD", "Castorama", "Leroy Merlin", "IKEA", "Pepco",
    "Action", "Jysk", "Reserved", "H&M", "Zara", "CCC", "Empik",
    "Orlen", "BP", "Shell", "Circle K", "Aldi", "Makro", "Selgros",
    "Spar", "ABC", "Groszek", "Duży Ben", "Topaz",
    "Starbucks", "Costa Coffee", "McDonald's", "KFC", "Burger King",
    "Subway", "Pizza Hut", "Domino's", "Żappka",
]

TOTAL_KEYWORDS = [
    r"SUMA\s+PLN", r"SUMA\b[:\s]", r"RAZEM\b", r"DO\s*ZAP[ŁL]ATY",
    r"[ŁL]([AĄ])CZNA", r"WARTO[ŚS][ĆC]\s*BRUTTO",
    r"SPRZEDA[ŻZ]\s*BRUTTO", r"WP[ŁL]ATA\b", r"NALE[ŻZ]NO[ŚS][ĆC]",
    # Common OCR misreads of SUMA/RAZEM
    r"SUNA\b", r"RAZEN\b", r"SUflA\b", r"SUHA\b", r"SU[MN]A\b",
    r"SUfl[AĄ]\b", r"SUNIA\b",
]

DATE_PATTERNS = [
    # YYYY-MM-DD (most unambiguous, common on modern Polish receipts — try first)
    (r"(20\d{2})[.\-/](\d{2})[.\-/](\d{2})", "%Y%m%d"),
    # DD-MM-YYYY or DD.MM.YYYY or DD/MM/YYYY
    (r"(\d{2})[.\-/](\d{2})[.\-/](20\d{2})", "%d%m%Y"),
    # DD-MM-YY
    (r"(\d{2})[.\-/](\d{2})[.\-/](\d{2})\b", "%d%m%y"),
]

# Price pattern for total lines (handles OCR spaces around separator)
PRICE_TOTAL_RE = re.compile(r"(\d+)\s*[,.]\s*(\d{2})")
# Price pattern anywhere in line
PRICE_ANYWHERE_RE = re.compile(r"(\d+)[,.](\d{2})")

# Lines to skip in fallback price detection
SKIP_PATTERNS = [
    r"^NIP\b", r"^PARAGON\b", r"^FISKALNY\b", r"^KASA\b", r"#Kasa\b",
    r"^KASJER\b", r"Kasjer\b", r"^SPRZ", r"^DATA\b", r"^\d{2}[:\-]\d{2}",
    r"PTU\b", r"VAT\b", r"^RABAT\b", r"^OPUST\b",
    r"^RESZTA\b", r"GOT[ÓOÔÖ]WK[AĄ]", r"^KARTA\b", r"^VISA\b",
    r"^MASTERCARD\b", r"ZMIANA\b",
    r"^WYDRUK\b", r"DZIE[ŃN]KUJE", r"ZAPRASZAMY",
    r"^-+$", r"^=+$", r"^\*+$", r"^#{2,}",
    r"OPUSTY\s*[ŁL]", r"^[SŚ]p[:\s]", r"^Promocj",
    r"ROZLICZENIE", r"Nr\s+transakcji", r"^Numer\b",
    r"UDZIELONO", r"Udz\w*\s+[łlŁL]", r"^Udz\b", r"^MOJE\s", r"OSZCZ[ĘE]DNO",
    r"^NIEFISKALNY", r"nr:\s*\d", r"sys\.\s*\d",
    r"^\d{10,}",  # long number sequences (barcodes, NIP values)
    r"[A-Z]\d{1,2}[=xX]\s*\d",  # VAT summary lines
    r"SUMA\s*PTU",
    r"^RESZTA\s+GOT", r"PLN\s*$",
    r"RABAT[ÓO]W", r"[łlŁL][aą]cznie\s+rabat",
    r"cznie\s+rabat",
    r"^[A-Z][=:]\s*\d",  # "A=12,92" VAT subtotals
    r"^\d+[,.]\d{2}\s*$",  # standalone price
    r"^[0O]PUST\b",
    r"OPODATKOWAN",
    r"^DO\s*ZAP[ŁL]ATY",
    r"Kwota\s+[A-Z]\s+\d",  # VAT rate breakdown: "Kwota A 23,00%"
    r"Podatek\b",
    r"\d+\s*[xX×]\s*\d",  # quantity × price (product lines)
    r"\d+[,.]\d{2}[A-Z]$",  # price ending with VAT category letter (7,50C)
    r"CHLEB|MLEKO|MASŁO|CUKIER|MĄKA|SER\b|WĘDL",  # common product names
]


def parse_receipt(raw_text: str) -> dict:
    """Parse OCR text into structured receipt data.

    Extracts store, date, total only (no individual items).
    Always returns a result dict — never raises.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    # DEBUG: log all lines for diagnosis
    logger.info(f"Receipt OCR raw lines ({len(lines)}):")
    for i, line in enumerate(lines):
        logger.info(f"  [{i:2d}] {line!r}")

    store_name = _detect_store(lines)
    date = _detect_date(raw_text)
    total = _detect_total(lines)

    # Fallback 1: payment math (GOTÓWKA - RESZTA)
    if total is None:
        total = _detect_total_from_payment(lines)
        if total is not None:
            logger.info(f"Receipt parser: total from payment math: {total}")

    # Fallback 2: largest price on non-skip lines
    if total is None:
        total = _fallback_largest_price(lines)
        if total is not None:
            logger.info(f"Receipt parser: total fallback to largest price: {total}")

    # Suggest expense category based on store name
    suggested_category = _suggest_category(store_name)

    # Compute confidence
    confidence = _compute_confidence(store_name, date, total, raw_text)

    logger.info(
        f"Receipt parser: store={store_name}, date={date}, total={total}, "
        f"confidence={confidence}, suggested_category={suggested_category}, "
        f"lines={len(lines)}"
    )

    return {
        "store_name": store_name,
        "date": date,
        "total": total,
        "raw_text": raw_text,
        "confidence": confidence,
        "suggested_category": suggested_category,
    }


def _compute_confidence(
    store_name: str | None,
    date: str | None,
    total: float | None,
    raw_text: str,
) -> str:
    """Rate the overall parse quality."""
    score = 0
    if store_name:
        score += 1
    if date:
        score += 1
    if total is not None and total > 0:
        score += 2  # total is the most important field

    if len(raw_text.strip()) < 20:
        return "none"

    if score >= 3:
        return "good"
    if score >= 2:
        return "partial"
    if score >= 1:
        return "weak"
    return "none"


def _normalize_pl(text: str) -> str:
    """Strip Polish diacritics for fuzzy matching."""
    table = str.maketrans("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ", "acelnoszzACELNOSZZ")
    return text.translate(table)


def _detect_store(lines: list[str]) -> str | None:
    """Detect store name from receipt text.

    First looks for known stores in the header area. Then falls back to
    heuristic detection, anchoring on PARAGON FISKALNY to skip background noise.
    """
    # Find the header area: everything before "PARAGON FISKALNY" (or first 10 lines)
    header_end = min(10, len(lines))
    for i, line in enumerate(lines[:20]):
        if re.search(r"PARAGON|FISKALNY", line, re.IGNORECASE):
            header_end = i
            break

    # Use lines before PARAGON FISKALNY for store detection (skip noise)
    header_lines = lines[:max(header_end, 3)]
    full_text_upper = " ".join(header_lines).upper()
    full_text_norm = _normalize_pl(full_text_upper)

    # Check known stores
    seen = set()
    for store in KNOWN_STORES:
        key = store.upper()
        if key in seen:
            continue
        seen.add(key)
        if key in full_text_upper:
            return store
        if _normalize_pl(key) in full_text_norm:
            return store

    # Also check known stores in lines right after PARAGON FISKALNY header
    # (some receipts put store name after the header)
    extended_upper = " ".join(lines[:min(header_end + 3, len(lines))]).upper()
    extended_norm = _normalize_pl(extended_upper)
    for store in KNOWN_STORES:
        key = store.upper()
        if key in extended_upper or _normalize_pl(key) in extended_norm:
            return store

    # Fallback: heuristic for unknown stores (only search header area)
    _store_skip_re = re.compile(
        r"Sp\.\s*z\s*o\.?\s*o\.?|S\.A\.|s\.c\.|S\.K\.A\.|D\.I\.P\."
        r"|^ul\.|^al\.|^\d{2}-\d{3}"
        r"|NIP|PARAGON|FISKALNY",
        re.IGNORECASE,
    )
    _store_prefer_re = re.compile(
        r"Sklep|Market|Apteka|Restauracja|Kawiarnia|Przychodnia|Stacja",
        re.IGNORECASE,
    )
    # Noise filter: lines with too many punctuation/symbols are OCR garbage
    _noise_re = re.compile(r"^[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]*$")

    candidates = []
    for line in header_lines:
        cleaned = line.strip()
        if len(cleaned) < 3 or len(cleaned) > 40:
            continue
        if re.match(r"^[\d\s\-=*#.]+$", cleaned):
            continue
        if _store_skip_re.search(cleaned):
            continue
        if _noise_re.match(cleaned):
            continue
        if sum(c.isdigit() for c in cleaned) > len(cleaned) * 0.6:
            continue
        # Skip lines that are mostly punctuation/symbols (OCR garbage from backgrounds)
        alpha_count = sum(c.isalpha() for c in cleaned)
        if alpha_count < len(cleaned) * 0.4:
            continue
        candidates.append(cleaned)

    for c in candidates:
        if _store_prefer_re.search(c):
            return c

    if candidates:
        return candidates[0]

    return None


def _detect_date(text: str) -> str | None:
    """Detect date from receipt text."""
    for pattern, fmt in DATE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            groups = match.groups()
            date_str = "".join(groups)
            try:
                parsed = datetime.strptime(date_str, fmt)
                if 2020 <= parsed.year <= 2030:
                    return parsed.strftime("%Y-%m-%d")
            except ValueError:
                continue
    return None


def _detect_total(lines: list[str]) -> float | None:
    """Detect total amount from receipt using keyword matching.

    Strategy:
    1. Full-text direct extraction (handles OCR line-break garbles)
    2. Line-by-line high-priority keyword matching
    3. Line-by-line low-priority fallback (WPŁATA etc.)
    """
    full_text = "\n".join(lines)

    # ── PASS 0: Direct full-text extraction ──────────────────────────
    direct_patterns = [
        r"SU[MNH]A\s*PLN\s*:?\s*(\d+)\s*[,.]\s*(\d{2})",
        r"RAZEM\s*:?\s*(\d+)\s*[,.]\s*(\d{2})",
        r"DO\s*ZAP[ŁL]ATY\s*:?\s*(\d+)\s*[,.]\s*(\d{2})",
        r"SU[MNH]A\s*[:\s]\s*(\d+)\s*[,.]\s*(\d{2})",
    ]
    vat_context_re = re.compile(
        r"SUMA\s*PTU|PTU\s*=|SPRZEDA[ŻZ]\s+OPODATKOWANA|^[SŚ]p[:\s]",
        re.IGNORECASE,
    )

    for pat in direct_patterns:
        for m in re.finditer(pat, full_text, re.IGNORECASE):
            matched_text = m.group(0).upper()
            if "PTU" in matched_text or "OPODATKOWANA" in matched_text:
                continue
            value = float(f"{m.group(1)}.{m.group(2)}")
            if 0 < value < 50000:
                logger.info(f"Receipt total: direct extraction found {value} via '{pat}'")
                return value

    # ── PASS 1+2: Line-by-line keyword matching ─────────────────────
    high_priority = [
        r"SUMA\s+PLN", r"SUMA\b[:\s]", r"RAZEM\b", r"DO\s*ZAP[ŁL]ATY",
        r"[ŁL]([AĄ])CZNA", r"WARTO[ŚS][ĆC]\s*BRUTTO",
        r"SPRZEDA[ŻZ]\s*BRUTTO", r"NALE[ŻZ]NO[ŚS][ĆC]",
        r"SUNA\b", r"RAZEN\b", r"SUflA\b", r"SUHA\b", r"SU[MN]A\b",
        r"SUfl[AĄ]\b", r"SUNIA\b",
    ]
    low_priority = [
        r"WP[ŁL]ATA\b",
    ]
    exclude_patterns = [
        r"GOT[ÓOÔÖ]WK[AĄ]", r"RESZTA", r"KARTA\b", r"VISA\b",
        r"MASTERCARD\b", r"SUMA\s*PTU",
        r"SPRZEDA[ŻZ]\s+OPODATKOWANA",
        r"^[SŚ]p[:\s]",
        r"[A-Z][=:]\s*\d",
        r"KWOTA\s+PTU",
        r"KWOTA\s+[A-Z]\s+\d",
        r"PTU\s+[A-Z]\s+\d",
        r"PODATEK\s+PTU",
    ]
    exclude_re = re.compile("|".join(exclude_patterns), re.IGNORECASE)

    def _find_total_in_lines(patterns, first_match=False):
        best = None
        pattern = "|".join(patterns)
        for i, line in enumerate(lines):
            upper = line.upper()
            if exclude_re.search(upper):
                continue
            if re.search(pattern, upper, re.IGNORECASE):
                prices = PRICE_TOTAL_RE.findall(line)
                if prices:
                    whole, decimal = prices[-1]
                    value = float(f"{whole}.{decimal}")
                    if 0 < value < 50000:
                        if first_match:
                            return value
                        if best is None or value > best:
                            best = value
                elif i + 1 < len(lines):
                    prices = PRICE_TOTAL_RE.findall(lines[i + 1])
                    if prices:
                        whole, decimal = prices[-1]
                        value = float(f"{whole}.{decimal}")
                        if 0 < value < 50000:
                            if first_match:
                                return value
                            if best is None or value > best:
                                best = value
        return best

    total = _find_total_in_lines(high_priority, first_match=True)
    if total is not None:
        return total

    return _find_total_in_lines(low_priority)


def _detect_total_from_payment(lines: list[str]) -> float | None:
    """Compute total from payment lines: GOTÓWKA - RESZTA or KARTA amount.

    Common on Polish receipts when SUMA line is garbled by OCR.
    """
    payment_re = re.compile(
        r"GOT[ÓOÔÖ]WK[AĄ]|KARTA\b|VISA\b|MASTERCARD\b",
        re.IGNORECASE,
    )
    change_re = re.compile(r"RESZTA", re.IGNORECASE)

    payment_amount = None
    change_amount = None

    for line in lines:
        prices = PRICE_ANYWHERE_RE.findall(line)
        if not prices:
            continue

        upper = line.upper()

        if change_re.search(upper):
            # Take the first price on RESZTA line
            whole, decimal = prices[0]
            val = float(f"{whole}.{decimal}")
            if 0 < val < 50000:
                change_amount = val
        elif payment_re.search(upper):
            # Take the first price on payment line
            whole, decimal = prices[0]
            val = float(f"{whole}.{decimal}")
            if 0 < val < 50000:
                payment_amount = val

    if payment_amount is not None and change_amount is not None:
        total = round(payment_amount - change_amount, 2)
        if total > 0:
            logger.info(
                f"Receipt payment math: {payment_amount} - {change_amount} = {total}"
            )
            return total

    # Card payment (no change) — use card amount directly
    # But only if it's a reasonable amount (not a garbled number)
    if payment_amount is not None and change_amount is None:
        # Check if any line explicitly says KARTA (card = exact amount, no change)
        for line in lines:
            if re.search(r"KARTA\b|VISA\b|MASTERCARD\b", line, re.IGNORECASE):
                logger.info(f"Receipt payment: card payment {payment_amount}")
                return payment_amount

    return None


def _fallback_largest_price(lines: list[str]) -> float | None:
    """Last-resort fallback: find the largest price on any line."""
    skip_re = re.compile("|".join(SKIP_PATTERNS), re.IGNORECASE)
    all_prices = []

    for line in lines:
        if skip_re.search(line):
            continue
        prices = PRICE_ANYWHERE_RE.findall(line)
        for whole, decimal in prices:
            value = float(f"{whole}.{decimal}")
            if value >= 1.0:
                all_prices.append(value)

    if not all_prices:
        return None

    largest = max(all_prices)
    if largest > 50000:
        return None

    return largest


# ─── Category suggestion ─────────────────────────────────────────────

STORE_CATEGORY_MAP = {
    "Biedronka": "Jedzenie", "Lidl": "Jedzenie", "Kaufland": "Jedzenie",
    "Auchan": "Jedzenie", "Carrefour": "Jedzenie", "Tesco": "Jedzenie",
    "Netto": "Jedzenie", "Dino": "Jedzenie", "Stokrotka": "Jedzenie",
    "Lewiatan": "Jedzenie", "Polo Market": "Jedzenie", "Polomarket": "Jedzenie",
    "Intermarche": "Jedzenie", "Delikatesy Centrum": "Jedzenie",
    "Freshmarket": "Jedzenie", "Mila": "Jedzenie",
    "Żabka": "Jedzenie", "Zabka": "Jedzenie",
    "Aldi": "Jedzenie", "Makro": "Jedzenie", "Selgros": "Jedzenie",
    "Spar": "Jedzenie", "ABC": "Jedzenie", "Groszek": "Jedzenie",
    "Duży Ben": "Jedzenie", "Topaz": "Jedzenie",
    "Rossmann": "Zdrowie", "Hebe": "Zdrowie",
    "Orlen": "Transport", "BP": "Transport", "Shell": "Transport",
    "Circle K": "Transport",
    "Castorama": "Dom", "Leroy Merlin": "Dom", "IKEA": "Dom",
    "Jysk": "Dom", "Action": "Dom",
    "Media Expert": "Dom", "Media Markt": "Dom", "RTV Euro AGD": "Dom",
    "Reserved": "Ubrania", "H&M": "Ubrania", "Zara": "Ubrania",
    "CCC": "Ubrania", "Pepco": "Ubrania",
    "Empik": "Rozrywka",
    "Starbucks": "Jedzenie", "Costa Coffee": "Jedzenie",
    "McDonald's": "Jedzenie", "KFC": "Jedzenie", "Burger King": "Jedzenie",
    "Subway": "Jedzenie", "Pizza Hut": "Jedzenie", "Domino's": "Jedzenie",
    "Żappka": "Jedzenie",
}


def _suggest_category(store_name: str | None) -> str | None:
    """Suggest an expense category based on store name."""
    if not store_name:
        return None

    for known_store, category in STORE_CATEGORY_MAP.items():
        if known_store.upper() == store_name.upper():
            return category

    store_upper = store_name.upper()
    for known_store, category in STORE_CATEGORY_MAP.items():
        if known_store.upper() in store_upper:
            return category

    return None
