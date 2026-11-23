# G-TRAMS Capstone Defense Master Guide & Functional Requirements Test Flow

**Gasan Tricycle Records and Application Management System (G-TRAMS)**  
*Pamahalaang Bayan ng Gasan, Marinduque • Office of the Municipal Vice Mayor (OVM — LLSA I)*  
**Document Type:** Formal Capstone Final Defense Live Demo Script & Functional Requirements (FR) Verification Plan  
**Target Audience:** Capstone Defense Panelists, Subject Matter Experts (SMEs), and Technical Evaluators  
**System Baseline:** Main Branch (`86bd8f7`) — Pre-Final Revisions 100% Completed

---

## 1. Quick Master Credentials Cheat Sheet

Lahat ng mga test accounts na ito ay aktibo sa `backend/scripts/seed_tester_accounts.js` at may parehong password para sa mabilis na paglipat ng roles sa harap ng panel:

| System Role | Account Name | Email / Login Identifier | Password | Designated Office / Association | Function in Live Demo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Operator 1 (Primary Demo)** | **Juan Dela Cruz** | `operator.tester@gtrams.com` | `Password123!` | Barangay I Poblacion (Central Zone) • POB TODA | **Primary End-to-End Pipeline**: 5-step apply, AI OCR auto-fill, quota limit, renewal, voluntary cancellation, at E-Copy. |
| **TODA President** | **Pedro Santos** | `todapres.tester@gtrams.com` | `Password123!` | POB TODA (Poblacion Central Association) | **Association Gatekeeping**: Individual body number allocation & OCR roster submission (`/submit-members`). |
| **OVM / LLSA I Staff** *(internal role: `bplo_staff`)* | **Madhelyn Pastoral (LLSA I)** | `llsa.tester@gtrams.com` | `Password123!` | Office of the Municipal Vice Mayor (OVM) | **Compliance Review & Issuance**: TODA roster validation, pre-payment record check, MTOP printing, cancellations, violations (`/llsa-dashboard`). |
| **Municipal Treasury Cashier** | **Maria Clara** | `cashier.tester@gtrams.com` | `Password123!` | Gasan Municipal Treasury Office | **Revenue Collection**: Cash Over-the-Counter payment & physical LGU Official Receipt (OR#) logging (`/cashier-dashboard`). |
| **IT / System Administrator** | **System Administrator (IT)** | `admin.tester@gtrams.com` | `Password123!` | Municipal IT Office | **IT Governance ONLY**: Violation Policy & Fee Settings, Users, Audit Logs, Tickets, DRP Backups (`/admin-dashboard`). |
| **Operator 2 (Secondary / Edge Case Testing)** | **Ian Dela Cruz** | `ian.operator@gtrams.com` | `Password123!` | Secondary Operator Account | **Edge Cases & Multi-User Checks**: Testing wrong/expired documents (`sample_docs/MALI/`) o cross-account boundaries. |

---

## 2. Directory Structure ng Sample Test Documents (`sample_docs/`)

### A. Folder: `sample_docs/TAMA/` (Gagamitin sa Pangunahing Smooth Demo)
| File Name | Target Upload Field | Nilalaman at Validated System Content |
| :--- | :--- | :--- |
| `08_toda_roster_TAMA.png` | TODA Masterlist Roster (`/submit-members`) | Opisyal na Roster Document ng POB TODA (`Body Number + Operator Full Name`). |
| `01_license_front_TAMA.png` | Driver's License (Front) | Juan Dela Cruz, Valid hanggang 2028, Tricycle Codes **A & A1**, Excludes Blood Type (RA 10173). |
| `02_license_back_TAMA.png` | Driver's License (Back) | LTO Official Barcode at Serial Number. |
| `03_lto_cr_TAMA.png` | Certificate of Registration (CR) | Registered Owner: Juan Dela Cruz, Plate: `4528-TC`, Engine: `KF51E7890123`, Chassis: `MH1KF5178PK098231`. |
| `04_lto_or_TAMA.png` | Official Receipt (OR) | Hiwalay na LTO OR na nagpapatunay ng bayad sa taunang rehistro ng motorsiklo. |
| `05_brgy_clearance_TAMA.png` | Barangay Clearance | Barangay I (Poblacion), Gasan, Marinduque *(tanging clearance upload sa Step 3; inalis na ang TODA Endorsement upload)*. |
| `07_cedula_TAMA.png` | Community Tax Certificate (Cedula) | Juan Dela Cruz, CTC No. `CC12012 11793510`, Issue Year / Place of Issue: Gasan *(Strict RA 10173: hindi kinukuha ang amount paid o signatory)*. |

### B. Folder: `sample_docs/MALI/` (Standby / On-Demand Kapag Nagtanong ang Panel)
| File Name | Target Upload Field | Injected Defect / Error to be Verified |
| :--- | :--- | :--- |
| `01_mali_license_EXPIRED.png` | Driver's License (Front) | **Expired DL (2022)** — Red highlight at alert na expired ang lisensya. |
| `02_mali_license_WRONG_CODE.png` | Driver's License (Front) | **Invalid Code** — Code B lamang (4-wheels), walang tricycle code A/A1. |
| `03_mali_cr_NAME_MISMATCH.png` | Certificate of Registration (CR) | **Owner Discrepancy** — Nakapangalan sa ibang tao vs aplikanteng operator. |
| `04_mali_cr_FAKE_CHASSIS.png` | Certificate of Registration (CR) | **Serial Mismatch** — Chassis number na hindi tugma sa form. |
| `05_mali_brgy_WRONG_MUNICIPALITY.png` | Barangay Clearance | **Out-of-Jurisdiction** — Clearance mula sa labas ng Bayan ng Gasan (e.g., Boac). |
| `07_mali_cedula_EXPIRED_YEAR.png` | Community Tax Certificate (Cedula) | **Lapse in Fiscal Year** — Lumang Cedula year. |
| `08_mali_NOT_A_DOCUMENT_BLURRY.png` | Any Upload Slot | **Unreadable Media / Selfie** — Ire-reject ng document classification guard at magre-reset ng scan state. |

---

## 3. Smooth & Fast Main Live Demo Script (The Complete Lifecycle Flow)

> [!TIP]
> **Diskarte sa Presentation:**  
> Gamitin ang Two-Browser Strategy (Operator sa Projector Window; TODA President, OVM/LLSA I `llsa.tester@gtrams.com`, Cashier `cashier.tester@gtrams.com`, at IT Admin `admin.tester@gtrams.com` sa Incognito tabs) para mabilis at walang logout/login delay sa harap ng panel.

---

### Yugto 1: Technical Introduction (30–45 Segundo)
* **Tagapagsalita (Presenter):**
  > *"Magandang araw po sa ating mga kagalang-galang na panelists, technical evaluators, at sa aming research adviser. Ipinagmamalaki po naming i-present ang live system demonstration ng **G-TRAMS (Gasan Tricycle Records and Application Management System)**.*  
  >  
  > *Ang aming live demonstration ay nakatuon sa opisyal na lifecycle ng franchising sa Munisipalidad ng Gasan:*  
  > 1. *Digitization at Pre-Registration Gate ng **TODA Masterlist**;*  
  > 2. *5-Step AI-Assisted Operator Application & Quota Enforcement;*  
  > 3. *Administrative Pre-Payment Review ng **Office of the Municipal Vice Mayor (OVM / LLSA I)**;*  
  > 4. *Municipal Treasury **Cashier Collection & Physical Official Receipt Logging**; at*  
  > 5. *Watermarked E-Copy Issuance na may **real-time QR verification** (`/verify/:id`)."*

---

### Yugto 2: TODA Masterlist Digitization (FR-2)
* **Sino:** TODA President Pedro Santos (`todapres.tester@gtrams.com` / `Password123!`)  
* **Pahina:** `/submit-members`  

1. Sa **`/submit-members`**, ipakita ang **Body Number + Operator Full Name** individual add at auto-generated Body Number (`Regenerate`), o mag-upload ng `sample_docs/TAMA/08_toda_roster_TAMA.png`.
2. I-click ang **"Submit TODA Roster"**.
3. **Spiel:** *"Alinsunod sa **FR-2**, nakatali sa unique `{ todaAssociation, bodyNumber }` database index ang bawat miyembro at direktang humaharang sa `/register` kung wala sa approved roster."*

---

### Yugto 3: OVM / LLSA I Roster Validation (FR-2, FR-6)
* **Sino:** OVM / LLSA I Staff Madhelyn Pastoral (`llsa.tester@gtrams.com` / `Password123!`) *(hindi `admin.tester`!)*  
* **Pahina:** `/validate-toda`  

1. Buksan ang **`/validate-toda`** at aprubahan ang bagong isinumiteng submission ng TODA.
2. **Spiel:** *"Hiwalay po ang IT `system_admin` sa OVM / LLSA I Licensing Staff. Si LLSA I ang nagva-validate ng TODA masterlist bago kilalanin ng registration at franchise application."*

---

### Yugto 4: Operator 5-Step Application Pipeline (FR-1, FR-3, FR-4)
* **Sino:** Operator Juan Dela Cruz (`operator.tester@gtrams.com` / `Password123!`)  
* **Pahina:** `/apply-franchise`  

1. **Step 1 (Profile, TODA Check, Quota):**
   * Piliin ang Barangay (`Barangay I (Poblacion)` -> auto-maps sa `Central` Zone) at TODA.
   * Ipakita ang **Fleet Quota (`Max 2 Units` per Municipal Ordinance)** at Draft Autosave.
2. **Step 2 (Hiwalay na LTO CR at OR OCR):**
   * I-upload ang `03_lto_cr_TAMA.png` at `04_lto_or_TAMA.png` -> awtomatikong pupunuan ang **Plate**, **Engine**, at **Chassis** gamit ang 3-tier OCR.
3. **Step 3 (Driver's License Back-to-Back & Barangay Clearance):**
   * I-upload ang `01_license_front_TAMA.png`, `02_license_back_TAMA.png`, at `05_brgy_clearance_TAMA.png`.
   * **Ipakita sa Panel:** Nakuha ang **Tricycle Codes A/A1** at **Date of Birth**, habang **hindi kinuha ang Blood Type** alinsunod sa **RA 10173**. *(Wala nang TODA Endorsement upload requirement dito.)*
4. **Step 4 (Cedula & Review):**
   * I-upload ang `07_cedula_TAMA.png` -> kukunin lang ang CTC number, place/year of issue (strict RA 10173: **hindi kinukuha ang amount paid**).
5. **Step 5 (Printable 1:1 `OfficialApplicationForm` & Submit):**
   * Ipakita ang inline 1:1 official LGU form preview at i-click ang **`Submit Application`** -> status **`Pending`**.

---

### Yugto 5: OVM / LLSA I Pre-Payment Review (FR-5, FR-6)
* **Sino:** OVM / LLSA I Staff (`llsa.tester@gtrams.com` / `Password123!`)  
* **Pahina:** `/franchise-approval` (`Needs Review` tab) -> `/franchise-approval/review/:id`  

1. Buksan ang aplikasyon ni Juan Dela Cruz at ipakita ang **Side-by-Side Document Comparator**, **1:1 Printable Official Application Form modal**, at **Pre-Payment Record Check** (prior violations & TODA match).
2. Pindutin ang **`Approve for Payment`** -> lilipat sa **`For Payment`** (may 10-second Undo countdown toast; zero payment shortcut sa staff UI).

---

### Yugto 6: Municipal Treasury Cashiering (FR-7)
* **Sino:** Cashier Maria Clara (`cashier.tester@gtrams.com` / `Password123!`)  
* **Pahina:** `/cashier-dashboard`  

1. Sa **For Payment** queue, pindutin ang **"Process Payment"** (Cash Over-the-Counter; walang Reject button ang Cashier).
2. I-encode ang physical **Official Receipt (OR) Number** (`OR-GASAN-2026-0042`) at Payer Name (`Juan Dela Cruz`), at i-confirm.
3. Awtomatikong mag-a-allocate ng sequential `YYYY-NNN` MTOP number, magse-save sa immutable `PaymentLedger`, at lalabas ang **Printable E-Resibo** + **COA Daily Treasury Remittance Sheet** (may CSV export).

---

### Yugto 7: OVM Endorsement, Issuance, Live `Expire` & Cancellations (FR-8)
* **Sino:** OVM / LLSA I Staff (`llsa.tester@gtrams.com` / `Password123!`)  
* **Pahina:** `/franchise-approval` & `/franchise-masterlist`  

1. I-advance mula **`For Signing`** -> **`Ready for Pickup`** -> **`Active`**.
2. Ipakita ang **`/franchise-masterlist`**, **`Expire`** action button para sa live `Expired -> Renew Franchise` simulation, **`Cancellations` Tab**, at **`/manage-revocations`** (3-Tier Violations + Grave Offense).

---

### Yugto 8: Watermarked E-Copy & Public QR Verification (`/verify/:id`) (FR-9)
* **Sino:** Operator (`operator.tester@gtrams.com`) / Public Commuter or Enforcer (logged-out)  
* **Pahina:** `/operator-dashboard` & `/verify/:id`  

1. Sa Operator Dashboard, buksan ang E-Copy na may diagonal security watermark at QR code.
2. I-scan ang QR code patungong **`/verify/:id`** -> lalabas agad ang live status (**`Active`**, Plate, MTOP No., Zone) nang hindi naglalabas ng pribadong phone number o home address (RA 10173 Data Minimization).

---

## 4. On-Demand Defense Appendix: Edge Cases (`sample_docs/MALI/`)

| Kung Ano ang Tanong ng Panelista | Sample File (`sample_docs/MALI/`) | Resulta sa System |
| :--- | :--- | :--- |
| **"Paano kapag expired ang lisensya?"** | `01_mali_license_EXPIRED.png` | Red alert: expired license blocked from approval cleanly. |
| **"Paano kapag hindi tugma ang pangalan sa CR?"** | `03_mali_cr_NAME_MISMATCH.png` | Discrepancy Flagged warning sa application at sa OVM / LLSA I review comparator. |
| **"Paano kung malabo o selfie ang in-upload?"** | `08_mali_NOT_A_DOCUMENT_BLURRY.png` | Classification guard rejects invalid image & auto-resets previous scan state on replacement. |
| **"Paano kung taga-ibang bayan ang Barangay Clearance?"** | `05_mali_brgy_WRONG_MUNICIPALITY.png` | Out-of-jurisdiction warning flag laban sa 25 Barangays ng Gasan. |

---

## 5. Gabay sa mga Posibleng Itanong ng Panel

1. **Bakit walang GCash/Maya sa Cashier?** — Mahigpit na Cash Over-the-Counter gamit ang physical accountable OR booklets alinsunod sa Municipal Treasury at COA rules.
2. **Bakit hiwalay ang IT `system_admin` at `llsa.tester` (OVM/LLSA I)?** — Alinsunod sa Role Separation & Least Privilege governance: walang approval powers ang IT Admin at walang system backup/settings access ang licensing staff.
3. **Bakit hindi kinukuha ang Blood Type at Cedula Payment Amount?** — Data Minimization sa **Data Privacy Act of 2012 (RA 10173)**.
4. **Paano kung lumipat ng TODA ang Operator?** — May Voluntary Cancellation workflow (Module 8) na nag-a-archive ng lumang prangkisa at nagpapalaya ng unit slot, habang ipinapasa ng `disciplineHelper.js` ang anumang active warning/sanction.

---

## 6. Hybrid Failover Strategy (Vercel + Localhost `3000/5173`)
* Simulan ang demo sa cloud (`https://g-trams-official.vercel.app`).
* Kung bumagal ang Wi-Fi sa campus, patakbuhin ang **`start_local_demo.bat`** o `cd backend && npm start` (**Port `3000`** matching `frontend/.env.local`) + `cd frontend && npm run dev` (**Port `5173`**).
