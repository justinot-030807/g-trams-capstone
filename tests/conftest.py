"""
conftest.py - Shared PDF Inspection Fixture & Document Inspector for G-TRAMS Deliverable #7
"""
import os
import re
from typing import Dict, List, Optional
import PyPDF2

DEFAULT_PDF_CANDIDATES = [
    os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs', 'Deliverable7_Group5_UsersManual.pdf'),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs', 'Deliverable7_Group5_GTRAMS_UsersManual.pdf'),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Deliverable7_Group5_GTRAMS_UsersManual.pdf'),
]

BANNED_AI_FLUFF_PHRASES = [
    r"in this fast-paced digital era",
    r"in today['’]?s fast-paced (?:world|era|environment)",
    r"\bdelve(?:s)? into\b",
    r"\bstands as a testament\b",
    r"\ba testament to\b",
    r"\brich tapestry\b",
    r"\btapestry of\b",
    r"\bseamlessly navigate\b",
    r"\bseamlessly integrate\b",
    r"\bbeacon of\b",
    r"\bgame changer\b",
    r"\brevolutionary platform\b",
    r"\bembark on a journey\b",
    r"\bfosters a sense of\b",
    r"\bwithout further ado\b",
    r"\bin conclusion, it is evident\b",
    r"\bplethora of\b",
    r"\bharness the power of\b",
    r"\bit is important to remember\b",
    r"\bit is worth noting that\b",
]

class PDFDocumentInspector:
    _instance: Optional['PDFDocumentInspector'] = None

    def __init__(self, pdf_path: Optional[str] = None):
        if pdf_path and os.path.exists(pdf_path):
            self.pdf_path = os.path.abspath(pdf_path)
        else:
            # Check environment variable
            env_path = os.environ.get('GTRAMS_MANUAL_PDF')
            if env_path and os.path.exists(env_path):
                self.pdf_path = os.path.abspath(env_path)
            else:
                self.pdf_path = None
                for cand in DEFAULT_PDF_CANDIDATES:
                    if os.path.exists(cand):
                        self.pdf_path = os.path.abspath(cand)
                        break

        if not self.pdf_path or not os.path.exists(self.pdf_path):
            raise FileNotFoundError(
                f"Could not locate target PDF deliverable. Checked candidates: {DEFAULT_PDF_CANDIDATES}"
            )

        self.file_size_bytes = os.path.getsize(self.pdf_path)
        self.reader = PyPDF2.PdfReader(self.pdf_path)
        self.page_count = len(self.reader.pages)
        self._page_texts: Dict[int, str] = {}
        self._full_text: Optional[str] = None

    @classmethod
    def get_instance(cls, pdf_path: Optional[str] = None) -> 'PDFDocumentInspector':
        if cls._instance is None or (pdf_path and cls._instance.pdf_path != os.path.abspath(pdf_path)):
            cls._instance = cls(pdf_path)
        return cls._instance

    def get_page_text(self, page_number: int) -> str:
        """Returns 1-indexed page extracted text."""
        if page_number < 1 or page_number > self.page_count:
            raise IndexError(f"Page number {page_number} out of range [1, {self.page_count}]")
        if page_number not in self._page_texts:
            page = self.reader.pages[page_number - 1]
            self._page_texts[page_number] = page.extract_text() or ""
        return self._page_texts[page_number]

    def get_full_text(self) -> str:
        """Returns full concatenated text across all pages."""
        if self._full_text is None:
            full = []
            for i in range(1, self.page_count + 1):
                full.append(f"\n--- PAGE {i} ---\n")
                full.append(self.get_page_text(i))
            self._full_text = "\n".join(full)
        return self._full_text

    def contains_phrase(self, pattern: str, case_sensitive: bool = False) -> bool:
        """Checks if pattern regex exists in document."""
        flags = 0 if case_sensitive else re.IGNORECASE
        return bool(re.search(pattern, self.get_full_text(), flags))

    def find_all_occurrences(self, pattern: str, case_sensitive: bool = False) -> List[re.Match]:
        """Finds all matches in document."""
        flags = 0 if case_sensitive else re.IGNORECASE
        return list(re.finditer(pattern, self.get_full_text(), flags))

    def find_banned_fluff(self) -> List[str]:
        """Returns all banned AI fluff phrases detected in document text."""
        detected = []
        full_text = self.get_full_text()
        for phrase_pat in BANNED_AI_FLUFF_PHRASES:
            match = re.search(phrase_pat, full_text, re.IGNORECASE)
            if match:
                detected.append(match.group(0))
        return detected


def get_inspector(pdf_path: Optional[str] = None) -> PDFDocumentInspector:
    return PDFDocumentInspector.get_instance(pdf_path)
