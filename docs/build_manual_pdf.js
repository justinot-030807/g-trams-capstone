const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting G-TRAMS Deliverable #7 Publication-Grade PDF Builder...');

// Helper to convert image to base64 data URI
function getBase64Image(filename, candidateDirs = ['manual_assets', '../remotion/assets', '../frontend/public']) {
  for (const dir of candidateDirs) {
    const fullPath = path.resolve(__dirname, dir, filename);
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(filename).replace('.', '') || 'png';
      const data = fs.readFileSync(fullPath).toString('base64');
      return `data:image/${ext};base64,${data}`;
    }
  }
  return '';
}

// Load all 17 numbered figure assets + official logos
const images = {
  gasanLogo: getBase64Image('gasan-logo.png'),
  gtramsLogo: getBase64Image('gtrams-logo.png'),
  fig1: getBase64Image('fig4_landing_page.png') || getBase64Image('screen1_landing.png'),
  fig2: getBase64Image('fig1_login_page.png'),
  fig3: getBase64Image('fig2_register_page.png'),
  fig4: getBase64Image('fig3_forgot_password.png'),
  fig5: getBase64Image('screen4_verify.png') || getBase64Image('fig7_qr_verification.png'),
  fig6: getBase64Image('fig5_operator_dashboard.png'),
  fig7: getBase64Image('fig6_apply_franchise.png'),
  fig8: getBase64Image('screen2_application.png') || getBase64Image('fig6_apply_franchise.png'),
  fig9: getBase64Image('sample_toda_roster.png'),
  fig10: getBase64Image('fig8_toda_roster.png'),
  fig11: getBase64Image('fig11_bplo_dashboard.png'),
  fig12: getBase64Image('fig12_bplo_approval_queue.png'),
  fig13: getBase64Image('fig13_franchise_masterlist.png') || getBase64Image('screen3_masterlist.png'),
  fig14: getBase64Image('fig9_cashier_dashboard.png'),
  fig15: getBase64Image('fig14_admin_dashboard.png'),
  fig16: getBase64Image('fig15_user_management.png'),
  fig17: getBase64Image('fig16_admin_settings.png') || getBase64Image('fig16_admin_database_backup.png'),
};

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Deliverable #7 – User's Manual of the System: G-TRAMS</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 14mm 18mm 14mm;
      @bottom-right {
        content: counter(page);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #6B6761;
      }
      @bottom-left {
        content: "G-TRAMS Deliverable #7: User's Manual of the System • Municipality of Gasan";
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #6B6761;
      }
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.5;
      color: #1F1D1B;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
    }
    
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    /* COVER PAGE */
    .cover-page {
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      padding: 25mm 15mm 20mm 15mm;
      border: 3px double #9E2A2B;
      background: linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%);
    }
    
    .cover-logos {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 30px;
      margin-bottom: 15px;
    }
    
    .cover-logo-img {
      width: 75px;
      height: 75px;
      object-fit: contain;
    }
    
    .univ-header {
      margin-bottom: 20px;
    }
    .univ-title {
      font-size: 15pt;
      font-weight: 800;
      color: #1F1D1B;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0;
    }
    .college-title {
      font-size: 12pt;
      font-weight: 700;
      color: #9E2A2B;
      margin: 4px 0 0 0;
    }
    .dept-title {
      font-size: 9.5pt;
      font-weight: 600;
      color: #6B6761;
      margin: 2px 0 0 0;
    }
    .address {
      font-size: 8.5pt;
      color: #6B6761;
      margin: 3px 0 0 0;
    }
    
    .cover-main {
      margin: 20px 0;
    }
    .deliverable-badge {
      display: inline-block;
      background-color: #9E2A2B;
      color: #FFFFFF;
      font-size: 10pt;
      font-weight: 700;
      padding: 5px 16px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 15px;
    }
    .system-title {
      font-size: 28pt;
      font-weight: 900;
      color: #9E2A2B;
      line-height: 1.15;
      margin: 0 0 8px 0;
      letter-spacing: 1px;
    }
    .system-subtitle {
      font-size: 12.5pt;
      font-weight: 700;
      color: #D4AF37;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 15px 0;
    }
    .doc-type {
      font-size: 17pt;
      font-weight: 800;
      color: #1F1D1B;
      border-top: 2px solid #D4AF37;
      border-bottom: 2px solid #D4AF37;
      padding: 8px 0;
      margin: 15px auto;
      max-width: 460px;
      letter-spacing: 0.5px;
    }
    
    .meta-box {
      background: #FFFFFF;
      border: 1px solid #E4E1DC;
      border-left: 4px solid #9E2A2B;
      border-radius: 6px;
      padding: 14px 22px;
      text-align: left;
      font-size: 8.5pt;
      margin-top: 15px;
      display: inline-block;
      min-width: 380px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.04);
    }
    .meta-row {
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
    }
    .meta-label {
      font-weight: 700;
      color: #6B6761;
      margin-right: 15px;
    }
    .meta-value {
      font-weight: 600;
      color: #1F1D1B;
    }
    
    .cover-footer {
      font-size: 8.5pt;
      color: #6B6761;
      margin-top: 15px;
      line-height: 1.4;
    }
    
    /* SECTION HEADINGS */
    h1 {
      color: #9E2A2B;
      font-size: 14pt;
      font-weight: 800;
      border-bottom: 2px solid #9E2A2B;
      padding-bottom: 4px;
      margin-top: 22px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    h2 {
      color: #1F1D1B;
      font-size: 11pt;
      font-weight: 700;
      border-left: 3.5px solid #D4AF37;
      padding-left: 8px;
      margin-top: 18px;
      margin-bottom: 8px;
    }
    
    h3 {
      color: #9E2A2B;
      font-size: 9.5pt;
      font-weight: 700;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    
    h1, h2, h3, .step-header {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    
    p {
      margin: 0 0 8px 0;
      text-align: justify;
    }
    
    ul, ol {
      margin: 0 0 10px 0;
      padding-left: 20px;
    }
    
    li {
      margin-bottom: 3px;
    }
    
    /* TABLES */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 8.5pt;
    }
    
    th, td {
      border: 1px solid #D6D3D1;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    
    th {
      background-color: #9E2A2B;
      color: #FFFFFF;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.5px;
    }
    
    tr:nth-child(even) {
      background-color: #F8F7F5;
    }
    
    /* FIGURE CONTAINERS */
    .figure-container {
      margin: 12px 0 16px 0;
      text-align: center;
      background: #FAFAF9;
      border: 1px solid #E4E1DC;
      border-radius: 5px;
      padding: 8px;
      page-break-inside: avoid;
    }
    
    .figure-img {
      max-width: 96%;
      max-height: 85mm;
      height: auto;
      border: 1px solid #D6D3D1;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.08);
      display: inline-block;
    }
    
    .figure-caption {
      font-size: 8pt;
      font-weight: 700;
      color: #6B6761;
      margin-top: 6px;
      line-height: 1.35;
      padding: 0 8px;
    }
    
    /* CALLOUT BOXES */
    .callout {
      background-color: #F8F5EE;
      border-left: 3.5px solid #D4AF37;
      padding: 8px 12px;
      border-radius: 0 4px 4px 0;
      margin: 10px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }
    .callout-title {
      font-weight: 700;
      color: #9E2A2B;
      margin-bottom: 3px;
    }
    
    .step-box {
      background: #FFFFFF;
      border: 1px solid #E4E1DC;
      border-left: 3.5px solid #9E2A2B;
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .step-header {
      font-size: 10pt;
      font-weight: 700;
      color: #9E2A2B;
      margin-bottom: 4px;
    }
    .step-purpose {
      font-size: 8.5pt;
      color: #6B6761;
      margin-bottom: 6px;
      font-style: italic;
    }
    .step-result {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      color: #166534;
      padding: 5px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
      margin-top: 6px;
    }
    
    .badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
      background-color: #9E2A2B;
      color: #FFF;
      text-transform: uppercase;
    }
    .badge-gold {
      background-color: #D4AF37;
      color: #1F1D1B;
    }
    .badge-green {
      background-color: #15803D;
      color: #FFF;
    }
    
    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dotted #D6D3D1;
      font-size: 8.5pt;
    }
    .toc-section {
      font-weight: 700;
      color: #9E2A2B;
    }
    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #A8A29E;
      margin: 0 8px 3px 8px;
    }
    .toc-page {
      font-weight: 600;
      color: #6B6761;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-logos">
      ${images.gasanLogo ? `<img src="${images.gasanLogo}" class="cover-logo-img" alt="Municipality of Gasan Seal">` : ''}
      ${images.gtramsLogo ? `<img src="${images.gtramsLogo}" class="cover-logo-img" alt="G-TRAMS Emblem">` : ''}
    </div>

    <div class="univ-header">
      <h2 class="univ-title">Marinduque State University</h2>
      <h3 class="college-title">College of Information and Computing Sciences</h3>
      <div class="dept-title">Department of Information Technology</div>
      <p class="address">Panfilo M. Manguera Sr. Rd., Brgy. Tanza, Boac, Marinduque, Philippines 4900</p>
    </div>
    
    <div class="cover-main">
      <div class="deliverable-badge">Deliverable #7</div>
      <h1 class="system-title">G-TRAMS</h1>
      <div class="system-subtitle">Gasan Tricycle Regulatory and Automated Management System</div>
      <div class="doc-type">USER’S MANUAL OF THE SYSTEM</div>
      
      <div class="meta-box">
        <div class="meta-row">
          <span class="meta-label">Municipal Client:</span>
          <span class="meta-value">Municipality of Gasan, Marinduque</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Municipal Mayor:</span>
          <span class="meta-value">HON. LIDANY A. LAO-BALDO</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Authorizing Bodies:</span>
          <span class="meta-value">Sangguniang Bayan • MTFRB • BPLO</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">System Version:</span>
          <span class="meta-value">v2.4.0 (Production Release)</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Deployment URL:</span>
          <span class="meta-value">https://g-trams-official.vercel.app</span>
        </div>
        <div class="meta-row" style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #E4E1DC;">
          <span class="meta-label">Capstone Group:</span>
          <span class="meta-value">Group 5 (CICS - MarSU)</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Lead Backend Architect:</span>
          <span class="meta-value">Jhon Kyn Axix H. Cabrigas</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Frontend Lead & UI/UX:</span>
          <span class="meta-value">Justine S. Lachica</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Quality Assurance Lead:</span>
          <span class="meta-value">Jay Vincent G. Motol</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">DevOps & Cloud Engineer:</span>
          <span class="meta-value">Ian Simon Francis M. Rey</span>
        </div>
      </div>
    </div>
    
    <div class="cover-footer">
      <strong>Pamahalaang Bayan ng Gasan • Sangguniang Bayan • MTFRB</strong><br>
      Published for Academic Year 2026–2027 • Approved for Municipal Implementation
    </div>
  </div>

  <div class="page-break"></div>

  <!-- DOCUMENT REVISION & TABLE OF CONTENTS -->
  <div>
    <h1>Document Metadata & Revision History</h1>
    <table>
      <thead>
        <tr>
          <th>Version</th>
          <th>Release Date</th>
          <th>Authors / Contributors</th>
          <th>Summary of Operational Milestones</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>v1.0.0</strong></td>
          <td>September 14, 2026</td>
          <td>Group 5 (CICS)</td>
          <td>Initial baseline for Proposal Defense; preliminary system architecture and wireframe workflows.</td>
        </tr>
        <tr>
          <td><strong>v1.8.0</strong></td>
          <td>October 18, 2026</td>
          <td>Justine S. Lachica, Jay Vincent G. Motol</td>
          <td>Midterm release incorporating multi-role authentication, 5-step MTOP wizard, and BPLO queue.</td>
        </tr>
        <tr>
          <td><strong>v2.2.0</strong></td>
          <td>November 2, 2026</td>
          <td>Jhon Kyn Axix H. Cabrigas, Ian Simon Francis M. Rey</td>
          <td>Gemini Vision AI OCR parsing, COA physical OR booklet serialization, and Sunday 12MN backups.</td>
        </tr>
        <tr>
          <td><strong>v2.4.0</strong></td>
          <td>November 7, 2026</td>
          <td>Group 5 (CICS)</td>
          <td>Final production release for Final Defense and LGU Turn-over; comprehensive 6-role manual and 17 figure catalog.</td>
        </tr>
      </tbody>
    </table>

    <h1>Executive Table of Contents</h1>
    <div style="margin: 12px 0;">
      <div class="toc-item">
        <span class="toc-section">1. System Overview & Citizen's Charter</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Section 1</span>
      </div>
      <div class="toc-item">
        <span class="toc-section">2. Shared Authentication & Security Infrastructure</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Section 2</span>
      </div>
      <div class="toc-item">
        <span class="toc-section">3. Public Visitor & Passenger Guide</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Section 3</span>
      </div>
      <div class="toc-item">
        <span class="toc-section">4. Tricycle Operator Guide (5-Step Wizard & 2-Unit Quota)</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Section 4</span>
      </div>
      <div class="toc-item">
        <span class="toc-section">5. TODA President Guide (Roster AI OCR & Delisting)</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Section 5</span>
      </div>
      <div class="toc-item">
        <span class="toc-section">6. BPLO Licensing Officer Guide (Review Console & Sanctions)</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Section 6</span>
      </div>
      <div class="toc-item">
        <span class="toc-section">7. Municipal Cashier Guide (OR-GASAN-2026 Serialization & Remittance)</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Section 7</span>
      </div>
      <div class="toc-item">
        <span class="toc-section">8. System Administrator & IT Operations Guide (Disaster Recovery & Telemetry)</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Section 8</span>
      </div>
      <div class="toc-item">
        <span class="toc-section">9. Troubleshooting, FAQs & Support Directory</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Section 9</span>
      </div>
    </div>

    <h1>1. System Overview & Citizen's Charter</h1>
    <p>
      The <strong>Gasan Tricycle Regulatory and Automated Management System (G-TRAMS)</strong> is an enterprise-grade municipal e-governance platform commissioned by the Local Government Unit (LGU) of Gasan, Province of Marinduque. Developed by Marinduque State University - College of Information and Computing Sciences (MarSU CICS) BSIT Capstone Group 5, G-TRAMS automates the regulatory lifecycle of motorized tricycles-for-hire across the municipality.
    </p>

    <h2>1.1 Municipal Mandate & Legal Framework</h2>
    <ul>
      <li><strong>Republic Act No. 7160 (Local Government Code of 1991):</strong> Section 447 (a)(3)(vi) delegates the franchising and regulation of tricycles-for-hire to the Sangguniang Bayan and Municipal Mayor via the Municipal Tricycle Franchising and Regulatory Board (MTFRB).</li>
      <li><strong>Municipal Franchising Ordinance Section 4 (Fleet Quota Limit):</strong> Enforces a statutory individual operator ceiling of <strong>maximum two (2) motorized tricycle units</strong> to eliminate commercial monopoly, prevent unauthorized subleasing, and ensure equitable livelihood distribution among Gasan transport operators.</li>
      <li><strong>Republic Act No. 11032 (Ease of Doing Business & ARTA):</strong> Mandates digital citizen service delivery with strict Service Level Agreements (SLAs), completing simple evaluations within 3 working days and complex regulatory audits within 7 working days.</li>
      <li><strong>Republic Act No. 10173 (Data Privacy Act of 2012):</strong> Strictly enforces <strong>Data Minimization</strong>; sensitive biometric markers (such as blood type) are deliberately excluded from AI OCR extraction routines, recording only legally mandated licensing attributes.</li>
      <li><strong>Commission on Audit (COA) Guidelines:</strong> Precludes unverified online payments; fees are collected strictly via Over-the-Counter Cashier operations and bound to physical serialized Official Receipt booklets (<code>OR-GASAN-2026-XXXX</code>).</li>
    </ul>

    <h2>1.2 The 5-Step Application Lifecycle</h2>
    <p>
      G-TRAMS establishes an immutable, five-stage Citizen's Charter workflow:
      <br>
      <strong>Step 1: Online Filing</strong> (Operator files application, vehicle specs, and documents via 5-Step Wizard; AI OCR pre-check) &rarr;
      <strong>Step 2: BPLO Scrutiny</strong> (Dual-Pane inspection, OCR discrepancy check, and physical inspection scheduling) &rarr;
      <strong>Step 3: Treasury Settlement</strong> (Cashier collects ₱500 fee, logs serialized receipt <code>OR-GASAN-2026-XXXX</code>) &rarr;
      <strong>Step 4: Mayoral Sign-Off</strong> (Hon. Lidany A. Lao-Baldo & MTFRB authorize permit) &rarr;
      <strong>Step 5: Physical Release</strong> (Operator claims sticker; instant watermarked e-Copy with dynamic QR activates on mobile device).
    </p>

    <h2>1.3 Geographic Scope & Route Zones</h2>
    <p>
      The territorial jurisdiction of G-TRAMS covers all <strong>25 official Barangays</strong> of the Municipality of Gasan, categorized into three (3) distinct operational route zones:
    </p>
    <ul>
      <li><strong>Central Zone (Poblacion Town Proper Loop):</strong> Barangay I (Poblacion), Barangay II (Poblacion), Barangay III (Poblacion). Commercial center, municipal hall, public market, and port.</li>
      <li><strong>North Zone (Northern Coastal & Upland Route):</strong> Bahi, Bangbang, Cabugao, Mangiliol, Masiga, Tapuyan, Tiguion. Northern agriculture, fishing barangays, and circum-island road link.</li>
      <li><strong>South Zone (Southern Coastal & Interior Valley Route):</strong> Antipolo, Bachao Ibaba, Bachao Ilaya, Bacong-Bacong, Banot, Banuyo, Bognuyan, Dawis, Dili, Libtangin, Mahunig, Matandang Gasan, Pangi, Pinggan, Tabionan.</li>
    </ul>

    <h2>1.4 Transport Associations Directory (17 Accredited TODAs)</h2>
    <p>
      Every commercial tricycle unit in Gasan must affiliate with an accredited transport association:
      BATODA, POB TODA, GT TODA, LUG TODA, NBI TODA, BANGBANG IPIL TODA, TAB TODA, TIGUION TODA, MASIGA TODA, MAT TODA, PG TODA, 4B TODA, DPAB TODA, ILAYA TODA, GASAN CENTRAL TODA, BAHI TODA, and NON-TODA (monitored municipal independent commercial units).
    </p>

    <div class="figure-container">
      <img src="${images.fig1}" class="figure-img" alt="G-TRAMS Landing Page">
      <div class="figure-caption">Figure 1: G-TRAMS Public Citizen Landing Page & Municipal Portal — Features the top navigation bar with Gasan municipal seal, live statistics counter (Registered Operators, Accredited TODAs, Active Franchises), dual Call-to-Action buttons ("LOG IN" and "REGISTER"), municipal mandate announcement, and 5-step Citizen's Charter interactive service cards.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 2: AUTHENTICATION & SECURITY -->
  <div>
    <h1>2. Shared Authentication & Security Infrastructure</h1>
    <p>
      G-TRAMS implements a centralized, role-based authentication gateway that guarantees high security while ensuring accessibility for transport workers and administrative personnel alike.
    </p>

    <h2>2.1 Multi-Identifier Login Architecture</h2>
    <p>
      To accommodate operators without active email addresses, the login portal (<code>/login</code>) accepts either an <strong>11-digit Philippine mobile phone number</strong> (e.g. <code>09123456789</code>) or a <strong>verified email address</strong>. Credentials are cryptographically salt-hashed using bcrypt, and authenticated sessions are governed by JSON Web Tokens (JWT).
    </p>

    <div class="step-box">
      <div class="step-header">Procedure 2.1: Portal Sign-In</div>
      <div class="step-purpose">Purpose: Authenticate authorized users and route them to their assigned role dashboard.</div>
      <ol>
        <li>Navigate to <code>https://g-trams-official.vercel.app/login</code>.</li>
        <li>Enter your registered 11-digit mobile number or email address.</li>
        <li>Type your account password. Click the eye toggle glyph to check visibility if needed.</li>
        <li>Click the maroon <strong>"Log In"</strong> button.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Session token is issued and user is immediately directed to their role console.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig2}" class="figure-img" alt="Login Terminal">
      <div class="figure-caption">Figure 2: Shared Multi-Identifier Authentication Login Terminal — Secure login portal accessible via /login supporting both 11-digit Philippine mobile numbers (09XXXXXXXXX) and verified email addresses, password field with visibility toggle, Google OAuth single-sign-on integration, and direct link to password recovery.</div>
    </div>

    <h2>2.2 Account Registration with Secondary Recovery Contact</h2>
    <p>
      To prevent permanent account lockout when mobile SIM cards are damaged or lost, the registration workflow enforces the collection of a mandatory secondary recovery contact (backup mobile phone or email).
    </p>

    <div class="step-box">
      <div class="step-header">Procedure 2.2: New Account Registration</div>
      <div class="step-purpose">Purpose: Onboard new tricycle operators and transport leaders with account recovery safeguards.</div>
      <ol>
        <li>Click <strong>"Register"</strong> on the portal header.</li>
        <li>Input your Full Legal Name matching official government credentials.</li>
        <li>Enter your Primary Mobile Contact and a mandatory Secondary Recovery Contact.</li>
        <li>Select your official Barangay Residency from Gasan's 25 official barangays.</li>
        <li>Select your affiliated TODA Association and input your unit body number.</li>
        <li>Configure a password (minimum 8 characters with uppercase and numeric digit).</li>
        <li>Click <strong>"Create Account"</strong> and enter the 6-digit OTP code dispatched to your contact.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Account is created in MongoDB Atlas and user is transitioned to their active garage.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig3}" class="figure-img" alt="Registration Form">
      <div class="figure-caption">Figure 3: Citizen & Operator Account Registration Interface — Multi-field onboarding console collecting legal applicant name, primary mobile contact, mandatory secondary recovery contact (backup mobile/email) to prevent lockouts, residency selection from Gasan's 25 official barangays, accredited TODA affiliation, and initial body number specification.</div>
    </div>

    <h2>2.3 Multi-Channel Password Recovery via 6-Digit OTP</h2>
    <p>
      If credentials are lost, operators can request a 6-digit One-Time PIN (OTP) valid for five (5) minutes dispatched via SMS or email to either their primary or secondary recovery contact.
    </p>

    <div class="figure-container">
      <img src="${images.fig4}" class="figure-img" alt="Forgot Password Modal">
      <div class="figure-caption">Figure 4: Multi-Channel Password Recovery & OTP Verification Modal — Security modal displaying the red alert shield, contact input field (juan@gmail.com or 09123456789), 6-digit one-time PIN (OTP) verification mechanism with 5-minute timeout window, and password reset form.</div>
    </div>

    <h2>2.4 Role-Based Access Control (RBAC) Governance Matrix</h2>
    <table>
      <thead>
        <tr>
          <th>Capability / Route</th>
          <th>Public</th>
          <th>Operator</th>
          <th>TODA Pres</th>
          <th>BPLO Officer</th>
          <th>Cashier</th>
          <th>Sys Admin</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Citizen's Charter & Announcements</td>
          <td>Read</td>
          <td>Read</td>
          <td>Read</td>
          <td>Read</td>
          <td>Read</td>
          <td>Read</td>
        </tr>
        <tr>
          <td>Roadside QR Verification (<code>/verify/:id</code>)</td>
          <td>Read</td>
          <td>Read</td>
          <td>Read</td>
          <td>Read</td>
          <td>Read</td>
          <td>Read</td>
        </tr>
        <tr>
          <td>5-Step Online MTOP Wizard</td>
          <td>❌</td>
          <td>Full</td>
          <td>Full</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
        </tr>
        <tr>
          <td>TODA Roster Digitization & OCR</td>
          <td>❌</td>
          <td>❌</td>
          <td>Full</td>
          <td>Review</td>
          <td>❌</td>
          <td>❌</td>
        </tr>
        <tr>
          <td>Dual-Pane Document Review & Approvals</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
          <td>Full</td>
          <td>❌</td>
          <td>❌</td>
        </tr>
        <tr>
          <td>Treasury Payment Terminal & OR Logging</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
          <td>Full</td>
          <td>❌</td>
        </tr>
        <tr>
          <td>COA Daily Remittance CSV Export</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
          <td>Full</td>
          <td>❌</td>
        </tr>
        <tr>
          <td>IT Telemetry, DRP Restore & Policy</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
          <td>Full</td>
        </tr>
      </tbody>
    </table>
    <div class="callout">
      <div class="callout-title">Strict Separation of Duties (SoD) Guardrail</div>
      System Administrators are restricted to IT infrastructure and cannot review or approve franchises. Cashiers are restricted to fee receipting and cannot alter permit details or reject applications.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 3: PUBLIC VISITOR & PASSENGER GUIDE -->
  <div>
    <h1>3. Public Visitor & Passenger Guide</h1>
    <p>
      G-TRAMS provides transparent public services accessible to all citizens, tourists, and law enforcement officers without requiring account registration or login.
    </p>

    <h2>3.1 Public Portal Navigation & Announcements</h2>
    <p>
      Citizens navigating to <code>https://g-trams-official.vercel.app/</code> can review real-time transport telemetry (Registered Operators, Accredited TODAs, Active Franchises), official municipal bulletins, and traffic advisories published by the Sangguniang Bayan.
    </p>

    <h2>3.2 Roadside Mobile Camera QR Verification (<code>/verify/:id</code>)</h2>
    <p>
      Every franchised tricycle in Gasan features an official QR code sticker affixed to the sidecar windshield and driver digital ID. Any smartphone camera can scan this code to independently verify vehicle legality in real time.
    </p>

    <div class="step-box">
      <div class="step-header">Procedure 3.1: Roadside QR Inspection</div>
      <div class="step-purpose">Purpose: Verify legitimate commercial tricycle franchises and detect colorum units roadside in under 3 seconds.</div>
      <ol>
        <li>Open your smartphone camera or any QR scanner application.</li>
        <li>Aim the camera at the physical QR decal on the tricycle windshield or driver digital ID.</li>
        <li>Tap the recognized URL link: <code>https://g-trams-official.vercel.app/verify/:id</code>.</li>
        <li>Inspect the official LGU verification card:
          <ul>
            <li><strong>Validity Badge:</strong> Green (VALID LGU GASAN FRANCHISE) or Red (EXPIRED / REVOKED).</li>
            <li><strong>Operator Profile:</strong> Full Legal Name, photo, and registered contact.</li>
            <li><strong>Vehicle Specifications:</strong> Plate Number, Motor Number, Chassis Number, Make, and Body Number.</li>
            <li><strong>Association & Route:</strong> Accredited TODA, assigned Route Zone, and permit expiration date.</li>
          </ul>
        </li>
      </ol>
      <div class="step-result">✓ Expected Result: Official municipal verification renders immediately, confirming genuine registration records.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig5}" class="figure-img" alt="Public Roadside QR Verification">
      <div class="figure-caption">Figure 5: Public Roadside Mobile QR Verification Terminal (/verify/:id) — Passenger and traffic enforcer mobile verification screen displaying real-time franchise validity badge (Active / Under Warning / Expired / Suspended), operator legal name, verified tricycle photograph, LTO plate number, engine/motor number, chassis number, assigned body number, and authorized route zone.</div>
    </div>

    <h2>3.3 Official Municipal Fare & Tariff Matrix Calculation</h2>
    <p>
      Pursuant to Sangguniang Bayan Municipal Fare Ordinances, tricycle fares in Gasan are standardized:
    </p>
    <ul>
      <li><strong>Base Regular Fare:</strong> <strong>₱15.00</strong> for the first kilometer within municipal routes.</li>
      <li><strong>Succeeding Kilometer Rate:</strong> <strong>₱2.50</strong> for each succeeding kilometer traveled.</li>
      <li><strong>Mandatory 20% Discount (RA 11364):</strong> Students, Senior Citizens, and Persons with Disability (PWD) are entitled to a 20% statutory discount:
        $$\text{Discounted Fare} = \text{Regular Fare} \times 0.80$$
      </li>
    </ul>
    <div class="callout">
      <div class="callout-title">Passenger Protection & Fare Complaint Hotline</div>
      In case of fare overcharging or refusal to convey passengers, report the body number and plate number to the BPLO Helpdesk at (042) 342-1234 or email support@gasan.ph.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 4: TRICYCLE OPERATOR GUIDE -->
  <div>
    <h1>4. Tricycle Operator Guide</h1>
    <p>
      The Operator Portal empowers commercial tricycle operators to manage their fleet, file online franchise applications, and access tamper-evident digital credentials.
    </p>

    <h2>4.1 Operator Garage Dashboard & Fleet Quota Limit (Max 2 Units)</h2>
    <p>
      Upon signing in, operators access their central garage dashboard:
    </p>
    <ul>
      <li><strong>Fleet Quota Progress Bar (Section 4 Enforcement):</strong> Enforces the statutory limit of <strong>maximum two (2) units</strong> per individual:
        <br>
        <code>Unit Capacity 1 / 2 — 1 Slot(s) Available</code> (or <code>Unit Capacity 2 / 2 — Quota Limit Reached</code>).
        Attempting to file a 3rd unit hard-locks the application form with an ordinance alert.
      </li>
      <li><strong>Lifecycle Status Tracker:</strong> Tracks milestones: <code>Applied</code> &rarr; <code>Pending Review</code> &rarr; <code>For Payment</code> &rarr; <code>For Signing</code> &rarr; <code>Ready for Pickup</code> &rarr; <code>Active</code>.</li>
      <li><strong>"Fix Issues" Direct Resolution:</strong> Red discrepancy alerts allow operators to click "Fix Issues", jumping straight to the erroneous step with misread data highlighted in yellow.</li>
    </ul>

    <div class="figure-container">
      <img src="${images.fig6}" class="figure-img" alt="Operator Dashboard">
      <div class="figure-caption">Figure 6: Tricycle Operator Main Garage Dashboard — Comprehensive operator fleet management console displaying the Section 4 statutory quota progress bar ("Unit Capacity 1 / 2 - 1 Slot(s) Available"), active unit status badges, application lifecycle tracker (Needs Attention alert with direct Fix Issues button), digital ID shortcut, and floating municipal help widget.</div>
    </div>

    <h2>4.2 5-Step Online MTOP Application Wizard</h2>
    <div class="step-box">
      <div class="step-header">Procedure 4.1: Filing an Online MTOP Application</div>
      <div class="step-purpose">Purpose: Apply for New Franchise, Annual Renewal, or Transfer/Dropping without municipal queueing.</div>
      <ol>
        <li>Click <strong>"Apply for Franchise"</strong> from the Operator Dashboard.</li>
        <li><strong>Step 1 (Operator & Driver):</strong> Confirm legal name and barangay address. Toggle Operator-is-Driver or input hired driver credentials with Driver's License photo and expiry date.</li>
        <li><strong>Step 2 (Vehicle Specs):</strong> Enter LTO Plate, Engine, Chassis numbers, Make/Model, and Year. The system executes duplicate prevention queries.</li>
        <li><strong>Step 3 (TODA & Barangay Clearances):</strong> Select affiliated TODA (green verified badge renders if matched in roster) and upload Barangay Clearance.</li>
        <li><strong>Step 4 (Cedula / CTC):</strong> Enter current fiscal year Cedula serial number, issue date, and upload document photo.</li>
        <li><strong>Step 5 (Review & Affidavit):</strong> Review summary, confirm sworn affidavit under Article 172 of the Revised Penal Code, and submit. Interrupted sessions are saved via <code>localforage</code> draft autosave.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Application transitions to "Pending Review" with a reference ID.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig7}" class="figure-img" alt="Apply Franchise Wizard">
      <div class="figure-caption">Figure 7: 5-Step Online MTOP Application Wizard (Operator & Route Validation) — Multi-step online franchise filing interface showing 20% progress tracker (Step 1 of 5: Operator & Driver), applicant profile fields, barangay residency dropdown, TODA verification badge (✓ Verified in Roster), and route conflict detector (⚠ Route Mismatch warning).</div>
    </div>

    <h2>4.3 Multimodal AI OCR Document Intake & Dual LTO Segregation</h2>
    <p>
      G-TRAMS features multimodal Google Gemini Vision OCR (<code>gemini-3.8-flash</code>) to parse uploaded credentials and automatically populate technical fields:
    </p>
    <ul>
      <li><strong>Dual LTO Segregation:</strong> Dedicated separate upload slots for the <strong>Certificate of Registration (CR)</strong> (ownership and technical specifications) and the latest <strong>Official Receipt (OR)</strong> (annual LTO roadworthiness payment).</li>
      <li><strong>Pre-Check Validation:</strong> Blurry or cut-off documents trigger instant confidence warnings prompting re-capture before final submission.</li>
    </ul>

    <div class="figure-container">
      <img src="${images.fig8}" class="figure-img" alt="AI OCR Document Intake">
      <div class="figure-caption">Figure 8: Multimodal AI OCR Document Intake & LTO Credential Segregation — Dedicated upload slots for LTO Certificate of Registration (CR), LTO Official Receipt (OR), Driver's License (with RA 10173 data minimization), Barangay Clearance, and Community Tax Certificate (Cedula), highlighting real-time Gemini Vision OCR text parsing and automated field pre-population.</div>
    </div>

    <h2>4.4 Data Minimization Compliance (RA 10173)</h2>
    <p>
      Under the Data Privacy Act of 2012 (RA 10173), non-essential biometric markers such as <strong>blood type</strong> and medical indicators are strictly omitted from OCR extraction schemas. The system captures only Driver's License Number, Expiry, DL restriction codes (Code A/A1), and birthdate.
    </p>

    <h2>4.5 Digital MTOP Certificate & Watermarked e-Copy Retrieval</h2>
    <p>
      When an application reaches <code>Ready for Pickup</code> or <code>Active</code>, clicking <strong>"View E-Copy"</strong> renders the high-resolution digital permit featuring the diagonal security watermark:
      <br>
      <code>"APPROVED - ELECTRONIC COPY • VALID ISSUANCE"</code>
      <br>
      and dynamic QR verification code along with Mayor Hon. Lidany A. Lao-Baldo's official signature.
    </p>

    <h2>4.6 Voluntary Franchise Cancellation & Support Ticketing</h2>
    <p>
      Operators relinquishing commercial operations can click <strong>"Request Voluntary Cancellation"</strong>, specify grounds (Vehicle Sold, Out of Service, Transfer of Residence), and route their request for dropping certification. The integrated Help & Support module enables submitting inquiries directly to municipal IT staff.
    </p>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 5: TODA PRESIDENT GUIDE -->
  <div>
    <h1>5. TODA President Guide</h1>
    <p>
      TODA Presidents maintain accredited transport association rosters, issue digital clearances, and enforce collision-free body number allocations.
    </p>

    <h2>5.1 Association Member Directory & Status Verification</h2>
    <p>
      Navigating to <code>/submit-members</code> renders the association management console. The header displays association metrics (e.g. <em>GASAN CENTRAL TODA</em>, 89 Members, 2 Active Units). The directory provides real-time search by driver name, body number, and plate number.
    </p>

    <h2>5.2 Gemini Vision AI OCR Digitization of Paper Rosters</h2>
    <p>
      To eliminate manual typing of historical paper member logbooks, TODA Presidents can upload physical document scans for automated AI transcription.
    </p>

    <div class="step-box">
      <div class="step-header">Procedure 5.1: Digitizing Paper Rosters</div>
      <div class="step-purpose">Purpose: Convert physical association paper masterlists into certified database records via AI OCR.</div>
      <ol>
        <li>Select <strong>Tab 2: "Upload Roster Document"</strong> in the TODA portal.</li>
        <li>Upload a clear photo or scan of your physical paper membership sheet.</li>
        <li>Click <strong>"Process Roster with AI OCR"</strong>. Gemini Vision parses tabular rows into Operator Name, Body Number, and Plate Number.</li>
        <li>Review extracted rows in the editable staging table; correct typos or click "+ Add Member" to append rows.</li>
        <li>Click <strong>"Submit Certified Roster to BPLO"</strong> to commit the roster to the municipal masterlist.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Member roster is accredited and indexed for instant validation during operator application filing.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig9}" class="figure-img" alt="Scanned TODA Roster">
      <div class="figure-caption">Figure 9: Physical TODA Association Member Masterlist Scanned Document — Authenticated paper roster from Gasan Central TODA utilized as input for Gemini Vision AI OCR digitization, detailing operator names, unit body numbers, and plate registrations.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig10}" class="figure-img" alt="TODA Roster Management Console">
      <div class="figure-caption">Figure 10: TODA President Association Member Management Terminal — Association administration console displaying active member count (89), active commercial units (2), multi-tab layout ("Member Roster", "Upload Roster Document", "Removal Requests"), member search filter, and PWA installation prompt.</div>
    </div>

    <h2>5.3 Association Body Number Collision Prevention</h2>
    <p>
      G-TRAMS enforces unique compound database indexing (<code>todaAssociation + bodyNumber</code>). Attempting to assign an existing body number triggers an immediate collision block:
      <br>
      <code>"Duplicate Body Number Detected: Unit #X is already registered to [Driver Name]. Collision prevented."</code>
    </p>

    <h2>5.4 Member Delisting & Removal Requests</h2>
    <p>
      Under Tab 3 ("Removal Requests"), presidents can petition BPLO to delist inactive or non-compliant drivers by selecting standard grounds (Relocated, Bylaw Violation, Non-payment of dues, Resigned).
    </p>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 6: BPLO LICENSING OFFICER GUIDE -->
  <div>
    <h1>6. BPLO Licensing Officer Guide</h1>
    <p>
      The Business Permits and Licensing Office (BPLO) serves as the primary municipal regulatory authority, evaluating applications, inspecting vehicles, and enforcing traffic sanctions.
    </p>

    <h2>6.1 Operations Dashboard & Pipeline Telemetry</h2>
    <p>
      The BPLO Dashboard (<code>/bplo-dashboard</code>) displays live executive KPIs: Active Franchises, Pending Approvals, In Pipeline, Expiring Units, and the TODA fleet distribution chart.
    </p>

    <div class="figure-container">
      <img src="${images.fig11}" class="figure-img" alt="BPLO Operations Dashboard">
      <div class="figure-caption">Figure 11: BPLO Operations Dashboard & Executive KPI Telemetry — Central licensing control center showing live operational metrics (Active Franchises, Pending Approvals, In Pipeline, Expiring Units), compliance pipeline distribution (50% compliant units), TODA fleet charts, and daily application intake queues.</div>
    </div>

    <h2>6.2 Dual-Pane Document Review Console & AI OCR Discrepancy Checks</h2>
    <p>
      Clicking "Review" on any application opens the high-resolution Dual-Pane Review Console:
    </p>
    <ul>
      <li><strong>Left Canvas (Document Inspection):</strong> High-resolution viewer with zoom, rotation (90° CW/CCW), brightness (100%–175%), contrast (100%–150%), and pan controls for scrutinizing LTO OR/CR, Cedula, Driver's License, and clearances.</li>
      <li><strong>Right Panel (AI OCR Cross-Check):</strong> Side-by-side comparison highlighting matching data with green badges and mismatches with amber discrepancy tags. Flags third-party CR ownership requiring a Deed of Sale.</li>
      <li><strong>Concurrency Lock:</strong> Real-time WebSocket locks prevent two officers from modifying the same record simultaneously.</li>
    </ul>

    <h2>6.3 Multi-Stage Franchise Approval Pipeline</h2>
    <p>
      Applications transition through discrete operational queues: <code>Needs Review</code> &rarr; <code>For Payment</code> (sent to Cashier) &rarr; <code>For Signing</code> (Mayor/MTFRB) &rarr; <code>Ready for Pickup</code> &rarr; <code>Active</code>. Every action includes a 10-second undo toast countdown.
    </p>

    <div class="figure-container">
      <img src="${images.fig12}" class="figure-img" alt="BPLO Approval Queue">
      <div class="figure-caption">Figure 12: BPLO Multi-Stage Franchise Approval & Evaluation Queue — Structured evaluation pipeline displaying segregated workflow tabs (Needs Review, For Payment, For Signing, Ready for Pickup, Cancellations Queue, Approved, Rejected), multi-parameter filters (All TODAs, Types, Barangays, ⚠ Flagged Only), and FIFO sorting.</div>
    </div>

    <h2>6.4 Progressive Traffic Sanctions & Disciplinary Enforcement</h2>
    <p>
      Through <code>/manage-revocations</code>, officers log traffic citations with automated penalty progression:
    </p>
    <ul>
      <li><strong>1st Offense:</strong> Official Warning &rarr; Status: <code>Active - Under Warning</code>.</li>
      <li><strong>2nd Offense:</strong> 15-day suspension + ₱500 municipal fine &rarr; Status: <code>Suspended</code>.</li>
      <li><strong>3rd Offense:</strong> Permanent Franchise Revocation &rarr; Status: <code>Revoked</code>.</li>
      <li><strong>Grave Offense (Colorum):</strong> Direct Revocation on first occurrence.</li>
    </ul>

    <h2>6.5 Municipal Franchise Masterlist Registry & PDF Export</h2>
    <p>
      The Masterlist Registry (<code>/franchise-masterlist</code>) indexes all active, expired, and historical records. Officers can execute batch MTOP certificate printing and export the full registry to PDF.
    </p>

    <div class="figure-container">
      <img src="${images.fig13}" class="figure-img" alt="Franchise Masterlist">
      <div class="figure-caption">Figure 13: Municipal Franchise Masterlist Registry & Historical Archive — Official municipal registry detailing verified franchise units, plate numbers (143-ABC, 4528-TC), affiliated operators (Jhon Kyn Axix Cabrigas, Jay Vincent Motol), TODA assignments, status tags (Active, Cancelled), and one-click "Print / Save as PDF" export button.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 7: MUNICIPAL CASHIER GUIDE -->
  <div>
    <h1>7. Municipal Cashier Guide</h1>
    <p>
      The Cashier Portal is an isolated financial terminal restricted to Municipal Treasury disbursing officers for regulatory fee collection and COA audit compliance.
    </p>

    <h2>7.1 Isolated Treasury Terminal & Security Controls</h2>
    <p>
      Operating at Treasury Counter 2 (<code>/cashier-dashboard</code>), the terminal displays live financial metrics: Awaiting Collection, Today's Total Collections (PHP), and Total Processed Transactions.
    </p>

    <h2>7.2 Over-the-Counter Cash Collection & Fee Schedule</h2>
    <p>
      The cashier verifies the assessed regulatory fees: Basic Franchise Fee (₱500.00), Sticker/Inspection Fee (₱150.00), and late monthly renewal penalties (₱50.00/month). Payments are collected in Cash Over-the-Counter.
    </p>

    <h2>7.3 Mandatory Physical Official Receipt (OR) Serialization</h2>
    <p>
      In compliance with COA regulations, the cashier issues a physical paper receipt from the municipal booklet and enters the serialized number:
      <br>
      <code>OR-GASAN-2026-XXXX</code> (e.g. <code>OR-GASAN-2026-0042</code>).
      <br>
      The system enforces uppercase formatting and uniqueness to prevent duplicate receipt accounting.
    </p>

    <div class="figure-container">
      <img src="${images.fig14}" class="figure-img" alt="Cashier Payment Terminal">
      <div class="figure-caption">Figure 14: Municipal Treasury Cashier Collection Terminal — Isolated financial collection console showing real-time revenue metric cards ("Awaiting Collection", "Today's Collections", "Total Processed"), searchable payment queue, mandatory physical Official Receipt booklet serialization (OR-GASAN-2026-XXXX), and daily COA remittance reconciliation.</div>
    </div>

    <h2>7.4 COA Daily Remittance CSV Export & Turnover Voucher Printing</h2>
    <div class="step-box">
      <div class="step-header">Procedure 7.1: Daily Treasury Revenue Reconciliation</div>
      <div class="step-purpose">Purpose: Generate COA-compliant daily financial turnover sheets and accounting export at shift close (5:00 PM).</div>
      <ol>
        <li>Click <strong>"Daily Remittance Sheet"</strong> on the Cashier Terminal action bar.</li>
        <li>Review the summary breakdown: total transactions, cash receipts, and total municipal turnover.</li>
        <li>Click <strong>"Export Remittance CSV"</strong> to download: <code>GTRAMS_Treasury_Daily_Remittance_YYYY-MM-DD.csv</code>.</li>
        <li>Click <strong>"Print Turnover Voucher"</strong> to print the audit turnover sheet complete with signature blocks for the Collecting Cashier and Municipal Treasurer.</li>
        <li>Submit physical cash collections and signed vouchers to the Treasury vault.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Treasury reconciliation is completed in under 1 minute with 100% audit accuracy.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 8: SYSTEM ADMINISTRATOR & IT OPERATIONS GUIDE -->
  <div>
    <h1>8. System Administrator & IT Operations Guide</h1>
    <p>
      The IT Administrator module governs user directory security, system telemetry, global ordinance configurations, and automated disaster recovery protocols.
    </p>

    <h2>8.1 IT Diagnostics & Server Telemetry Monitoring</h2>
    <p>
      The IT Dashboard (<code>/admin-dashboard</code>) monitors Node.js process runtime uptime, heap memory utilization, MongoDB Atlas ping latency in milliseconds, cluster connection state, and live security audit logs.
    </p>

    <div class="figure-container">
      <img src="${images.fig15}" class="figure-img" alt="System Admin Dashboard">
      <div class="figure-caption">Figure 15: System Administrator IT Diagnostics & Server Telemetry Dashboard — Municipal IT oversight console displaying server status, MongoDB Atlas round-trip latency, Node.js runtime process memory allocation, system uptime counter, maintenance mode toggle, and live security audit event stream.</div>
    </div>

    <h2>8.2 User Accounts Directory & Role-Based Access Control (RBAC) Governance</h2>
    <p>
      Through <code>/user-management</code>, IT staff oversee user accounts across all 6 tiers:
    </p>
    <ul>
      <li><strong>Socket Presence Tracking:</strong> Displays real-time status: <code>• 1 Online Now</code>, <code>Active Xm ago</code>, <code>Offline</code>.</li>
      <li><strong>Protected Admin Guard:</strong> Administrator accounts are tagged <code>System Admin (You) Protected</code>, disabling deactivation buttons to prevent accidental self-lockout.</li>
      <li><strong>Account Deactivation & Appeals:</strong> Suspends compromised accounts with mandatory justification notes.</li>
    </ul>

    <div class="figure-container">
      <img src="${images.fig16}" class="figure-img" alt="User Management">
      <div class="figure-caption">Figure 16: User Accounts Directory & Role-Based Access Control (RBAC) Governance — Administrative user directory displaying real-time socket presence tracking (• 1 Online Now, Active 12m ago), role distribution filters across 6 user tiers, SMS verification badges, and account protection guardrails ((You) Protected).</div>
    </div>

    <h2>8.3 System Policy & Fee Schedule Configuration</h2>
    <p>
      Under Admin Settings (<code>/admin/settings</code>), administrators configure municipal parameters:
      Franchise Validity (New: 3 Years, Renewal: 1 Year, Expiry Warning: 30 Days), Fiscal Year, Franchise Fee (₱500.00), Base Fare (₱15.00), Per-Km Rate (₱2.50), and the System Maintenance Mode toggle.
    </p>

    <h2>8.4 Disaster Recovery Protocol (DRP): Weekly Backups, Offline Snapshots & Database Restore</h2>
    <p>
      G-TRAMS establishes a three-tier Disaster Recovery Protocol (DRP):
    </p>
    <ul>
      <li><strong>Automated Weekly Cron Archive:</strong> Backs up all 13 MongoDB collections every <strong>Sunday at 12:00 MN (Midnight)</strong> into compressed <code>.json.gz</code> archives with rolling 8-week retention.</li>
      <li><strong>1-Click Offline Snapshot:</strong> Direct download of compressed gzip database snapshots to encrypted local USB drives for offsite physical custody.</li>
      <li><strong>Safe Restoration Engine:</strong> Full database restoration requiring typing the explicit uppercase safety phrase: <code>RESTORE</code>. Restores all 13 collections with verified data integrity in seconds.</li>
    </ul>

    <div class="figure-container">
      <img src="${images.fig17}" class="figure-img" alt="Admin Settings & Backup">
      <div class="figure-caption">Figure 17: System Policy Configuration & Disaster Recovery Protocol (DRP) — System settings console detailing franchise validity durations (New: 3 Years, Renewal: 1 Year, 30-day expiry warning alert), municipal fare tariff settings, automated Sunday 12:00 MN cron backup status, 1-click .json.gz offline snapshot download, and full 13-collection restore requiring safety confirmation phrase "RESTORE".</div>
    </div>
  </div>

  <!-- SECTION 9: TROUBLESHOOTING & SUPPORT -->
  <div>
    <h1>9. Troubleshooting, FAQs & Support Directory</h1>
    <p>
      The following diagnostic matrix provides verified resolutions for common operational symptoms:
    </p>

    <h2>9.1 Error Resolution Matrix</h2>
    <table>
      <thead>
        <tr>
          <th>Symptom / Error Message</th>
          <th>Probable Root Cause</th>
          <th>Verified Step-by-Step Resolution</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>"Invalid credentials or incorrect password"</strong></td>
          <td>Typo in password or account not yet activated via OTP.</td>
          <td>Verify Caps Lock is disabled. Ensure you are using an 11-digit mobile number (09xxxxxxxxx) or verified email. Click "Forgot Password?" to reset.</td>
        </tr>
        <tr>
          <td><strong>"OTP code has expired or is invalid"</strong></td>
          <td>More than 5 minutes elapsed since OTP dispatch.</td>
          <td>Click "Resend OTP". Ensure active mobile cellular reception in Gasan and enter the newly dispatched 6-digit code immediately.</td>
        </tr>
        <tr>
          <td><strong>"Document upload failed / File exceeds size limit"</strong></td>
          <td>Unsupported format or image exceeds 10 MB limit.</td>
          <td>Upload files in .jpg, .png, or .pdf format. Crop margins or reduce camera photo resolution if image exceeds 10 MB.</td>
        </tr>
        <tr>
          <td><strong>"Duplicate vehicle identifier detected"</strong></td>
          <td>Plate, Engine, or Chassis number already registered.</td>
          <td>Cross-check LTO CR. If acquired second-hand, confirm the previous owner filed a formal Dropping / Transfer at BPLO.</td>
        </tr>
        <tr>
          <td><strong>"Unit Capacity 2/2 Reached — Quota Ceiling Enforced"</strong></td>
          <td>Operator already holds two active franchises.</td>
          <td>Under Section 4 of Municipal Franchising Ordinance, operators are limited to 2 units. You must drop an existing unit before filing a new one.</td>
        </tr>
        <tr>
          <td><strong>"Notice: Official TODA Certificate Required"</strong></td>
          <td>Applicant name is unlisted in association roster.</td>
          <td>Consult TODA President to encode membership in digital roster. If unlisted, upload a signed physical TODA Clearance certificate.</td>
        </tr>
        <tr>
          <td><strong>"Access Denied (403 Unauthorized)"</strong></td>
          <td>User role lacks permissions for the target module.</td>
          <td>Log out and authenticate with the authorized account (e.g., Cashier for treasury, BPLO for approvals, Admin for IT).</td>
        </tr>
        <tr>
          <td><strong>"Official Receipt (OR) Number already exists"</strong></td>
          <td>Cashier entered an OR number already recorded.</td>
          <td>Inspect physical municipal receipt booklet to confirm accurate sequential serial number. Duplicate entries are blocked for COA compliance.</td>
        </tr>
        <tr>
          <td><strong>"Restore Aborted: Invalid confirmation phrase"</strong></td>
          <td>Administrator failed to type safety phrase.</td>
          <td>Type the exact word RESTORE in all capital letters in the confirmation prompt to authorize database restoration.</td>
        </tr>
        <tr>
          <td><strong>"Server connection timeout / Maintenance in progress"</strong></td>
          <td>Scheduled maintenance mode or temporary network drop.</td>
          <td>Check internet connection. If maintenance mode is active, wait until municipal IT staff complete scheduled upgrades.</td>
        </tr>
      </tbody>
    </table>

    <h2>9.2 Frequently Asked Questions (FAQs)</h2>
    <div class="callout">
      <div class="callout-title">Q1: What is the processing turnaround time for an MTOP application in G-TRAMS?</div>
      Under RA 11032 (Ease of Doing Business), complete applications with verified credentials are processed within <strong>2 to 3 business days</strong> from online submission to BPLO inspection, payment, and final permit release.
    </div>

    <div class="callout">
      <div class="callout-title">Q2: When am I eligible to renew my commercial tricycle franchise?</div>
      Franchise permits are valid for <strong>1 year for Renewals</strong> and <strong>3 years for New Franchises</strong>. The system triggers an alert on your dashboard <strong>30 days prior</strong> to expiration, activating early renewal filing.
    </div>

    <div class="callout">
      <div class="callout-title">Q3: What should I do if my primary mobile phone is lost or damaged?</div>
      During registration, G-TRAMS captures a mandatory <strong>Secondary Recovery Contact</strong>. Click "Forgot Password?", enter your recovery contact, and receive an OTP to regain account access without visiting municipal hall.
    </div>

    <div class="callout">
      <div class="callout-title">Q4: How does a traffic enforcer know my digital e-Copy MTOP is authentic?</div>
      Every digital MTOP certificate and physical sidecar sticker features a <strong>dynamic encrypted QR code</strong>. Scanning it retrieves live, tamper-evident records directly from the municipal database at <code>/verify/:id</code>.
    </div>

    <div class="callout">
      <div class="callout-title">Q5: Is my personal document data protected under Philippine privacy laws?</div>
      Yes. In compliance with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>, passwords use cryptographic bcrypt hashing, biometric markers like blood type are excluded from AI OCR extraction, and documents are stored in secure cloud vaults with expiring tokens.
    </div>

    <div class="page-break"></div>

    <h2>9.3 LGU Office Directory & Official Support Channels</h2>
    <table>
      <thead>
        <tr>
          <th>Department / Office</th>
          <th>Physical Office Location</th>
          <th>Operating Hours</th>
          <th>Contact Number & Email</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Office of the Municipal Mayor</strong></td>
          <td>2nd Floor, Gasan Municipal Hall, Poblacion, Gasan</td>
          <td>Mon – Fri, 8:00 AM – 5:00 PM</td>
          <td>(042) 342-1001 • mayor@gasan.ph</td>
        </tr>
        <tr>
          <td><strong>BPLO Franchising Division</strong></td>
          <td>2nd Floor, Gasan Municipal Hall, Poblacion, Gasan</td>
          <td>Mon – Fri, 8:00 AM – 5:00 PM</td>
          <td>(042) 342-1234 • bplo@gasan.ph</td>
        </tr>
        <tr>
          <td><strong>Municipal Treasury (Counter 2)</strong></td>
          <td>Ground Floor, Gasan Municipal Hall, Poblacion, Gasan</td>
          <td>Mon – Fri, 8:00 AM – 5:00 PM</td>
          <td>(042) 342-1235 • treasury@gasan.ph</td>
        </tr>
        <tr>
          <td><strong>Traffic Enforcement / CTMO</strong></td>
          <td>Ground Floor (East Wing), Gasan Municipal Hall</td>
          <td>24/7 Roadside Operations</td>
          <td>(042) 342-1111 • traffic@gasan.ph</td>
        </tr>
        <tr>
          <td><strong>G-TRAMS IT Technical Support</strong></td>
          <td>College of Information and Computing Sciences, MarSU</td>
          <td>Mon – Fri, 8:00 AM – 5:00 PM</td>
          <td>support@gtrams.ph • cics@mar-su.edu.ph</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 30px; text-align: center; font-size: 8.5pt; color: #6B6761;">
      — End of Deliverable #7: User's Manual of the System —<br>
      <strong>G-TRAMS v2.4.0 • Municipality of Gasan, Marinduque • Marinduque State University CICS BSIT Capstone Group 5</strong>
    </div>
  </div>

</body>
</html>
`;

// Save the unified HTML file
const htmlPath = path.join(__dirname, 'Deliverable7_Group5_UsersManual.html');
fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('Successfully generated HTML User Manual at:', htmlPath);

// Target PDF outputs (both primary and GTRAMS alias for full compatibility)
const primaryPdfPath = path.join(__dirname, 'Deliverable7_Group5_UsersManual.pdf');
const aliasPdfPath = path.join(__dirname, 'Deliverable7_Group5_GTRAMS_UsersManual.pdf');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

if (fs.existsSync(chromePath)) {
  console.log('Compiling publication-grade PDF via Chrome Headless...');
  const tempProfileDir = path.join(require('os').tmpdir(), 'chrome_pdf_profile_' + Date.now());
  const cmd = `"${chromePath}" --headless=new --disable-gpu --user-data-dir="${tempProfileDir}" --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${primaryPdfPath}" "${htmlPath}"`;
  execSync(cmd, { stdio: 'inherit' });
  
  // Also copy to alias path so any tool or test looking for either file finds the exact build
  fs.copyFileSync(primaryPdfPath, aliasPdfPath);
  
  const stats = fs.statSync(primaryPdfPath);
  console.log(`PDF successfully created at: ${primaryPdfPath}`);
  console.log(`PDF File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
} else {
  console.error('Google Chrome binary not found at default location:', chromePath);
}
