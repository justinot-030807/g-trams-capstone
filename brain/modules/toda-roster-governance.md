# TODA Roster & Jurisdiction Governance

Links: [[00-index]] · [[architecture]] · [[decisions]] · [[modules/auth-rbac]]
Tags: #core #api #ui

## Scope & Responsibilities
- Digitizes TODA member lists via OCR, enforces collision-free body numbers per association, gates `/register` operators against `TodaRoster`, and handles member delisting requests.
- Enforces jurisdiction alignment across Gasan's 25 barangays, 3 zones (`Central`, `North`, `South`), and official TODA directory (`TODA_DIRECTORY` / `TODA_LIST`).

## Key Files
- `backend/src/models/todaModel.js` (`TodaRoster`), `todaSubmission.js`, `todaRemovalRequest.js` — Compound unique index `{ todaAssociation, bodyNumber }`.
- `backend/src/routes/todaRoutes.js` & `backend/src/controllers/todaController.js` — `/scan-roster`, `/next-body-number`, `/members/individual`, submissions, and targeted removal requests.
- `backend/src/utils/rosterValidator.js` & `backend/src/utils/todaDirectory.js` — Roster verification and backend jurisdiction validation.
- `frontend/src/utils/constants.js` — Barangay, zone, and TODA directory mappings + normalizers.
- `frontend/src/pages/toda/SubmitMembers.jsx` & `frontend/src/pages/admin/ValidateTODA.jsx` — TODA President submission portal and OVM / LLSA I roster validation queue.
