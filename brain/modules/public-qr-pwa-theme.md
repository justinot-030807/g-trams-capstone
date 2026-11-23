# Public Portal, QR Verification, PWA & Civic Ledger UI

Links: [[00-index]] · [[architecture]] · [[decisions]]
Tags: #ui #pwa #core

## Scope & Responsibilities
- Delivers public landing & Citizen's Charter views, unauthenticated roadside QR permit verification (`/verify/:id` with `INACTIVE_OWNER` status check), installable PWA offline caching, and accessibility controls (dark mode, text scale, EN/TL language toggle).
- Enforces "The Civic Ledger" Warm Heritage design tokens (`#9E2A2B` Maroon, `#D4AF37` Gold, `#F6F5F3` / `#14110F` surfaces, Manrope + JetBrains Mono) and Radix UI dialogs/toasts.

## Key Files
- `frontend/src/pages/Home.jsx`, `frontend/src/pages/shared/VerifyOperator.jsx`, `frontend/src/pages/shared/About.jsx`, `frontend/src/pages/MaintenanceMode.jsx`, `frontend/src/pages/AccountDeactivated.jsx`.
- `frontend/src/components/MainLayout.jsx`, `Sidebar.jsx`, `TopNavbar.jsx`, `frontend/src/components/operator/OperatorBottomNav.jsx`.
- `frontend/src/components/ui/` (`AlertDialog.jsx`, `Button.jsx`, `ConfirmContext.jsx`, `Dialog.jsx`, `Switch.jsx`, `Tabs.jsx`, `Toaster.jsx`).
- `frontend/src/components/common/` (`StatusBadge.jsx`, `DataTable.jsx`, `StatCard.jsx`, `PageHeader.jsx`, `PwaInstallBanner.jsx`).
- `frontend/src/context/` (`ThemeContext.jsx`, `TextSizeContext.jsx`, `LanguageContext.jsx`).
- `frontend/tailwind.config.js`, `frontend/src/index.css`, `frontend/vite.config.js`, `frontend/public/sw.js`, `frontend/vercel.json`, `DESIGN.md`, `.impeccable/design.json`.
