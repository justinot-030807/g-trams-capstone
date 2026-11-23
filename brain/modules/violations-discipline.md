# Violations & Progressive Discipline

Links: [[00-index]] · [[architecture]] · [[decisions]] · [[modules/ovm-llsa-review]]
Tags: #core #api #ui

## Scope & Responsibilities
- Enforces the municipal 3-tier progressive sanction matrix (`Warning` -> `Active - Under Warning`; `Suspension` -> `Suspended`; `Revocation` -> `Revoked`, or immediate `Revocation` on grave offenses).
- Blocks sanctions on `Pending` or unpaid applications and surfaces real `Violation` counts in pre-payment `record-check` queries.

## Key Files
- `backend/src/models/violationModel.js` — Offense count, severity, grave flag, sanction type, fine amount, and suspension window.
- `backend/src/models/systemSettingsModel.js` (`violationPolicy`) — Configurable offense types (`OVERCHARGING`, `REFUSAL_CONVEY`, `DISCOURTEOUS`, `NO_FRANCHISE`, `OUT_OF_LINE`, `RECKLESS_DRIVING`, `OTHER`) and tier sanctions.
- `backend/src/routes/violationRoutes.js` & `backend/src/controllers/violationController.js` — Recording, history lookup, and settling/lifting violations.
- `backend/src/services/cronService.js` — Automatic restoration of expired suspensions back to `Active - Under Warning`.
- `frontend/src/pages/admin/ManageRevocations.jsx` — OVM / LLSA I violation logging, revocation management, and sanction history view (`/manage-revocations`).
