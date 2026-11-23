# G-TRAMS Second Brain Index

- **Project:** G-TRAMS — Gasan Tricycle Records and Application Management System (Municipality of Gasan, Marinduque).
- **Stage:** Pre-Final Defense completed; currently in **Final Defense QA & readiness** on `main` (`86bd8f7`, `25 Jest suites / 293 tests`).
- **Governance Rule on `main`:** Licensing staff office is strictly **OVM / LLSA I** (`llsa.tester@gtrams.com`, `/llsa-dashboard`, internal DB role enum `'bplo_staff'`). Separate BPLO Mayor's Permitting Division lives **only** on backup branch `feature/uat-bplo-ovm-split`.
- **Production URLs:** Frontend `https://g-trams-official.vercel.app` (Vercel) · Backend `https://g-trams-web2.onrender.com` (Render) · DB: MongoDB Atlas.

## Knowledge Map
- [[architecture]] — Tech stack, MongoDB/Cloudinary schema, core backend & frontend modules, key file paths.
- [[decisions]] — Non-negotiable LGU pipeline rules, RBAC isolation, security invariants, and Civic Ledger UI rules.
- [[active-task]] — Current Final Defense QA milestone, status, and immediate next steps.
- [[audit-log]] — Verified bugs, security audit findings, and remediation history.

## Modules (`brain/modules/`)
- [[modules/auth-rbac]] · [[modules/franchise-lifecycle]] · [[modules/ovm-llsa-review]] · [[modules/cashier-treasury]] · [[modules/toda-roster-governance]]
- [[modules/violations-discipline]] · [[modules/ocr-document-verification]] · [[modules/admin-settings-backups]] · [[modules/notifications-realtime-chat]] · [[modules/public-qr-pwa-theme]]

## Tasks (`brain/tasks/`)
- [[tasks/defense-compliance-pillars]] · [[tasks/textbee-ocr-resilience]] · [[tasks/warm-heritage-ui-dossier]] · [[tasks/uat-and-lgu-turnover]]

## Audits (`brain/audits/`)
- [[audits/final-defense-full-qa]]
- [[audits/post-batch2-96304fa]]
- [[audits/batch2-h5-m2-toda]]
- [[audits/batch2-h6-m6-treasury-settlement]]
- [[audits/codex-audit-efa090c]] · [[audits/full-system-security-eb12b14]] · [[audits/auth-hardening-9f5737e]] · [[audits/pre-uat-p0-p2-fixes-4c99977]]

## Repository Layout
- `backend/` — Express 5 + Mongoose 9 REST API, Socket.IO server, cron jobs, 3-tier OCR, encrypted DRP backups, Jest/Supertest & stress suites.
- `frontend/` — React 19 + Vite 8 + Tailwind 3 PWA serving 5 role portals (Operator, TODA President, Cashier, OVM/LLSA I Staff, System Admin) + public QR verify (`/verify/:id`).
- `docs/` — Final Defense QA plan, demo script, pocket cards, master guide, slide notes, and Deliverable #7 user manual assets.
- `scripts/` — Sample document/roster/manual generators (`generate_sample_documents.py`, `generate_sample_roster.py`, `generate_users_manual.js`).
- `tests/` — Python Deliverable #7 PDF verification suite (`pytest` / `unittest`).
- `remotion/` — Remotion video workspace (separate package).
- `.agents/`, `.impeccable/` — Local agent skills and design tokens (`design.json`).

## Quick Commands & Reference Docs
- **Run Dev:** `cd backend && npm run dev` (`:3000` via `backend/.env` & `frontend/.env.local`) · `cd frontend && npm run dev` (`:5173`).
- **Test & Build:** `npm test --prefix backend` (25 suites / 293 tests) · `npm run build --prefix frontend` (Vite).
- **Existing Docs:** `AGENTS.md`, `PROJECT_CONTEXT.md`, `DESIGN.md`, `FINAL_DEFENSE_SUMMARY.md`, `docs/FINAL_DEFENSE_QA_PLAN_AND_SOL_PROMPT.md`.
