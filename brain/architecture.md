# Architecture

## Tech Stack
- **Frontend (`frontend/`):** React 19.2, Vite 8 (`vite-plugin-pwa`), Tailwind CSS 3.4, Radix UI (`Dialog`, `AlertDialog`, `Select`, `Switch`, `Tabs`, `Checkbox`), React Router DOM 7, Recharts 3, Leaflet 1.9, Socket.IO Client 4.8, Sonner, HTML2Canvas, QRCode.react.
- **Backend (`backend/`):** Node.js (CommonJS), Express 5.2, Mongoose 9.4 (MongoDB Atlas), Socket.IO 4.8, JWT (`HS256`), Bcryptjs, Zod 4.6, Multer 2.5 + Cloudinary, Node-Cron 4.6, Web-Push 3.6, Helmet 8.3, Express-Rate-Limit 8.7, Compression, Swagger UI.
- **3-Tier Document OCR:** Tier 1 Google Gen AI (`@google/genai` 2.24, Gemini model cascade defaulting to `gemini-3.5-flash-lite` / `gemini-4-hydrogen`), Tier 2 local `tesseract.js` 7.0 regex parsers (offline Render fallback), Tier 3 `OCR.space` Engine 2.
- **Messaging:** Brevo HTTP Email API (`backend/src/utils/sendEmail.js`), TextBee Android SMS Gateway with Semaphore fallback (`backend/src/utils/sendSms.js`), VAPID Web Push (`backend/src/config/webPush.js`).
- **Testing:** Jest 30 + Supertest 7 + `mongodb-memory-server` 11 (`backend/__tests__/`), Node stress suite (`backend/tests/stress/`), Python `pytest` deliverable tests (`tests/`).

## Database & Storage Schema
- **MongoDB Core Models (`backend/src/models/`):**
  - `MtopCounter` (`mtopCounterModel.js`) stores the persistent MTOP sequence for each Manila year. A private `Franchise.paymentSettlement` reservation links interrupted payments to their ledger entry.
  - `User` (`userModel.js`) — Auth, RBAC `role`, `todaAssociation`, `bodyNumber`, OTP/lockout/`tokenVersion`, Google OAuth, recovery contacts.
  - `Franchise` (`franchiseModel.js`) — Operator ref, vehicle/document metadata & URLs, 12-state lifecycle status, `Asia/Manila` expiry virtuals/hooks, `cancellationDetails`, progressive sanction counters, payment + `paymentHistory`, `aiVerification`, partial unique indexes (`plateNo`, `motorNo`, `chassisNo`, `officialReceiptNo`, `mtopNo`).
  - `PaymentLedger` (`paymentLedgerModel.js`) — Immutable treasury payment ledger (`officialReceiptNo` unique), survives franchise renewals/archiving.
  - `TodaRoster` (`todaModel.js`), `todaSubmission` (`todaSubmission.js`), `TodaRemovalRequest` (`todaRemovalRequest.js`) — Accredited roster with a unique normalized claim key for new writes, OCR roster intake, and exact member delisting.
  - `Violation` (`violationModel.js`) — Progressive 3-tier sanctions linked to franchise/operator.
  - `SystemSettings` (`systemSettingsModel.js`) — Ordinance rules (fees, 3yr/1yr validity, 2-unit cap, `maintenanceMode`, announcements, `violationPolicy`).
  - `AuditLog` (`auditLogModel.js`), `SmsLog` (`smsLogModel.js`), `Ticket` (`ticketModel.js`), `ChatThread` & `ChatMessage` (`chatModel.js`), `Notification` (`notificationModel.js`), `PushSubscription` (`pushSubscriptionModel.js`).
- **Internal DRP Models (`backend/src/services/backupService.js`):** `BackupArchive` (`backup_archives`, stores gzip/AES-256-GCM snapshots across 16 mapped collections including `mtop_counters`) and `SystemLock` (`system_locks`, TTL distributed restore lock).
- **Blob Storage:** Cloudinary folder `GTRAMS_Documents` (`backend/src/config/cloudinary.js`).

## Core Modules & Key File Paths
- **Backend Entry & Security:** `backend/server.js` (Helmet CSP, strict CORS, 45s timeout, `mongoSanitize`, content-encoding check, restore write-guard, `/api/v1/*` mounts, `/api/v1/health`).
- **Auth & RBAC:** `backend/src/routes/authRoutes.js`, `backend/src/controllers/authController.js`, `backend/src/middleware/authMiddleware.js` (`protect`, `authorize`), `backend/src/schemas/authSchema.js`.
- **Franchise, Cashier & TODA:** `backend/src/routes/franchiseRoutes.js`, `backend/src/controllers/franchiseController.js`, `backend/src/services/franchiseService.js`, `backend/src/routes/todaRoutes.js`, `backend/src/controllers/todaController.js`, `backend/src/utils/rosterValidator.js`, `backend/src/utils/todaDirectory.js`.
- **OCR, Time, Cron & DRP:** `backend/src/services/documentVerificationService.js`, `backend/src/utils/phTime.js`, `backend/src/services/cronService.js`, `backend/src/jobs/cleanupJobs.js`, `backend/src/routes/backupRoutes.js`, `backend/src/services/backupService.js`.
- **Real-Time & Support:** `backend/src/config/socket.js`, `backend/src/routes/chatRoutes.js`, `backend/src/routes/notificationRoutes.js`, `backend/src/routes/pushRoutes.js`, `backend/src/routes/violationRoutes.js`, `backend/src/routes/ticketRoutes.js`, `backend/src/routes/auditLogRoutes.js`, `backend/src/routes/systemSettingsRoutes.js`.
- **Frontend Entry & Routing:** `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/components/Sidebar.jsx`, `frontend/src/components/MainLayout.jsx`, `frontend/src/utils/constants.js`.
- **Role Portals (`frontend/src/pages/`):**
  - Operator/TODA: `operator/OperatorDashboard.jsx`, `operator/ApplyFranchise.jsx`, `operator/RenewFranchise.jsx`, `toda/SubmitMembers.jsx`.
  - Cashier: `cashier/CashierDashboard.jsx`, `cashier/CashierSettings.jsx`.
  - OVM / LLSA I Staff (internal role `'bplo_staff'`): `admin/LlsaDashboard.jsx`, `admin/FranchiseApproval.jsx`, `admin/FranchiseReviewPage.jsx`, `admin/FranchiseMasterlist.jsx`, `admin/ManageRevocations.jsx`, `admin/ValidateTODA.jsx`, `admin/AdminReports.jsx`.
  - System Admin: `admin/AdminDashboard.jsx`, `admin/UserManagement.jsx`, `admin/AdminSettings.jsx`, `admin/AdminAuditLogs.jsx`, `admin/AdminTickets.jsx`.
  - Public: `Home.jsx`, `Login.jsx`, `Register.jsx`, `shared/VerifyOperator.jsx`.
