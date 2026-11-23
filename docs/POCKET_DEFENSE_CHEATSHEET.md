# 📱 G-TRAMS Capstone Defense: Pocket Cheat Sheet (1-Page Member Guide)
**Gasan Tricycle Records and Application Management System**  
**Pamahalaang Bayan ng Gasan • Marinduque State University (CICS)**  
*I-save ito sa cellphone o i-print sa 1 pirasong papel bago pumasok sa defense room!*

---

## 👤 1. Jhon Kyn Axix H. Cabrigas (Lead Backend Developer & Database Architect)
* **Pangunahing Paksa:** System Architecture, Backend APIs, MongoDB Schemas, Atomic Locks, DRP Backups, at Server Logic.
* **Keywords na Dapat Mong Masabi:**
  - *"Pay-Before-Sign Finite State Machine with Atomic `YYYY-NNN` MTOP Counter"*
  - *"Strict Role-Based Access Control (RBAC) Hard Wall: IT `system_admin` vs OVM / LLSA I vs Municipal Cashier"*
  - *"Server-Authoritative Timezone locked to `Asia/Manila` (UTC+8)"*
  - *"Two-Tier DRP Backup: 16 Collections, AES-256-GCM + SHA-256, Distributed `SystemLock` Restore"*
* **Emergency Rescue Line (Kapag mahirap ang tanong):**
  > *"Magandang obserbasyon po iyan, Sir/Ma'am. Sa kasalukuyang release ng G-TRAMS, ang aming priyoridad ay ang matibay na validation ng prangkisa, atomic concurrency, at audit trail. Isasama po namin ang inyong suhestiyon bilang Phase 2 enhancement."*

---

## 👤 2. Justine S. Lachica (Frontend Developer & UI/UX Designer)
* **Pangunahing Paksa:** 5-Step Operator Wizard, Warm Heritage ("Civic Ledger") Design System, Printable 1:1 Official LGU Forms, Accessibility, at PWA.
* **Keywords na Dapat Mong Masabi:**
  - *"Civic Ledger Design System (#9E2A2B Gasan Maroon & #D4AF37 Gold, WCAG AA Contrast)"*
  - *"5-Step Wizard with Client-Side Image Compression & 1:1 Printable `OfficialApplicationForm`"*
  - *"3-Tier AI OCR Integration (Gemini Vision Cascade + Offline `tesseract.js` + `OCR.space`) with Auto-Reset on File Swap"*
  - *"Mobile-First Zero-Overflow Cards (`break-all`, `min-w-0`) & Senior-Friendly Text Resizing"*
* **Emergency Rescue Line:**
  > *"Siniguro po namin sa frontend na malinaw ang validation feedback at hindi mawawala ang draft ng operator kahit mag-refresh, habang kumpleto pa rin sa print layout ang 1:1 Official LGU forms at E-Resibo."*

---

## 👤 3. Jay Vincent G. Motol (QA & Testing Specialist)
* **Pangunahing Paksa:** Automated Jest Testing, Adversarial Security/Input Validation, TODA Roster Gate, Data Privacy (RA 10173), at Progressive 3-Tier Discipline.
* **Keywords na Dapat Mong Masabi:**
  - *"293 / 293 Passing Automated Tests across 25 Jest Suites (`mongodb-memory-server`)"*
  - *"RA 10173 Data Privacy Compliance: Strict Exclusion of Blood Type, Cedula Amounts, and Signatories during OCR + 12 Salt Rounds Bcrypt"*
  - *"TODA Roster Pre-Registration Gate & Compound Unique Index `{ todaAssociation: 1, bodyNumber: 1 }`"*
  - *"3-Tier Progressive Sanctions (`Warning -> Suspension -> Revocation`) + Cross-Unit Carryover (`disciplineHelper.js`)"*
* **Emergency Rescue Line:**
  > *"Napatunayan po namin sa aming automated Jest at race-condition tests na kahit sabay-sabay mag-submit o mag-review ang dalawang staff, atomic update at unique database constraints ang pumipigil sa duplicate records o conflicting status."*

---

## 👤 4. Ian Simon Francis M. Rey (DevOps & Cloud Engineer)
* **Pangunahing Paksa:** Cloud Deployment (Vercel + Render + MongoDB Atlas), Stress Testing, Municipal Cashier Treasury Controls, TextBee SMS, at Public QR Verification (`/verify/:id`).
* **Keywords na Dapat Mong Masabi:**
  - *"Zero Admin Payment Bypass: Exclusive Over-the-Counter Cash OR Encoding & Immutable `PaymentLedger`"*
  - *"COA-Compliant Daily Treasury Remittance Sheet with Dual Signatures & 1-Click CSV Export"*
  - *"Automated `node-cron` 30-Day Pre-Expiry SMS Reminders (TextBee Gateway) & Weekly DRP Backups (Sunday 12:00 MN PST)"*
  - *"Public QR Code Verification (`/verify/:id`) with Offline PWA Cache & `INACTIVE_OWNER` Guard"*
* **Emergency Rescue Line:**
  > *"Real-time database query po ang ginagamit ng `/verify/:id` QR page na naka-lock sa server time ng munisipyo, kaya nakikita agad ng enforcer kung valid, expired, suspended, o cancelled ang prangkisa kahit baguhin ang oras ng cellphone."*

---

## 🔑 Official Live Demo Accounts (`seed_tester_accounts.js`, Password: `Password123!`)
* **IT / System Admin (`system_admin`):** `admin.tester@gtrams.com` (`/admin-dashboard`)
* **OVM / LLSA I Staff (`bplo_staff` internal role):** `llsa.tester@gtrams.com` (`/llsa-dashboard`)
* **Municipal Cashier (`cashier`):** `cashier.tester@gtrams.com` (`/cashier-dashboard`)
* **TODA President (`toda_president`):** `todapres.tester@gtrams.com` (`/submit-members`)
* **Tricycle Operator 1 (`operator`):** `operator.tester@gtrams.com` (`/operator-dashboard`)
* **Tricycle Operator 2 (`operator`):** `ian.operator@gtrams.com` (`/operator-dashboard`)

---
*Group 5 Capstone Defense • G-TRAMS • Marinduque State University CICS*
