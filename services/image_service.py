# ============================================================
# HealthTriage AI - Image Service
# Safe validation, preprocessing, and encoding of medical images
# ============================================================

import io
import base64
from typing import Optional, Tuple
from PIL import Image

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB


def validate_image_bytes(data: bytes) -> Tuple[bool, Optional[str]]:
    """
    Validate that bytes represent a valid, readable image within limits.
    Returns (is_valid, error_message).
    """
    if not data:
        return False, "Image payload is empty."

    if len(data) > MAX_IMAGE_SIZE_BYTES:
        return False, f"Image size exceeds maximum limit of {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)}MB."

    try:
        with Image.open(io.BytesIO(data)) as img:
            img.verify()
        return True, None
    except Exception:
        return False, "Invalid or corrupted image format."


def process_image_for_ai(data: bytes, max_dim: int = 1600) -> bytes:
    """
    Ensure the image is in RGB format and reasonably sized for AI analysis.
    """
    with Image.open(io.BytesIO(data)) as img:
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")

        # Resize if dimensions exceed max_dim while preserving aspect ratio
        if max(img.width, img.height) > max_dim:
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        out_buffer = io.BytesIO()
        img.save(out_buffer, format="JPEG", quality=88)
        return out_buffer.getvalue()
