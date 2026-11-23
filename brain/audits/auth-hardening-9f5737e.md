# Audit: Auth, OTP & Role Governance Hardening (`9f5737e`)

Links: [[00-index]] · [[architecture]] · [[audit-log]] · [[modules/auth-rbac]]
Tags: #audit #security #bug

- **Date:** 2026-11-14 · **Agent / Model:** `Unknown (model unspecified)` · **Commit:** `9f5737e`

## Findings & Fixes
- **Brute-Force & Lockout:** Enforced OTP attempt caps (`otpAttempts`) and account `lockUntil` thresholds on repeated failed logins (`authController.js`, `userModel.js`).
- **Validation & Complexity:** Tightened registration, reset-password, and Zod complexity rules (`authSchema.js`, `Register.jsx`, `ForgotPassword.jsx`).
- **Role Governance:** Hardened admin user management role transitions and preserved strict `system_admin` vs `bplo_staff` boundaries (`UserManagement.jsx`).
