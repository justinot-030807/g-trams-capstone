# G-TRAMS Project Context

### 1. Pangalan at Layunin
- **G-TRAMS** (Gasan Tricycle Regulatory and Management System): Web application para sa digital na pamamahala ng Motorized Tricycle Operator's Permit (MTOP) at prangkisa sa Munisipalidad ng Gasan, Marinduque.
- Nagbibigay ng sentralisadong portal para sa mga operator (application, renewal, e-copy), TODA presidents (endorsement), Cashier/Treasury (bayad), at Admin/LGU (review, signing, pickup, masterlist, compliance).
- **Official Production URLs**:
  - **Frontend Application (Vercel)**: `https://g-trams-official.vercel.app`
  - **Backend API Server (Render)**: `https://g-trams-web2.onrender.com` (Direktang koneksyon; tinanggal ang proxy upang mas mabilis at walang timeout overhead)

### 2. Tech Stack at Bersyon
- **Runtime & Language**: Node.js, JavaScript (ES Modules sa frontend, CommonJS sa backend).
- **Frontend**: React 19.2.4, Vite 8.0.4, TailwindCSS 3.4.14, Lucide React 1.21.0, Framer Motion 13.3.0, React Router DOM 7.18.0, Recharts 3.8.1, Vite PWA 1.3.0, HTML2Canvas 1.4.1, Leaflet 1.9.4.
- **Backend**: Express 5.2.1, Mongoose 9.4.1, MongoDB Atlas, Socket.io 4.8.3, Multer 2.2.0, Cloudinary 1.41.3, Node-cron 4.6.0, Zod 4.6.4, JWT, Bcryptjs.
- **AI & Document OCR Architecture (3-Tier Engine)**:
  1. *Tier 1 (Cloud Vision)*: Google Gen AI SDK (`@google/genai` 2.24.0, Gemini Vision models cascade: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`, atbp.).
  2. *Tier 2 (Local Node OCR Engine)*: Built-in `tesseract.js` (Zero API key, zero quota limits, 100% offline fallback sa Render) na may structured regex parsers para sa Philippine LTO CR/OR, Driver's License, Barangay Clearance, Cedula, at TODA Endorsements.
  3. *Tier 3 (Cloud Fallback)*: `OCR.space` Engine 2 backup parser kapag kinakailangan ng karagdagang text processing.
- **Testing**: Jest 30.5.1, Supertest 7.2.2, MongoDB Memory Server 11.2.0, Python pytest regression suites.

### 3. Folder Structure
- `backend/src/models/`: Mongoose data schemas (`franchiseModel.js`, `userModel.js`, `auditLogModel.js`, `backupArchiveModel.js`, `ticketModel.js`, etc.).
- `backend/src/controllers/`: Business logic handlers (`franchiseController.js`, `authController.js`, `adminController.js`, `backupController.js`, etc.).
- `backend/src/services/`: Core engines (`franchiseService.js`, `documentVerificationService.js`, `cronService.js`, `pushService.js`).
- `backend/src/middleware/`: Auth tokens, role protection (RBAC), file upload pipeline, 45s API timeout handler.
- `backend/scripts/`: Seed at test utility scripts (`seed_tester_accounts.js`, `seed_test_franchises.js`, etc.).
- `docs/`: Mga test plans, deliverables, user manuals, at technical deployment guides.
- `frontend/src/pages/`: Role-based route pages (`operator/`, `admin/`, `cashier/`, `toda/`).
- `frontend/src/components/`: Modular UI (`admin/`, `operator/`, `common/`, `skeleton/`, layout).
- `frontend/src/utils/`: Constants (`constants.js` may 17 TODA directory at zones), notification helpers, Google Auth utils.
- `frontend/src/context/`: React context providers (Auth, Language, Theme, TextSize, Notifications, Socket).

### 4. Paano I-run at I-test
- **Backend Server**: `cd backend && npm run dev` (tumatakbo sa `http://localhost:5000`).
- **Frontend App**: `cd frontend && npm run dev` (tumatakbo sa `http://localhost:5173`).
- **Frontend Production Build**: `npm run build --prefix frontend`.
- **Backend Tests**: `npm test --prefix backend`.
- **Offline / Local Demo Runners**: `start_local_demo.bat` o `start-defense-demo.bat`.

### 5. Design & Theme Rules
- **LGU Color Palette**: Maroon `#9E2A2B`, Gold `#D4AF37`, Dark `#1F1D1B`, Neutral Light `#F6F5F3`, Border `#E4E1DC`.
- **UI Aesthetic**: Pormal at opisyal na LGU government portal. Bawal ang generic AI cards, template gradients, o generic shadows.
- **Design System**: WCAG AA compliant contrast ratios, light/dark mode support, text resizing controls.
- **Responsive Layout Protection**: Bawal magkaroon ng horizontal overflow (`max-w-full overflow-x-hidden`) sa mga mobile cards, modals, at review forms lalo na kapag nag-type ang user ng mahahabang tuloy-tuloy na string (TIN, chassis, engine numbers) gamit ang `break-all` at `min-w-0`.

### 6. Coding Conventions
- **Naming**: camelCase para sa functions/variables, PascalCase para sa React components, uppercase SNAKE_CASE para sa constants.
- **Status Tokens**: Semantic states sa `StatusBadge.jsx` (Active: Green, In-Progress: Amber, Danger: Red, Neutral: Gray).
- **Lenient Normalization**: Gumagamit ng `normalizeString()` (`replace(/[^A-Z0-9]/g, '')`) kapag nagco-compare ng plate, motor, chassis, at names.

### 7. Mahahalagang Business Rules
- **LGU Pipeline Order**: `Pending` (Review) → `For Payment` (Cashier/Treasury) → `For Signing` (Mayor/SB) → `Ready for Pickup` (BPLO) → `Active`. Bayad muna bago pirma.
- **TODA-Barangay Filtering**: Ang mga TODA ay naka-filter base sa barangay at zona ng aplikante (17 Opisyal na TODA sa Gasan).
- **CR Owner Verification**: Sinusuri kung ang registered owner sa LTO CR ay tumutugma sa aplikanteng operator.
- **OCR Exclusion Rules**: Mahigpit na bawal kunin ang payment amounts at signatories sa documents; bawal kunin ang blood type sa driver's license alinsunod sa Data Privacy Act (RA 10173).
- **Unit Allocation**: May limitasyon base sa `max_units_per_operator` (maximum 2 units alinsunod sa Municipal Ordinance).
- **Walang Claim Stub**: Walang claim stub voucher dahil may Cashier module para sa direct over-the-counter payments at physical LGU Official Receipt; kukunin ang MTOP direkta sa BPLO.
- **Audit Logging**: Lahat ng sensitibong aksyon (status updates, payments, cancellations, system settings) ay awtomatikong naitatala sa `AuditLog` collection at tinitingnan sa `/admin/audit-logs`.

### 8. Official UAT Test Accounts
Lahat ng test accounts ay aktibo at naka-seed sa database na may default password: **`Password123!`**:
1. **IT / System Admin** (`system_admin`): `admin.tester@gtrams.com` / `09111111111`
2. **BPLO Licensing Officer** (`bplo_staff`): `bplo.tester@gtrams.com` / `09666666666`
3. **Municipal Cashier** (`cashier`): `cashier.tester@gtrams.com` / `09444444444`
4. **TODA President** (`toda_president`): `todapres.tester@gtrams.com` / `09333333333`
5. **Tricycle Operator 1** (`operator`): `operator.tester@gtrams.com` / `09222222222`
6. **Tricycle Operator 2** (`operator`): `ian.operator@gtrams.com` / `09555555555`

### 9. Mga Bawal Gawin
- HUWAG maglagay ng API keys, database credentials, o secrets sa code o git commits.
- HUWAG baguhin ang Mongoose schemas o database fields nang walang pahintulot.
- HUWAG maglagay ng generic AI styling o lumihis sa opisyal na kulay ng Munisipyo ng Gasan.
- HUWAG baguhin ang pipeline order (hindi pwedeng mauna ang pirma bago ang bayad).
- HUWAG ibalik ang claim stub voucher (may Cashier module na para sa pagbabayad at resibo).
