"""
test_tier2_boundary_corner.py - Tier 2: Boundary, Structural & Corner Case Tests
Validates PDF binary integrity, file size limits, page counts, optical geometry,
absence of broken image placeholders, and complete text stream sanitization.
"""
import unittest
import os
import re
import PyPDF2
from tests.conftest import get_inspector

class TestTier2BoundaryCorner(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.inspector = get_inspector()

    # -------------------------------------------------------------------------
    # 1. PDF Binary & File System Integrity
    # -------------------------------------------------------------------------
    def test_pdf_file_exists_and_readable(self):
        """Verifies the target PDF deliverable exists on disk and is readable."""
        self.assertTrue(os.path.exists(self.inspector.pdf_path), f"PDF file not found: {self.inspector.pdf_path}")
        self.assertGreater(self.inspector.file_size_bytes, 0, "PDF file is 0 bytes")

    def test_pdf_magic_header(self):
        """Verifies the file starts with the standard PDF magic header (%PDF-1.x)."""
        with open(self.inspector.pdf_path, 'rb') as f:
            header = f.read(8)
            self.assertTrue(header.startswith(b'%PDF-'), f"Invalid PDF magic header: {header!r}")

    def test_pdf_structural_parsing_no_exceptions(self):
        """Verifies PyPDF2 parses every page and its contents without corruption exceptions."""
        try:
            reader = PyPDF2.PdfReader(self.inspector.pdf_path)
            for i, page in enumerate(reader.pages):
                _ = page.extract_text()
                _ = page.mediabox
        except Exception as e:
            self.fail(f"PDF parsing encountered corruption exception: {e}")

    # -------------------------------------------------------------------------
    # 2. Volume & Boundary Limits
    # -------------------------------------------------------------------------
    def test_minimum_page_count_boundary(self):
        """Verifies document meets the publication threshold of at least 20 pages."""
        self.assertGreaterEqual(
            self.inspector.page_count, 20,
            f"Deliverable has {self.inspector.page_count} pages, which is less than the required minimum of 20 pages"
        )

    def test_minimum_file_size_boundary(self):
        """Verifies document file size >= 2.0 MB (2,000,000 bytes) indicating high-res figures."""
        min_bytes = 2_000_000
        self.assertGreaterEqual(
            self.inspector.file_size_bytes, min_bytes,
            f"PDF file size {self.inspector.file_size_bytes:,} bytes is below required 2,000,000 bytes (2 MB)"
        )

    def test_total_text_content_volume(self):
        """Verifies document contains substantial human-written text (>= 15,000 characters)."""
        full_text = self.inspector.get_full_text()
        self.assertGreater(
            len(full_text), 15000,
            f"Extracted document text length ({len(full_text)} chars) is suspiciously brief"
        )

    # -------------------------------------------------------------------------
    # 3. Page Completeness & Zero Blank Pages
    # -------------------------------------------------------------------------
    def test_every_page_has_extractable_text(self):
        """Verifies no completely blank or unrendered pages exist in the deliverable."""
        for page_idx in range(1, self.inspector.page_count + 1):
            text = self.inspector.get_page_text(page_idx).strip()
            self.assertGreater(
                len(text), 50,
                f"Page {page_idx} has suspiciously little text ({len(text)} chars): {text!r}"
            )

    # -------------------------------------------------------------------------
    # 4. Code & Template Leaks Sanitization
    # -------------------------------------------------------------------------
    def test_no_nan_or_undefined_artifacts(self):
        """Verifies strict absence of JavaScript/template evaluation errors (NaN, undefined, null)."""
        full_text = self.inspector.get_full_text()
        banned_tokens = [
            (r"\bNaN\b", "Uncomputed NaN literal"),
            (r"\bundefined\b", "JavaScript undefined literal"),
            (r"\[object Object\]", "Unstringified JavaScript object literal"),
            (r"\{\{.*?\}\}", "Unparsed handlebars/mustache template expression"),
            (r"\$\{[^}]+\}", "Unparsed ES6 template literal expression"),
        ]
        for pattern, desc in banned_tokens:
            matches = list(re.finditer(pattern, full_text))
            self.assertEqual(
                len(matches), 0,
                f"Found {len(matches)} instance(s) of {desc}: {[m.group(0) for m in matches[:5]]}"
            )

    # -------------------------------------------------------------------------
    # 5. Image & Figure Integrity
    # -------------------------------------------------------------------------
    def test_no_broken_image_indicators(self):
        """Verifies no placeholder or broken image error strings leaked into text."""
        full_text = self.inspector.get_full_text()
        broken_patterns = [
            r"\[broken image\]",
            r"image not found",
            r"failed to load image",
            r"error 404",
        ]
        for pattern in broken_patterns:
            self.assertFalse(
                re.search(pattern, full_text, re.IGNORECASE),
                f"Document text contains broken image indicator matching: {pattern}"
            )

    def test_figure_caption_presence(self):
        """Verifies presence of standard numbered figure captions throughout the manual."""
        full_text = self.inspector.get_full_text()
        figure_matches = list(re.finditer(r"Figure\s+\d+", full_text, re.IGNORECASE))
        self.assertGreaterEqual(
            len(figure_matches), 5,
            f"Found only {len(figure_matches)} numbered figure references; expected at least 5 across modules"
        )

    # -------------------------------------------------------------------------
    # 6. Optical Geometry Standards
    # -------------------------------------------------------------------------
    def test_page_geometry_aspect_ratio(self):
        """Verifies pages adhere to portrait orientation (height > width)."""
        reader = PyPDF2.PdfReader(self.inspector.pdf_path)
        for i, page in enumerate(reader.pages):
            box = page.mediabox
            width = float(box.width)
            height = float(box.height)
            self.assertGreater(
                height, width,
                f"Page {i+1} has non-portrait aspect ratio (width={width}, height={height})"
            )

if __name__ == '__main__':
    unittest.main()
