# G-TRAMS: The 5-Minute Flawless Live Demo Script
**Gasan Tricycle Regulatory and Management System**  
*Marinduque State University • College of Information and Computing Sciences (CICS)*  
*Group 5: Jhon Kyn Axix Cabrigas, Justine Lachica, Jay Vincent Jamilla, Ian Simon*

---

## 🎯 Layunin ng Live Demo
Ipakita sa panel sa loob ng **5 hanggang 7 minuto** ang buong lifecycle ng prangkisa:  
$$\text{Online Application} \longrightarrow \text{TODA Endorsement} \longrightarrow \text{BPLO Evaluation} \longrightarrow \text{Cashier Settlement} \longrightarrow \text{Roadside QR Verification}$$

---

## 💻 Setup Bago Magsimula (Two-Browser Strategy)
* **Screen Display (Projector):** Chrome Window 1
  - Tab 1: `file:///c:/Users/Hp/GTRAMS/docs/presentation.html` (Slide Deck)
  - Tab 2: `https://g-trams-official.vercel.app` (Naka-login bilang Operator)
* **Secondary Screen / Background:** Incognito Chrome Window 2
  - Tab 1: Naka-login bilang TODA President (`toda.tester@gtrams.com` / `Password123!`)
  - Tab 2: Naka-login bilang BPLO Staff (`bplo.tester@gtrams.com` / `Password123!`)
  - Tab 3: Naka-login bilang Cashier (`cashier.tester@gtrams.com` / `Password123!`)
  - Tab 4: Naka-login bilang System Admin (`admin.tester@gtrams.com` / `Password123!`)

---

## ⏱️ Step-by-Step Flow (Minute-by-Minute)

### 🟢 MINUTE 1: Operator Portal & Fast AI OCR Scan
* **Tagapagsalita:** **Justine Lachica**
* **Aksyon sa Screen:**
  1. Sa Operator Dashboard, i-click ang **`Apply for Franchise`**.
  2. Piliin ang Application Type: **`New Franchise`** o **`Annual Renewal`**.
  3. Sa document upload card para sa OR/CR, mag-upload ng sample image.
  4. Panoorin ang pag-scan ng AI:
     - Mapapansin na sa loob lamang ng **1.5 segundo**, awtomatikong na-extract ang:
       - Engine / Motor No.
       - Chassis No.
       - Plate No.
* **Sasabihin sa Panel:**
  > *"Ito po ang aming Operator Portal. Kapag nag-upload ang driver ng litrato ng kanyang LTO OR/CR, kinokompress muna ito ng system sa browser bago i-scan ng Google Gemini AI. Sa loob lamang ng 1.5 segundo, awtomatikong napuno ang form nang walang typo error."*

---

### 🟢 MINUTE 2: TODA President & Auto-Generated Body Number
* **Tagapagsalita:** **Jay Vincent Jamilla**
* **Aksyon sa Screen:**
  1. Lumipat sa Incognito Window -> **TODA President Tab** (`/toda/submit-members`).
  2. Ipakita ang **Active Roster Directory** at pindutin ang button na **`+ Magdagdag ng Miyembro`**.
  3. Ipakita sa modal na awtomatikong lumabas ang **Next Available Body Number** (e.g. `BAT-043` o `POB-006`).
  4. Pindutin ang **`Regenerate`** button para ipakita na dynamic at collision-free ito.
  5. Ilagay ang pangalan ng bagong operator at pindutin ang **`I-rehistro ang Miyembro`**.
* **Sasabihin sa Panel:**
  > *"Dito naman po sa TODA President portal, mayroon tayong individual member registration. Hindi na kailangang mag-upload ng buong masterlist kapag may isang sumali. Awtomatikong nagbibigay ang database ng susunod na available na body number na may strict unique constraint para maiwasan ang duplicate."*

---

### 🟢 MINUTE 3: BPLO Application Evaluation & Side-by-Side OCR Verification
* **Tagapagsalita:** **Jhon Kyn Axix Cabrigas**
* **Aksyon sa Screen:**
  1. Lumipat sa **BPLO Staff Tab** (`/admin/dashboard` o `/admin/franchises`).
  2. Buksan ang bagong pasok na aplikasyon mula sa queue.
  3. Ipakita ang **Side-by-Side Document Comparator**:
     - Kaliwa: Scanned document image.
     - Kanan: AI-extracted data at inputs ng operator na may green checkmarks kung match.
  4. Pindutin ang **`Approve for Assessment`** o **`Endorse for Payment`**.
* **Sasabihin sa Panel:**
  > *"Dito sa BPLO portal, hindi na kailangang manu-manong mag-type ng evaluator. May side-by-side automated verification tayo kung saan kitang-kita kung tugma ang data ng aplikante sa opisyal na LTO document."*

---

### 🟢 MINUTE 4: Municipal Cashier Payment & COA Daily Remittance Sheet
* **Tagapagsalita:** **Ian Simon**
* **Aksyon sa Screen:**
  1. Lumipat sa **Cashier Tab** (`/cashier/dashboard`).
  2. Hanapin ang approved application sa **Payment Queue**.
  3. Piliin ang Payment Mode: **`Cash`** o **`GCash`**.
  4. Mag-input ng Official Receipt (OR) Number (hal. `OR-2026-9812`).
  5. Pindutin ang **`Confirm Payment & Issue Receipt`**.
  6. Ipakita ang **Daily Treasury Remittance Sheet** sa ibaba na may summary ng araw-araw na collection at pirmahan ng Cashier at Municipal Treasurer.
  7. I-click ang **`Export CSV`** para ipakita ang accounting download.
* **Sasabihin sa Panel:**
  > *"Sa Cashier terminal, mahigpit na ipinagbabawal ang pag-apruba nang walang bayad. Kapag na-enter ang Official Receipt, awtomatikong naitatala ang transaksyon sa Daily Remittance Sheet na sumusunod sa COA guidelines at may 1-click CSV export para sa Treasury."*

---

### 🟢 MINUTE 5: Roadside Mobile QR Verification & Offline PWA Mode
* **Tagapagsalita:** **Ian Simon** (katulong si **Justine**)
* **Aksyon sa Screen / Cellphone:**
  1. Buksan ang **Verify Operator Portal** (`/verify`).
  2. Gamit ang camera ng cellphone o screen barcode scanner, i-scan ang digital QR code ng bagong aprubadong tricycle.
  3. Agad na lalabas ang **Active Franchise Card** na may:
     - Green Badge: **`ACTIVE (Valid until 2027)`**
     - Operator Picture, Body Number, Plate Number, at TODA Zone.
  4. (Opsyonal kung hilingin ng panel): I-simulate ang offline mode sa DevTools Network tab para ipakita na gumagana pa rin ang verification mula sa PWA cache.
* **Sasabihin sa Panel:**
  > *"Sa kalsada, ang traffic enforcer ay mag-i-scan lamang ng QR code sa loob ng 1 segundo. Lalabas agad kung lehitimo ang prangkisa, may violation ba, o peke ang plaka, kahit mahina o walang internet signal."*

---

### 🟢 MINUTE 6: System Admin Telemetry & 1-Click Database Backup
* **Tagapagsalita:** **Jhon Kyn Axix Cabrigas**
* **Aksyon sa Screen:**
  1. Lumipat sa **System Admin Tab** (`/admin/settings`).
  2. Buksan ang **Tab 5: Database Backup & DRP**.
  3. Ipakita ang **Weekly Scheduled Backup Cron Status** (Active tuwing Linggo, 2:00 AM PST).
  4. I-click ang **`Export Database Backup (JSON)`** para ipakita ang live snapshot download na may SHA-256 integrity hash.
* **Sasabihin sa Panel:**
  > *"Bilang pagtugon sa IT audit requirements, may automated weekly backup ang system at may 1-click snapshot export para sa agarang disaster recovery ng Pamahalaang Bayan ng Gasan."*

---

## 🎬 Pangwakas na Sasabihin (Closing Line)
* **Tagapagsalita:** **Jhon Kyn Axix Cabrigas**
> *"Iyan po ang kabuuang daloy ng G-TRAMS—mabilis, ligtas, transparent, at handang-handa nang gamitin ng Bayan ng Gasan. Maraming salamat po, at bukas na po ang aming grupo para sa inyong mga katanungan."*
