"""OCR service: image → text using Tesseract."""

import io
import logging
import shutil

import pytesseract
from PIL import Image, ImageFilter, ImageOps

logger = logging.getLogger(__name__)

MAX_DIMENSION = 2000  # px — resize large images before OCR


class OCRError(Exception):
    """Base class for OCR-related errors with user-facing messages."""

    def __init__(self, message: str, detail: str = ""):
        self.message = message  # user-facing (Polish)
        self.detail = detail  # technical detail for logs
        super().__init__(message)


class TesseractNotFoundError(OCRError):
    pass


class LanguagePackMissingError(OCRError):
    pass


class ImageFormatError(OCRError):
    pass


class EmptyOCRError(OCRError):
    pass


def check_tesseract_available() -> None:
    """Verify Tesseract binary and Polish language pack are available."""
    if not shutil.which("tesseract"):
        raise TesseractNotFoundError(
            "Skanowanie paragonów jest tymczasowo niedostępne (brak silnika OCR).",
            detail="tesseract binary not found in PATH",
        )

    try:
        langs = pytesseract.get_languages()
    except Exception as e:
        raise TesseractNotFoundError(
            "Skanowanie paragonów jest tymczasowo niedostępne (błąd silnika OCR).",
            detail=f"pytesseract.get_languages() failed: {e}",
        )

    if "pol" not in langs:
        raise LanguagePackMissingError(
            "Skanowanie paragonów jest tymczasowo niedostępne (brak pakietu języka polskiego).",
            detail=f"'pol' not in available langs: {langs}",
        )


def process_image(file_bytes: bytes) -> str:
    """Run Tesseract OCR on image bytes. Returns raw text.

    Raises specific OCRError subclasses for diagnosable failures.
    """
    # Pre-check: Tesseract available?
    check_tesseract_available()

    # Load image
    try:
        image = Image.open(io.BytesIO(file_bytes))
    except Exception as e:
        raise ImageFormatError(
            "Nie udało się otworzyć obrazu. Spróbuj inny format (JPEG lub PNG).",
            detail=f"PIL.Image.open failed: {e}",
        )

    original_format = image.format or "unknown"
    logger.info(
        f"OCR input: format={original_format}, mode={image.mode}, "
        f"size={image.size[0]}x{image.size[1]}, bytes={len(file_bytes)}"
    )

    # Convert to RGB if needed (drop alpha channel)
    if image.mode in ("RGBA", "P", "LA"):
        image = image.convert("RGB")
    elif image.mode not in ("RGB", "L"):
        try:
            image = image.convert("RGB")
        except Exception as e:
            raise ImageFormatError(
                "Nieobsługiwany format obrazu. Spróbuj JPEG lub PNG.",
                detail=f"Cannot convert mode {image.mode} to RGB: {e}",
            )

    # Auto-orient based on EXIF (phone photos are often rotated)
    try:
        image = ImageOps.exif_transpose(image)
    except Exception:
        pass  # non-critical — proceed without rotation fix

    # Resize if too large
    w, h = image.size
    if max(w, h) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(w, h)
        image = image.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
        logger.info(f"OCR resized: {w}x{h} → {image.size[0]}x{image.size[1]}")

    # Preprocessing for better OCR
    image = image.convert("L")  # grayscale
    image = ImageOps.autocontrast(image, cutoff=1)
    image = image.filter(ImageFilter.SHARPEN)

    # Run Tesseract with Polish language
    try:
        text = pytesseract.image_to_string(
            image,
            lang="pol",
            config="--psm 6",  # assume uniform block of text
        )
    except pytesseract.TesseractNotFoundError:
        raise TesseractNotFoundError(
            "Skanowanie paragonów jest tymczasowo niedostępne (brak silnika OCR).",
            detail="pytesseract.TesseractNotFoundError during image_to_string",
        )
    except Exception as e:
        error_msg = str(e).lower()
        if "pol" in error_msg and ("not" in error_msg or "failed" in error_msg):
            raise LanguagePackMissingError(
                "Skanowanie paragonów jest tymczasowo niedostępne (brak pakietu języka polskiego).",
                detail=f"Tesseract language error: {e}",
            )
        raise OCRError(
            "Nie udało się odczytać tekstu z obrazu. Spróbuj zrobić wyraźniejsze zdjęcie.",
            detail=f"Tesseract failed: {e}",
        )

    char_count = len(text.strip())
    logger.info(f"OCR result: {char_count} chars extracted from {w}x{h} image")

    if char_count == 0:
        raise EmptyOCRError(
            "Nie znaleziono tekstu na obrazie. Upewnij się, że paragon jest dobrze oświetlony i wyraźny.",
            detail=f"Tesseract returned empty/whitespace-only text for {original_format} {w}x{h}",
        )

    return text
