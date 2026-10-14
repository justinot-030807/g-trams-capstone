# G-TRAMS Capstone Defense Master Guide & Full Demo Test Flow

**Munisipalidad ng Gasan, Marinduque**  
**Gasan Tricycle Regulatory and Management System (G-TRAMS)**  
*Dokumentasyon para sa Live Defense, Pagsasanay, at System Demonstration*

---

## 1. Quick Credentials Cheat Sheet

Lahat ng accounts na ito ay aktibo at naka-seed sa MongoDB Atlas. Pare-pareho ang password para hindi nakakalito sa presentation:

| Role / Scenario | Pangalan sa System | Email Login | Password | Sakop na Barangay & TODA |
| :--- | :--- | :--- | :--- | :--- |
| **Operator (MALI - Error Demo)** | **Mario Santos** | `operator.mali@gtrams.com` | `Password123!` | Antipolo (South Zone) • NON-TODA / Unaccredited |
| **Operator (TAMA - Happy Path)** | **Juan Dela Cruz** | `operator.tester@gtrams.com` | `Password123!` | Barangay I Poblacion (Central Zone) • POB TODA (Verified Member) |
| **TODA President** | **Pedro Santos** | `todapres.tester@gtrams.com` | `Password123!` | POB TODA (Poblacion Central) |
| **Municipal Cashier** | **Maria Clara** | `cashier.tester@gtrams.com` | `Password123!` | Municipal Treasury Office |
| **Admin / Licensing Officer** | **Tester Admin (OVM Gasan)** | `admin.tester@gtrams.com` | `Password123!` | Office of the Vice Mayor / BPLO Licensing |

---

## 2. Directory ng mga Sample Documents (`sample_docs/`)

Ang lahat ng sample files ay maayos na pinaghiwalay sa dalawang subfolder sa loob ng `sample_docs/`:

### A. Folder: `sample_docs/MALI/` (Para sa Error & AI Discrepancy Testing)
| File Name | Anong Slot I-u-upload | Anong Error ang Ipapakita |
| :--- | :--- | :--- |
| `01_mali_license_EXPIRED.png` | Driver's License (Front) | **Paso ang Lisensya (2022)** — May red highlight at alert na kailangang i-renew. |
| `02_mali_license_WRONG_CODE.png` | Driver's License (Front) | **Walang Tricycle Code (Code B only)** — Hindi awtorisadong magmaneho ng traysikel. |
| `03_mali_cr_NAME_MISMATCH.png` | Certificate of Registration (CR) | **Iba ang May-ari (Ricardo Dalisay)** — Mismatch sa aplikante (Mario Santos). |
| `04_mali_cr_FAKE_CHASSIS.png` | Certificate of Registration (CR) | **Chassis Serial Mismatch** — Iba ang serial sa dokumento kaysa sa form. |
| `05_mali_brgy_WRONG_MUNICIPALITY.png` | Barangay Clearance | **Galing sa Boac** — Hindi sakop ng Gasan LGU. |
| `06_mali_toda_UNAUTHORIZED_ASSOCIATION.png` | TODA Certificate | **Pekeng TODA** — Hindi kabilang sa 17 opisyal na TODA ng Gasan. |
| `07_mali_cedula_EXPIRED_YEAR.png` | Community Tax Certificate (Cedula) | **Lumang Sedula (Taong 2020)** — Kailangan ay current calendar year (2026). |
| `08_mali_NOT_A_DOCUMENT_BLURRY.png` | Kahit saang Upload Slot | **Malabo / Hindi Dokumento** — Rejection ng Gemini OCR (Wrong document type). |

---

### B. Folder: `sample_docs/TAMA/` (Para kay Juan Dela Cruz — 100% Valid)
| File Name | Anong Slot I-u-upload | Nilalaman ng Dokumento |
| :--- | :--- | :--- |
| `01_license_front_TAMA.png` | Driver's License (Front) | Juan Dela Cruz, Valid hanggang 2028, Code A & A1, Walang blood type. |
| `02_license_back_TAMA.png` | Driver's License (Back) | Serial Number SN-884719203948. |
| `03_lto_cr_TAMA.png` | Certificate of Registration (CR) | Juan Dela Cruz, Plate: 4528-TC, Engine: KF51E7890123, Chassis: MH1KF5178PK098231. |
| `04_lto_or_TAMA.png` | Official Receipt (OR) | Taunang bayad sa rehistro ng LTO, valid hanggang 2027. |
| `05_brgy_clearance_TAMA.png` | Barangay Clearance | Barangay I (Poblacion), Gasan, nilagdaan ni Hon. Vicente Morales. |
| `06_toda_certificate_TAMA.png` | TODA Endorsement Certificate | POB TODA, Body #01, nilagdaan ni Pres. Pedro Santos. |
| `07_cedula_TAMA.png` | Community Tax Certificate (Cedula) | Juan Dela Cruz, Halaga: PHP 55.00, Gasan, Marinduque. |
| `08_toda_roster_TAMA.png` | TODA Masterlist (Upload sa TODA) | Opisyal na Roster ng POB TODA kung saan nakatala si Juan Dela Cruz. |

---

## 3. Kompletong Script at Test Flow sa Presentation

### Yugto 1: Pambungad at Pagpapakilala ng Sistema (1 Minuto)
* **Tagapagsalita:** *"Magandang araw po sa ating mga panel at sa ating adviser na si Ma'am. Ipinagmamalaki po naming iprisinta ang live demonstration ng **G-TRAMS (Gasan Tricycle Regulatory and Management System)**. Alinsunod po sa mga tagubilin noong nakaraang konsultasyon, buo na po ang dalawang pangunahing aspeto ng aming system: (1) ang **Intelligent Validation and Error Detection** kung saan hinuhuli ng AI at ng database rules ang mga expired o pekeng dokumento, at (2) ang **Official LGU Lifecycle** kung saan nasusunod ang tamang proseso: TODA accreditation muna bago registration, bayad sa Cashier bago pirmahan ng Mayor, at pag-release ng Watermarked Electronic Copy."*

---

### Yugto 2: Ang "ACCOUNT NA MALI" (Error & Validation Demo)
* **Sino:** Operator Mario Santos (`operator.mali@gtrams.com` / `Password123!`)
* **Pahina:** `/apply-franchise`
* **Layunin:** Ipakita kung paano bina-block at hina-highlight ng system ang mga iregularidad.

1. **Mag-login bilang Mario Santos.**
2. Pumunta sa **"Apply Franchise"** (`/apply-franchise`).
3. **Ipakita ang Jurisdiction at TODA Warning:**
   * Piliin ang Barangay: **Antipolo** (South Zone).
   * Sa TODA, pumili ng TODA na taga-North o Central (o subukang mag-apply nang wala sa roster).
   * **Ipakita sa Screen:** Lalabas ang alert: `Notice: Official TODA Certificate Required: Your name is not currently listed in the official approved roster`.
   * **Spiel:** *"Ma'am, tulad po ng hinanap ninyo, kapag ang aplikante ay wala sa opisyal na listahan ng TODA, awtomatiko pong nagpapakita ang system ng warning at inoobliga siyang mag-upload ng lehitimong TODA Endorsement Certificate mula sa TODA President."*
4. **Ipakita ang Expired License Detection:**
   * Pumunta sa Step 2 (Document Uploads).
   * I-upload ang `sample_docs/MALI/01_mali_license_EXPIRED.png` sa Driver's License Front.
   * Panoorin ang Gemini OCR. Agad na kukunin ng system ang expiration date (`2022-05-10`), iha-highlight ito ng kulay pula, at maglalabas ng error notification: *"License Expired"*.
   * **Spiel:** *"Awtomatiko pong nade-detect ng Vision OCR kung expired na ang lisensya bago pa man makapagsumite ang tsuper."*
5. **Ipakita ang CR Owner Mismatch:**
   * I-upload ang `sample_docs/MALI/03_mali_cr_NAME_MISMATCH.png` sa CR slot.
   * **Spiel:** *"Sa LTO CR naman po, dahil si Mario Santos ang nag-a-apply pero si Ricardo Dalisay ang nakarehistrong may-ari sa CR, itinatala po ng system ang 'Owner Mismatch' discrepancy para masigurong hindi maaprubahan kung hindi sa kanya nakapangalan ang sasakyan."*
6. **Mag-logout.**

---

### Yugto 3: Ang "ACCOUNT NA TAMA" (Happy Path Demo)
* **Sino:** Operator Juan Dela Cruz (`operator.tester@gtrams.com` / `Password123!`)
* **Pahina:** `/apply-franchise`
* **Layunin:** Ipakita ang matagumpay at malinis na aplikasyon.

1. **Mag-login bilang Juan Dela Cruz.**
2. Pumunta sa **Apply Franchise** (`/apply-franchise`).
3. **Step 1: Operator Identity & TODA:**
   * Piliin ang Barangay: **Barangay I (Poblacion)**.
   * Awtomatikong lilitaw ang POB TODA na may berdeng badge: `✓ Verified in Official TODA Roster`.
   * **Driver Designation:** I-click ang **Operator-Driver**. Ipakita rin saglit ang **Operator Only (Hired Driver)** upang makita ng panel na may hiwalay na inputs para sa tsuper kapag may kinuha siyang driver. Ibalik sa *Operator-Driver*.
   * **Fleet Quota:** Ituro ang *"Unit 1 of 2 (2 Slots Allowed)"*.
   * **Draft Feature:** Mag-type ng contact number. Pindutin ang "Home" o i-refresh ang browser. Pagbalik, lalabas ang **Resume Draft Modal**. Pindutin ang *Resume Draft*!
   * **Spiel:** *"Ito po ang draft feature na kapag na-misclick ng tsuper ay ligtas na maipagpapatuloy ang kanyang form."*
4. **Step 2: Vehicle Specs at Hiwalay na LTO CR at OR:**
   * I-upload ang `sample_docs/TAMA/03_lto_cr_TAMA.png` sa CR slot.
   * I-upload ang `sample_docs/TAMA/04_lto_or_TAMA.png` sa OR slot.
   * I-upload ang `sample_docs/TAMA/01_license_front_TAMA.png` at `sample_docs/TAMA/02_license_back_TAMA.png`.
   * **Spiel:** *"Magkahiwalay po ang CR at OR. Awtomatikong nakuha ang Date of Birth para sa birthday renewal monitoring, restriction codes A/A1, at **mahigpit na hindi kinuha ang blood type** alinsunod sa bilin ni Ma'am."*
5. **Step 3: Clearances at Sedula:**
   * I-upload ang `sample_docs/TAMA/05_brgy_clearance_TAMA.png`, `06_toda_certificate_TAMA.png`, at `07_cedula_TAMA.png`.
   * Naitatala ang petsa at ang binayaran sa sedula (₱55.00).
6. **Step 4: Application Summary:**
   * Ipakita ang kumpletong buod ng mga dokumento at pindutin ang **"Submit Application"**.
7. **Mag-logout.**

---

### Yugto 4: Admin Review & Pre-Payment Record Check
* **Sino:** Admin Tester (`admin.tester@gtrams.com` / `Password123!`)
* **Pahina:** `/franchise-approval`

1. Sa ilalim ng **"Needs Review"** tab, buksan ang aplikasyon ni Juan Dela Cruz.
2. **Ipakita ang Record Check Card:**
   * Makikita: `Record Check: (✓ Clean) No violations or revocations on record`.
   * Makikita: `TODA Roster: ✓ Verified in Official TODA Roster`.
   * **Spiel:** *"Bago po magbayad, sinisiyasat ng system kung may dating huli, lisensyang binawi, o lumabag sa batas-trapiko ang aplikante."*
3. Pindutin ang **"Send to Cashier (For Payment)"**.
4. **Spiel:** *"Inayos po natin ang workflow: Bayad muna sa Cashier bago pirmahan ng Mayor."*
5. **Mag-logout.**

---

### Yugto 5: Municipal Cashier Module (Over-the-Counter)
* **Sino:** Cashier Maria Clara (`cashier.tester@gtrams.com` / `Password123!`)
* **Pahina:** `/cashier`

1. Makikita si Juan Dela Cruz sa **"Awaiting Payment"** (₱500.00).
2. Pindutin ang **"Process Payment"**.
3. **Ipakita ang mga Patakaran:**
   * Payment Method: Naka-lock sa `Cash (Over-the-Counter)`.
   * Official Receipt (OR) Number: I-type ang `OR-GASAN-2026-0042` (Mano-manong inilalagay mula sa physical receipt booklet ng munisipyo).
   * Payer Name: I-type ang `Juan Dela Cruz`.
4. Pindutin ang **"Confirm Payment"**.
5. **Spiel:** *"Napapansin po ninyo na **walang Reject button** dito dahil hindi trabaho ng kahera ang mag-reject kung bayad na ang transaksyon."*
6. **Mag-logout.**

---

### Yugto 6: Pagpirma at Pag-release ng MTOP
* **Sino:** Admin Tester (`admin.tester@gtrams.com` / `Password123!`)
* **Pahina:** `/franchise-approval?tab=signing`

1. Nasa **"For Signing"** tab na si Juan Dela Cruz dahil bayad na sa Cashier.
2. Pindutin ang **"Print MTOP"** para sa single print ng certificate, o ipakita ang **"Batch Print MTOP"** para sa sabayang pag-print.
3. Pindutin ang **"Approve & Mark Ready for Pickup"**.
4. Ipakita ang **"Approved"** at **"Rejected"** tabs sa itaas kung saan nakikita ni Kayla ang kasaysayan ng mga aplikasyon.
5. **Mag-logout.**

---

### Yugto 7: Operator E-Copy na may Watermark
* **Sino:** Operator Juan Dela Cruz (`operator.tester@gtrams.com` / `Password123!`)
* **Pahina:** `/dashboard`

1. Sa dashboard, ang status ay **"Ready for Pickup"**.
2. Pindutin ang **"View E-Copy (Approved MTOP)"**.
3. **Ipakita ang diagonal watermark stamp:**
   > **"APPROVED - ELECTRONIC COPY • VALID ISSUANCE"**
4. **Spiel:** *"Ma'am, ito po ang hiniling ninyong E-Copy. May opisyal na watermark po ito bilang patunay na hawak ng operator habang papunta siya sa BPLO para kunin ang orihinal na papel at stickers."*
5. Ipakita ang **QR Code** na pwedeng i-scan ng traffic enforcer gamit ang camera.

---

## 4. Pagsusuri ukol sa Deployment sa Vercel: "Okay lang ba ito?"

> [!IMPORTANT]
> **SAGOT: OO, MALAKING PLUS ANG VERCEL, PERO SUNDIN ANG MGA SUMUSUNOD NA GOLDEN RULES:**

1. **Bentahe ng Naka-deploy sa Vercel:**
   * Napakaganda sa paningin ng panel kung may live production URL kayo. Ipinapakita nito na handa na ang inyong thesis para sa aktwal na paggamit ng Munisipyo ng Gasan.
   * Maaari ninyong buksan ang QR code scanner sa inyong mobile phone gamit ang live URL.

2. **Ang Dapat Siguraduhin sa Vercel:**
   * **Backend Connection:** Siguraduhin na ang backend API (hal. naka-deploy sa Render, Railway, o sariling VPS) ay gising at hindi naka-sleep. Ang libreng tier ng Render ay nag-i-sleep pagkatapos ng 15 minutong walang gamit (tumatagal ng 30-50 segundo bago magising).
   * **Environment Variables:** Siguraduhin na ang `VITE_API_URL` sa Vercel settings ay nakaturo sa tamang live backend URL.

3. **Ang Pinakaligtas na Diskarte sa Defense (Hybrid Strategy):**
   * **Pangunahing Gamit:** Subukan muna sa Vercel kung mabilis ang internet sa presentation room.
   * **Backup sa Localhost (Laging Handa):** Bago magsimula ang defense, buksan na agad sa background ang local backend (`cd backend && npm run dev`) at local frontend (`cd frontend && npm run dev`).
   * Kung sakaling humina ang Wi-Fi o mag-timeout ang cloud server, **huwag mag-panic**—sabihin lang sa panel: *"Para po mas mabilis at walang delay sa Wi-Fi, ipapakita po namin ito sa aming configured local testing environment sa `localhost:5173`."*

---

## 5. Mga Dapat Tandaan sa Harap ng Panel

1. **Kapag tinanong kung bakit walang claim stub:**
   * *Sagot:* "Wala na pong claim stub voucher dahil mayroon na po tayong direct Cashier module kung saan doon magbabayad nang over-the-counter at ini-issue ang opisyal na resibo ng LGU, at kukunin ang physical permit sa BPLO."
2. **Kapag tinanong kung bakit bawal ang GCash sa Cashier:**
   * *Sagot:* "Ayon po sa aming interview sa Municipal Treasury ng Gasan, cash over-the-counter lamang po ang opisyal na paraan ng pagbabayad para sa MTOP alinsunod sa panuntunan ng COA at sa kanilang physical receipt booklet."
3. **Kapag tinanong kung bakit 2 units lang ang maximum:**
   * *Sagot:* "Alinsunod po sa Section 4 ng Gasan Municipal Franchising Ordinance, mahigpit pong nililimitahan sa maximum 2 motorized units ang bawat indibidwal na operator upang maiwasan ang monopolyo sa ruta."
