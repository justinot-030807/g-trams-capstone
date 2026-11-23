# System Admin, Settings & DRP Backups

Links: [[00-index]] · [[architecture]] · [[decisions]]
Tags: #core #drp #security #ui

## Scope & Responsibilities
- Provides IT-only administration (`system_admin`): user account lifecycle, singleton role conflict guards, ordinance settings, support tickets, audit trail CSV export, and disaster recovery backups.
- Implements Two-Tier DRP: automated weekly Sunday midnight backups + manual `.json.gz` snapshot download/restore with SHA-256 checksums, optional AES-256-GCM encryption, `SystemLock` distributed lock, and HTTP 503 mutation guard.

## Key Files
- `backend/src/services/backupService.js`, `backend/src/routes/backupRoutes.js`, `backend/src/controllers/backupController.js` — `BackupArchive` (15 collections persisted in MongoDB) & `SystemLock`.
- `backend/src/models/systemSettingsModel.js` & `backend/src/controllers/systemSettingsController.js` — Fees, validity terms, 2-unit cap, announcements, `maintenanceMode`, `/health`.
- `backend/src/models/auditLogModel.js`, `backend/src/routes/auditLogRoutes.js`, `backend/src/controllers/auditLogController.js`, `backend/src/utils/auditLogger.js`.
- `backend/src/models/ticketModel.js`, `backend/src/routes/ticketRoutes.js`, `backend/src/controllers/ticketController.js`.
- `frontend/src/pages/admin/AdminDashboard.jsx`, `UserManagement.jsx`, `AdminSettings.jsx`, `AdminAuditLogs.jsx`, `AdminTickets.jsx`.
