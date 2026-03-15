import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.receipts.schemas import ReceiptScanResult
from app.receipts.service import (
    process_image,
    OCRError,
    TesseractNotFoundError,
    LanguagePackMissingError,
    ImageFormatError,
    EmptyOCRError,
)
from app.receipts.parser import parse_receipt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/receipts", tags=["receipts"])

ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/webp",
    "image/heic", "image/heif",
    # Some mobile browsers/WebViews report generic type for camera photos
    "application/octet-stream",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# JPEG/PNG magic bytes for fallback content-type detection
_JPEG_MAGIC = b"\xff\xd8\xff"
_PNG_MAGIC = b"\x89PNG"
_WEBP_MAGIC = b"RIFF"


def _sniff_image_type(file_bytes: bytes) -> str | None:
    """Detect image type from magic bytes when MIME type is unreliable."""
    if file_bytes[:3] == _JPEG_MAGIC:
        return "image/jpeg"
    if file_bytes[:4] == _PNG_MAGIC:
        return "image/png"
    if file_bytes[:4] == _WEBP_MAGIC and file_bytes[8:12] == b"WEBP":
        return "image/webp"
    return None


@router.post("/scan", response_model=ReceiptScanResult)
async def scan_receipt(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a receipt image, run OCR, and return parsed data."""
    # Validate content type (allow generic types, verify with magic bytes later)
    content_type = (image.content_type or "").lower()
    if content_type not in ALLOWED_TYPES:
        logger.warning(f"Receipt scan: rejected content_type={content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nieobsługiwany format pliku. Dozwolone: JPEG, PNG, WebP.",
        )

    # Read and validate size
    file_bytes = await image.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Przesłany plik jest pusty.",
        )

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Plik jest za duży. Maksymalny rozmiar to 10 MB.",
        )

    # If content_type was generic/octet-stream, verify it's actually an image
    if content_type in ("application/octet-stream", ""):
        sniffed = _sniff_image_type(file_bytes)
        if sniffed:
            logger.info(f"Receipt scan: content_type={content_type} → sniffed as {sniffed}")
        else:
            logger.warning(f"Receipt scan: unrecognized file (content_type={content_type}, first bytes: {file_bytes[:8].hex()})")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nie rozpoznano formatu pliku. Spróbuj zrobić zdjęcie w formacie JPEG.",
            )

    logger.info(
        f"Receipt scan: user={current_user.id}, "
        f"content_type={content_type}, size={len(file_bytes)} bytes, "
        f"filename={image.filename}"
    )

    # OCR with specific error handling
    try:
        raw_text = process_image(file_bytes)
    except TesseractNotFoundError as e:
        logger.error(f"Receipt OCR: Tesseract not found — {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=e.message,
        )
    except LanguagePackMissingError as e:
        logger.error(f"Receipt OCR: language pack missing — {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=e.message,
        )
    except ImageFormatError as e:
        logger.warning(f"Receipt OCR: image format error — {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )
    except EmptyOCRError as e:
        logger.info(f"Receipt OCR: empty result — {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except OCRError as e:
        logger.error(f"Receipt OCR: generic OCR error — {e.detail}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )
    except Exception as e:
        logger.error(f"Receipt OCR: unexpected error — {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Wystąpił nieoczekiwany błąd podczas skanowania. Spróbuj ponownie.",
        )

    # Parse — always returns a result, never throws for partial data
    result = parse_receipt(raw_text)

    logger.info(
        f"Receipt parsed: store={result.get('store_name')}, "
        f"date={result.get('date')}, total={result.get('total')}, "
        f"confidence={result.get('confidence', 'unknown')}"
    )

    # Increment receipt scans counter
    current_user.receipt_scans_total = (current_user.receipt_scans_total or 0) + 1
    db.commit()

    return ReceiptScanResult(**result)
