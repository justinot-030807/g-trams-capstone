# Audit: Codex Full-System Remediation (`efa090c`)

Links: [[00-index]] · [[architecture]] · [[audit-log]] · [[modules/auth-rbac]] · [[modules/cashier-treasury]] · [[modules/admin-settings-backups]]
Tags: #audit #security #bug

- **Date:** 2026-11-20 · **Agent / Model:** `Codex (model unspecified)` · **Commit:** `efa090c`
- **Verification:** Covered by `backend/__tests__/audit/codexAuditRemediation.test.js`.

## Findings & Fixes (H1–H5, M1–M14, L1–L6)
- **H1 (Restore Concurrency):** Added MongoDB `SystemLock` distributed restore lock, HTTP 503 write-guard middleware in `server.js`, and cron skip checks.
- **H2 + M2 (OAuth Recovery & `backupContact`):** Required reauthentication for Google-linked/only recovery edits and preserved legacy `backupContact` on blank routine profile updates.
- **H3 (Roster PII Leak):** Removed registered operator name and body number disclosure on `/api/v1/auth/verify-roster` mismatches.
- **H4 (Non-Atomic Cron Expiry):** Switched `syncFranchiseStatuses` to atomic `findOneAndUpdate` so permits persist `Expired` and notify once.
- **H5 (Violation Status Guard):** Rejected sanctions against `Pending` or unpaid applications without mutating status.
- **M6–M14, L3, L6:** Added `isTrustedDocumentUrl` URL allowlist, renewal document expiry check, real `Violation` count in `record-check`, atomic `YYYY-NNN` `mtopNo` + durable `PaymentLedger`, announcement ID sanitization, thread-scoped chat notification clearing, singleton role reactivation guard, and `INACTIVE_OWNER` status on QR verification.
