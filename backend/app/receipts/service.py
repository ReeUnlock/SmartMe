"""OCR service: image → text using Tesseract."""

import io
import logging
import re
import shutil

import cv2
import numpy as np
import pytesseract
from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

MAX_DIMENSION = 2000  # px — resize large images before OCR

# Keywords that indicate the OCR captured the total line (used for dual-pass decision)
_TOTAL_KEYWORDS_RE = re.compile(
    r"SU[MNH]A\s*PLN|RAZEM|DO\s*ZAP[ŁL]ATY|WARTO[ŚS][ĆC]\s*BRUTTO",
    re.IGNORECASE,
)


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


def _auto_crop_receipt(img_np: np.ndarray) -> np.ndarray:
    """Detect and crop the receipt rectangle from the image.

    Uses edge detection + contour finding to isolate the white receipt
    from a textured/colored background. Falls back to the original image
    if no clear receipt boundary is found.
    """
    h, w = img_np.shape[:2]
    original_area = h * w

    try:
        # Blur to reduce noise, then edge detection
        blurred = cv2.GaussianBlur(img_np, (5, 5), 0)
        edges = cv2.Canny(blurred, 30, 120)

        # Dilate edges to close gaps in receipt border
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        edges = cv2.dilate(edges, kernel, iterations=2)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return img_np

        # Find the largest contour
        largest = max(contours, key=cv2.contourArea)
        contour_area = cv2.contourArea(largest)

        # Only crop if the contour is between 15% and 90% of image area
        # (too small = noise, too large = receipt fills image already)
        ratio = contour_area / original_area
        if ratio < 0.15 or ratio > 0.90:
            logger.info(f"OCR auto-crop: skipped (contour ratio {ratio:.2f})")
            return img_np

        x, y, cw, ch = cv2.boundingRect(largest)

        # Add small padding (2% of dimensions)
        pad_x = int(cw * 0.02)
        pad_y = int(ch * 0.02)
        x = max(0, x - pad_x)
        y = max(0, y - pad_y)
        cw = min(w - x, cw + 2 * pad_x)
        ch = min(h - y, ch + 2 * pad_y)

        cropped = img_np[y:y + ch, x:x + cw]
        logger.info(
            f"OCR auto-crop: {w}x{h} → {cw}x{ch} "
            f"(contour ratio {ratio:.2f}, offset x={x} y={y})"
        )
        return cropped

    except Exception as e:
        logger.warning(f"OCR auto-crop failed: {e}")
        return img_np


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
    gray = image.convert("L")  # grayscale
    gray = ImageOps.autocontrast(gray, cutoff=1)

    # Convert to numpy for OpenCV processing
    img_np = np.array(gray)

    # ── Auto-crop: detect receipt rectangle on background ──────────
    img_np = _auto_crop_receipt(img_np)

    # Upscale small images (Tesseract needs ~300 DPI; phone receipts often too small)
    h_px, w_px = img_np.shape[:2]
    if max(h_px, w_px) < 1500:
        scale = 2
        img_np = cv2.resize(img_np, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        logger.info(f"OCR upscaled: {w_px}x{h_px} → {img_np.shape[1]}x{img_np.shape[0]}")

    # Keep a copy before heavy preprocessing (for second pass)
    gray_np = img_np.copy()

    # ── Pass 1: Adaptive threshold (good for small item text) ────────
    img_pass1 = cv2.fastNlMeansDenoising(img_np, h=12)
    img_pass1 = cv2.adaptiveThreshold(
        img_pass1, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=10,
    )

    text1 = _run_tesseract(Image.fromarray(img_pass1), psm=4)
    logger.info(f"OCR pass 1 (adaptive): {len(text1.strip())} chars")

    # ── Pass 2: Bottom-crop + light denoise (for bold total text) ────
    # Only run if pass 1 didn't capture total keywords.
    # Crop to bottom 70% (where totals live), light denoise only.
    # Since we no longer parse items, append ALL pass 2 text — the parser
    # only looks for totals so extra product lines won't cause problems.
    text2 = ""
    if not _TOTAL_KEYWORDS_RE.search(text1):
        h_img = gray_np.shape[0]
        bottom_crop = gray_np[int(h_img * 0.3):, :]  # bottom 70%
        img_pass2 = cv2.fastNlMeansDenoising(bottom_crop, h=8)

        text2 = _run_tesseract(Image.fromarray(img_pass2), psm=6)
        logger.info(f"OCR pass 2 (bottom crop, no threshold): {len(text2.strip())} chars")

    # Merge: pass 1 text + all pass 2 text
    if text2.strip():
        text = text1 + "\n" + text2
    else:
        text = text1

    char_count = len(text.strip())
    logger.info(f"OCR result: {char_count} chars extracted from {w}x{h} image")

    if char_count == 0:
        raise EmptyOCRError(
            "Nie znaleziono tekstu na obrazie. Upewnij się, że paragon jest dobrze oświetlony i wyraźny.",
            detail=f"Tesseract returned empty/whitespace-only text for {original_format} {w}x{h}",
        )

    return text


def _run_tesseract(image: Image.Image, psm: int = 4) -> str:
    """Run Tesseract OCR on a preprocessed PIL image. Returns raw text."""
    try:
        return pytesseract.image_to_string(
            image,
            lang="pol",
            config=f"--psm {psm}",
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
