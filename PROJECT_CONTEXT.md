# G-TRAMS Project Context

### 1. Pangalan at Layunin
- **G-TRAMS** (*Gasan Tricycle Records and Application Management System*): Web application para sa digital na pamamahala ng Motorized Tricycle Operator's Permit (MTOP) at prangkisa sa Munisipalidad ng Gasan, Marinduque.
- Nagbibigay ng sentralisadong portal para sa mga Tricycle Operators (application, renewal, e-copy, voluntary cancellation), TODA Presidents (member roster governance), Municipal Cashier/Treasury (OR settlement), OVM / LLSA I Licensing Staff (review, signing, pickup, masterlist, violations), System Admin (IT settings, users, audit logs, DRP backups), at public QR verification (`/verify/:id`).
- **Official Production URLs**:
  - **Frontend Application (Vercel)**: `https://g-trams-official.vercel.app`
  - **Backend API Server (Render)**: `https://g-trams-web2.onrender.com` (Direktang koneksyon; walang proxy overhead)

### 2. Tech Stack at Bersyon
- **Runtime & Language**: Node.js, JavaScript (ES Modules sa frontend, CommonJS sa backend).
- **Frontend**: React 19.2.4, Vite 8.0.4, TailwindCSS 3.4.14, Lucide React 1.21.0, Framer Motion 13.3.0, React Router DOM 7.18.0, Recharts 3.8.1, Vite PWA 1.3.0, HTML2Canvas 1.4.1, Leaflet 1.9.4.
- **Backend**: Express 5.2.1, Mongoose 9.4.1, MongoDB Atlas, Socket.io 4.8.3, Multer 2.5 + Cloudinary 1.41.3, Node-cron 4.6.0, Zod 4.6.4, JWT (`HS256`), Bcryptjs (`12` salt rounds sa production / `10` sa test).
- **AI & Document OCR Architecture (3-Tier Engine)**:
  1. *Tier 1 (Cloud Vision)*: Google Gen AI SDK (`@google/genai` 2.24.0, Gemini model cascade defaulting to `gemini-3.5-flash-lite` -> `gemini-4-hydrogen` -> `gemini-3.8-flash` -> `gemini-3.1-flash-lite` -> `gemini-2.5-flash` -> `gemini-2.5-flash-lite` -> `gemini-2.0-flash`).
  2. *Tier 2 (Local Node OCR Engine)*: Built-in `tesseract.js` 7.0 (Zero API key, 100% offline fallback sa Render) na may structured regex parsers para sa Philippine LTO OR/CR, Driver's License, at Barangay Clearance / Cedula.
  3. *Tier 3 (Cloud Fallback)*: `OCR.space` Engine 2 backup parser kapag kinakailangan ng karagdagang text processing.
- **Testing**: Jest 30.5.1, Supertest 7.2.2, MongoDB Memory Server 11.2.0 (`25 Jest suites / 293 passing tests`), Python `pytest` Deliverable #7 verification suites.

### 3. Folder Structure
- `backend/src/models/`: Mongoose data schemas (`franchiseModel.js`, `userModel.js`, `paymentLedgerModel.js`, `mtopCounterModel.js`, `violationModel.js`, `todaModel.js`, `todaSubmission.js`, `todaRemovalRequest.js`, `auditLogModel.js`, `systemSettingsModel.js`, `ticketModel.js`, `smsLogModel.js`, `notificationModel.js`, `chatModel.js`, `pushSubscriptionModel.js`).
- `backend/src/controllers/`: Business logic handlers (`franchiseController.js`, `authController.js`, `violationController.js`, `todaController.js`, `backupController.js`, `systemSettingsController.js`, `auditLogController.js`, `ticketController.js`).
- `backend/src/services/`: Core engines (`franchiseService.js`, `documentVerificationService.js`, `backupService.js`, `cronService.js`, `notificationService.js`, `pushService.js`).
- `backend/src/middleware/`: Auth tokens & RBAC (`authMiddleware.js`), NoSQL operator sanitizer (`sanitize.js`), rate limiters, upload pipeline, 45s API timeout handler (`timeoutMiddleware.js`).
- `backend/scripts/`: Seed at test utility scripts (`seed_tester_accounts.js`, `seed_test_franchises.js`, etc.).
- `docs/`: Mga capstone defense guides, demo scripts, at Deliverable #7 user manual assets.
- `frontend/src/pages/`: Role-based route pages (`operator/`, `admin/`, `cashier/`, `toda/`, `shared/`).
- `frontend/src/components/`: Modular UI (`admin/`, `operator/`, `common/`, `skeleton/`, `ui/`, layout).
- `frontend/src/utils/`: Constants (`constants.js` — 25 Barangays, 3 Zones, 17 TODA directory), date/notification/template helpers, Google Auth utils.
- `frontend/src/context/`: React context providers (Auth, Language, Theme, TextSize, Notifications, Socket).

### 4. Paano I-run at I-test
- **Backend Server**: `cd backend && npm run dev` (tumatakbo sa `http://localhost:3000`, naka-set sa `backend/.env` at `frontend/.env.local`).
- **Frontend App**: `cd frontend && npm run dev` (tumatakbo sa `http://localhost:5173`).
- **Frontend Production Build**: `npm run build --prefix frontend`.
- **Backend Tests**: `npm test --prefix backend` (`25 suites / 293 tests`).
- **Offline / Local Demo Runners**: `start_local_demo.bat` o `start-defense-demo.bat`.

### 5. Design & Theme Rules
- **LGU Color Palette ("The Civic Ledger" / Warm Heritage)**: Maroon `#9E2A2B`, Gold `#D4AF37`, Dark `#1F1D1B`, Neutral Light `#F6F5F3`, Border `#E4E1DC`.
- **UI Aesthetic**: Pormal at opisyal na LGU government portal. Bawal ang generic AI cards, template gradients, o generic shadows.
- **Design System**: WCAG AA compliant contrast ratios, light/dark mode support, text resizing controls.
- **Responsive Layout Protection**: Bawal magkaroon ng horizontal overflow (`max-w-full overflow-x-hidden`) sa mga mobile cards, modals, at review forms lalo na kapag nag-type ang user ng mahahabang tuloy-tuloy na string (TIN, chassis, engine numbers, OR#) gamit ang `break-all` at `min-w-0`.

### 6. Coding Conventions
- **Naming**: camelCase para sa functions/variables, PascalCase para sa React components, uppercase SNAKE_CASE para sa constants.
- **Status Tokens**: Semantic states sa `StatusBadge.jsx` (Active green, In-Progress amber, Danger red, Neutral gray).
- **Lenient Normalization**: Gumagamit ng `normalizeString()` (`replace(/[^A-Z0-9]/g, '')`) kapag nagco-compare ng plate, motor, chassis, at names.

### 7. Mahahalagang Business Rules (OVM / LLSA I `main` Branch)
- **Office Identity (`main`):** Ang licensing office sa `main` ay **Office of the Municipal Vice Mayor (OVM) — Local Legislative Staff Assistant I (LLSA I)** (`/llsa-dashboard`). Panatilihing `'bplo_staff'` ang internal DB role enum para sa API/MongoDB compatibility, ngunit **OVM / LLSA I** lang ang gamiting opisyal na pangalan sa UI at docs. (Ang hiwalay na BPLO division ay nasa backup branch `feature/uat-bplo-ovm-split` lamang.)
- **LGU Pipeline Order**: `Pending` (OVM/LLSA I Review) → `For Payment` (Cashier/Treasury) → `For Signing` (OVM / SB Endorsement) → `Ready for Pickup` (LLSA I Release) → `Active`. Bayad muna bago pirma.
- **5-Step Application Wizard (`ApplyFranchise.jsx`)**: Step 1 Operator & TODA -> Step 2 Vehicle Specs & OR/CR -> Step 3 Driver's License & Barangay Clearance *(walang TODA Endorsement upload; inalis sa UAT Round 2)* -> Step 4 Review & Cedula -> Step 5 Inline printable 1:1 `OfficialApplicationForm` & Submit.
- **TODA-Barangay Filtering**: Ang mga TODA ay naka-filter base sa barangay at zona ng aplikante (25 Barangays, 3 Zones: `Central`, `North`, `South`, 17 Opisyal na TODA sa Gasan).
- **CR Owner Verification**: Sinusuri kung ang registered owner sa LTO CR ay tumutugma sa aplikanteng operator.
- **OCR Exclusion Rules (RA 10173)**: Mahigpit na bawal kunin ang payment amounts at signatories sa documents; bawal kunin ang blood type sa driver's license alinsunod sa Data Privacy Act.
- **Unit Allocation**: Limitado sa `maxUnitsPerOperator` (`2` units max alinsunod sa Municipal Ordinance).
- **Over-the-Counter Municipal Treasury Receipt**: Direktang Physical LGU Official Receipt (OR#) ang ini-encode sa Municipal Cashier portal at may E-Resibo; hindi nag-iisyu ng paper payment voucher.
- **Audit Logging**: Lahat ng sensitibong aksyon (status updates, payments, cancellations, system settings) ay naitatala sa `AuditLog` collection at tinitingnan sa `/admin/audit-logs`.

### 8. Official UAT Test Accounts (`seed_tester_accounts.js`)
Lahat ng test accounts ay aktibo at naka-seed sa database na may default password: **`Password123!`**:
1. **IT / System Admin** (`system_admin`): `admin.tester@gtrams.com` / `09111111111`
2. **OVM / LLSA I Licensing Officer** (`bplo_staff`): `llsa.tester@gtrams.com` / `09666666666`
3. **Municipal Cashier** (`cashier`): `cashier.tester@gtrams.com` / `09444444444`
4. **TODA President** (`toda_president`): `todapres.tester@gtrams.com` / `09333333333`
5. **Tricycle Operator 1** (`operator`): `operator.tester@gtrams.com` / `09222222222`
6. **Tricycle Operator 2** (`operator`): `ian.operator@gtrams.com` / `09555555555`

### 9. Mga Bawal Gawin
- HUWAG maglagay ng API keys, database credentials, o secrets sa code o git commits.
- HUWAG baguhin ang Mongoose schemas o database fields nang walang pahintulot.
- HUWAG gumamit ng `'BPLO'` bilang office label, UI title, o tester email sa `main` (gamitin ang **OVM / LLSA I**; panatilihin lang ang internal DB role enum `'bplo_staff'`).
- HUWAG maglagay ng generic AI styling o lumihis sa opisyal na Civic Ledger palette ng Munisipyo ng Gasan.
- HUWAG baguhin ang pipeline order (hindi pwedeng mauna ang pirma bago ang bayad).
- HUWAG ibalik ang lumang paper payment voucher flow (Cashier OR settlement ang opisyal na daloy).
