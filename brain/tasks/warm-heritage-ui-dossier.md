# Task: Warm Heritage UI & Official Application Form Dossier

Links: [[00-index]] · [[architecture]] · [[active-task]] · [[modules/public-qr-pwa-theme]] · [[modules/ovm-llsa-review]]
Tags: #task #ui

## Goal & Status
- **Status:** Completed (`e956302`, `4a029fb`, `649e71c`, plus post-`efa090c` dossier refactor).
- Unified all 5 portals under "The Civic Ledger" Warm Heritage tokens (`DESIGN.md`) and printable official forms.

## Delivered Outcomes
- **Civic Ledger Tokens & Radix UI (`e956302`, `649e71c`):** Enforced `#9E2A2B` Maroon, `#D4AF37` Gold, `#F6F5F3`/`#14110F` surfaces, Manrope + JetBrains Mono typography, and Radix `Dialog`/`AlertDialog`/`ConfirmContext` + `Sonner` toasts.
- **Operator Onboarding & Recovery (`4a029fb`):** Streamlined registration and added `ProfileSetupCard.jsx` and account recovery flows.
- **Official Form Summary Modal (`Antigravity (model unspecified)`):** Wired printable 1:1 `OfficialApplicationForm` into `AdminApplicationSummaryModal.jsx` (replacing `ApplicationDossierModal` view usage) with Approve/Reject shortcuts, Excel export, and AI discrepancy notice, and refreshed `.impeccable/design.json` via Impeccable v4.10.0.
