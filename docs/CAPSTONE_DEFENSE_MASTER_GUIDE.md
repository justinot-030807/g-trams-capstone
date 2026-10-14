# G-TRAMS Capstone Defense Master Guide & Functional Requirements Test Flow

**Gasan Tricycle Regulatory and Application Management System (G-TRAMS)**  
*Pamahalaang Bayan ng Gasan, Marinduque • Office of the Municipal Vice Mayor*  
**Document Type:** Formal Capstone Defense Live Demo Script & Functional Requirements (FR) Verification Plan  
**Target Audience:** Capstone Defense Panelists, Subject Matter Experts (SMEs), and Technical Evaluators  
**System Version:** Release Candidate 3.1 (Production Ready)  

---

## 1. Quick Master Credentials Cheat Sheet

Lahat ng mga sumusunod na test accounts ay aktibo, rehistrado, at naka-seed sa MongoDB Atlas. Pare-pareho ang password para sa maayos at mabilis na pagpapalit-palit ng account habang humaharap sa panel:

| System Role | Account Name | Email / Login Identifier | Password | Designated Zone & Association | Function in Live Demo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Operator (Negative Testing / MALI)** | **Mario Santos** | `operator.mali@gtrams.com` | `Password123!` | Antipolo (South Zone) • Non-Accredited / Unlisted | **Guardrail & Error Verification**: Nagte-test ng expired license, name mismatch, out-of-zone TODA, at malabong dokumento. |
| **Operator (Positive Testing / TAMA)** | **Juan Dela Cruz** | `operator.tester@gtrams.com` | `Password123!` | Barangay I Poblacion (Central Zone) • POB TODA | **Happy Path Pipeline**: Nagte-test ng valid OCR extraction, roster match, 2-unit quota, draft resume, at e-copy download. |
| **TODA President** | **Pedro Santos** | `todapres.tester@gtrams.com` | `Password123!` | POB TODA (Poblacion Central Association) | **Association Gatekeeping**: Nagdi-digitize at nag-a-upload ng opisyal na listahan ng mga kasapi (Masterlist Roster). |
| **Municipal Treasury Cashier** | **Maria Clara** | `cashier.tester@gtrams.com` | `Password123!` | Gasan Municipal Treasury Office (Counter 2) | **Revenue Collection**: Nagpoproseso ng Cash Over-the-Counter at nagla-log ng physical Official Receipt (OR) booklet serials. |
| **Licensing Officer / Admin** | **Tester Admin (OVM)** | `admin.tester@gtrams.com` | `Password123!` | Office of the Municipal Vice Mayor (BPLO) | **Compliance Review & Executive Release**: Nagsasagawa ng pre-payment record checks, batch MTOP printing, at final approvals. |

---

## 2. Directory Structure ng Sample Test Documents (`sample_docs/`)

Ang mga test documents ay nakalagay sa repository sa dalawang hiwalay na folder upang masigurong organisado at hindi magkahalo habang nagde-demo:

### A. Folder: `sample_docs/MALI/` (Para sa Negative & Anti-Fraud Testing)
| File Name | Target Upload Field | Injected Defect / Error to be Verified by System |
| :--- | :--- | :--- |
| `01_mali_license_EXPIRED.png` | Driver's License (Front) | **Expired DL (2022)**: Awtomatikong hina-highlight ng pula at naglalabas ng validation error. |
| `02_mali_license_WRONG_CODE.png` | Driver's License (Front) | **Invalid Restriction Code**: Code B lamang (4-wheels), walang Code A/A1 para sa tricycle. |
| `03_mali_cr_NAME_MISMATCH.png` | Certificate of Registration (CR) | **Owner Discrepancy**: Nakapangalan kay Ricardo Dalisay imbes na sa aplikante (Mario Santos). |
| `04_mali_cr_FAKE_CHASSIS.png` | Certificate of Registration (CR) | **Serial Mismatch**: Chassis number na hindi tugma sa in-encode na datos ng sasakyan. |
| `05_mali_brgy_WRONG_MUNICIPALITY.png` | Barangay Clearance | **Out-of-Jurisdiction**: Clearance na galing sa Munisipalidad ng Boac (labas sa Gasan LGU). |
| `06_mali_toda_UNAUTHORIZED_ASSOCIATION.png` | TODA Certificate | **Unregistered TODA**: Samahan na wala sa 17 opisyal at akreditadong TODA ng Gasan. |
| `07_mali_cedula_EXPIRED_YEAR.png` | Community Tax Certificate (Cedula) | **Lapse in Fiscal Year**: Sedula na may petsang 2020 (kailangang valid para sa kasalukuyang taon). |
| `08_mali_NOT_A_DOCUMENT_BLURRY.png` | Any Document Upload Slot | **Unreadable / Invalid Media**: Blurry o pekeng imahe; re-upload alert ang ibinubuga ng AI OCR. |

### B. Folder: `sample_docs/TAMA/` (Para sa Positive / Happy Path Testing ni Juan Dela Cruz)
| File Name | Target Upload Field | Validated System Content |
| :--- | :--- | :--- |
| `01_license_front_TAMA.png` | Driver's License (Front) | Juan Dela Cruz, Valid hanggang 2028, Restriction Codes A & A1, Excludes Blood Type. |
| `02_license_back_TAMA.png` | Driver's License (Back) | LTO Official Barcode at Serial Number `SN-884719203948`. |
| `03_lto_cr_TAMA.png` | Certificate of Registration (CR) | Registered Owner: Juan Dela Cruz, Plate: `4528-TC`, Engine: `KF51E7890123`, Chassis: `MH1KF5178PK098231`. |
| `04_lto_or_TAMA.png` | Official Receipt (OR) | Hiwalay na LTO OR na nagpapatunay ng bayad sa taunang rehistro ng sasakyan. |
| `05_brgy_clearance_TAMA.png` | Barangay Clearance | Barangay I (Poblacion), Gasan, Marinduque; nilagdaan ng Punong Barangay. |
| `06_toda_certificate_TAMA.png` | TODA Endorsement Certificate | POB TODA Association Endorsement na may itinalagang Unit/Body Number #01. |
| `07_cedula_TAMA.png` | Community Tax Certificate (Cedula) | Juan Dela Cruz, CTC No. `CC12012 11793510`, Amount Paid ₱55.00, Place of Issue: Gasan. |
| `08_toda_roster_TAMA.png` | TODA Masterlist File | Opisyal na Roster Document ng POB TODA kung saan nakatala ang pangalan ni Juan Dela Cruz. |

---

## 3. Functional Requirements (FR) Traceability Matrix

Ipinapakita sa matrix na ito kung aling functional requirement ang pinatutunayan sa bawat bahagi ng demonstrasyon:

| FR Identifier | Functional Requirement Description | Testing Mode | Input Data / Account | Acceptance Criteria / Expected Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **FR-1** | Role-Based Access Control (RBAC) & Session Gatekeeping | Positive & Boundary | Operator, TODA Pres, Cashier, Admin | Ang bawat role ay nagbubukas lamang ng kanilang sariling modules; bawal ang unauthorized cross-page access. |
| **FR-2** | TODA Masterlist Digitization & Association Gatekeeping | Positive & Negative | `sample_docs/MALI/06` vs `sample_docs/TAMA/08` | Binabalaan ang aplikante kung wala sa roster; awtomatikong kinukumpirma kung verified member. |
| **FR-3** | Multi-Step Application Form, Draft Autosave & Quota Limits | Positive & Boundary | Mario Santos & Juan Dela Cruz | Naise-save ang draft kapag na-refresh; mahigpit na ipinapatupad ang maximum 2 motorized units bawat indibidwal. |
| **FR-4** | Multimodal AI OCR Field Extraction & PII Compliance | Positive | `sample_docs/TAMA/` (01 to 07) | Awtomatikong kinukuha ang Plate, Chassis, Engine, DL Codes, at DOB para sa renewal; hindi kinukuha ang blood type. |
| **FR-5** | Automated Data Integrity & Anti-Fraud Guardrails | Negative Testing | `sample_docs/MALI/` (01 to 08) | Nahuhuli ang expired license, name mismatch sa pagitan ng applicant at CR, out-of-town clearance, at malabong imahe. |
| **FR-6** | LGU Pre-Payment Administrative Record Check | Positive | Admin Review (`/franchise-approval`) | Sinusuri ng system kung may dating huli o revocation bago i-endorse sa Treasury; walang bayad hangga't hindi clean record. |
| **FR-7** | Municipal Treasury Cashiering & Physical OR Logging | Positive | Cashier Module (`/cashier`) | Naka-lock sa Cash Over-the-Counter; kinakailangan ang manual physical booklet OR number; bawal i-reject ng kahera. |
| **FR-8** | Executive Endorsement, Batch MTOP Printing & Certification | Positive | Admin Signing Tab | Sabayang pag-print ng certificates (Batch Print); pormal na paglagda bago maging "Ready for Pickup". |
| **FR-9** | Watermarked Electronic MTOP Copy & QR Authentication | Positive | Operator Dashboard & QR Scanner | Pag-isyu ng downloadable copy na may diagonal watermark ("APPROVED - ELECTRONIC COPY") at scannable public QR code. |

---

## 4. Formal Defense Live Demo Script (Step-by-Step Execution)

### Bahagi 1: Technical Introduction & System Architecture (1 Minuto)
* **Tagapagsalita (Presenter):**
  > *"Magandang araw po sa ating mga kagalang-galang na panelists, technical evaluators, at sa ating research adviser. Ipinagmamalaki po ng aming grupo na i-present ang live system demonstration ng **G-TRAMS: Gasan Tricycle Regulatory and Application Management System**.*  
  >  
  > *Ang demonstrasyong ito ay binuo alinsunod sa aming **Software Requirements Specification (SRS)** at nakatuon sa pagpapatunay ng siyam (9) na core functional requirements ng system. Upang patunayan ang katatagan ng aming data validation, hahatiin po namin ang live demonstration sa dalawang bahagi:*  
  > *1. **Negative Verification Testing:** Paggamit ng 'Error Injection Account' upang ipakita kung paano hinaharang at wina-warningan ng system ang mga expired, invalid, at fraudulent na dokumento.*  
  > *2. **Positive Compliance Pipeline:** Pagsunod sa kumpletong legal workflow ng Gasan LGU mula sa asosasyon, BPLO verification, Treasury cashiering, hanggang sa opisyal na pag-release ng watermarked electronic permit."*

---

### Bahagi 2: Negative Testing & Anti-Fraud Guardrails (FR-2, FR-4, FR-5)
* **Gamiting Account:** **Mario Santos** (MALI / Unaccredited Operator)  
* **Login Credentials:** `operator.mali@gtrams.com` / `Password123!`  
* **Pahina:** `/apply-franchise`  
* **Layunin:** Patunayan na hindi tinatanggap ng G-TRAMS ang mga may depektong datos at dokumento.

#### Hakbang 2.1: Pagsubok sa Out-of-Jurisdiction at TODA Roster Alert (FR-2)
1. Mag-login bilang `operator.mali@gtrams.com`.
2. I-click ang **"Apply Franchise"** (`/apply-franchise`).
3. Sa **Step 1: Operator Profile & Association Selection**:
   * Piliin ang Barangay: **Antipolo** (South Zone).
   * Sa dropdown ng TODA, pumili ng asosasyon o subukang magpatuloy nang hindi kabilang sa approved roster.
   * **Ipakita sa Panel:** Awtomatikong lilitaw ang alert banner:
     > `⚠️ Notice: Official TODA Certificate Required: Your name is not currently listed in the official approved roster for this association.`
   * **Technical Spiel sa Panel:**  
     > *"Panelists, alinsunod sa **FR-2 (TODA Masterlist Gatekeeping)**, kapag ang isang indibidwal ay nagtangkang mag-apply sa isang ruta o asosasyon kung saan hindi siya opisyal na nakatala sa masterlist na isinumite ng TODA President, agad itong nade-detect ng system database. Hindi niya maaaring laktawan ang rekisitong ito nang walang validated endorsement certificate."*

#### Hakbang 2.2: Pagsubok sa Expired Driver's License Detection (FR-4, FR-5)
1. Magpatuloy sa **Step 2 (Document Uploads)**.
2. Sa upload slot ng **Driver's License (Front)**, i-upload ang:
   * File: `sample_docs/MALI/01_mali_license_EXPIRED.png`
3. Panoorin ang **Gemini Vision AI OCR processing indicator**.
4. **Ipakita sa Panel ang Resulta:**
   * Babasahin ng system ang Expiration Date: `2022-05-10`.
   * Awtomatikong magkukulay pula ang date field at lalabas ang error alert:
     > `❌ Validation Alert: License Expired. Please upload a currently valid driver's license.`
   * **Technical Spiel sa Panel:**  
     > *"Ipinapakita po rito ang **FR-5 (Automated Anti-Fraud Guardrail)**. Hindi lamang simpleng image uploader ang G-TRAMS. Gamit ang Vision OCR, binabasa ng system ang petsa ng validity ng lisensya. Dahil expired noong 2022 ang lisensya ni Mario Santos, agad itong mina-markahan ng system bilang non-compliant, kaya maiiwasan ang human error sa panig ng receiving clerks."*

#### Hakbang 2.3: Pagsubok sa Owner Mismatch sa Pagitan ng Applicant at LTO CR (FR-4, FR-5)
1. Sa upload slot ng **Certificate of Registration (CR)**, i-upload ang:
   * File: `sample_docs/MALI/03_mali_cr_NAME_MISMATCH.png`
2. **Ipakita sa Panel ang Resulta:**
   * Ang nakarehistrong may-ari sa CR ay si **Ricardo Dalisay**, habang ang nag-a-apply na operator ay si **Mario Santos**.
   * Maglalabas ang system ng discrepancy notice:
     > `⚠️ Discrepancy Flagged: Registered owner in Certificate of Registration does not match applicant identity.`
   * **Technical Spiel sa Panel:**  
     > *"Alinsunod sa Municipal Franchising Ordinance, ang prangkisa ay iginagawad lamang sa lehitimong may-ari ng sasakyan. Kapag may disparity sa pagitan ng pangalan ng aplikante at ng nakatala sa LTO CR, awtomatikong nagtatala ang database ng Discrepancy Flag para sa masusing imbestigasyon ng BPLO."*
3. **Mag-logout mula kay Mario Santos.**

---

### Bahagi 3: Positive Testing & Automated Pipeline Execution (FR-1, FR-3, FR-4)
* **Gamiting Account:** **Juan Dela Cruz** (TAMA / Accredited Operator)  
* **Login Credentials:** `operator.tester@gtrams.com` / `Password123!`  
* **Pahina:** `/apply-franchise`  
* **Layunin:** Ipakita ang maayos, automated, at lehitimong proseso ng aplikasyon.

#### Hakbang 3.1: Operator Profile, TODA Verification, at Fleet Quota (FR-2, FR-3)
1. Mag-login bilang `operator.tester@gtrams.com`.
2. I-click ang **"Apply Franchise"** (`/apply-franchise`).
3. **Ipakita ang mga sumusunod na feature sa Step 1:**
   * Piliin ang Barangay: **Barangay I (Poblacion)**.
   * Sa TODA dropdown, piliin ang **POB TODA**.
   * **Live Verification Badge:** Makikita ang berdeng badge:
     > `✓ Verified in Official TODA Roster (Active Member)`
   * **Driver Designation Structure:** Ipakita na may pagpipilian:
     1. **Operator-Driver** (Siya mismo ang magmamaneho ng unit).
     2. **Operator Only (Hired Driver)** (I-click saglit ito upang makita ng panel na nagbubukas ito ng hiwalay na form para sa pag-encode ng credentials ng kinuha niyang tsuper). Ibalik sa *Operator-Driver*.
   * **Fleet Quota Limit:** Ituro sa panel ang tagapagpahiwatig ng quota:
     > `Unit 1 of 2 Allowed (Individual Operator Ceiling: 2 Units Max)`
   * **Draft Autosave & Recovery:**
     * Mag-type ng numero sa Contact field.
     * Pindutin ang "Home" icon o i-refresh ang browser (`F5`).
     * Pagkabalik sa portal, magpa-pop up ang **Resume Draft Modal**. Pindutin ang **"Resume Draft"** at ipakita na buo pa rin ang in-encode na impormasyon.
   * **Technical Spiel sa Panel:**  
     > *"Dito po sa Step 1, pinatutunayan natin ang tatlong rekisito: (1) Ang awtomatikong cross-matching sa TODA masterlist, (2) Ang fleet quota enforcement na naglilimita sa 2 units bawat operator upang maiwasan ang monopolyo alinsunod sa Section 4 ng ordinansa, at (3) Ang fault-tolerant Draft Autosave feature na sumasalo sa form kung sakaling magkaroon ng accidental navigation o page reload."*

#### Hakbang 3.2: Automated Vision Extraction para sa LTO at Driver's License (FR-4)
1. Mag-click ng **"Next"** patungong **Step 2 (Vehicle & LTO Documentation)**.
2. **Magkahiwalay na LTO CR at OR:**
   * Sa CR slot: I-upload ang `sample_docs/TAMA/03_lto_cr_TAMA.png`.
   * Sa OR slot: I-upload ang `sample_docs/TAMA/04_lto_or_TAMA.png`.
   * Panoorin ang pag-extract ng AI: Awtomatikong pupunuan ang **Plate Number (`4528-TC`)**, **Engine Number (`KF51E7890123`)**, at **Chassis Number (`MH1KF5178PK098231`)**.
3. **Driver's License (Front & Back):**
   * Sa Front slot: I-upload ang `sample_docs/TAMA/01_license_front_TAMA.png`.
   * Sa Back slot: I-upload ang `sample_docs/TAMA/02_license_back_TAMA.png`.
   * **Ipakita sa Panel:**
     * Nakuha ang **Restriction Codes: A at A1** (Awtorisadong magmaneho ng tricycle).
     * Nakuha ang **Date of Birth** ng tsuper (Mahalaga para sa taunang birthday-based renewal schedule).
     * **Data Privacy / PII Compliance:** Ipakita na **hindi kinuha ang Blood Type** upang maiwasan ang unneeded biometric data alinsunod sa Data Privacy Act (RA 10173).
   * **Technical Spiel sa Panel:**  
     > *"Alinsunod sa mga panuntunan ng LTO at Data Privacy Act, magkahiwalay nating pinoproseso ang CR (patunay ng pagmamay-ari) at OR (patunay ng taunang rehistro). Bukod dito, ang aming multimodal OCR pipeline ay may strict field pruning: kinukuha lamang ang Driver's License codes at birth date para sa renewal tracking, habang sinasadyang iwan ang blood type upang maprotektahan ang medical privacy ng tsuper."*

#### Hakbang 3.3: Barangay Clearance, TODA Endorsement, at Sedula (FR-4)
1. Mag-click ng **"Next"** patungong **Step 3 (Clearances & Community Tax Certificate)**.
2. I-upload ang:
   * Barangay Clearance: `sample_docs/TAMA/05_brgy_clearance_TAMA.png`
   * TODA Certificate: `sample_docs/TAMA/06_toda_certificate_TAMA.png`
   * Cedula (CTC): `sample_docs/TAMA/07_cedula_TAMA.png`
3. Awtomatikong kukunin ng OCR ang: CTC Serial Number (`CC12012 11793510`), Taon (`2026`), at Binayarang Halaga (`₱55.00`).
4. Mag-click ng **"Next"** patungong **Step 4 (Summary & Submission)**.
5. Pindutin ang **"Submit Application"**.
6. Makikita ang prompt na matagumpay na naitala ang aplikasyon na may status na **"Pending (Needs Review)"**.
7. **Mag-logout mula kay Juan Dela Cruz.**

---

### Bahagi 4: Association Roster Submission & Digitization (FR-2)
* **Gamiting Account:** **Pedro Santos** (TODA President)  
* **Login Credentials:** `todapres.tester@gtrams.com` / `Password123!`  
* **Pahina:** `/submit-members`  
* **Layunin:** Ipakita kung paano nagiging digital searchable roster ang physical paper lists ng TODA.

1. Mag-login bilang `todapres.tester@gtrams.com`.
2. Pumunta sa **"Submit Members"** (`/submit-members`).
3. I-upload ang masterlist image: `sample_docs/TAMA/08_toda_roster_TAMA.png`.
4. **Ipakita sa Panel ang Real-Time Digitization:**
   * Agad na magko-convert ang imahe patungong editable tabular data na may mga hanay:
     * Full Name (e.g., Juan Dela Cruz)
     * Body/Unit Number (#01)
     * Plate Number (4528-TC)
5. Pindutin ang **"Submit TODA Roster"**.
6. **Technical Spiel sa Panel:**  
   > *"Ito po ang **FR-2 (TODA Masterlist Digitization)**. Dati po ay nakasulat-kamay lamang ang mga masterlist ng mga asosasyon. Sa pamamagitan ng portal ng TODA President, ang dokumento ay agad na na-e-extract patungong structured database, na nagsisilbing digital ground truth para sa verification ng LGU."*
7. **Mag-logout mula kay Pedro Santos.**

---

### Bahagi 5: Administrative Pre-Payment Review (FR-5, FR-6)
* **Gamiting Account:** **Tester Admin** (OVM Licensing Officer)  
* **Login Credentials:** `admin.tester@gtrams.com` / `Password123!`  
* **Pahina:** `/franchise-approval`  
* **Layunin:** Ipakita ang compliance record check bago payagang magbayad ang aplikante.

1. Mag-login bilang `admin.tester@gtrams.com`.
2. Pumunta sa **"Franchise Approval"** (`/franchise-approval`) sa ilalim ng tab na **"Needs Review"**.
3. Buksan ang bagong aplikasyon ni **Juan Dela Cruz**.
4. **Ipakita sa Panel ang Automated Record Check Card:**
   * `Prior Violations / Revocations:` **(✓ Clean Record) No recorded violations or suspensions.**
   * `TODA Cross-Matching:` **✓ Verified Active Member in POB TODA Roster.**
   * `Document Verification Integrity:` Lahat ng LTO, License, at Clearance credentials ay may berdeng checkmark.
5. Pindutin ang action button na: **"Send to Cashier (For Payment)"**.
6. **Technical Spiel sa Panel:**  
   > *"Dito po sa **FR-6**, mahigpit nating itinatama ang karaniwang maling daloy ng proseso: **Hindi pinapayagang magbayad sa Cashier ang aplikante kung hindi pa nasusuri ang kanyang record**. Sinisigurado muna ng BPLO na walang pending traffic violation o revocation bago i-endorse ang assessment bill sa Treasury."*
7. **Mag-logout mula sa Admin account.**

---

### Bahagi 6: Municipal Treasury Cashiering & Physical Receipt Logging (FR-7)
* **Gamiting Account:** **Maria Clara** (Municipal Treasury Cashier)  
* **Login Credentials:** `cashier.tester@gtrams.com` / `Password123!`  
* **Pahina:** `/cashier`  
* **Layunin:** Patunayan ang revenue collection controls alinsunod sa Commission on Audit (COA).

1. Mag-login bilang `cashier.tester@gtrams.com`.
2. Sa pila ng **"Awaiting Payment"**, makikita ang assessment para kay **Juan Dela Cruz** (Halaga: **₱500.00**).
3. Pindutin ang **"Process Payment"**.
4. **Ipakita sa Panel ang mga Espesipikong Patakaran ng Cashier Module:**
   * **Payment Method:** Naka-lock sa `Cash (Over-the-Counter)`.
   * **Walang Reject Button:** *(Ipaliwanag: Ang tungkulin ng Kahera ay tumanggap ng bayad at mag-isyu ng resibo; ang ebalwasyon ng dokumento ay eksklusibo sa BPLO).*
   * **Manual OR Booklet Number Encoding:** I-type ang opisyal na serial number mula sa resibo ng munisipyo, halimbawa:
     > `OR-GASAN-2026-0042`
   * Payer Name: `Juan Dela Cruz`
5. Pindutin ang **"Confirm Payment"**.
6. Makikita ang success notification na nagpapatunay na naitala ang transaksyon sa accounting ledger na may timestamp at cashier identity.
7. **Technical Spiel sa Panel:**  
   > *"Alinsunod sa **FR-7**, ang aming cashier module ay sumusunod sa physical cash collection protocol ng Municipal Treasury ng Gasan. Walang arbitrary rejection sa panig ng kahera, at bawat transaksyon ay mahigpit na nakatali sa opisyal na physical Official Receipt (OR) booklet serial number alinsunod sa panuntunan ng COA."*
8. **Mag-logout mula kay Maria Clara.**

---

### Bahagi 7: Executive Endorsement & Batch MTOP Printing (FR-8)
* **Gamiting Account:** **Tester Admin** (OVM Licensing Officer)  
* **Login Credentials:** `admin.tester@gtrams.com` / `Password123!`  
* **Pahina:** `/franchise-approval?tab=signing`  
* **Layunin:** Ipakita ang pinal na pagpirma at pag-release ng prangkisa pagkatapos makabayad.

1. Mag-login muli bilang `admin.tester@gtrams.com`.
2. Pumunta sa **"Franchise Approval"** at buksan ang tab na **"For Signing"**.
3. Makikita si Juan Dela Cruz sa listahan na may markang: `Payment Verified (OR-GASAN-2026-0042)`.
4. **Ipakita ang Printing Features:**
   * **Single Print MTOP:** Ipakita ang printable preview ng opisyal na Certificate of Motorized Tricycle Operator's Permit na may pirma ng Municipal Vice Mayor at SB Committee Chairman.
   * **Batch Print MTOP:** Ipakita ang kakayahan ng system na mag-print ng maramihang naaprubahang prangkisa sa isang click para sa mabilis na releasing.
5. Pindutin ang **"Approve & Mark Ready for Pickup"**.
6. **Technical Spiel sa Panel:**  
   > *"Sa ilalim ng **FR-8**, pumapasok lamang sa 'For Signing' stage ang prangkisa kapag may kumpirmadong resibo mula sa Treasury. Pagkatapos lagdaan ng Punong Bayan at ng Bise Alkalde, minamarkahan ito bilang 'Ready for Pickup' upang makuha ng operator ang kanyang orihinal na certificate at tricycle stickers sa munisipyo."*
7. **Mag-logout mula sa Admin account.**

---

### Bahagi 8: Watermarked Electronic Issuance & Public QR Verification (FR-9)
* **Gamiting Account:** **Juan Dela Cruz** (Operator)  
* **Login Credentials:** `operator.tester@gtrams.com` / `Password123!`  
* **Pahina:** `/dashboard`  
* **Layunin:** Ipakita ang digital copy na may anti-tamper watermark at live QR scanning.

1. Mag-login bilang `operator.tester@gtrams.com`.
2. Sa **Operator Dashboard**, makikita ang updated badge: **"Ready for Pickup"**.
3. Pindutin ang **"View E-Copy (Approved MTOP)"**.
4. **Ipakita sa Panel ang Anti-Tamper Security Features:**
   * Ang certificate ay may malinaw na **diagonal security watermark** sa buong dokumento:
     > **"APPROVED - ELECTRONIC COPY • VALID ISSUANCE"**
   * May nakalagay na paalala na ang opisyal na orihinal na hardcopy at stickers ay kukunin sa BPLO Office.
   * Mayroong dynamic **QR Code** sa kanang ibaba ng dokumento.
5. **Live QR Verification (Subukan sa Harap ng Panel):**
   * Gamit ang camera ng smartphone o laptop webcam, i-scan ang QR code sa screen.
   * Awtomatikong magbubukas ang public verification page (`/verify-franchise/:id`) na nagpapakita ng:
     * MTOP Number
     * Operator Name
     * Unit Specs (Plate, Motor, Chassis)
     * Validity Period (3 Years)
     * Official Status: **ACTIVE & ISSUED**
6. **Concluding Spiel sa Panel:**  
   > *"Bilang pagtatapos sa aming demonstrasyon sa ilalim ng **FR-9**, ang E-Copy na may diagonal watermark ay nagbibigay ng agarang legal na patunay sa operator habang hinihintay ang physical stickers, habang ang integrated QR code naman ay nagbibigay-daan sa ating mga traffic enforcers sa kalsada na ma-authenticate ang prangkisa nang real-time nang hindi nangangailangan ng panibagong login o espesyal na hardware."*

---

## 5. Gabay sa mga Posibleng Itanong ng Panel (Defense Q&A Preparedness)

### Q1: "Bakit walang online payment (GCash/Maya) sa inyong Cashier module?"
* **Teknikal at Legal na Sagot:**  
  *"Alinsunod po sa aming isinagawang stakeholder interviews sa Municipal Treasury Office ng Gasan, ang pangongolekta ng bayad sa MTOP ay mahigpit na ginagawa via Cash Over-the-Counter lamang. Ito po ay nakatali sa kanilang pre-printed, accountable physical receipt booklets (Official Receipts) na may auditable serial numbers alinsunod sa panuntunan ng Commission on Audit (COA). Sinunod po ng G-TRAMS ang umiiral na legal at accounting protocol ng LGU kaysa magpatupad ng hindi pa awtorisadong online channel."*

### Q2: "Bakit kailangang magkahiwalay ang upload ng LTO CR at LTO OR?"
* **Teknikal at Legal na Sagot:**  
  *"Magkaiba po ang legal na layunin ng dalawang dokumentong ito:  
  1. Ang **Certificate of Registration (CR)** ay patunay ng permanenteng pagmamay-ari at teknikal na detalye ng motorsiklo (Chassis at Motor serials).  
  2. Ang **Official Receipt (OR)** naman ay patunay ng taunang bayad sa rehistro sa LTO.  
  Kapag pinagsama ito, hindi masusuri ng system kung napapanahon ang rehistro sa LTO. Sa pamamagitan ng paghihiwalay sa kanila, natitiyak ng aming AI validation na parehong rehistrado at updated ang sasakyan."*

### Q3: "Paano ninyo pinipigilan ang monopolyo ng mga indibidwal sa prangkisa?"
* **Teknikal at Legal na Sagot:**  
  *"Alinsunod sa Section 4 ng Gasan Municipal Franchising Ordinance, ipinatupad po namin ang **Fleet Quota Limit Validation** sa backend API (`maxUnits = 2`). Kapag ang isang operator account ay mayroon nang dalawang (2) aktibong rehistradong prangkisa, awtomatikong ila-lock ng system ang application form at maglalabas ng quota restriction alert."*

### Q4: "Bakit hindi kinukuha ng inyong AI OCR ang Blood Type mula sa lisensya?"
* **Teknikal at Legal na Sagot:**  
  *"Alinsunod sa **Data Privacy Act of 2012 (RA 10173)** at sa prinsipyo ng **Data Minimization**, kinukuha lamang ng system ang mga datos na kailangan para sa regulasyon ng prangkisa: ang Driver's License codes (A/A1) para sa awtorisasyon, at ang Date of Birth para sa iskedyul ng taunang renewal. Ang blood type ay sensitive personal health information na walang kinalaman sa prangkisa, kaya sinadya po itong alisin sa aming extraction schema."*

---

## 6. Gabay sa Deployment: Vercel vs. Localhost (Pang-defense na Estratehiya)

> [!IMPORTANT]
> **Rekomendasyon para sa Defense: "Hybrid Fallback Strategy"**

1. **Bentahe ng Naka-deploy sa Vercel (`https://g-trams-official.vercel.app`):**
   * Malaking puntos sa evaluation kung may live public URL dahil pinatutunayan nito na cloud-ready at accessible sa munisipyo ang system.
   * Maaaring subukan ng panelists na buksan ang QR verification sa kanilang sariling mga cellphone.

2. **Ang Kritikal na Banta sa Live Cloud:**
   * **Backend Sleep:** Kung ang backend API ay nasa libreng hosting (tulad ng Render o Railway), nag-i-sleep ito kapag walang request sa loob ng 15 minuto (tumatagal ng 30–50 segundo bago muling mag-respond).
   * **Unstable Wi-Fi sa Defense Room:** Ang Wi-Fi sa mga unibersidad ay madalas bumagal o mawalan ng signal habang nagde-defense.

3. **Ang Propesyonal na Hakbang (Hybrid Failover):**
   * **Bago Pumasok sa Room:** Buksan ang command prompt sa laptop at patakbuhin ang local backend at local frontend:
     ```bash
     # Terminal 1 (Backend):
     cd c:\Users\Hp\GTRAMS\backend
     npm run dev

     # Terminal 2 (Frontend):
     cd c:\Users\Hp\GTRAMS\frontend
     npm run dev
     ```
   * **Buksan sa Browser:** Mag-open ng dalawang tab:
     * Tab 1: Ang live Vercel URL.
     * Tab 2: Ang `http://localhost:5173`.
   * **Diskarte:** Simulan ang demo sa Vercel. Kung mabilis ang cloud, magpatuloy roon. Kung makaranas ng loading delay sa Wi-Fi, sabihin agad nang may kumpiyansa sa panel:  
     > *"Upang mas masubok po natin nang mabilis ang high-throughput AI OCR nang walang latency mula sa campus Wi-Fi, ililipat po natin ang visual display sa aming isolated local staging server sa port 5173."*
