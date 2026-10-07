# G-TRAMS Progress Tracker

## 1. Tapos na (Completed)
- **Item 1: TODA Filtering by Barangay**:
  - Naidagdag ang 17 TODA directory na may sakop na barangay at zona sa `constants.js`.
  - Naka-filter na ang TODA selection sa registration, onboarding, at franchise application.
- **Item 2: Bilang ng Traysikel na Ipapasok**:
  - Naidagdag ang unit selector sa Step 1 ng application form (1, 2, o 3 units na nakabase sa LGU limit).
- **Item 3: Back-to-Back License Upload & Detalyadong Impormasyon**:
  - Hinihingi na ang harap at likod ng lisensya.
  - Naitatala ang Date of Birth (`driverDob`) para sa birthday renewal monitoring at DL driving codes (`driverDlCodes`, hal. Code A/A1).
  - Naibukod at hindi kinukuha ang blood type ayon sa direktiba ni Ma'am.
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
- **Dokumentasyon**:
  - Nilikha ang `PROJECT_CONTEXT.md` sa root para sa mga external AI tools.
- **Database at Folder Reorganization**:
  - Na-drop ang dead legacy prototype collections (`calendars` at `reports`) na may safe backup sa `backend/backups/`.
  - In-archive ang 3 orphaned franchises at tinanggal ang 1 orphaned notification.
  - Na-normalize ang user roles sa `toda_president` at inalis ang duplicate enum types.
  - Inilipat ang seed scripts sa `backend/scripts/`, TODA page sa `frontend/src/pages/toda/`, audio scripts sa `remotion/scripts/`, at documents/reports sa `docs/`.
  - **Pagtanggal ng Obsolete Fields sa Database at Code**:
    - Tinanggal ang `eSigned`, `releaseDate`, at `deficiencies` sa `franchises` (Mongoose model, controllers, services, seed scripts).
    - Tinanggal ang redundant `docChecklist` sa `systemsettings` (Mongoose model, controller, admin settings UI).
    - Matagumpay na naipatupad ang live `$unset` migration sa lahat ng 25 documents sa MongoDB Atlas (0 legacy fields remaining).

## 2. Ginagawa ngayon (In Progress)
- Pag-commit at pag-push ng mga pagbabago sa remote git repository (`main` branch).

## 3. Susunod (Next Steps)
- End-to-end user acceptance testing sa production environment kasama ang capstone adviser ("Ma'am").
- Live test ng mobile PWA camera scanner para sa physical MTOP QR verification.
- Pagsasaayos ng deployment server environment variables para sa produksyon.
