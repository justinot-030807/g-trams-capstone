# G-TRAMS Deliverable #7: Figma Document Design & Layout Architecture

**System:** Gasan Tricycle Regulatory and Automated Management System (G-TRAMS)  
**Deliverable:** Deliverable #7 — User's Manual of the System  
**Institution:** Marinduque State University (MarSU) – College of Information and Computing Sciences (CICS)  
**Municipality:** Municipality of Gasan, Marinduque, Philippines  
**Capstone Group 5:**  
- Jhon Kyn Axix H. Cabrigas (Lead Full-Stack Systems Architect)  
- Justine S. Lachica (Frontend & Figma UI/UX Specialist)  
- Jay Vincent G. Motol (Backend & Security Engineer)  
- Ian Simon Francis M. Rey (QA, Documentation & Compliance Lead)  
**Document Release:** Version 2.4.0 (Production Publication)  
**Date:** November 7, 2026  

---

## 1. Official Figma Document Metadata & Live Links

| Parameter | Value |
|---|---|
| **Document Name** | `Deliverable7_Group5_UsersManual` |
| **Figma File Key** | `xJ54XCwlwabq8pAlUPlUR0` |
| **Live Figma URL** | [https://www.figma.com/design/xJ54XCwlwabq8pAlUPlUR0](https://www.figma.com/design/xJ54XCwlwabq8pAlUPlUR0) |
| **Active Session ID** | `f1712d19-8b76-450d-9d62-b391276813c9` |
| **Authenticated Workspace** | Justine Lachica's team (`team::1700508953543653514`) |
| **Figma Editor Type** | `design` |
| **Code Layer Node ID** | `3:3` |
| **Live Code Preview URL** | [https://www.figma.com/design/xJ54XCwlwabq8pAlUPlUR0?node-id=3-3&autoplay-code-preview=3-3](https://www.figma.com/design/xJ54XCwlwabq8pAlUPlUR0?node-id=3-3&autoplay-code-preview=3-3) |

---

## 2. Canvas Architecture & Node Structure (Page 1 — Node `0:1`)

The Figma document is structured on Page 1 (`0:1`) with an organized visual layout comprising municipal branding assets, a live publication code instance, and 17 dedicated screenshot frames matching all system workflows.

### 2.1 Municipal Branding Seals & Emblems
| Node ID | Node Name | Asset File | Canvas X | Canvas Y | Width | Height | Purpose |
|---|---|---|---|---|---|---|---|
| `1:2` | `Uploaded Image` | `gasan-logo.png` | 0 | 0 | 322 px | 322 px | Official Municipal Seal of Gasan, Marinduque |
| `1:3` | `Uploaded Image` | `gtrams-logo.png` | 362 | 0 | 752 px | 752 px | Official G-TRAMS System Brand Emblem |

### 2.2 Live Publication Multi-Page Manual Layer
| Node ID | Node Name | Type | Canvas X | Canvas Y | Width | Height | Description |
|---|---|---|---|---|---|---|---|
| `3:3` | `Code` | `<code-instance>` | 24,970 | 0 | 1,512 px | 982 px | Live, self-contained multi-page publication document layout (22 pages) compiled with A4 portrait CSS paged media, typographic hierarchy, base64 assets, and pagination. |

### 2.3 Individual Workflow Figure Frames
| Node ID | Frame / Layer Name | Asset Source | Dimensions | Figure # | Manual Section & Context |
|---|---|---|---|---|---|
| `2:2` | `fig1_landing_page` | `docs/manual_assets/fig1_landing_page.png` | 1280 × 800 | Fig 1 | §1 System Overview & Public Citizen's Charter |
| `2:3` | `fig1_login_page` | `docs/manual_assets/fig1_login_page.png` | 1366 × 585 | Fig 2 | §2 Multi-Identifier Authentication Terminal |
| `2:4` | `fig2_register_page` | `docs/manual_assets/fig2_register_page.png` | 1366 × 585 | Fig 3 | §2 Account Registration & Contact Recovery |
| `2:5` | `fig3_forgot_password` | `docs/manual_assets/fig3_forgot_password.png` | 1366 × 585 | Fig 4 | §2 Multi-Channel OTP Password Recovery |
| `2:6` | `fig4_landing_page` | `docs/manual_assets/fig4_landing_page.png` | 1366 × 585 | Fig 1 (Alt) | §3 Public Visitor & Citizen's Charter Portal |
| `2:7` | `fig5_operator_dashboard` | `docs/manual_assets/fig5_operator_dashboard.png` | 1366 × 585 | Fig 6 | §4 Operator Franchise Management Dashboard |
| `2:8` | `fig6_apply_franchise` | `docs/manual_assets/fig6_apply_franchise.png` | 1366 × 585 | Fig 7 | §4 5-Step Online MTOP Application Wizard |
| `2:9` | `fig7_qr_verification` | `docs/manual_assets/fig7_qr_verification.png` | 1366 × 585 | Fig 5 | §3 Public Roadside QR Verification Portal |
| `2:10` | `fig8_toda_roster` | `docs/manual_assets/fig8_toda_roster.png` | 1366 × 585 | Fig 10 | §5 TODA Roster Management & Verification |
| `2:11` | `fig9_cashier_dashboard` | `docs/manual_assets/fig9_cashier_dashboard.png` | 1366 × 585 | Fig 14 | §7 Municipal Cashier Payment Terminal |
| `2:12` | `fig11_bplo_dashboard` | `docs/manual_assets/fig11_bplo_dashboard.png` | 1366 × 585 | Fig 11 | §6 BPLO Regulatory Operations Dashboard |
| `2:13` | `fig12_bplo_approval_queue` | `docs/manual_assets/fig12_bplo_approval_queue.png` | 1366 × 585 | Fig 12 | §6 BPLO Multi-Stage Approval Pipeline |
| `2:14` | `fig13_franchise_masterlist` | `docs/manual_assets/fig13_franchise_masterlist.png` | 1366 × 585 | Fig 13 | §6 Municipal Franchise Masterlist Registry |
| `2:15` | `fig14_admin_dashboard` | `docs/manual_assets/fig14_admin_dashboard.png` | 1366 × 585 | Fig 15 | §8 IT Administrator Operations Telemetry |
| `2:16` | `fig15_user_management` | `docs/manual_assets/fig15_user_management.png` | 1366 × 585 | Fig 16 | §8 User Management & RBAC Directory |
| `2:17` | `fig16_admin_database_backup` | `docs/manual_assets/fig16_admin_database_backup.png` | 1366 × 585 | Fig 17 | §8 DRP Database Backup & Snapshot Console |
| `2:18` | `fig16_admin_settings` | `docs/manual_assets/fig16_admin_settings.png` | 1366 × 585 | Fig 17 (Alt) | §8 Municipal Policy & Ordinance Configuration |

---

## 3. Official Municipal Design Tokens & Color Palette

The G-TRAMS user manual strictly adheres to the official municipal branding tokens established in `frontend/tailwind.config.js`:

```css
:root {
  /* Brand Identity Colors */
  --color-primary-maroon: #9E2A2B;       /* Primary Gasan Municipal Maroon */
  --color-primary-maroon-dark: #7A1B22;  /* Maroon Accent / Active State */
  --color-primary-maroon-subtle: #FDF2F4;/* Light Maroon Background Tint */
  --color-accent-gold: #D4AF37;          /* Municipal Gold Trim & Badges */
  --color-accent-gold-light: #F4D03F;    /* Soft Gold Highlight */
  
  /* Neutral & Canvas Colors */
  --color-canvas-bg: #F6F5F3;            /* Publication Page Background */
  --color-surface-white: #FFFFFF;        /* Card & Container Surface */
  --color-border-neutral: #E4E1DC;       /* Subtle Card Borders */
  --color-text-primary: #1F1D1B;         /* High-Contrast Charcoal Body Text (14.2:1 WCAG AAA) */
  --color-text-muted: #6B6761;           /* Secondary Metadata & Captions (4.6:1 WCAG AA) */
  
  /* Semantic Status Colors */
  --color-status-active-text: #15803D;   /* Approved / Active Franchise Green */
  --color-status-active-bg: #F0FDF4;
  --color-status-active-border: #BBF7D0;
  
  --color-status-review-text: #B45309;   /* For Payment / In Review Amber */
  --color-status-review-bg: #FFFBEB;
  --color-status-review-border: #FDE68A;
  
  --color-status-danger-text: #B91C1C;   /* Expired / Suspended / Revoked Red */
  --color-status-danger-bg: #FEF2F2;
  --color-status-danger-border: #FECACA;
  
  /* Callout & Note Containers */
  --color-callout-info-bg: #EFF6FF;
  --color-callout-info-border: #BFDBFE;
  --color-callout-info-text: #1E40AF;
  
  --color-callout-warning-bg: #FFFBEB;
  --color-callout-warning-border: #FDE68A;
  --color-callout-warning-text: #92400E;
}
```

---

## 4. Typography Scale & Hierarchy

All textual content follows a disciplined hierarchy optimized for readability on desktop and print media:

| Element | Typeface | Size | Weight | Line Height | Color | Usage |
|---|---|---|---|---|---|---|
| **Cover Title** | IBM Plex Sans / System Sans | 24 pt | 800 (Bold) | 1.15 | `#9E2A2B` | Manual front cover main title |
| **Cover Subtitle** | IBM Plex Sans / System Sans | 12 pt | 600 (Semi-Bold) | 1.30 | `#D4AF37` | Cover deliverable specification |
| **Section Header (H1)** | IBM Plex Sans / System Sans | 15 pt | 700 (Bold) | 1.25 | `#9E2A2B` | Major section headers (§1 – §9) |
| **Subsection Header (H2)** | IBM Plex Sans / System Sans | 11.5 pt | 700 (Bold) | 1.30 | `#1F1D1B` | Workflow and role milestones |
| **Topic Header (H3)** | IBM Plex Sans / System Sans | 9.5 pt | 600 (Semi-Bold) | 1.35 | `#7A1B22` | Step-by-step procedures & fields |
| **Body Paragraph** | IBM Plex Sans / System Sans | 9.0 pt | 400 (Regular) | 1.50 | `#1F1D1B` | Operational documentation text |
| **Figure Caption Title** | IBM Plex Sans / System Sans | 8.0 pt | 700 (Bold) | 1.40 | `#9E2A2B` | Figure label (`Figure X: ...`) |
| **Figure Caption Body** | IBM Plex Sans / System Sans | 8.0 pt | 400 (Regular) | 1.40 | `#6B6761` | Detailed screen description |
| **Code & Serial Numbers** | IBM Plex Mono / Consolas | 8.0 pt | 500 (Medium) | 1.40 | `#1F1D1B` | OR Numbers, Route IDs, Cron expressions |
| **Running Header/Footer** | IBM Plex Sans / System Sans | 8.0 pt | 400 (Regular) | 1.20 | `#6B6761` | Running metadata & page counters |

---

## 5. Optical Alignment & Multi-Page Layout Standards

1. **Page Geometry:**
   - Standard: International ISO 216 `A4 Portrait` (210 mm × 297 mm).
   - Margins: `18mm top`, `14mm right`, `18mm bottom`, `14mm left`.
   - Content Area: 182 mm × 261 mm.
2. **Page Budget & Section Distribution (22 Pages):**
   - **Page 1:** Front Cover Page with municipal seals, formal title, institutional metadata, and author team roster.
   - **Page 2:** Document Revision History Table, Executive Table of Contents, and Citations.
   - **Pages 3–4:** Section 1 – System Overview, Legal Mandate, Citizen's Charter, Architecture & System Requirements (Figure 1).
   - **Pages 5–6:** Section 2 – Getting Started, Authentication Infrastructure, RBAC Matrix & Password Recovery (Figures 2, 3, 4).
   - **Pages 7–8:** Section 3 – Public Visitor & Passenger Guide, Roadside QR Verification & Municipal Fare Matrix (Figure 5).
   - **Pages 9–11:** Section 4 – Tricycle Operator Guide: 5-Step MTOP Wizard, AI OCR Intake, Fleet Ceiling (Figures 6, 7, 8).
   - **Pages 12–13:** Section 5 – TODA President Guide: Paper Roster Digitization, Member Verification & Delisting (Figures 9, 10).
   - **Pages 14–16:** Section 6 – BPLO Licensing Officer Guide: Dual-Pane Review, 4-Stage Approval Pipeline, Sanctions, Masterlist (Figures 11, 12, 13).
   - **Pages 17–18:** Section 7 – Municipal Cashier Guide: Payment Terminal, OR Serialization, COA Remittance CSV (Figure 14).
   - **Pages 19–20:** Section 8 – System Administrator & IT Operations Guide: Telemetry, Global Policy, Weekly DRP Backup & Restore (Figures 15, 16, 17).
   - **Pages 21–22:** Section 9 – Troubleshooting Matrix, Error Codes, Emergency Support Directory & Municipal Sign-Off.
3. **Figure Container Architecture:**
   - Every screenshot is rendered inside a bordered, rounded card (`border: 1px solid #E4E1DC; border-radius: 6px; background: #FFFFFF;`).
   - Images are centered with `max-width: 96%; max-height: 250px; object-fit: contain;`.
   - Captions are structured in a dedicated caption footer (`background: #FDF2F4; border-top: 1px solid #E4E1DC; padding: 6px 12px;`).
4. **Header and Footer Protocol:**
   - **Header:** Discrete maroon border line (`1px solid #9E2A2B`), left-aligned system badge ("G-TRAMS System Documentation"), right-aligned section identifier.
   - **Footer:** Subdued gray rule (`1px solid #E4E1DC`), left-aligned institutional attribution ("Marinduque State University CICS • Municipality of Gasan"), right-aligned page counter ("Page X of 22").

---

## 6. Verification and Inspection Commands

To independently inspect and verify the live Figma document and assets:

1. **Verify Figma Authentication & Team Membership:**
   ```json
   { "ServerName": "figma_figma", "ToolName": "whoami", "Arguments": {} }
   ```
2. **Inspect Canvas Hierarchy & Node Tree:**
   ```json
   {
     "ServerName": "figma_figma",
     "ToolName": "get_metadata",
     "Arguments": {
       "fileKey": "xJ54XCwlwabq8pAlUPlUR0",
       "nodeId": "0:1",
       "sessionId": "f1712d19-8b76-450d-9d62-b391276813c9"
     }
   }
   ```
3. **Generate Frame Screenshot from Figma Desktop / Cloud:**
   ```json
   {
     "ServerName": "figma_figma",
     "ToolName": "get_screenshot",
     "Arguments": {
       "fileKey": "xJ54XCwlwabq8pAlUPlUR0",
       "nodeId": "2:2",
       "sessionId": "f1712d19-8b76-450d-9d62-b391276813c9"
     }
   }
   ```
4. **Direct Browser Navigation:**
   Visit [https://www.figma.com/design/xJ54XCwlwabq8pAlUPlUR0](https://www.figma.com/design/xJ54XCwlwabq8pAlUPlUR0) to view all canvas frames, typography styles, and live code layers interactively.
