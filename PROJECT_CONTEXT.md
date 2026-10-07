# G-TRAMS Project Context

### 1. Pangalan at Layunin
- **G-TRAMS** (Gasan Tricycle Regulatory and Management System): Web application para sa digital na pamamahala ng Motorized Tricycle Operator's Permit (MTOP) at prangkisa sa Munisipalidad ng Gasan, Marinduque.
- Nagbibigay ng sentralisadong portal para sa mga operator (application, renewal, e-copy), TODA presidents (endorsement), Cashier/Treasury (bayad), at Admin/LGU (review, signing, pickup, masterlist, compliance).

### 2. Tech Stack at Bersyon
- **Runtime & Language**: Node.js, JavaScript (ES Modules sa frontend, CommonJS sa backend).
- **Frontend**: React 19.2.4, Vite 8.0.4, TailwindCSS 3.4.14, Lucide React 1.21.0, Framer Motion 13.3.0, React Router DOM 7.18.0, Recharts 3.8.1, Vite PWA 1.3.0, HTML2Canvas 1.4.1, Leaflet 1.9.4.
- **Backend**: Express 5.2.1, Mongoose 9.4.1, MongoDB, Socket.io 4.8.3, Multer 2.2.0, Cloudinary 1.41.3, Node-cron 4.6.0, Zod 4.6.4, JWT, Bcryptjs.
- **AI OCR**: Google Gen AI SDK (`@google/genai` 2.24.0, Gemini Vision models).
- **Testing**: Jest 30.5.1, Supertest 7.2.2, MongoDB Memory Server 11.2.0.

### 3. Folder Structure
- `backend/src/models/`: Mongoose data schemas (`franchiseModel.js`, `userModel.js`, `auditLogModel.js`, `ticketModel.js`, etc.).
- `backend/src/controllers/`: Business logic handlers (`franchiseController.js`, `authController.js`, `adminController.js`, etc.).
- `backend/src/services/`: Core engines (`franchiseService.js`, `documentVerificationService.js`).
- `backend/src/routes/`: Express API route definitions (`franchiseRoutes.js`, `authRoutes.js`, etc.).
- `backend/src/middleware/`: Auth tokens, role protection (RBAC), file upload pipeline.
- `frontend/src/pages/`: Role-based route pages (`operator/`, `admin/`, `cashier/`, `toda/`).
- `frontend/src/components/`: Modular UI (`admin/`, `operator/`, `common/`, `skeleton/`, layout).
- `frontend/src/utils/`: Constants (`constants.js` may 17 TODA directory at zones), notification helpers.
- `frontend/src/context/`: React context providers (Auth, Language, Theme, TextSize, Notifications).

### 4. Paano I-run at I-test
- **Backend Server**: `cd backend && npm run dev` (tumatakbo sa `http://localhost:5000`).
- **Frontend App**: `cd frontend && npm run dev` (tumatakbo sa `http://localhost:5173`).
- **Frontend Production Build**: `cmd /c "npm run build --prefix frontend"` o `npm run build`.
- **Backend Tests**: `cd backend && npm test`.

### 5. Design & Theme Rules
- **LGU Color Palette**: Maroon `#9E2A2B`, Gold `#D4AF37`, Dark `#1F1D1B`, Neutral Light `#F6F5F3`, Border `#E4E1DC`.
- **UI Aesthetic**: Pormal at opisyal na LGU government portal. Bawal ang generic AI cards, template gradients, o generic shadows.
- **Design System**: WCAG AA compliant contrast ratios, light/dark mode support, text resizing controls.

### 6. Coding Conventions
- **Naming**: camelCase para sa functions/variables, PascalCase para sa React components, uppercase SNAKE_CASE para sa constants.
- **Status Tokens**: 4 semantic states sa `StatusBadge.jsx` (Active: Green, In-Progress: Amber, Danger: Red, Neutral: Gray).
- **Lenient Normalization**: Gumagamit ng `normalizeString()` (`replace(/[^A-Z0-9]/g, '')`) kapag nagco-compare ng plate, motor, chassis, at names.

### 7. Mahahalagang Business Rules
- **LGU Pipeline Order**: `Pending` (Review) → `For Payment` (Cashier/Treasury) → `For Signing` (Mayor/SB) → `Ready for Pickup` (BPLO) → `Active`. Bayad muna bago pirma.
- **TODA-Barangay Filtering**: Ang mga TODA ay naka-filter base sa barangay at zona ng aplikante.
- **CR Owner Verification**: Sinusuri kung ang registered owner sa LTO CR ay tumutugma sa aplikanteng operator.
- **OCR Exclusion Rules**: Mahigpit na bawal kunin ang payment amounts at signatories sa documents; bawal kunin ang blood type sa driver's license.
- **Unit Allocation**: May limitasyon base sa `max_units_per_operator` (default 2 units).
- **Walang Claim Stub**: Walang claim stub voucher dahil may Cashier module para sa direct over-the-counter payments at physical LGU Official Receipt; kukunin ang MTOP direkta sa BPLO.

### 8. Mga Alam na Bug at Susunod na Gagawin
- Pagsasaayos ng real-time Web Push notification payload delivery sa ilang mobile browsers (PWA).
- Physical QR verification camera scanner optimization sa mobile view.

### 9. Mga Bawal Gawin
- HUWAG maglagay ng API keys, database credentials, o secrets sa code o git commits.
- HUWAG baguhin ang Mongoose schemas o database fields nang walang pahintulot.
- HUWAG maglagay ng generic AI styling o lumihis sa opisyal na kulay ng Munisipyo ng Gasan.
- HUWAG baguhin ang pipeline order (hindi pwedeng mauna ang pirma bago ang bayad).
- HUWAG ibalik ang claim stub voucher (may Cashier module na para sa pagbabayad at resibo).
