# G-TRAMS Final Capstone Defense Slide Deck Guide
**Gasan Tricycle Records and Application Management System**  
*College of Information and Computing Sciences — Marinduque State University*  
*Academic Year 2026–2027*

---

## 📊 Overview ng Presentation Deck (15 Slides)
- **Kabuuang Oras:** 15–20 minuto (1 minuto kada slide + Live Demo)
- **Inirekumendang Layout:** 16:9 Widescreen sa Canva, PowerPoint, o Google Slides
- **Color Theme ("Civic Ledger"):** Maroon (`#9E2A2B`), Gold (`#D4AF37`), Dark Charcoal (`#1F1D1B`), at Warm Off-White (`#F6F5F3`)

---

### Slide 1: Title Slide (Cover)
* **Visual Elements:** Opisyal na Logo ng LGU Gasan at Marinduque State University Seal.
* **Header / Title:** **G-TRAMS**
* **Subtitle:** Gasan Tricycle Records and Application Management System
* **Context:** Final Capstone Defense • BS Information Technology
* **Presented by (Group 5):**
  - **Jhon Kyn Axix H. Cabrigas** — Lead Backend Developer & Database Architect
  - **Justine S. Lachica** — Frontend Developer & UI/UX Designer
  - **Jay Vincent G. Motol** — QA & Testing Specialist
  - **Ian Simon Francis M. Rey** — DevOps & Cloud Engineer
* **Speaker:** *Lahat ng miyembro ay magpapakilala nang maikli.*

---

### Slide 2: Project Background & Problem Statement
* **Visual Elements:** Icons ng lumang papel, mahabang pila sa munisipyo, at tricycle unit.
* **Key Bullet Points:**
  - **Mano-manong Pagproseso:** Mahabang pila at mabagal na release ng Motorized Tricycle Operator's Permit (MTOP).
  - **Panganib ng "Colorum" Units:** Kakulangan ng real-time roadside checking tools para sa enforcers at pasahero.
  - **Duplicate Body Numbers:** Walang sentralisadong database ang mga TODA kaya nagkakaroon ng duplicate unit numbers.
  - **Panganib ng Pagkawala ng Data:** Manual paper ledgers na madaling masira o mawala.
* **Speaker Notes (Jhon Kyn):** *"Bago ang G-TRAMS, ang mga tricycle operator sa Gasan ay kailangan pang magpabalik-balik sa munisipyo at magdala ng sari-saring photocopy. Madalas ding mahirapan ang enforcers malaman kung valid pa ang prangkisa ng tricycle."*

---

### Slide 3: Project Objectives & Scope
* **Visual Elements:** 4 na Goal Badges na may checkmarks.
* **Key Bullet Points:**
  - **Automated Lifecycle:** Digitized application, renewal, cancellation, payment settlement, at MTOP issuance.
  - **3-Tier AI OCR Acceleration:** Pagsusuri ng LTO OR/CR, Driver's License, Barangay Clearance, at Cedula gamit ang Gemini cascade + offline `tesseract.js` + `OCR.space`.
  - **Tamper-Proof QR Verification (`/verify/:id`):** Instant live status checking gamit ang smartphone camera.
  - **Disaster Recovery (DRP):** Automated weekly AES-256-GCM encrypted backup across 16 collections + distributed-lock restore.
* **Speaker Notes (Justine):** *"Ang layunin ng G-TRAMS ay gawing konektado ang buong ecosystem ng LGU: mula sa Operator, TODA President, OVM / LLSA I Staff, Municipal Cashier, System Admin, hanggang sa public roadside verification."*

---

### Slide 4: System Architecture & Technical Stack
* **Visual Elements:** Tech Stack Architecture Diagram.
* **Frontend:** React 19, Vite 8, Tailwind CSS, Lucide Icons, Framer Motion, Radix UI, Progressive Web App (PWA).
* **Backend:** Node.js, Express 5, Mongoose 9, JWT (`HS256`), 12-round Bcryptjs, Zod, Socket.IO, Node-Cron.
* **Database & Cloud:** MongoDB Atlas (NoSQL), Cloudinary (Media Storage), TextBee SMS Gateway, Brevo Email API.
* **AI & Automation:** Google Gen AI SDK (`@google/genai` cascade), offline `tesseract.js` 7.0, `OCR.space` fallback, Server-Authoritative `Asia/Manila` Cron.
* **Deployment:** Vercel (Frontend), Render (Backend).
* **Speaker Notes (Ian Simon):** *"Naka-deploy ang aming system sa modern cloud infrastructure at naka-configure rin bilang installable PWA."*

---

### Slide 5: Role-Based Access Control (RBAC) Matrix
* **Visual Elements:** Grid ng bawat User Portal at Public QR Verifier.
* **Access Roles (`main` branch):**
  1. **Tricycle Operator:** 5-step application, renewal, voluntary cancellation, watermarked MTOP E-Copy.
  2. **TODA President:** Roster masterlist (`Body Number + Full Name`), auto-generated body numbers, member removal requests.
  3. **Municipal Cashier:** Cash Over-the-Counter fee settlement, physical OR# encoding, E-Resibo, Daily Remittance Sheet & CSV export.
  4. **OVM / LLSA I Licensing Staff (`bplo_staff` internal role):** Document verification, TODA validation, MTOP issuance, cancellations, 3-tier violations.
  5. **System Admin (IT):** User management, policy & fee settings, audit trails, support tickets, encrypted DRP backups.
  6. **Public / Traffic Enforcer (`/verify/:id`):** Logged-out roadside QR validity checking.
* **Speaker Notes (Justine):** *"Matapos ang pre-final panel review, mahigpit nang nakahiwalay ang IT `system_admin` sa OVM / LLSA I licensing staff, at sa Municipal Cashier terminal lang pwedeng mag-encode ng Official Receipt."*

---

### Slide 6: Key Feature 1 — Operator Portal & 3-Tier AI OCR Engine
* **Visual Elements:** Screenshot ng Operator Dashboard at Apply Franchise Wizard.
* **Key Highlights:**
  - **5-Step Application Wizard:** Operator & TODA (with 2-unit ordinance cap) -> Vehicle & LTO OR/CR -> Driver's License & Barangay Clearance -> Cedula Review -> Inline Step 5 Printable 1:1 `OfficialApplicationForm`.
  - **AI OCR Auto-Reset & Guard:** Hinaharang ang selfie/blurred images at nagre-reset ang scan state tuwing magpapalit ng file.
  - **RA 10173 Data Minimization:** Hindi kinukuha ang blood type, Cedula payment amount, o signatures.
* **Speaker Notes (Justine):** *"Sa pamamagitan ng 3-tier AI OCR, nabawasan ang manual typing errors habang nasusunod ang RA 10173 Data Privacy Act."*

---

### Slide 7: Key Feature 2 — TODA Roster Governance & Registration Gate
* **Visual Elements:** Screenshot ng `SubmitMembers` at `/register` Advisory Gate.
* **Key Highlights:**
  - **Hard Registration Gate (`/register`):** Tanging nasa approved TODA Roster (`Body Number + Operator Name`) ang pwedeng mag-register ng operator account (zero PII leak on mismatch).
  - **Unique Auto-Generated Body Numbers:** Compound index `{ todaAssociation: 1, bodyNumber: 1 }` sa MongoDB + sequential Next Body Number button.
  - **25 Barangays / 3 Zones / 17 TODAs:** Automated barangay-to-zone mapping sa Gasan.
* **Speaker Notes (Jay Vincent):** *"Siniguro namin sa database level na kahit magsabay ang submissions, isa lang ang makakakuha ng body number para walang collision sa TODA."*

---

### Slide 8: Key Feature 3 — OVM / LLSA I Review, Voluntary Cancellation & 3-Tier Violations
* **Visual Elements:** Screenshot ng OVM / LLSA I Approval Queue & Side-by-Side Review.
* **Key Highlights:**
  - **Pay-Before-Sign Enforcement:** `Pending -> For Payment -> For Signing -> Ready for Pickup -> Active` (hindi pwedeng lumaktaw nang walang OR#).
  - **Voluntary Cancellation Queue:** Reason dropdown + typed/uploaded letter -> atomic finalization, auto-archiving, at instant capacity release.
  - **3-Tier Progressive Discipline:** `Warning -> Suspension + Fine -> Revocation` (+ Grave immediate revocation) at cross-unit carryover (`disciplineHelper.js`).
* **Speaker Notes (Jhon Kyn):** *"Laging nakikita ng OVM / LLSA I staff ang uploaded documents katabi ng extracted data, kasama ang automatic violation history check bago mag-endorse sa Cashier."*

---

### Slide 9: Key Feature 4 — Municipal Treasury & Daily Remittance
* **Visual Elements:** Screenshot ng Cashier Dashboard at Daily Remittance Modal.
* **Key Highlights:**
  - **Zero Admin Bypass:** Sa Cashier terminal lang pwedeng mag-settle ng **Over-the-Counter Cash** at mag-log ng physical **Official Receipt (OR#)**.
  - **Atomic MTOP Allocation & `PaymentLedger`:** Sabayang naitatala ang immutable ledger row at sequential `YYYY-NNN` MTOP number.
  - **COA Daily Treasury Remittance Sheet & CSV Export:** Printable E-Resibo at end-of-day collection summary na may dual signatory lines.
* **Speaker Notes (Ian Simon):** *"Bawat bayad ay may katumbas na physical OR number at immutable ledger entry, at isang pindot lang ay may COA-ready Daily Remittance Sheet at CSV export na para sa Treasury."*

---

### Slide 10: Key Feature 5 — Roadside QR Verification (`/verify/:id`) & Server Time
* **Visual Elements:** Screenshot ng Mobile QR Verification Screen.
* **Key Highlights:**
  - **Real-Time Database Query (`/verify/:id`):** Ipinapakita ang live status (`Active`, `Suspended`, `Expired`, `Revoked`, `INACTIVE_OWNER`), plate, MTOP number, at zone.
  - **Server-Authoritative `Asia/Manila` Time:** Immune sa laptop/phone clock manipulation; may live `Expire` button sa Masterlist para sa ligtas na panel demo.
  - **Automated SMS Reminders:** TextBee SMS notifications 30 days bago mag-expire, sa expiration day, at sa status updates.
* **Speaker Notes (Jay Vincent):** *"Real-time database query ang QR verifier kaya laging tama ang validity status ayon sa server clock ng munisipyo."*

---

### Slide 11: System Administration & Disaster Recovery Plan (DRP)
* **Visual Elements:** Screenshot ng System Admin Settings Tab 5 (Database Backup & Restore).
* **Key Highlights:**
  - **Automated Weekly Cron Backup:** Tuwing Linggo 12:00 MN (`Asia/Manila`, `0 0 * * 0`) across **16 collections**.
  - **AES-256-GCM + SHA-256 & Distributed `SystemLock`:** Tamper-proof `.json.gz` snapshot download + pre-restore safety snapshot + HTTP 503 mutation guard habang nagre-restore.
* **Speaker Notes (Ian Simon):** *"Kumpleto ang aming Disaster Recovery engine sa `backupService.js` — encrypted, checksum-verified, at naka-distributed lock para ligtas ang 16 database collections."*

---

### Slide 12: Security, Data Privacy (RA 10173) & Hardening
* **Key Highlights:**
  - **Auth & Input Security:** JWT `tokenVersion` revocation, 12-round production bcrypt, Helmet CSP, NoSQL `$` operator sanitizer, magic-byte upload validation, SSRF URL allowlist.
  - **Atomic Concurrency:** Conditional cancellation reviews (`409` on race), capacity locks, immutable audit trails (`AuditLog`).
* **Speaker Notes (Jhon Kyn):** *"Dumaan ang buong system sa multi-batch security audits para matiyak ang integridad ng data at roles."*

---

### Slide 13: Quality Assurance & Testing Results
* **Test Metrics (`main` @ `86bd8f7`):**
  - **Total Jest Test Suites:** **25 passed / 25 total (100%)**
  - **Total Unit, Security & Integration Tests:** **293 passed / 293 total (0 failures)**
  - **Stress & Load Testing:** Rate limit, concurrency race, 500-record masterlist, socket, & memory leak tests (`backend/tests/stress/`).
  - **Frontend Lint & Build:** ESLint `0` errors · Clean Vite 8 PWA production bundle.
* **Speaker Notes (Jay Vincent):** *"Lahat ng 293 automated Jest tests across 25 suites ay pasado na may zero failures, kasama ang stress at concurrency regression tests."*

---

### Slide 14: System Impact & Benefits to LGU Gasan
* **Key Benefits:**
  - Pinapabilis at pinapadali ang MTOP franchise tracking mula application hanggang issuance.
  - Tinutuldokan ang duplicate TODA body numbers at unauthorized colorum operations.
  - Pinapataas ang revenue transparency sa Municipal Treasury via physical OR matching at COA remittance reports.
* **Speaker Notes (Justine):** *"Ang G-TRAMS ay dinisenyo mismo para sa aktwal na proseso ng Munisipalidad ng Gasan."*

---

### Slide 15: Conclusion & Q&A
* **Project Status:** Production Deployed (`https://g-trams-official.vercel.app`) · Final Defense Ready
* **Deliverables:** Deliverable #7 User's Manual PDF, Deliverable #8 Manuscript with Source Codes, Automated Test Cases.
* **Closing Statement:**
  > *"Taos-puso kaming nagpapasalamat sa aming thesis adviser, panel members, at sa Pamahalaang Bayan ng Gasan. Bukas na po ang aming grupo para sa inyong mga katanungan."*
* **Speaker:** *Jhon Kyn Axix H. Cabrigas (Lead)*
