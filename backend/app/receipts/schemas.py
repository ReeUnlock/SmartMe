from pydantic import BaseModel
from typing import Optional


class ReceiptScanResult(BaseModel):
    store_name: Optional[str] = None
    date: Optional[str] = None
    total: Optional[float] = None
    raw_text: str
    confidence: str = "none"  # "good", "partial", "weak", "none"
    suggested_category: Optional[str] = None  # expense category name suggestion
