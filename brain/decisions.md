# Technical & UI Decisions (Non-Negotiable)

## LGU Business & Governance Rules
- **OVM / LLSA I Only on `main` (No BPLO Split):** On `main`, the municipal licensing office is **Office of the Municipal Vice Mayor (OVM) — LLSA I** (`llsa.tester@gtrams.com`, `/llsa-dashboard`). Keep internal MongoDB/RBAC role enum `'bplo_staff'` unchanged for database/API backwards compatibility, **never** display BPLO office labels on `main`. Separate BPLO Mayor's Permitting Division lives exclusively on backup branch `feature/uat-bplo-ovm-split`.
- **Pipeline Order (Payment Before Signing):** `Pending` -> `For Payment` (Cashier) -> `For Signing` (OVM / SB) -> `Ready for Pickup` (LLSA I) -> `Active`. Never allow signing before payment or rejecting an already-paid application.
- **Strict Role Separation:**
  - `system_admin` owns IT settings, user accounts, audit logs, tickets, and DRP backups ONLY; blocked by `authMiddleware.js` from OVM/LLSA I franchise operations.
  - Internal role `'bplo_staff'` (OVM / LLSA I) owns franchise review, queues, TODA validation, violations, and issuance.
  - `cashier` owns payment collection and physical LGU Official Receipt logging exclusively; never add cashier shortcuts to admin UI or reintroduce paper payment voucher stubs.
- **Ordinance Caps & Roster Gate:** Enforce `maxUnitsPerOperator` (2 units max per Municipal Ordinance Section 4), filter TODAs by Gasan's 25 barangays and 3 zones (`Central`, `North`, `South`), and verify `/register` applicants against `TodaRoster` (`operatorName` + `bodyNumber`) without leaking registered names on mismatch.
- **Progressive Discipline Policy:** Apply 3-tier sanctions (`Warning` -> `Active - Under Warning`; `Suspension` -> `Suspended`; `Revocation` -> `Revoked`; direct `Revocation` for grave offenses) only on eligible active/issued franchises, never on `Pending` or unpaid applications; preserve sanctions across denied surrenders and replacement units (`disciplineHelper.js`).
- **Data Privacy (RA 10173) & OCR Exclusions:** Never extract driver blood type, payment amounts, or document signatory signatures during OCR intake/verification.
- **Server-Authoritative Time (`Asia/Manila`):** All expiration checks, virtuals, and daily midnight cron transitions use `phTime.js`; never rely on browser clocks.

## Technical & Security Conventions
- **Direct Backend API:** Point `VITE_API_URL` directly to Render (`https://g-trams-web2.onrender.com`), never through `workers.dev`. Client fetch interceptor (`googleAuthUtils.js`) only retries idempotent `GET`/`HEAD`/`OPTIONS` calls. Local backend uses `PORT=3000`.
- **Upload & URL Trust:** Enforce MIME/extension match + magic-byte checks (`cloudinary.js`) and `isTrustedDocumentUrl` (`franchiseService.js`) so only fresh uploads, `/uploads/...`, or `https://res.cloudinary.com/...` URLs are accepted.
- **Atomic Concurrency & Durable Ledger:** Keep partial unique indexes on `plateNo`, `motorNo`, `chassisNo`, `mtopNo`, `officialReceiptNo`; assign `YYYY-NNN` MTOP numbers atomically and append immutable `PaymentLedger` records on payment.
- **Backup & Restore Integrity:** Keep SHA-256 checksum validation, AES-256-GCM encryption (when keyed), `SystemLock` distributed lock, and HTTP 503 mutation blocking during active restores.
- **Zero Secrets & Schema Discipline:** Never commit `.env` secrets/keys; get explicit approval before altering Mongoose schemas or `systemSettingsModel.js` ordinance defaults.

## UI & Design System ("The Civic Ledger" / Warm Heritage)
- **Color Tokens (`frontend/tailwind.config.js`, `frontend/src/index.css`, `DESIGN.md`):**
  - Light: Canvas `#F6F5F3`, Surface `#FFFFFF`, Border `#E4E1DC`, Text `#1F1D1B`, Muted `#6B6761`.
  - Dark: Canvas `#14110F`, Surface `#1C1917`, Border `#2E2A27`, Text `#F6F5F3`, Muted `#A8A29E`.
  - Brand: Gasan Maroon `#9E2A2B` (hover `#7A1B22`) strictly for primary actions & landmarks; Gasan Gold `#D4AF37` / `#F5E6B3` for dark-mode focus and trim. Avoid cool `slate-*` grays and generic AI gradients.
- **Typography & Status:** `"Manrope"` sans + `"JetBrains Mono"` (`font-mono tabular-nums` for OR numbers, plates, MTOP codes, fees, counts, timestamps); 4 semantic WCAG AA bands in `StatusBadge.jsx` (Active green, In-Progress amber, Danger red, Neutral gray).
- **Interaction & Responsive Guardrails:** Use Radix UI primitives (`Dialog`, `AlertDialog`, `ConfirmContext`) and `Sonner` toasts (never `alert()`, `confirm()`, `prompt()`). No `border-l-4` card stripes or `animate-bounce`. Keep `min-h-[44px]` touch targets, convert `<768px` tables to stacked cards, and apply `min-w-0`, `break-all`, and `overflow-x-hidden` on review grids to prevent mobile horizontal overflow.
