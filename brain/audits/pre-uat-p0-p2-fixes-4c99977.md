# Audit: Pre-UAT P0–P2 Crash, Print & Overflow Fixes (`4c99977`, `17cc0c0`)

Links: [[00-index]] · [[architecture]] · [[audit-log]] · [[modules/ovm-llsa-review]] · [[modules/cashier-treasury]] · [[modules/franchise-lifecycle]]
Tags: #audit #bug #ui

- **Date:** 2026-11-12 · **Agent / Model:** `Unknown (model unspecified)` · **Commits:** `4c99977`, `17cc0c0`

## Findings & Fixes
- **Runtime & UI Crashes (`4c99977`):** Restored missing Lucide icons in `BploDashboard.jsx`, expanded staff chat RBAC, enabled voluntary cancellation for `Active - Under Warning`, isolated Cashier E-Resibo `@media print`, and added 10-minute Render keepalive ping.
- **Mobile Horizontal Overflow (`17cc0c0`):** Prevented 101-character continuous TIN/chassis/motor strings from stretching Step 5 review grids (`ApplyFranchise.jsx`) by applying `min-w-0`, `break-all`, and `overflow-x-hidden` (`index.css`), and cleaned inline `#14110F` background flashing.
