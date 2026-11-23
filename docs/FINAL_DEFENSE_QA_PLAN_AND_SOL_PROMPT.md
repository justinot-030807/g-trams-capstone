# G-TRAMS Final Defense QA Plan & Prompt for GPT 6.2 Sol

> **Project:** G-TRAMS — Gasan Tricycle Records and Application Management System (Municipality of Gasan, Marinduque)
> **Stage:** **Pre-Final Defense is DONE.** Current focus is **Final Defense QA** on `main` (`86bd8f7`, `25 Jest suites / 293 tests`).
> **Main Branch Office Rule:** Licensing operations on `main` belong strictly to **OVM / LLSA I** (`llsa.tester@gtrams.com`, `/llsa-dashboard`; internal DB/RBAC enum `'bplo_staff'`). Do **NOT** introduce "BPLO" office labels or `bplo.tester@gtrams.com` on `main` (separate BPLO division lives only on backup branch `feature/uat-bplo-ovm-split`).

---

## Final Defense QA & Bug-Hunting Plan (6 Phases)

### Phase 0: Baseline Automated Checks & Health Verification
- **Git & Build Integrity:** `git status -sb`, `git diff --check`, `npm run lint --prefix frontend` (0 errors), `npm run build --prefix frontend` (clean Vite 8 + PWA production bundle).
- **Automated Suites:**
  - `npm test --prefix backend` — all 25 Jest suites / 293 tests (isolated via `mongodb-memory-server`).
  - `npm run test:stress --prefix backend` — rate limits, franchise/cashier race conditions, 500-record masterlist load, socket stress, memory profiler.
  - `python tests/run_all_tests.py` — Deliverable #7 User's Manual PDF verification (optional).
- **Production & Config Health:**
  - Read-only check on `GET https://g-trams-web2.onrender.com/api/v1/health` (`status: ok`, `dbReady: true`, `indexesReady: true`, `X-Server-Time`, `X-Server-Timezone: Asia/Manila`).
  - Verify local backend `PORT=3000` (`backend/.env`) matches `frontend/.env.local` (`VITE_API_URL=http://localhost:3000`).

### Phase 1: Defense Pillars & Security/RBAC Adversarial Audit
Verify all completed Pre-Final compliance pillars and post-UAT fixes (`86bd8f7`, `96304fa`, `8bfc794`, `b725fff`):
- **5-Role Strict Isolation (UI + API `403`):**
  - `system_admin` (`admin.tester@gtrams.com`): IT settings, users, audit logs, tickets, backups ONLY (blocked from franchise review, masterlist, TODA validation, violations).
  - `bplo_staff` — **OVM / LLSA I** (`llsa.tester@gtrams.com`): Franchise review, queues, masterlist, TODA validation, violations, issuance ONLY (blocked from IT admin pages & cashier payment).
  - `cashier` (`cashier.tester@gtrams.com`): `/cashier-dashboard` & `/cashier-settings` ONLY (no cashier shortcuts in admin/OVM UI).
  - `toda_president` (`todapres.tester@gtrams.com`): `/submit-members` + operator routes.
  - `operator` (`operator.tester@gtrams.com`, `ian.operator@gtrams.com`): Operator routes ONLY (blocked from `/submit-members`).
- **TODA Roster Gate & Privacy:** `/register` + `POST /api/v1/auth/verify-roster` blocks unlisted/mismatched `operatorName` + `bodyNumber` with LGU Advisory Modal and zero PII leakage.
- **Server-Authoritative Time (`Asia/Manila`):** Statuses follow server time (`X-Server-Time`), not browser clock; `Suspended -> Expired` is blocked; manual `Expire` preserves `originalExpiryDate`.
- **Upload / OCR / Input Hardening:**
  - Test both valid (`sample_docs/TAMA/`) and invalid (`sample_docs/MALI/`, e.g., `08_mali_NOT_A_DOCUMENT_BLURRY.png`, `01_mali_license_EXPIRED.png`, `02_mali_license_WRONG_CODE.png`, `03_mali_cr_NAME_MISMATCH.png`, `07_mali_cedula_EXPIRED_YEAR.png`) images.
  - Verify scan state resets on file swap, RA 10173 exclusions hold (no blood type, payment amounts, or signatories extracted), unrecognized OCR does NOT default `driverDlCodes` to `A, A1`, untrusted doc URLs are rejected, OR# adheres to `<=20` `[A-Z0-9-]+`, and duplicate plate/motor/chassis returns `409`.

### Phase 2: Full E2E Browser Testing Across All 5 Portals (via T3 `preview_*`)
> **DB Safety Rule:** Spin up an isolated local backend (`PORT=3000`) backed by a temporary `mongodb-memory-server` seeded with all 5 role accounts + sample TODA roster entries. **NEVER** run destructive operations or DB Restore tests against live MongoDB Atlas!

Check **Console errors, Page errors, and Failed Network requests (4xx/5xx)** on every route:
1. **Flow A — Core Franchise Lifecycle (5-Min Live Demo Path):**
   - **Operator (`/operator-dashboard`, `/apply-franchise`):** Barangay auto-maps to Zone (`Central`/`North`/`South`) & 17 Gasan TODAs; tricycle DL codes (`A, A1` / `A1` / `A`); OCR auto-fill + swap reset; 5-step wizard with inline printable 1:1 `OfficialApplicationForm` in Step 5 (no TODA endorsement upload required); Submit -> `Pending`.
   - **OVM / LLSA I (`/llsa-dashboard`, `/franchise-approval`, `/franchise-approval/review/:id`):** Split-screen comparator, discrepancy badges, printable `OfficialApplicationForm` modal, Approve -> `For Payment` (verify cannot skip payment), 10s Undo toast countdown.
   - **Cashier (`/cashier-dashboard`, `/cashier-settings`):** Queue renders cleanly, silent polling does not fight foreground loads, settle Over-the-Counter Cash payment with valid physical OR# -> `For Signing`, atomic `YYYY-NNN` MTOP allocation, duplicate OR# blocked (`409`), immutable `PaymentLedger` entry, auto-print default off, E-Resibo print isolation, Daily Treasury Remittance Sheet + 1-click CSV export.
   - **OVM / LLSA I Signing & Issuance:** `For Signing` -> `Ready for Pickup` -> `Active` (check OR# wrapping).
   - **Public Roadside QR (`/verify/:id`):** Logged-out scan renders `ACTIVE` permit cleanly; test invalid ID and deactivated owner (`INACTIVE_OWNER`).
2. **Flow B — Manual Expire -> Renewal, Voluntary Cancellation, & 3-Tier Violations:**
   - **Expire -> Renew:** Manual `Expire` in `FranchiseMasterlist` -> Operator `/renew-franchise/:id` (expired vs valid Cedula check) -> complete renewal -> verify Historical Archives preserves prior term with DB pagination (`termId` deduplicated).
   - **Voluntary Cancellation:** Operator `RequestCancellationModal` (test `<30`-char validation vs valid typed letter & uploaded letter) -> `Cancellation Requested` -> OVM / LLSA I `StaffCancellationReviewModal` (verify draft watermark & official DOCX blocked until finalized) -> Approve (`Cancelled`, auto-archived, operator garage slot freed immediately) AND Deny (returns to `priorStatus` preserving active discipline) + stale double-action (`409`).
   - **3-Tier Violations (`/manage-revocations`):** Block violation on `Pending`/unpaid unit -> 1st (`Active - Under Warning`) -> 2nd (`Suspended`, blocks renewal & manual expire) -> 3rd / Grave (`Revoked`) + cross-unit discipline carryover (`disciplineHelper.js`).
3. **Flow C — TODA President & Validation (`/submit-members`, `/validate-toda`):**
   - Individual member add with auto-generated Body No. + Regenerate; roster upload (`sample_toda_roster.png` / `sample_docs/TAMA/08_toda_roster_TAMA.png`), edit/add/delete row & submit; member removal request; OVM / LLSA I accordion click handling & approval/rejection.
4. **Flow D — System Admin (`/admin-dashboard`, `/user-management`, `/admin/settings`, `/admin/audit-logs`, `/admin/tickets`):**
   - User create/edit/deactivate/reactivate + singleton role guard; System Settings (fees, validity, 2-unit cap, violation policy, announcements, Scoped Maintenance Mode blocking only Operator apply/renew wizards); DRP Tab 5 Backup `.json.gz` export (16 collections) + SHA-256 verification + Restore test (isolated local in-memory DB only!); Audit Logs completeness; Support Tickets & Socket.IO real-time Chat/Notifications.
5. **Flow E — Edge Cases:**
   - 2-unit cap enforcement (3rd active unit blocked), Reject -> Resubmit flow, Forgot Password & profile recovery preservation, `/not-found` 404, `/account-deactivated`, `/maintenance`.

### Phase 3: Visual, Responsive, Dark/Light Mode & Print QA
- **Viewports (`preview_resize`):** Desktop `1440x900` and Mobile `390x844`.
- **Themes (`preview_set_appearance`):** Both `light` and `dark`.
- **Checks:** Zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`) even with long unbroken strings (TIN, Chassis, Motor, OR#), stacked mobile cards (`<768px`), `>=44px` touch targets, Civic Ledger palette (`#9E2A2B`, `#D4AF37`), zero native `alert()`/`confirm()`/`prompt()`, clean `@media print` layouts (`OfficialApplicationForm`, `OfficialCancellationLetterModal`, Cashier E-Resibo).

### Phase 4: Bug Triage, Surgical Fixes & Regression Verification
- Classify every finding as **P0 (Defense Blocker)**, **P1 (Major Functional/Security)**, or **P2 (UI/UX/Copy Polish)**.
- Fix every real P0/P1 (and quick P2) minimally per `brain/decisions.md` (ask before any Mongoose schema change).
- Add Jest regression tests for backend/logic fixes; re-verify in browser and re-run full Jest + ESLint + Vite Build until 100% green.
- Stop temporary servers, close opened preview tabs, and update `brain/audit-log.md`, `brain/active-task.md`, `brain/audits/final-defense-full-qa.md`, and `brain/00-index.md`.

### Phase 5: Go / No-Go Final Defense Report
- Verdict (`GO` / `CONDITIONAL GO` / `NO-GO`), automated test scoreboard, portal/flow coverage matrix, bugs found & fixed (P0/P1/P2), verified tester credentials/routes, and defense-day checklist notes.

---

## Ready-to-Paste Prompt para sa T3 Code (GPT 6.2 Sol)

Copy-paste the entire block below into **T3 Code**:

```markdown
You are the Final Defense QA Lead & Bug-Hunting Engineer for **G-TRAMS** (Gasan Tricycle Records and Application Management System). Pre-Final Defense is already **COMPLETED** on `main` (`86bd8f7`), and our **Final Defense** is imminent. Your mission is to execute an exhaustive, zero-blind-spot testing campaign across the entire backend, frontend, security boundaries, and live browser flows — find EVERY remaining bug (functional, security, concurrency, UI/responsive, or console/network errors), fix verified bugs cleanly, add regression tests, and deliver a Go/No-Go Final Defense Readiness Report.

### Mandatory Startup & Safety Rules
1. **Read Second Brain & Plan First (per `AGENTS.md`):** Read `AGENTS.md`, `PROJECT_CONTEXT.md`, `DESIGN.md`, `brain/00-index.md`, `brain/active-task.md`, `brain/decisions.md`, `brain/audit-log.md`, and `docs/FINAL_DEFENSE_QA_PLAN_AND_SOL_PROMPT.md` before running or editing anything.
2. **OVM / LLSA I Only on `main` (CRITICAL):**
   - On `main`, the municipal licensing office is strictly **Office of the Municipal Vice Mayor (OVM) — LLSA I** (`llsa.tester@gtrams.com`, `/llsa-dashboard`). Keep the internal MongoDB/RBAC enum `'bplo_staff'` unchanged in code for DB compatibility, **NEVER** introduce "BPLO" office labels, UI headings, or `bplo.tester@gtrams.com` onto `main` (the separate BPLO division exists ONLY on backup branch `feature/uat-bplo-ovm-split`).
3. **Respect Non-Negotiable Invariants (`brain/decisions.md`):**
   - Never break LGU pipeline order (`Pending -> For Payment -> For Signing -> Ready for Pickup -> Active`; payment strictly before signing).
   - Never weaken 5-role RBAC separation (`system_admin`, `bplo_staff` [OVM/LLSA I], `cashier`, `toda_president`, `operator`).
   - Never violate RA 10173 OCR exclusions (no blood type, payment amounts, or signatory extraction) or reintroduce TODA Endorsement upload / payment vouchers.
   - Never alter Mongoose schemas, ordinance defaults, or the Civic Ledger / Warm Heritage UI theme (`#9E2A2B` Maroon, `#D4AF37` Gold) without asking me first.
4. **CRITICAL Production DB Safety Check:**
   - Before starting a local dev server (`PORT=3000`, matching `frontend/.env.local`), check if `backend/.env`'s `MONGO_URI` points to the live production MongoDB Atlas cluster (do NOT print secret values).
   - **NEVER** run destructive operations (such as DB restore overwrite, unseed, or deleting real users/franchises) against a live production Atlas DB!
   - Prefer running the local E2E backend on `PORT=3000` against an isolated temporary `mongodb-memory-server` instance (seeded with the exact accounts from `backend/scripts/seed_tester_accounts.js` — notably `llsa.tester@gtrams.com`, `admin.tester@gtrams.com`, `cashier.tester@gtrams.com`, `todapres.tester@gtrams.com`, `operator.tester@gtrams.com`, `ian.operator@gtrams.com` + sample TODA roster entries) so you can freely test EVERY flow — including Backup/Restore, 3-Tier Violations, Cancellations, Manual Expiry, Maintenance Mode, and User Deactivation — with ZERO risk to production data.
   - Only perform **read-only** health/header checks against production (`https://g-trams-web2.onrender.com/api/v1/health` and `https://g-trams-official.vercel.app`).

---

### Execution Plan (Run Sequentially, Verify Thoroughly)

#### Phase 0: Baseline Automated Verification & Environment Audit
1. Check `git status -sb`, `git diff --check`, and verify local backend `PORT=3000` matches `frontend/.env.local`.
2. Run and record exact counts/outputs for:
   - `npm test --prefix backend` (all 25 Jest suites / 293+ tests)
   - `npm run test:stress --prefix backend` (stress & race condition suite)
   - `npm run lint --prefix frontend` (verify 0 errors)
   - `npm run build --prefix frontend` (verify clean Vite + PWA production bundle)
3. Check production backend health (`GET https://g-trams-web2.onrender.com/api/v1/health`) and verify `X-Server-Time` & `X-Server-Timezone: Asia/Manila` headers.

#### Phase 1: Defense Pillars & Security / RBAC Adversarial Audit
Verify all completed compliance pillars and post-UAT fixes (`86bd8f7`, `96304fa`, `8bfc794`, `b725fff`):
- **Role Isolation (API + UI):** Confirm `system_admin` (`admin.tester@gtrams.com`) is blocked from all OVM / LLSA I franchise/TODA/violation actions; `bplo_staff` (`llsa.tester@gtrams.com`) is blocked from IT settings/users/audit-logs/tickets/cashier payment; `cashier` (`cashier.tester@gtrams.com`) is isolated to `/cashier-dashboard` & `/cashier-settings`; `operator` cannot access `/submit-members` while `toda_president` (`todapres.tester@gtrams.com`) can.
- **Roster Registration Gate (`/register` + `/api/v1/auth/verify-roster`):** Non-roster and mismatched `operatorName` + `bodyNumber` are blocked with LGU Advisory Modal and zero PII leakage.
- **Server-Authoritative Time (`Asia/Manila`):** Verify UI/API rely on server time, not local clock. Verify `Suspended -> Expired` is blocked, and manual `Expire` preserves `originalExpiryDate`.
- **Upload / OCR / Input Hardening:** Test using `sample_docs/TAMA/` and `sample_docs/MALI/` (plus `sample_toda_roster.png` in repo root). Confirm invalid image/non-document triggers classification rejection & clean state reset; unrecognized OCR does not default `driverDlCodes` to `A, A1`; RA 10173 exclusions hold; untrusted external doc URLs rejected; OR# strict charset/length (`<=20`, `[A-Z0-9-]+`); duplicate plate/motor/chassis returns `409`.

#### Phase 2: Full E2E Browser Testing Across All 5 Portals (Use T3 `preview_*` Tools)
Spin up an isolated local backend on `PORT=3000` (using temporary `mongodb-memory-server` seeded with all 5 role accounts + sample TODA roster) and local Vite frontend (`5173`), then test EVERY real flow in the browser (`preview_status` -> `preview_open` -> `preview_navigate` -> `preview_snapshot` -> `preview_act` -> `preview_evaluate`). On EVERY route and action, inspect browser **console errors, uncaught page errors, and failed network requests (4xx/5xx)**:

1. **Flow A — Core Franchise Pipeline (5-Minute Defense Demo Path):**
   - **Operator (`/operator-dashboard`, `/apply-franchise`):** Barangay auto-maps to clean Zone (`Central`/`North`/`South`) & Gasan TODAs; tricycle DL codes (`A, A1`/`A1`/`A`); upload/scan state reset; 5-step wizard with inline printable `OfficialApplicationForm` in Step 5 (no TODA endorsement upload required); submit -> `Pending`.
   - **OVM / LLSA I (`/llsa-dashboard`, `/franchise-approval`, `/franchise-approval/review/:id`):** Split-screen verification, discrepancy flags, printable `OfficialApplicationForm` modal, Approve -> `For Payment` (confirm cannot skip payment), Undo toast 10s countdown.
   - **Cashier (`/cashier-dashboard`, `/cashier-settings`):** Queue renders cleanly, silent polling does not wipe state or fight foreground loads, settle Over-the-Counter Cash payment with valid physical OR# -> `For Signing`, atomic `YYYY-NNN` MTOP number, duplicate OR# blocked (`409`), auto-print default off, E-Resibo preview, Daily Treasury Remittance Sheet + CSV export.
   - **OVM / LLSA I Signing & Issuance:** `For Signing` -> `Ready for Pickup` -> `Active` (verify OR# wrapping on card).
   - **Public Roadside QR (`/verify/:id`):** Logged-out verification shows `ACTIVE` franchise cleanly; test nonexistent ID and deactivated owner (`INACTIVE_OWNER`).
2. **Flow B — Live Expire -> Renewal, Voluntary Cancellation, & Progressive Violations:**
   - **Expire -> Renew:** Manual `Expire` in `FranchiseMasterlist` -> Operator `/renew-franchise/:id` (test expired vs valid Cedula validation) -> complete renewal -> verify Historical Archives displays prior term cleanly with pagination.
   - **Voluntary Cancellation:** Test Operator `RequestCancellationModal` (validation `<30` chars vs valid typed letter & uploaded letter) -> `Cancellation Requested` -> OVM / LLSA I `StaffCancellationReviewModal` (verify draft watermark / official letter blocked before finalization) -> test **Approve** (`Cancelled`, auto-archived, operator garage slot freed immediately) AND **Deny** (returns to `priorStatus` preserving violations) AND stale double-action (`409`).
   - **3-Tier Violations (`/manage-revocations`):** Block violation on `Pending`/unpaid unit -> 1st (`Active - Under Warning`) -> 2nd (`Suspended`, confirm blocks renewal & manual expire) -> 3rd/Grave (`Revoked`) + cross-unit discipline carryover.
3. **Flow C — TODA President & OVM Roster Validation (`/submit-members`, `/validate-toda`):**
   - Individual member add with auto-generated Body No. + Regenerate; roster upload (`sample_toda_roster.png` / `sample_docs/TAMA/08_toda_roster_TAMA.png`), edit & submit; removal request; OVM / LLSA I accordion click handling & approval/rejection.
4. **Flow D — System Admin (`/admin-dashboard`, `/user-management`, `/admin/settings`, `/admin/audit-logs`, `/admin/tickets`):**
   - User create/edit/deactivate/reactivate; Settings (ordinance fees, violation policy, announcements, Scoped Maintenance Mode blocking only Operator apply/renew wizards); DRP Tab 5 Backup export (`.json.gz`, 16 collections) + restore test (ONLY on isolated local in-memory DB!); Audit Logs completeness; Support Tickets & Socket.IO real-time Chat/Notifications.
5. **Flow E — Edge Cases:**
   - 2-unit cap enforcement (3rd active unit blocked), Reject -> Resubmit flow, Forgot Password & profile recovery contact preservation, `/not-found` 404 page, `/account-deactivated`, `/maintenance`.

#### Phase 3: Visual, Responsive, Theme & Print QA
Using `preview_resize` and `preview_set_appearance`:
- Test **Desktop (`1440x900`)** and **Mobile (`390x844`)** across all key pages in both **Light** and **Dark** modes.
- Programmatically check `document.documentElement.scrollWidth <= window.innerWidth` on every tested page (including with long unbroken strings for TIN/Chassis/Motor/OR#) — zero horizontal overflow allowed.
- Verify no native `alert()`/`confirm()`/`prompt()` calls are triggered, tables adapt cleanly on mobile (`<768px`), modals remain scrollable, and `@media print` layouts are clean on `OfficialApplicationForm`, `OfficialCancellationLetterModal`, and Cashier E-Resibo.

#### Phase 4: Fix Bugs, Add Regression Tests & Re-Verify
- Triage every finding into **P0 (Defense Blocker)**, **P1 (Major Bug/Security)**, or **P2 (UI/UX/Copy Polish)**.
- For every real bug found (that does not require a schema change):
  1. Fix minimally and cleanly in strict compliance with `brain/decisions.md`.
  2. Add/update automated Jest regression tests for backend/business-logic fixes.
  3. Re-verify the fix in the browser and re-run `npm test --prefix backend`, `npm run lint --prefix frontend`, and `npm run build --prefix frontend` until 100% green.
- Stop all temporary local dev servers and close any preview tabs you opened when finished.
- Update `brain/audit-log.md`, `brain/active-task.md`, create `brain/audits/final-defense-full-qa.md` linked from `brain/00-index.md` (concise bulleted notes, accurate `Agent (Model)` attribution per `AGENTS.md`).

#### Phase 5: Final Defense Go / No-Go Report
End with a concise, well-structured report in Markdown containing:
1. **Verdict:** GO / CONDITIONAL GO / NO-GO for Final Defense.
2. **Automated Verification Summary:** Exact pass/fail counts for Jest, Stress Tests, ESLint, Vite Build, and live Render/Vercel health.
3. **Portal & Flow Coverage Matrix:** Status (PASS / FIXED / BLOCKED) for every role and flow in Phases 1–3.
4. **Bugs Found & Fixed:** Grouped by P0/P1/P2 with clickable file paths and root cause / fix summaries.
5. **Defense-Day Checklist Notes:** Verified working tester credentials (`llsa.tester@gtrams.com`, etc.), exact demo URLs/routes, and any remaining caveats or manual steps needed before going on stage.
```
