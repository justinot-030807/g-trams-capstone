# G-TRAMS: The 5-Minute Flawless Live Demo Script
**Gasan Tricycle Records and Application Management System**  
*Marinduque State University • College of Information and Computing Sciences (CICS)*  
*Group 5: Jhon Kyn Axix H. Cabrigas, Justine S. Lachica, Jay Vincent G. Motol, Ian Simon Francis M. Rey*

---

## 🎯 Layunin ng Live Demo
Ipakita sa panel sa loob ng **5 hanggang 7 minuto** ang buong lifecycle ng prangkisa:  
$$\text{TODA Roster Gate} \longrightarrow \text{5-Step Online Application} \longrightarrow \text{OVM / LLSA I Review} \longrightarrow \text{Cashier Settlement} \longrightarrow \text{OVM Endorsement \& QR Verification}$$

---

## 💻 Setup Bago Magsimula (Two-Browser Strategy)
* **Screen Display (Projector):** Chrome Window 1
  - Tab 1: `file:///c:/Users/Hp/GTRAMS/docs/presentation.html` (Slide Deck)
  - Tab 2: `https://g-trams-official.vercel.app` (Naka-login bilang Operator: `operator.tester@gtrams.com` / `Password123!`)
* **Secondary Screen / Background:** Incognito Chrome Window 2
  - Tab 1: Naka-login bilang TODA President (`todapres.tester@gtrams.com` / `Password123!`, route `/submit-members`)
  - Tab 2: Naka-login bilang OVM / LLSA I Staff (`llsa.tester@gtrams.com` / `Password123!`, route `/llsa-dashboard`)
  - Tab 3: Naka-login bilang Cashier (`cashier.tester@gtrams.com` / `Password123!`, route `/cashier-dashboard`)
  - Tab 4: Naka-login bilang System Admin (`admin.tester@gtrams.com` / `Password123!`, route `/admin/settings`)

---

## ⏱️ Step-by-Step Flow (Minute-by-Minute)

### 🟢 MINUTE 1: Operator Portal, 5-Step Wizard & 3-Tier AI OCR Scan
* **Tagapagsalita:** **Justine S. Lachica**
* **Aksyon sa Screen (`/operator-dashboard` -> `/apply-franchise`):**
  1. Sa Operator Dashboard, i-click ang **`Apply for Franchise`**.
  2. Pumili ng Barangay at TODA (awtomatikong nama-map ang Zone: `Central`, `North`, o `South`).
  3. Sa document upload card para sa OR/CR, mag-upload ng sample image (`sample_docs/TAMA/03_lto_cr_TAMA.png`).
  4. Panoorin ang pag-scan ng 3-Tier OCR (Gemini cascade -> offline `tesseract.js` -> `OCR.space`): awtomatikong napupunan ang Engine/Motor No., Chassis No., at Plate No., at sa Step 5 makikita ang inline printable 1:1 **`OfficialApplicationForm`** bago i-submit.
* **Sasabihin sa Panel:**
  > *"Ito po ang aming Operator Portal. Kapag nag-upload ang driver ng LTO OR/CR, kinokompress muna ito sa browser bago i-scan ng aming 3-tier OCR engine. Awtomatikong napuno ang form nang walang typo error, at may strict RA 10173 exclusion kaya hindi kinukuha ang blood type, Cedula payment amount, o signatures."*

---

### 🟢 MINUTE 2: TODA President Roster & Auto-Generated Body Number
* **Tagapagsalita:** **Jay Vincent G. Motol**
* **Aksyon sa Screen (`/submit-members`):**
  1. Lumipat sa Incognito Window -> **TODA President Tab** (`/submit-members`).
  2. Ipakita ang **Active Roster Directory** (Body Number + Operator Full Name lang) at pindutin ang button na **`+ Add Member`**.
  3. Ipakita na awtomatikong lumabas ang **Next Available Body Number** at pindutin ang **`Regenerate`** button para ipakita na collision-free ito.
  4. Ilagay ang pangalan ng miyembro at i-submit para ma-verify ni OVM / LLSA I.
* **Sasabihin sa Panel:**
  > *"Dito naman sa TODA President portal, hindi na kailangang i-upload ang buong masterlist kapag may isang bagong miyembro. Awtomatikong nagbibigay ang database ng susunod na available body number na may compound unique index at pre-registration roster gate sa `/register`."*

---

### 🟢 MINUTE 3: OVM / LLSA I Application Review & Pre-Payment Check
* **Tagapagsalita:** **Jhon Kyn Axix H. Cabrigas**
* **Aksyon sa Screen (`/llsa-dashboard` -> `/franchise-approval`):**
  1. Lumipat sa **OVM / LLSA I Staff Tab** (`/llsa-dashboard` o `/franchise-approval`).
  2. Buksan ang bagong pasok na aplikasyon mula sa **`Needs Review`** queue (`/franchise-approval/review/:id`).
  3. Ipakita ang **Side-by-Side Document Comparator** at **Pre-Payment Record Check** (prior violations & TODA roster verification).
  4. Pindutin ang **`Approve for Payment`**.
* **Sasabihin sa Panel:**
  > *"Dito sa OVM / LLSA I portal, mahigpit na ipinapatupad ang Pay-Before-Sign workflow. May side-by-side document comparison at automated violation check bago ipadala sa Cashier — at walang Cashier payment shortcut dito sa Staff view."*

---

### 🟢 MINUTE 4: Municipal Cashier Payment & COA Daily Remittance Sheet
* **Tagapagsalita:** **Ian Simon Francis M. Rey**
* **Aksyon sa Screen (`/cashier-dashboard`):**
  1. Lumipat sa **Cashier Tab** (`/cashier-dashboard`).
  2. Hanapin ang approved application sa **For Payment Queue**.
  3. Ipanatili ang **Over-the-Counter Municipal Treasury Cash Payment**, mag-input ng physical **Official Receipt (OR) Number** (hal. `OR-2026-9812`) at **Payer Name**.
  4. Pindutin ang **`Confirm Payment & Issue Receipt`**, at ipakita ang printable **E-Resibo** at ang **Daily Treasury Remittance Sheet** + **`Export CSV`** sa ibaba.
* **Sasabihin sa Panel:**
  > *"Sa Cashier terminal, tanging ang Municipal Cashier lang ang pwedeng mag-encode ng physical LGU Official Receipt. Kapag na-confirm, awtomatikong nag-a-allocate ng sequential MTOP number (`YYYY-NNN`) at naitatala sa immutable `PaymentLedger` at Daily Remittance Sheet."*

---

### 🟢 MINUTE 5: OVM Release, Roadside Mobile QR (`/verify/:id`) & Live Extras
* **Tagapagsalita:** **Ian Simon Francis M. Rey** (katulong si **Justine S. Lachica**)
* **Aksyon sa Screen / Cellphone:**
  1. Sa **OVM / LLSA I Tab**, i-advance ang bayad na prangkisa mula `For Signing` -> `Ready for Pickup` -> `Active`.
  2. Buksan o i-scan ang **Verify Operator Portal** (`/verify/:id`, hal. `/verify/690...` o QR code sa MTOP Certificate).
  3. Agad na lalabas ang public verification page na may status badge (**`Active`**), Plate/MTOP Number, at TODA Zone.
  4. *(Kung may tanong ang panel)*: Ipakita sa `/franchise-masterlist` ang live **`Expire`** button -> **`Renew Franchise`**, ang **`Request Cancellation`** -> **`Cancellations` Tab**, o ang 3-tier violations sa **`/manage-revocations`**.
* **Sasabihin sa Panel:**
  > *"Sa kalsada, isang scan lang ng enforcer o pasahero sa `/verify/:id` ay kita agad kung aktibo, suspendido, o revoked ang prangkisa nang hindi inilalantad ang sensitibong personal na datos alinsunod sa RA 10173."*

---

### 🟢 MINUTE 6: System Admin Isolation, Policies & 1-Click Database Backup
* **Tagapagsalita:** **Jhon Kyn Axix H. Cabrigas**
* **Aksyon sa Screen (`/admin/settings`):**
  1. Lumipat sa **System Admin Tab** (`/admin/settings`). Ipakita na walang franchise approval menu ang `system_admin`.
  2. Buksan ang **Tab 5: Database Backup & DRP**.
  3. Ipakita ang **Weekly Scheduled Backup Cron Status** (**Active tuwing Linggo, 12:00 MN PST / `Asia/Manila`**, `0 0 * * 0` across **16 collections**).
  4. I-click ang **`Export Database Backup (.json.gz)`** para ipakita ang live encrypted/compressed snapshot download na may SHA-256 integrity verification.
* **Sasabihin sa Panel:**
  > *"Bilang IT governance at disaster recovery safeguard, hiwalay ang IT System Admin sa licensing operations at may automated weekly backup plus manual `.json.gz` snapshot export at distributed-lock restore engine."*

---

## 🎬 Pangwakas na Sasabihin (Closing Line)
* **Tagapagsalita:** **Jhon Kyn Axix H. Cabrigas**
> *"Iyan po ang kabuuang daloy ng G-TRAMS—mabilis, ligtas, transparent, at handang-handa nang gamitin ng Bayan ng Gasan. Maraming salamat po, at bukas na po ang aming grupo para sa inyong mga katanungan."*
