# Municipal Cashier & Treasury

Links: [[00-index]] · [[architecture]] · [[decisions]] · [[modules/franchise-lifecycle]]
Tags: #core #api #ui

## Scope & Responsibilities
- Isolated over-the-counter payment terminal (`cashier` role only) for applications in `For Payment` status; no claim stubs or admin payment shortcuts.
- Assigns canonical `YYYY-NNN` `mtopNo` atomically, records editable physical LGU Official Receipt numbers and `payerName`, writes immutable `PaymentLedger` records, and isolates `@media print` E-Resibo receipts.

## Key Files
- `frontend/src/pages/cashier/CashierDashboard.jsx` — Payment queue, physical OR entry, sound alert, and printable E-Resibo voucher.
- `frontend/src/pages/cashier/CashierSettings.jsx` — Cashier account preferences and profile settings.
- `backend/src/controllers/franchiseController.js` (`getCashierQueue`, `processCashierPayment`, `executeAtomicUpdateWithMtop`) — Atomic payment & MTOP serialization.
- `backend/src/routes/franchiseRoutes.js` — `GET /cashier-queue` and `POST /:id/pay` locked to `authorize('cashier')`.
- `backend/src/models/paymentLedgerModel.js` — Durable treasury ledger (`officialReceiptNo` unique), preserved across renewals and archiving.
