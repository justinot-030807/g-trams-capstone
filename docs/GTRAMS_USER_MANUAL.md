# Deliverable #7: User's Manual of the System
## Gasan Tricycle Regulatory and Automated Management System (G-TRAMS)

**Document Identification:** G-TRAMS Deliverable #7 (User's Manual of the System)  
**System Version:** Production Release v2.4.0  
**Target LGU:** Municipality of Gasan, Province of Marinduque  
**Authorizing Entity:** Office of the Municipal Mayor HON. LIDANY A. LAO-BALDO & Sangguniang Bayan of Gasan  
**Academic Institution:** Marinduque State University (MarSU) — College of Information and Computing Sciences (CICS)  
**Department:** Department of Information Technology (BSIT Capstone Project)  
**Institutional Address:** Panfilo M. Manguera Sr. Rd., Brgy. Tanza, Boac, Marinduque, Philippines 4900  
**Project Group Authors (Group 5):**
- **Jhon Kyn Axix H. Cabrigas** — Lead Backend Developer & Database Architect
- **Justine S. Lachica** — Frontend Lead & UI/UX Designer
- **Jay Vincent G. Motol** — Quality Assurance Lead & Systems Analyst
- **Ian Simon Francis M. Rey** — DevOps Engineer & Cloud Infrastructure Specialist
**Live System Deployment URL:** [https://g-trams-official.vercel.app/](https://g-trams-official.vercel.app/)  
**Document Release Date:** November 7, 2026  
**Academic Year:** 2026–2027  

---

### Document Revision History

| Version | Release Date | Primary Author(s) | Summary of Changes / Operational Milestones |
|---|---|---|---|
| **v1.0.0** | September 14, 2026 | Group 5 (CICS) | Initial functional baseline drafted for Capstone Proposal Defense; preliminary system overview and wireframe workflows. |
| **v1.8.0** | October 18, 2026 | Justine S. Lachica, Jay Vincent G. Motol | Midterm documentation release incorporating multi-role authentication, 5-step operator MTOP wizard, and BPLO approval queue. |
| **v2.2.0** | November 2, 2026 | Jhon Kyn Axix H. Cabrigas, Ian Simon Francis M. Rey | Integration of Gemini Vision AI OCR parsing, COA-mandated physical OR serialization, and automated Sunday 12:00 MN disaster recovery backups. |
| **v2.4.0** | November 7, 2026 | Group 5 (CICS) | Final comprehensive production release for Final Capstone Defense and LGU Turn-over; full 6-role manual, 17 numbered figure integration, and verified municipal policies. |

---

### Executive Table of Contents

1. [Section 1: System Overview & Citizen's Charter](#section-1-system-overview--citizens-charter)
   - 1.1 Municipal Mandate & Legal Framework
   - 1.2 The 5-Step Application Lifecycle
   - 1.3 Geographic Scope & Route Zones (25 Barangays, 3 Zones)
   - 1.4 Transport Associations Directory (17 Accredited TODAs)
   - 1.5 System Hardware, Software & Network Requirements
2. [Section 2: Shared Authentication & Security Infrastructure](#section-2-shared-authentication--security-infrastructure)
   - 2.1 Multi-Identifier Login Architecture
   - 2.2 Account Registration with Secondary Recovery Contact
   - 2.3 Multi-Channel Password Recovery via 6-Digit OTP
   - 2.4 Role-Based Access Control (RBAC) Governance Matrix
3. [Section 3: Public Visitor & Passenger Guide](#section-3-public-visitor--passenger-guide)
   - 3.1 Navigating the Public Citizen's Portal & Announcements
   - 3.2 Roadside Mobile Camera QR Verification (`/verify/:id`)
   - 3.3 Official Municipal Fare & Tariff Matrix Calculation
4. [Section 4: Tricycle Operator Guide](#section-4-tricycle-operator-guide)
   - 4.1 Operator Garage Dashboard & Fleet Quota Limit (Max 2 Units)
   - 4.2 5-Step Online MTOP Application Wizard
   - 4.3 Multimodal AI OCR Document Intake & Dual LTO Segregation
   - 4.4 Data Minimization Compliance (RA 10173)
   - 4.5 Digital MTOP Certificate & Watermarked e-Copy Retrieval
   - 4.6 Voluntary Franchise Cancellation & Support Ticketing
5. [Section 5: TODA President Guide](#section-5-toda-president-guide)
   - 5.1 Association Member Directory & Status Verification
   - 5.2 Gemini Vision AI OCR Digitization of Paper Rosters
   - 5.3 Association Body Number Collision Prevention
   - 5.4 Individual Member Enrollment & Clearance Endorsement
   - 5.5 Member Delisting & Removal Requests
6. [Section 6: BPLO Licensing Officer Guide](#section-6-bplo-licensing-officer-guide)
   - 6.1 Operations Dashboard & Franchise Pipeline Telemetry
   - 6.2 Dual-Pane Document Review Console & AI OCR Discrepancy Checks
   - 6.3 Multi-Stage Franchise Approval Pipeline
   - 6.4 Progressive Traffic Sanctions & Disciplinary Enforcement
   - 6.5 Batch MTOP Certificate Printing & Transmittal Generation
   - 6.6 Municipal Franchise Masterlist Registry & PDF Export
7. [Section 7: Municipal Cashier Guide](#section-7-municipal-cashier-guide)
   - 7.1 Isolated Treasury Payment Terminal & Security Controls
   - 7.2 Over-the-Counter Cash Collection & Fee Breakdown
   - 7.3 Mandatory Physical Official Receipt (OR) Serialization (`OR-GASAN-2026-XXXX`)
   - 7.4 COA Daily Remittance CSV Export & Turnover Voucher Printing
8. [Section 8: System Administrator & IT Operations Guide](#section-8-system-administrator--it-operations-guide)
   - 8.1 Server Telemetry, Runtime Memory & MongoDB Atlas Health
   - 8.2 User Accounts Directory & Real-Time Socket Presence Tracking
   - 8.3 Global Ordinance Policy & System Fee Configuration
   - 8.4 Disaster Recovery Protocol (DRP): Weekly Backups, Offline Snapshots & Database Restore
   - 8.5 Communications Dispatch & Helpdesk Ticketing Center
9. [Section 9: Troubleshooting, FAQs & Support Directory](#section-9-troubleshooting-faqs--support-directory)
   - 9.1 Comprehensive Error Resolution Matrix
   - 9.2 Frequently Asked Questions (FAQs)
   - 9.3 LGU Office Directory & Official Support Channels

---

## Section 1: System Overview & Citizen's Charter

### 1.1 Municipal Mandate & Legal Framework
The **Gasan Tricycle Regulatory and Automated Management System (G-TRAMS)** is an automated municipal e-governance platform commissioned by the Local Government Unit (LGU) of Gasan, Province of Marinduque. Designed and implemented by Marinduque State University - College of Information and Computing Sciences (MarSU CICS) BSIT Capstone Group 5, G-TRAMS transitions the municipality from fragmented, paper-heavy tricycle licensing to a centralized, cloud-native regulatory ecosystem.

The system enforces municipal compliance under several key national and local statutes:
1. **Republic Act No. 7160 (The Local Government Code of 1991):** Section 447 (a)(3)(vi) delegates the franchising and regulation of motorized tricycles-for-hire to the Sangguniang Bayan and the Municipal Mayor through the Municipal Tricycle Franchising and Regulatory Board (MTFRB).
2. **Municipal Franchising Ordinance Section 4 (Fleet Ceiling):** Establishes an individual operator ceiling of **maximum two (2) motorized tricycle units** to eliminate monopoly, ensure equitable livelihood distribution among Gasan transport workers, and curb unauthorized subleasing.
3. **Republic Act No. 11032 (Ease of Doing Business and Efficient Government Service Delivery Act of 2018):** Enforces strict Service Level Agreements (SLAs), mandating simple transactions to be completed within three (3) working days and complex regulatory evaluations within seven (7) working days through streamlined digital queues.
4. **Republic Act No. 10173 (Data Privacy Act of 2012):** Strictly mandates **Data Minimization**; personal and sensitive biometric markers (such as blood type) are deliberately excluded from automated OCR extraction routines, storing only legally mandated licensing attributes.
5. **Commission on Audit (COA) Circulars:** Requires strict financial audit trails for public revenue collection; fee settlement is strictly restricted to over-the-counter Cashier operations tied to physical, serialized Official Receipt (OR) booklets (`OR-GASAN-2026-XXXX`).

---

### 1.2 The 5-Step Application Lifecycle
G-TRAMS establishes an immutable, 5-stage Citizen's Charter workflow ensuring absolute transparency across applicant submission, administrative verification, fiscal receipting, executive approval, and permit issuance:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          G-TRAMS 5-STEP APPLICATION LIFECYCLE                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
  [Step 1: Online Filing] ──> Operator submits digital application, specs, and documents via
                              5-Step Wizard; Gemini Vision AI performs OCR pre-check.
                              Status: PENDING REVIEW
                                      │
                                      ▼
  [Step 2: BPLO Scrutiny] ──> BPLO Licensing Officer examines credentials in Dual-Pane Console,
                              cross-checks AI discrepancy tags, and schedules vehicle inspection.
                              Status: FOR PAYMENT
                                      │
                                      ▼
  [Step 3: Treasury Settlement] ──> Operator settles assessed ₱500 fee at Cashier Counter 2;
                                    Cashier logs physical booklet number (OR-GASAN-2026-XXXX).
                                    Status: FOR SIGNING
                                      │
                                      ▼
  [Step 4: Mayoral Sign-Off] ──> Municipal Mayor (Hon. Lidany A. Lao-Baldo) and MTFRB executive
                                 endorse validated franchise certificate.
                                 Status: READY FOR PICKUP
                                      │
                                      ▼
  [Step 5: Physical Release] ──> Operator claims physical sticker and embossed permit at BPLO;
                                 instant e-Copy with dynamic QR activates on mobile device.
                                 Status: ACTIVE (3-Yr New / 1-Yr Renewal)
```

---

### 1.3 Geographic Scope & Route Zones
The territorial jurisdiction of G-TRAMS covers all **25 official Barangays** of the Municipality of Gasan, categorized into **three (3) distinct operational route zones**:

1. **Central Zone (Poblacion Town Proper Loop):**
   - *Constituent Barangays:* Barangay I (Poblacion), Barangay II (Poblacion), Barangay III (Poblacion).
   - *Operational Scope:* Commercial center, Gasan Municipal Hall, Gasan Public Market, Gasan Parish Church, and coastal port terminal. Characterized by high-frequency short-distance passenger loops.
2. **North Zone (Northern Coastal & Upland Route):**
   - *Constituent Barangays:* Bahi, Bangbang, Cabugao, Mangiliol, Masiga, Tapuyan, Tiguion.
   - *Operational Scope:* Connects northern agriculture and fishing barangays to the town proper via the Marinduque Circumferential Road.
3. **South Zone (Southern Coastal & Interior Valley Route):**
   - *Constituent Barangays:* Antipolo, Bachao Ibaba, Bachao Ilaya, Bacong-Bacong, Banot, Banuyo, Bognuyan, Dawis, Dili, Libtangin, Mahunig, Matandang Gasan, Pangi, Pinggan, Tabionan.
   - *Operational Scope:* Long-distance rural and coastal connectivity, servicing agricultural cooperatives, schools, and health stations.

---

### 1.4 Transport Associations Directory (17 Accredited TODAs)
Every franchised tricycle in Gasan must affiliate with an accredited Tricycle Operators and Drivers Association (TODA) or register under the monitored independent municipal fleet:

| # | Association Acronym | Full Association Legal Name | Designated Zone | Primary Route Corridor |
|---|---|---|---|---|
| 1 | **BATODA** | Bachao Tricycle Operators & Drivers Association | South | Bachao Ibaba / Ilaya to Gasan Poblacion |
| 2 | **POB TODA** | Poblacion Central TODA | Central | Poblacion Town Proper Interior Loop |
| 3 | **GT TODA** | Gasan-Tapuyan TODA | North | Poblacion to Brgy. Tapuyan Corridor |
| 4 | **LUG TODA** | Libtangin United Drivers & Operators Association | South | Libtangin to Gasan Public Market |
| 5 | **NBI TODA** | North Bay Interstate Transport Association | South | Southern boundary coastal routes |
| 6 | **BANGBANG IPIL TODA** | Bangbang-Ipil Tricycle Association | North | Brgy. Bangbang and upland routes |
| 7 | **TAB TODA** | Tabionan Transport Association | South | Tabionan interior valley to town proper |
| 8 | **TIGUION TODA** | Tiguion Tricycle Association | North | Tiguion coastal port to Poblacion |
| 9 | **MASIGA TODA** | Masiga Transport Operators Association | North | Masiga farming communities route |
| 10 | **MAT TODA** | Matandang Gasan Operators & Drivers Association | South | Matandang Gasan historic road loop |
| 11 | **PG TODA** | Pinggan Transport Association | South | Pinggan coastal shoreline to town proper |
| 12 | **4B TODA** | Four-Barangays Unified Association | North | Inter-barangay northern arterial link |
| 13 | **DPAB TODA** | Dawis-Pangi-Antipolo-Bognuyan Unified TODA | South | Major southern arterial highway route |
| 14 | **ILAYA TODA** | Ilaya Transport Drivers Association | South | Upland river valley and interior roads |
| 15 | **GASAN CENTRAL TODA** | Gasan Central Commercial Drivers Association | Central | Municipal terminal hub and commercial centers |
| 16 | **BAHI TODA** | Bahi Operators & Drivers Association | North | Northern border boundary to Boac |
| 17 | **NON-TODA** | Municipal Independent Commercial Franchise | All Zones | Monitored non-affiliated commercial units |

---

### 1.5 System Hardware, Software & Network Requirements
G-TRAMS operates as a responsive web application and installable Progressive Web Application (PWA). It does not require proprietary client installations.

- **Client Devices:**
  - *Public & Operators:* Android smartphones (Android 8.0+), Apple iPhones (iOS 13+), tablets, or laptops.
  - *Municipal Staff (BPLO, Cashier, IT):* Desktop PC or laptop with minimum 1366 × 768 display (1920 × 1080 recommended for dual-pane document scrutiny).
- **Supported Web Browsers:** Google Chrome v100+, Microsoft Edge v100+, Mozilla Firefox v100+, Apple Safari v15+.
- **Network Connectivity:**
  - Field Roadside QR Verification: 3G/4G/5G mobile cellular data (minimum 1 Mbps).
  - Municipal Hall Workstations: Local broadband or Wi-Fi (minimum 5 Mbps).
- **Hardware Peripherals (Treasury & BPLO):** Standard office laser/inkjet printer for batch MTOP certificate printing (`A4 portrait`) and receipt turnover vouchers; handheld barcode/QR scanner (optional, standard camera supported).

---

## Section 2: Shared Authentication & Security Infrastructure

```
                               ┌────────────────────────────────┐
                               │   G-TRAMS Authentication Portal │
                               │   (https://g-trams.../login)   │
                               └───────────────┬────────────────┘
                                               │
                                ┌──────────────┴──────────────┐
                                │ Multi-Identifier Login Form │
                                │ Email or 09XXXXXXXXX Phone  │
                                └──────────────┬──────────────┘
                                               │
                         ┌─────────────────────┴─────────────────────┐
                         ▼                                           ▼
               [Credential Verification]                     [Forgot Password?]
               Bcrypt hash check in Atlas                   Dispatches 6-digit OTP
                         │                                           │
                         ▼                                           ▼
               [JWT Session Granted]                         [Reset Verification]
          Role-Based Access Control Matrix               SMS/Email OTP Authenticated
                         │                                           │
         ┌───────────────┼───────────────┬───────────────┐           ▼
         ▼               ▼               ▼               ▼     [New Password Saved]
   [Operator]       [TODA Pres]      [BPLO Staff]   [Sys Admin]
  (/operator-dash)  (/submit-members) (/bplo-dash)   (/admin-dash)
```

### 2.1 Multi-Identifier Login Architecture
To ensure accessibility for all tricycle operators—regardless of whether they utilize email or mobile smartphones—G-TRAMS features a multi-identifier authentication engine:
1. Open any web browser and navigate to the official production URL: `https://g-trams-official.vercel.app/login`.
2. Locate the login card on the right-hand side of the portal interface.
3. In the primary identifier input field, enter either:
   - Your **11-digit Philippine mobile number** (e.g., `09123456789`), or
   - Your **verified email address** (e.g., `juan.delacruz@gmail.com`).
4. Enter your secure account password in the password field. You may click the eye icon glyph to temporarily toggle password visibility.
5. Click the maroon **"Log In"** button. The server validates the bcrypt-hashed credentials, establishes an authenticated JSON Web Token (JWT) session in secure browser storage, and automatically routes you to your authorized role dashboard.

---

### 2.2 Account Registration with Secondary Recovery Contact
To eliminate permanent account lockouts—a frequent issue among transport workers when mobile SIM cards are lost or damaged—G-TRAMS enforces the collection of a secondary recovery contact:
1. On the landing page or login terminal, click the gold **"Register"** button.
2. In the registration form, input your **Full Legal Name** (First Name, Middle Name, Surname) matching your government-issued identification.
3. Enter your **Primary Mobile Phone Number** (used for routine application status notifications).
4. Enter a mandatory **Secondary Recovery Contact** (a family member's phone number or alternative email address). The system cross-validates to ensure the primary and recovery contacts are not identical.
5. Select your official **Barangay Residency** from the dropdown menu containing Gasan's 25 barangays.
6. Select your affiliated **TODA Association** and enter your assigned tricycle body number.
7. Configure a password consisting of at least eight (8) characters, including an uppercase letter and a numeric digit.
8. Click **"Create Account"**. Enter the 6-digit One-Time PIN (OTP) dispatched to your contact to finalize account activation.

---

### 2.3 Multi-Channel Password Recovery via 6-Digit OTP
If an operator or administrative officer misplaces account credentials:
1. From the login interface, click the **"Forgot Password?"** link located beneath the password input.
2. The system renders the password recovery interface featuring the red security shield icon.
3. Enter your registered primary mobile number, email address, or secondary recovery contact.
4. Click the maroon **"Send Reset Code"** button.
5. The backend dispatches a randomized 6-digit numeric OTP valid for exactly **five (5) minutes**.
6. Enter the 6-digit code into the verification input. If the code is valid and within the active window, the interface presents new password creation fields.
7. Input and confirm your new password, then click **"Update Password"**. The record is updated in MongoDB Atlas with cryptographic salt, and you are redirected to login.

---

### 2.4 Role-Based Access Control (RBAC) Governance Matrix
G-TRAMS enforces strict Separation of Duties (SoD) through server-side middleware (`authMiddleware.js`). Role permissions are partitioned as follows:

| Functional Module / Capability | Public Visitor | Tricycle Operator | TODA President | BPLO Officer | Municipal Cashier | System Administrator |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Citizen's Charter & Announcements | **Read** | **Read** | **Read** | **Read** | **Read** | **Read** |
| Roadside QR Verification (`/verify/:id`) | **Read** | **Read** | **Read** | **Read** | **Read** | **Read** |
| Online MTOP Filing Wizard | ❌ | **Full** | **Full** | ❌ | ❌ | ❌ |
| Fleet Garage & Digital e-Copy | ❌ | **Full** | **Full** | ❌ | ❌ | ❌ |
| Association Roster Upload & OCR | ❌ | ❌ | **Full** | **Review** | ❌ | ❌ |
| Member Endorsement & Delisting | ❌ | ❌ | **Full** | **Adjudicate** | ❌ | ❌ |
| Dual-Pane Document Review & OCR | ❌ | ❌ | ❌ | **Full** | ❌ | ❌ |
| Application Queue Approval/Reject | ❌ | ❌ | ❌ | **Full** | ❌ | ❌ |
| Traffic Sanctions & Violations | ❌ | ❌ | ❌ | **Full** | ❌ | ❌ |
| Cash Collection & OR Serialization | ❌ | ❌ | ❌ | ❌ | **Full** | ❌ |
| COA Daily Remittance CSV Export | ❌ | ❌ | ❌ | ❌ | **Full** | ❌ |
| User Directory & RBAC Governance | ❌ | ❌ | ❌ | ❌ | ❌ | **Full** |
| System Policy & Fee Schedules | ❌ | ❌ | ❌ | ❌ | ❌ | **Full** |
| Disaster Recovery Backup & Restore | ❌ | ❌ | ❌ | ❌ | ❌ | **Full** |
| IT Server Telemetry & Latency | ❌ | ❌ | ❌ | ❌ | ❌ | **Full** |

*Critical Guardrail:* System Administrators are strictly restricted to IT maintenance, user governance, database security, and telemetry. System Administrators cannot review, approve, or reject franchise applications. Municipal Cashiers are strictly restricted to fee collection and cannot alter permit details or reject applications.

---

## Section 3: Public Visitor & Passenger Guide

### 3.1 Navigating the Public Citizen's Portal & Announcements
The public landing page (`https://g-trams-official.vercel.app/`) serves as Gasan's digital municipal portal for public transport:
1. **Header Navigation:** Features the official seal of the Municipality of Gasan, the G-TRAMS logo, and quick links to Home, Log In, and Register.
2. **Hero Section:** Summarizes the municipal mission of the Sangguniang Bayan and MTFRB, providing immediate call-to-action buttons for operators and citizens.
3. **Public Telemetry Counters:** Displays live municipal statistics retrieved from the database:
   - *Registered Operators:* Real-time count of accredited transport operators.
   - *Accredited TODAs:* 17 active transport associations.
   - *Active Franchises:* Verified compliant commercial tricycles operating in Gasan.
4. **Municipal Announcements Carousel:** Displays active municipal advisories, traffic rerouting announcements during municipal fiestas, and Sangguniang Bayan fare ordinance updates.

---

### 3.2 Roadside Mobile Camera QR Verification (`/verify/:id`)
Passengers, law enforcement officers, and visitors can independently verify the legitimacy of any commercial tricycle without creating an account or logging in:
1. Locate the official physical **G-TRAMS QR Code Sticker** affixed to the tricycle's windshield or passenger sidecar, or ask the driver to present their digital operator ID.
2. Open the native camera application or any QR scanner on your smartphone.
3. Scan the QR code. The device automatically navigates to the secure verification route:
   `https://g-trams-official.vercel.app/verify/:id`
4. The system queries the production database and renders the verified operator card:
   - **Verification Header:** Displays the seal of Gasan and a green **"VALID LGU GASAN FRANCHISE"** badge (or red **"EXPIRED / REVOKED"** alert).
   - **Operator Credentials:** Full legal name, official profile photograph, and contact details.
   - **Vehicle Technical Specifications:** LTO Plate Number, Engine/Motor Number, Chassis/VIN Number, Make/Model, and designated Body Number.
   - **Association & Route Assignment:** Affiliated TODA (e.g., *Gasan Central TODA*), designated Route Zone (*Central Poblacion Loop*), and validity expiration date.
5. If an unverified or fraudulent QR code is scanned, the terminal immediately displays:
   `"Verification Failed: Operator not found or invalid QR code."`

---

### 3.3 Official Municipal Fare & Tariff Matrix Calculation
G-TRAMS provides transparent, automated calculation of authorized passenger fares pursuant to the latest Sangguniang Bayan Municipal Fare Ordinance:
1. **Base Regular Fare:** **₱15.00** for the first kilometer within town proper or designated zone boundaries.
2. **Succeeding Kilometer Rate:** **₱2.50** for every additional kilometer traveled beyond the first kilometer.
3. **Mandatory 20% Discount:** By virtue of Republic Act No. 11364 and municipal ordinance, students, senior citizens, and Persons with Disability (PWD) are entitled to a mandatory 20% discount on the total assessed fare:
   $$\text{Discounted Fare} = \text{Regular Fare} \times 0.80$$
4. **Complaint Mechanism:** In the event of fare overcharging or refusal to convey passengers, citizens can note the vehicle's body number and plate number and file an immediate complaint through the BPLO Helpdesk Hotline at `(042) 342-1234` or email `support@gasan.ph`.

---

## Section 4: Tricycle Operator Guide

### 4.1 Operator Garage Dashboard & Fleet Quota Limit (Max 2 Units)
Upon logging into an Operator account, the system renders the Operator Garage Dashboard:
1. **Fleet Quota Progress Bar (Section 4 Enforcement):** Prominently displays current unit capacity:
   - When holding 0 units: `Unit Capacity 0 / 2 — 2 Slots Available`
   - When holding 1 unit: `Unit Capacity 1 / 2 — 1 Slot Available`
   - When holding 2 units: `Unit Capacity 2 / 2 Reached — Quota Ceiling Enforced`
   *If an operator attempts to file a third application, the system hard-locks the application form, rendering an alert citing Section 4 of the Municipal Franchising Ordinance.*
2. **My Franchise Garage:** Card-based overview of registered units displaying:
   - LTO Plate Number, Body Number, TODA Association, and Route Zone.
   - Real-time validity countdown (e.g., `364 Days Remaining`).
   - Active status pill: `Active` (Green), `For Payment` (Amber), `Needs Attention` (Red).
3. **Application Lifecycle Progress Tracker:** Real-time visual milestone bar showing current progress:
   `Applied` $\rightarrow$ `Pending Review` $\rightarrow$ `For Payment` $\rightarrow$ `For Signing` $\rightarrow$ `Ready for Pickup` $\rightarrow$ `Active`.
4. **"Fix Issues" Direct Resolution Button:** If an application is flagged by BPLO for blurry images or document mismatches, a red warning banner appears. Clicking **"Fix Issues"** opens the application wizard directly jumped to the erroneous step with the specific discrepancy highlighted in yellow.

---

### 4.2 5-Step Online MTOP Application Wizard
The online application wizard (`/apply-franchise`) enables operators to complete municipal filings from home:

- **Step 1: Operator & Driver Credentials:**
  - Select application mode: **New Franchise**, **Annual Renewal**, or **Transfer/Dropping**.
  - Review pre-populated legal name and barangay residence.
  - Select whether the operator is also the active driver (`isOperatorDriver = true`). If hired driver, input the driver's full legal name and active mobile number.
  - Upload front photo of Driver's License; specify Driver's License Number and Expiration Date.
- **Step 2: Tricycle Vehicle Technical Specifications:**
  - Enter LTO Plate Number (e.g., `123-ABC`), Motor Number, and Chassis Number.
  - Enter Vehicle Make/Brand (e.g., `Honda TMX 125`, `Kawasaki Barako II`) and Model Year.
  - System executes a real-time background query to ensure the plate, engine, and chassis numbers are not already registered to another active franchise.
- **Step 3: TODA Endorsement & Barangay Clearance:**
  - Select affiliated TODA association.
  - If verified in the digital roster, a green badge displays: `✓ Verified in Roster`.
  - If unverified, the system prompts for an uploaded physical TODA Clearance signed by the TODA President.
  - Input Barangay Clearance control number, issue date, and upload document scan.
- **Step 4: Community Tax Certificate (Cedula / CTC):**
  - Input Cedula Serial Number and Date of Issuance.
  - Upload photo of the current fiscal year Cedula issued by the Municipality of Gasan.
- **Step 5: Review & Affidavit of Authenticity:**
  - Comprehensive summary card displaying all extracted and inputted fields.
  - Operator must review all data and check the mandatory legal affirmation:
    *"I hereby certify under penalty of perjury pursuant to Article 172 of the Revised Penal Code that all information and uploaded documents are authentic and valid."*
  - Click **"Submit Application"**. The system caches state in local browser storage (`localforage`) so interrupted sessions can be resumed without data loss.

---

### 4.3 Multimodal AI OCR Document Intake & Dual LTO Segregation
G-TRAMS incorporates Google Gemini Vision AI (`gemini-3.8-flash`) to automate document data entry:
1. **Dual LTO Document Segregation:** The system provides independent, dedicated upload slots for the **Certificate of Registration (CR)** and the latest **Official Receipt (OR)**. This guarantees that vehicle technical specifications (chassis, engine, make) from the CR and current annual roadworthiness validity from the OR are verified independently.
2. **Automated Field Population:** When an operator uploads an image of a Driver's License or CR, the AI OCR engine scans the image in real time, extracting the License Number, Expiry Date, Plate Number, Motor Number, and Chassis Number, immediately pre-filling the corresponding form inputs.
3. **Clarity & Validity Pre-Checks:** If an uploaded document is blurry, cut off, or illegible, the OCR confidence score triggers an immediate warning:
   `"Document Image Unclear: Please ensure all text and seals are clearly visible under good lighting."`

---

### 4.4 Data Minimization Compliance (RA 10173)
In strict compliance with the **Data Privacy Act of 2012 (Republic Act No. 10173)**, G-TRAMS implements privacy-by-design:
1. **Omission of Non-Essential Biometrics:** Driver's License OCR extraction schemas deliberately exclude the driver's blood type, organ donor status, and biometric weight/height indicators.
2. **Purpose Specification:** The system extracts only licensing credentials legally mandated by the Sangguniang Bayan for public transport regulation: Driver's License Number, Expiry Date, Driver's License Restriction Codes (Code A / A1 for motorcycles/tricycles), and Date of Birth for age verification.
3. **Encrypted Storage:** All uploaded document files are stored in secure, access-controlled cloud repositories with cryptographically signed access tokens.

---

### 4.5 Digital MTOP Certificate & Watermarked e-Copy Retrieval
Once an application reaches the `Active` or `Ready for Pickup` milestone:
1. From the Operator Dashboard, locate the active unit card and click **"View E-Copy"**.
2. The system renders the full-screen electronic Motorized Tricycle Operator's Permit (e-Copy MTOP):
   - **Municipal Header:** Features the official seal of Gasan, Sangguniang Bayan heading, and MTFRB authorization.
   - **Security Watermark:** High-contrast diagonal watermark reading:
     `"APPROVED - ELECTRONIC COPY • VALID ISSUANCE"`
   - **Dynamic Verification QR Code:** Encrypted link resolving to `/verify/:id`.
   - **Executive Signature Block:** Digital municipal seal and authorization of Municipal Mayor **HON. LIDANY A. LAO-BALDO**.
3. Operators can present this digital certificate on their mobile devices during roadside inspections as legal proof of franchise compliance pending physical sticker attachment.

---

### 4.6 Voluntary Franchise Cancellation & Support Ticketing
- **Voluntary Cancellation:** If an operator sells their vehicle, ceases commercial operations, or migrates, they can click **"Request Voluntary Cancellation"** in their dashboard. The modal requires selecting an official ground ("Vehicle Sold", "Out of Service", "Transfer of Residence") and entering explanatory remarks. The request routes to the BPLO queue for dropping certification.
- **Helpdesk Support Ticketing:** If an operator encounters technical or administrative issues:
  1. Navigate to **"Help & Support"** from the sidebar.
  2. Complete the support ticket form: Select Subject Category (*Franchise Application Issue*, *Cashier Payment Inquiry*, *Account Recovery*, *Other*).
  3. Enter your active contact number and detailed message.
  4. Click **"Submit Ticket"**. Municipal IT staff receive the ticket immediately in their administrative dispatch center.

---

## Section 5: TODA President Guide

### 5.1 Association Member Directory & Status Verification
TODA Presidents are granted administrative authority over their respective association directories:
1. Log in with verified TODA President credentials. The system routes you to the **"Submit Members / Association Roster"** console (`/submit-members`).
2. **Association Header:** Displays your accredited association name (e.g., *GASAN CENTRAL TODA*), active member tally, pending applicant count, and fleet size.
3. **Tab 1: Member Roster:** Filterable table displaying all recognized drivers:
   - Operator Full Legal Name, Assigned Body Number, LTO Plate Number, Registered Mobile Contact, and Active Franchise Status (`Active`, `Pending`, `Expired`).
   - Search bar enables instant lookup by driver name, body number, or plate.
   - Click **"Print Roster"** to generate an official certified paper association masterlist for submission to the Sangguniang Bayan.

---

### 5.2 Gemini Vision AI OCR Digitization of Paper Rosters
For associations with historical paper logbooks, G-TRAMS features an instant document digitization engine:
1. In the TODA console, select **Tab 2: "Upload Roster Document"**.
2. Take a clear smartphone photograph or scan of your physical paper membership sheet (`.jpg`, `.png`, or `.pdf`).
3. Click the upload target zone and select the file.
4. Click **"Process Roster with AI OCR"**. The background Google Gemini Vision engine reads the tabular document layout, extracting:
   - Driver Full Name, Unit Body Number, and Vehicle Plate Number.
5. **Interactive Review & Inline Correction Table:** The extracted members populate an editable staging table. The TODA President can review each row, edit any misread characters, delete invalid rows, or click **"+ Add Member"** to append additional drivers manually.
6. Once validated, click **"Submit Certified Roster to BPLO"**. The roster is saved to the database and indexed for instant validation during operator application filing.

---

### 5.3 Association Body Number Collision Prevention
G-TRAMS enforces strict uniqueness of tricycle body numbers within every association:
1. When enrolling a new driver or editing a roster entry, the system evaluates the entered body number against all active units in that association.
2. If the body number is unique, a green checkmark appears: `✓ Body Number Available`.
3. If the body number is already assigned to another driver, the system immediately blocks the entry with an amber warning:
   `"Duplicate Body Number Detected: Unit #X is already registered to [Driver Name]. Body number collision prevented."`
4. This mechanism eliminates duplicate body numbers, preventing colorum units from sharing decals.

---

### 5.4 Individual Member Enrollment & Clearance Endorsement
To enroll an individual operator into the association:
1. Click the **"Add Single Member"** button above the roster table.
2. Input the operator's Full Legal Name, Assigned Body Number, Plate Number, and Mobile Contact.
3. If the operator requires a municipal clearance endorsement, click **"Issue Association Clearance"**.
4. The system generates an authenticated digital endorsement record that automatically verifies the operator when they submit their online MTOP application.

---

### 5.5 Member Delisting & Removal Requests
If an operator resigns, relocates, or violates association bylaws:
1. Select **Tab 3: "Removal Requests"**.
2. Click **"Request Member Delisting"** and select the member from the active roster.
3. Select the formal justification ground:
   - *No longer operating / Inactive commercial unit*
   - *Transferred to another TODA or municipality*
   - *Violation of TODA Bylaws / Disciplinary suspension*
   - *Unauthorized / Fraudulent membership claim*
   - *Failure to settle association dues / Non-attendance*
4. Input specific details and click **"Submit Delisting to BPLO"**. BPLO officers receive the petition in their management queue for final adjudication.

---

## Section 6: BPLO Licensing Officer Guide

### 6.1 Operations Dashboard & Franchise Pipeline Telemetry
The Business Permits and Licensing Office (BPLO) serves as the primary regulatory authority:
1. Log in with BPLO credentials. The system opens the **BPLO Operations Dashboard** (`/bplo-dashboard`).
2. **Executive KPI Cards:**
   - *Active Franchises:* Total valid commercial tricycles operating in Gasan.
   - *Pending Approvals:* Applications awaiting initial document scrutiny.
   - *In Pipeline:* Total units currently transitioning through inspection, payment, or signing.
   - *Expiring & Expired Units:* Units within 30 days of permit lapse or past validity.
3. **Real-Time Queue Status Indicators:**
   - `Needs Review (Pending)`: Fresh submissions requiring document verification.
   - `For Payment`: Applications vetted by BPLO, awaiting fee settlement at Treasury.
   - `For Signing`: Paid applications awaiting Mayoral and MTFRB signature endorsement.
   - `Ready for Pickup`: Approved permits awaiting physical sticker release.
4. **TODA Fleet Distribution Chart:** Live breakdown of active tricycle allocations across Gasan's 17 accredited associations.

---

### 6.2 Dual-Pane Document Review Console & AI OCR Discrepancy Checks
Clicking **"Review"** on any application opens the **Dual-Pane Document Review Console** (`/franchise-approval/review/:id`):

- **Left Pane (Interactive High-Resolution Document Canvas):**
  - Displays uploaded original documents: LTO Certificate of Registration (CR), Official Receipt (OR), Driver's License (Front & Back), Barangay Clearance, Cedula, and TODA Endorsement.
  - *Inspection Controls:* Zoom in/out, fit-to-width, rotate 90° clockwise/counter-clockwise, brightness slider (100%–175%), contrast slider (100%–150%), and canvas panning for examining faint stamps and municipal seals.
- **Right Pane (Automated AI OCR Comparison Engine):**
  - Displays side-by-side comparison between the applicant's submitted text and Gemini Vision OCR extraction.
  - Matching data attributes display a green check badge: `✓ Verified Matching`.
  - Discrepancies (e.g., OCR reads motor number `JH2PC000` while applicant typed `JH2PC001`) display an amber alert: `⚠️ Discrepancy Flagged`.
  - Registered CR Owner check: If the registered owner on the LTO CR differs from the applicant's name, the console flags:
    `"Notice: Third-Party CR Owner Detected. Valid Deed of Absolute Sale or Special Power of Attorney (SPA) Required."`
- **Concurrency Lock:** Real-time WebSocket locking prevents two licensing officers from simultaneously reviewing the same application.

---

### 6.3 Multi-Stage Franchise Approval Pipeline
Within the review console, the BPLO Officer executes regulatory actions:
1. **Endorse for Payment:** If all credentials match and vehicle specifications comply, click **"Approve for Payment"**. The application transitions to `For Payment`, appearing immediately in the Municipal Cashier's terminal.
2. **Return for Revision:** If images are unreadable or required clearances missing, click **"Request Correction"**. Select from 14 standard municipal deficiency codes (e.g., *Expired Barangay Clearance*, *Illegible OR/CR*, *Wrong Route Zone*) and enter specific instructions. The applicant receives an SMS alert and dashboard banner.
3. **Reject Application:** If fraudulent documents or stolen vehicle records are detected, click **"Reject Application"** with formal justification.
4. **10-Second Undo Safeguard:** Any status change triggers an interactive 10-second toast banner allowing the officer to undo accidental status updates before permanent commit.

---

### 6.4 Progressive Traffic Sanctions & Disciplinary Enforcement
BPLO officers maintain municipal discipline through the **Traffic Violations & Progressive Sanctions Console** (`/manage-revocations`):
1. Click **"Record Traffic Violation"**.
2. Select the operator, vehicle plate number, or body number.
3. Select the violation category from the municipal penal schedule:
   - `OVERCHARGING`: Overcharging passenger fare (Medium severity).
   - `REFUSAL_CONVEY`: Arbitrary refusal to convey passengers (Medium severity).
   - `DISCOURTEOUS`: Arrogant or discourteous behavior toward passengers (Low severity).
   - `OUT_OF_LINE`: Operating outside authorized route zone (Medium severity).
   - `RECKLESS_DRIVING`: Reckless or dangerous vehicle operation (High severity).
   - `NO_FRANCHISE`: Operating without franchise / Colorum (Grave severity).
4. **Automated Sanction Progression:**
   - **1st Offense:** Official Warning $\rightarrow$ Franchise status sets to `Active - Under Warning`.
   - **2nd Offense:** 15-day suspension + ₱500 municipal fine $\rightarrow$ Status sets to `Suspended`.
   - **3rd Offense:** Permanent Franchise Revocation $\rightarrow$ Status sets to `Revoked`.
   - **Grave Offense (Colorum):** Direct Revocation on first occurrence.
5. **Violation Settlement:** When the violator presents an official Treasury fine receipt, the officer clicks **"Settle & Lift Sanction"**, restoring the permit to `Active`.

---

### 6.5 Batch MTOP Certificate Printing & Transmittal Generation
Once applications reach `Ready for Pickup`:
1. Navigate to **"Franchise Records"** and select the **"Ready for Pickup"** queue tab.
2. Select the checkboxes next to multiple approved applications, or click **"Select All"**.
3. Click the maroon **"Batch Print MTOP Certificates"** button.
4. The system compiles all selected permits into a single, unified print spool formatted for standard `A4 portrait` paper, complete with municipal seals, dynamic QR codes, and Mayoral signature blocks.
5. Click **"Generate Transmittal Voucher"** to produce an official audit manifest for recording physical permit releases.

---

### 6.6 Municipal Franchise Masterlist Registry & PDF Export
The Masterlist Registry (`/franchise-masterlist`) serves as the permanent municipal ledger:
1. Search across all historical and active franchises by Operator Name, Plate Number, Motor Number, Body Number, or TODA.
2. Filter records by status (`Active`, `Suspended`, `Expired`, `Revoked`, `Cancelled`) or Barangay.
3. Click **"Print / Save as PDF"** to export the official Municipal Masterlist Report (`GTRAMS_Franchise_Masterlist_<DATE>.pdf`) with official LGU Gasan letterhead.

---

## Section 7: Municipal Cashier Guide

### 7.1 Isolated Treasury Payment Terminal & Security Controls
To comply with strict government accounting standards, revenue collection in G-TRAMS is isolated to authorized Municipal Cashiers:
1. Navigate to `https://g-trams-official.vercel.app/login` and authenticate with verified Cashier credentials.
2. The system directs you to the **Municipal Treasury Cashier Terminal** (`/cashier-dashboard`).
3. **Strict Separation of Duties Guard:** The cashier account possesses access exclusively to fee collection and remittance. Cashiers cannot approve or reject franchise applications, and BPLO/Admin officers cannot access cashier receipting.
4. **Terminal Metrics Header:**
   - *Awaiting Collection:* Live count of applicants vetted by BPLO awaiting fee settlement.
   - *Today's Collections:* Real-time monetary sum (₱ PHP) collected during the current shift.
   - *Total Processed:* Tally of completed transactions for the current business day.

---

### 7.2 Over-the-Counter Cash Collection & Fee Breakdown
When an operator arrives at Municipal Treasury Counter 2:
1. Locate the applicant in the **"Payment Queue"** table or search by Reference ID, Operator Name, Plate Number, or Body Number.
2. Click the green **"Collect Payment"** button next to their record.
3. The Payment Settlement Modal displays the assessed municipal fees:
   - *Basic Franchise Regulatory Fee:* **₱500.00**
   - *Inspection & Sticker Fee:* **₱150.00** (if applicable)
   - *Late Renewal Penalty:* **₱50.00 / month** (for permits past expiration)
4. Confirm total payment tendered in **Cash (Over-the-Counter)**. Digital channels (GCash, Landbank Link.Biz) may be logged if integrated with municipal treasury accounts.

---

### 7.3 Mandatory Physical Official Receipt (OR) Serialization (`OR-GASAN-2026-XXXX`)
To satisfy Commission on Audit (COA) audit requirements, every transaction must be bound to a physical municipal receipt:
1. Take the physical official municipal receipt booklet issued to Counter 2.
2. Complete the physical paper receipt for the applicant.
3. In the G-TRAMS settlement modal, locate the mandatory field: **"Official Receipt (OR) Number"**.
4. Type the serialized number matching the physical booklet:
   `OR-GASAN-2026-XXXX` (e.g., `OR-GASAN-2026-0042`).
   *Validation Rule: The system automatically converts text to uppercase and verifies that this exact OR number has not been previously recorded in the database.*
5. Enter payment remarks (default: *"Settled at Municipal Treasury Counter 2"*).
6. Click **"Confirm & Log Official Receipt"**.
7. The payment is recorded, the franchise status automatically advances to `For Signing`, and an automated receipt confirmation is dispatched to the operator.

---

### 7.4 COA Daily Remittance CSV Export & Turnover Voucher Printing
At the close of each business day (5:00 PM):
1. In the Cashier Terminal, click the **"Daily Remittance Sheet"** button on the top action bar.
2. Review the daily summary card detailing total cash receipts, transaction counts, and cashier identifier.
3. Click **"Export Remittance CSV"** to download the official municipal accounting file:
   `GTRAMS_Treasury_Daily_Remittance_YYYY-MM-DD.csv`
4. Click **"Print Turnover Voucher"** to generate the physical audit turnover sheet complete with signature blocks:
   - *Prepared By:* Collecting Cashier Name & Signature
   - *Audited & Received By:* Municipal Treasurer Name & Signature
5. Hand over physical cash collections along with the signed turnover sheet to the Municipal Treasurer.

---

## Section 8: System Administrator & IT Operations Guide

### 8.1 Server Telemetry, Runtime Memory & MongoDB Atlas Health
Municipal IT personnel monitor infrastructure health through the **IT Dashboard** (`/admin-dashboard`):
1. **Node.js Runtime Metrics:** Displays active Node process version (`v20+`), platform environment, process uptime counter (days/hours/minutes), and heap memory utilization (e.g., `42.5 MB / 128 MB`).
2. **MongoDB Atlas Cluster Telemetry:**
   - Real-time round-trip database ping latency (e.g., `24ms`).
   - Active database connection state (`Connected / Optimal`).
   - Cluster replica set synchronization status across all 13 core collections.
3. **Live Security Audit Stream:** Displays real-time security events with actor user ID, role, client IP address, action tag (`AUTH_LOGIN`, `SETTINGS_UPDATE`, `BACKUP_CREATED`), and timestamp.

---

### 8.2 User Accounts Directory & Real-Time Socket Presence Tracking
User accounts and permissions are governed through the **User Accounts Directory** (`/user-management`):
1. **Live Presence Telemetry:** Displays total registered accounts and active socket presence:
   - `Online (Active Now)`: User currently connected via WebSocket.
   - `Active Xm ago`: Recent session activity timestamp.
   - `Offline`: Dormant user account.
2. **Role Modification & Assignment:** IT staff can reassign user roles across the 6 system tiers (`operator`, `toda_president`, `bplo_staff`, `cashier`, `system_admin`).
3. **Protected Administrator Guard:** Administrator accounts are tagged `System Admin (You) Protected`. The deactivation button is disabled for active admin sessions to prevent accidental lockout.
4. **Account Suspension & Deactivation:** If an account is compromised or an operator suspended, administrators can click **"Deactivate Account"**, inputting a mandatory justification reason. Deactivated users are blocked by authentication middleware and directed to `/account-deactivated`.

---

### 8.3 Global Ordinance Policy & System Fee Configuration
The **System Settings & Policy Terminal** (`/admin/settings`) configures operational parameters:
1. **Franchise Validity Engine:**
   - *New Franchise Validity:* Configured to **3 Years** pursuant to municipal ordinance.
   - *Renewal Validity:* Configured to **1 Year**.
   - *Expiry Warning Threshold:* Configured to **30 Days** (triggers early dashboard alerts).
2. **Fiscal Year & Fee Schedules:** Configure active fiscal year, standard franchise fee (₱500.00), and late monthly renewal penalty rate (₱50.00).
3. **Fare Matrix Parameters:** Configure base fare (₱15.00) and succeeding per-kilometer rate (₱2.50).
4. **Statutory Unit Limitation:** Sets `maxUnitsPerOperator` (default: 2 units).
5. **System-Wide Maintenance Mode:** Emergency kill-switch. When toggled **ON**, public visitors and operators attempting to access application wizards are redirected to `/maintenance` with a custom advisory banner. BPLO, Cashier, and IT staff retain full operational access.

---

### 8.4 Disaster Recovery Protocol (DRP): Weekly Backups, Offline Snapshots & Database Restore
G-TRAMS implements a three-tier Disaster Recovery Protocol (DRP) to safeguard municipal transport records:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        G-TRAMS DISASTER RECOVERY PROTOCOL (DRP)                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
  [Tier 1: Automated Cron Archive] ──> Executes every Sunday at 12:00 MN (Midnight) via
                                       Node-cron; archives all 13 collections into
                                       compressed .json.gz; rolling 8-week retention.
                                                │
  [Tier 2: 1-Click Offline Snapshot] ──> IT Admin downloads direct compressed gzip stream
                                         (.json.gz) to secure encrypted USB drive for
                                         offsite physical custody.
                                                │
  [Tier 3: Safe Restoration Engine] ──> Complete database restoration across all 13 collections;
                                        Mandatory safety phrase confirmation: "RESTORE".
```

1. **Automated Weekly Archive (Cron Schedule):**
   - The backend runs an automated cron task scheduled for **every Sunday at 12:00 MN (Midnight)**.
   - Archives all **13 core MongoDB collections**: `users`, `franchises`, `todas`, `todasubmissions`, `violations`, `systemsettings`, `auditlogs`, `tickets`, `notifications`, `counters`, `sessions`, `fees`, `documents`.
   - Compresses archives with gzip (`.json.gz`), storing them with rolling 8-week automated retention.
2. **1-Click Offline Snapshot Download:**
   - Navigate to **Admin Settings $\rightarrow$ Tab 5: "Database Backup & Disaster Recovery"**.
   - Click the maroon **"Direct Offline Download"** button.
   - The server compiles a fresh, complete database snapshot and streams the compressed `.json.gz` file directly to the administrator's local drive for offsite custody.
3. **Database Disaster Restoration Procedure:**
   - In the event of catastrophic database corruption or hardware failure:
   - Select **"Upload & Restore Backup"** in Tab 5.
   - Select the verified `.json.gz` or `.json` archive file.
   - In the modal prompt, type the mandatory uppercase safety phrase: `RESTORE`.
   - Click **"Confirm Full Restoration"**.
   - The engine purges corrupted tables, re-indexes unique keys (`plateNo`, `chassisNo`, `bodyNumber`), and restores all 13 collections with 100% data fidelity within seconds.

---

### 8.5 Communications Dispatch & Helpdesk Ticketing Center
The **Support & Tickets Terminal** (`/admin/tickets`) centralizes communications:
1. **Live Operator Chat:** WebSocket-powered messaging channel enabling real-time dialogue between municipal staff and operators.
2. **Municipal Advisory Dispatch:** Allows IT administrators to publish high-priority alerts to the landing page bulletin board.
3. **Ticket Resolution Queue:** IT staff review operator support inquiries, assign priority tiers (`Low`, `Medium`, `High`), update ticket progress (`Open` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved`), and reply directly to operator accounts.

---

## Section 9: Troubleshooting, FAQs & Support Directory

### 9.1 Comprehensive Error Resolution Matrix

| # | Error Message / Observed Symptom | Probable Root Cause | Verified Step-by-Step Resolution |
|---|---|---|---|
| 1 | **"Invalid credentials or incorrect password"** | Typo in password or account not yet activated via OTP. | Check that Caps Lock is disabled. Verify that you are using an 11-digit mobile number (`09xxxxxxxxx`) or correct email. If forgotten, click *"Forgot Password?"* to reset via OTP. |
| 2 | **"OTP code has expired or is invalid"** | More than 5 minutes elapsed since OTP dispatch. | Click *"Resend OTP"*. Ensure your mobile phone has active cellular reception in Gasan. Enter the newly received 6-digit code immediately. |
| 3 | **"Document upload failed / File exceeds size limit"** | File format is unsupported or image exceeds 10 MB. | Ensure image is in `.jpg`, `.png`, or `.pdf` format. If photographed with a 48MP/108MP camera, reduce resolution or crop margins before uploading. |
| 4 | **"Duplicate vehicle identifier detected"** | Plate, Engine, or Chassis number already exists in active records. | Cross-check vehicle Certificate of Registration (CR). If vehicle was acquired second-hand, ensure the previous owner filed a formal *Dropping / Transfer* at BPLO. |
| 5 | **"Unit Capacity 2/2 Reached — Quota Ceiling Enforced"** | Operator already holds two active tricycle franchises. | Pursuant to Section 4 of the Municipal Franchising Ordinance, no individual may operate more than two units. You must drop an existing unit before filing a new one. |
| 6 | **"Notice: Official TODA Certificate Required"** | Applicant name is not found in the association roster. | Consult your TODA President to ensure your membership was encoded in the digital roster. If unlisted, upload a signed physical TODA Clearance certificate. |
| 7 | **"Access Denied (403 Unauthorized)"** | User account does not hold permission for this module. | The system enforces strict role segregation. Ensure you are logged into the appropriate account (e.g., Cashier for treasury, BPLO for approvals, Admin for IT). |
| 8 | **"Official Receipt (OR) Number already exists"** | Cashier entered an OR booklet number already logged. | Inspect the physical receipt booklet to confirm the accurate sequential serial number. Duplicate OR entries are blocked to prevent accounting irregularities. |
| 9 | **"Restore Aborted: Invalid confirmation phrase"** | Administrator failed to type exact safety confirmation. | In the restore modal, you must type the exact word `RESTORE` in all capital letters to confirm database overwrite. |
| 10 | **"Server connection timeout / Maintenance in progress"** | Scheduled municipal server maintenance or network loss. | Verify your internet connection. If maintenance mode is active, wait until municipal IT completes scheduled upgrades. |

---

### 9.2 Frequently Asked Questions (FAQs)

#### Q1: What is the processing turnaround time for an MTOP application in G-TRAMS?
Under Republic Act No. 11032 (Ease of Doing Business), complete applications with verified credentials are processed within **two (2) to three (3) business days** from online submission to BPLO inspection, payment, and final permit release. Operators can monitor their real-time status bar on their dashboard.

#### Q2: When am I eligible to renew my commercial tricycle franchise?
Franchise permits are valid for **one (1) year for Renewals** and **three (3) years for New Franchises**. The system automatically triggers an amber warning banner on your dashboard **30 days prior** to expiration, activating the *"Renew Franchise"* button for early filing.

#### Q3: What should I do if my primary mobile phone is lost or damaged?
During registration, G-TRAMS captures a mandatory **Secondary Recovery Contact** (backup phone or email). Navigate to the login page, click *"Forgot Password?"*, enter your recovery contact, and receive an OTP to regain account access without visiting municipal hall.

#### Q4: How does a traffic enforcer know my digital e-Copy MTOP is authentic?
Every digital MTOP certificate and physical sidecar sticker features a **dynamic encrypted QR code**. When scanned by an enforcer's camera, it retrieves live, tamper-evident records directly from the municipal database at `/verify/:id`. Forged or expired permits are flagged immediately.

#### Q5: Is my personal document data protected under Philippine privacy laws?
Yes. G-TRAMS strictly adheres to the **Data Privacy Act of 2012 (RA 10173)**. All user passwords use cryptographic bcrypt hashing, biometric markers like blood type are excluded from AI OCR extraction, and document images are stored in secure cloud vaults with expiring tokens.

---

### 9.3 LGU Office Directory & Official Support Channels

For technical help, municipal inquiries, or ordinance clarifications, contact the designated municipal offices:

| Department / Office | Physical Location | Operating Hours | Contact Numbers & Email |
|---|---|---|---|
| **Office of the Municipal Mayor** | Executive Wing, 2nd Floor, Gasan Municipal Hall, Poblacion, Gasan | Mon – Fri, 8:00 AM – 5:00 PM | (042) 342-1001 • `mayor@gasan.ph` |
| **BPLO Franchising Division** | Licensing Office, 2nd Floor, Gasan Municipal Hall, Poblacion, Gasan | Mon – Fri, 8:00 AM – 5:00 PM | (042) 342-1234 • `bplo@gasan.ph` |
| **Municipal Treasury (Counter 2)** | Revenue Office, Ground Floor, Gasan Municipal Hall, Poblacion, Gasan | Mon – Fri, 8:00 AM – 5:00 PM | (042) 342-1235 • `treasury@gasan.ph` |
| **Traffic Enforcement / CTMO** | Ground Floor (East Wing), Gasan Municipal Hall, Poblacion, Gasan | 24/7 Roadside Operations | (042) 342-1111 • `traffic@gasan.ph` |
| **G-TRAMS IT Technical Support** | College of Information & Computing Sciences, MarSU, Boac, Marinduque | Mon – Fri, 8:00 AM – 5:00 PM | `support@gtrams.ph` • `cics@mar-su.edu.ph` |

---

## Embedded Visual Figures Catalog

The following catalog provides authoritative descriptions for all seventeen (17) numbered visual figures embedded within this User's Manual:

- **Figure 1: G-TRAMS Public Citizen Landing Page & Municipal Portal**  
  *Image Source:* `docs/manual_assets/fig4_landing_page.png` (Alt: `remotion/assets/screen1_landing.png`)  
  *Interface Callouts:* Official seal of Gasan, G-TRAMS emblem, public statistics ticker (Registered Operators, Accredited TODAs, Active Franchises), dual Call-to-Action buttons ("LOG IN" and "REGISTER"), municipal mandate announcement, and 5-step Citizen's Charter interactive service cards.
- **Figure 2: Shared Multi-Identifier Authentication Login Terminal**  
  *Image Source:* `docs/manual_assets/fig1_login_page.png`  
  *Interface Callouts:* Secure login form supporting 11-digit Philippine mobile numbers (`09XXXXXXXXX`) and email addresses, password input with toggle eye glyph, Google OAuth integration button, "Forgot Password?" link, and registration anchor.
- **Figure 3: Citizen & Operator Account Registration Interface**  
  *Image Source:* `docs/manual_assets/fig2_register_page.png`  
  *Interface Callouts:* Onboarding console capturing full applicant legal name, primary mobile number, mandatory secondary recovery contact, 25-barangay dropdown selector, accredited TODA affiliation, and initial body number specification.
- **Figure 4: Multi-Channel Password Recovery & OTP Reset Modal**  
  *Image Source:* `docs/manual_assets/fig3_forgot_password.png`  
  *Interface Callouts:* Security recovery modal featuring red shield emblem, contact input field (`juan@gmail.com or 09123456789`), "Send Reset Code" button, 6-digit OTP verification field with 5-minute timeout window, and password reset form.
- **Figure 5: Public Roadside Mobile QR Verification Terminal (`/verify/:id`)**  
  *Image Source:* `remotion/assets/screen4_verify.png` (Alt: `docs/manual_assets/fig7_qr_verification.png`)  
  *Interface Callouts:* Roadside mobile verification screen displaying verified municipal badge, operator photo, legal name, LTO plate number, engine/motor number, chassis number, assigned body number, TODA association, route zone, and franchise validity status.
- **Figure 6: Tricycle Operator Main Garage Dashboard**  
  *Image Source:* `docs/manual_assets/fig5_operator_dashboard.png`  
  *Interface Callouts:* Operator fleet overview displaying Section 4 statutory quota progress bar ("Unit Capacity 1 / 2 — 1 Slot Available"), active franchise card, "Needs Attention" alert with direct "Fix Issues" button, digital ID shortcut, and floating municipal help widget.
- **Figure 7: 5-Step Online MTOP Application Wizard (Operator & Route Validation)**  
  *Image Source:* `docs/manual_assets/fig6_apply_franchise.png` (Alt: `remotion/assets/screen2_application.png`)  
  *Interface Callouts:* Step 1 of 5 wizard interface showing 20% progress indicator, applicant profile inputs, barangay residency selector, TODA affiliation badge (`✓ Verified in Roster`), and route conflict detector (`⚠ Route Mismatch` warning).
- **Figure 8: Multimodal AI OCR Document Intake & Dual LTO Segregation**  
  *Image Source:* `remotion/assets/screen2_application.png` / `docs/manual_assets/fig6_apply_franchise.png`  
  *Interface Callouts:* Dedicated upload slots for LTO Certificate of Registration (CR) and Official Receipt (OR), Driver's License (with RA 10173 data minimization), Barangay Clearance, and Cedula, highlighting Gemini Vision AI OCR text parsing and automated field population.
- **Figure 9: Physical TODA Association Member Masterlist Scanned Document**  
  *Image Source:* `frontend/public/sample_toda_roster.png`  
  *Interface Callouts:* Scanned paper roster from Gasan Central TODA utilized as input for Gemini Vision AI OCR digitization, detailing operator names, unit body numbers, and plate registrations.
- **Figure 10: TODA President Association Member Management Terminal**  
  *Image Source:* `docs/manual_assets/fig8_toda_roster.png`  
  *Interface Callouts:* Association administration console showing active member count (89), active commercial units (2), multi-tab layout ("Member Roster", "Upload Roster Document", "Removal Requests"), member search filter, and PWA installation prompt.
- **Figure 11: BPLO Operations Dashboard & Executive KPI Telemetry**  
  *Image Source:* `docs/manual_assets/fig11_bplo_dashboard.png`  
  *Interface Callouts:* Central licensing control center showing live operational metrics (Active Franchises, Pending Approvals, In Pipeline, Expiring Units), compliance pipeline distribution (50% compliant units), TODA fleet charts, and daily application intake queues.
- **Figure 12: BPLO Multi-Stage Franchise Approval & Evaluation Queue**  
  *Image Source:* `docs/manual_assets/fig12_bplo_approval_queue.png`  
  *Interface Callouts:* Structured evaluation pipeline displaying segregated workflow tabs (`Needs Review`, `For Payment`, `For Signing`, `Ready for Pickup`, `Cancellations Queue`, `Approved`, `Rejected`), multi-parameter filters (All TODAs, Types, Barangays, `⚠ Flagged Only`), and FIFO sorting.
- **Figure 13: Municipal Franchise Masterlist Registry & Historical Archive**  
  *Image Source:* `docs/manual_assets/fig13_franchise_masterlist.png` (Alt: `remotion/assets/screen3_masterlist.png`)  
  *Interface Callouts:* Official municipal registry detailing verified franchise units, plate numbers (`143-ABC`, `4528-TC`), affiliated operators (`Jhon Kyn Axix Cabrigas`, `Jay Vincent Motol`), TODA assignments, status tags (`Active`, `Cancelled`), and one-click "Print / Save as PDF" export button.
- **Figure 14: Municipal Treasury Cashier Collection Terminal**  
  *Image Source:* `docs/manual_assets/fig9_cashier_dashboard.png`  
  *Interface Callouts:* Isolated financial collection console showing real-time revenue metric cards ("Awaiting Collection", "Today's Collections", "Total Processed"), searchable payment queue, mandatory physical Official Receipt booklet serialization (`OR-GASAN-2026-XXXX`), and daily COA remittance reconciliation.
- **Figure 15: System Administrator IT Diagnostics & Server Telemetry Dashboard**  
  *Image Source:* `docs/manual_assets/fig14_admin_dashboard.png`  
  *Interface Callouts:* Municipal IT oversight console displaying server status, MongoDB Atlas round-trip latency, Node.js runtime process memory allocation, system uptime counter, maintenance mode toggle, and live security audit event stream.
- **Figure 16: User Accounts Directory & Role-Based Access Control (RBAC) Governance**  
  *Image Source:* `docs/manual_assets/fig15_user_management.png`  
  *Interface Callouts:* Administrative user directory displaying real-time socket presence tracking (`• 1 Online Now`, `Active 12m ago`), role distribution filters across 6 user tiers, SMS verification badges, and account protection guardrails (`(You) Protected`).
- **Figure 17: System Policy Configuration & Disaster Recovery Protocol (DRP)**  
  *Image Source:* `docs/manual_assets/fig16_admin_settings.png` (Alt: `docs/manual_assets/fig16_admin_database_backup.png`)  
  *Interface Callouts:* System settings console detailing franchise validity durations (New: 3 Years, Renewal: 1 Year, 30-day expiry warning alert), municipal fare tariff settings, automated Sunday 12:00 MN cron backup status, 1-click `.json.gz` offline snapshot download, and full 13-collection restore requiring safety confirmation phrase `"RESTORE"`.

---
*End of Document — Deliverable #7: User's Manual of the System (G-TRAMS)*  
*Municipality of Gasan, Marinduque • Marinduque State University CICS BSIT Capstone Group 5*
