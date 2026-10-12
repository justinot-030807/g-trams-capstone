# G-TRAMS (Gasan Tricycle Regulatory and Automated Management System)
## Main System Flows Testing Procedure & Evaluation Guide

**Target Audience:** System Evaluator / Thesis Adviser ("Ma'am") & Capstone Panelists  
**System Version:** v1.3.0 (Production Build Ready)  
**AI OCR Engine:** Google Gemini Vision (Cascaded Priority: `gemini-3.8-flash`)  
**Target Municipality:** Gasan, Marinduque  

---

## 1. Quick Test Accounts & Credentials

Lahat ng mga test accounts na ito ay aktibo, rehistrado, at verified sa sistema.

| Role | Name | Email / Contact Login | Password | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Admin (OVM)** | Tester Admin (OVM Gasan) | `admin.tester@gtrams.com` <br> *(or `09111111111`)* | `Password123!` | Pagsusuri ng mga aplikasyon, AI verification, pag-apruba, at TODA validation |
| **Operator** | Tester Operator (Juan Dela Cruz) | `operator.tester@gtrams.com` <br> *(or `09222222222`)* | `Password123!` | Pagsusumite ng bagong prangkisa, pag-upload ng dokumento, at pagre-renew |
| **TODA President** | Tester TODA President (Pedro Santos) | `todapres.tester@gtrams.com` <br> *(or `09333333333`)* | `Password123!` | Pag-digitize at pagsusumite ng opisyal na listahan ng mga kasapi (Roster) |
| **Cashier (Treasury)** | Tester Cashier (Maria Clara) | `cashier.tester@gtrams.com` <br> *(or `09444444444`)* | `Password123!` | Pagproseso ng bayad sa prangkisa at pagbibigay ng Opisyal na Resibo (OR) |

---

## 2. Test Flow 1: Operator Franchise Application & AI OCR Auto-Fill

### Layunin
Ipakita kung paano mabilis na nakakapag-apply ang isang operator gamit ang mobile-first form at kung paano binabasa at awtomatikong pinupunan ng **Multimodal AI OCR (Gemini 3.8 Flash)** ang mga dokumento.

### Step-by-Step Procedure:
1. **Mag-Login bilang Operator:**
   * Pumunta sa Login Page: `/login`
   * Ilagay: `operator.tester@gtrams.com` / `Password123!`
   * Pagka-login, papasok sa **Operator Dashboard**.
2. **Simulan ang Aplikasyon:**
   * I-click ang **"Apply Franchise"** button sa dashboard o pumunta sa `/apply-franchise`.
3. **Step 1: Operator Profile & Barangay:**
   * Awtomatikong kukunin ang pangalan at tirahan ng operator. Piliin ang Barangay (hal. *Bahi* o *Libtangin*).
   * Mapapansin na awtomatikong itinatakda ang **Zone Route** batay sa napiling barangay alinsunod sa ordinansa ng Bayan ng Gasan.
   * I-click ang **Next**.
4. **Step 2: Vehicle Specs & LTO Registration (OR/CR):**
   * Piliin ang Make/Brand (hal. *Honda TMX 125*).
   * Mag-upload ng litrato ng **LTO OR/CR** (Certificate of Registration / Official Receipt).
   * **Ano ang Ipapakita kay Ma'am:**
     * Mapapansin ang live spinner na nagpapakita ng **"AI Scanning..."**.
     * Pagkatapos ng ilang segundo, awtomatikong pupunan ng AI ang **Plate Number**, **Motor Number**, at **Chassis Number**.
     * May real-time duplicate check na titiyak na walang kaparehong motor o chassis number sa buong bayan.
   * I-click ang **Next**.
5. **Step 3: Driver's License, Barangay Clearance, at TODA Endorsement:**
   * I-upload ang Driver's License, Barangay Clearance, at TODA Endorsement Certificate.
   * Awtomatikong babasahin ng AI ang clearance numbers at petsa ng pagkaka-isyu.
   * I-click ang **Next**.
6. **Step 4: Community Tax Certificate (Cedula / CTC) & Application Summary:**
   * Mag-upload ng **Cedula (CTC)** document image.
   * **Highlight para kay Ma'am:**
     * Babasahin ng **Gemini 3.8 Flash** ang lahat ng kritikal na impormasyon mula sa Cedula:
       * **CTC Serial Number** (hal. `CC12012 11793510`)
       * **Tax Year** (hal. `2026` o `2013`)
       * **Date Issued & Place of Issue** (hal. `CITY OF BAGUIO` o `Gasan, Marinduque`)
       * **Taxpayer Full Name** (Apelyido, Pangalan, Gitna)
       * **Civil Status, Citizenship, at Biometrics** (Sex, Height, Weight)
       * **Total Amount Paid** (hal. `₱5.60` o `₱55.00`)
     * May lalabas na berdeng **"Digitized Cedula (CTC) Information"** summary card sa ibaba na nagpapatunay na nabasa ng AI ang buong sertipiko.
     * May built-in validation: Kung paso (expired) ang taon ng Cedula, bibigyan ng babala ang operator.
7. **Pagsusumite:**
   * I-click ang **"See Summary"** para makita ang modal preview ng buong aplikasyon.
   * I-click ang **"Submit Application"**.
   * Makikita ang success feedback modal at babalik sa dashboard kung saan nakalagay ang status na **"Pending"**.

---

## 3. Test Flow 2: TODA President - Instant AI Roster Digitization

### Layunin
Ipakita ang makabagong paraan kung paano isinusumite ng TODA President ang kanilang masterlist ng mga miyembro gamit ang AI OCR na agad nagko-convert ng imahe o PDF patungong digital editable table.

### Step-by-Step Procedure:
1. **Mag-Login bilang TODA President:**
   * Mag-logout mula sa operator account.
   * Mag-login gamit ang: `todapres.tester@gtrams.com` / `Password123!`.
2. **Pumunta sa Roster Submission:**
   * Sa navigation o dashboard, i-click ang **"Submit Roster"** (`/toda/submit-members`).
3. **Pumili ng Roster File:**
   * I-drag o i-select ang anumang listahan ng miyembro (Larawan ng dokumento o PDF file).
4. **Ano ang Ipapakita kay Ma'am:**
   * **Instant Scan on Selection:** Hindi kailangang maghintay na i-submit muna—oras na mapili ang file, agad itong i-i-scan ng Gemini Flash AI sa background!
   * Lalabas ang **"AI Digitized Roster Preview"** table na naglalaman ng:
     * Association Name na nabasa sa dokumento
     * Kabuuang bilang ng mga miyembro
     * Talaan ng mga drayber/operator na may **Pangalan**, **Unit/Body No**, at **Plate No**.
   * Maaaring magdagdag ng miyembro gamit ang **"+ Add Member"** button o mag-edit/delete ng mga row bago isumite.
5. **I-click ang "Submit TODA Roster":**
   * Makakatanggap ng kumpirmasyon na matagumpay na naitala ang masterlist sa central database para sa validation ng LGU.

---

## 4. Test Flow 3: Admin - Document Cross-Verification & Franchise Approval

### Layunin
Ipakita ang split-screen verification interface ng Pamahalaang Bayan kung saan sinusuri ng AI ang pagkakatugma ng mga isinumiteng dokumento laban sa mga in-encode na datos upang maiwasan ang pekeng prangkisa o pekeng lisensya.

### Step-by-Step Procedure:
1. **Mag-Login bilang Admin:**
   * Mag-login gamit ang: `admin.tester@gtrams.com` / `Password123!`.
   * Papasok sa **Admin Dashboard** kung saan makikita ang mga buod at analytics ng mga prangkisa.
2. **Pumunta sa Franchise Review:**
   * I-click ang **"Franchise Review"** o **"Applications"** (`/admin/franchise-review`).
   * Piliin ang bagong aplikasyon ni *Tester Operator (Juan Dela Cruz)* na may status na **Pending**.
3. **Ano ang Ipapakita kay Ma'am (Verification Features):**
   * **Split-Screen Document Viewer:** Sa kaliwang bahagi ay ang orihinal na litrato ng dokumento (OR/CR, Lisensya, TODA Endorsement, Barangay Clearance, Cedula). Sa kanang bahagi ay ang mga na-encode na datos.
   * **Automated Discrepancy Checks:**
     * I-click ang tab ng bawat dokumento (hal. **Cedula / CTC**).
     * Ipakita ang **Cedula Details Card**: Makikita rito ang Serial No, Tax Year, Buong Pangalan, Tirahan, Civil Status, Biometrics, at Total Amount Paid na kinuha ng Gemini 3.8 Flash.
     * Kung may pagkakaiba sa pangalan o expired ang petsa, awtomatikong magpa-flash ang kulay dilaw o pulang babala (*Discrepancy Flagged*).
4. **Pag-apruba patungong Treasury (Payment):**
   * Kung maayos at kumpleto ang mga dokumento, i-click ang **"Approve Application"**.
   * Ang estado ng prangkisa ay magiging **"For Payment"** at awtomatikong maipapasa sa pila ng Treasury/Cashier.
5. **Inspeksyon sa TODA Directory:**
   * Pumunta sa **"Validate TODA"** (`/admin/validate-toda`).
   * Buksan ang accordion ng *GASAN CENTRAL TODA*.
   * I-click ang sub-tab na **"Extracted Roster (AI Digitized)"**.
   * **Ano ang Ipapakita kay Ma'am:**
     * Makikita rito ang mismong na-extract na listahan ng mga miyembro mula sa isinumiteng dokumento ng TODA President.
     * May mga live matching badges: **"Account Linked"** kung ang drayber ay may aktibong account sa G-TRAMS, at **"Not Yet Registered"** kung wala pa.
     * May button na **"Re-scan Document"** kung nais muling i-digitize ang dokumento gamit ang bagong model.

---

## 5. Test Flow 4: Treasury / Cashier - Payment Processing & OR Issuance

### Layunin
Ipakita ang transparent revenue collection flow kung saan kinukumpirma ng Municipal Cashier ang bayad bago opisyal na mai-release ang prangkisa.

### Step-by-Step Procedure:
1. **Mag-Login bilang Cashier:**
   * Mag-login gamit ang: `cashier.tester@gtrams.com` / `Password123!`.
   * Papasok sa **Cashier Dashboard** (`/cashier-dashboard`).
2. **Tingnan ang Cashier Queue:**
   * Makikita sa listahan ang aplikasyon ni *Tester Operator* na nasa ilalim ng **"For Payment"** status.
3. **Iproseso ang Resibo:**
   * I-click ang **"Process Payment"** para sa nasabing unit.
   * Ilagay ang mga detalye ng pagbabayad:
     * **Official Receipt No. (OR No.):** hal. `OR-2026-08912`
     * **Payment Method:** Piliin ang *Cash*, *GCash*, o *Landbank*.
     * **Amount Paid:** Default LGU Franchise Fee (hal. `₱500.00`).
     * **Remarks:** hal. *Fully paid at Treasury Counter 2*.
4. **Kumpirmahin ang Bayad:**
   * I-click ang **"Confirm & Issue Receipt"**.
   * Ang estado ng prangkisa ay magiging **"For Signing"** o **"Ready for Pickup / Active"**.
   * Makikita ang transaction record sa Treasury payment logs na may timestamp at cashier ID para sa audit trail.

---

## 6. Test Flow 5: Operator Tracking, Digital MTOP, at Renewal

### Layunin
Ipakita ang karanasan ng drayber/operator pagkatapos maaprubahan ang kaniyang prangkisa—mula sa digital certificate hanggang sa taunang pagpapanibago (Renewal).

### Step-by-Step Procedure:
1. **Mag-Login muli bilang Operator:**
   * Login: `operator.tester@gtrams.com` / `Password123!`.
2. **Suriin ang Dashboard:**
   * Makikita sa dashboard na na-update na ang unit status (hal. **Active** o **Ready for Pickup**).
   * Makikita ang kaniyang **MTOP Number**, **Zone Assignment**, at petsa ng validity.
3. **Tingnan ang Digital MTOP / Summary:**
   * I-click ang **"View Details"** o **"Application Summary"** upang makita ang digital na kopya ng prangkisa na may opisyal na QR code para sa mabilis na inspeksyon sa kalsada.
4. **Subukan ang Renewal Flow:**
   * Pumunta sa `/renew-franchise/:id` o i-click ang **"Renew Franchise"**.
   * Ipakita kay Ma'am:
     * Kapag nag-upload ang operator ng bagong Cedula para sa kasalukuyang taon, agad itong babasahin ng AI at pupunan ang **CTC No**, **Date Issued**, at **Place Issued**.
     * Kung ang in-upload na Cedula ay luma (hal. nakaraang taon), haharangin ito ng system validation upang matiyak na bago ang isinumiteng sertipiko.

---

## 7. Key Points to Highlight During Evaluation / Defense

1. **Multimodal AI OCR Integration (Gemini 3.8 Flash):**
   * Hindi lamang ito karaniwang text box form; ginagamitan ito ng pinakabagong vision model upang mabawasan ang manual encoding errors at mapabilis ang pagproseso ng mga papeles sa munisipyo.
2. **Komprehensibong Cedula Extraction:**
   * Nababasa ng system ang kumpletong impormasyon ng Cedula (Serial No, Tax Year, Buong Pangalan, Tirahan, Civil Status, Biometrics, at Total Amount Paid) alinsunod sa pamantayan ng Local Government Code at BIR.
3. **TODA Roster Digitization & Cross-Matching:**
   * Ang mga papel na masterlist mula sa mga samahan ng TODA ay agad na nagiging searchable database na awtomatikong ikinukumpara sa mga rehistradong miyembro sa munisipyo.
4. **Multi-Role End-to-End Workflow:**
   * Kumpleto ang lifecycle mula **Operator** (Application) $\rightarrow$ **TODA President** (Endorsement & Roster) $\rightarrow$ **Admin / OVM** (Verification & Approval) $\rightarrow$ **Treasury Cashier** (Payment & Official Receipt).
5. **Seguridad at Anti-Fraud Validation:**
   * May duplicate detection sa Chassis/Motor/Plate number.
   * May automated discrepancy check sa pagitan ng in-upload na ID at in-encode na pangalan.
   * May IDOR protection at role-based access control sa lahat ng API endpoints.
