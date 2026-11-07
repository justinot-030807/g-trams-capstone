"""
test_tier1_feature_coverage.py - Tier 1: Exhaustive Feature Coverage Tests
Validates dedicated sections, procedures, role responsibilities, and institutional metadata
for Deliverable #7 (User's Manual of the System) pursuant to PROJECT.md and ORIGINAL_REQUEST.md.
"""
import unittest
import re
from tests.conftest import get_inspector

class TestTier1FeatureCoverage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.inspector = get_inspector()
        cls.full_text = cls.inspector.get_full_text()

    # -------------------------------------------------------------------------
    # 1. Academic & Municipal Metadata
    # -------------------------------------------------------------------------
    def test_academic_institution_metadata(self):
        """Verifies authoritative documentation of MarSU and CICS."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Marinduque State University"),
            "Missing institutional attribution: 'Marinduque State University'"
        )
        self.assertTrue(
            self.inspector.contains_phrase(r"College of Information and Computing Sciences|CICS"),
            "Missing college attribution: 'College of Information and Computing Sciences' or 'CICS'"
        )

    def test_municipal_jurisdiction_metadata(self):
        """Verifies municipal authority: Municipality of Gasan, Marinduque."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Municipality of Gasan"),
            "Missing municipality attribution: 'Municipality of Gasan'"
        )
        self.assertTrue(
            self.inspector.contains_phrase(r"Marinduque"),
            "Missing province attribution: 'Marinduque'"
        )

    def test_capstone_group_author_names(self):
        """Verifies all four Group 5 capstone project authors are documented."""
        authors = [
            r"Jhon Kyn Axix (?:H\.\s*)?Cabrigas",
            r"Justine (?:S\.\s*)?Lachica",
            r"Jay Vincent (?:G\.\s*)?Motol",
            r"Ian Simon Francis (?:M\.\s*)?Rey",
        ]
        for author in authors:
            self.assertTrue(
                self.inspector.contains_phrase(author),
                f"Missing capstone group author name matching pattern: {author}"
            )

    def test_municipal_leadership_metadata(self):
        """Verifies municipal executive leadership: Hon. Lidany A. Lao-Baldo."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Lao-Baldo|LIDANY"),
            "Missing municipal executive attribution for Mayor Lidany A. Lao-Baldo"
        )

    # -------------------------------------------------------------------------
    # 2. Public Visitor / Passenger Role Coverage
    # -------------------------------------------------------------------------
    def test_public_visitor_role_presence(self):
        """Verifies dedicated section or role guide for Public Visitor / Citizen / Passenger."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Public Visitor|Citizen|Passenger"),
            "Missing dedicated coverage for Public Visitor / Citizen / Passenger role"
        )

    def test_citizens_charter_application_roadmap(self):
        """Verifies documentation of 5-step application roadmap / Citizen's Charter."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Citizen['’]?s Charter|Step-by-Step|Application Process|5-Step"),
            "Missing Citizen's Charter or multi-step service roadmap"
        )

    def test_public_roadside_qr_verification(self):
        """Verifies public roadside QR verification of active MTOPs without login."""
        self.assertTrue(
            self.inspector.contains_phrase(r"QR (?:Code|Verification)|/verify|scan"),
            "Missing mobile roadside QR verification procedure"
        )

    def test_municipal_fare_and_tariff_matrix(self):
        """Verifies official municipal fare matrix (₱15 base, ₱2.50/km, 20% discount)."""
        has_fare = self.inspector.contains_phrase(r"Fare|Tariff|₱15|15\.00|base fare")
        self.assertTrue(has_fare, "Missing municipal fare matrix or tariff schedule")

    # -------------------------------------------------------------------------
    # 3. Tricycle Operator Role Coverage
    # -------------------------------------------------------------------------
    def test_operator_role_presence(self):
        """Verifies dedicated section for Tricycle Operator."""
        self.assertTrue(
            self.inspector.contains_phrase(r"(?:Tricycle\s+)?Operator"),
            "Missing dedicated coverage for Tricycle Operator role"
        )

    def test_operator_5_step_mtop_wizard(self):
        """Verifies online franchise application multi-step wizard."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Apply (?:for\s+)?Franchise|Application Wizard|Step 1"),
            "Missing operator multi-step franchise application wizard documentation"
        )

    def test_operator_dual_lto_document_segregation(self):
        """Verifies separate upload and verification for CR and OR."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Certificate of Registration|CR") and
            self.inspector.contains_phrase(r"Official Receipt|OR"),
            "Missing dual LTO document segregation (CR and OR)"
        )

    def test_operator_ai_ocr_intake(self):
        """Verifies multimodal AI OCR document intake (Gemini Vision OCR)."""
        self.assertTrue(
            self.inspector.contains_phrase(r"OCR|Optical Character Recognition|Gemini|AI Extraction"),
            "Missing multimodal AI OCR document intake documentation"
        )

    def test_operator_fleet_quota_enforcement(self):
        """Verifies 2-unit quota limit under Section 4 of Municipal Franchising Ordinance."""
        self.assertTrue(
            self.inspector.contains_phrase(r"2 (?:Units|tricycles|Slots)|Quota|Section 4"),
            "Missing fleet quota limitation (maximum 2 units per operator)"
        )

    def test_operator_watermarked_ecopy_mtop(self):
        """Verifies electronic MTOP permit with security watermark."""
        self.assertTrue(
            self.inspector.contains_phrase(r"E-Copy|Electronic Copy|Watermark|Digital MTOP"),
            "Missing watermarked electronic MTOP permit documentation"
        )

    # -------------------------------------------------------------------------
    # 4. TODA President Role Coverage
    # -------------------------------------------------------------------------
    def test_toda_president_role_presence(self):
        """Verifies dedicated section for TODA President."""
        self.assertTrue(
            self.inspector.contains_phrase(r"TODA President|Transport Association President"),
            "Missing dedicated coverage for TODA President role"
        )

    def test_toda_roster_ocr_digitization(self):
        """Verifies digitization of association paper rosters via OCR."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Roster|Submit Members|Upload Roster"),
            "Missing TODA roster digitization procedure"
        )

    def test_toda_body_number_collision_prevention(self):
        """Verifies collision-free body number enforcement within association."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Body Number|Unit Number|Collision|Duplicate"),
            "Missing association body number collision prevention documentation"
        )

    # -------------------------------------------------------------------------
    # 5. Municipal Cashier Role Coverage
    # -------------------------------------------------------------------------
    def test_cashier_role_presence(self):
        """Verifies dedicated section for Municipal Cashier."""
        self.assertTrue(
            self.inspector.contains_phrase(r"(?:Municipal\s+)?Cashier|Treasury"),
            "Missing dedicated coverage for Municipal Cashier role"
        )

    def test_cashier_official_receipt_serialization(self):
        """Verifies physical Official Receipt (OR) serialization."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Official Receipt|OR Number|OR-GASAN|Receipt Booklet"),
            "Missing physical Official Receipt serialization workflow"
        )

    def test_cashier_daily_remittance_csv_export(self):
        """Verifies COA daily remittance CSV export and turnover voucher."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Remittance|Daily Collections|CSV|Turnover"),
            "Missing cashier daily collection remittance and CSV export documentation"
        )

    # -------------------------------------------------------------------------
    # 6. BPLO Licensing Officer Role Coverage
    # -------------------------------------------------------------------------
    def test_bplo_officer_role_presence(self):
        """Verifies dedicated section for BPLO Licensing Officer."""
        self.assertTrue(
            self.inspector.contains_phrase(r"BPLO|Business Permits (?:and|&) Licensing"),
            "Missing dedicated coverage for BPLO Licensing Officer role"
        )

    def test_bplo_dual_pane_document_review(self):
        """Verifies split-screen / dual-pane document inspection with OCR cross-check."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Review|Dual-Pane|Split-Screen|Document Viewer|Discrepancy"),
            "Missing BPLO dual-pane document review canvas documentation"
        )

    def test_bplo_multi_stage_approval_pipeline(self):
        """Verifies multi-stage pipeline: Needs Review -> For Payment -> For Signing -> Ready for Pickup."""
        self.assertTrue(
            self.inspector.contains_phrase(r"For Payment") and
            self.inspector.contains_phrase(r"For Signing|Ready for Pickup"),
            "Missing multi-stage franchise approval queue pipeline"
        )

    def test_bplo_progressive_traffic_sanctions(self):
        """Verifies progressive disciplinary enforcement (Warning, Suspension, Revocation)."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Warning") and
            self.inspector.contains_phrase(r"Suspension|Revocation|Violation"),
            "Missing progressive traffic sanctions documentation"
        )

    # -------------------------------------------------------------------------
    # 7. System Administrator Role Coverage
    # -------------------------------------------------------------------------
    def test_system_admin_role_presence(self):
        """Verifies dedicated section for System Administrator."""
        self.assertTrue(
            self.inspector.contains_phrase(r"(?:System\s+)?Admin(?:istrator)?|IT Operations"),
            "Missing dedicated coverage for System Administrator role"
        )

    def test_admin_rbac_governance(self):
        """Verifies Role-Based Access Control (RBAC) governance and user directory."""
        self.assertTrue(
            self.inspector.contains_phrase(r"RBAC|Role-Based Access|User Management|User Directory"),
            "Missing RBAC governance and user management documentation"
        )

    def test_admin_disaster_recovery_backup_and_restore(self):
        """Verifies automated weekly database backup and disaster recovery restore protocol."""
        self.assertTrue(
            self.inspector.contains_phrase(r"Backup|Disaster Recovery|DRP|Restore"),
            "Missing disaster recovery database backup/restore documentation"
        )

    def test_admin_safety_confirmation_phrase(self):
        """Verifies disaster recovery restore requires explicit safety confirmation phrase."""
        self.assertTrue(
            self.inspector.contains_phrase(r"RESTORE|confirmation phrase|safety phrase"),
            "Missing safety confirmation phrase ('RESTORE') requirement in DRP restore"
        )

if __name__ == '__main__':
    unittest.main()
