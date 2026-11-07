# G-TRAMS Deliverable #7: Test Infrastructure & 4-Tier E2E Testing Architecture

**Target Deliverable:** `docs/Deliverable7_Group5_UsersManual.pdf`  
**Target Document Title:** User's Manual of the System — Gasan Tricycle Regulatory and Automated Management System (G-TRAMS)  
**Author:** QA & E2E Testing Team (`teamwork_test_writer`)  
**Date:** November 7, 2026 (Production Release v2.4.0)  
**Environment:** Antigravity 2.0 / Windows x64 / Python 3.11 (`PyPDF2`, `unittest`) / Node.js v24  

---

## 1. Test Philosophy & Engineering Principles

The G-TRAMS Deliverable #7 E2E test suite adheres to five core engineering principles:

1. **Opaque-Box Verification**: The test suite evaluates the compiled PDF deliverable purely as a black-box publication artifact. It does not inspect private generator variables or DOM mocks; instead, it extracts physical PDF text, streams, font dictionaries, metadata objects, and byte boundaries to verify that real human readers and municipal stakeholders receive an authentic, uncorrupted, and legally binding document.
2. **Authoritative Output Derivation**: Every assertion is derived directly from authoritative requirements:
   - `ORIGINAL_REQUEST.md`: Academic affiliations, group members, zero AI filler text, 6 system roles.
   - `PROJECT.md`: Feature inventory (Features #1–40), layout contracts, and milestone dependencies.
   - Municipal Ordinances: Municipal Franchising Ordinance Section 4 (2-unit quota), 25 barangays, 3 zones, 17 TODAs, ₱500 franchise fee, ₱15 base fare.
   - Statutory Mandates: RA 10173 (Data Privacy / Data Minimization), RA 11032 (Ease of Doing Business / ARTA 3–5 day SLA), COA Circulars (Over-the-counter physical OR serialization), RA 11364 (20% student/senior/PWD discount), and Revised Penal Code Article 172.
3. **Progressive Testability & Milestone Decoupling**: Tests are partitioned into distinct tiers. Tests can be run against any interim PDF build to assess milestone completeness, identifying exactly what features are satisfied and what gaps remain before defense.
4. **Adversarial Integrity**: Tests specifically search for negative patterns and corruption indicators:
   - Banned AI boilerplate tokens (e.g., *"In this fast-paced digital era"*, *"delve into"*, *"testament"*, *"tapestry"*, *"seamlessly navigate"*).
   - Leaked code artifacts (e.g., `NaN`, `undefined`, `null`, `[object Object]`, unparsed template tags `{{`, `${`).
   - Broken figure placeholders or 0-byte embedded images.
   - PDF structure corruption (unclosed streams, truncated trailer dictionaries, missing xref tables).
5. **Deterministic & Isolated Execution**: Test scripts run self-contained without external network dependencies. A full test run executes in under 1 second using native Python standard libraries and `PyPDF2`.

---

## 2. 4-Tier Testing Methodology

The test suite is structured into four progressive validation tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│               TIER 4: REAL-WORLD ACCEPTANCE SCENARIOS                  │
│   Zero AI Fluff • Authentic Municipal Legal Mandates • COA Standards   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│              TIER 3: CROSS-FEATURE LIFECYCLE WORKFLOWS                 │
│   Sequential Role Handoff: Operator ➔ TODA ➔ Cashier ➔ BPLO ➔ Admin    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│               TIER 2: BOUNDARY, STRUCTURAL & CORNER CASES              │
│   PDF Integrity • Page Count >= 20 • File Size >= 2MB • Optical Bounds │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                 TIER 1: EXHAUSTIVE FEATURE COVERAGE                    │
│   All 6 Roles • 5-Step Wizard • QR Authenticator • DRP Backups • Meta  │
└────────────────────────────────────────────────────────────────────────┘
```

### Tier 1: Feature Coverage
Verifies that all required functional modules, interfaces, and user journeys are documented in dedicated sections:
- **Project & Academic Metadata**: Marinduque State University (MarSU), College of Information and Computing Sciences (CICS), Municipality of Gasan, Mayor Hon. Lidany A. Lao-Baldo, and all four Group 5 authors (Jhon Kyn Axix H. Cabrigas, Justine S. Lachica, Jay Vincent G. Motol, Ian Simon Francis M. Rey).
- **Public Visitor / Passenger**: 5-step Citizen's Charter application roadmap, mobile camera roadside QR verification (`/verify/:id`), official municipal fare matrix (₱15 base, ₱2.50/km, 20% discount), and public announcements.
- **Tricycle Operator**: 5-step franchise wizard (Credentials, Vehicle Specs, TODA Clearance, Cedula, Affidavit), dual CR/OR segregation, Gemini Vision OCR intake, fleet quota limit (maximum 2 units under Section 4), draft autosave/session resume, watermarked e-Copy MTOP, and voluntary cancellation.
- **TODA President**: Paper roster digitization via Gemini Vision OCR, association membership verification, collision-free body number enforcement, and member delisting requests.
- **Municipal Cashier**: Isolated treasury payment terminal, physical Official Receipt (OR) serialization (`OR-GASAN-2026-XXXX`), cash collection (₱500 fee), and daily remittance CSV/voucher export.
- **BPLO Licensing Officer**: Dual-pane document inspection canvas with AI OCR discrepancy highlights, multi-stage approval queue (Needs Review $\rightarrow$ For Payment $\rightarrow$ For Signing $\rightarrow$ Ready for Pickup), progressive traffic sanctions (Warning $\rightarrow$ Suspension $\rightarrow$ Revocation), batch MTOP printing, and franchise masterlist registry.
- **System Administrator**: RBAC governance across 6 tiers, protected admin status, server telemetry (Node uptime, MongoDB Atlas ping), global ordinance parameters (3yr/1yr validity, maintenance toggle), automated weekly database backup (DRP: Sunday 12:00 MN, 13 collections, 8-week retention), 1-click offline `.json.gz` snapshot, and disaster recovery restore with `RESTORE` confirmation phrase.

### Tier 2: Boundary, Structural & Corner Cases
Verifies physical and structural deliverable integrity:
- **PDF Binary Integrity**: Valid PDF header (`%PDF-1.x`), complete trailer dictionary, valid cross-reference table, parseable by standard PDF engines without exceptions.
- **Document Volume Thresholds**: Minimum page count of 20 pages (ensuring full publication depth), file size $\ge$ 2.0 MB (confirming embedded high-resolution figures).
- **Page Non-Emptiness**: Every page contains substantive text content (minimum 150 characters per page; cover and image pages verified).
- **Zero Artifact Leaks**: Strict regex assertion that `NaN`, `undefined`, `null`, `[object Object]`, and template delimiters `{{` or `${` do not appear anywhere in extracted text streams.
- **Figure Integrity**: Captions exist for figures, image references are resolved, and no broken image replacement strings (e.g. `[Broken Image]`, `Image not found`, `404`) appear.
- **Optical Formatting Standards**: Verifies standard page geometry (A4 portrait dimensions: $595 \times 842$ pt), running headers, running footers, and continuous pagination.

### Tier 3: Cross-Feature Lifecycle Workflows
Verifies the coherent end-to-end operational handoff across all six municipal user roles:
- **Stage 1 (Application Intake)**: Operator registers and files online MTOP $\rightarrow$ application assigned unique reference number and `Pending` status.
- **Stage 2 (Association Certification)**: TODA President inspects roster and certifies member with collision-free body number.
- **Stage 3 (BPLO Evaluation)**: Licensing staff verifies documents in dual-pane canvas against Gemini OCR data $\rightarrow$ endorses application to `For Payment`.
- **Stage 4 (Treasury Collection)**: Cashier receives applicant at Window 2, collects ₱500 cash, serializes physical OR booklet number $\rightarrow$ advances application to `For Signing`.
- **Stage 5 (Executive Authorization & Pickup)**: Mayor/BPLO signs permit, marks status `Ready for Pickup` $\rightarrow$ issues watermarked certificate and adhesive QR sticker $\rightarrow$ transitions status to `Active`.
- **Stage 6 (Administrative Telemetry & Audit)**: System Administrator monitors transaction telemetry, verifies audit log entries, and archives collection in weekly DRP snapshot.

### Tier 4: Real-World Acceptance Scenarios
Verifies authentic voice, professional tone, and municipal governance compliance:
- **Zero Generic AI Filler Phrases**: Strictly bans hallmark LLM fluff:
  - *"In this fast-paced digital era"* / *"In today's fast-paced world"*
  - *"delve into"* / *"delves into"*
  - *"testament to"* / *"stands as a testament"*
  - *"tapestry"* / *"rich tapestry"*
  - *"seamlessly navigate"* / *"seamlessly integrate"*
  - *"beacon of"* / *"game changer"* / *"revolutionary platform"*
  - *"embark on a journey"* / *"fosters a sense of"*
  - *"without further ado"* / *"in conclusion, it is evident"*
  - *"plethora of"* / *"harness the power of"*
- **Authentic Legal & Administrative Citations**: Verifies presence of:
  - *Municipal Franchising Ordinance Section 4* (2-unit ceiling)
  - *Republic Act No. 10173* (Data Privacy Act of 2012 / Data Minimization)
  - *Republic Act No. 11032* (Ease of Doing Business & Efficient Government Service Delivery Act)
  - *Republic Act No. 7160* (Local Government Code of 1991)
  - *Republic Act No. 11364* (20% Mandatory Fare Discount for Students, Seniors, PWDs)
  - *Commission on Audit (COA) Circulars* (Over-the-counter cash collection & physical OR serialization)
  - *Article 172 of the Revised Penal Code* (Falsification of documents & perjury warnings)
- **Authentic Municipal Nomenclature**: Verifies authentic geographic and institutional naming:
  - 25 Barangays of Gasan (Poblacion I, II, III, Antipolo, Bahi, Tiguion, etc.)
  - 3 Route Zones (Central, North, South)
  - Accredited TODAs (BATODA, POB TODA, GT TODA, Gasan Central TODA, 4B TODA, etc.)
  - Sangguniang Bayan, Office of the Municipal Vice Mayor, MTFRB, BPLO.

---

## 3. Comprehensive Feature Coverage Matrix

| Feature ID | Feature Name / Scope | Tier | Target Section in Manual | Authoritative Specification | Automated Verification Assertion |
|---|---|---|---|---|---|
| **FEAT-01** | Academic & Municipal Metadata | Tier 1 | Cover Page & Section 1 | `ORIGINAL_REQUEST.md:14-16` | Text contains "Marinduque State University", "CICS", "Municipality of Gasan", "Group 5", all 4 author names, and Mayor Lao-Baldo. |
| **FEAT-02** | Citizen's Charter Application Roadmap | Tier 1 | Section 1 & Section 3 | `backend/src/models/systemSettingsModel.js` | Text details the 5-step citizen roadmap: Register, Submit, Validation, Payment, Release. |
| **FEAT-03** | Public Roadside QR Verification | Tier 1 | Section 3 | `frontend/src/pages/shared/VerifyOperator.jsx` | Text details mobile camera scanning of MTOP QR code (`/verify/:id`) without login requirement. |
| **FEAT-04** | Municipal Fare & Tariff Matrix | Tier 1 | Section 1 & Section 3 | `frontend/src/utils/constants.js` | Text specifies ₱15.00 base fare, ₱2.50/km succeeding rate, and 20% discount under RA 11364. |
| **FEAT-05** | Multi-Identifier Authentication | Tier 1 | Section 2 | `frontend/src/pages/Login.jsx` | Text documents dual login via Email or 11-digit Philippine Mobile Number (`09xxxxxxxxx`). |
| **FEAT-06** | Multi-Channel Password Recovery | Tier 1 | Section 2 | `frontend/src/pages/ForgotPassword.jsx` | Text documents 6-digit OTP verification via SMS/Email to restore lost access. |
| **FEAT-07** | Account Registration & Recovery Contacts | Tier 1 | Section 2 | `frontend/src/pages/Register.jsx` | Text details capture of secondary emergency recovery phone/email during onboarding. |
| **FEAT-08** | Operator 5-Step MTOP Wizard | Tier 1 | Section 4 | `frontend/src/pages/operator/ApplyFranchise.jsx` | Text details Step 1 (Driver), Step 2 (Specs), Step 3 (TODA), Step 4 (Cedula), Step 5 (Affidavit). |
| **FEAT-09** | Multimodal AI OCR Intake | Tier 1 | Section 4 | `docs/CAPSTONE_DEFENSE_MASTER_GUIDE.md:86` | Text details automated scanning of CR, OR, License, Cedula via Google Gemini Vision OCR. |
| **FEAT-10** | Dual LTO Document Segregation | Tier 1 | Section 4 | `docs/CAPSTONE_DEFENSE_MASTER_GUIDE.md:247` | Text documents separate upload slots for Certificate of Registration (CR) and Official Receipt (OR). |
| **FEAT-11** | RA 10173 Data Minimization | Tier 1 / 4 | Section 4 & Section 7 | `docs/CAPSTONE_DEFENSE_MASTER_GUIDE.md:257` | Text verifies exclusion of blood type and biometric data during Driver's License OCR extraction. |
| **FEAT-12** | Fleet Quota Limit (Max 2 Units) | Tier 1 / 4 | Section 4 | `docs/CAPSTONE_DEFENSE_MASTER_GUIDE.md:129` | Text cites Section 4 of Municipal Franchising Ordinance limiting operators to 2 tricycle units. |
| **FEAT-13** | Draft Autosave & Session Resume | Tier 1 | Section 4 | `docs/CAPSTONE_DEFENSE_MASTER_GUIDE.md:130` | Text documents local storage auto-save and draft restoration modal upon browser reload. |
| **FEAT-14** | Watermarked E-Copy Digital MTOP | Tier 1 | Section 4 | `docs/CAPSTONE_DEFENSE_MASTER_GUIDE.md:207` | Text documents electronic permit with security watermark "APPROVED - ELECTRONIC COPY • VALID ISSUANCE". |
| **FEAT-15** | Voluntary Cancellation & Tickets | Tier 1 | Section 4 & Section 8 | `frontend/src/pages/operator/OperatorDashboard.jsx` | Text documents voluntary cancellation workflow and helpdesk support ticketing. |
| **FEAT-16** | TODA Gemini Vision Roster OCR | Tier 1 | Section 5 | `frontend/src/pages/toda/SubmitMembers.jsx` | Text details digitization of paper member lists into structured table rows via Gemini Vision. |
| **FEAT-17** | TODA Member Directory & Verification | Tier 1 | Section 5 | `docs/manual_assets/fig8_toda_roster.png` | Text details searching, inline row editing, and formal member endorsement. |
| **FEAT-18** | Association Body Number Collision Guard | Tier 1 | Section 5 | `backend/src/models/todaModel.js:58` | Text documents unique compound index preventing duplicate body numbers within the same TODA. |
| **FEAT-19** | Member Delisting & Removal Requests | Tier 1 | Section 5 | `frontend/src/pages/toda/SubmitMembers.jsx` | Text details structured delisting reasons submitted by TODA President for BPLO adjudication. |
| **FEAT-20** | Dual-Pane Document Review Console | Tier 1 | Section 6 | `frontend/src/pages/admin/FranchiseReviewPage.jsx` | Text details split-screen viewer (zoom/rotate/pan) and AI OCR discrepancy alert highlights. |
| **FEAT-21** | Multi-Stage Franchise Pipeline | Tier 1 | Section 6 | `frontend/src/pages/admin/FranchiseApproval.jsx` | Text details 4 pipeline stages: Needs Review $\rightarrow$ For Payment $\rightarrow$ For Signing $\rightarrow$ Ready for Pickup. |
| **FEAT-22** | Progressive Traffic Sanctions | Tier 1 | Section 6 | `backend/src/models/violationModel.js` | Text documents 1st Offense (Warning) $\rightarrow$ 2nd (Suspension) $\rightarrow$ 3rd/Grave (Revocation). |
| **FEAT-23** | Batch MTOP Certificate Printing | Tier 1 | Section 6 | `docs/CAPSTONE_DEFENSE_MASTER_GUIDE.md:191` | Text documents batch print spooling of approved certificates with municipal seals. |
| **FEAT-24** | Franchise Masterlist Registry | Tier 1 | Section 6 | `frontend/src/pages/admin/FranchiseMasterlist.jsx` | Text details fleet search, historical archive filtering, and official PDF/CSV reporting. |
| **FEAT-25** | Dedicated Treasury Payment Terminal | Tier 1 | Section 7 | `frontend/src/pages/cashier/CashierDashboard.jsx` | Text documents cashier queue isolated from BPLO review permissions (separation of duties). |
| **FEAT-26** | Physical Official Receipt (OR) Serialization | Tier 1 / 4 | Section 7 | `docs/CAPSTONE_DEFENSE_MASTER_GUIDE.md:88` | Text mandates recording physical COA booklet serial numbers (`OR-GASAN-2026-XXXX`). |
| **FEAT-27** | COA Daily Remittance CSV & Turnover | Tier 1 / 4 | Section 7 | `frontend/src/pages/cashier/CashierDashboard.jsx` | Text documents 1-click export of `GTRAMS_Treasury_Daily_Remittance_<DATE>.csv` and turnover voucher. |
| **FEAT-28** | RBAC Governance & User Directory | Tier 1 | Section 8 | `frontend/src/pages/admin/UserManagement.jsx` | Text details 6 user roles, active socket presence tracking, and protected admin status. |
| **FEAT-29** | IT System Telemetry & Health | Tier 1 | Section 8 | `frontend/src/pages/admin/SystemAdminDashboard.jsx` | Text documents server uptime, Node v20 memory allocation, and MongoDB Atlas ping latency. |
| **FEAT-30** | Global Ordinance Policy Configuration | Tier 1 | Section 8 | `frontend/src/pages/admin/AdminSettings.jsx` | Text details franchise fees (₱500), validity (3yr/1yr), and maintenance mode kill switch. |
| **FEAT-31** | Automated Weekly Database Backup (DRP) | Tier 1 | Section 8 | `backend/src/services/backupService.js` | Text documents scheduled cron backup of all 13 collections every Sunday at 12:00 MN (8-wk retention). |
| **FEAT-32** | 1-Click Offline Snapshot (.json.gz) | Tier 1 | Section 8 | `frontend/src/pages/admin/AdminSettings.jsx` | Text documents direct download of compressed database state for offsite physical custody. |
| **FEAT-33** | Disaster Recovery Restore (`RESTORE`) | Tier 1 | Section 8 | `frontend/src/pages/admin/AdminSettings.jsx` | Text documents full database restoration requiring exact safety confirmation phrase `RESTORE`. |
| **FEAT-34** | Figma Document Architecture | Tier 1 / 2 | Deliverable Specs | `PROJECT.md:52` | Cover, TOC, Overview, 6 Role guides, Troubleshooting layout verified in deliverable. |
| **FEAT-35** | Visual Design Tokens & Palette | Tier 2 | Deliverable Styles | `frontend/tailwind.config.js` | Primary Maroon `#9E2A2B`, Accent Gold `#D4AF37`, Canvas `#F6F5F3`, Surface `#FFFFFF`. |
| **FEAT-36** | Numbered Figures & Captions | Tier 2 | Throughout Manual | `PROJECT.md:82` | All embedded screenshots captioned with "Figure X: [Title] — [Description]". |
| **FEAT-37** | Headless Chrome Build Engine | Tier 2 | `docs/generate_manual.js` | `docs/build_manual_pdf.js` | Automated Chrome print-to-pdf creates identical, reproducible PDF artifact. |
| **FEAT-38** | PDF Structure & Optical Margins | Tier 2 | PDF Specifications | `PROJECT.md:56` | A4 portrait, margins 20mm 15mm, page count $\ge 20$, file size $\ge 2.0$ MB, zero corruption. |
| **FEAT-39** | End-to-End Role Lifecycle | Tier 3 | Cross-Cutting | `survey_codebase_explorer/handoff.md` | Verification of sequential handoff across Operator $\rightarrow$ TODA $\rightarrow$ Cashier $\rightarrow$ BPLO $\rightarrow$ Admin. |
| **FEAT-40** | Authentic Tone (Zero AI Fluff) | Tier 4 | Full Document | `ORIGINAL_REQUEST.md:5,33` | 0 occurrences of banned AI boilerplate; authentic municipal ordinance and statutory references. |

---

## 4. Test Architecture & Directory Layout

The automated testing infrastructure is organized under `tests/` in the project root:

```
c:\Users\Hp\GTRAMS\
├── tests/
│   ├── __init__.py                     # Package marker
│   ├── conftest.py                     # Shared PDF text extraction & fixture caching
│   ├── test_tier1_feature_coverage.py  # Tier 1: All 6 roles, metadata, and procedures
│   ├── test_tier2_boundary_corner.py   # Tier 2: PDF structure, pages >= 20, size >= 2MB, no NaN
│   ├── test_tier3_cross_feature.py     # Tier 3: Sequential role lifecycle & handoffs
│   ├── test_tier4_acceptance.py        # Tier 4: Zero AI fluff, legal citations, municipal names
│   └── run_all_tests.py                # Master CLI test runner & reporter with exit codes
├── docs/
│   ├── Deliverable7_Group5_UsersManual.pdf   # Target deliverable under test
│   ├── Deliverable7_Group5_UsersManual.html  # HTML source document
│   └── manual_assets/                        # 17 authentic screenshot figures
├── TEST_INFRA.md                       # Root test infrastructure documentation
└── TEST_READY.md                       # Comprehensive test execution summary & pass report
```

### Shared Fixture Caching (`conftest.py`)
To prevent redundant PDF disk reads and decompression overhead across multiple test classes, `conftest.py` implements a singleton `PDFDocumentInspector` that:
1. Loads `docs/Deliverable7_Group5_UsersManual.pdf` once.
2. Extracts page counts, byte size, raw text per page, and total concatenated text.
3. Provides helper search methods: `contains_phrase(regex)`, `find_all_fluff()`, `get_page_text(n)`.
4. Records start time and execution telemetry.

---

## 5. Execution Instructions

### Running the Entire Suite
To run all 4 tiers with the rich formatted summary report:
```powershell
python tests/run_all_tests.py
```

### Running Individual Tiers via Python `unittest`
```powershell
# Tier 1: Feature Coverage
python -m unittest tests/test_tier1_feature_coverage.py -v

# Tier 2: Boundary & Corner Cases
python -m unittest tests/test_tier2_boundary_corner.py -v

# Tier 3: Cross-Feature Lifecycle Workflows
python -m unittest tests/test_tier3_cross_feature.py -v

# Tier 4: Real-World Acceptance Scenarios
python -m unittest tests/test_tier4_acceptance.py -v
```

### Command Exit Codes
- `0`: All tests passed (100% compliance).
- `1`: One or more tests failed (defects logged for remediation).
