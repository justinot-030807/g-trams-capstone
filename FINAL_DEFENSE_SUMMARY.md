# G-TRAMS Final Defense Compliance Summary & Presentation Guide

> **Project:** G-TRAMS (*Gasan Tricycle Records and Application Management System*)  
> **Stage:** Pre-Final Defense Revisions **100% Completed** (`main` @ `86bd8f7`) · Ready for **Final Defense**  
> **Licensing Office (`main`):** Office of the Municipal Vice Mayor (**OVM — LLSA I**, internal role key `'bplo_staff'`)  
> **Live Frontend (Vercel):** `https://g-trams-official.vercel.app`  
> **Live Backend (Render):** `https://g-trams-web2.onrender.com`  
> **Default Password (All Seeded Test Accounts):** `Password123!`

---

## 📊 1. COPY-PASTE TABLE PARA SA PRESENTATION SLIDES (English — Formal Slide Version)

*Pwede itong i-copy-paste diretso sa PowerPoint o Canva slide na **"Summary of Pre-Final Panel Revisions / Compliance Matrix"**:*

| # | Panelist Finding / Recommendation | Previous State (Pre-Final Defense) | Action Taken / Completed Solution (Final Defense) | Status |
|---|---|---|---|---|
| **1** | **Role Separation & Access Control (RBAC)** | Single "Admin" account handled both IT settings and OVM franchise approvals; included Cashier shortcuts. | Separated **IT System Admin** (Settings, Users, Audit Logs, Backups) from **OVM / LLSA I Staff** (Franchise Review, Signing, Pickup, Violations). Removed all Cashier payment shortcuts from Admin/Staff views. | **100% Completed** |
| **2** | **Pre-Registration TODA Roster Gate & Body Number** | Unlisted operators could register; lacked unique auto-generated Body Number validation. | Simplified TODA Roster to **Assigned Body Number + Operator Full Name** with auto-generated Body Numbers. Added a strict `/register` gate that blocks unlisted operators with an LGU Advisory Notice. | **100% Completed** |
| **3** | **Server-Authoritative Time & Expiration Security** | Relied on local laptop/browser clock (`new Date()`), allowing device date tampering to alter record statuses. | Locked all expiration checks and midnight cron jobs to **Server-Authoritative Philippine Time (`Asia/Manila`, UTC+8)** + added an OVM / LLSA I Masterlist **`Expire`** simulation action for live renewal testing. | **100% Completed** |
| **4** | **SMS Notification Integration (30-Day Expiry Alert)** | In-app notifications only; SMS gateway was not yet integrated for the 1-month renewal reminder. | Integrated **TextBee Cloud SMS Gateway** with automated **30-Day Pre-Expiry SMS Reminders**, expiration notices, and status update SMS alerts with timestamped delivery logs. | **100% Completed** |
| **5** | **Module 8: Voluntary Franchise Cancellation** | Only pending applications could be rejected; no workflow for operators transferring barangay/TODA to voluntarily cancel. | Added **Request Cancellation Modal** for Operators (Reason dropdown + typed/uploaded Signed Cancellation Letter) and a dedicated **OVM / LLSA I Cancellation Review Queue** with atomic auto-archiving and slot release. | **100% Completed** |
| **6** | **Progressive 3-Tier Violation & Revocation Policy** | Violations immediately triggered franchise revocation without warnings, offense tiers, or severity conditions. | Implemented **3-Tier Discipline Matrix** (**1st:** *Warning*, **2nd:** *Suspension & Fine*, **3rd:** *Revocation*) plus **Grave Offense Immediate Revocation** and cross-unit carryover, configurable by **System Admin**. | **100% Completed** |
| **7** | **AI OCR Scanner State Reset & Wrong-Document Guard** | Previous scan data persisted when replacing files; lacked warning notices when uploading invalid images. | Added automatic scan state reset per upload, **3-Tier OCR (Gemini + Offline Tesseract.js + OCR.space)**, accordion UI fix, and immediate rejection notices for invalid or mismatched documents. | **100% Completed** |
| **8** | **Database Backup & Disaster Recovery (DRP)** | No automated backup schedule or offline restore engine in System Admin settings. | Added **Two-Tier DRP**: Automated Weekly Cron Backups (16 collections, AES-256-GCM + SHA-256) + Manual `.json.gz` Snapshot Download & Distributed-Lock Restore Engine in System Admin Portal. | **100% Completed** |

---

## 🔍 2. POINT-BY-POINT ANALYSIS NG MGA NA-RESOLVE SA PRE-FINAL (Tagalog Kodigo sa CP)

### Puna #1: Pagkakaiba ng System Admin (`system_admin`) at OVM / LLSA I Staff (`llsa.tester@gtrams.com`) + 5 User Roles
- **Ano ang Puna ng Panel:** Naghalo ang gawain ng IT System Admin at ng OVM Licensing Staff (LLSA I). Dapat IT settings at user accounts lang sa System Admin, habang ang pag-approve ng prangkisa ay sa OVM / LLSA I Staff lang.
- **Paano Natupad:**
  1. **IT / System Admin (`admin.tester@gtrams.com`):** System Settings, Violation Policy Configuration, Franchise Fee & Validity Settings, User Account Management, Audit Logs (CSV Export), at Database Backup/Restore. **Walang menu para mag-review o mag-approve ng prangkisa.**
  2. **OVM / LLSA I Licensing Staff (`llsa.tester@gtrams.com`, internal role key `bplo_staff`):** Franchise Approval Queue (`Needs Review`, `For Payment`, `For Signing`, `Ready for Pickup`, `Approved`, `Rejected`, `Cancellations`), Masterlist, TODA Roster Validation, at Violations Management (`/llsa-dashboard`).
  3. **Municipal Cashier (`cashier.tester@gtrams.com`):** Over-the-counter Treasury Cash Payment, Physical LGU Official Receipt (OR) Number encoding, Payer Name, Daily Treasury Remittance Sheet, at Printable E-Resibo (`/cashier-dashboard`).
  4. **TODA President (`todapres.tester@gtrams.com`):** Pag-submit at pag-manage ng TODA Masterlist Roster (`Body Number` + `Full Name`, `/submit-members`).
  5. **Tricycle Operator (`operator.tester@gtrams.com` / `ian.operator@gtrams.com`):** 5-step Application, Renewal, Watermarked MTOP E-Copy, at Voluntary Cancellation (`/operator-dashboard`).

---

### Puna #2: Pag-alis ng Cashier Shortcut sa Admin & Payment Method sa Cashier
- **Ano ang Puna ng Panel:** May shortcut dati sa Admin para i-mark as paid kahit hindi dumadaan sa Cashier, at tinanong ang payment method sa Cashier.
- **Paano Natupad:**
  - Tinanggal na ang lahat ng payment shortcut sa Admin at OVM / LLSA I Staff views.
  - Tanging ang **Municipal Cashier Portal** lang ang nakakapag-record ng bayad (**Over-the-Counter Municipal Treasury Cash Payment**) gamit ang **Physical LGU Official Receipt (OR) Number** at **Payer/Representative Name**.

---

### Puna #3: Registration Harang sa TODA Roster (`Body Number` + `Full Name` Lang + Auto-Generated)
- **Ano ang Puna ng Panel:** Dapat sa `/register` pa lang ay hinaharang na kapag wala sa TODA roster, at dapat **Body Number at Full Name lang** ang nasa roster (na may auto-generated Body Number para walang duplicate).
- **Paano Natupad:**
  - Sa TODA President Portal (`SubmitMembers`), **2 fields lang** ang hinihingi: **Assigned Body Number** (auto-generated ang susunod na bakanteng 3-digit number gaya ng `001`, `002`, o via Excel/OCR upload) at **Operator Full Name**.
  - Sa `/register` ng Operator, unang step pa lang ay bini-verify na agad ang **Full Name + TODA + Body Number** laban sa approved TODA Roster. Kapag wala sa listahan o mali ang Body Number, **harang agad** at may lumalabas na **LGU Advisory Notice**.

---

### Puna #4: AI OCR Scanner (Reset kada Upload, Warning sa Maling Document) & Accordion Button
- **Ano ang Puna ng Panel:** Bakit naiiwan ang unang scan kahit pinalitan na ang picture? Bakit walang lumalabas na warning notice kapag maling picture/document ang in-upload? At may bug sa accordion button.
- **Paano Natupad:**
  - **Auto-Reset:** Tuwing magpapalit o magbubura ng file sa upload card, nire-reset agad ang scan state.
  - **Wrong Document Warning Guard:** Kapag nag-upload ng maling dokumento, selfie, o foreign ID (hal. `sample_docs/MALI`), hinaharang agad ng AI/OCR scanner at naglalabas ng **Red Rejection / Warning Notice** (*"Invalid Document Detected"*).
  - **3-Tier OCR Fallback:** Kahit mawalan ng Gemini API quota sa defense, may built-in offline `tesseract.js` 7.0 engine + `OCR.space` fallback kaya tuloy ang pag-scan ng `sample_docs/TAMA`.
  - **Accordion Fix & UAT Round 2:** Naayos ang accordion cards, tinanggal ang hindi kailangang TODA Endorsement upload, at idinagdag ang inline Step 5 printable 1:1 `OfficialApplicationForm`.

---

### Puna #5: Timezone Security (Laptop Clock Change Test) vs. Pag-demo ng `Expired` Status
- **Ano ang Nangyari sa Pre-Final:**
  - Pinabago ang Date & Time ng laptop sa `2028` para makitang maging `Expired` ang prangkisa, ngunit napuna na delikadong butas kapag nakadepende sa oras ng browser/laptop ang record status.
- **Paano Natupad:**
  1. **Server-Authoritative Time (`Asia/Manila`):** Naka-lock na ang buong system sa Philippine Standard Time mula sa backend server. Kahit baguhin ang clock sa laptop, **hindi na maaapektuhan ang records**.
  2. **Live `Expire` Button sa Masterlist:** May **`Expire`** button na sa **OVM / LLSA I → Franchise Masterlist** para ma-simulate agad ang `Active -> Expired -> Renew Franchise` flow nang live at hindi na kailangang galawin ang MongoDB Atlas.

---

### Puna #6: SMS Notification (1 Month / 30 Days Before Expiration + Pag Nag-Expire)
- **Paano Natupad:**
  - Naka-integrate na ang **TextBee Cloud SMS Gateway** (`sendSms.js`) at may **SMS Dispatch Audit Logs** (`SmsLog`).
  - Awtomatikong nagpapadala ang daily cron job ng SMS paalala **30 days bago mag-expire**, sa araw ng expiration, at sa bawat status update (`For Payment`, `Ready for Pickup`, `Active`).

---

### Puna #7: Module 8 — Voluntary Franchise Cancellation (Reason Popup + Typed/Signed Letter + Auto-Archive)
- **Paano Natupad:**
  - **Para sa Pending Application:** May **"Cancel Application"** button sa Operator Dashboard para i-withdraw agad bago pa mapunta sa Cashier.
  - **Para sa Active Franchise:** May **"Request Cancellation"** button sa Operator Dashboard kung saan pipili ng **Reason** (*Relocation / TODA Transfer*, *Unit Sale*, *Voluntary Cessation*, atbp.) at pwedeng mag-type ng letter (`>= 30` chars) o **mag-upload ng picture/PDF ng signed Cancellation Letter**.
  - Napupunta ito sa **`Cancellations` Tab** sa OVM / LLSA I Portal (`/franchise-approval`) kung saan nakikita ang draft letter / printable DOCX at kapag na-approve ay **auto-archived** agad ang record at nababakante ang unit capacity ng operator (habang pinoprotektahan ang active warning/discipline history kung mayroon).

---

### Puna #8: Record Operator Violations — 3-Tier Policy + Grave Offense Conditions
- **Paano Natupad:**
  - Sa **OVM / LLSA I → Manage Violations & Revocations** (`/manage-revocations`):
    - **1st Offense:** *Warning* → Status ay nagiging **`Active - Under Warning`**.
    - **2nd Offense:** *Suspension + Fine* → Status ay nagiging **`Suspended`** (humaharang sa renewal at manual expiry).
    - **3rd Offense:** *Revocation* → Status ay nagiging **`Revoked`**.
    - **Grave Violation Toggle:** Para sa mabibigat na kaso (*Operating without valid franchise / Colorum* o *Fatal Reckless Driving*), deretsong **`Revoked`** kahit 1st offense.
    - May **cross-unit carryover (`disciplineHelper.js`)** kaya hindi matatakasan ang active warning/sanction kahit ma-reject o ma-reapply ang prangkisa ng unit.
  - Sa **IT System Admin → System Settings**, naka-configure ang **Violation Policy Matrix**.

---

## 🎯 3. QUICK KODIGO SA DEMO FLOW (6 Test Accounts)

Lahat ng accounts ay may password na: **`Password123!`**

1. **TODA President (`todapres.tester@gtrams.com` — `/submit-members`)**
   - Ipakita ang **TODA Roster** na **Body Number + Operator Name** lang ang laman at auto-generated ang susunod na Body Number.
2. **Registration Gate (`/register`)**
   - Subukang mag-type ng pangalan o Body Number na wala sa roster → Ipakita na **harang agad** (LGU Advisory Modal).
3. **Tricycle Operator (`operator.tester@gtrams.com` — `/apply-franchise`)**
   - Mag-apply ng bagong prangkisa (5-step wizard).
   - Mag-upload muna ng maling picture mula sa `sample_docs/MALI` → Ipakita ang **Warning/Rejection Notice**.
   - Palitan ng tamang picture mula sa `sample_docs/TAMA` → Ipakita na **nag-reset ang unang scan** at nag-auto-fill nang tama hanggang Step 5 Printable `OfficialApplicationForm`.
4. **OVM / LLSA I Staff (`llsa.tester@gtrams.com` — `/franchise-approval`)**
   - Buksan ang application sa `Needs Review`, ipakita ang **1:1 Printable Official Application Form** at **Pre-Payment Record Check**, tapos i-click ang **`Approve for Payment`**.
   - Ipakita na **walang Cashier payment shortcut** sa OVM / LLSA I Staff.
5. **Municipal Cashier (`cashier.tester@gtrams.com` — `/cashier-dashboard`)**
   - Buksan ang `For Payment` queue, ilagay ang **Physical LGU OR Number** at **Payer Name** (Cash Over-the-Counter), i-confirm ang bayad, at ipakita ang **Printable E-Resibo** + **Daily Treasury Remittance Sheet**.
6. **OVM / LLSA I Staff (`llsa.tester@gtrams.com` — `/franchise-approval` & `/franchise-masterlist`)**
   - Ilipat mula `For Signing` → `Ready for Pickup` → `Active` (Release MTOP).
   - **Live Expiration & Renewal Demo:** Sa **Franchise Masterlist**, pindutin ang **`Expire`** button -> bumalik sa **Operator Dashboard** -> ipakita ang In-App/SMS notification at **`Renew Franchise`** button.
   - **Voluntary Cancellation & 3-Tier Violations:** Ipakita ang **`Request Cancellation`** -> **`Cancellations` Tab**, at ang **1st (Warning) → 2nd (Suspension) → 3rd / Grave (Revocation)** sa **`/manage-revocations`**.
7. **IT System Admin (`admin.tester@gtrams.com` — `/admin-dashboard` & `/admin/settings`)**
   - Ipakita na **hiwalay ang System Admin** (walang franchise approval menu).
   - Ipakita ang **Violation Policy Settings**, **Franchise Validity & 30-Day SMS Reminder Settings**, **User Management**, **Audit Logs**, at **Database Backup Download (`.json.gz`)**.
