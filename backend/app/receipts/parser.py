"""Heuristic-based parser for Polish receipt OCR text."""

import re
from datetime import datetime


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
# Price pattern anywhere in line (for item matching)
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
    """Parse OCR text into structured receipt data."""
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    store_name = _detect_store(lines)
    date = _detect_date(raw_text)
    total = _detect_total(lines)
    items = _detect_items(lines, total)

    return {
        "store_name": store_name,
        "date": date,
        "total": total,
        "items": items,
        "raw_text": raw_text,
    }


def _detect_store(lines: list[str]) -> str | None:
    """Detect store name from receipt text."""
    full_text_upper = " ".join(lines[:10]).upper()

    # Check known stores
    for store in KNOWN_STORES:
        if store.upper() in full_text_upper:
            return store

    # Fallback: first non-trivial line that looks like a name
    for line in lines[:5]:
        cleaned = line.strip()
        # Skip short lines, numbers-only, dashes, etc.
        if len(cleaned) < 3:
            continue
        if re.match(r"^[\d\s\-=*#.]+$", cleaned):
            continue
        if re.match(r"^NIP\b", cleaned, re.IGNORECASE):
            continue
        # Looks like a store name
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
                # Sanity check: year between 2020 and 2030
                if 2020 <= parsed.year <= 2030:
                    return parsed.strftime("%Y-%m-%d")
            except ValueError:
                continue
    return None


def _detect_total(lines: list[str]) -> float | None:
    """Detect total amount from receipt."""
    total_pattern = "|".join(TOTAL_KEYWORDS)
    best_total = None

    for line in lines:
        upper = line.upper()
        if re.search(total_pattern, upper, re.IGNORECASE):
            # Find price in this line
            prices = PRICE_ANYWHERE_RE.findall(line)
            if prices:
                # Take the last price on the total line
                whole, decimal = prices[-1]
                value = float(f"{whole}.{decimal}")
                if value > 0:
                    # Prefer the largest total found (handles subtotals)
                    if best_total is None or value > best_total:
                        best_total = value

    return best_total


def _detect_items(lines: list[str], total: float | None) -> list[dict]:
    """Detect individual items from receipt lines."""
    items = []
    skip_re = re.compile("|".join(SKIP_PATTERNS), re.IGNORECASE)
    total_re = re.compile("|".join(TOTAL_KEYWORDS), re.IGNORECASE)

    for line in lines:
        # Skip non-item lines
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

            # Skip if price equals total (it's the total line, not an item)
            if total and abs(price - total) < 0.01:
                continue

            # Clean up item name
            name = QTY_PREFIX_RE.sub("", name).strip()
            name = re.sub(r"\s+", " ", name)

            # Skip if name is too short or looks like metadata
            if len(name) < 2:
                continue
            if re.match(r"^[A-Z]{1,3}\d*$", name):
                continue

            if price > 0:
                items.append({"name": name, "price": price})

    return items
