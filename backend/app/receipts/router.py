import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.receipts.schemas import ReceiptScanResult
from app.receipts.service import process_image
from app.receipts.parser import parse_receipt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/receipts", tags=["receipts"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/scan", response_model=ReceiptScanResult)
async def scan_receipt(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a receipt image, run OCR, and return parsed data."""
    # Validate content type
    content_type = (image.content_type or "").lower()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nieobsługiwany format pliku. Dozwolone: JPEG, PNG, WebP, HEIC.",
        )

    # Read and validate size
    file_bytes = await image.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Plik jest za duży. Maksymalny rozmiar to 10 MB.",
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Przesłany plik jest pusty.",
        )

    # OCR
    try:
        raw_text = process_image(file_bytes)
    except Exception as e:
        logger.error(f"OCR failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nie udało się odczytać tekstu z obrazu. Spróbuj zrobić wyraźniejsze zdjęcie.",
        )

    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nie znaleziono tekstu na obrazie. Upewnij się, że paragon jest dobrze widoczny.",
        )

    # Parse
    result = parse_receipt(raw_text)
    return ReceiptScanResult(**result)
