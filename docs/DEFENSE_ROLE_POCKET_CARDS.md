# G-TRaMS CAPSTONE DEFENSE: 1-PAGE POCKET CARDS
## Marinduque State University — College of Information and Computing Sciences (CICS)
### Group 5: G-TRAMS Proponents Quick-Reference Cheat Sheet

---

## 📇 CARD 1: JHON KYN AXIX H. CABRIGAS
**Role:** *Lead Backend Developer & Database Architect*  
**Pangunahing Sasagutin:** Backend APIs, MongoDB Schemas, Auto-Body Numbering, DRP Backups, at Server Logic.

### 🔢 Mga Numerong Dapat Isaulo:
* **201 / 201** — Passing Automated Unit & Integration Tests sa Jest (14 test suites).
* **7 Collections** — Users, Franchises, Violations, Payments, Backups, AuditLogs, SystemSettings.
* **12:00 MN PST (Linggo)** — Scheduled automated weekly DRP backup execution.
* **8 Weeks** — Rolling backup retention policy bago mag-auto-prune.
* **`E11000`** — MongoDB Duplicate Key Error code na sumasalo sa race condition.

### 💡 3 Golden Talking Points:
1. **Collision-Free Body Numbering:** *"Hindi po random ang body numbering; may discovery algorithm kami sa service layer at compound unique index sa `{ todaName: 1, bodyNumber: 1 }` sa MongoDB layer para 100% imposibleng magka-duplicate kahit sabay mag-submit."*
2. **Database DRP & Data Privacy:** *"May automated weekly cron backup kami sa `backupService.js`. Bago mag-export, sini-sanitize ang active OTPs alinsunod sa RA 10173. Bago mag-restore, may Pre-Restore Safety Snapshot muna para zero data loss."*
3. **Dynamic System Settings:** *"Lahat ng fees (Filing, Inspection, Sticker) ay configurable sa Admin Settings gamit ang `system_settings` collection; walang naka-hardcode sa source code."*

---

## 📇 CARD 2: JUSTINE S. LACHICA
**Role:** *Frontend Engineer & UI/UX Designer*  
**Pangunahing Sasagutin:** User Interface, User Experience (UX), Senior Accessibility, Forms, at PWA.

### 🔢 Mga Numerong Dapat Isaulo:
* **WCAG AA** — Accessibility contrast standard na sinunod sa color palette.
* **#9E2A2B (Maroon) & #D4AF37 (Gold)** — Opisyal na kulay ng LGU Gasan at MarSU.
* **3 Steps** — Franchise Application wizard progression (TODA info -> Vehicle specs -> Document upload).
* **2.0 Seconds** — Bilis ng AI OCR preview sa frontend bago mag-submit.

### 💡 3 Golden Talking Points:
1. **Senior Citizen Accessibility & Usability:** *"Malalaki ang contrast ng buttons at fonts alinsunod sa WCAG AA. Hinati namin sa 3 madaling steps ang form na may real-time photo preview para hindi malula ang mga matatandang operator."*
2. **Dual-Contact Account Recovery:** *"Bukod sa primary email, may secondary mobile number at recovery email sa registration form. Kung mawala ang email ng tsuper, pwede siyang mag-reset ng password via SMS OTP sa kanyang backup phone."*
3. **PWA (Progressive Web App):** *"Naka-configure ang `vite-plugin-pwa` na may service worker caching para mabilis mag-load ang app kahit mahina ang signal ng cellphone sa kalsada ng Gasan."*

---

## 📇 CARD 3: JAY VINCENT G. MOTOL
**Role:** *Quality Assurance (QA) Lead & Security Analyst*  
**Pangunahing Sasagutin:** Automated Testing, AI OCR Hallucination, Security, at Data Privacy (RA 10173).

### 🔢 Mga Numerong Dapat Isaulo:
* **70%** — Confidence Score Threshold ng Gemini 3.8 Flash bago i-flag as "Needs Manual Verification".
* **10 Salt Rounds** — Cryptographic hashing ng passwords gamit ang `bcryptjs`.
* **RA 10173** — Data Privacy Act of 2012 ng Pilipinas.
* **0 Failures** — 100% green test execution rate sa buong test suite.

### 💡 3 Golden Talking Points:
1. **AI Hallucination & Fraud Protection:** *"Hindi po AI ang nag-aapruba ng prangkisa. Gumagamit kami ng Human-in-the-Loop approach. Ang AI ay nagbibigay lang ng confidence score. Kapag mababa sa 70%, ifina-flag ito para sa manual review ng BPLO officer gamit ang split-screen verification."*
2. **Data Minimization sa QR Scanning:** *"Kapag pasahero ang nag-scan sa tricycle QR, tanging Body Number, TODA, at validity status lang ang lalabas. Walang phone number, address, o violations na makikita alinsunod sa Section 11 ng RA 10173."*
3. **Automated Test Coverage:** *"Hindi lang kami nag-manual test sa Postman; mayroon kaming 201 automated test cases sa Jest na sumusubok sa authentication, race conditions, role permissions, at DRP restore."*

---

## 📇 CARD 4: IAN SIMON FRANCIS M. REY
**Role:** *DevOps Engineer & Deployment Specialist*  
**Pangunahing Sasagutin:** Cloud Hosting, K6 Stress Testing, Field Enforcement, at Institutional Turnover.

### 🔢 Mga Numerong Dapat Isaulo:
* **86.4 req/sec** — Peak throughput na naabot sa concurrency stress test.
* **142 ms** — Mean response latency sa ilalim ng 50 concurrent virtual users.
* **0.00%** — Error rate / dropped requests sa stress test.
* **< ₱1,500/buwan** — Tinatayang buwanang hosting cost kung i-turnover sa LGU Gasan.

### 💡 3 Golden Talking Points:
1. **Concurrency Stress Testing (Peak January Renewals):** *"Sinubukan po namin ang system gamit ang 50 concurrent virtual users at 1,000 continuous requests. Napanatili ng backend ang 142ms average latency at 0.00% packet loss gamit ang rate limiting at compression."*
2. **Server-Authoritative Time:** *"Naka-lock ang aming system timestamps sa Philippine Standard Time (`Asia/Manila`, UTC+8) sa server level. Hindi pwedeng dayain ng operator o enforcer ang franchise expiration sa pamamagitan ng pagbago ng clock ng kanilang cellphone."*
3. **Turnover & Sustainability Plan:** *"Mayroon kaming 100-page Deliverable #7 User's Manual, malinis na Source Code zip, at 1-Click Offline Demo Starter (`start_local_demo.bat`) para maging seamless ang turnover sa IT staff ng Munisipyo ng Gasan."*

---

### 🏁 OPENING AT CLOSING STATEMENTS NG GRUPO:

* **Opening Statement (Sabihin ni Justine o Jhon Kyn):**  
  > *"Magandang araw po sa ating mga kagalang-galang na panel of examiners. Kami po ang Group 5, at ikinagagalak po naming i-presenta ang **G-TRaMS: Gasan Tricycle Franchise Records and Monitoring System**—isang enterprise e-governance platform na binuo upang tuldukan ang mga dekada nang problema sa duplicate body numbers, mabagal na manu-manong pagre-rehistro, at kawalan ng roadside verification sa Bayan ng Gasan. Handa na po kaming ipakita ang aming live system at sumagot sa inyong mga katanungan."*

* **Closing Statement (Sabihin ni Jhon Kyn o Ian Simon):**  
  > *"Maraming salamat po sa inyong makabuluhang pagsusuri at mga mungkahi. Napatunayan po ng aming grupo na ang modernong teknolohiya, kapag inilapat nang may malasakit sa ating mga tsuper at kawani ng munisipyo, ay kayang maghatid ng mabilis, tapat, at transparent na serbisyo publiko. Malugod po naming tatanggapin ang inyong mga rekomendasyon para sa patuloy na pag-unlad ng G-TRaMS."*
