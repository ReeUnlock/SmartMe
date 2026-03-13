from pydantic import BaseModel
from typing import Optional


class ReceiptItem(BaseModel):
    name: str
    price: float


class ReceiptScanResult(BaseModel):
    store_name: Optional[str] = None
    date: Optional[str] = None
    total: Optional[float] = None
    items: list[ReceiptItem] = []
    raw_text: str
    confidence: str = "none"  # "good", "partial", "weak", "none"
