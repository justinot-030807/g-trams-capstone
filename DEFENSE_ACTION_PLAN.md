# G-TRAMS Post-Pre-Final Action Plan & Defense Master Matrix

> **Layunin:** Maging sentral na "Source of Truth" at checklist para sa pag-aayos ng lahat ng napuna ng panel sa Pre-Final Defense bago sumabak sa Final Defense.
> **Paraan ng Paggawa:** *Multi-Conversation AI Workflow* (Isang Chat Thread kada Task Pillar para iwas context rot at memory hallucination).

---

## 📋 Defense Compliance Matrix (Gabay sa Panelists)

| # | Puna ng Panelist | Sanhi sa Lumang System | Solusyon at Action Taken | Katayuan |
|---|---|---|---|---|
| **1** | **Role Confusion:** Magkahalo ang Admin at Staff; may Cashier shortcut sa Admin | Iisang "Admin" role lang ang humahawak ng IT settings at pag-apruba ng prangkisa | Hiwalay na **System Admin** (IT maintenance lang) at **BPLO Staff** (Franchise operations). Tanggal ang cashier shortcuts. | `[x] Completed` |
| **2** | **Registration Harang:** Hindi nahaharang ang wala sa TODA roster; walang unique Body No. | Pangalan lang ang tinitingnan at sa bandang loob na ng proseso | Harang agad sa `/register` base sa **Full Name + Assigned Body Number** laban sa TODA Masterlist. | `[x] Completed` |
| **3** | **Timezone & Expiration:** Nababago ang status kapag binago ang oras ng laptop ng panelist | Naka-depende sa local/browser clock at walang dynamic status evaluation | **Server-Authoritative Time (Asia/Manila)**. Dynamic getter at midnight cron para sa automated expired status. | `[x] Completed` |
| **4** | **Voluntary Cancellation:** Walang malinaw na UI at daloy para sa voluntary cancellation | Reject button lang ang mayroon para sa pending applications | Dedicated Operator Cancellation Request (May dahilan + letter upload) at hiwalay na Staff Cancellation Queue. | `[ ] Pending` |
| **5** | **Violation Policy:** Dere-derechong revoke nang walang due process o warning | Walang progressive discipline matrix sa system settings | **3-Tier Policy:** 1st Offense (Warning) → 2nd Offense (Fine / Suspension) → 3rd Offense (Revocation). | `[x] Completed` |
| **6** | **AI Scanner & UI:** Parang hardcoded ang scan, walang warning sa maling document; accordion bug | Hindi nare-reset ang state kada bagong file; kulang ang classification guard sa Gemini | Auto-reset ng scan state, AI document classification check ("Hindi ito LTO CR/OR"), at CSS fix sa accordion. | `[x] Completed` |

---

## 🧵 Roadmap ng 6 Dedicated Conversations (Multi-Conversation Workflow)

---

### 🔹 Thread 1: Role Separation & RBAC (System Admin vs. BPLO Staff)
* **Pangunahing Gawain:**
  - [x] I-update ang `userModel.js` role enums: `system_admin`, `bplo_staff`, `cashier`, `toda_president`, `operator`, `driver`.
  - [x] **System Admin Portal:** System Settings, User Accounts Management, Audit Logs, Violation Policy Configuration, Database Backup/Health. *(Bawal mag-approve o mag-review ng prangkisa).*
  - [x] **BPLO Staff Portal:** Franchise Applications Queue (`Needs Review`, `For Signing`, `Ready for Pickup`), Document Verification, Endorsement.
  - [x] **Cashier Isolation:** Tanggalin ang anumang payment link o bypass sa loob ng admin/staff views. Cashier portal lang ang may karapatang mag-issue ng LGU OR.
* **Mga Files na Sakop:**
  - `backend/src/models/userModel.js`
  - `backend/src/controllers/authController.js`
  - `backend/src/middleware/auth.js`
  - `frontend/src/components/common/Navbar.jsx`
  - `frontend/src/routes/AdminRoutes.jsx`
* **Prompt para sa Chat 1:**
  > *"Basahin ang `PROJECT_CONTEXT.md` at Thread 1 sa `DEFENSE_ACTION_PLAN.md`. Ang tanging gagawin lang natin sa chat na ito ay ang Role Separation (System Admin vs BPLO Staff) at pagtanggal ng Cashier shortcut sa admin. Plan muna bago execute."*

---

### 🔹 Thread 2: Registration Roster Harang & Body Number Validation
* **Pangunahing Gawain:**
  - [x] I-update ang schema ng TODA Roster para may dalawang primary fields: `operatorName` at `bodyNumber` (hal. `GAS-001`, `042`).
  - [x] Sa `/register` ng Operator, hingin ang: **Full Name**, **TODA Association**, at **Assigned Body Number**.
  - [x] Magpatupad ng strict pre-registration endpoint: `POST /api/v1/auth/verify-roster`.
  - [x] Kapag wala sa roster o hindi tugma ang pangalan at body number, harangin agad at mag-render ng opisyal na LGU advisory notice.
* **Mga Files na Sakop:**
  - `backend/src/models/todaModel.js`
  - `backend/src/models/todaSubmission.js`
  - `backend/src/models/userModel.js`
  - `backend/src/utils/rosterValidator.js`
  - `backend/src/controllers/todaController.js`
  - `backend/src/controllers/authController.js`
  - `frontend/src/pages/Register.jsx`
  - `frontend/src/components/GoogleOnboardingModal.jsx`
  - `frontend/src/components/common/LguAdvisoryModal.jsx`
  - `frontend/src/pages/toda/SubmitMembers.jsx`
  - `frontend/src/pages/admin/ValidateTODA.jsx`
  - `frontend/src/pages/admin/UserManagement.jsx`
* **Prompt para sa Chat 2:**
  > *"Basahin ang `PROJECT_CONTEXT.md` at Thread 2 sa `DEFENSE_ACTION_PLAN.md`. Ang tanging gagawin lang natin sa chat na ito ay ang Registration Harang gamit ang TODA Roster at Body Number validation. Plan muna bago execute."*

---

### 🔹 Thread 3: Server-Authoritative Timezone & Dynamic Expiration Fix
* **Pangunahing Gawain:**
  - [x] I-lock ang lahat ng date comparisons sa **Server Time (Philippine Standard Time, UTC+8 / Asia/Manila)**.
  - [x] Alisin ang reliance sa `new Date()` ng browser sa pagpapasya ng status.
  - [x] Maglagay ng dynamic Mongoose Virtual o Query Middleware:
    $$\text{Kung } \text{expiryDate} < \text{serverDate} \text{ at status} == \text{'Active'} \implies \text{I-return bilang } \mathbf{'Expired'}$$
  - [x] Mag-schedule ng daily Node-Cron job na nag-a-update ng DB status at nagti-trigger ng 30-day renewal notification alerts.
* **Mga Files na Sakop:**
  - `backend/src/models/franchiseModel.js`
  - `backend/src/services/franchiseService.js`
  - `backend/src/services/cronService.js`
  - `frontend/src/components/common/StatusBadge.jsx`
* **Prompt para sa Chat 3:**
  > *"Basahin ang `PROJECT_CONTEXT.md` at Thread 3 sa `DEFENSE_ACTION_PLAN.md`. Ang tanging gagawin lang natin sa chat na ito ay ang Server-Authoritative Timezone at Dynamic Expiration logic upang mapasa ang laptop clock change test ng panel. Plan muna bago execute."*

---

### 🔹 Thread 4: Voluntary Franchise Cancellation Module (Module 8)
* **Pangunahing Gawain:**
  - [x] Maglagay ng **"Request Cancellation"** action sa Operator Dashboard (para sa mga aktibong prangkisa).
  - [x] Modal form:
    1. Reason Dropdown (*Relocation / Lipat TODA*, *Sale of Unit*, *Personal Cessation*).
    2. Remarks / Specific details.
    3. Document Upload: Handwritten o formal Cancellation Letter.
  - [x] Status transition: `Active` → `Cancellation Requested` → `Cancelled`.
  - [x] BPLO Staff "Cancellations Queue" para suriin ang sulat at i-finalize ang cancellation nang hindi dumadaan sa Cashier.
* **Mga Files na Sakop:**
  - `backend/src/models/franchiseModel.js` (o subdocument `cancellationDetails`)
  - `backend/src/controllers/franchiseController.js`
  - `frontend/src/pages/operator/OperatorDashboard.jsx`
  - `frontend/src/pages/admin/FranchiseApproval.jsx`
* **Prompt para sa Chat 4:**
  > *"Basahin ang `PROJECT_CONTEXT.md` at Thread 4 sa `DEFENSE_ACTION_PLAN.md`. Ang tanging gagawin lang natin sa chat na ito ay ang Voluntary Franchise Cancellation workflow para kay Operator at BPLO Staff. Plan muna bago execute."*

---

### 🔹 Thread 5: Progressive Violation & Penalty Policy
* **Pangunahing Gawain:**
  - [x] Sa System Admin Settings: Pagsasaayos ng Violation Types, Severity Levels, at Sanctions.
  - [x] **Progressive Discipline Engine:**
    - 1st Offense: Official Warning (Status: `Active - Under Warning`)
    - 2nd Offense: Fine / Temporary Suspension (Status: `Suspended`)
    - 3rd Offense o Grave Offense: Revocation (Status: `Revoked`)
  - [x] BPLO Staff "Record Violation" form na may auto-count ng previous offenses bago mag-desisyon ang system.
* **Mga Files na Sakop:**
  - `backend/src/models/ticketModel.js`
  - `backend/src/models/systemSettingsModel.js`
  - `backend/src/controllers/ticketController.js`
  - `frontend/src/pages/admin/AdminViolations.jsx`
* **Prompt para sa Chat 5:**
  > *"Basahin ang `PROJECT_CONTEXT.md` at Thread 5 sa `DEFENSE_ACTION_PLAN.md`. Ang tanging gagawin lang natin sa chat na ito ay ang Progressive Violation Matrix (1st, 2nd, 3rd offense) at settings. Plan muna bago execute."*

---

### 🔹 Thread 6: AI Scanner Authenticity, Accordion UI, at SMS Dispatcher
* **Pangunahing Gawain:**
  - [x] **AI Scanner State Reset:** I-clear agad ang cached values kapag may bagong file na pinili (`resetScanState`).
  - [x] **Document Classification Guard:** Turuan ang Gemini Vision prompt na i-verify kung ang imahe ay lehitimong dokumento. Kapag selfie o ibang litrato, mag-return ng:
    `{ isValidDocument: false, message: "Hindi ito valid na LTO document." }`
  - [x] **Accordion Fix:** Ayusin ang styling at click propagation sa accordion button.
  - [x] **Simulated SMS Dispatcher:** Maglagay ng functional SMS audit log sa backend / dashboard na nagpapakita ng timestamped dispatch messages (e.g., *"SMS sent to +639XXXXXXXXX: Ang inyong prangkisa ay mag-e-expire sa loob ng 30 araw."*).
* **Mga Files na Sakop:**
  - `frontend/src/pages/operator/ApplyFranchise.jsx`
  - `backend/src/services/documentVerificationService.js`
  - `backend/src/services/notificationService.js`
* **Prompt para sa Chat 6:**
  > *"Basahin ang `PROJECT_CONTEXT.md` at Thread 6 sa `DEFENSE_ACTION_PLAN.md`. Ang tanging gagawin lang natin sa chat na ito ay ang AI Scanner state reset, document validation guard, accordion UI fix, at SMS simulated dispatcher. Plan muna bago execute."*

---

## 🚀 Paano Gamitin ang Action Plan na Ito:
1. Pumili ng **isang Thread** na sisimulan.
2. Magbukas ng **Bagong Conversation / Chat**.
3. I-paste ang nakalaang **Prompt**.
4. Pagkatapos ma-code at ma-test, markahan ng `[x]` ang checklist sa file na ito at mag-`git commit`.
5. Ulitin sa susunod na Thread hanggang mabuo ang buong matrix!
