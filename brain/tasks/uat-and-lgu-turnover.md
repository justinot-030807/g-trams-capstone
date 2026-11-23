# Task: UAT Stabilization & LGU Gasan Turnover

Links: [[00-index]] · [[architecture]] · [[active-task]] · [[modules/ovm-llsa-review]] · [[modules/cashier-treasury]] · [[modules/admin-settings-backups]]
Tags: #task #uat #core

## Goal & Status
- **Status:** Final Defense QA (`main` @ `86bd8f7`).
- Verify post-audit stability across all 5 user portals ahead of Final Oral Defense and formal LGU Gasan OVM (LLSA I) & Municipal Treasury turnover.

## Checklist
- [x] Run `npm test --prefix backend` (Jest + `mongodb-memory-server`) — **25/25 suites, 293/293 tests passing** on `86bd8f7`.
- [x] Run `npm run build --prefix frontend` and `npm run lint --prefix frontend` — clean Vite bundle and `0` ESLint errors.
- [ ] Run Final Defense browser & adversarial E2E verification across System Admin, OVM / LLSA I Staff, Municipal Cashier, TODA President, and Operator accounts (`docs/FINAL_DEFENSE_QA_PLAN_AND_SOL_PROMPT.md`).
- [ ] Verify production Vercel (`https://g-trams-official.vercel.app`) + Render (`/api/v1/health`) health and finalize defense demo walkthrough.
