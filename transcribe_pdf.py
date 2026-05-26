#!/usr/bin/env python3
"""
Transcribe a scanned PDF document using OCR (tesserocr + PyMuPDF).

This script converts each page of a scanned PDF to a high-resolution image,
performs OCR using tesserocr (which uses libtesseract directly), and outputs
the transcribed text to a .txt file.

Usage:
    python3 transcribe_pdf.py [path_to_pdf]

If no path is given, defaults to:
    CamScanner 05-26-2026 14.25.pdf
"""

import sys
import io
import os
import time

import fitz  # PyMuPDF
from PIL import Image, ImageFilter, ImageEnhance
import tesserocr


# ── Configuration ──────────────────────────────────────────────────────────
TESSDATA_DIR = "/usr/share/tesseract/tessdata"
LANG = "eng"
DPI = 300  # 300 DPI gives good OCR quality for scanned docs


def preprocess_image(img: Image.Image) -> Image.Image:
    """
    Apply preprocessing to improve OCR accuracy on scanned documents.
    - Convert to grayscale
    - Enhance contrast
    - Sharpen slightly
    """
    # Convert to grayscale
    img = img.convert("L")

    # Enhance contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.5)

    # Sharpen
    img = img.filter(ImageFilter.SHARPEN)

    # Convert back to RGB (tesserocr works best with RGB)
    img = img.convert("RGB")

    return img


def transcribe_page(page: fitz.Page, page_num: int) -> str:
    """Render a PDF page to an image and OCR it."""
    # Render at high DPI
    mat = fitz.Matrix(DPI / 72, DPI / 72)
    pix = page.get_pixmap(matrix=mat)
    img = Image.open(io.BytesIO(pix.tobytes("png")))

    # Preprocess for better OCR
    img = preprocess_image(img)

    # OCR
    text = tesserocr.image_to_text(img, path=TESSDATA_DIR, lang=LANG)

    return text


def transcribe_pdf(pdf_path: str, output_path: str | None = None) -> str:
    """
    Transcribe all pages of a scanned PDF.

    Args:
        pdf_path: Path to the PDF file.
        output_path: Path to save the output text file.
                     Defaults to <pdf_basename>.txt in the same directory.

    Returns:
        The full transcribed text.
    """
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)

    if output_path is None:
        base = os.path.splitext(pdf_path)[0]
        output_path = f"{base}_transcription.txt"

    print(f"📄 Opening: {pdf_path}")
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    print(f"📑 Total pages: {total_pages}")
    print(f"🔍 OCR engine: tesseract {tesserocr.tesseract_version().split(chr(10))[0]}")
    print(f"🖼️  Render DPI: {DPI}")
    print()

    full_text = []
    start_time = time.time()

    for i, page in enumerate(doc):
        page_num = i + 1
        print(f"  Processing page {page_num}/{total_pages}...", end=" ", flush=True)
        page_start = time.time()

        text = transcribe_page(page, page_num)

        elapsed = time.time() - page_start
        word_count = len(text.split())
        print(f"✅ ({word_count} words, {elapsed:.1f}s)")

        full_text.append(f"{'='*72}")
        full_text.append(f"  PAGE {page_num}")
        full_text.append(f"{'='*72}")
        full_text.append("")
        full_text.append(text.strip())
        full_text.append("")
        full_text.append("")

    doc.close()
    total_elapsed = time.time() - start_time

    result = "\n".join(full_text)

    # Write output
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(result)

    total_words = len(result.split())
    print()
    print(f"✅ Transcription complete!")
    print(f"   Total words: {total_words}")
    print(f"   Total time:  {total_elapsed:.1f}s")
    print(f"   Output:      {output_path}")

    return result


if __name__ == "__main__":
    if len(sys.argv) > 1:
        pdf_file = sys.argv[1]
    else:
        pdf_file = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "CamScanner 05-26-2026 14.25.pdf",
        )

    transcribe_pdf(pdf_file)
