# DELIVERABLE #7: USER’S MANUAL OF THE SYSTEM
## G-TRAMS: Gasan Tricycle Records and Application Management System
**College of Information and Computing Sciences — Marinduque State University (MarSU)**  
*Defense Baseline Edition (`main` branch) &bull; Sangguniang Bayan Franchising Operations*

---

> [!NOTE]
> **Gabay sa Paglipat sa Canva (Defense Baseline Edition):**
> Ang manwal na ito ay 100% naka-angkla sa kasalukuyang **`main` branch** ng G-TRAMS. Nakatutok ito sa opisyal na operasyon ng **Sangguniang Bayan / Office of the Municipal Vice Mayor** at ng **SB Franchising Staff (LLSA I)** alinsunod sa *Municipal Ordinance No. 48 s. 1999*. Direktang kopyahin (*copy-paste*) ang mga pamagat, talata, at numbered procedures papunta sa inyong Canva template.

---

# SECTION 1: COVER PAGE DETAILS

* **Project/System Title:** G-TRAMS: Gasan Tricycle Records and Application Management System
* **Document Title:** User’s Manual of the System
* **Course & Year:** Bachelor of Science in Information Technology (BSIT) — Capstone Project / Deliverable #7
* **Academic Institution:** Marinduque State University (MarSU), College of Information and Computing Sciences, Boac, Marinduque
* **Partner Agency:** Local Government Unit of Gasan — Sangguniang Bayan / Office of the Municipal Vice Mayor
* **Statutory Basis:** Municipal Ordinance No. 48 s. 1999 (Motorized Tricycle Operator's Permit Regulatory Code)
* **Filename for Submission:** `Deliverable7_GroupName_UsersManual.pdf`

---

# SECTION 2: SYSTEM OVERVIEW

### 2.1 Description of the System
Ang **G-TRAMS (Gasan Tricycle Records and Application Management System)** ay isang komprehensibong web at Progressive Web Application (PWA) na binuo para sa Bayan ng Gasan, Marinduque. Layunin nitong i-digitize at i-standardize ang pamamahala sa pagpaparehistro, pagsusuri, pagkakaloob, at pagsubaybay sa mga prangkisa ng pampublikong traysikel sa ilalim ng pamamahala ng **Sangguniang Bayan / Office of the Municipal Vice Mayor**.

Pinapalitan ng G-TRAMS ang tradisyunal na papel at manu-manong pagproseso ng isang mabilis, ligtas, at automated na plataporma kung saan magkakasamang nag-uugnayan ang mga Tricycle Operators, TODA Officers, SB Franchising Staff (LLSA I), Municipal Cashier, at Administrators.

### 2.2 Purpose and Objectives
1. **Digitized Franchising Workflow:** Pabilisin ang pagtanggap at pag-apruba ng mga aplikasyon para sa tatlong taong (**3-Year**) MTOP Municipal Franchise alinsunod sa *Municipal Ordinance No. 48 s. 1999*.
2. **Pagpuksa sa Maling Data (Zero GIGO - Garbage In, Garbage Out):** Real-time na pagsala sa mga plate number, motor number, chassis number, at driver’s license upang matiyak na tanging lehitimo, standardized, at walang duplicate na records ang makakapasok sa database.
3. **1:1 Official Document Generation & Direct Office File Download (`.xlsx` / `.docx`):** Awtomatikong pagbuo ng mga opisyal na dokumentong 100% katugma sa orihinal na Excel at Word files ng Pamahalaang Bayan ng Gasan na handang i-print sa Long Bond Paper (8.5 x 13 in / Folio) o direktang i-download bilang **Original Excel (`.xlsx`)** at **Original Word (`.docx`)**:
   * Official MTOP Application Form (`APPLICATION.xlsx` replica + direct `.xlsx` download)
   * Official 3-Year MTOP Franchise Certificate na may lagda ni Vice Mayor Lidany A. Lao-Baldo (`FRANCHISE.xlsx` replica + direct `.xlsx` download)
   * Official Franchise Cancellation Letter (`CANCELLATION OF FRANCHISE.docx` replica + direct `.docx` download, ₱50.00 regulatory fee)
4. **Transparent Inspection at Tracking:** Pagbibigay sa mga operator ng real-time SMS at online progress tracker upang malaman ang bawat yugto ng kanilang aplikasyon nang hindi na kailangang magpabalik-balik sa munisipyo.

### 2.3 Intended Users and Roles
* **Tricycle Operator / Driver:** Nag-a-apply ng bagong prangkisa, nagre-renew ng prangkisa, sumusubaybay sa status, nagda-download ng opisyal na printable application form (PDF o Original `.xlsx`), at tumitingin ng digital MTOP certificate.
* **TODA President:** Namamahala sa masterlist ng miyembro ng asosasyon at nagpapatunay ng lehitimong TODA affiliation at endorsement.
* **SB Franchising Staff — LLSA I (Local Legislative Staff Assistant I) / Office of the Vice Mayor:** Ang **LLSA I (Local Legislative Staff Assistant I)** ang opisyal na kawani ng Sangguniang Bayan / Office of the Municipal Vice Mayor na tumatanggap at sumusuri sa mga aplikasyon, nagba-validate ng mga dokumento (OR/CR, Lisensya, Cedula, Clearances), nag-iisyu ng 3-Year MTOP Certificates, nagpoproseso ng franchise cancellation letters, at gumagawa ng mga opisyal na ulat.
* **Municipal Cashier / Treasury Window 3:** Tumatanggap ng regulatory fees (₱500 franchise fee, ₱50 cancellation fee) at naglalabas ng opisyal na resibo (O.R.).
* **System Administrator:** Namamahala sa seguridad ng mga user accounts, sumusubaybay sa audit logs, at nagpapanatili ng sistema.

### 2.4 Major Features and Functionalities
* **5-Step Guided Application Wizard:** Madaling proseso ng pagpasa ng aplikasyon na may real-time field validation at save-draft feature.
* **Smart AI OCR Document Scanner:** Awtomatikong nagbabasa ng datos mula sa litrato ng Driver's License, OR/CR, at Cedula upang mabawasan ang pagkakamali sa pag-type.
* **Dynamic Official Form Replica:** 1:1 digital replica ng mga opisyal na porma ng Munisipyo ng Gasan na may opisyal na letterhead banner, Sangguniang Bayan watermark, at legal jurat.
* **Zero Mock Data Principle:** Ang mga porma ay dynamic na pinupuno mula sa database; kung walang laman o kailangan ng blangkong porma, malinis na patlang (`___________`) ang inilalabas para sa legal na integridad.
* **QR Code Electronic Authentication:** Mabilisang pagpapatunay sa kalsada gamit ang QR code na nakalimbag sa bawat MTOP certificate.

---

# SECTION 3: SYSTEM REQUIREMENTS AND ACCESS

### 3.1 Device, Browser, and Software Requirements
* **Mga Sinusuportahang Kagamitan:**
  * Personal Computers / Laptops (Windows 10/11, macOS, Linux)
  * Mobile Smartphones at Tablets (Android 8.0+ o iOS 14.0+)
* **Mga Inirerekomendang Browser:**
  * Google Chrome (Version 110 pataas) — *Pinakamahusay na karanasan*
  * Microsoft Edge (Version 110 pataas)
  * Mozilla Firefox o Apple Safari
* **Print Requirements:** Built-in browser print tool na nakatakda sa **Long Bond Paper / Folio (8.5 x 13 in)** o A4, na may *Background graphics* na naka-enable.

### 3.2 Network and Connectivity
* **Koneksyon:** 3G / 4G / 5G Mobile Data o Broadband WiFi (minimum na 1 Mbps para sa mabilis na pag-upload ng mga litrato).
* **PWA Offline Support:** Gumagana ang caching ng Progressive Web App upang maipakita ang dashboard at mga naaprubahang e-certificates kahit mawalan ng internet.

### 3.3 System URL and Access Instructions
* **Opisyal na Link ng System:** `https://gtrams.gasan.gov.ph` *(o lokal na testing port sa laboratoryo)*
* **PWA Mobile Installation:** Buksan ang link sa mobile browser, pindutin ang menu (tatlong tuldok) o Share icon, at piliin ang **"Add to Home Screen"** upang mai-install bilang mobile application.

---

# SECTION 4: GETTING STARTED

### 4.1 How to Access the System
1. Buksan ang internet browser sa computer o cellphone.
2. I-type ang opisyal na web address ng G-TRAMS sa address bar.
3. Makikita ang **Login Screen** na naglalaman ng opisyal na selyo ng Bayan ng Gasan at Sangguniang Bayan.

> **[Figure 1: G-TRAMS Welcome and Login Page]**  
> *Screenshot ng login screen na may fields para sa Identifier/Email, Password, Language Toggle (English/Tagalog), at Dark/Light Mode switch.*

### 4.2 Account Registration (Para sa mga Bagong Operator)
1. Sa Login Screen, i-click ang link na **"Don't have an account? Register as Operator"**.
2. Ilagay ang inyong Buong Pangalan (*First Name, Middle Name, Last Name*).
3. Piliin ang inyong opisyal na **Barangay** sa Gasan (awtomatikong itatalaga ng system ang tamang Zone: Central, North, o South).
4. Maglagay ng aktibong **11-digit Mobile Number** (hal. `09123456789`) para sa SMS notifications.
5. Gumawa ng ligtas na **Password** (minimum na 8 characters).
6. I-click ang **"Create Account"**. Makakatanggap ka ng kumpirmasyon at maaari ka nang mag-sign in.

> **[Figure 2: Operator Registration Form]**  
> *Screenshot ng registration modal na nagpapakita ng personal identity inputs at automatic barangay-to-zone assignment.*

### 4.3 Logging In and Logging Out
* **Pag-login:** Ipasok ang rehistradong Email o Mobile Number at Password, pagkatapos ay i-click ang **"Sign In"**. Awtomatikong dadalhin ang user sa dashboard na angkop sa kanyang tungkulin.
* **Pag-logout:** I-click ang Profile Avatar sa kanang itaas ng Navbar o sa ibaba ng Sidebar at piliin ang **"Log Out"**.

### 4.4 Overview of the Main Navigation Menus
* **Top Navbar:** Nagpapakita ng opisyal na Role Badge (hal. `SB FRANCHISING STAFF (LLSA I)` o `TRICYCLE OPERATOR`), Language Selector, Theme Selector, at Notification Bell.
* **Sidebar Navigation:**
  * **Operations Dashboard:** Buod ng mga aktibong prangkisa at approval pipelines.
  * **Franchise Records (Masterlist & Approvals):** Talaan ng lahat ng rehistradong traysikel at review queue.
  * **TODA Management:** Talaan ng mga asosasyon at miyembro.
  * **Violations & Sanctions:** Pamamahala sa mga revocation at official cancellation letters.
  * **Settings & Support:** Account configuration at support tickets.

---

# SECTION 5: STEP-BY-STEP USER INSTRUCTIONS

---

## 5.1 OPERATOR MODULE

### Feature 1: Submitting a New MTOP Franchise Application
* **Feature Name:** New Franchise Application (5-Step Wizard)
* **Purpose:** Magsumite ng kumpletong aplikasyon para sa bagong 3-Year MTOP Franchise alinsunod sa *Municipal Ordinance No. 48 s. 1999*.
* **Procedure:**
  1. Mula sa Operator Dashboard, i-click ang **"Apply for Franchise"** button.
  2. **Step 1 (Operator & Driver Information):**
     * Tiyaking tama ang inyong pangalan at address.
     * Piliin kung ikaw mismo ang magmamaneho (*Operator-Driver*) o may kukunin kang drayber.
     * I-upload ang malinaw na litrato ng **Driver’s License (Front & Back)**. Awtomatikong babasahin ng AI OCR ang License Number at Expiration Date.
     * I-click ang **"Next Step"**.
  3. **Step 2 (Vehicle Details & LTO Credentials):**
     * I-upload ang LTO **Certificate of Registration (CR)** at pinakabagong **Official Receipt (OR)**.
     * I-verify ang Make, Engine Number, Chassis Number, at Plate Number.
     * *Anti-GIGO Rule:* Awtomatikong lilinisin ng system ang mga maling espasyo o simbolo at gagawing uppercase alphanumeric.
  4. **Step 3 (Clearances & TODA Endorsement):**
     * I-upload ang **Barangay Clearance** at ang **TODA Endorsement Certificate**.
     * Susuriin ng system kung rehistrado ang aplikante sa opisyal na roster ng TODA.
  5. **Step 4 (Community Tax Certificate / Cedula):**
     * I-upload ang inyong **Cedula (CTC)**. Sinisiguro ng system na ang Cedula ay inisyu para sa kasalukuyang taon.
  6. **Step 5 (Review, Official Form Preview & Submit):**
     * Suriin ang buod ng inyong mga inilagay na datos.
     * I-click ang **"Tingnan / I-print ang Form (PDF)"** upang matingnan ang 1:1 replica ng opisyal na porma.
     * Lagyan ng check ang **Affidavit of Authenticity & Truthfulness**.
     * I-click ang **"Submit Application"**.
* **Screenshots to Include:**
  * *Figure 3:* Step 2 Vehicle Details at LTO Document Upload.
  * *Figure 4:* Official MTOP Application Form Modal Preview.
* **Expected Result:** Matagumpay na maipapasa ang aplikasyon, makakatanggap ng tracking reference, at magpapadala ang system ng SMS confirmation.

---

### Feature 2: Renewing an Existing Franchise
* **Feature Name:** Franchise Renewal
* **Purpose:** Mag-apply para sa pagpapanibago ng prangkisa bago matapos ang 3-taong validity nito.
* **Procedure:**
  1. Sa Operator Dashboard, hanapin ang traysikel na may status na **"Expiring Soon"** o **"Expired"**.
  2. I-click ang **"Renew Franchise"** button.
  3. I-upload ang bagong LTO OR/CR at ang bagong Cedula para sa kasalukuyang fiscal year.
  4. I-click ang **"Preview / Print Form"** upang masuri ang renewal application form.
  5. I-click ang **"Submit Renewal"**.
* **Screenshots to Include:**
  * *Figure 5:* Renewal Page na may auto-populated previous franchise data at bagong document upload slots.
* **Expected Result:** Papasok ang aplikasyon sa Renewal Queue ng Sangguniang Bayan para sa mabilisang verification.

---

### Feature 3: Viewing and Printing Approved MTOP Franchise Certificate
* **Feature Name:** 3-Year MTOP Certificate E-Copy
* **Purpose:** Tingnan at i-print ang opisyal na 3-Year Municipal Franchise Certificate na ipinagkaloob ng Sangguniang Bayan.
* **Procedure:**
  1. Kapag ang status ng inyong traysikel ay **"Active"**, i-click ang **"View Certificate"** sa dashboard.
  2. Lalabas ang opisyal na sertipiko na naglalaman ng:
     * Opisyal na Sangguniang Bayan Letterhead Banner
     * Sangguniang Bayan Seal Background Watermark
     * Pitong (7) Statutory Conditions alinsunod sa Ordinance No. 48 s. 1999
     * Elektronikong pirma ni **HON. LIDANY A. LAO-BALDO** (Municipal Vice Mayor)
     * QR Code para sa electronic verification
  3. I-click ang **"Print / Save PDF"** upang mai-print sa Long Bond Paper (8.5 x 13 in) o A4.
* **Screenshots to Include:**
  * *Figure 6:* Official 3-Year MTOP Franchise Certificate Preview.
* **Expected Result:** Makakapag-print ng legal at opisyal na sertipiko na may kumpletong selyo at lagda.

---

### Feature 4: Requesting Franchise Cancellation
* **Feature Name:** Franchise Cancellation Request
* **Purpose:** Pormal na hilingin ang pagbawi ng prangkisa sakaling ibinenta ang unit o itinigil ang pamamasada.
* **Procedure:**
  1. Sa Operator Dashboard, i-click ang mga opsyon ng unit at piliin ang **"Cancel Franchise"**.
  2. Basahin ang paunawa hinggil sa ₱50.00 cancellation fee sa Municipal Treasury.
  3. Piliin ang dahilan ng pagkansela (*Change of Ownership, Out of Service, Relocation, etc.*).
  4. I-upload ang nilagdaang Letter of Request.
  5. I-click ang **"Submit Cancellation Request"**.
* **Expected Result:** Maipapadala ang kahilingan sa tanggapan ng LLSA I para sa pag-isyu ng opisyal na Cancellation Letter.

---

## 5.2 TODA PRESIDENT MODULE

### Feature 1: Managing Association Masterlist & Member Verification
* **Feature Name:** TODA Member Roster Validation
* **Purpose:** Patotohanan ang mga lehitimong miyembro ng bawat TODA sa Gasan.
* **Procedure:**
  1. Mag-login gamit ang account ng **TODA President**.
  2. Piliin ang **"TODA Management"** sa sidebar.
  3. Makikita ang listahan ng mga kasalukuyang miyembro ng asosasyon.
  4. Upang magdagdag ng miyembro, i-click ang **"Add Member"**, ilagay ang buong pangalan at plate number, at i-save.
  5. Sa talaan ng mga bagong nag-apply, i-click ang **"Verify Member"** upang kumpirmahing sila ay lehitimong kasapi.
* **Screenshots to Include:**
  * *Figure 7:* TODA Roster Management Screen na nagpapakita ng member table at verification badges.
* **Expected Result:** Awtomatikong magkakaroon ng beripikadong marka ang operator sa pagsusuri ng munisipyo.

---

## 5.3 SB FRANCHISING STAFF — LLSA I (LOCAL LEGISLATIVE STAFF ASSISTANT I) / OFFICE OF THE VICE MAYOR MODULE

### Feature 1: Reviewing Applications and Verifying Requirements
* **Feature Name:** Application Review & Document Inspection
* **Purpose:** Suriin ang pitong (7) statutory attachments sa ilalim ng *Municipal Ordinance No. 48 s. 1999* bago aprubahan ang prangkisa.
* **Procedure:**
  1. Mag-login bilang **SB Franchising Staff — LLSA I (Local Legislative Staff Assistant I)**.
  2. Sa **Operations Dashboard**, i-click ang **"Needs Review"** pipeline o pumunta sa **"Approvals Queue"**.
  3. Piliin ang aplikasyon ng isang operator at i-click ang **"Review Application"**.
  4. Sa kaliwang bahagi, suriin ang mga uploaded images (OR/CR, Lisensya, Clearances, Cedula).
  5. Sa itaas na toolbar, i-click ang **"Application Form (PDF)"** upang suriin ang nabuong opisyal na porma o i-click ang **"Original Excel (.xlsx)"** upang direktang ma-download ang orihinal na Excel file.
  6. Kung kumpleto at walang depekto, i-click ang **"Approve Franchise"**.
  7. Kung may kulang, i-click ang **"Request Revision"** at i-type ang dahilan upang maabisuhan ang operator sa pamamagitan ng SMS.
* **Screenshots to Include:**
  * *Figure 8:* SB Franchising Operations Dashboard — LLSA I (Local Legislative Staff Assistant I).
  * *Figure 9:* LLSA I Review Screen na may magkatabing document viewer at data inspection inputs.
* **Expected Result:** Magiging *Active* ang prangkisa na may 3-taong bisa at mabubuo ang opisyal na MTOP certificate (`FRANCHISE.xlsx` replica).

---

### Feature 2: Processing Cancellations & Printing Official Cancellation Letters
* **Feature Name:** Official Franchise Cancellation Processing
* **Purpose:** Mag-isyu ng opisyal na Cancellation Letter alinsunod sa ₱50.00 regulatory fee receipt ng Municipal Treasury.
* **Procedure:**
  1. Pumunta sa **"Violations & Sanctions"** o **"Manage Revocations"** sa sidebar.
  2. Piliin ang kinanselang prangkisa.
  3. I-click ang **"Cancellation Letter"** button.
  4. Awtomatikong bubuo ang system ng 1:1 replica ng liham (`CANCELLATION OF FRANCHISE.docx`) na may letterhead ng Bise Alkalde, O.R. Number, halagang ₱50.00, at lagda ni **LIDANY A. BALDO**.
  5. I-click ang **"Print / Save PDF"** o **"Original Word (.docx)"** upang ma-download ang eksaktong `.docx` file.
* **Screenshots to Include:**
  * *Figure 10:* Official Franchise Cancellation Letter Preview Modal.
* **Expected Result:** Makakapaglabas ng opisyal na LGU cancellation clearance para sa humiling na operator.

---

### Feature 3: Franchise Masterlist Filtering & Reports
* **Feature Name:** Municipal Transport Masterlist & Reports
* **Purpose:** Mabilisang maghanap at magsala ng mga rehistradong traysikel ayon sa Zone, Status, o TODA.
* **Procedure:**
  1. Pumunta sa **"Masterlist"** sa ilalim ng Franchise Records sa sidebar.
  2. Gamitin ang search box upang maghanap ayon sa Pangalan, Plate Number, o Motor/Chassis Number.
  3. Gamitin ang dropdown filter upang pumili ng status (*Active, Expired, Cancelled, Revoked*).
  4. I-click ang **"Export Report"** o **"Print Masterlist"** para sa opisyal na talaan ng Sangguniang Bayan.
* **Screenshots to Include:**
  * *Figure 11:* Franchise Masterlist Screen na may status filters at table view.
* **Expected Result:** Mabilisang makikita ang estadistika at records nang hindi na kailangang magbuklat ng maraming Excel files.

---

## 5.4 MUNICIPAL TREASURY / CASHIER MODULE

### Feature 1: Processing Payment at Cashier Terminal
* **Feature Name:** Treasury Assessment & Payment Collection
* **Purpose:** Tanggapin ang regulatory fees (₱500 filing fee o ₱50 cancellation fee) at mag-isyu ng Official Receipt.
* **Procedure:**
  1. Mag-login bilang **Cashier**.
  2. Sa **Cashier Dashboard**, hanapin ang pangalan ng operator o plate number.
  3. Suriin ang halagang dapat bayaran.
  4. Ipasok ang opisyal na **O.R. Number** mula sa inyong pisikal na resibo ng kabang-yaman.
  5. I-click ang **"Process Payment"**.
* **Expected Result:** Magiging *Paid* ang aplikasyon at magpapadala ng awtomatikong SMS alert sa operator.

---

## 5.5 SYSTEM ADMINISTRATOR MODULE

### Feature 1: User Account & Security Management
* **Feature Name:** Role-Based User Access Control
* **Purpose:** Pamahalaan ang mga accounts ng mga kawani ng munisipyo at tiyakin ang seguridad ng data.
* **Procedure:**
  1. Mag-login bilang **System Administrator**.
  2. Pumunta sa **"User Management"** sa sidebar.
  3. Upang lumikha ng account, i-click ang **"Add User"**, piliin ang tungkulin (*SB Franchising Staff (LLSA I), Cashier, Admin*), at maglagay ng email at password.
  4. Upang i-reset ang password o i-deactivate ang isang kawani, i-click ang menu sa tabi ng kanyang pangalan.
* **Screenshots to Include:**
  * *Figure 12:* Admin User Management Screen na may user list at role badges.
* **Expected Result:** Ligtas na maipapatupad ang segregation of duties sa buong sistema.

---

# SECTION 6: ERROR HANDLING AND TROUBLESHOOTING

| Suliranin / Error Message | Posibleng Sanhi | Paano Aayusin (Solution) |
| :--- | :--- | :--- |
| **"Unable to Log In / Invalid Credentials"** | Maling password o maling email/mobile number ang naipasok. | 1. Tiyaking tama ang pagkaka-type ng email o numero.<br>2. Gamitin ang "Forgot Password" link o sumangguni sa System Administrator upang ma-reset ang password. |
| **"Duplicate Plate / Motor / Chassis Number Detected"** | Ang inilagay na plate o motor number ay nakarehistro na sa ibang traysikel sa database. | 1. Suriing mabuti ang LTO OR/CR kung tama ang na-type.<br>2. Kung may error sa nakaraang registration, sumangguni sa SB Franchising Staff (LLSA I) upang mai-verify ang records. |
| **"Expired Driver’s License / Expired Cedula Warning"** | Ang expiration date ng lisensya ay lumipas na, o ang Cedula ay hindi para sa kasalukuyang taon. | 1. Mag-renew muna ng Driver’s License sa LTO.<br>2. Kumuha ng bagong Cedula para sa kasalukuyang fiscal year sa Barangay o Municipal Treasury bago magpasa ng aplikasyon. |
| **"Input Rejected / Invalid Characters" (Anti-GIGO)** | Naglagay ng mga simbolo o numero sa field ng pangalan, o espasyo sa plate number. | Kusa itong lilinisin ng system. Siguraduhing mga titik lamang ang nasa pangalan, at alphanumeric format lamang ang nasa plate number. |
| **"Network Error / Submission Timeout"** | Mabagal o nawala ang koneksyon sa internet habang nag-a-upload ng malalaking files. | 1. Tiyaking hindi lalampas sa 10MB ang bawat litrato.<br>2. Gumamit ng stable na koneksyon at i-click muli ang "Save Draft" o "Submit". |
| **"Access Denied / Unauthorized Access"** | Sinusubukang buksan ang isang pahinang hindi sakop ng inyong tungkulin (hal. Operator na nagbubukas ng Cashier terminal). | Mag-log out at mag-login gamit ang account na may tamang permiso para sa nasabing module. |

---

# SECTION 7: FREQUENTLY ASKED QUESTIONS (FAQS)

### T1: Gaano katagal ang bisa ng isang MTOP Franchise sa Gasan?
**Sagot:** Alinsunod sa *Municipal Ordinance No. 48 s. 1999* at Republic Act No. 7160, ang prangkisa ng traysikel na ipinagkakaloob ng Sangguniang Bayan ay may bisa na **tatlong (3) taon** mula sa petsa ng pag-apruba nito.

### T2: Ano ang ibig sabihin ng "LLSA I"?
**Sagot:** Ang **LLSA I** ay nangangahulugang **Local Legislative Staff Assistant I**. Ito ang opisyal na plantilla position ng kawani ng Sangguniang Bayan / Office of the Municipal Vice Mayor na nangangasiwa sa pagtanggap, pagsusuri, at pagproseso ng mga prangkisa ng traysikel sa Gasan.

### T3: Maaari ko bang i-print ang aking Application Form kahit blangko pa ito?
**Sagot:** Oo! Kung nais mong kumuha ng opisyal na porma para sulatan ng kamay, buksan lamang ang Application Form modal at i-click ang **"Print / Save as PDF"**. Kapag walang nakalagay na data, awtomatikong malinis na patlang (`___________`) ang ilalabas ng system nang walang anumang pekeng o mock data.

### T4: Paano malalaman ng mga awtoridad kung lehitimo ang isang MTOP Certificate sa kalsada?
**Sagot:** Bawat opisyal na MTOP Certificate ay may natatanging **QR Code**. Maaari itong i-scan gamit ang anumang smartphone camera upang mabuksan ang opisyal na G-TRAMS Electronic Authentication page na nagpapatunay sa legalidad ng unit.

### T5: Magkano ang opisyal na bayarin sa pagkansela ng prangkisa?
**Sagot:** Alinsunod sa umiiral na regulasyon ng Sangguniang Bayan, may regulatory fee na **₱50.00** na babayaran sa Municipal Treasury (Window 3) bago ilabas ang opisyal na Franchise Cancellation Letter.

### T6: Maaari ba akong mag-apply gamit lamang ang cellphone?
**Sagot:** Oo. Ang G-TRAMS ay isang Progressive Web App (PWA) na may fully responsive mobile layout. Maaari kang kumuha ng litrato ng inyong dokumento gamit ang camera ng cellphone at direktang magpasa sa pamamagitan ng browser.

---

# SECTION 8: SECURITY AND USER REMINDERS

1. **Pangangalaga sa Account Credentials:** Huwag kailanman ibahagi ang inyong password sa ibang tao. Ang inyong account ay may legal na pananagutan sa bawat transaksyong isinusumite.
2. **Pag-logout sa mga Pampublikong Computer:** Kung gumamit ng computer shop o shared desktop sa munisipyo, laging i-click ang **Log Out** at i-close ang browser bago umalis.
3. **Data Privacy Compliance (R.A. 10173):** Ang lahat ng personal na impormasyon, litrato ng lisensya, at rehistro ng traysikel ay protektado alinsunod sa *Philippine Data Privacy Act of 2012*. Tanging ang mga awtorisadong kawani ng Sangguniang Bayan ang may karapatang sumuri sa mga dokumentong ito.
4. **Legalidad ng mga Dokumento:** Mahigpit na ipinagbabawal ang pag-upload ng mga pekeng dokumento o altered images. Ang anumang maling pahayag ay sapat na batayan sa agarang pagbawi ng prangkisa alinsunod sa Section 7 ng Ordinance No. 48 s. 1999.

---

# SECTION 9: SUPPORT AND CONTACT INFORMATION

Kung may katanungan, suliraning teknikal, o kailangan ng tulong sa paggamit ng G-TRAMS, mangyaring makipag-ugnayan sa mga sumusunod:

* **Sangguniang Bayan / Office of the Municipal Vice Mayor:**
  * Lokasyon: 2nd Floor, Municipal Building, Gasan, Marinduque
  * Telepono: (042) 704-0208 / 0917-7128797
  * Opisyal na Email: `vmlengbaldo@gmail.com` / `sbgasan7@gmail.com`
  * Kawani: Madhelyn Pastoral (LLSA I) / Kyla Patrice Sace (Encoder)
* **Municipal Treasury Office (Window 3):**
  * Lokasyon: Ground Floor, Municipal Building, Gasan, Marinduque
  * Kawani: Revenue Collector Clerk / Maria Jesusa M. Ghosh (Acting Municipal Treasurer)
* **Capstone Project Development Team (MarSU CICS):**
  * College of Information and Computing Sciences, Marinduque State University, Boac, Marinduque
  * Email Support: `cics@mscmarinduque.edu.ph` / `support.gtrams@gmail.com`

---

# APPENDIX: CANVA LAYOUT & SCREENSHOT CHECKLIST (`main` branch)

Narito ang eksaktong 12 screenshots na kukunin ninyo mula sa `main` branch para i-paste sa inyong Canva document:

| Figure # | Title ng Screenshot | Pahina sa System kung Saan Kukunin | Ano ang Dapat Makita sa Screenshot |
| :---: | :--- | :--- | :--- |
| **Figure 1** | Welcome & Login Interface | `/login` | Malinis na login card na may Gasan seal, username/password inputs, at language switcher. |
| **Figure 2** | Operator Registration Form | `/register` | Registration modal na may pangalan, mobile number, at barangay dropdown. |
| **Figure 3** | 5-Step Application Wizard | `/apply` (Step 2) | Vehicle details input, OR/CR upload zone, at progress bar sa itaas. |
| **Figure 4** | Official MTOP Application Form | `/apply` (Step 5) &rarr; *Preview Form* | 1:1 replica ng form na may official banner, Ordinance 48 s. 1999 text, at Mayor Lim jurat. |
| **Figure 5** | Franchise Renewal Interface | `/renew/:id` | Renewal form na may Cedula upload at fiscal year validity indicator. |
| **Figure 6** | Official 3-Year MTOP Certificate | `/operator-dashboard` &rarr; *View Certificate* | Sertipikong may double border, watermark, pirma ni Vice Mayor Lao-Baldo, at QR code. |
| **Figure 7** | TODA Roster Management | `/validate-toda` | Masterlist table ng TODA President na may active member verification badges. |
| **Figure 8** | SB Franchising Dashboard (LLSA I) | `/bplo-dashboard` | Operations dashboard na may role badge na `SB FRANCHISING DIVISION (LLSA I)` at stat cards. |
| **Figure 9** | LLSA I Review & Inspection | `/franchise-review/:id` | Admin review panel na may magkatabing document viewer at data inspection inputs. |
| **Figure 10** | Official Cancellation Letter | `/manage-revocations` &rarr; *Cancellation Letter* | Opisyal na liham ng pagkansela na may ₱50.00 O.R. fee block at lagda ng Bise Alkalde. |
| **Figure 11** | Franchise Masterlist Table | `/franchise-masterlist` | Talaan ng lahat ng prangkisa na may search bar at zone/status filters. |
| **Figure 12** | Admin User Management | `/user-management` | Talaan ng mga kawani na may mga tungkulin (Admin, LLSA I — Local Legislative Staff Assistant I, Cashier). |
| **Figure 13** | Cashier Payment Terminal | `/cashier-dashboard` | Treasury Window 3 payment processing modal na may O.R. Number input at assessed fee. |
