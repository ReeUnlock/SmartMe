"""OCR service: image → text using Tesseract."""

import io
import logging

import pytesseract
from PIL import Image, ImageFilter, ImageOps

logger = logging.getLogger(__name__)

MAX_DIMENSION = 2000  # px — resize large images before OCR


def process_image(file_bytes: bytes) -> str:
    """Run Tesseract OCR on image bytes. Returns raw text."""
    image = Image.open(io.BytesIO(file_bytes))

    # Convert to RGB if needed (drop alpha channel)
    if image.mode in ("RGBA", "P", "LA"):
        image = image.convert("RGB")

    # Auto-orient based on EXIF (phone photos are often rotated)
    image = ImageOps.exif_transpose(image)

    # Resize if too large
    w, h = image.size
    if max(w, h) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(w, h)
        image = image.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

    # Preprocessing for better OCR
    image = image.convert("L")  # grayscale
    image = ImageOps.autocontrast(image, cutoff=1)
    image = image.filter(ImageFilter.SHARPEN)

    # Run Tesseract with Polish language
    text = pytesseract.image_to_string(
        image,
        lang="pol",
        config="--psm 6",  # assume uniform block of text
    )

    logger.info(f"OCR extracted {len(text)} chars from image ({w}x{h})")
    return text
