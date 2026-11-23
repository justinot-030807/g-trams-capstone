# G-TRAMS Final Defense QA

**NO-GO for the live Final Defense deployment.** Render returned HTTP 503 with `dbReady: true` and `indexesReady: false` on five read-only checks on November 23, 2026. Vercel served the frontend with HTTP 200. The isolated local API and browser results support parts of the rehearsal. Several acceptance criteria remain open.

The audit started from `main` at `71ef632` with application code from `86bd8f7`. All workflows that changed data used a loopback MongoDB Memory Server replica set with six seeded tester accounts and synthetic roster and franchise records. The browser used T3 Preview and local Chromium with Vite on `5173` and Express on `3000`. Browser checks included 1440×900 and 390×844 in light and dark. Workflow actions had narrower coverage than the route checks. Local test mode uses simulated delivery and skips some production-only validation paths.

The first route matrix recorded 104 route and viewport/theme checks, with zero horizontal overflows and zero uncaught page errors in those snapshots. Targeted browser actions exposed a 400 on a complete application. The exercised core registration, submission, payment, signing, expiry, and QR states fit their tested viewports after the fix.

The TC numbering below follows the Final Defense checklist supplied for this audit. [Deliverable #4](Deliverable4_Test_Cases.html) contains 39 historical cases, with its own numbering, an older endpoint, earlier role assignments, and payment order. Its historical Passed labels predate this run.

## Automated scoreboard

| Check | Observed result |
|---|---|
| Backend Jest | Final run passed **28 of 28 suites and 301 of 301 tests** in 643.018 seconds, including the multipart, registration, and TODA regressions. Earlier runs under competing workload hit MongoDB startup and hook timeouts. |
| Backend regression checks | 14 of 14 targeted tests passed across four suites, including readiness, Google script loading, Manila clock, and renewal. |
| Stress | **6 of 6 scenarios passed** on the isolated rerun after correcting session and capacity fixtures. Franchise race created exactly one application. Cashier race produced one HTTP 200 and nineteen HTTP 409 responses. Masterlist returned 100 of 100 responses with zero errors and 2.42 seconds average latency. |
| Frontend ESLint | Exit 0, **0 errors**, 121 warnings after fixes. |
| Vite build | Exit 0 after fixes. Vite 8.0.16 generated the PWA bundle and warned about chunks over 500 kB. |
| Isolated backend | HTTP 200, `status: ok`, `dbReady: true`, `indexesReady: true`, Manila timezone header. |
| Production | Render HTTP 503 at 17:11, 17:15, 17:47, 19:57 and 20:45 PHT. Both required time headers were present. Vercel HEAD HTTP 200. |

## Test case parity

Of 45 cases, **19 matched**, **7 had a verified fix**, and **19 remain partial**. The eight panel revisions show two Pass, one Fixed, four Partial, and one Open.

`MATCH` means the tested claim matched in the browser and API where applicable. `FIXED` identifies a corrected discrepancy. `PARTIAL` and `OPEN` identify remaining acceptance evidence.

| TC | Real browser and API result | Status | Notes and file or route |
|---|---|---|---|
| TC-01 | T3 Preview matched the roster, created a synthetic account with HTTP 201, verified the local test OTP with HTTP 200, and landed on Operator Portal. | MATCH | Local delivery simulation. `/register`, `POST /auth/verify-roster`, `POST /auth/verify-otp`. |
| TC-02 | T3 Preview rejected the 12-digit phone and weak password. The development API originally reached OTP delivery for the invalid phone. After the fix it returned 400 before creating an account or issuing a code. Weak password also returned 400. | FIXED | [Registration controller](../backend/src/controllers/authController.js) · `/register`, `POST /auth/register`. |
| TC-03 | Browser showed Official Municipal Advisory on the wrong body number and recorded HTTP 403. API also returned generic HTTP 403 for an unlisted name, omitting matching identities and contacts. | MATCH | `/register`, `POST /auth/verify-roster`. |
| TC-04 | T3 Preview submitted the duplicate email and duplicate phone separately. Both returned HTTP 400 and displayed the existing account guidance. | MATCH | `/register`, `POST /auth/register`. |
| TC-05 | Password login returned 200 and reached Operator Portal. Operator access to the TODA roster was denied in API and redirected in Chromium. | MATCH | `/operator-dashboard`, `/submit-members`, `GET /toda/my-members`. |
| TC-06 | TODA President login returned 200 and landed on Operator Portal. The dedicated Submit Members screen loaded. | MATCH | The historical case expected a direct roster redirect. Current role navigation offers `/submit-members`. |
| TC-07 | OVM / LLSA I login returned 200 and reached the licensing dashboard. Treasury queue API rejected the role with 403. | MATCH | `/llsa-dashboard`, `GET /franchises/cashier-queue`. |
| TC-08 | Cashier login returned 200 and reached Cashier & Payment Terminal. | MATCH | `/cashier-dashboard`. |
| TC-09 | IT administrator login returned 200. Incorrect operator password was rejected with HTTP 400. The four licensing routes redirected the administrator. Franchise, roster, and violations APIs returned 403. | MATCH | `/admin-dashboard`, `/llsa-dashboard`, `/franchise-approval`, `/validate-toda`, `/manage-revocations`. |
| TC-10 | Settings rendered. The API bound a verified recovery contact using a simulated OTP. An address update and password change preserved the same verified recovery contact. | PARTIAL | Live Google reauthentication and the full browser settings edit remain open. `/operator/settings`, `/auth/profile`, `/auth/change-password`. |
| TC-11 | Browser completed all five steps with local fixture attachments at 390×844 in dark mode. The fixed submission returned HTTP 201 and saved Pending. | FIXED | Full coverage of all barangay/TODA/zone combinations remains open. `/apply-franchise` and [franchise upload limits](../backend/src/config/cloudinary.js) |
| TC-12 | The actual DL dropdown offered exactly `A, A1`, `A1`, and `A`. A blurry sample never populated a default DL code. | MATCH | Successful OCR extraction remains part of TC-16. `/apply-franchise`. |
| TC-13 | Step 3 contained only the Barangay Clearance upload. Step 4 showed Cedula Document Required until the fixture was attached. The subsequent multipart application saved as Pending. | MATCH | `/apply-franchise`, `POST /franchises`. |
| TC-14 | Duplicate preflight returned HTTP 400 before the fix. Post-fix requests for duplicate plate, motor, and chassis each returned HTTP 409. | FIXED | The browser conflict for each identifier needs completion. [Franchise service](../backend/src/services/franchiseService.js) |
| TC-15 | Chromium displayed `Unit Quota Reached (2 / 2)`. API blocked the next unit with 400. | MATCH | `/apply-franchise`, `POST /franchises`. |
| TC-16 | Browser sent both the blurry and valid license fixtures to the scanner, then replaced the image without a default DL code. The isolated run required manual entry for the fixtures. | PARTIAL | Successful three-tier extraction, scan resets after a successful extraction, and privacy exclusions need provider-backed browser evidence. `POST /franchises/scan-document`, `sample_docs/TAMA`, `sample_docs/MALI`. |
| TC-17 | Real review page displayed comparator and Record Check, returned HTTP 200, and opened Application Summary (Printable Form). Print CSS was exercised. | MATCH | Review fixture had no source document. Full document comparability and a physical print check still need rehearsal. `/franchise-approval/review/:id`. |
| TC-18 | Staff clicked Send to Cashier and got HTTP 200 with For Payment. The Undo button counted from 10 to 9 seconds and restored Pending with HTTP 200. | MATCH | Desktop action. `/franchise-approval/review/:id`, `PUT /franchises/:id/status`. |
| TC-19 | The review page and quick actions offered approval for payment. The cashier queue denied the staff token with 403. | PARTIAL | Complete Reject with remarks and operator resubmission in the browser. `/franchise-approval/review/:id`. |
| TC-20 | Cashier terminal showed Payment Queue (1) and a separate paid history. Queue API returned 200. | PARTIAL | Foreground versus silent polling under deliberate delay remains open. `/cashier-dashboard`. |
| TC-21 | Premature signing and release from Pending were rejected by the API. Cashier terminal exposed Process Payment. | MATCH | `PUT /franchises/:id/status`, `/cashier-dashboard`. |
| TC-22 | Cashier form stripped nonconforming characters and limited length. API returned HTTP 400 for missing, overlength, and malformed ORs and HTTP 409 for duplicate ORs. | MATCH | `/cashier-dashboard`, `POST /franchises/:id/pay`. |
| TC-23 | Cashier UI posted a physical OR and payer name. The API returned HTTP 200, a durable ledger entry, For Signing, and MTOP `2026-042`. In stress, exactly one of twenty concurrent payments succeeded. | MATCH | `/cashier-dashboard`, `POST /franchises/:id/pay`. |
| TC-24 | E-Resibo opened with zero print calls by default. Clicking Print invoked the browser print function. Treasury Sheet downloaded a CSV containing the just-recorded OR. | PARTIAL | Final printed-page isolation remains open. `/cashier-dashboard`, `/cashier-settings`. |
| TC-25 | Staff clicked Mark Signed & Ready. The API returned HTTP 200 and Ready for Pickup on the paid record. | MATCH | `/franchise-approval/review/:id?tab=signing`, `PUT /franchises/:id/status`. |
| TC-26 | Staff clicked Release Franchise and the API returned HTTP 200, Active, and a three-year permit. | MATCH | `/franchise-approval/review/:id?tab=ready`. |
| TC-27 | Unpaid premature release was blocked. | PARTIAL | Blocked certificate download and successful released download need direct browser and API checks. `/operator-dashboard`. |
| TC-28 | Garage displayed application details. Mobile Step 5 rendered the inline official form. Submission reached Pending after the multipart fix. | FIXED | Six-stage tracking across a single browser lifecycle and the operator print preview still need completion. `/operator-dashboard`, `/apply-franchise`. |
| TC-29 | Tapping View E-Copy opened an approved MTOP in a 390 px browser. The view displayed Electronic Copy and a QR. | PARTIAL | Verify the watermark and export on the printed page. `/operator-dashboard`. |
| TC-30 | Logged-out Verified Active Permit rendered at both sizes and themes without horizontal overflow. Missing ID returned 404 and the expected error screen. A deactivated owner produced `INACTIVE_OWNER` and a permit-invalid banner. Public active projection included display name and masked contact, with no address or license data. | MATCH | `/verify/:id`, `GET /auth/verify/:id`. |
| TC-31 | Staff clicked Expire and the API preserved `originalExpiryDate`. The mobile operator garage then offered Renew Franchise. Suspended to Expired returned 400. T3 Preview changed the browser clock to 2050 after synchronization and the application Manila date stayed in 2026. | FIXED | `/franchise-masterlist`, `/operator-dashboard`, [browser time utility](../frontend/src/utils/serverTime.js). |
| TC-32 | The renewal screen rendered. Post-fix API rejected the expired Cedula with HTTP 400, accepted the current Cedula, completed the approval/payment/signing/release sequence, and retained one prior term with the original OR. | FIXED | Full browser renewal submission and archive pagination need completion. `/renew-franchise/:id`, `backend/src/controllers/franchiseController.js`. |
| TC-33 | A real browser uploaded the sample roster. The isolated scanner returned HTTP 200 with five extracted rows. The upload API accepted an edited fixture roster with HTTP 201. | PARTIAL | End-to-end edited row submission in the browser and live provider fallback remain open. `/submit-members`, `POST /toda/scan-roster`, `POST /toda/upload`. |
| TC-34 | Browser opened Add Member and clicked Regenerate. The next-number API returned HTTP 200. Add Individual returned 201 through the API. | PARTIAL | Verify duplicate allocation behavior during simultaneous browser writes. `/submit-members`, `/toda/members/individual`. |
| TC-35 | Disaffiliation Requests tab rendered. An unsupported reason returned 500 before the fix and 400 after it. Two valid requests returned 201 and staff decisions returned 200. | FIXED | Full browser filing and decision paths remain open. `/submit-members`, `POST /toda/removal-requests`. |
| TC-36 | Licensing TODA validation rendered. The API approved a populated roster submission and separately approved and rejected local removal requests. All three decisions returned HTTP 200. | PARTIAL | Browser accordion and populated decision controls need completion. `/validate-toda`. |
| TC-37 | API withdrew an unpaid Pending unit to Cancelled and immediately accepted a replacement application. Operator garage displayed Withdraw. | PARTIAL | Exercise withdrawal confirmation and refreshed garage capacity in the browser. `/operator-dashboard`, `PUT /franchises/:id/cancel`. |
| TC-38 | API rejected an unpaid unit violation with 400 and a cashier settlement with 403. The licensing violations route rendered. | PARTIAL | Attempt the unpaid unit selection in the real violations workflow. `/manage-revocations`, `POST /violations`. |
| TC-39 | Licensing violations screen rendered. API recorded all three offenses and produced Active - Under Warning, Suspended, and Revoked. Suspended renewal returned HTTP 400. | PARTIAL | Browser progression, grave offense, cross-unit carryover and rejected surrender retention remain open. `/manage-revocations`, `backend/src/utils/disciplineHelper.js`. |
| TC-40 | Operator garage exposed Request Cancellation. API rejected a short typed letter and accepted a valid one. | PARTIAL | Browser blank/short and upload alternatives need completion. `/operator-dashboard`, `RequestCancellationModal.jsx`. |
| TC-41 | Staff browser preview displayed the pending-approval DRAFT watermark. The API restored Active - Under Warning on denial, finalized a new request as Cancelled and archived, and rejected a stale repeat with 409. | PARTIAL | Verify the finalized DOCX path, identifier reuse, and staff decision controls in both browser sizes. `/franchise-approval`, `PUT /franchises/:id/process-cancellation`. |
| TC-42 | Help & Support and administrator tickets screens rendered. The local API created a ticket and returned it in the operator history. Notification and chat-thread reads returned 200, and stress completed 30 Socket.IO handshakes. | PARTIAL | Verify browser ticket submission, two-client messaging, real SMS delivery/logs and Push. `/help-support`, `/admin/tickets`, `/notifications`, `/chat/threads`. |
| TC-43 | Licensing masterlist and reports rendered. The browser opened Historical Archives. Archive pagination and reports returned 200, and a completed renewal retained its prior term. | PARTIAL | Prove populated browser filters, archive pagination, and report exports. `/franchise-masterlist`, `/system-reports`. |
| TC-44 | IT settings and users rendered. API deactivation blocked login with 403, and reactivation restored login. Scoped maintenance blocked applications with 503 and left public verification reachable. | PARTIAL | Complete settings edits and singleton restrictions through supported UI. `/admin/settings`, `/user-management`, `PUT /settings`. |
| TC-45 | Admin backup tab downloaded an encrypted `.json.gz` in the browser. The API rejected tampering and an invalid SHA-256 checksum, returned HTTP 409 while writes were active, and restored exactly 16 collections with HTTP 200 when idle. The restore audit entry was present. | PARTIAL | Complete the restore dialog round trip in the browser. All restore requests went to loopback. `/admin/settings`, `/backups/restore-upload`. |

## Eight Pre-Final panel revisions

Numbering follows the compliance matrix in [Final Defense Summary](../FINAL_DEFENSE_SUMMARY.md).

| # | Revision | Evidence | Status |
|---|---|---|---|
| 1 | Role separation and removal of payment shortcuts | Five roles authenticated. Forbidden routes redirected, APIs returned 403, and the observed staff review offered Send to Cashier. | PASS |
| 2 | TODA roster gate and body number | Valid registration and test OTP worked in T3 Preview. A mismatched body number opened the municipal advisory. The API verified next-number allocation and member creation. | PASS |
| 3 | Manila time and live expiry | Real masterlist Expire preserved the original date and exposed Renew Franchise on mobile. The browser clock and renewal issue-date regressions passed. | FIXED |
| 4 | 30-day TextBee reminders | Notification API was responsive in the isolated environment. End-to-end delivery with gateway, cron, and log still needs a controlled provider session. | OPEN |
| 5 | Voluntary cancellation and archive release | Browser displayed the draft watermark. API denial preserved the warning. Approval archived the unit and a stale repeat returned 409. Final DOCX, identifier reuse, and browser decisions remain open. | PARTIAL |
| 6 | Progressive discipline | Local API denied unpaid permit sanctions, denied cashier settlement, and advanced a permit through warning, suspension and revocation. Grave offense, carryover and browser decisions remain open. | PARTIAL |
| 7 | OCR reset, wrong-document guard, and accordion | Browser issued scan requests when swapping invalid and valid samples and kept unrecognized DL codes blank. Provider extraction and populated accordion actions need completion. | PARTIAL |
| 8 | Backup and disaster recovery | Backup tab opened. A quiet loopback restore restored 16 collections. Encryption, integrity rejection, write coordination and audit logging were observed. Schedule execution and the browser restore dialog remain open. | PARTIAL |

## Findings and changes

- **P0 open.** Render index readiness remains degraded. Local diagnosis identified a separate readiness bug on transient reconnect. Once startup verified indexes, the API now reports healthy again on the same driver connection after it reconnects. When startup index verification fails, it remains degraded. Production cause is unconfirmed. [Database config](../backend/src/config/db.js)
- **P0 fixed locally.** A complete wizard submission failed with HTTP 400 and `MulterError: Too many fields`. Create and reapply now use a bounded parser sized for the full form, with the existing per-file size and type restrictions. The new integration test failed before the fix and passed after it. The same five-step mobile submission returned 201 and saved Pending. [Upload configuration](../backend/src/config/cloudinary.js) · [Multipart regression](../backend/__tests__/operator/documentMetadataAndReapply.test.js)
- **P1 fixed.** Renewal accepted an expired Cedula through the API. The server now rejects prior-year, future, and invalid issue dates using the Manila calendar. [Renewal controller](../backend/src/controllers/franchiseController.js)
- **P1 fixed.** Registration accepted a malformed phone far enough to attempt OTP delivery. The server now rejects malformed Philippine mobile numbers and emails before account creation. It returned HTTP 400 on the development API retest. [Registration controller](../backend/src/controllers/authController.js) · [Registration regression](../backend/__tests__/controllers/authRegistration.test.js)
- **P1 fixed.** The browser clock could move after the API synchronized time. The synchronized clock now advances using monotonic elapsed time, and application and renewal validation use the shared Manila date. [Browser time utility](../frontend/src/utils/serverTime.js)
- **P2 fixed.** Duplicate identifier preflight returned 400. It now returns 409 consistently. [Franchise service](../backend/src/services/franchiseService.js)
- **P2 fixed.** Google One Tap initialized twice when the sign-in view mounted in development. The script and initialization lifecycle now tolerate React's development remount. T3 Preview showed one identity script at 390 px and no duplicate-initialization error. Google returned a provider 403 in the logged-out preview. Live account selection remains unverified. [Google sign-in](../frontend/src/components/GoogleAuthButton.jsx)
- **P2 fixed.** An unsupported TODA removal reason reached MongoDB validation and returned HTTP 500. The route now rejects unsupported reasons and blank explanations before writing. [TODA routes](../backend/src/routes/todaRoutes.js)
- **P2 fixed.** The cancellation denial prompt promised Active even when the previously recorded status was Active - Under Warning. The prompt now describes restoration of the previous status. [Staff cancellation review](../frontend/src/components/admin/StaffCancellationReviewModal.jsx)
- **P2 test infrastructure.** Slow Windows MongoDB startup caused baseline failures. The stress harness and affected tests now allow a longer startup window. The stress harness issues local tokens with the current session claims. [Stress runner](../backend/tests/stress/run-stress-tests.js)
- **P1 documentation.** The older Deliverable #4 now points readers to the current QA matrix and states the current payment order. [Historical test cases](Deliverable4_Test_Cases.html)

## Defense-day checks

- Treat the Render health result as a blocker for the online demo. A Vercel 200 only establishes that the frontend was served.
- Use the OVM / LLSA I account and show `/llsa-dashboard` and `/franchise-approval`. Take the cashier step before signing, pickup, and release.
- Base the live script on the supported routes and the current evidence above. Treat production-backed Google, SMS, Push, OCR, print, and restore coverage as open where indicated.
- The QA Vite and Express listeners were stopped, and T3 Preview listed zero open tabs after cleanup. Production requests were limited to health and header checks.
