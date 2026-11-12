# G-TRAMS Progress Tracker

## 1. Tapos na (Completed)
- **Item 1: TODA Filtering by Barangay**:
  - Naidagdag ang 17 TODA directory na may sakop na barangay at zona sa `constants.js`.
  - Naka-filter na ang TODA selection sa registration, onboarding, at franchise application.
- **Item 2: Bilang ng Traysikel na Ipapasok**:
  - Naidagdag ang unit selector sa Step 1 ng application form (1 o 2 units na nakabase sa Municipal limit).
- **Item 3: Back-to-Back License Upload & Detalyadong Impormasyon**:
  - Hinihingi na ang harap at likod ng lisensya.
  - Naitatala ang Date of Birth (`driverDob`) para sa birthday renewal monitoring at DL driving codes (`driverDlCodes`, hal. Code A/A1).
  - Naibukod at hindi kinukuha ang blood type ayon sa direktiba ng LGU at RA 10173.
- **Item 4: Hiwalay na OR at CR + Owner Verification**:
  - Magkahiwalay na ang upload dropzones para sa LTO Official Receipt (`orFile`) at Certificate of Registration (`crFile`).
  - May sariling fields para sa CR No, CR Date, OR No, OR Date, Color, Series, Year Model, File No, Vehicle Type, at Classification.
  - Sinusuri kung ang registered owner sa CR ay tumutugma sa aplikanteng operator.
  - Mahigpit na hindi kinukuha ang payment amount sa dokumento at mga pirma ng signatories.
- **Item 5: Hiwalay na Barangay at TODA Clearance + Masterlist Check**:
  - Magkahiwalay ang form at uploads para sa Barangay Clearance at TODA Certificate.
  - May cross-check sa pangalan ng aplikante laban sa TODA masterlist roster.
- **Item 6: Tamang LGU Order (Bayad Muna Bago Pirma)**:
  - Naayos ang lifecycle: `Pending` → `For Payment` (Cashier) → `For Signing` (Mayor/SB) → `Ready for Pickup` (BPLO) → `Active`.
- **Item 7: Pre-Payment Violations / Record Check (Kayla Step)**:
  - Ginawa ang `GET /api/v1/franchises/:id/record-check` API.
  - May Record Check card sa admin review bago i-endorse sa cashier upang suriin ang revocations, violations, at unit limits.
- **Item 8: Cashier Workflow & Physical LGU OR**:
  - Blank at editable ang Official Receipt number sa Cashier dashboard para sa physical receipt ng Munisipyo.
  - Naidagdag ang `payerName` field para sa representative payments.
  - Tinanggal ang "Reject" button kapag bayad na.
- **Item 9: Admin Approval Tabs & Operator E-Copy na may Watermark**:
  - Hinati ang admin approval queue sa `Needs Review`, `For Payment`, `For Signing`, `Ready for Pickup`, `Approved`, at `Rejected`.
  - 6-step progress tracker sa Operator Dashboard.
  - May "View E-Copy (Approved MTOP)" sa Operator Dashboard na may diagonal **"APPROVED - ELECTRONIC COPY"** watermark stamp.
- **Pagtanggal sa Lumang Claim Stub**:
  - Lubos nang tinanggal ang Claim Stub Voucher sa frontend at backend pabor sa Cashier / Treasury workflow.
  - Direktang over-the-counter ang bayad sa Municipal Cashier gamit ang Plate No, at may physical LGU OR logging.
- **IT Admin Sidebar Audit Logs & Persistent MongoDB Database Backups (`b81dd0f`)**:
  - Inilipat ang Audit Trail mula sa siksikang tab sa `/admin/settings` papunta sa sariling dedicated menu sa IT Admin sidebar: `/admin/audit-logs`.
  - May advanced search, role filtering, pagination, action category filters, at 1-click CSV export.
  - Ginawan ng `BackupArchive` Mongoose model para i-persist ang database backups nang direkta sa MongoDB Atlas, kaya hindi na nawawala ang mga backup files kahit mag-restart o mag-sleep ang libreng cloud container ng Render.
  - Nilagyan ng global 429 (Too Many Requests) safety failover at caching sa `/admin/settings`.
- **Direct Backend Architecture & Cloudflare Worker Removal (`c541b2e`)**:
  - Tinanggal ang dating Cloudflare Worker proxy (`workers.dev`) na nagdudulot minsan ng intermediate connection drops o 524 gateway timeouts.
  - Naka-point na nang direkta ang `VITE_API_URL` sa frontend (`.env`, `vite.config.js`, `googleAuthUtils.js`, `SocketContext.jsx`) papunta sa production Render backend (`https://g-trams-web2.onrender.com`).
- **Comprehensive Pre-UAT Audit & P0-P2 Crash Prevention (`4c99977`)**:
  - Naayos ang nawawalang icons (`AlertTriangle`, `Megaphone`) sa `BploDashboard.jsx`.
  - Pinalawak ang RBAC permissions para sa `system_admin` at `bplo_staff` sa `ChatContext.jsx` at controllers.
  - Nilagyan ng voluntary cancellation option ang `Active - Under Warning` status sa Operator portal.
  - `@media print` isolation para sa Cashier E-Resibo voucher upang malinis ang pag-print nang hindi nasasama ang navbar at sidebar.
  - Naglagay ng 10-minute automated background keepalive ping sa backend upang maiwasan ang cold-start delays sa Render tuwing UAT.
- **Mobile Screen Width Overflow & Long String Word-Wrap Fix (`17cc0c0`)**:
  - Natukoy at naayos ang dahilan kung bakit nagkaroon ng malaking itim na puwang sa kanan ng phone screen sa Step 5 Review: nung nag-type ang user ng 101 characters na walang patid sa TIN at 25 characters sa chassis/motor, pinalapad nito ang card sa 950px sa isang 360px na screen.
  - Nilinis ang `#14110F` inline dark background sa `index.html` at `MainLayout.jsx`.
  - Nilagyan ng `break-all` at `min-w-0` ang lahat ng Review grid cells sa `ApplyFranchise.jsx` kasama ang global `overflow-x-hidden` sa `index.css`.
- **3-Tier Resilient Document OCR Engine (`17cc0c0`)**:
  - Nag-integrate ng local `tesseract.js` engine sa backend na may custom regex parsing para sa Philippine LTO CR, LTO OR, Driver's License, Barangay Clearance, Cedula, at TODA Roster.
  - Gumagana 100% kahit walang active `GEMINI_API_KEY` o kapag naubos ang quota sa Render.
  - 100% auto-fill accuracy sa lahat ng `sample_docs/TAMA/*` at 100% rejection sa `sample_docs/MALI/*` at foreign IDs (e.g. Argentine license).

## 2. Ginagawa ngayon (In Progress)
- Pagsasagawa ng User Acceptance Testing (UAT) kasama ang mga test accounts para sa bawat user role (IT Admin, BPLO, Cashier, TODA President, Operator).

## 3. Susunod (Next Steps)
- Actual Oral Defense presentation kasama ang Panel of Evaluators.
- Pormal na turnover ng system at User's Manual sa LGU Gasan BPLO at Municipal Treasury.
