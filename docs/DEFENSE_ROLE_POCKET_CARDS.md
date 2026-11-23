# G-TRAMS CAPSTONE DEFENSE: 1-PAGE POCKET CARDS
## Marinduque State University — College of Information and Computing Sciences (CICS)
### Group 5: G-TRAMS Proponents Quick-Reference Cheat Sheet (*Gasan Tricycle Records and Application Management System*)

---

## 📇 CARD 1: JHON KYN AXIX H. CABRIGAS
**Role:** *Lead Backend Developer & Database Architect*  
**Pangunahing Sasagutin:** Backend APIs, MongoDB Schemas, Atomic Locks, Auto-Body Numbering, DRP Backups, at Server Logic.

### 🔢 Mga Numerong Dapat Isaulo:
* **16 Collections** — Full DRP backup scope (`users`, `franchises`, `toda_roster`, `payment_ledgers`, `mtop_counters`, `violations`, `audit_logs`, `system_settings`, atbp.).
* **12:00 MN PST (Linggo, `0 0 * * 0`)** — Scheduled automated weekly DRP backup execution (`Asia/Manila`).
* **2 Units Max** — Municipal Ordinance fleet cap per operator (`maxUnitsPerOperator`, `system_locks` enforced).
* **`E11000`** — MongoDB Duplicate Key Error code na pumipigil sa double plate/motor/chassis/OR/body number race conditions.

### 💡 3 Golden Talking Points:
1. **Collision-Free Body Numbering & Atomic MTOP:** *"May atomic `MtopCounter` (`YYYY-NNN`) at compound unique index `{ todaAssociation: 1, bodyNumber: 1 }` sa MongoDB layer para 100% imposibleng magka-duplicate kahit sabay-sabay mag-submit."*
2. **Database DRP & Security:** *"May automated weekly cron backup sa `backupService.js` na naka-gzip + AES-256-GCM at SHA-256 checksum. Bago mag-restore, kumukuha muna ng safety snapshot at gumagamit ng distributed `SystemLock`."*
3. **OVM / LLSA I Governance:** *"Ang licensing office sa `main` ay nakatutok sa OVM / LLSA I (`/llsa-dashboard`), mahigpit na hiwalay sa IT `system_admin` at Municipal Cashier."*

---

## 📇 CARD 2: JUSTINE S. LACHICA
**Role:** *Frontend Developer & UI/UX Designer*  
**Pangunahing Sasagutin:** 5-Step Application Wizard, Printable Forms, Senior Accessibility, Responsive UI, at PWA.

### 🔢 Mga Numerong Dapat Isaulo:
* **WCAG AA** — Accessibility contrast standard na sinunod sa "Civic Ledger" palette.
* **#9E2A2B (Gasan Maroon) & #D4AF37 (Gold)** — Opisyal na motif ng LGU Gasan at MarSU.
* **5 Steps** — Franchise Application wizard progression (`Operator & TODA -> Vehicle & OR/CR -> Driver's License & Barangay Clearance -> Review & Cedula -> Step 5 Printable 1:1 OfficialApplicationForm & Submit`).
* **3 Tiers (OCR)** — Gemini Vision cascade -> offline `tesseract.js` 7.0 -> `OCR.space` Engine 2.

### 💡 3 Golden Talking Points:
1. **Senior Accessibility & 5-Step Form Clarity:** *"Malalaki ang touch targets (`>=44px`), may light/dark mode at font resizer, nagre-reset ang scan state tuwing magpapalit ng picture, at may built-in 1:1 printable `OfficialApplicationForm` sa Step 5."*
2. **Voluntary Cancellation & Auto-Archive:** *"Kapag lumipat ng TODA o ibinenta ang unit, pwedeng mag-request ng Voluntary Cancellation (reason + typed/uploaded letter). Kapag na-approve ni OVM / LLSA I, awtomatikong naka-archive at nababakante ang unit slot."*
3. **PWA & Zero Horizontal Overflow:** *"Naka-configure ang `vite-plugin-pwa` para sa mobile responsiveness at ginamitan ng `break-all` + `min-w-0` para hindi lumampas kahit 100+ character chassis/TIN strings."*

---

## 📇 CARD 3: JAY VINCENT G. MOTOL
**Role:** *QA & Testing Specialist*  
**Pangunahing Sasagutin:** Automated Jest Testing, Adversarial Security Checks, AI OCR Guardrails, at Data Privacy (RA 10173).

### 🔢 Mga Numerong Dapat Isaulo:
* **293 / 293** — Passing Automated Unit & Integration Tests sa Jest (**25 test suites**, 0 failures).
* **12 Salt Rounds** — Production cryptographic password hashing gamit ang `bcryptjs` (`10` in test).
* **RA 10173** — Strict OCR exclusion ng Blood Type, Cedula payment amount, at signatories.
* **3 Tiers + Grave** — Progressive Violation Policy (`1st Warning`, `2nd Suspension + Fine`, `3rd / Grave Revocation`).

### 💡 3 Golden Talking Points:
1. **AI Human-in-the-Loop & Wrong-Document Guard:** *"Hindi AI ang nag-aapruba ng prangkisa. May wrong-document rejection at field discrepancy flags bago i-review nang side-by-side ng OVM / LLSA I staff."*
2. **Data Minimization sa Public QR:** *"Kapag pasahero o enforcer ang nag-scan sa `/verify/:id`, tanging permit validity status, plate, at TODA zone lang ang nakikita — walang personal phone number, address, o sensitive info alinsunod sa RA 10173."*
3. **Cross-Unit Progressive Discipline:** *"Hindi matatakasan ang 1st/2nd offense warning sa pamamagitan ng cancellation at re-application dahil ipinapasa ng `disciplineHelper.js` ang active sanction status sa unit at operator."*

---

## 📇 CARD 4: IAN SIMON FRANCIS M. REY
**Role:** *DevOps & Cloud Engineer*  
**Pangunahing Sasagutin:** Cloud Hosting, Stress Testing, Municipal Cashier Treasury, TextBee SMS, at LGU Turnover.

### 🔢 Mga Numerong Dapat Isaulo:
* **30 Days** — Automated pre-expiry SMS reminder via TextBee Gateway (`cronService.js`).
* **`Asia/Manila` (UTC+8)** — Server-authoritative timezone na pumipigil sa device-clock tampering.
* **Port `3000` / `5173`** — Synchronized local offline failover ports (`backend/.env` & `frontend/.env.local`).
* **3 Tiers (DRP + Cloud)** — Vercel frontend, Render backend, at MongoDB Atlas + offline `.json.gz` snapshot backups.

### 💡 3 Golden Talking Points:
1. **Over-the-Counter Municipal Treasury Governance:** *"Sa Cashier terminal (`/cashier-dashboard`) lang pwedeng mag-encode ng Physical LGU Official Receipt (OR#) at Payer Name — zero admin shortcut — at may automatic COA-ready Daily Treasury Remittance Sheet + CSV export."*
2. **Server-Authoritative Time & Live `Expire` Demo Tool:** *"Naka-lock sa server PHT time ang lahat ng expiry checks. Para sa live panel demonstration, may dedicated `Expire` action button sa OVM / LLSA I Masterlist para ligtas na ma-test ang renewal nang hindi hinahack ang clock."*
3. **Complete LGU Turnover Package:** *"Kumpleto kami sa Deliverable #7 User's Manual, Final Manuscript with Source Codes, at 1-click local offline demo launchers (`start_local_demo.bat` & `start-defense-demo.bat`)."*

---

### 🏁 OPENING AT CLOSING STATEMENTS NG GRUPO:

* **Opening Statement (Sabihin ni Justine o Jhon Kyn):**  
  > *"Magandang araw po sa ating mga kagalang-galang na panel of examiners. Kami po ang Group 5, at ikinagagalak po naming i-presenta ang **G-TRAMS: Gasan Tricycle Records and Application Management System**—isang role-isolated e-governance platform para sa Munisipalidad ng Gasan upang tuldukan ang duplicate body numbers, mabagal na manu-manong pagproseso, at kawalan ng real-time roadside verification. Handa na po kaming ipakita ang aming live system."*

* **Closing Statement (Sabihin ni Jhon Kyn o Ian Simon):**  
  > *"Maraming salamat po sa inyong makabuluhang pagsusuri at mga mungkahi. Handa na po ang G-TRAMS para sa formal deployment at turnover sa Office of the Municipal Vice Mayor (OVM / LLSA I) at Municipal Treasury ng Gasan."*
