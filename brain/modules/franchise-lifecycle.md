# Franchise Lifecycle

Links: [[00-index]] · [[architecture]] · [[decisions]]
Tags: #core #api #ui

## Scope & Responsibilities
- Manages the 5-step MTOP application wizard, annual renewals, operator dashboard tracking, watermarked MTOP E-Copy, and voluntary cancellation requests.
- Enforces LGU pipeline order (`Pending` -> `For Payment` -> `For Signing` -> `Ready for Pickup` -> `Active`), 2-unit ordinance cap (`maxUnitsPerOperator`), and `Asia/Manila` expiration virtuals/hooks.

## Key Files
- `backend/src/models/franchiseModel.js` — 12-state status enum, vehicle/document metadata, `cancellationDetails`, `paymentHistory`, partial unique indexes (`plateNo`, `motorNo`, `chassisNo`, `officialReceiptNo`, `mtopNo`), and `Asia/Manila` hooks/virtuals.
- `backend/src/routes/franchiseRoutes.js` & `backend/src/controllers/franchiseController.js` — Application intake, edit guards, renewal, cancellation, record checks.
- `backend/src/services/franchiseService.js` — Analytics, `isTrustedDocumentUrl` URL allowlist, and report aggregation.
- `backend/src/utils/phTime.js` — Server-authoritative UTC+8 (`Asia/Manila`) date calculations.
- `frontend/src/pages/operator/OperatorDashboard.jsx`, `frontend/src/pages/operator/ApplyFranchise.jsx`, `frontend/src/pages/operator/RenewFranchise.jsx`, `frontend/src/components/operator/RequestCancellationModal.jsx`.
