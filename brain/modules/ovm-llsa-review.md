# OVM / LLSA I Review & Issuance

Links: [[00-index]] · [[architecture]] · [[decisions]] · [[modules/franchise-lifecycle]]
Tags: #core #ui #api

## Scope & Responsibilities
- Powers **Office of the Municipal Vice Mayor (OVM) — LLSA I** (`llsa.tester@gtrams.com`, internal DB role enum `'bplo_staff'`) franchise operations: multi-tab approval queues (`Needs Review`, `For Payment`, `For Signing`, `Ready for Pickup`, `Approved`, `Rejected`, `Cancellations`), dual-pane document inspection, cancellation review, masterlist, and certificate/transmittal generation.
- Strictly separated from `system_admin` IT functions and isolated from `cashier` payment logging.

## Key Files & Routes
- `frontend/src/pages/admin/LlsaDashboard.jsx` (`/llsa-dashboard`) — Primary LLSA I operational dashboard (`/bplo-dashboard` redirects here for backwards URL compatibility).
- `frontend/src/pages/admin/FranchiseApproval.jsx` (`/franchise-approval`) — Queue management and status transitions.
- `frontend/src/pages/admin/FranchiseReviewPage.jsx` (`/franchise-approval/review/:id`) — Dual-pane verification workstation with AI OCR comparisons and pre-payment record check.
- `frontend/src/pages/admin/FranchiseMasterlist.jsx` (`/franchise-masterlist`) & `frontend/src/pages/admin/AdminReports.jsx` (`/admin/reports`) — Searchable registry, live `Expire` action, and operational analytics.
- `frontend/src/components/admin/AdminApplicationSummaryModal.jsx` & `frontend/src/components/common/OfficialApplicationForm.jsx` — Printable 1:1 application form with Approve/Reject shortcuts, Excel export, and AI discrepancy notice.
- `frontend/src/components/admin/MtopCertificateModal.jsx`, `BatchMtopModal.jsx`, `TransmittalSheetModal.jsx`, `StaffCancellationReviewModal.jsx`.
- `backend/src/utils/officeTemplateGenerator.js` & `backend/src/templates/` — Official XLSX/DOCX LGU form generators.
