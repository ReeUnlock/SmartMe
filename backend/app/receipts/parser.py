"""Heuristic-based parser for Polish receipt OCR text."""

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
]

TOTAL_KEYWORDS = [
    r"SUMA\b", r"RAZEM\b", r"DO\s*ZAP[ŁL]ATY",
    r"[ŁL]([AĄ])CZNA", r"TOTAL\b", r"KWOTA\b",
    r"WARTO[ŚS][ĆC]\s*BRUTTO", r"SPRZEDA[ŻZ]\s*BRUTTO",
    r"WP[ŁL]ATA\b", r"NALE[ŻZ]NO[ŚS][ĆC]",
    # Common OCR misreads of SUMA/RAZEM
    r"SUNA\b", r"RAZEN\b", r"SUflA\b",
]

DATE_PATTERNS = [
    # DD-MM-YYYY or DD.MM.YYYY or DD/MM/YYYY
    (r"(\d{2})[.\-/](\d{2})[.\-/](20\d{2})", "%d%m%Y"),
    # YYYY-MM-DD
    (r"(20\d{2})[.\-/](\d{2})[.\-/](\d{2})", "%Y%m%d"),
    # DD-MM-YY
    (r"(\d{2})[.\-/](\d{2})[.\-/](\d{2})\b", "%d%m%y"),
]

# Price pattern: digits with comma or dot as decimal separator
PRICE_RE = re.compile(r"(\d+)[,.](\d{2})\s*$")
# Price pattern anywhere in line (for total/item matching)
PRICE_ANYWHERE_RE = re.compile(r"(\d+)[,.](\d{2})")
# Line that looks like an item: text followed by price
ITEM_LINE_RE = re.compile(
    r"^(.+?)\s+(\d+)[,.](\d{2})\s*[A-Za-z]?\s*$"
)
# Quantity prefix: "2 x", "2x", "2 szt"
QTY_PREFIX_RE = re.compile(r"^\d+[,.]?\d*\s*[xX×\*]\s*")
# Skip lines that are clearly not items
SKIP_PATTERNS = [
    r"^NIP\b", r"^PARAGON\b", r"^FISKALNY\b", r"^KASA\b",
    r"^KASJER\b", r"^SPRZ", r"^DATA\b", r"^\d{2}[:\-]\d{2}",
    r"^PTU\b", r"^VAT\b", r"^RABAT\b", r"^OPUST\b",
    r"^RESZTA\b", r"^GOT[ÓO]WKA\b", r"^KARTA\b", r"^VISA\b",
    r"^MASTERCARD\b", r"^GOTÓWKA\b", r"ZMIANA\b",
    r"^WYDRUK\b", r"DZIE[ŃN]KUJE", r"ZAPRASZAMY",
    r"^-+$", r"^=+$", r"^\*+$", r"^#{2,}",
]


def parse_receipt(raw_text: str) -> dict:
    """Parse OCR text into structured receipt data.

    Always returns a result dict — never raises.
    Includes a 'confidence' field: 'good', 'partial', 'weak', 'none'.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    store_name = _detect_store(lines)
    date = _detect_date(raw_text)
    total = _detect_total(lines)
    items = _detect_items(lines, total)

    # Fallback: if no total found via keywords, try summing items
    if total is None and items:
        items_sum = round(sum(item["price"] for item in items), 2)
        if items_sum > 0:
            total = items_sum
            logger.info(f"Receipt parser: total estimated from item sum: {items_sum}")

    # Fallback: if still no total, find the largest price on any line
    if total is None:
        total = _fallback_largest_price(lines)
        if total is not None:
            logger.info(f"Receipt parser: total fallback to largest price: {total}")

    # Suggest expense category based on store name and items
    suggested_category = _suggest_category(store_name, items)

    # Compute confidence
    confidence = _compute_confidence(store_name, date, total, items, raw_text)

    logger.info(
        f"Receipt parser: store={store_name}, date={date}, total={total}, "
        f"items={len(items)}, confidence={confidence}, "
        f"suggested_category={suggested_category}, lines={len(lines)}"
    )

    return {
        "store_name": store_name,
        "date": date,
        "total": total,
        "items": items,
        "raw_text": raw_text,
        "confidence": confidence,
        "suggested_category": suggested_category,
    }


def _compute_confidence(
    store_name: str | None,
    date: str | None,
    total: float | None,
    items: list[dict],
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
    if len(items) >= 1:
        score += 1

    if len(raw_text.strip()) < 20:
        return "none"

    if score >= 4:
        return "good"
    if score >= 2:
        return "partial"
    if score >= 1:
        return "weak"
    return "none"


def _detect_store(lines: list[str]) -> str | None:
    """Detect store name from receipt text."""
    full_text_upper = " ".join(lines[:10]).upper()

    # Check known stores (use the first canonical match)
    seen = set()
    for store in KNOWN_STORES:
        key = store.upper()
        if key in seen:
            continue
        seen.add(key)
        if key in full_text_upper:
            return store

    # Fallback: first non-trivial line that looks like a name
    for line in lines[:5]:
        cleaned = line.strip()
        if len(cleaned) < 3:
            continue
        if re.match(r"^[\d\s\-=*#.]+$", cleaned):
            continue
        if re.match(r"^NIP\b", cleaned, re.IGNORECASE):
            continue
        # Skip lines that are mostly digits (phone numbers, NIP values)
        if sum(c.isdigit() for c in cleaned) > len(cleaned) * 0.6:
            continue
        return cleaned

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
    """Detect total amount from receipt using keyword matching."""
    total_pattern = "|".join(TOTAL_KEYWORDS)
    best_total = None

    for i, line in enumerate(lines):
        upper = line.upper()
        if re.search(total_pattern, upper, re.IGNORECASE):
            # Find price on the same line
            prices = PRICE_ANYWHERE_RE.findall(line)
            if prices:
                whole, decimal = prices[-1]
                value = float(f"{whole}.{decimal}")
                if value > 0 and (best_total is None or value > best_total):
                    best_total = value
            else:
                # Price might be on the next line (OCR line-break in total)
                if i + 1 < len(lines):
                    prices = PRICE_ANYWHERE_RE.findall(lines[i + 1])
                    if prices:
                        whole, decimal = prices[-1]
                        value = float(f"{whole}.{decimal}")
                        if value > 0 and (best_total is None or value > best_total):
                            best_total = value

    return best_total


def _fallback_largest_price(lines: list[str]) -> float | None:
    """Last-resort fallback: find the largest price on any line.

    Skips metadata lines, sub-zloty amounts, and absurdly large values.
    """
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


def _detect_items(lines: list[str], total: float | None) -> list[dict]:
    """Detect individual items from receipt lines."""
    items = []
    skip_re = re.compile("|".join(SKIP_PATTERNS), re.IGNORECASE)
    total_re = re.compile("|".join(TOTAL_KEYWORDS), re.IGNORECASE)

    for line in lines:
        if skip_re.search(line):
            continue
        if total_re.search(line.upper()):
            continue
        if len(line) < 4:
            continue

        match = ITEM_LINE_RE.match(line)
        if match:
            name = match.group(1).strip()
            whole = match.group(2)
            decimal = match.group(3)
            price = float(f"{whole}.{decimal}")

            if total and abs(price - total) < 0.01:
                continue

            name = QTY_PREFIX_RE.sub("", name).strip()
            name = re.sub(r"\s+", " ", name)

            if len(name) < 2:
                continue
            if re.match(r"^[A-Z]{1,3}\d*$", name):
                continue

            if price > 0:
                items.append({"name": name, "price": price})

    return items


# ─── Category suggestion ─────────────────────────────────────────────
# Maps store names → default expense category names (from expense_categories)
# Categories: Jedzenie, Transport, Rozrywka, Zdrowie, Dom, Ubrania, Rachunki, Edukacja, Inne

STORE_CATEGORY_MAP = {
    # Grocery / food → Jedzenie
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
    # Health / beauty → Zdrowie
    "Rossmann": "Zdrowie", "Hebe": "Zdrowie",
    # Fuel / transport → Transport
    "Orlen": "Transport", "BP": "Transport", "Shell": "Transport",
    "Circle K": "Transport",
    # Home / DIY → Dom
    "Castorama": "Dom", "Leroy Merlin": "Dom", "IKEA": "Dom",
    "Jysk": "Dom", "Action": "Dom",
    # Electronics → Dom (closest fit)
    "Media Expert": "Dom", "Media Markt": "Dom", "RTV Euro AGD": "Dom",
    # Clothing → Ubrania
    "Reserved": "Ubrania", "H&M": "Ubrania", "Zara": "Ubrania",
    "CCC": "Ubrania", "Pepco": "Ubrania",
    # Entertainment / books → Rozrywka
    "Empik": "Rozrywka",
}


def _suggest_category(
    store_name: str | None,
    items: list[dict],
) -> str | None:
    """Suggest an expense category based on store name.

    Returns the category name (matching default expense_categories)
    or None if no confident match.
    """
    if not store_name:
        return None

    # Direct store match (case-insensitive)
    for known_store, category in STORE_CATEGORY_MAP.items():
        if known_store.upper() == store_name.upper():
            return category

    # Partial match (store name contains known store)
    store_upper = store_name.upper()
    for known_store, category in STORE_CATEGORY_MAP.items():
        if known_store.upper() in store_upper:
            return category

    return None
