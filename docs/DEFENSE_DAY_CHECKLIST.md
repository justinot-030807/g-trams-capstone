# G-TRAMS Final Defense Day: Pre-Flight Checklist & Survival Guide
**Gasan Tricycle Records and Application Management System**  
**Pamahalaang Bayan ng Gasan • Marinduque State University (CICS)**  
*Group 5 Capstone Project • Academic Year 2026–2027*

---

## ⏱️ 1 Oras Bago Pumasok sa Defense Room (Pre-Flight Checklist)

### 1. Hardware & Connectivity Prep
- [ ] **Magdala ng Mobile Hotspot / Backup Data:** Huwag umasa 100% sa Wi-Fi ng eskwelahan. Siguraduhing may load ang kahit isang cellphone na may malakas na signal (Smart/Globe) sa Gasan/Boac.
- [ ] **Chargers & Extension Cord:** Isaksak agad ang laptop sa charger bago magsimula para hindi bumaba ang CPU performance sa battery saver mode.
- [ ] **Projector Resolution Check:** I-set ang display resolution ng presenter laptop sa `1920x1080` o `1366x768` (Duplicate Display / Extend).
- [ ] **Cellphone para sa QR Live Demo:** Siguraduhing malinis ang camera lens ng cellphone na gagamitin sa pag-scan ng QR code sa harap ng panel.

### 2. Browser Tabs Setup (Ang "Two-Browser Strategy")
Bago tawagin ng panel, ihanda na ang dalawang browser window:

* **Window 1 (Normal Chrome Window — Projector Display):**
  - Tab 1: `file:///c:/Users/Hp/GTRAMS/docs/presentation.html` *(Pindutin ang 'F' para mag-fullscreen kapag magsisimula na)*
  - Tab 2: `https://g-trams-official.vercel.app/` *(Landing Page)*
  - Tab 3: Naka-login bilang Operator: `operator.tester@gtrams.com` / `Password123!`
* **Window 2 (Incognito Window — Background Admin/LGU):**
  - Tab 1: Naka-login bilang OVM / LLSA I Staff: `llsa.tester@gtrams.com` / `Password123!` (`/llsa-dashboard`)
  - Tab 2: Naka-login bilang Cashier: `cashier.tester@gtrams.com` / `Password123!` (`/cashier-dashboard`)
  - Tab 3: Naka-login bilang System Admin: `admin.tester@gtrams.com` / `Password123!` *(Naka-open sa Tab 5: Database Backup & DRP sa `/admin/settings`)*

> **Bakit dalawang window?** Para kapag nag-submit si Operator sa Window 1, lilipat ka lang agad sa Incognito Window para ipakita na real-time na pumasok ang aplikasyon sa OVM / LLSA I at Cashier nang hindi kailangang mag-log out at mag-retype ng credentials!

---

## 🎭 Body Language at Pagsagot sa Panel (Presentation Etiquette)

1. **Huwag Mataranta Kapag May Puna:**
   - Kapag may nakitang issue o may tinanong ang panelist, huwag sumagot ng *"Hindi po kasi namin alam"* o magsisihan sa entablado.
   - **Tamang Sagot:** *"Magandang obserbasyon po iyan, Sir/Ma'am. Sa kasalukuyang release, ang logic po namin ay [ipaliwanag ang ginawa]. Pero napakaganda po ng inyong suhestiyon at maaari po naming isama iyan bilang future enhancement sa Phase 2."*
2. **Magtulungan Bilang Isang Grupo:**
   - Kapag tungkol sa database, backend, atomic locks, o server: Hayaang si **Jhon Kyn** (Lead Backend & DB Architect) ang sumagot.
   - Kapag tungkol sa UI, 5-step forms, responsive design, o operator experience: Si **Justine** (Frontend & UI/UX Designer) ang sumagot.
   - Kapag tungkol sa automated testing, validation errors, security, o bug prevention: Si **Jay Vincent** (QA & Testing Specialist) ang sumagot.
   - Kapag tungkol sa deployment, cloud hosting, stress tests, DRP, at backup: Si **Ian Simon** (DevOps & Cloud Engineer) ang sumagot.
3. **Maging Direkta sa Sagot:**
   - Sagutin muna ng *"Opo"* o *"Wala po"* bago magpaliwanag ng teknikal na detalye. Mas gusto ng panel ang diretsong sagot kaysa paligoy-ligoy.

---

## 🏆 Summary ng Inyong mga "Superweapon" (Mga Panlaban sa Tanong)

Kapag naghanap ng butas ang panel, gamitin ang mga sumusunod na matitibay na ebidensya:

1. **Kung hanapan ng Data Backup:**
   - Ipakita ang **System Admin Settings Tab 5**. Sabihing may weekly automated cron (Linggo 12:00 MN PST / `Asia/Manila`) across **16 collections**, encrypted gamit ang AES-256-GCM + SHA-256, at may **Direct Offline Gzip Download** (`.json.gz`).
2. **Kung subukang manipulahin ang oras ng laptop:**
   - Sabihing **Server-Authoritative** ang oras na naka-lock sa **Philippine Standard Time (`Asia/Manila`, UTC+8)**. Kahit baguhin ang clock ng laptop, server time ang sinusunod — at may live **`Expire`** button sa OVM / LLSA I Masterlist para sa ligtas na demo.
3. **Kung hanapan ng Audit o Remittance sa Pera:**
   - Ipakita ang **Daily Treasury Remittance Sheet** sa Cashier dashboard (`/cashier-dashboard`) na may pirmahan ng Cashier at Municipal Treasurer at may 1-click CSV export, plus immutable `PaymentLedger`.
4. **Kung hanapan ng Test Results:**
   - Ipakita ang **293 / 293 Passing Tests (25 Jest Test Suites)** at ang built-in `backend/tests/stress/` concurrency/memory suite.
5. **Kung hanapan ng User Manual:**
   - Ipakita ang **`Deliverable7_Group5_GTRAMS_UsersManual.pdf`** at ang kumpletong Final Manuscript.

---

*Isinulat at inihanda para sa Tagumpay ng Group 5 (G-TRAMS). Magtiwala sa inyong pinaghirapan!*
