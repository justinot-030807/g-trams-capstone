# Auth & RBAC

Links: [[00-index]] · [[architecture]] · [[decisions]]
Tags: #core #api #security

## Scope & Responsibilities
- Handles registration, OTP verification, login lockout, password complexity, JWT `HS256` (`tokenType`, `tokenVersion`), Google OAuth, recovery OTP reauth, and RBAC guards.
- Enforces strict municipal role isolation: `system_admin` (IT only, blocked from OVM / LLSA I operations), `bplo_staff` (internal role enum for OVM / LLSA I licensing operations), `cashier` (treasury only), `toda_president`, `operator`, and `driver`.

## Key Files
- `backend/src/routes/authRoutes.js` — Rate-limited auth endpoints, `/verify-roster`, `/google`, `/profile`, `/verify/:id`, `/public-stats`.
- `backend/src/controllers/authController.js` — Registration, OTP attempts, lockout, Google onboarding, recovery, user management.
- `backend/src/middleware/authMiddleware.js` — `protect` (`tokenVersion`, active check) and `authorize` (role alias normalization + separation guards).
- `backend/src/schemas/authSchema.js` — Zod request schemas.
- `backend/src/models/userModel.js` — User schema, bcrypt hashing (`saltRounds`: 12 prod / 10 test), `tokenVersion`, deactivation appeals.
- `frontend/src/components/ProtectedRoute.jsx`, `frontend/src/pages/Login.jsx`, `frontend/src/pages/Register.jsx`, `frontend/src/pages/ForgotPassword.jsx`, `frontend/src/components/GoogleOnboardingModal.jsx`.
