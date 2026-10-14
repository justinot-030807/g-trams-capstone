# G-TRAMS Capstone Defense Master Guide & Functional Requirements Test Flow

**Gasan Tricycle Regulatory and Application Management System (G-TRAMS)**  
*Pamahalaang Bayan ng Gasan, Marinduque • Office of the Municipal Vice Mayor*  
**Document Type:** Formal Capstone Defense Live Demo Script & Functional Requirements (FR) Verification Plan  
**Target Audience:** Capstone Defense Panelists, Subject Matter Experts (SMEs), and Technical Evaluators  
**System Version:** Release Candidate 3.1 (Production Ready)  

---

## 1. Quick Master Credentials Cheat Sheet

Lahat ng mga test accounts na ito ay aktibo at naka-seed sa MongoDB Atlas. Pare-pareho ang password para sa mabilis at walang kalatong na pagpapalit-palit ng account sa harap ng panel:

| System Role | Account Name | Email / Login Identifier | Password | Designated Zone & Association | Function in Live Demo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Operator (Happy Path / Demo Main)** | **Juan Dela Cruz** | `operator.tester@gtrams.com` | `Password123!` | Barangay I Poblacion (Central Zone) • POB TODA | **Primary End-to-End Pipeline**: Pag-apply, AI OCR auto-fill, TODA check, quota limit, draft resume, at E-Copy retrieval. |
| **TODA President** | **Pedro Santos** | `todapres.tester@gtrams.com` | `Password123!` | POB TODA (Poblacion Central Association) | **Association Gatekeeping**: Pag-upload at pag-digitize ng opisyal na masterlist roster ng samahan. |
| **Licensing Officer / Admin** | **Tester Admin (OVM)** | `admin.tester@gtrams.com` | `Password123!` | Office of the Municipal Vice Mayor (BPLO) | **Compliance Review & Executive Release**: Pag-apruba ng TODA roster, pre-payment record check, at batch MTOP printing. |
| **Municipal Treasury Cashier** | **Maria Clara** | `cashier.tester@gtrams.com` | `Password123!` | Gasan Municipal Treasury Office (Counter 2) | **Revenue Collection**: Pagproseso ng Cash Over-the-Counter at pag-record ng physical Official Receipt (OR) booklet serials. |
| **Operator (On-Demand Error Testing)** | **Mario Santos** | `operator.mali@gtrams.com` | `Password123!` | Antipolo (South Zone) • Non-Accredited / Unlisted | **On-Demand Edge Cases**: Gagamitin LAMANG kapag nagtanong ang panel tungkol sa expired license, name mismatch, at pekeng dokumento. |

---

## 2. Directory Structure ng Sample Test Documents (`sample_docs/`)

Ang mga test documents ay nakalagay sa repository sa dalawang hiwalay na folder:

### A. Folder: `sample_docs/TAMA/` (Gagamitin sa Pangunahing Smooth Demo)
| File Name | Target Upload Field | Nilalaman at Validated System Content |
| :--- | :--- | :--- |
| `08_toda_roster_TAMA.png` | TODA Masterlist Roster | Opisyal na Roster Document ng POB TODA kung saan nakatala ang pangalan ni Juan Dela Cruz. |
| `01_license_front_TAMA.png` | Driver's License (Front) | Juan Dela Cruz, Valid hanggang 2028, Restriction Codes A & A1, Excludes Blood Type. |
| `02_license_back_TAMA.png` | Driver's License (Back) | LTO Official Barcode at Serial Number `SN-884719203948`. |
| `03_lto_cr_TAMA.png` | Certificate of Registration (CR) | Registered Owner: Juan Dela Cruz, Plate: `4528-TC`, Engine: `KF51E7890123`, Chassis: `MH1KF5178PK098231`. |
| `04_lto_or_TAMA.png` | Official Receipt (OR) | Hiwalay na LTO OR na nagpapatunay ng bayad sa taunang rehistro ng motorsiklo. |
| `05_brgy_clearance_TAMA.png` | Barangay Clearance | Barangay I (Poblacion), Gasan, Marinduque; nilagdaan ng Punong Barangay. |
| `06_toda_certificate_TAMA.png` | TODA Endorsement Certificate | POB TODA Association Endorsement na may itinalagang Unit/Body Number #01. |
| `07_cedula_TAMA.png` | Community Tax Certificate (Cedula) | Juan Dela Cruz, CTC No. `CC12012 11793510`, Amount Paid ₱55.00, Place of Issue: Gasan. |

### B. Folder: `sample_docs/MALI/` (Standby / On-Demand Kapag Nagtanong ang Panel)
| File Name | Target Upload Field | Injected Defect / Error to be Verified |
| :--- | :--- | :--- |
| `01_mali_license_EXPIRED.png` | Driver's License (Front) | **Expired DL (2022)** — May red highlight at alert na expired ang lisensya. |
| `02_mali_license_WRONG_CODE.png` | Driver's License (Front) | **Invalid Code** — Code B lamang (4-wheels), walang Code A/A1 para sa tricycle. |
| `03_mali_cr_NAME_MISMATCH.png` | Certificate of Registration (CR) | **Owner Discrepancy** — Nakapangalan kay Ricardo Dalisay imbes na kay Mario Santos. |
| `04_mali_cr_FAKE_CHASSIS.png` | Certificate of Registration (CR) | **Serial Mismatch** — Chassis number na hindi tugma sa form. |
| `05_mali_brgy_WRONG_MUNICIPALITY.png` | Barangay Clearance | **Out-of-Jurisdiction** — Clearance mula sa Bayan ng Boac. |
| `06_mali_toda_UNAUTHORIZED_ASSOCIATION.png` | TODA Certificate | **Unregistered TODA** — Samahan na hindi kabilang sa 17 opisyal na TODA ng Gasan. |
| `07_mali_cedula_EXPIRED_YEAR.png` | Community Tax Certificate (Cedula) | **Lapse in Fiscal Year** — Sedula na taong 2020 pa. |
| `08_mali_NOT_A_DOCUMENT_BLURRY.png` | Any Upload Slot | **Unreadable Media** — Blurry/pekeng imahe na ire-reject ng AI OCR. |

---

## 3. Smooth & Fast Main Live Demo Script (The Complete Lifecycle Flow)

> [!TIP]
> **Diskarte sa Presentation:**  
> Simulan agad sa natural at tuluy-tuloy na daloy ng sistema mula sa Asosasyon (TODA), pag-apruba ng Munisipyo, pag-apply ng Operator, pag-review ng BPLO, bayad sa Cashier, hanggang sa pag-release ng may watermark na E-Copy. Walang hinto o palipat-lipat ng error testing upang maging mabilis, malinaw, at propesyonal ang dating sa panel!

---

### Yugto 1: Technical Introduction (30–45 Segundo)
* **Tagapagsalita (Presenter):**
  > *"Magandang araw po sa ating mga kagalang-galang na panelists, technical evaluators, at sa aming research adviser. Ipinagmamalaki po naming i-present ang live system demonstration ng **G-TRAMS (Gasan Tricycle Regulatory and Application Management System)**.*  
  >  
  > *Ang aming live demonstration ay nakatuon sa pagsunod sa opisyal na lifecycle ng franchising sa Munisipalidad ng Gasan alinsunod sa aming Functional Requirements:  
  > 1. **Digitization ng TODA Masterlist** bago ang aplikasyon;  
  > 2. **AI-Assisted Multimodal Application & Quota Enforcement** ng Operator;  
  > 3. **Administrative Pre-Payment Review** ng BPLO;  
  > 4. **Treasury Cashier Collection & Official Receipt Logging**; at  
  > 5. **Executive Endorsement & Watermarked Electronic Issuance** na may real-time QR verification."*

---

### Yugto 2: TODA Masterlist Digitization (FR-2)
* **Sino:** TODA President Pedro Santos (`todapres.tester@gtrams.com` / `Password123!`)  
* **Pahina:** `/submit-members`  
* **Layunin:** Ipakita kung paano nagiging searchable digital table ang papel na masterlist ng asosasyon.

1. **Mag-login bilang Pedro Santos.**
2. Pumunta sa **"Submit Members"** (`/submit-members`).
3. I-click ang **"Browse Files on Device"** at piliin ang:
   * File: `sample_docs/TAMA/08_toda_roster_TAMA.png`
4. **Ipakita sa Panel:**  
   * Awtomatikong i-i-scan ng Gemini Vision OCR ang dokumento sa background.
   * Agad na lalabas ang **Digitized Roster Table** na naglalaman ng:
     * Full Name: **Juan Dela Cruz**
     * Unit / Body No: **#01**
     * Plate Number: **4528-TC**
5. I-click ang **"Submit TODA Roster"**.
6. **Technical Spiel sa Panel:**  
   > *"Alinsunod sa **FR-2**, ang mga pisikal na masterlist ng TODA ay agad nating nako-convert sa structured database. Ito po ang magsisilbing opisyal na batayan ng LGU upang maiwasan ang mga 'colorum' o hindi awtorisadong sumasakay sa ruta."*
7. **Mag-logout.**

---

### Yugto 3: Admin Roster Validation (FR-2, FR-6)
* **Sino:** Tester Admin (`admin.tester@gtrams.com` / `Password123!`)  
* **Pahina:** `/validate-toda`  
* **Layunin:** Patunayan na kailangang aprubahan ng LGU ang masterlist bago magamit ng mga miyembro.

1. **Mag-login bilang Tester Admin.**
2. Pumunta sa **"Validate TODA"** (`/validate-toda`).
3. Buksan ang bagong isinumiteng submission ng **POB TODA**.
4. I-click ang **"Approve"**.
5. **Technical Spiel sa Panel:**  
   > *"Bago maging opisyal ang listahan, sinisiyasat at inaaprubahan ito ng tanggapan ng BPLO. Kapag naaprubahan na, awtomatiko nang kikilalanin ng system ang mga miyembro nito sa online application."*
6. **Mag-logout.**

---

### Yugto 4: Operator Application Pipeline (FR-1, FR-3, FR-4)
* **Sino:** Operator Juan Dela Cruz (`operator.tester@gtrams.com` / `Password123!`)  
* **Pahina:** `/apply-franchise`  
* **Layunin:** Ipakita ang automated multimodal extraction, association verification, at fleet quota controls.

1. **Mag-login bilang Juan Dela Cruz.**
2. I-click ang **"Apply Franchise"** (`/apply-franchise`).
3. **Step 1: Profile, TODA Check, at Quota Management:**
   * Piliin ang Barangay: **Barangay I (Poblacion)**.
   * Sa TODA dropdown, piliin ang **POB TODA**.
   * **Live Verification Badge:** Makikita ang berdeng badge:  
     > `✓ Verified in Official TODA Roster (Active Member)`
   * **Driver Designation Structure:**  
     * Ipakita ang **Operator-Driver** (siya ang may-ari at drayber).  
     * I-click saglit ang **Operator Only (Hired Driver)** upang makita ng panel na may hiwalay na inputs para sa credentials ng kinuha niyang tsuper. Ibalik sa *Operator-Driver*.
   * **Fleet Quota Limit:** Ituro sa panel:  
     > `Unit 1 of 2 Allowed (Individual Operator Ceiling: 2 Units Max)`
   * **Draft Autosave Feature:** Mag-type ng contact number. I-refresh ang browser (`F5`). Pagbalik, lilitaw ang **Resume Draft Modal**. Pindutin ang **"Resume Draft"** upang ipakita na hindi nawawala ang in-encode.
   * **Spiel:** *"Dito sa Step 1, pinatutunayan ang **FR-3**: ang 2-unit quota limit alinsunod sa Section 4 ng Franchising Ordinance upang maiwasan ang monopolyo, at ang draft autosave feature para sa data persistence."*
4. **Step 2: Hiwalay na LTO CR, OR, at Driver's License OCR (FR-4):**
   * Sa CR slot: I-upload ang `sample_docs/TAMA/03_lto_cr_TAMA.png`.
   * Sa OR slot: I-upload ang `sample_docs/TAMA/04_lto_or_TAMA.png`.
   * **Panoorin ang OCR:** Awtomatikong pupunuan ang **Plate (`4528-TC`)**, **Engine (`KF51E7890123`)**, at **Chassis (`MH1KF5178PK098231`)**.
   * Sa Driver's License: I-upload ang Front (`01_license_front_TAMA.png`) at Back (`02_license_back_TAMA.png`).
   * **Ipakita sa Panel:** Nakuha ang **Codes A at A1** at ang **Date of Birth** para sa renewal tracking. **Hindi kinuha ang blood type**.
   * **Spiel:** *"Alinsunod sa Data Privacy Act (RA 10173), kinuha lamang natin ang DL codes at birth date para sa renewal schedule, habang sinadyang iwan ang blood type upang maprotektahan ang medical privacy ng tsuper."*
5. **Step 3: Clearances at Sedula:**
   * I-upload ang `05_brgy_clearance_TAMA.png`, `06_toda_certificate_TAMA.png`, at `07_cedula_TAMA.png`.
   * Awtomatikong kukunin ang CTC No (`CC12012 11793510`) at binayarang halaga (`₱55.00`).
6. **Step 4: Summary at Pagsusumite:**
   * I-click ang **"Submit Application"**.
   * Makikita ang prompt na matagumpay na naitala ang aplikasyon na may status na **"Pending (Needs Review)"**.
7. **Mag-logout.**

---

### Yugto 5: Administrative Pre-Payment Review (FR-5, FR-6)
* **Sino:** Tester Admin (`admin.tester@gtrams.com` / `Password123!` )  
* **Pahina:** `/franchise-approval` (Tab: "Needs Review")  
* **Layunin:** Ipakita ang compliance record check bago i-endorse sa pagbabayad.

1. **Mag-login bilang Tester Admin.**
2. Buksan ang aplikasyon ni **Juan Dela Cruz**.
3. **Ipakita sa Panel ang Automated Record Check Card:**
   * `Prior Violations / Revocations:` **(✓ Clean Record) No violations or suspensions on record.**
   * `TODA Cross-Matching:` **✓ Verified Active Member in POB TODA Roster.**
   * `Document Verification Integrity:` Lahat ng LTO, License, at Clearance credentials ay may berdeng checkmark.
4. Pindutin ang **"Send to Cashier (For Payment)"**.
5. **Spiel:** *"Alinsunod sa **FR-6**, mahigpit nating sinusunod ang tamang proseso: Hindi pinapayagang magbayad sa Cashier ang aplikante kung hindi pa nasusuri ang kanyang record upang maiwasan ang paniningil sa mga may pending na violation o suspension."*
6. **Mag-logout.**

---

### Yugto 6: Municipal Treasury Cashiering (FR-7)
* **Sino:** Cashier Maria Clara (`cashier.tester@gtrams.com` / `Password123!`)  
* **Pahina:** `/cashier`  
* **Layunin:** Patunayan ang revenue collection controls alinsunod sa COA regulations.

1. **Mag-login bilang Maria Clara.**
2. Sa pila ng **"Awaiting Payment"**, makikita si Juan Dela Cruz (Halaga: **₱500.00**).
3. Pindutin ang **"Process Payment"**.
4. **Ipakita sa Panel:**
   * Payment Method: Naka-lock sa `Cash (Over-the-Counter)`.
   * **Walang Reject Button** (Ang tungkulin ng Kahera ay tumanggap ng bayad at mag-isyu ng resibo).
   * I-encode ang physical receipt booklet number: `OR-GASAN-2026-0042` at Payer Name: `Juan Dela Cruz`.
5. Pindutin ang **"Confirm Payment"**.
6. **Spiel:** *"Alinsunod sa **FR-7**, ang cashier module ay sumusunod sa COA regulations ng Municipal Treasury ng Gasan. Bawat transaksyon ay mano-manong itinatali sa physical Official Receipt (OR) booklet serial number para sa auditing."*
7. **Mag-logout.**

---

### Yugto 7: Executive Endorsement & Batch MTOP Printing (FR-8)
* **Sino:** Tester Admin (`admin.tester@gtrams.com` / `Password123!`)  
* **Pahina:** `/franchise-approval?tab=signing`  
* **Layunin:** Pinal na pagpirma at pag-release ng prangkisa pagkatapos makabayad.

1. **Mag-login muli bilang Tester Admin.**
2. Pumunta sa tab na **"For Signing"**. Makikita si Juan Dela Cruz na may markang: `Payment Verified (OR-GASAN-2026-0042)`.
3. Ipakita ang **"Print MTOP"** (Single certificate) at ang **"Batch Print MTOP"** (Sabayang pag-print ng certificates).
4. Pindutin ang **"Approve & Mark Ready for Pickup"**.
5. **Spiel:** *"Sa ilalim ng **FR-8**, pumapasok lamang sa 'For Signing' stage ang prangkisa kapag may kumpirmadong resibo mula sa Treasury. Pagkatapos malagdaan ng Punong Bayan at ng Bise Alkalde, minamarkahan ito bilang 'Ready for Pickup'."*
6. **Mag-logout.**

---

### Yugto 8: Watermarked E-Copy & Public QR Verification (FR-9)
* **Sino:** Operator Juan Dela Cruz (`operator.tester@gtrams.com` / `Password123!`)  
* **Pahina:** `/dashboard`  
* **Layunin:** Ipakita ang digital copy na may security watermark at live QR scanning.

1. **Mag-login bilang Juan Dela Cruz.**
2. Sa **Operator Dashboard**, makikita ang updated badge: **"Ready for Pickup"**.
3. Pindutin ang **"View E-Copy (Approved MTOP)"**.
4. **Ipakita ang Security Features sa Panel:**
   * Ang certificate ay may malinaw na **diagonal security watermark**:  
     > **"APPROVED - ELECTRONIC COPY • VALID ISSUANCE"**
   * Dynamic **QR Code** sa ibaba ng certificate.
5. **Live QR Scanning Test (Gawin sa Harap ng Panel):**
   * Gamit ang smartphone camera o laptop webcam, i-scan ang QR code sa screen.
   * Awtomatikong bubukas ang public verification page na nagpapakita ng:
     * MTOP Number
     * Operator Name: Juan Dela Cruz
     * Unit Specs (Plate `4528-TC`, Engine `KF51E7890123`, Chassis `MH1KF5178PK098231`)
     * Validity: 3 Years
     * Status: **ACTIVE & ISSUED**
6. **Pangwakas na Spiel sa Panel:**  
   > *"Ang E-Copy na may diagonal watermark ay nagbibigay ng agarang legal na patunay sa operator habang hinihintay ang physical stickers, habang ang integrated QR code naman ay nagbibigay-daan sa ating mga traffic enforcers sa kalsada na ma-authenticate ang prangkisa nang real-time nang hindi nangangailangan ng panibagong login o espesyal na hardware."*

---

## 4. On-Demand Defense Appendix: "Kapag Tinanong ng Panel ang Edge Cases / Maling Input"

> [!IMPORTANT]
> **Huwag ipakita ito sa simula ng demo upang hindi humaba ang presentation.**  
> Gamitin LAMANG ang cheat sheet na ito kapag tahasang nagtanong ang panelista: *"Paano kapag nagpasok ng expired na lisensya o pekeng dokumento?"*

| Kung Ano ang Tanong ng Panelista | Aling Account at File ang Bubuksan | Anong Gagawin at Ano ang Ipapakita sa Screen |
| :--- | :--- | :--- |
| **"Paano kapag expired na ang lisensya ng tsuper?"** | Account: `operator.mali@gtrams.com`<br>File: `sample_docs/MALI/01_mali_license_EXPIRED.png` | I-upload sa Driver's License Front slot.<br>**Resulta:** Babasahin ng OCR ang expiration date (`2022-05-10`), magkukulay pula ang field, at lalabas ang alert: `❌ Validation Alert: License Expired. Please upload a currently valid driver's license.` |
| **"Paano kapag hindi sa aplikante nakapangalan ang sasakyan sa CR?"** | Account: `operator.mali@gtrams.com`<br>File: `sample_docs/MALI/03_mali_cr_NAME_MISMATCH.png` | I-upload sa Certificate of Registration (CR) slot.<br>**Resulta:** Lalabas ang alert: `⚠️ Discrepancy Flagged: Registered owner in CR (Ricardo Dalisay) does not match applicant (Mario Santos).` |
| **"Paano kung malabo ang litrato o hindi naman dokumento ang in-upload?"** | File: `sample_docs/MALI/08_mali_NOT_A_DOCUMENT_BLURRY.png` | I-upload sa kahit saang slot.<br>**Resulta:** Re-upload prompt mula sa Vision AI OCR dahil hindi ma-detect ang kinakailangang document headers at seal. |
| **"Paano kung hindi siya rehistradong miyembro sa TODA ng barangay niya?"** | Account: `operator.mali@gtrams.com` | Piliin ang Barangay Antipolo at pumili ng asosasyon kung saan wala siya sa roster.<br>**Resulta:** Lalabas ang warning: `⚠️ Notice: Official TODA Certificate Required: Your name is not currently listed in the official approved roster.` |
| **"Paano kung clearance mula sa ibang bayan (hal. Boac) ang ipinasok?"** | File: `sample_docs/MALI/05_mali_brgy_WRONG_MUNICIPALITY.png` | I-upload sa Barangay Clearance slot.<br>**Resulta:** Sa Admin Review, lalabas ang red warning flag na ang nasabing barangay ay hindi sakop ng hurisdiksyon ng Bayan ng Gasan. |

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
> **Rekomendasyon para sa Defense: "Hybrid Failover Strategy"**

1. **Bentahe ng Naka-deploy sa Vercel (`https://g-trams-official.vercel.app`):**
   * Malaking puntos sa evaluation kung may live public URL dahil pinatutunayan nito na cloud-ready at accessible sa munisipyo ang system.
   * Maaaring subukan ng panelists na buksan ang QR verification sa kanilang sariling mga cellphone.

2. **Ang Banta sa Live Cloud:**
   * **Backend Sleep:** Kung ang backend API ay nasa libreng hosting (tulad ng Render o Railway), nag-i-sleep ito kapag walang request sa loob ng 15 minuto (tumatagal ng 30–50 segundo bago muling mag-respond).
   * **Unstable Wi-Fi sa Defense Room:** Ang Wi-Fi sa mga unibersidad ay madalas bumagal o mawalan ng signal habang nagde-defense.

3. **Ang Propesyonal na Hakbang (Hybrid Failover):**
   * **Bago Pumasok sa Room:** Buksan ang command prompt sa laptop at patakbuhin ang local backend at local frontend:
     ```bash
     # Terminal 1 (Backend):
     cd c:\Users\Hp\GTRAMS\backend
     node server.js

     # Terminal 2 (Frontend):
     cd c:\Users\Hp\GTRAMS\frontend
     cmd.exe /c "npm run dev"
     ```
   * **Buksan sa Browser:** Mag-open ng dalawang tab:
     * Tab 1: Ang live Vercel URL.
     * Tab 2: Ang `http://localhost:5173`.
   * **Diskarte:** Simulan ang demo sa Vercel. Kung mabilis ang cloud, magpatuloy roon. Kung makaranas ng loading delay sa Wi-Fi, sabihin agad nang may kumpiyansa sa panel:  
     > *"Upang mas masubok po natin nang mabilis ang high-throughput AI OCR nang walang latency mula sa campus Wi-Fi, ililipat po natin ang visual display sa aming isolated local staging server sa port 5173."*
