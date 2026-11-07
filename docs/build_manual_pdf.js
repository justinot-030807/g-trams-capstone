const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting G-TRAMS Deliverable #7 Syllabus-Aligned PDF Builder (MarSU CICS Rubric)...');

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
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 8pt;
        color: #8C8880;
      }
      @bottom-left {
        content: "G-TRAMS v2.4.0 — User's Manual of the System | Municipality of Gasan, Marinduque";
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 7.5pt;
        color: #8C8880;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.45;
      color: #1F1D1B;
      background-color: #FFFFFF;
      margin: 0;
      padding: 0;
    }

    h1, h2, h3, h4 {
      color: #7A1F21;
      font-weight: 700;
      margin-top: 14pt;
      margin-bottom: 6pt;
      page-break-after: avoid;
    }

    h1 {
      font-size: 15pt;
      border-bottom: 2px solid #7A1F21;
      padding-bottom: 4pt;
      margin-top: 18pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    h2 {
      font-size: 11pt;
      border-bottom: 1px solid #E4E1DC;
      padding-bottom: 2pt;
      color: #9E2A2B;
    }

    h3 {
      font-size: 9.5pt;
      color: #1F1D1B;
    }

    p {
      margin-top: 0;
      margin-bottom: 6pt;
      text-align: justify;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 6pt;
      padding-left: 18px;
    }

    li {
      margin-bottom: 3pt;
    }

    .page-break {
      page-break-before: always;
    }

    /* Cover Page */
    .cover-container {
      min-height: 92vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 3px double #7A1F21;
      padding: 32px 28px;
      background: #FFFFFF;
      position: relative;
    }

    .cover-logos {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .cover-logo-img {
      height: 72px;
      object-fit: contain;
    }

    .univ-header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #D4AF37;
      padding-bottom: 12px;
    }

    .univ-title {
      font-size: 13pt;
      font-weight: 800;
      color: #7A1F21;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .college-title {
      font-size: 10.5pt;
      font-weight: 600;
      color: #1F1D1B;
      margin: 2px 0;
    }

    .dept-title {
      font-size: 9pt;
      color: #5A5650;
      margin: 0;
    }

    .address {
      font-size: 7.5pt;
      color: #7A7670;
      margin-top: 3px;
    }

    .cover-main {
      text-align: center;
      margin: 12px 0;
    }

    .deliverable-badge {
      display: inline-block;
      background-color: #7A1F21;
      color: #FFFFFF;
      padding: 4px 14px;
      font-size: 9pt;
      font-weight: 700;
      border-radius: 4px;
      letter-spacing: 1px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .system-title {
      font-size: 26pt;
      font-weight: 900;
      color: #7A1F21;
      margin: 4px 0;
      letter-spacing: 1.5px;
      border: none;
      padding: 0;
    }

    .system-subtitle {
      font-size: 11pt;
      font-weight: 600;
      color: #D4AF37;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 12px;
    }

    .doc-type {
      font-size: 15pt;
      font-weight: 800;
      color: #1F1D1B;
      margin: 8px 0 16px 0;
      letter-spacing: 1px;
      border-top: 2px solid #7A1F21;
      border-bottom: 2px solid #7A1F21;
      padding: 6px 0;
    }

    .meta-box {
      background: #FDFBF7;
      border: 1px solid #E8E5DF;
      border-left: 4px solid #7A1F21;
      padding: 12px 16px;
      text-align: left;
      margin: 12px auto;
      max-width: 520px;
      font-size: 8.5pt;
    }

    .meta-row {
      display: flex;
      margin-bottom: 4px;
    }

    .meta-label {
      width: 175px;
      font-weight: 700;
      color: #7A1F21;
      flex-shrink: 0;
    }

    .meta-value {
      flex-grow: 1;
      color: #1F1D1B;
    }

    .cover-footer {
      text-align: center;
      border-top: 1px solid #D4AF37;
      padding-top: 10px;
      font-size: 8pt;
      color: #5A5650;
    }

    /* Table of Contents */
    .toc-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 8.5pt;
      padding: 2px 0;
    }

    .toc-section {
      font-weight: 600;
      color: #1F1D1B;
    }

    .toc-dots {
      flex-grow: 1;
      border-bottom: 1px dotted #B4B0A8;
      margin: 0 6px 3px 6px;
    }

    .toc-page {
      font-weight: 700;
      color: #7A1F21;
      flex-shrink: 0;
    }

    .toc-subitem {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
      padding-left: 14px;
      font-size: 8pt;
      color: #5A5650;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8pt 0;
      font-size: 8pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #D6D2CA;
      padding: 4.5pt 6pt;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #7A1F21;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    tr:nth-child(even) td {
      background-color: #FAF8F5;
    }

    /* Figures */
    .figure-container {
      margin: 10pt 0;
      text-align: center;
      page-break-inside: avoid;
      background: #FAFAFA;
      border: 1px solid #E4E1DC;
      border-radius: 4px;
      padding: 6pt;
    }

    .figure-img {
      max-width: 96%;
      max-height: 255px;
      height: auto;
      border: 1px solid #D6D2CA;
      border-radius: 3px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .figure-caption {
      margin-top: 4pt;
      font-size: 7.5pt;
      font-weight: 600;
      color: #5A5650;
      line-height: 1.35;
      text-align: center;
    }

    /* Step boxes */
    .step-box {
      background: #FDFBF7;
      border: 1px solid #E4E1DC;
      border-left: 3.5px solid #D4AF37;
      padding: 7pt 10pt;
      margin: 7pt 0;
      page-break-inside: avoid;
      border-radius: 2px;
    }

    .step-header {
      font-weight: 700;
      color: #7A1F21;
      font-size: 8.5pt;
      margin-bottom: 3pt;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .step-purpose {
      font-style: italic;
      color: #5A5650;
      font-size: 8pt;
      margin-bottom: 4pt;
    }

    .step-result {
      margin-top: 4pt;
      padding-top: 3pt;
      border-top: 1px dashed #E4E1DC;
      font-size: 7.5pt;
      font-weight: 600;
      color: #2D6A4F;
    }

    /* Callout */
    .callout {
      background-color: #F6F4F0;
      border-left: 3.5px solid #7A1F21;
      padding: 6pt 9pt;
      margin: 7pt 0;
      font-size: 8pt;
      page-break-inside: avoid;
    }

    .callout-title {
      font-weight: 700;
      color: #7A1F21;
      margin-bottom: 2pt;
    }

    code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 7.5pt;
      background-color: #EFECE6;
      padding: 1px 4px;
      border-radius: 2px;
      color: #7A1F21;
    }
  </style>
</head>
<body>

  <!-- ==================== 1. COVER PAGE ==================== -->
  <div class="cover-container">
    <div class="cover-logos">
      <img src="${images.gasanLogo}" class="cover-logo-img" alt="Official Seal of Gasan">
      <img src="${images.gtramsLogo}" class="cover-logo-img" alt="G-TRAMS Official Logo">
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
          <span class="meta-label">Project / System Title:</span>
          <span class="meta-value"><strong>G-TRAMS: Gasan Tricycle Regulatory Automated Management System</strong></span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Document Title:</span>
          <span class="meta-value">Deliverable #7 – User’s Manual of the System</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Municipal Partner / Client:</span>
          <span class="meta-value">Local Government Unit of Gasan, Marinduque</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Municipal Mayor:</span>
          <span class="meta-value">HON. LIDANY A. LAO-BALDO</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Authorizing Entities:</span>
          <span class="meta-value">Sangguniang Bayan • MTFRB • BPLO</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">System Version:</span>
          <span class="meta-value">v2.4.0 (Production Release)</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">System Access URL:</span>
          <span class="meta-value">https://g-trams-official.vercel.app</span>
        </div>
        <div class="meta-row" style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #E4E1DC;">
          <span class="meta-label">Academic Group:</span>
          <span class="meta-value"><strong>Group 5</strong> (BSIT 4th Year, MarSU CICS)</span>
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
      <strong>Pamahalaang Bayan ng Gasan • Sangguniang Bayan • MTFRB • BPLO</strong><br>
      Published for Academic Year 2026–2027 • Standard Operating Procedure Manual
    </div>
  </div>

  <div class="page-break"></div>

  <!-- DOCUMENT METADATA & TABLE OF CONTENTS -->
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
    <p style="font-size: 8pt; color: #5A5650; margin-bottom: 8px;">
      This User's Manual strictly conforms to the Marinduque State University - College of Information and Computing Sciences (MarSU CICS) Deliverable #7 Syllabus & Grading Rubric.
    </p>
    <div style="margin: 10px 0;">
      <div class="toc-item">
        <span class="toc-section">1. Cover Page</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 1</span>
      </div>
      <div class="toc-item">
        <span class="toc-section">2. System Overview</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 3</span>
      </div>
      <div class="toc-subitem"><span>2.1 Description of the System • 2.2 Purpose and Objectives</span><span>Page 3</span></div>
      <div class="toc-subitem"><span>2.3 Intended Users & Role Matrix • 2.4 Major Features & Functionalities</span><span>Page 3</span></div>
      <div class="toc-subitem"><span>2.5 Municipal Legal Framework (RA 7160, RA 11032, RA 10173, COA)</span><span>Page 4</span></div>
      <div class="toc-subitem"><span>2.6 Geographic Route Zones & Accredited 17 TODA Associations</span><span>Page 4</span></div>

      <div class="toc-item" style="margin-top: 4px;">
        <span class="toc-section">3. System Requirements and Access</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 5</span>
      </div>
      <div class="toc-subitem"><span>3.1 Required Device Hardware • 3.2 Supported Browsers & Software</span><span>Page 5</span></div>
      <div class="toc-subitem"><span>3.3 Internet Connection Requirements • 3.4 System Access URL & PWA Setup</span><span>Page 5</span></div>
      <div class="toc-subitem"><span>3.5 User Account Requirements & Role-Based Access Control (RBAC) Matrix</span><span>Page 6</span></div>

      <div class="toc-item" style="margin-top: 4px;">
        <span class="toc-section">4. Getting Started</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 7</span>
      </div>
      <div class="toc-subitem"><span>4.1 Accessing or Launching the System</span><span>Page 7</span></div>
      <div class="toc-subitem"><span>4.2 Account Registration with Secondary Recovery Contact (Procedure 4.1, Fig. 3)</span><span>Page 7</span></div>
      <div class="toc-subitem"><span>4.3 Logging In & Logging Out (Procedure 4.2, Fig. 2)</span><span>Page 8</span></div>
      <div class="toc-subitem"><span>4.4 Multi-Channel Password Recovery via 6-Digit OTP (Procedure 4.3, Fig. 4)</span><span>Page 9</span></div>
      <div class="toc-subitem"><span>4.5 Overview of Main Dashboard & Navigation Menus (by Role)</span><span>Page 10</span></div>

      <div class="toc-item" style="margin-top: 4px;">
        <span class="toc-section">5. Step-by-Step User Instructions</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 11</span>
      </div>
      <div class="toc-subitem"><span>5.1 Public Visitor & Passenger Guide (QR Scan & Fare Calculation, Fig. 1, 5)</span><span>Page 11</span></div>
      <div class="toc-subitem"><span>5.2 Tricycle Operator Guide (5-Step Wizard, AI OCR & 2-Unit Quota, Fig. 6, 7, 8)</span><span>Page 13</span></div>
      <div class="toc-subitem"><span>5.3 TODA President Guide (Roster AI OCR, Auto Body Numbering, Fig. 9, 10)</span><span>Page 16</span></div>
      <div class="toc-subitem"><span>5.4 BPLO Licensing Officer Guide (Dual-Pane Review, Approvals, Sanctions, Fig. 11, 12, 13)</span><span>Page 18</span></div>
      <div class="toc-subitem"><span>5.5 Municipal Cashier Guide (OR-GASAN-2026 Serialization & Remittance, Fig. 14)</span><span>Page 21</span></div>
      <div class="toc-subitem"><span>5.6 System Administrator Guide (Telemetry, Audit Log, DRP Restore, Fig. 15, 16, 17)</span><span>Page 23</span></div>

      <div class="toc-item" style="margin-top: 4px;">
        <span class="toc-section">6. Error Handling and Troubleshooting</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 25</span>
      </div>
      <div class="toc-subitem"><span>6.1 Common System Errors (Login, OCR Discrepancies, Quota Hard-Lock, RBAC)</span><span>Page 25</span></div>
      <div class="toc-subitem"><span>6.2 Ten-Scenario Diagnostic Resolution Matrix</span><span>Page 25</span></div>

      <div class="toc-item" style="margin-top: 4px;">
        <span class="toc-section">7. Frequently Asked Questions (FAQs)</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 26</span>
      </div>

      <div class="toc-item" style="margin-top: 4px;">
        <span class="toc-section">8. Security and User Reminders</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 27</span>
      </div>

      <div class="toc-item" style="margin-top: 4px;">
        <span class="toc-section">9. Support and Contact Information</span>
        <span class="toc-dots"></span>
        <span class="toc-page">Page 27</span>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== 2. SYSTEM OVERVIEW ==================== -->
  <div>
    <h1>2. System Overview</h1>
    <p>
      The <strong>Gasan Tricycle Regulatory and Automated Management System (G-TRAMS)</strong> is an enterprise-grade municipal e-governance platform commissioned by the Local Government Unit (LGU) of Gasan, Province of Marinduque. Developed by Marinduque State University - College of Information and Computing Sciences (MarSU CICS) BSIT Capstone Group 5, G-TRAMS transforms the paper-based, fragmented Motorized Tricycle Operator's Permit (MTOP) issuance into a synchronized, transparent, and resilient digital ecosystem.
    </p>

    <h2>2.1 Description of the System</h2>
    <p>
      G-TRAMS bridges municipal regulatory offices, transport associations, transport workers, and the commuting public into a unified cloud architecture. By integrating modern progressive web technologies, automated AI OCR document extraction, dynamic encrypted QR verification decals, server-authoritative franchise validity clocks, and atomic collision-free body numbering, the system modernizes municipal transport administration in full compliance with Philippine statutory frameworks.
    </p>

    <h2>2.2 Purpose and Objectives</h2>
    <ul>
      <li><strong>Streamline Permit Turnaround:</strong> Accelerate franchise filing, evaluation, inspection, fee collection, and release from weeks to within 2 to 3 working days, in adherence to Republic Act No. 11032 (Ease of Doing Business Act).</li>
      <li><strong>Eradicate Colorum Tricycles:</strong> Provide instantaneous roadside QR verification for passengers and municipal law enforcers, exposing unauthorized or expired units within 3 seconds.</li>
      <li><strong>Prevent Franchise Monopoly:</strong> Enforce the statutory <strong>maximum two (2) units per operator quota</strong> through atomic database constraints, ensuring equitable public transport opportunities.</li>
      <li><strong>Eliminate Duplicate Body Numbers:</strong> Automate body number assignment through transactional locking, guaranteeing unique, collision-free identification across all 17 accredited TODAs.</li>
      <li><strong>Safeguard Municipal Revenue:</strong> Automate fee calculations (₱500 statutory franchise fee) and bind collections to physical serialized Commission on Audit (COA) Official Receipts (<code>OR-GASAN-2026-XXXX</code>).</li>
    </ul>

    <h2>2.3 Intended Users</h2>
    <p>G-TRAMS serves six (6) distinct stakeholder groups across the municipal transport sector:</p>
    <table>
      <thead>
        <tr>
          <th>User Role</th>
          <th>Stakeholder Profile</th>
          <th>Primary System Responsibilities</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Public / Commuters</strong></td>
          <td>General public, students, tourists, and law enforcement officers.</td>
          <td>Access municipal fare calculator, review public notices, and scan roadside QR codes to verify franchise validity.</td>
        </tr>
        <tr>
          <td><strong>Tricycle Operators</strong></td>
          <td>Individual transport franchise applicants and unit owners in Gasan.</td>
          <td>File new/renewal MTOP applications, upload vehicle OR/CR credentials via AI OCR, and manage digital credentials.</td>
        </tr>
        <tr>
          <td><strong>TODA Presidents</strong></td>
          <td>Elected leaders of Gasan's 17 accredited transport associations.</td>
          <td>Digitize physical driver rosters via bulk OCR, issue association endorsements, and delist inactive members.</td>
        </tr>
        <tr>
          <td><strong>BPLO Licensing Officers</strong></td>
          <td>Municipal Business Permits and Licensing Office regulatory staff.</td>
          <td>Conduct dual-pane document scrutiny, schedule physical vehicle inspections, endorse permits, and issue citations.</td>
        </tr>
        <tr>
          <td><strong>Municipal Cashiers</strong></td>
          <td>Municipal Treasury Office staff authorized to collect local revenue.</td>
          <td>Process Order of Payment, record physical serialized COA Official Receipts, and export daily remittance CSV logs.</td>
        </tr>
        <tr>
          <td><strong>System Administrators</strong></td>
          <td>Municipal IT personnel and designated system custodians.</td>
          <td>Manage user access, configure municipal policy, monitor audit telemetry, and execute disaster recovery backups.</td>
        </tr>
      </tbody>
    </table>

    <h2>2.4 Major Features and Functionalities</h2>
    <ul>
      <li><strong>5-Step Interactive MTOP Wizard:</strong> Guided online application covering personal profile, tricycle specs, document upload, toda clearance, and summary review.</li>
      <li><strong>Dual-Engine Gemini Vision AI OCR:</strong> High-speed optical character recognition pre-filling LTO Certificate of Registration (CR), Official Receipt (OR), and Driver's License data in under 2 seconds.</li>
      <li><strong>Roadside Encrypted QR Verification (<code>/verify/:id</code>):</strong> Dynamic tamper-evident QR decals verifying franchise status, plate, chassis, and operator profile without requiring login.</li>
      <li><strong>Atomic Quota & Body Number Enforcement:</strong> Hard database ceilings preventing more than 2 units per operator and zero duplicate body numbers per association.</li>
      <li><strong>Server-Authoritative Time Protocol:</strong> Injects synchronized Philippine Standard Time (PST, GMT+8) headers, preventing client-side clock tampering.</li>
      <li><strong>1-Click Disaster Recovery Protocol (DRP):</strong> Automated weekly rolling backups and atomic database restore with safety snapshot protection.</li>
    </ul>

    <div class="page-break"></div>

    <h2>2.5 Municipal Legal Framework & Statutory Compliance</h2>
    <ul>
      <li><strong>Republic Act No. 7160 (Local Government Code of 1991):</strong> Section 447 (a)(3)(vi) empowers the Sangguniang Bayan to regulate tricycles-for-hire and grant franchises through the MTFRB.</li>
      <li><strong>Municipal Franchising Ordinance Section 4 (Fleet Quota Limit):</strong> Enforces a strict ceiling of <strong>maximum two (2) motorized tricycle units per operator</strong> to prevent fleet monopolization and ensure fair community livelihood.</li>
      <li><strong>Republic Act No. 11032 (Ease of Doing Business Act):</strong> Sets strict processing SLAs: 3 working days for standard evaluations and 7 days for complex audits.</li>
      <li><strong>Republic Act No. 10173 (Data Privacy Act of 2012):</strong> Strictly enforces <strong>Data Minimization</strong>. Non-essential biometric markers (e.g. blood type) are deliberately ignored during OCR extraction, retaining only legally mandated licensing attributes.</li>
      <li><strong>Commission on Audit (COA) Guidelines:</strong> Enforces physical cashier settlement with serialized receipt booklets (<code>OR-GASAN-2026-XXXX</code>), precluding unverified digital payments.</li>
    </ul>

    <h2>2.6 Geographic Scope, Route Zones & Accredited TODAs</h2>
    <p>
      G-TRAMS covers all <strong>25 official Barangays</strong> of Gasan, segmented into three (3) geographic route zones:
    </p>
    <ul>
      <li><strong>Central Zone (Poblacion Town Proper Loop):</strong> Barangay I, Barangay II, and Barangay III (Commercial center, Municipal Hall, Public Market, and Port).</li>
      <li><strong>North Zone (Northern Coastal & Upland Route):</strong> Bahi, Bangbang, Cabugao, Mangiliol, Masiga, Tapuyan, Tiguion (Agricultural and circum-island coastal highway).</li>
      <li><strong>South Zone (Southern Coastal & Interior Valley Route):</strong> Antipolo, Bachao Ibaba, Bachao Ilaya, Bacong-Bacong, Banot, Banuyo, Bognuyan, Dawis, Dili, Libtangin, Mahunig, Matandang Gasan, Pangi, Pinggan, Tabionan.</li>
    </ul>
    <p>
      Every commercial tricycle unit must affiliate with one of Gasan's <strong>17 Accredited Transport Associations</strong>:
      <em>BATODA, POB TODA, GT TODA, LUG TODA, NBI TODA, BANGBANG IPIL TODA, TAB TODA, TIGUION TODA, MASIGA TODA, MAT TODA, PG TODA, 4B TODA, DPAB TODA, ILAYA TODA, GASAN CENTRAL TODA, BAHI TODA</em>, and <em>NON-TODA</em> (monitored municipal independent commercial units).
    </p>

    <div class="figure-container">
      <img src="${images.fig1}" class="figure-img" alt="G-TRAMS Landing Page">
      <div class="figure-caption">Figure 1: G-TRAMS Public Citizen Landing Page & Municipal Portal — Features top navigation bar with Gasan municipal seal, live statistics counter (Registered Operators, Accredited TODAs, Active Franchises), dual Call-to-Action buttons ("LOG IN" and "REGISTER"), municipal mandate announcement, and 5-step Citizen's Charter interactive service cards.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== 3. SYSTEM REQUIREMENTS AND ACCESS ==================== -->
  <div>
    <h1>3. System Requirements and Access</h1>
    <p>
      G-TRAMS is engineered as an ultra-lightweight, progressive web application (PWA) that runs smoothly across desktop workstations in municipal offices and commodity mobile smartphones used by tricycle operators on the road.
    </p>

    <h2>3.1 Required Device Hardware</h2>
    <table>
      <thead>
        <tr>
          <th>Device Category</th>
          <th>Minimum Hardware Requirements</th>
          <th>Recommended Hardware Specifications</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Desktop / Laptop</strong><br>(BPLO, Cashier, Admin)</td>
          <td>Dual-core processor (1.8 GHz)<br>4 GB RAM<br>1366 × 768 display resolution</td>
          <td>Intel Core i3 / AMD Ryzen 3 or higher<br>8 GB RAM<br>1920 × 1080 Full HD display</td>
        </tr>
        <tr>
          <td><strong>Mobile Smartphone / Tablet</strong><br>(Operators, TODA Pres, Public)</td>
          <td>Android 8.0+ or iOS 12+<br>2 GB RAM<br>Rear camera (for QR scanning and document capture)</td>
          <td>Android 11+ or iOS 15+<br>4 GB RAM<br>8 MP+ autofocus rear camera with LED flash</td>
        </tr>
      </tbody>
    </table>

    <h2>3.2 Supported Web Browsers & Software</h2>
    <p>
      G-TRAMS is 100% web-standard and does not require proprietary browser extensions or software plugins. The following modern browsers are fully supported:
    </p>
    <ul>
      <li><strong>Google Chrome:</strong> Version 90 or later (Recommended for desktop and mobile).</li>
      <li><strong>Microsoft Edge:</strong> Version 90 or later (Chromium engine).</li>
      <li><strong>Mozilla Firefox:</strong> Version 88 or later.</li>
      <li><strong>Apple Safari:</strong> Version 14 or later (macOS and iOS).</li>
    </ul>

    <h2>3.3 Internet Connection Requirements</h2>
    <ul>
      <li><strong>BPLO, Cashier, and Admin Terminals:</strong> Broadband or Wi-Fi with minimum <strong>3 Mbps download / 1 Mbps upload</strong>.</li>
      <li><strong>Mobile Smartphone Users:</strong> Active <strong>3G / 4G LTE / 5G cellular data</strong> or community Wi-Fi connection.</li>
      <li><strong>Offline Resiliency:</strong> The PWA Service Worker caches the application shell, forms, and validation rules locally. If connection momentarily drops roadside, forms will safely queue until cellular signal returns.</li>
    </ul>

    <h2>3.4 System Access URL & Progressive Web App (PWA) Setup</h2>
    <p>
      Users access G-TRAMS by navigating to the official cloud portal:
      <br>
      <center><strong style="font-size: 11pt; color: #7A1F21;">https://g-trams-official.vercel.app</strong></center>
    </p>
    <div class="step-box">
      <div class="step-header">Procedure 3.1: Installing G-TRAMS as a Mobile App (PWA)</div>
      <div class="step-purpose">Purpose: Install G-TRAMS directly on the home screen of an Android or iOS smartphone for fast 1-tap roadside access without opening a browser window.</div>
      <ol>
        <li>Open <strong>Google Chrome</strong> (on Android) or <strong>Safari</strong> (on iOS) on your smartphone.</li>
        <li>Navigate to <code>https://g-trams-official.vercel.app</code>.</li>
        <li>On Android, tap the three-dot browser menu and select <strong>"Install app"</strong> (or <strong>"Add to Home Screen"</strong>). On iOS, tap the Share icon and select <strong>"Add to Home Screen"</strong>.</li>
        <li>Confirm by tapping <strong>"Add"</strong>. The G-TRAMS icon will appear on your device home screen.</li>
      </ol>
      <div class="step-result">✓ Expected Result: G-TRAMS launches full-screen with native app performance and cached offline navigation.</div>
    </div>

    <div class="page-break"></div>

    <h2>3.5 User Account Requirements & Role-Based Access Control (RBAC) Matrix</h2>
    <p>
      Access to internal administrative, treasury, and regulatory modules requires authenticated credentials issued or authorized by the LGU Gasan System Administrator.
    </p>
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
          <td>Public Portal & Citizen's Charter</td>
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
          <td>5-Step Online MTOP Wizard (<code>/apply</code>)</td>
          <td>❌</td>
          <td>Full</td>
          <td>Full</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
        </tr>
        <tr>
          <td>Active Garage & Fleet Roster</td>
          <td>❌</td>
          <td>Full</td>
          <td>Full</td>
          <td>Review</td>
          <td>❌</td>
          <td>❌</td>
        </tr>
        <tr>
          <td>TODA Roster Management & AI OCR</td>
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
          <td>Sanctions & 3-Strike Revocations</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
          <td>Full</td>
          <td>❌</td>
          <td>❌</td>
        </tr>
        <tr>
          <td>Treasury Terminal & OR Logging</td>
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
          <td>User Management & Privilege Control</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
          <td>❌</td>
          <td>Full</td>
        </tr>
        <tr>
          <td>IT Telemetry, DRP Backup & Restore</td>
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
      System Administrators are strictly restricted to IT infrastructure and cannot review or approve franchises. Cashiers are restricted to fee receipting and cannot alter permit details or reject applications.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== 4. GETTING STARTED ==================== -->
  <div>
    <h1>4. Getting Started</h1>
    <p>
      Getting started with G-TRAMS is simple and secure. Transport workers and citizens can onboard independently using their mobile devices, while municipal employees use official credentials provided by the IT department.
    </p>

    <h2>4.1 Accessing or Launching the System</h2>
    <p>
      To access G-TRAMS, open any web browser and visit <code>https://g-trams-official.vercel.app</code>. The portal immediately presents the Gasan Municipal Seal, current transport statistics, and options to Log In, Register, or scan a QR code roadside.
    </p>

    <h2>4.2 Account Registration with Secondary Recovery Contact</h2>
    <p>
      Tricycle operators can create a new account in under two minutes. To safeguard against account lockout if a phone is lost or damaged, G-TRAMS requires a <strong>Secondary Recovery Contact</strong> (backup phone or email).
    </p>

    <div class="step-box">
      <div class="step-header">Procedure 4.1: Registering a New Operator Account</div>
      <div class="step-purpose">Purpose: Establish a secure digital identity for a tricycle operator with built-in account recovery safeguards.</div>
      <ol>
        <li>On the home page, click the golden <strong>"Register"</strong> button on the top right.</li>
        <li>Enter your <strong>Full Legal Name</strong> matching your government-issued ID.</li>
        <li>Enter your <strong>Primary Mobile Number</strong> (e.g., <code>09123456789</code>).</li>
        <li>Enter a <strong>Secondary Recovery Contact</strong> (backup mobile phone or email of a family member).</li>
        <li>Select your official <strong>Barangay Residency</strong> from Gasan's 25 official barangays.</li>
        <li>Select your affiliated <strong>TODA Association</strong> (or "NON-TODA" if independent).</li>
        <li>Input your desired password (minimum 8 characters with at least one number).</li>
        <li>Click <strong>"Create Account"</strong> and enter the 6-digit OTP code dispatched to your phone.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Account is registered, and the operator is automatically routed to their personal Operator Dashboard.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig3}" class="figure-img" alt="Registration Form">
      <div class="figure-caption">Figure 2: Citizen & Operator Account Registration Interface — Multi-field onboarding console collecting legal applicant name, primary mobile contact, mandatory secondary recovery contact (backup mobile/email) to prevent lockouts, residency selection from Gasan's 25 official barangays, accredited TODA affiliation, and initial body number specification.</div>
    </div>

    <div class="page-break"></div>

    <h2>4.3 Logging In & Logging Out</h2>
    <p>
      The login gateway accommodates transport workers who may not maintain an active email account. Users can log in using either their <strong>11-digit Philippine mobile phone number</strong> or their <strong>verified email address</strong>.
    </p>

    <div class="step-box">
      <div class="step-header">Procedure 4.2: Logging In and Out of G-TRAMS</div>
      <div class="step-purpose">Purpose: Authenticate authorized users and safely terminate sessions on shared or personal devices.</div>
      <ol>
        <li>Navigate to <code>https://g-trams-official.vercel.app/login</code>.</li>
        <li>Enter your registered 11-digit mobile number (e.g. <code>09123456789</code>) or email address.</li>
        <li>Enter your password. (Click the eye icon to verify spelling if necessary).</li>
        <li>Click the maroon <strong>"Log In"</strong> button.</li>
        <li><strong>To Log Out:</strong> Click the user avatar or menu icon on the top right of the navigation bar, then select <strong>"Log Out"</strong>.</li>
      </ol>
      <div class="step-result">✓ Expected Result: A cryptographic JWT session token is established on login and cleared completely on logout, returning the browser safely to the public landing page.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig2}" class="figure-img" alt="Login Terminal">
      <div class="figure-caption">Figure 3: Shared Multi-Identifier Authentication Login Terminal — Secure login portal accessible via /login supporting both 11-digit Philippine mobile numbers (09XXXXXXXXX) and verified email addresses, password field with visibility toggle, Google OAuth single-sign-on integration, and direct link to password recovery.</div>
    </div>

    <div class="page-break"></div>

    <h2>4.4 Multi-Channel Password Recovery via 6-Digit OTP</h2>
    <p>
      If an operator forgets their password or misplaces their phone, they can regain access through the automated self-service password reset system.
    </p>

    <div class="step-box">
      <div class="step-header">Procedure 4.3: Resetting a Forgotten Password</div>
      <div class="step-purpose">Purpose: Recover account access without requiring an in-person visit to the municipal hall.</div>
      <ol>
        <li>On the Login page, click the <strong>"Forgot Password?"</strong> link.</li>
        <li>Enter either your primary registered mobile number or your secondary recovery contact.</li>
        <li>Click <strong>"Send Reset OTP"</strong>. A 6-digit code will be dispatched via SMS/email with a 5-minute validity window.</li>
        <li>Enter the received 6-digit OTP code into the verification field.</li>
        <li>Type your new password and confirm it.</li>
        <li>Click <strong>"Reset Password"</strong>.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Password is updated in the database, and the user is redirected to log in with their new credentials.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig4}" class="figure-img" alt="Forgot Password Modal">
      <div class="figure-caption">Figure 4: Multi-Channel Password Recovery & OTP Verification Modal — Security modal displaying the red alert shield, contact input field (email or 09123456789), 6-digit one-time PIN (OTP) verification mechanism with 5-minute timeout window, and password reset form.</div>
    </div>

    <h2>4.5 Overview of Main Dashboard & Navigation Menus</h2>
    <p>
      Upon successful authentication, G-TRAMS automatically navigates the user to their role-specific dashboard:
    </p>
    <ul>
      <li><strong>Operator Dashboard:</strong> Shows unit capacity quota (e.g. <code>Unit Capacity 1/2</code>), active franchise permits, pending renewal alerts, and the 5-Step Application Wizard button.</li>
      <li><strong>BPLO Console:</strong> Displays pending application queues, document verification dual-pane reviewer, inspection scheduler, and 3-strike penalty management.</li>
      <li><strong>TODA President Console:</strong> Displays association membership roster, bulk OCR digitization tool, auto-body number generator, and certificate issuance.</li>
      <li><strong>Cashier Console:</strong> Displays pending Orders of Payment, physical OR-GASAN booklet recorder, digital payment receipts, and COA daily remittance CSV export.</li>
      <li><strong>Admin Dashboard:</strong> Displays system uptime telemetry, user account controls, municipal policy configurations, and 1-Click Disaster Recovery backup/restore.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- ==================== 5. STEP-BY-STEP USER INSTRUCTIONS ==================== -->
  <div>
    <h1>5. Step-by-Step User Instructions</h1>
    <p>
      This section provides detailed, step-by-step instructions for every major feature of G-TRAMS, categorized by user role.
    </p>

    <!-- 5.1 PUBLIC VISITOR & PASSENGER GUIDE -->
    <h2>5.1 Public Visitor & Passenger Guide</h2>
    <p>
      Public features require no registration and are openly accessible to passengers, tourists, and law enforcement officers roadside.
    </p>

    <div class="step-box">
      <div class="step-header">Procedure 5.1.1: Roadside QR Franchise Verification</div>
      <div class="step-purpose">Feature: Roadside QR Scanner (<code>/verify/:id</code>). Purpose: Verify tricycle legitimacy and detect colorum units in under 3 seconds.</div>
      <ol>
        <li>Open the camera app on any smartphone.</li>
        <li>Aim the camera at the physical QR code decal on the tricycle windshield or the driver's digital ID card.</li>
        <li>Tap the pop-up link: <code>https://g-trams-official.vercel.app/verify/:id</code>.</li>
        <li>Inspect the official LGU verification card:
          <ul>
            <li><strong>Validity Badge:</strong> Green (VALID LGU GASAN FRANCHISE) or Red (EXPIRED / REVOKED).</li>
            <li><strong>Operator Profile:</strong> Full Legal Name, photo, and registered contact.</li>
            <li><strong>Vehicle Specs:</strong> Plate Number, Motor Number, Chassis Number, and Body Number.</li>
            <li><strong>Route & Association:</strong> Authorized TODA and approved route zone.</li>
          </ul>
        </li>
      </ol>
      <div class="step-result">✓ Expected Result: Official municipal verification badge confirms authentic registration records roadside.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig5}" class="figure-img" alt="Public Roadside QR Verification">
      <div class="figure-caption">Figure 5: Public Roadside Mobile QR Verification Terminal (/verify/:id) — Passenger and traffic enforcer mobile verification screen displaying real-time franchise validity badge (Active / Under Warning / Expired / Suspended), operator legal name, verified tricycle photograph, LTO plate number, engine/motor number, chassis number, assigned body number, and authorized route zone.</div>
    </div>

    <h3>Municipal Fare & Tariff Calculation</h3>
    <p>Pursuant to Sangguniang Bayan ordinances, fares in Gasan are calculated using the following statutory formula:</p>
    <ul>
      <li><strong>Base Regular Fare:</strong> <strong>₱15.00</strong> for the first kilometer within municipal routes.</li>
      <li><strong>Succeeding Kilometer Rate:</strong> <strong>₱2.50</strong> for each succeeding kilometer.</li>
      <li><strong>Statutory 20% Discount (RA 11364):</strong> Students, Senior Citizens, and Persons with Disability (PWD) pay 80% of regular fare.</li>
    </ul>

    <div class="page-break"></div>

    <!-- 5.2 TRICYCLE OPERATOR GUIDE -->
    <h2>5.2 Tricycle Operator Guide</h2>
    <p>
      The Operator Portal empowers commercial tricycle operators to manage their fleet, file online franchise applications, and access tamper-evident digital credentials.
    </p>

    <div class="figure-container">
      <img src="${images.fig6}" class="figure-img" alt="Operator Dashboard">
      <div class="figure-caption">Figure 6: Tricycle Operator Active Fleet Dashboard — Displays operator profile card, 2-unit quota tracker ("Unit Capacity 1 / 2"), active franchise card with body number, plate number, expiration countdown badge, and quick-action buttons ("Apply for New Franchise", "Download e-Copy", "Renew").</div>
    </div>

    <div class="step-box">
      <div class="step-header">Procedure 5.2.1: Filing an Online MTOP Application via 5-Step Wizard</div>
      <div class="step-purpose">Feature: 5-Step MTOP Wizard (<code>/apply</code>). Purpose: Submit a complete motorized tricycle franchise application online.</div>
      <ol>
        <li>Log in to your Operator account and click <strong>"Apply for New Franchise"</strong>.</li>
        <li><strong>Step 1 (Personal Profile):</strong> Confirm your Full Name, Contact Number, and Barangay Residency.</li>
        <li><strong>Step 2 (Vehicle Specs):</strong> Enter the Make/Brand (e.g. Kawasaki, Honda), Engine/Motor Number, Chassis Number, and LTO Plate Number.</li>
        <li><strong>Step 3 (Document Upload & AI OCR):</strong> Take or upload clear photos of your LTO Certificate of Registration (CR), LTO Official Receipt (OR), and Driver's License.
          <br><em>The AI OCR will analyze your documents in under 2 seconds and highlight any typos or discrepancies.</em></li>
        <li><strong>Step 4 (TODA Affiliation):</strong> Select your accredited association and body number.</li>
        <li><strong>Step 5 (Review & Submit):</strong> Review the summary, check the certification box, and click <strong>"Submit Application"</strong>.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Application is assigned a tracking number (e.g. <code>APP-2026-0042</code>) and routed to the BPLO review queue.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig7}" class="figure-img" alt="5-Step MTOP Wizard">
      <div class="figure-caption">Figure 7: 5-Step MTOP Application Wizard Interface — Step 2 vehicle specifications form capturing tricycle make, model year, motor number, chassis number, and LTO plate number with built-in validation rules.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig8}" class="figure-img" alt="AI OCR Document Upload">
      <div class="figure-caption">Figure 8: AI OCR Document Verification Engine — Real-time document scanner pre-filling LTO CR, OR, and Driver's License data, displaying confidence scores, and flagging data mismatches in red callouts.</div>
    </div>

    <div class="page-break"></div>

    <!-- 5.3 TODA PRESIDENT GUIDE -->
    <h2>5.3 TODA President Guide</h2>
    <p>
      TODA Presidents maintain digital association rosters, issue endorsements, and supervise unit body number allocations to eliminate duplicates.
    </p>

    <div class="figure-container">
      <img src="${images.fig9}" class="figure-img" alt="TODA Roster Console">
      <div class="figure-caption">Figure 9: TODA Association Roster & Driver Roster Management — Membership table showing driver names, assigned body numbers, plate numbers, membership status (Active / Inactive), and quick actions ("Add Member", "Digitize Roster", "Delist").</div>
    </div>

    <div class="step-box">
      <div class="step-header">Procedure 5.3.1: Bulk Roster Digitization via AI OCR</div>
      <div class="step-purpose">Feature: AI Roster Digitizer. Purpose: Convert physical paper driver rosters into searchable digital records.</div>
      <ol>
        <li>From the TODA President dashboard, click <strong>"Digitize Paper Roster"</strong>.</li>
        <li>Upload a clear photo or scanned PDF of the physical roster sheet.</li>
        <li>Click <strong>"Run AI Extraction"</strong>. Gemini Vision AI will parse driver names, body numbers, and plate numbers.</li>
        <li>Review the parsed tabular preview and correct any spelling misreads.</li>
        <li>Click <strong>"Commit Roster to Association"</strong>.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Member records are added to the association master list without manual typing.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig10}" class="figure-img" alt="Auto Body Number Generation">
      <div class="figure-caption">Figure 10: Atomic Collision-Free Body Number Allocation Tool — Auto-generates the next sequential unique body number for new units, preventing duplicate numbering within the association.</div>
    </div>

    <div class="page-break"></div>

    <!-- 5.4 BPLO LICENSING OFFICER GUIDE -->
    <h2>5.4 BPLO Licensing Officer Guide</h2>
    <p>
      BPLO Officers evaluate franchise applications, inspect vehicle documents using a dual-pane viewer, and manage citations and revocations.
    </p>

    <div class="figure-container">
      <img src="${images.fig11}" class="figure-img" alt="BPLO Dashboard">
      <div class="figure-caption">Figure 11: BPLO Regulatory Command Dashboard — Displays franchise statistics (Pending Review, For Payment, For Signing, Active), queue summary cards, and quick navigation to review queues.</div>
    </div>

    <div class="step-box">
      <div class="step-header">Procedure 5.4.1: Reviewing Applications via Dual-Pane Viewer</div>
      <div class="step-purpose">Feature: Dual-Pane Review Console. Purpose: Cross-examine uploaded documents against encoded data side-by-side.</div>
      <ol>
        <li>Navigate to <strong>"Pending Review"</strong> in the BPLO navigation menu.</li>
        <li>Click <strong>"Review"</strong> on any pending application.</li>
        <li>Examine the left pane (uploaded LTO CR/OR image) and compare with the right pane (encoded data fields).</li>
        <li>Verify engine number, chassis number, and plate number consistency.</li>
        <li>Click <strong>"Approve & Endorse for Payment"</strong> (or <strong>"Request Revision"</strong> if documents are blurry).</li>
      </ol>
      <div class="step-result">✓ Expected Result: Application transitions to "For Payment" queue, and an Order of Payment (₱500) is generated for the Cashier.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig12}" class="figure-img" alt="BPLO Approval Queue">
      <div class="figure-caption">Figure 12: Dual-Pane Application Review Console — Side-by-side inspection console displaying applicant document image on the left and digitized form attributes on the right with discrepancy highlights.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig13}" class="figure-img" alt="BPLO Masterlist & Sanctions">
      <div class="figure-caption">Figure 13: Municipal Franchise Masterlist & 3-Strike Penalty Console — Searchable registry of all tricycles in Gasan with filters for route zone, TODA, and penalty status (Warning, Suspended, Revoked).</div>
    </div>

    <div class="page-break"></div>

    <!-- 5.5 MUNICIPAL CASHIER GUIDE -->
    <h2>5.5 Municipal Cashier Guide</h2>
    <p>
      The Cashier Portal manages over-the-counter franchise fee collections, binds payments to serialized COA receipt booklets, and generates daily remittance reports.
    </p>

    <div class="step-box">
      <div class="step-header">Procedure 5.5.1: Processing Fee Settlement & Official Receipt (OR) Logging</div>
      <div class="step-purpose">Feature: Treasury Payment Terminal. Purpose: Collect statutory ₱500 franchise fee and record sequential COA Official Receipt.</div>
      <ol>
        <li>From the Cashier dashboard, search the applicant's name or application tracking number.</li>
        <li>Verify the fee assessment: <strong>₱500.00</strong> (Franchise & Regulatory Fee).</li>
        <li>Collect the cash payment from the applicant at Counter 2.</li>
        <li>Input the physical serialized receipt number from the official receipt booklet: <code>OR-GASAN-2026-XXXX</code>.</li>
        <li>Click <strong>"Confirm Settlement & Issue Receipt"</strong>.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Payment is recorded, electronic receipt is issued, and the application moves to the Mayor's office for permit signing.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig14}" class="figure-img" alt="Cashier Treasury Console">
      <div class="figure-caption">Figure 14: Municipal Treasury Payment Console & OR Serializer — Interface for recording ₱500 fee collections, entering sequential COA receipt numbers, and generating daily remittance CSV exports.</div>
    </div>

    <div class="page-break"></div>

    <!-- 5.6 SYSTEM ADMINISTRATOR GUIDE -->
    <h2>5.6 System Administrator & IT Operations Guide</h2>
    <p>
      System Administrators manage user accounts, oversee audit trails, configure municipal rules, and maintain disaster recovery backups.
    </p>

    <div class="figure-container">
      <img src="${images.fig15}" class="figure-img" alt="Admin Dashboard">
      <div class="figure-caption">Figure 15: IT Operations & System Telemetry Dashboard — Displays server uptime (99.98%), API latency (48 ms), database storage metrics, active sessions, and security alert logs.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig16}" class="figure-img" alt="User Management Console">
      <div class="figure-caption">Figure 16: Centralized User & Role Management Console — Account administration interface allowing IT staff to create municipal accounts, assign roles (BPLO, Cashier, Admin), reset passwords, and deactivate accounts.</div>
    </div>

    <div class="step-box">
      <div class="step-header">Procedure 5.6.1: 1-Click Database Disaster Recovery Backup & Restore</div>
      <div class="step-purpose">Feature: Disaster Recovery Protocol (DRP). Purpose: Execute manual compressed backups and restore databases safely.</div>
      <ol>
        <li>Navigate to <strong>"System Settings" &rarr; "Disaster Recovery"</strong>.</li>
        <li>To create a manual backup, click <strong>"Download Offline Backup (.json.gz)"</strong>. A gzip-compressed snapshot will download.</li>
        <li>To restore from a backup, click <strong>"Restore Database"</strong> and select your verified snapshot file.</li>
        <li>When the security prompt appears, type the exact confirmation phrase: <code>RESTORE</code>.</li>
        <li>Click <strong>"Execute Safety Restore"</strong>.</li>
      </ol>
      <div class="step-result">✓ Expected Result: An automated safety pre-snapshot is generated, and the database collections are restored with zero data loss.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig17}" class="figure-img" alt="Admin Settings & Backup">
      <div class="figure-caption">Figure 17: System Policy Configuration & Disaster Recovery Protocol (DRP) — System settings console detailing franchise validity durations, municipal fare settings, automated weekly cron backup status, and 1-click restore mechanism.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== 6. ERROR HANDLING AND TROUBLESHOOTING ==================== -->
  <div>
    <h1>6. Error Handling and Troubleshooting</h1>
    <p>
      This section details common operational errors that users may encounter across the system, along with root cause analyses and verified step-by-step resolutions.
    </p>

    <h2>6.1 Common Operational Problems</h2>
    <ul>
      <li><strong>Unable to Log In:</strong> Caused by typing incorrect passwords or using unverified contact formats. Ensure you are using an 11-digit mobile number starting with <code>09</code> or a valid email address. Use Procedure 4.3 to reset forgotten passwords.</li>
      <li><strong>Missing or Incorrect Information on Documents:</strong> When uploading photos of LTO CR/OR, blurry photos or glare can cause OCR misreads. Ensure the document is well-lit and flat before taking a photo. You can edit misread fields manually before submitting.</li>
      <li><strong>Form Submission Errors & Quota Lock:</strong> If the submit button displays "Unit Capacity 2/2 Reached", the operator already holds two active tricycle franchises. Under Municipal Ordinance Section 4, operators cannot register a third unit without dropping an existing one.</li>
      <li><strong>Unable to Save or Update Records (Network Drop):</strong> If an internet connection drops roadside while filing, the form fields remain preserved locally. Reconnect to Wi-Fi or cellular data and tap "Retry Submit".</li>
      <li><strong>Access Denied (403 Unauthorized):</strong> Occurs when attempting to open a URL restricted to another role (e.g., an Operator attempting to view the Cashier terminal). Log out and re-authenticate using the authorized account.</li>
    </ul>

    <h2>6.2 Diagnostic Resolution Matrix</h2>
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
  </div>

  <div class="page-break"></div>

  <!-- ==================== 7. FREQUENTLY ASKED QUESTIONS (FAQS) ==================== -->
  <div>
    <h1>7. Frequently Asked Questions (FAQs)</h1>
    <p>
      The following questions represent the most common inquiries from operators, transport leaders, and municipal staff:
    </p>

    <div class="callout">
      <div class="callout-title">Q1: What is the processing turnaround time for an MTOP application in G-TRAMS?</div>
      Under RA 11032 (Ease of Doing Business Act), complete applications with verified credentials are processed within <strong>2 to 3 business days</strong> from online submission to BPLO inspection, cashier fee settlement, and final permit release.
    </div>

    <div class="callout">
      <div class="callout-title">Q2: When am I eligible to renew my commercial tricycle franchise?</div>
      Franchise permits are valid for <strong>1 year for Renewals</strong> and <strong>3 years for New Franchises</strong>. The system automatically triggers an alert on your dashboard <strong>30 days prior</strong> to expiration, activating early renewal filing.
    </div>

    <div class="callout">
      <div class="callout-title">Q3: What should I do if my primary mobile phone is lost or damaged?</div>
      During registration, G-TRAMS captures a mandatory <strong>Secondary Recovery Contact</strong>. Click "Forgot Password?", enter your secondary contact, and receive an OTP to regain account access without visiting the municipal hall.
    </div>

    <div class="callout">
      <div class="callout-title">Q4: How does a traffic enforcer know my digital e-Copy MTOP is authentic?</div>
      Every digital MTOP certificate and physical sidecar sticker features a <strong>dynamic encrypted QR code</strong>. Scanning it retrieves live, tamper-evident records directly from the municipal database at <code>/verify/:id</code>.
    </div>

    <div class="callout">
      <div class="callout-title">Q5: Is my personal document data protected under Philippine privacy laws?</div>
      Yes. In compliance with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>, passwords use cryptographic bcrypt hashing, biometric markers like blood type are excluded from AI OCR extraction, and documents are stored in secure cloud vaults with expiring tokens.
    </div>

    <div class="callout">
      <div class="callout-title">Q6: Can an operator register more than two (2) tricycle units?</div>
      No. Section 4 of the Gasan Municipal Franchising Ordinance strictly limits operators to a maximum of two (2) motorized tricycle units to ensure fair livelihood opportunities. Attempting to file a third unit is automatically blocked.
    </div>

    <div class="callout">
      <div class="callout-title">Q7: Why are franchise fees collected at the Cashier counter instead of online credit cards?</div>
      Pursuant to Commission on Audit (COA) circulars and municipal revenue codes, local fees must be bound directly to physical, serialized Official Receipt booklets (<code>OR-GASAN-2026-XXXX</code>) issued by the Municipal Treasury.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== 8. SECURITY AND USER REMINDERS ==================== -->
  <div>
    <h1>8. Security and User Reminders</h1>
    <p>
      To ensure the security, privacy, and integrity of municipal records, all users must observe the following standard operating guidelines:
    </p>

    <h2>8.1 Protecting Account Credentials</h2>
    <ul>
      <li><strong>Never Share Your Password or OTP:</strong> Municipal staff will never ask for your password or One-Time PIN (OTP). Keep your credentials strictly confidential.</li>
      <li><strong>Use Strong Passwords:</strong> Passwords must be at least eight (8) characters long and include an uppercase letter and a numeric digit. Avoid using simple birthdays or plate numbers.</li>
      <li><strong>Update Recovery Contacts:</strong> If you change your backup phone number or email, immediately update your profile under Account Settings.</li>
    </ul>

    <h2>8.2 Safe Logging Out After Using the System</h2>
    <ul>
      <li><strong>Log Out on Shared Terminals:</strong> Always click <strong>"Log Out"</strong> when using shared computers in the municipal hall, computer shops, or TODA offices to prevent unauthorized access.</li>
      <li><strong>Clear Browser Cache:</strong> If accessing sensitive records from a public kiosk, close all browser windows after logging out.</li>
    </ul>

    <h2>8.3 Protecting Personal & Confidential Information (RA 10173)</h2>
    <ul>
      <li><strong>Data Minimization:</strong> G-TRAMS collects only legally required transport data. Never upload unrequested personal documents (e.g. medical certificates or personal bank statements).</li>
      <li><strong>Confidentiality Agreement:</strong> BPLO and Cashier personnel are bound by non-disclosure agreements under the Data Privacy Act of 2012. Sharing operator contact numbers or personal records is strictly prohibited and subject to legal penalties.</li>
    </ul>

    <h2>8.4 Using the System for Its Intended Purpose</h2>
    <ul>
      <li><strong>Truthful Submissions:</strong> Uploading falsified LTO receipts, forged clearances, or tampered documents constitutes falsification of public documents under the Revised Penal Code.</li>
      <li><strong>Zero Tolerance for Bribery:</strong> Any attempts to bypass the 2-unit quota or avoid inspection through unofficial channels will be logged automatically in the administrative audit trail.</li>
    </ul>

    <!-- ==================== 9. SUPPORT AND CONTACT INFORMATION ==================== -->
    <h1>9. Support and Contact Information</h1>
    <p>
      For technical assistance, franchise inquiries, or system troubleshooting, please contact the appropriate municipal office or developer representatives below:
    </p>

    <h2>9.1 LGU Gasan Municipal Government Directory</h2>
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
      </tbody>
    </table>

    <h2>9.2 Capstone Developer Support Team (Group 5 - MarSU CICS)</h2>
    <table>
      <thead>
        <tr>
          <th>Representative Name</th>
          <th>Project Role</th>
          <th>Primary Specialization</th>
          <th>Official Email</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Jhon Kyn Axix H. Cabrigas</strong></td>
          <td>Lead Backend Architect</td>
          <td>Database Architecture, DRP & REST APIs</td>
          <td>jhonkyn.cabrigas@marsu.edu.ph</td>
        </tr>
        <tr>
          <td><strong>Justine S. Lachica</strong></td>
          <td>Frontend Lead & UI/UX</td>
          <td>PWA Development, UI Flow & Wizard</td>
          <td>justine.lachica@marsu.edu.ph</td>
        </tr>
        <tr>
          <td><strong>Jay Vincent G. Motol</strong></td>
          <td>Quality Assurance Lead</td>
          <td>Security Testing, RBAC & Sanctions</td>
          <td>jayvincent.motol@marsu.edu.ph</td>
        </tr>
        <tr>
          <td><strong>Ian Simon Francis M. Rey</strong></td>
          <td>DevOps & Cloud Engineer</td>
          <td>Vercel/Render CI/CD & AI OCR Pipeline</td>
          <td>iansimon.rey@marsu.edu.ph</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 24px; text-align: center; font-size: 8pt; color: #6B6761;">
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
  const cmd = `"${chromePath}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${primaryPdfPath}" "${htmlPath}"`;
  execSync(cmd, { stdio: 'inherit' });
  
  // Also copy to alias path so any tool or test looking for either file finds the exact build
  fs.copyFileSync(primaryPdfPath, aliasPdfPath);
  
  const stats = fs.statSync(primaryPdfPath);
  console.log(`PDF successfully created at: ${primaryPdfPath}`);
  console.log(`PDF File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
} else {
  console.error('Google Chrome binary not found at default location:', chromePath);
}
