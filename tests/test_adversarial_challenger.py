"""
test_adversarial_challenger.py - Empirical Adversarial Stress Testing Harness
Author: Challenger 1 (teamwork_challenger)
Role: critic, specialist

Conducts exhaustive empirical adversarial checks against Deliverable #7:
1. Extended AI Fluff & Cliche Dictionary Hunter (38+ tropes across MD and PDF).
2. Code/Template/Placeholder Leaks (NaN, undefined, {{...}}, TODO, broken img).
3. Unrendered LaTeX / Syntax Leaks (checks for raw $\\rightarrow$ / ightarrow).
4. 22-Page Structural Layout & Orphaned Heading Detection.
5. Page Density & Starvation Stress Check.
6. Functional Role Contract Verification across all 6 roles & statutory ordinances.
7. Figure Continuity & Asset Integrity (Figures 1-17 sequential & non-empty).
"""

import os
import re
import unittest
from typing import Dict, List, Tuple
import PyPDF2

# Resolve paths
WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_PATH = os.path.join(WORKSPACE_ROOT, 'docs', 'Deliverable7_Group5_UsersManual.pdf')
HTML_PATH = os.path.join(WORKSPACE_ROOT, 'docs', 'Deliverable7_Group5_UsersManual.html')
MD_PATH = os.path.join(WORKSPACE_ROOT, 'docs', 'manual_content.md')

EXTENDED_AI_FLUFF_PATTERNS = [
    (r"\bdelve(?:s|d|ing)?\b", "delve / delving"),
    (r"\bstands as a testament\b", "stands as a testament"),
    (r"\ba testament to\b", "a testament to"),
    (r"\brich tapestry\b", "rich tapestry"),
    (r"\btapestry of\b", "tapestry of"),
    (r"\bseamlessly navigate\b", "seamlessly navigate"),
    (r"\bseamlessly integrate\b", "seamlessly integrate"),
    (r"\bbeacon of\b", "beacon of"),
    (r"\bgame[- ]changer\b", "game-changer"),
    (r"\brevolutionary platform\b", "revolutionary platform"),
    (r"\brevolutioniz(?:e|ing|ed)\b", "revolutionize"),
    (r"\bembark(?:s|ed|ing)? on a journey\b", "embark on a journey"),
    (r"\bfoster(?:s|ed|ing)? a sense of\b", "foster a sense of"),
    (r"\bwithout further ado\b", "without further ado"),
    (r"\bin conclusion, it is evident\b", "in conclusion, it is evident"),
    (r"\bplethora of\b", "plethora of"),
    (r"\bmyriad of\b", "myriad of"),
    (r"\bharness(?:ing)? the power of\b", "harness the power of"),
    (r"\bit is important to remember\b", "it is important to remember"),
    (r"\bit is worth noting that\b", "it is worth noting that"),
    (r"\bit should be noted that\b", "it should be noted that"),
    (r"in today['’]?s (?:digital|fast-paced|rapidly changing|interconnected) (?:world|era|landscape|age)", "in today's digital era/world"),
    (r"in this (?:fast-paced|rapidly evolving) (?:digital|world|environment)", "in this fast-paced world"),
    (r"\bvital cog\b", "vital cog"),
    (r"\bcornerstone of efficiency\b", "cornerstone of efficiency"),
    (r"\bdive deep\b", "dive deep"),
    (r"\bdeep dive into\b", "deep dive into"),
    (r"\bin a nutshell\b", "in a nutshell"),
    (r"\bparamount importance\b", "paramount importance"),
    (r"\bunlock(?:ing)? the (?:full )?potential\b", "unlock the full potential"),
    (r"\bunleash(?:ing)?\b", "unleash"),
    (r"\btransformative journey\b", "transformative journey"),
    (r"\bmeticulously crafted\b", "meticulously crafted"),
    (r"\belevat(?:e|ing) the (?:user )?experience\b", "elevate the user experience"),
    (r"\bat the forefront of\b", "at the forefront of"),
    (r"\bpivotal role in shaping\b", "pivotal role in shaping"),
    (r"\bgroundbreaking platform\b", "groundbreaking platform"),
    (r"\bspearheading the transformation\b", "spearheading the transformation"),
]

class TestAdversarialFluffAndBoilerplate(unittest.TestCase):
    """Stress tests document sources for AI cliches, filler language, and robotic boilerplates."""

    @classmethod
    def setUpClass(cls):
        with open(PDF_PATH, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            cls.pdf_pages = [p.extract_text() or '' for p in reader.pages]
            cls.pdf_full_text = '\n'.join(cls.pdf_pages)
        
        with open(MD_PATH, 'r', encoding='utf-8') as f:
            cls.md_text = f.read()

    def test_pdf_extended_fluff_dictionary(self):
        """Adversarially scans PDF extracted text against 38+ subtle AI tropes."""
        violations = []
        for pat, label in EXTENDED_AI_FLUFF_PATTERNS:
            matches = list(re.finditer(pat, self.pdf_full_text, re.IGNORECASE))
            if matches:
                violations.append((label, len(matches), [m.group(0) for m in matches]))
        self.assertEqual(
            len(violations), 0,
            f"Adversarial AI fluff detected in compiled PDF: {violations}"
        )

    def test_markdown_extended_fluff_dictionary(self):
        """Adversarially scans manual_content.md against 38+ subtle AI tropes."""
        violations = []
        for pat, label in EXTENDED_AI_FLUFF_PATTERNS:
            matches = list(re.finditer(pat, self.md_text, re.IGNORECASE))
            if matches:
                violations.append((label, len(matches), [m.group(0) for m in matches]))
        self.assertEqual(
            len(violations), 0,
            f"Adversarial AI fluff detected in manual_content.md: {violations}"
        )

    def test_no_generic_latin_or_dummy_filler(self):
        """Ensures zero lorem ipsum, dolor sit, or sample dummy text."""
        dummy_patterns = [r"lorem ipsum", r"dolor sit amet", r"sample text", r"insert text here"]
        for pat in dummy_patterns:
            self.assertFalse(
                re.search(pat, self.pdf_full_text, re.IGNORECASE),
                f"Found dummy filler text matching {pat} in PDF"
            )
            self.assertFalse(
                re.search(pat, self.md_text, re.IGNORECASE),
                f"Found dummy filler text matching {pat} in manual_content.md"
            )


class TestAdversarialCodeAndTemplateLeaks(unittest.TestCase):
    """Stress tests documents for unresolved code tokens, template tags, or broken references."""

    @classmethod
    def setUpClass(cls):
        with open(PDF_PATH, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            cls.pdf_text = '\n'.join([p.extract_text() or '' for p in reader.pages])

        with open(MD_PATH, 'r', encoding='utf-8') as f:
            cls.md_text = f.read()

        with open(HTML_PATH, 'r', encoding='utf-8') as f:
            cls.html_text = f.read()

    def test_no_javascript_error_literals(self):
        """Verifies no uncomputed NaN, undefined, or [object Object] in PDF or MD."""
        leak_patterns = [
            (r"\bNaN\b", "Uncomputed NaN literal"),
            (r"\bundefined\b", "JavaScript undefined literal"),
            (r"\[object Object\]", "Unstringified JavaScript Object"),
        ]
        for pat, desc in leak_patterns:
            matches = list(re.finditer(pat, self.pdf_text))
            self.assertEqual(len(matches), 0, f"Detected {desc} in PDF: {[m.group(0) for m in matches]}")
            matches_md = list(re.finditer(pat, self.md_text))
            self.assertEqual(len(matches_md), 0, f"Detected {desc} in Markdown: {[m.group(0) for m in matches_md]}")

    def test_no_unrendered_template_delimiters(self):
        """Verifies no raw template tokens like {{ }}, ${ }, or <% %> leaked into output."""
        template_patterns = [
            (r"\{\{[^}]*\}\}", "Mustache/Handlebars template delimiter"),
            (r"\$\{[a-zA-Z0-9_.]+\}", "Template literal placeholder"),
            (r"<%.*?%>", "EJS/ERB template delimiter"),
        ]
        for pat, desc in template_patterns:
            matches = list(re.finditer(pat, self.pdf_text))
            self.assertEqual(len(matches), 0, f"Found {desc} in PDF: {[m.group(0) for m in matches]}")

    def test_no_unrendered_latex_syntax(self):
        """
        Adversarial check: verifies no unrendered LaTeX arrow syntax like $\\rightarrow$
        or its escape artifacts (ightarrow) appear in HTML or PDF text.
        """
        latex_in_html = re.findall(r"ightarrow", self.html_text)
        self.assertEqual(
            len(latex_in_html), 0,
            f"DEFECT FOUND: {len(latex_in_html)} instances of unrendered LaTeX '$\\rightarrow$' (escaped to ightarrow) leaked into HTML deliverable."
        )

    def test_no_developer_todo_or_tbd_tags(self):
        """Verifies absence of TODO, FIXME, or TBD notes in published manual."""
        todo_patterns = [r"\bTODO\b", r"\bFIXME\b", r"\bTBD\b", r"\[PLACEHOLDER\]"]
        for pat in todo_patterns:
            self.assertFalse(
                re.search(pat, self.pdf_text),
                f"Found unfinished work marker {pat} in PDF"
            )

    def test_html_all_images_non_empty_base64(self):
        """Verifies all embedded images in HTML source have non-empty base64 payloads."""
        img_tags = re.findall(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', self.html_text)
        self.assertGreaterEqual(len(img_tags), 18, f"Expected >= 18 images in HTML, found {len(img_tags)}")
        for i, src in enumerate(img_tags):
            self.assertTrue(src.startswith('data:image/'), f"Image #{i+1} src does not start with data:image/: {src[:30]}")
            parts = src.split(',')
            self.assertEqual(len(parts), 2, f"Image #{i+1} malformed data URI")
            self.assertGreater(len(parts[1]), 500, f"Image #{i+1} base64 payload suspiciously short: {len(parts[1])} bytes")


class TestAdversarialPageLayoutAndGeometry(unittest.TestCase):
    """Stress tests physical page rendering, page count, and layout boundary anomalies."""

    @classmethod
    def setUpClass(cls):
        with open(PDF_PATH, 'rb') as f:
            cls.reader = PyPDF2.PdfReader(f)
            cls.page_count = len(cls.reader.pages)
            cls.page_texts = [p.extract_text() or '' for p in cls.reader.pages]

    def test_exact_page_count_boundary(self):
        """Verifies the manual is exactly 22 pages as specified in PROJECT.md."""
        self.assertEqual(
            self.page_count, 22,
            f"Deliverable has {self.page_count} pages; required exactly 22 pages"
        )

    def test_page_density_and_starvation(self):
        """
        Adversarial check: verifies no page is content-starved (< 500 characters).
        Flags severe layout imbalances such as Page 20 containing only a single figure.
        """
        sparse_pages = []
        for i, text in enumerate(self.page_texts):
            char_count = len(text.strip())
            if char_count < 500:
                sparse_pages.append((i + 1, char_count))
        
        self.assertEqual(
            len(sparse_pages), 0,
            f"DEFECT FOUND: {len(sparse_pages)} content-starved page(s) with < 500 characters: {sparse_pages}"
        )

    def test_detect_orphaned_headings_at_page_bottoms(self):
        """
        Adversarially checks if any page ends with a heading whose content is deferred
        to the next page (classic typesetting defect: orphan heading).
        """
        orphaned_headings = []
        heading_pattern = re.compile(
            r'^(?:[0-9]+\.[0-9]*\s+[A-Za-z]|Section\s+[0-9]|Procedure\s+[0-9]|Figure\s+[0-9])'
        )
        for i, text in enumerate(self.page_texts[:-1]):
            lines = [l.strip() for l in text.strip().split('\n') if l.strip()]
            if not lines:
                continue
            last_line = lines[-1]
            if heading_pattern.match(last_line) and len(last_line) < 80:
                orphaned_headings.append((i + 1, last_line))

        self.assertEqual(
            len(orphaned_headings), 0,
            f"DEFECT FOUND: Orphaned headings at page bottoms without following content: {orphaned_headings}"
        )


class TestAdversarialFigureContinuity(unittest.TestCase):
    """Stress tests numbered figures for complete sequential numbering from 1 to 17."""

    @classmethod
    def setUpClass(cls):
        with open(PDF_PATH, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            cls.pdf_text = '\n'.join([p.extract_text() or '' for p in reader.pages])

        with open(MD_PATH, 'r', encoding='utf-8') as f:
            cls.md_text = f.read()

    def test_all_17_figures_present_and_sequential_in_pdf(self):
        """Verifies Figures 1 through 17 all exist in sequential order in PDF."""
        for num in range(1, 18):
            pattern = rf"Figure\s+{num}:"
            match = re.search(pattern, self.pdf_text, re.IGNORECASE)
            self.assertIsNotNone(
                match,
                f"Figure {num} is missing or improperly formatted in PDF text"
            )

    def test_all_17_figures_present_in_markdown(self):
        """Verifies Figures 1 through 17 all exist in sequential order in Markdown."""
        for num in range(1, 18):
            pattern = rf"Figure\s+{num}:"
            match = re.search(pattern, self.md_text, re.IGNORECASE)
            self.assertIsNotNone(
                match,
                f"Figure {num} is missing or improperly formatted in manual_content.md"
            )

    def test_no_duplicate_figure_numbers(self):
        """Verifies no figure number is duplicated in captions."""
        fig_captions = re.findall(r"Figure\s+(\d+):", self.pdf_text, re.IGNORECASE)
        fig_nums = [int(n) for n in fig_captions]
        duplicates = [n for n in set(fig_nums) if fig_nums.count(n) > 1]
        self.assertEqual(
            len(duplicates), 0,
            f"Found duplicate figure numbers in PDF captions: {duplicates}"
        )


class TestAdversarialRoleContractsAndOrdinances(unittest.TestCase):
    """Stress tests the technical fidelity of all 6 roles and municipal policies."""

    @classmethod
    def setUpClass(cls):
        with open(PDF_PATH, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            cls.text = '\n'.join([p.extract_text() or '' for p in reader.pages])

    def test_role1_public_visitor_contracts(self):
        """Verifies Public Visitor: Citizen's Charter, QR verification, and ₱15 base fare schedule."""
        self.assertTrue(re.search(r"Citizen['’]?s Charter", self.text, re.IGNORECASE), "Missing Citizen's Charter")
        self.assertTrue(re.search(r"/verify", self.text, re.IGNORECASE), "Missing roadside /verify endpoint")
        self.assertTrue(re.search(r"₱15|15\.00", self.text), "Missing ₱15 base fare")
        self.assertTrue(re.search(r"20%", self.text), "Missing 20% discount statutory policy")

    def test_role2_operator_contracts(self):
        """Verifies Operator: 5-step wizard, Section 4 quota (max 2 units), OCR data minimization, cancellation."""
        self.assertTrue(re.search(r"5-Step|Wizard", self.text, re.IGNORECASE), "Missing 5-step wizard")
        self.assertTrue(re.search(r"Section 4|2[- ]Unit|quota", self.text, re.IGNORECASE), "Missing Section 4 2-unit quota")
        self.assertTrue(re.search(r"10173|minimization", self.text, re.IGNORECASE), "Missing RA 10173 data minimization")
        self.assertTrue(re.search(r"watermark", self.text, re.IGNORECASE), "Missing watermarked e-MTOP")
        self.assertTrue(re.search(r"Cancellation|Dropping", self.text, re.IGNORECASE), "Missing voluntary cancellation")

    def test_role3_toda_president_contracts(self):
        """Verifies TODA President: Roster OCR, body number collision, member delisting."""
        self.assertTrue(re.search(r"Roster", self.text, re.IGNORECASE), "Missing roster management")
        self.assertTrue(re.search(r"collision|duplicate body", self.text, re.IGNORECASE), "Missing body number collision check")
        self.assertTrue(re.search(r"delisting|removal", self.text, re.IGNORECASE), "Missing delisting workflow")

    def test_role4_cashier_contracts(self):
        """Verifies Cashier: Isolated terminal, COA OR-GASAN serialization, daily remittance CSV."""
        self.assertTrue(re.search(r"Counter 2|Cashier", self.text, re.IGNORECASE), "Missing Cashier terminal")
        self.assertTrue(re.search(r"OR-GASAN-2026", self.text), "Missing OR-GASAN-2026 serialization")
        self.assertTrue(re.search(r"Remittance|CSV|Turnover", self.text, re.IGNORECASE), "Missing daily remittance CSV/voucher")

    def test_role5_bplo_officer_contracts(self):
        """Verifies BPLO: Dual-pane console, 4-stage pipeline, progressive sanctions, batch printing."""
        self.assertTrue(re.search(r"Dual-Pane", self.text, re.IGNORECASE), "Missing dual-pane review console")
        self.assertTrue(re.search(r"For Payment.*For Signing.*Ready for Pickup|Needs Review", self.text, re.DOTALL | re.IGNORECASE), "Missing pipeline stages")
        self.assertTrue(re.search(r"Progressive Traffic Sanctions|1st Offense.*2nd Offense.*3rd Offense", self.text, re.DOTALL | re.IGNORECASE), "Missing progressive sanctions")
        self.assertTrue(re.search(r"Batch|Masterlist", self.text, re.IGNORECASE), "Missing batch printing and masterlist registry")

    def test_role6_system_administrator_contracts(self):
        """Verifies System Admin: RBAC directory, cluster telemetry, weekly backup, safety phrase 'RESTORE'."""
        self.assertTrue(re.search(r"RBAC|User Directory", self.text, re.IGNORECASE), "Missing RBAC user accounts directory")
        self.assertTrue(re.search(r"MongoDB Atlas|Latency|Memory|Telemetry", self.text, re.IGNORECASE), "Missing cluster telemetry")
        self.assertTrue(re.search(r"Sunday|12:00 MN|Backup", self.text, re.IGNORECASE), "Missing weekly Sunday cron backup")
        self.assertTrue(re.search(r"RESTORE", self.text), "Missing disaster recovery confirmation safety phrase 'RESTORE'")

    def test_academic_and_municipal_authorship(self):
        """Verifies all four group authors, MarSU, CICS, and Mayor Lao-Baldo."""
        self.assertTrue(re.search(r"Jhon Kyn Axix", self.text, re.IGNORECASE), "Missing author: Jhon Kyn Axix Cabrigas")
        self.assertTrue(re.search(r"Justine.*Lachica", self.text, re.IGNORECASE), "Missing author: Justine Lachica")
        self.assertTrue(re.search(r"Jay Vincent.*Motol", self.text, re.IGNORECASE), "Missing author: Jay Vincent Motol")
        self.assertTrue(re.search(r"Ian Simon Francis.*Rey", self.text, re.IGNORECASE), "Missing author: Ian Simon Francis Rey")
        self.assertTrue(re.search(r"Marinduque State University", self.text, re.IGNORECASE), "Missing MarSU")
        self.assertTrue(re.search(r"College of Information and Computing Sciences|CICS", self.text, re.IGNORECASE), "Missing CICS")
        self.assertTrue(re.search(r"Municipality of Gasan", self.text, re.IGNORECASE), "Missing Gasan")
        self.assertTrue(re.search(r"Lao-Baldo", self.text, re.IGNORECASE), "Missing Mayor Lao-Baldo")


if __name__ == '__main__':
    unittest.main()
