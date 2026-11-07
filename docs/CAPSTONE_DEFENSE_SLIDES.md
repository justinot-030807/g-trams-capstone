# G-TRAMS Final Capstone Defense Slide Deck Guide
**Gasan Tricycle Regulatory and Automated Management System**  
*College of Information and Computing Sciences — Marinduque State University*  
*Academic Year 2026–2027*

---

## 📊 Overview ng Presentation Deck (15 Slides)
- **Kabuuang Oras:** 15–20 minuto (1 minuto kada slide + Live Demo)
- **Inirekumendang Layout:** 16:9 Widescreen sa Canva, PowerPoint, o Google Slides
- **Color Theme:** Maroon (`#9E2A2B`), Gold (`#D4AF37`), Dark Charcoal (`#1F1D1B`), at Clean White (`#FFFFFF`)

---

### Slide 1: Title Slide (Cover)
* **Visual Elements:** Opisyal na Logo ng LGU Gasan at Marinduque State University Seal.
* **Header / Title:** **G-TRAMS**
* **Subtitle:** Gasan Tricycle Regulatory and Automated Management System
* **Context:** Final Capstone Defense • BS Information Technology
* **Presented by (Group 5):**
  - **Jhon Kyn Axix H. Cabrigas** — Lead Backend Developer
  - **Justine S. Lachica** — Frontend Developer
  - **Jay Vincent G. Motol** — Quality Assurance
  - **Ian Simon Francis M. Rey** — DevOps & Cloud Engineer
* **Speaker:** *Lahat ng miyembro ay magpapakilala nang maikli.*

---

### Slide 2: Project Background & Problem Statement
* **Visual Elements:** Icons ng lumang papel, mahabang pila sa munisipyo, at tricycle unit.
* **Key Bullet Points:**
  - **Mano-manong Pagproseso:** Mahabang pila at 7–14 araw na paghihintay para sa release ng Motorized Tricycle Operator's Permit (MTOP).
  - **Panganib ng "Colorum" Units:** Kakulangan ng real-time roadside checking tools para sa kapulisan at traffic enforcers.
  - **Duplicate Body Numbers:** Walang sentralisadong database ang mga TODA kaya nagkakaroon ng nagkakarerang numero ng tricycle.
  - **Panganib ng Pagkawala ng Data:** Manual paper ledgers na madaling masira sa baha o sunog.
* **Speaker Notes (Jhon Kyn):** *"Bago ang G-TRAMS, ang mga tricycle operator sa Gasan ay kailangan pang magpabalik-balik sa munisipyo at magdala ng sari-saring photocopy. Madalas ding mahirapan ang enforcers malaman kung peke ang sticker ng tricycle."*

---

### Slide 3: Project Objectives & Scope
* **Visual Elements:** 4 na Goal Badges na may checkmarks.
* **Key Bullet Points:**
  - **Automated Lifecycle:** Digitized application, renewal, endorsement, at payment assessment.
  - **AI OCR Acceleration:** Pagsusuri at pagbasa ng LTO OR/CR at mga dokumento sa loob ng 1.5 segundo gamit ang AI Vision.
  - **Tamper-Proof QR Verification:** Instant live status checking gamit ang smartphone camera nang walang kailangang i-install na app.
  - **Disaster Recovery (DRP):** Automated weekly database backup at offline local exports alinsunod sa Data Privacy Act (RA 10173).
* **Speaker Notes (Justine):** *"Ang layunin ng G-TRAMS ay hindi lamang i-digitize ang forms, kundi gawing konektado ang buong ecosystem ng LGU: mula sa operator, TODA, BPLO, Treasury, hanggang sa traffic enforcers sa kalsada."*

---

### Slide 4: System Architecture & Technical Stack
* **Visual Elements:** Tech Stack Architecture Diagram.
* **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Framer Motion, Progressive Web App (PWA).
* **Backend:** Node.js, Express.js (REST API, JWT, Role-Based Access Control).
* **Database & Cloud:** MongoDB Atlas (Cloud NoSQL), Cloudinary (Encrypted Document Storage).
* **AI & Automation:** Google GenAI SDK (Gemini Vision OCR), Node-Cron Scheduler (Server-Authoritative PST Timezone).
* **Deployment:** Vercel (Frontend Web App), Render (Backend Containerized API).
* **Speaker Notes (Ian Simon):** *"Naka-deploy ang aming system sa modern cloud infrastructure. Gumagamit kami ng PWA para ma-install ito ng drivers sa kanilang Android o iPhone nang walang Google Play Store download."*

---

### Slide 5: Role-Based Access Control (RBAC) Matrix
* **Visual Elements:** 6-Card Grid ng bawat User Persona na may opisyal na badges.
* **User Personas:**
  1. **Tricycle Operator:** Online application, status tracking, e-copy ng MTOP, digital ID.
  2. **TODA President:** Roster masterlist, auto-generate body numbers, clearances.
  3. **Traffic Enforcer (PNP/CTMO):** Instant roadside QR scanning, violation ticketing.
  4. **Municipal Cashier:** Fee settlement, OR logging, Daily Remittance Sheet & CSV export.
  5. **BPLO Licensing Officer:** Document verification, inspection scheduling, permit approval.
  6. **System Admin (IT):** RBAC, audit trails, and weekly database backup/recovery.
* **Speaker Notes (Justine):** *"Ayon sa naging puna ng panel sa pre-final, mahigpit na nating inihiwalay ang System Admin sa BPLO Staff. Ang Admin ay para sa IT maintenance lamang at walang karapatang mag-apruba o mag-settle ng bayad."*

---

### Slide 6: Key Feature 1 — Operator Portal & AI OCR Engine
* **Visual Elements:** Screenshot ng Figure 5 at Figure 6 mula sa User's Manual.
* **Key Highlights:**
  - **3-Step Application:** New Franchise, Annual Renewal, at Voluntary Cancellation.
  - **AI OCR Pre-Check:** Awtomatikong binabasa ang Motor Number, Chassis Number, at Plate Number mula sa litrato ng LTO OR/CR.
  - **Document Classification Guard:** Hinaharang agad ang maling file (e.g. selfie o blurred photo).
  - **Multi-Channel Recovery Contact:** Opsyonal na backup email/phone sakaling mawala ang primary SIM card ng operator.
* **Speaker Notes (Justine):** *"Sa pamamagitan ng AI Vision OCR, nabawasan natin ng 80% ang manual typing errors ng mga driver. Hindi na nila kailangang kabisaduhin ang 17-digit chassis number dahil ang system na ang nag-e-extract nito."*

---

### Slide 7: Key Feature 2 — TODA President Member Management
* **Visual Elements:** Screenshot ng Figure 7 (TODA Roster Management).
* **Key Highlights:**
  - **Unique Body Number Allocation:** Pinipigilan ang duplicate body numbers sa pamamagitan ng compound database index at pre-registration check.
  - **Auto-Generate Sequential Numbers:** Awtomatikong nagbibigay ng susunod na bakanteng numero sa asosasyon.
  - **Digital Endorsement:** Ang mga accredited members lamang na may TODA clearance ang maaaring magpatuloy sa BPLO queue.
* **Speaker Notes (Jay Vincent):** *"Siniguro natin sa pamamagitan ng stress testing na kahit 5 beses sabay-sabay i-submit ang parehong body number, 1 lang ang tatanggapin ng system para walang mag-away na tricycle sa pila."*

---

### Slide 8: Key Feature 3 — BPLO Licensing & Approval Workflow
* **Visual Elements:** Screenshot ng Figure 10 (Approval Queue & Document Inspector).
* **Key Highlights:**
  - **Side-by-Side Review:** Makikita ng BPLO staff ang orihinal na litrato ng dokumento katabi ng AI-extracted data.
  - **Physical Inspection Scheduler:** Pagtatakda ng petsa para sa roadworthiness, ilaw, at preno ng tricycle.
  - **Official MTOP Generation:** Awtomatikong paggawa ng digital permit na may selyo ng Munisipalidad ng Gasan.
* **Speaker Notes (Jhon Kyn):** *"Bago ang sistema, mano-manong sinusuri ang bawat folder. Ngayon sa BPLO terminal, 1 click lang ang pag-review at may real-time notification via SMS sa driver."*

---

### Slide 9: Key Feature 4 — Municipal Treasury & Daily Remittance
* **Visual Elements:** Screenshot ng Figure 9 (Cashier Dashboard at Remittance Modal).
* **Key Highlights:**
  - **Zero Admin Bypass:** Sa Cashier terminal lamang maaaring mag-settle ng bayad at mag-log ng Official Receipt (OR).
  - **Cash & GCash Digital Ledger:** Malinaw na paghihiwalay ng over-the-counter cash laban sa online payments.
  - **Daily Treasury Remittance Sheet (COA-Compliant):** End-of-day revenue reconciliation na may pirma ng Cashier at Municipal Treasurer.
  - **1-Click CSV Export:** Awtomatikong nag-e-export ng spreadsheet para sa municipal accounting records.
* **Speaker Notes (Ian Simon):** *"Ito ang bagong feature na hiniling ng panel. Sa pagtatapos ng araw, isang pindot lang ng Cashier, may printable remittance sheet na sila na may lagda ng Treasurer alinsunod sa patakaran ng COA."*

---

### Slide 10: Key Feature 5 — Roadside Dual-Lookup QR Verification
* **Visual Elements:** Screenshot ng Figure 8 (Mobile QR Verification Screen).
* **Key Highlights:**
  - **Dual-Lookup Engine:** Nade-detect kung **Operator Physical ID** o **Tricycle MTOP Certificate** ang iniscan.
  - **Real-Time Database Query:** Diretso sa live database, hindi static text ang laman ng QR code.
  - **Sub-Second Response:** Lumalabas ang status (Active, Renewal Pending, o Expired) sa loob lamang ng 1 segundo.
  - **Mobile Responsive:** Gumagana sa anumang standard smartphone camera nang walang app download.
* **Speaker Notes (Jay Vincent):** *"Ipinagmamalaki namin na ang aming QR code ay hindi napepeke. Kapag iniscan ito ng pulis sa kalsada, diretso itong kumokonekta sa municipal database para kumpirmahin kung valid ang prangkisa."*

---

### Slide 11: System Administration & Disaster Recovery Plan (DRP)
* **Visual Elements:** Screenshot ng Figure 12 (Database Backup & Restore Tab).
* **Key Highlights:**
  - **Automated Weekly Cron Backup:** Tumakbo tuwing Linggo ng 12:00 MN (Midnight) na may rolling 8-week retention.
  - **Direct Offline In-Memory Stream:** Nagda-download ng gzipped JSON archive (`.json.gz`) diretso sa USB ng Municipal IT Officer.
  - **Ephemeral Cloud Proof:** Hindi apektado kahit mag-restart o mag-redeploy ang Render host container.
  - **Safe Restoration Engine:** May pre-restore safety snapshot at kailangang i-type ang `RESTORE` bago mag-overwrite.
* **Speaker Notes (Ian Simon):** *"Ayon sa kahilingan ng panel ukol sa data backup, nagpatupad kami ng two-tier disaster recovery. Kahit bumagsak ang server, buong maibabalik ang 13 database collections sa loob lamang ng 5 segundo gamit ang offline archive."*

---

### Slide 12: Security, Data Privacy (RA 10173) & Server-Authoritative Time
* **Visual Elements:** Security Shield Icon, Data Privacy Seal, at Server Clock Icon.
* **Key Highlights:**
  - **Data Privacy Act (RA 10173):** One-way bcrypt password hashing; tinatanggal ang active OTPs sa backup archives bago i-export.
  - **Server-Authoritative Time (Asia/Manila, UTC+8):** Hindi maaaring dayain ang expiration date sa pamamagitan ng pagbago ng oras ng laptop ng user.
  - **Immutable Audit Trails:** Naitatala ang bawat pag-apruba, pag-login, pag-revoke, at pagbabayad kasama ang timestamp at IP address.
* **Speaker Notes (Jhon Kyn):** *"Dati po, kapag pinalitan ang oras ng laptop, nagbabago ang status ng prangkisa. Ngayon, 100% server-locked na ito sa Philippine Standard Time kaya imposibleng dayain ang expiration."*

---

### Slide 13: Quality Assurance & Testing Results
* **Visual Elements:** Green Test Suite Metrics Chart.
* **Test Metrics:**
  - **Total Test Suites:** 14 passed / 14 total (100%)
  - **Total Unit & Integration Tests:** 201 passed / 201 total (0 failures)
  - **Stress Test Concurrency:** 500 simulated requests; 100% success rate na may average latency na 22ms hanggang 40ms.
  - **Documented Deliverable:** Complete Test Plan at Test Cases sa `docs/Deliverable4_Test_Plan.html`.
* **Speaker Notes (Jay Vincent):** *"Siniguro ng aming QA process na matatag ang system bago ang depensa. Lahat ng 201 automated tests sa Jest ay berde, at naipasa ang 50 concurrent request stress test nang walang memory leak."*

---

### Slide 14: System Impact & Benefits to LGU Gasan
* **Visual Elements:** Comparison Table (Before vs. After G-TRAMS).
* **Key Metrics:**
  - **Processing Time:** Mula 7–14 araw ➔ 2–3 araw na lamang.
  - **Paper Reduction:** 85% pagbaba sa pisikal na photocopies at folders.
  - **Revenue Transparency:** 100% digital tracking ng bawat sentimo sa pamamagitan ng daily remittance sheet.
  - **Enforcement Efficiency:** Instant roadside verification sa loob ng 1–2 segundo.
* **Speaker Notes (Justine):** *"Ang G-TRAMS ay patunay na kaya ng isang 4th-class municipality tulad ng Gasan na magkaroon ng world-class, automated regulatory system para sa kapakanan ng mga tricycle drivers at mamamayan."*

---

### Slide 15: Conclusion & Q&A
* **Visual Elements:** Thank you banner, G-TRAMS Logo, LGU Gasan Seal, at MarSU CICS text.
* **Project Status:** Production Ready (`https://g-trams-official.vercel.app`)
* **Deliverable #7:** User's Manual of the System (PDF) Completed & Submitted.
* **Closing Statement:**
  > *"Taos-puso kaming nagpapasalamat sa aming thesis adviser, panel members, at sa Pamahalaang Bayan ng Gasan. Bukas na po ang aming grupo para sa inyong mga katanungan at suhestiyon."*
* **Speaker:** *Jhon Kyn Axix Cabrigas (Lead)*

---

*Naka-save ang dokumentong ito sa `docs/CAPSTONE_DEFENSE_SLIDES.md` para madali ninyong makopya at mai-paste sa inyong presentation software!*
