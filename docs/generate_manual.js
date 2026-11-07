const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getBase64Image(filename) {
  const filePath = path.join(__dirname, 'manual_assets', filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

const images = {
  landing: getBase64Image('fig4_landing_page.png') || getBase64Image('fig1_landing_page.png'),
  login: getBase64Image('fig1_login_page.png'),
  register: getBase64Image('fig2_register_page.png'),
  forgotPass: getBase64Image('fig3_forgot_password.png'),
  operatorDash: getBase64Image('fig5_operator_dashboard.png'),
  applyFranchise: getBase64Image('fig6_apply_franchise.png'),
  todaRoster: getBase64Image('fig8_toda_roster.png'),
  cashierDash: getBase64Image('fig9_cashier_dashboard.png'),
  bploDash: getBase64Image('fig11_bplo_dashboard.png'),
  bploQueue: getBase64Image('fig12_bplo_approval_queue.png'),
  masterlist: getBase64Image('fig13_franchise_masterlist.png'),
  adminDash: getBase64Image('fig14_admin_dashboard.png'),
  userMgmt: getBase64Image('fig15_user_management.png'),
  adminSettings: getBase64Image('fig16_admin_database_backup.png') || getBase64Image('fig16_admin_settings.png'),
};

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Deliverable #7 - User's Manual of the System | G-TRAMS</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page);
      }
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1F1D1B;
      background: #FFFFFF;
      line-height: 1.6;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }

    .page-break {
      page-break-before: always;
    }

    .no-break {
      page-break-inside: avoid;
    }

    /* Cover Page */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
      padding: 40px 20px;
    }

    .univ-header {
      border-bottom: 2px solid #9E2A2B;
      padding-bottom: 20px;
    }

    .univ-name {
      font-size: 16pt;
      font-weight: 800;
      color: #9E2A2B;
      letter-spacing: 1px;
      margin: 0;
      text-transform: uppercase;
    }

    .college-name {
      font-size: 13pt;
      font-weight: 600;
      color: #333333;
      margin: 5px 0 0 0;
    }

    .dept-name {
      font-size: 10pt;
      color: #666666;
      margin: 2px 0 0 0;
    }

    .deliverable-tag {
      display: inline-block;
      background: #9E2A2B;
      color: #FFFFFF;
      padding: 6px 18px;
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 2px;
      border-radius: 4px;
      margin-top: 40px;
      text-transform: uppercase;
    }

    .manual-title {
      font-size: 26pt;
      font-weight: 900;
      color: #1F1D1B;
      margin: 15px 0 5px 0;
      line-height: 1.2;
    }

    .manual-subtitle {
      font-size: 14pt;
      font-weight: 600;
      color: #D4AF37;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 15px 0;
    }

    .system-desc-brief {
      font-size: 11pt;
      color: #555555;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.5;
    }

    .cover-meta-card {
      background: #FDFBF7;
      border: 1px solid #E4E1DC;
      border-left: 5px solid #9E2A2B;
      border-radius: 6px;
      padding: 20px;
      text-align: left;
      margin: 30px auto;
      max-width: 550px;
      font-size: 10pt;
    }

    .cover-meta-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dashed #EFECE6;
    }

    .cover-meta-row:last-child {
      border-bottom: none;
    }

    .cover-meta-label {
      font-weight: 700;
      color: #6B6761;
      width: 150px;
    }

    .cover-meta-value {
      font-weight: 600;
      color: #1F1D1B;
      flex: 1;
    }

    .cover-footer {
      font-size: 9.5pt;
      color: #777777;
      border-top: 1px solid #E4E1DC;
      padding-top: 15px;
    }

    /* Headings */
    h1 {
      font-size: 18pt;
      font-weight: 800;
      color: #9E2A2B;
      border-bottom: 2px solid #E4E1DC;
      padding-bottom: 6px;
      margin-top: 30px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    h2 {
      font-size: 14pt;
      font-weight: 700;
      color: #1F1D1B;
      margin-top: 25px;
      margin-bottom: 10px;
      border-left: 4px solid #D4AF37;
      padding-left: 10px;
    }

    h3 {
      font-size: 12pt;
      font-weight: 700;
      color: #9E2A2B;
      margin-top: 18px;
      margin-bottom: 6px;
    }

    p {
      margin-top: 0;
      margin-bottom: 12px;
      text-align: justify;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0 20px 0;
      font-size: 9.5pt;
    }

    th {
      background: #9E2A2B;
      color: #FFFFFF;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #7D1F20;
    }

    td {
      padding: 8px 10px;
      border: 1px solid #E4E1DC;
      vertical-align: top;
    }

    tr:nth-child(even) {
      background: #FDFBF7;
    }

    /* Figures & Screenshots */
    .figure-container {
      margin: 18px auto;
      text-align: center;
      page-break-inside: avoid;
    }

    .figure-img-wrapper {
      display: inline-block;
      max-width: 95%;
      border: 1px solid #D1CDC7;
      border-radius: 6px;
      padding: 4px;
      background: #FAFAFA;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }

    .figure-img {
      max-width: 100%;
      height: auto;
      max-height: 290px;
      display: block;
      border-radius: 4px;
    }

    .figure-caption {
      margin-top: 6px;
      font-size: 9pt;
      font-weight: 700;
      color: #555555;
      font-style: italic;
    }

    /* Step boxes */
    .step-box {
      background: #FDFBF7;
      border: 1px solid #E4E1DC;
      border-left: 4px solid #9E2A2B;
      border-radius: 4px;
      padding: 12px 15px;
      margin-bottom: 15px;
      page-break-inside: avoid;
    }

    .step-title {
      font-weight: 700;
      color: #9E2A2B;
      font-size: 11pt;
      margin-bottom: 4px;
    }

    .step-purpose {
      font-size: 9.5pt;
      color: #555555;
      margin-bottom: 8px;
    }

    .step-list {
      margin: 0;
      padding-left: 20px;
      font-size: 9.5pt;
    }

    .step-list li {
      margin-bottom: 4px;
    }

    .expected-result {
      background: #EEF8F1;
      border-left: 3px solid #28A745;
      padding: 6px 10px;
      font-size: 9pt;
      margin-top: 8px;
      color: #155724;
      font-weight: 500;
    }

    .alert-box {
      background: #FEF7E7;
      border-left: 4px solid #D4AF37;
      padding: 10px 14px;
      font-size: 9.5pt;
      margin: 15px 0;
      border-radius: 4px;
      color: #795548;
    }

    .alert-title {
      font-weight: 700;
      color: #8D6E63;
      margin-bottom: 3px;
    }

    /* Badge */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 8pt;
      font-weight: 700;
      border-radius: 3px;
      text-transform: uppercase;
    }

    .badge-primary { background: #9E2A2B; color: #FFFFFF; }
    .badge-gold { background: #D4AF37; color: #1F1D1B; }
    .badge-success { background: #28A745; color: #FFFFFF; }

    /* TOC */
    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px dotted #CCCCCC;
      font-size: 10pt;
    }

    .toc-title {
      font-weight: 600;
    }

    .toc-page {
      font-weight: 700;
      color: #9E2A2B;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="univ-header">
      <h3 class="univ-name">Marinduque State University</h3>
      <h4 class="college-name">College of Information and Computing Sciences</h4>
      <p class="dept-name">Bachelor of Science in Information Technology • Capstone Project 2</p>
    </div>

    <div>
      <div class="deliverable-tag">Deliverable #7</div>
      <h1 class="manual-title">USER’S MANUAL OF THE SYSTEM</h1>
      <h2 class="manual-subtitle">G-TRAMS: Gasan Tricycle Regulatory and Automated Management System</h2>
      <p class="system-desc-brief">
        An End-to-End Operational and Practical User Guide for Tricycle Operators, TODA Officers, Traffic Enforcers, Municipal Cashiers, Licensing Staff, and System Administrators.
      </p>

      <div class="cover-meta-card">
        <div class="cover-meta-row">
          <span class="cover-meta-label">System Title:</span>
          <span class="cover-meta-value">Gasan Tricycle Regulatory and Automated Management System (G-TRAMS)</span>
        </div>
        <div class="cover-meta-row">
          <span class="cover-meta-label">Production URL:</span>
          <span class="cover-meta-value"><a href="https://g-trams-official.vercel.app" style="color:#9E2A2B;text-decoration:none;">https://g-trams-official.vercel.app</a></span>
        </div>
        <div class="cover-meta-row">
          <span class="cover-meta-label">Target Beneficiary:</span>
          <span class="cover-meta-value">Municipality of Gasan, Marinduque (BPLO & Municipal Treasury)</span>
        </div>
        <div class="cover-meta-row">
          <span class="cover-meta-label">Project Team:</span>
          <span class="cover-meta-value">
            Jhon Kyn Axix H. Cabrigas (Lead Backend Developer)<br>
            Justine S. Lachica (Frontend Developer)<br>
            Jay Vincent G. Motol (QA Tester)<br>
            Ian Simon Francis M. Rey (DevOps Engineer)
          </span>
        </div>
        <div class="cover-meta-row">
          <span class="cover-meta-label">Academic Year:</span>
          <span class="cover-meta-value">A.Y. 2026–2027 • First Semester</span>
        </div>
        <div class="cover-meta-row">
          <span class="cover-meta-label">System Version:</span>
          <span class="cover-meta-value">Version 2.4.0 (Production Release)</span>
        </div>
        <div class="cover-meta-row">
          <span class="cover-meta-label">Document Date:</span>
          <span class="cover-meta-value">November 2026</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      Empowering Minds, Transforming Lives, and Advancing Opportunities with HEART<br>
      MarSU | Panfilo M. Manguera Sr. Rd., Brgy. Tanza, Boac, Marinduque, Philippines 4900
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TABLE OF CONTENTS -->
  <h1>Table of Contents</h1>
  <div style="margin-top: 20px;">
    <div class="toc-item"><span class="toc-title">1. System Overview</span><span class="toc-page">Page 3</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">1.1 Description of the System</span><span class="toc-page">Page 3</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">1.2 Purpose and Objectives</span><span class="toc-page">Page 3</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">1.3 Intended Users & Role Matrix</span><span class="toc-page">Page 4</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">1.4 Major Features & Capabilities</span><span class="toc-page">Page 4</span></div>

    <div class="toc-item"><span class="toc-title">2. System Requirements and Access</span><span class="toc-page">Page 5</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.1 Hardware and Device Compatibility</span><span class="toc-page">Page 5</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.2 Web Browser & Software Requirements</span><span class="toc-page">Page 5</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.3 Internet Connectivity</span><span class="toc-page">Page 5</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.4 Official System Access URL</span><span class="toc-page">Page 5</span></div>

    <div class="toc-item"><span class="toc-title">3. Getting Started</span><span class="toc-page">Page 6</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">3.1 Accessing the Web Portal</span><span class="toc-page">Page 6</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">3.2 User Registration with Dual-Contact Recovery</span><span class="toc-page">Page 6</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">3.3 Logging In & Session Management</span><span class="toc-page">Page 7</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">3.4 Forgot Password & Account Recovery</span><span class="toc-page">Page 8</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">3.5 Navigation & Accessibility Controls (Language, Theme, Text Resize)</span><span class="toc-page">Page 8</span></div>

    <div class="toc-item"><span class="toc-title">4. Step-by-Step User Instructions (By Role)</span><span class="toc-page">Page 9</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">4.1 Tricycle Operator Portal</span><span class="toc-page">Page 9</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">4.2 TODA President Portal</span><span class="toc-page">Page 12</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">4.3 Traffic Enforcer / PNP Mobile Verification</span><span class="toc-page">Page 13</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">4.4 Municipal Cashier & Treasury Portal</span><span class="toc-page">Page 14</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">4.5 BPLO Licensing & Franchising Staff</span><span class="toc-page">Page 16</span></div>
    <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">4.6 System Administrator & IT Portal</span><span class="toc-page">Page 18</span></div>

    <div class="toc-item"><span class="toc-title">5. Error Handling and Troubleshooting</span><span class="toc-page">Page 20</span></div>
    <div class="toc-item"><span class="toc-title">6. Frequently Asked Questions (FAQs)</span><span class="toc-page">Page 22</span></div>
    <div class="toc-item"><span class="toc-title">7. Security and User Reminders</span><span class="toc-page">Page 23</span></div>
    <div class="toc-item"><span class="toc-title">8. Support and Contact Information</span><span class="toc-page">Page 24</span></div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 1: SYSTEM OVERVIEW -->
  <h1>1. System Overview</h1>

  <h2>1.1 Description of the System</h2>
  <p>
    The <strong>Gasan Tricycle Regulatory and Automated Management System (G-TRAMS)</strong> is a modernized, cloud-hosted municipal web application engineered to transition the tricycle franchise registration, monitoring, citation ticketing, and fee collection processes of the <strong>Municipality of Gasan, Marinduque</strong> into a seamless digital workflow.
  </p>
  <p>
    Prior to G-TRAMS, tricycle operators, TODA officers, and municipal licensing personnel contended with paper-heavy document verifications, physical claim stubs, manual body number logbooks, and fragmented payment records. G-TRAMS resolves these challenges by introducing a centralized, role-based platform equipped with AI-assisted Optical Character Recognition (OCR), automated unique body number conflict detection, QR-code enabled MTOP and digital ID verification, automated weekly database backups, and COA-compliant daily collection remittance reporting.
  </p>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.landing}" class="figure-img" alt="G-TRAMS Public Portal">
    </div>
    <div class="figure-caption">Figure 1. G-TRAMS Public Homepage & Transparency Telemetry Portal</div>
  </div>

  <h2>1.2 Purpose and Objectives</h2>
  <p>The primary objectives of G-TRAMS are:</p>
  <ul>
    <li><strong>Streamline MTOP Processing:</strong> Reduce the franchise application and renewal turnaround time from several days to under 24 hours through a structured multi-step digital pipeline (Pending Review → For Payment → For Signing → Ready for Pickup → Active).</li>
    <li><strong>Prevent Fraud & Duplicate Records:</strong> Enforce strict database-level unique constraints and AI-powered validation on motor numbers, chassis numbers, plate numbers, and assigned tricycle body numbers.</li>
    <li><strong>Empower On-Site Enforcement:</strong> Equip traffic enforcers and PNP personnel with mobile QR-scanning capabilities to instantly verify physical IDs and MTOP windshield certificates in real time.</li>
    <li><strong>Ensure Fiscal Transparency:</strong> Provide the Municipal Treasury with instant fee calculation, digital receipt recording, and 1-click COA-compliant Daily Remittance Sheet generation with CSV export.</li>
    <li><strong>Guarantee Disaster Recovery:</strong> Implement automated weekly database backups (every Sunday midnight) with direct in-memory offline downloads to safeguard municipal data.</li>
  </ul>

  <h2>1.3 Intended Users & Role Matrix</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">User Role</th>
        <th style="width: 35%;">Primary Responsibilities</th>
        <th style="width: 40%;">Key Features Accessible</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Tricycle Operator</strong></td>
        <td>Applies for new franchises, submits renewals, views digital ID & MTOP permit.</td>
        <td>Online Application, Document Upload, Status Tracker, Digital ID Card with QR, MTOP Certificate.</td>
      </tr>
      <tr>
        <td><strong>TODA President</strong></td>
        <td>Manages association membership, verifies rosters, and endorses applicants.</td>
        <td>Member Roster Management, Individual Member Addition, TODA Clearance Issuance, Member Removal.</td>
      </tr>
      <tr>
        <td><strong>Traffic Enforcer / PNP</strong></td>
        <td>Conducts road inspections and issues violation citation tickets.</td>
        <td>Mobile QR Scanner, Live Franchise Status Lookup, On-Site Violation Issuance, SMS Violation Alerts.</td>
      </tr>
      <tr>
        <td><strong>Municipal Cashier</strong></td>
        <td>Collects franchise fees and traffic violation fines, issues Official Receipts (OR).</td>
        <td>Payment Queue, Cash & GCash Logging, OR Registry, Daily Treasury Remittance Sheet & CSV Export.</td>
      </tr>
      <tr>
        <td><strong>BPLO Licensing Officer</strong></td>
        <td>Validates applications, inspects uploaded OR/CR documents, schedules physical inspections.</td>
        <td>Franchise Review Queue, AI OCR Cross-Check, Masterlist, Inspection Scheduler, MTOP Certificate Issuance.</td>
      </tr>
      <tr>
        <td><strong>System Administrator</strong></td>
        <td>Maintains platform security, manages user accounts, configures policies, and executes DRP.</td>
        <td>Executive Analytics, User Accounts (RBAC), TODA Masterlist, Audit Logs, Weekly Database Backup & Restore.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- SECTION 2: SYSTEM REQUIREMENTS -->
  <h1>2. System Requirements and Access</h1>

  <h2>2.1 Hardware and Device Compatibility</h2>
  <p>G-TRAMS is responsive and accessible across modern desktop, laptop, tablet, and smartphone form factors:</p>
  <ul>
    <li><strong>Desktop / Laptop PCs (Recommended for Admin, BPLO, Cashier):</strong> Intel Core i3 / AMD Ryzen 3 or higher, minimum 4GB RAM, display resolution of 1366×768 or higher.</li>
    <li><strong>Mobile Phones / Tablets (Recommended for Operators & Enforcers):</strong> Android 9.0+ or iOS 14.0+ with camera capability for QR code scanning and document uploads.</li>
  </ul>

  <h2>2.2 Web Browser Requirements</h2>
  <p>G-TRAMS is optimized for standards-compliant modern web browsers with JavaScript enabled:</p>
  <table>
    <thead>
      <tr>
        <th>Browser Name</th>
        <th>Minimum Supported Version</th>
        <th>Recommended Version</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Google Chrome</td><td>Version 100+</td><td>Latest Stable (120+)</td></tr>
      <tr><td>Microsoft Edge</td><td>Version 100+</td><td>Latest Chromium Release</td></tr>
      <tr><td>Mozilla Firefox</td><td>Version 105+</td><td>Latest Stable</td></tr>
      <tr><td>Apple Safari</td><td>Version 15+</td><td>Version 17+ (macOS / iOS)</td></tr>
    </tbody>
  </table>

  <h2>2.3 Internet Connectivity</h2>
  <ul>
    <li><strong>Standard Connection:</strong> Broadband, Wi-Fi, or 4G/5G mobile data with a minimum download speed of <strong>256 kbps</strong>.</li>
    <li><strong>Offline PWA Support:</strong> G-TRAMS is Progressive Web App (PWA) enabled. Core public guidelines and cached operator IDs can be viewed even during intermittent network disconnects.</li>
  </ul>

  <h2>2.4 Official System Access Instructions</h2>
  <p>To access the production deployment of G-TRAMS:</p>
  <div class="step-box">
    <div class="step-title">Accessing the Web Portal</div>
    <div class="step-purpose">Launch any web browser on your device and navigate to the official URL.</div>
    <ul class="step-list">
      <li>1. Open Google Chrome, Microsoft Edge, or Safari.</li>
      <li>2. In the address bar, type: <strong><a href="https://g-trams-official.vercel.app" style="color:#9E2A2B;text-decoration:none;">https://g-trams-official.vercel.app</a></strong> and press Enter.</li>
      <li>3. Ensure the security padlock icon (SSL/TLS encrypted) is displayed next to the URL.</li>
    </ul>
    <div class="expected-result">Expected Result: The official G-TRAMS homepage is loaded displaying municipal announcements, public metrics, and the login navigation button.</div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 3: GETTING STARTED -->
  <h1>3. Getting Started</h1>

  <h2>3.1 User Registration with Dual-Contact Recovery</h2>
  <p>
    All citizens and tricycle operators in Gasan can create a free account. G-TRAMS requires a <strong>Primary Contact</strong> (Phone or Email) as well as an <strong>Account Recovery Contact</strong>. This ensures that even if an operator loses their SIM card or phone, account ownership can be restored securely.
  </p>

  <div class="step-box">
    <div class="step-title">Procedure: Registering a New Account</div>
    <div class="step-purpose">Creates a new operator profile with multi-channel authentication.</div>
    <ol class="step-list">
      <li>From the home page or login screen, click the <strong>"Register"</strong> link.</li>
      <li>Enter your <strong>Full Name</strong> (e.g., Juan Dela Cruz) as indicated on your government ID.</li>
      <li>Select your <strong>Barangay / Address</strong> in Gasan, Marinduque from the dropdown.</li>
      <li>Enter your <strong>Primary Contact</strong> (Active 11-digit mobile number 09XXXXXXXXX or active email).</li>
      <li>Enter your <strong>Backup / Recovery Contact</strong> (Secondary mobile number or backup email).</li>
      <li>Select your <strong>TODA Association</strong> (or choose "NON-TODA" if not affiliated).</li>
      <li>Create a secure <strong>Password</strong> (minimum 8 characters with at least 1 uppercase letter, 1 number, and 1 symbol).</li>
      <li>Re-type password in <strong>Confirm Password</strong>, check the Terms & Privacy Agreement, and click <strong>"Send OTP"</strong>.</li>
      <li>Enter the 6-digit One-Time Password (OTP) received on your contact to activate the account.</li>
    </ol>
    <div class="expected-result">Expected Result: Your account is verified, and you are redirected to the Login page with a success notification.</div>
  </div>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.register}" class="figure-img" alt="G-TRAMS Registration Screen">
    </div>
    <div class="figure-caption">Figure 2. G-TRAMS User Registration & Dual-Contact Recovery Setup</div>
  </div>

  <h2>3.2 Logging In & Session Management</h2>
  <p>
    G-TRAMS utilizes Role-Based Access Control (RBAC). Upon login, the system automatically redirects you to your designated dashboard (Operator, Cashier, BPLO, or System Admin).
  </p>

  <div class="step-box">
    <div class="step-title">Procedure: Logging In</div>
    <div class="step-purpose">Authenticates user identity and grants access to role-specific capabilities.</div>
    <ol class="step-list">
      <li>Navigate to <strong>https://g-trams-official.vercel.app/login</strong>.</li>
      <li>In the <strong>Email or Phone Number</strong> field, type your registered credentials.</li>
      <li>In the <strong>Password</strong> field, type your password. You may click the eye icon to view text.</li>
      <li>Click the maroon <strong>"Log In"</strong> button.</li>
    </ol>
    <div class="expected-result">Expected Result: The system validates credentials and immediately redirects you to your corresponding role portal.</div>
  </div>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.login}" class="figure-img" alt="G-TRAMS Login Screen">
    </div>
    <div class="figure-caption">Figure 3. Official G-TRAMS Secured Login Interface</div>
  </div>

  <h2>3.3 Password Reset & Account Recovery</h2>
  <div class="step-box">
    <div class="step-title">Procedure: Resetting a Forgotten Password</div>
    <div class="step-purpose">Allows users who cannot recall their password to securely reset it using verified OTP.</div>
    <ol class="step-list">
      <li>On the Login page, click the <strong>"Forgot Password?"</strong> link.</li>
      <li>Enter your registered primary contact OR your verified backup recovery contact.</li>
      <li>Click <strong>"Send Reset Code"</strong>. Check your SMS or email for the 6-digit reset code.</li>
      <li>Enter the reset code along with your new password.</li>
      <li>Click <strong>"Update Password"</strong>.</li>
    </ol>
    <div class="expected-result">Expected Result: Password is encrypted and updated. You can now log in using the new credentials.</div>
  </div>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.forgotPass}" class="figure-img" alt="G-TRAMS Forgot Password Screen">
    </div>
    <div class="figure-caption">Figure 4. Password Reset & Multi-Channel Recovery Screen</div>
  </div>

  <h2>3.4 Navigation & Accessibility Features</h2>
  <p>
    To promote accessibility for all citizens including senior operators, G-TRAMS features built-in controls in the header banner:
  </p>
  <ul>
    <li><strong>Text Resizing:</strong> Click the <em>"Text Size"</em> button to toggle between <strong>Karaniwan (100%)</strong>, <strong>Malaki (115%)</strong>, and <strong>Pinakamalaki (130%)</strong>. All labels and inputs scale dynamically.</li>
    <li><strong>Theme Toggle:</strong> Switch between <strong>Light Mode</strong> and <strong>Dark Mode</strong> for comfortable night-time or outdoor visibility.</li>
    <li><strong>Bilingual Support:</strong> Easily toggle interface terminology between <strong>Filipino / Tagalog</strong> and <strong>English</strong>.</li>
  </ul>

  <div class="page-break"></div>

  <!-- SECTION 4: STEP-BY-STEP USER INSTRUCTIONS -->
  <h1>4. Step-by-Step User Instructions</h1>

  <h2>4.1 Tricycle Operator Portal</h2>
  <p>
    The Operator Portal enables tricycle drivers and operators to manage their units, apply for franchise permits, monitor inspection progress, and present digital credentials to traffic enforcers.
  </p>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.operatorDash}" class="figure-img" alt="Operator Dashboard">
    </div>
    <div class="figure-caption">Figure 5. Operator Dashboard with Application Pipeline Status & Digital Permit</div>
  </div>

  <div class="step-box">
    <div class="step-title">Feature: New Franchise Application (Multi-Step Form with AI OCR)</div>
    <div class="step-purpose">Submits an application for a new tricycle franchise with automatic document extraction.</div>
    <ol class="step-list">
      <li>From the Operator Dashboard sidebar, click <strong>"Apply Franchise"</strong>.</li>
      <li><strong>Step 1 (Vehicle Specifications):</strong> Enter Make/Brand (e.g. Kawasaki, Honda), Model Year, Motor Number, Chassis Number, and Plate Number.</li>
      <li><strong>Step 2 (Document Uploads):</strong> Upload high-clarity photos of:
        <ul>
          <li>LTO Official Receipt (OR)</li>
          <li>LTO Certificate of Registration (CR)</li>
          <li>Driver's License (Professional)</li>
          <li>Barangay Clearance / TODA Clearance Certificate</li>
          <li>Cedula (Community Tax Certificate)</li>
        </ul>
      </li>
      <li><strong>AI Optical Character Recognition (OCR):</strong> The system uses Google Gemini Vision to automatically extract Motor No., Chassis No., and Registered Owner, cross-checking them against your typed input to eliminate human typo errors.</li>
      <li>Review all details in the Summary tab and click <strong>"Submit Application"</strong>.</li>
    </ol>
    <div class="expected-result">Expected Result: The application is assigned a tracking number and appears as <strong>"Pending Review"</strong> in your dashboard timeline.</div>
  </div>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.applyFranchise}" class="figure-img" alt="Franchise Application Form">
    </div>
    <div class="figure-caption">Figure 6. Multi-Step Franchise Application Form with Real-Time OCR Parsing</div>
  </div>

  <div class="step-box">
    <div class="step-title">Feature: Franchise Renewal Application</div>
    <div class="step-purpose">Renews an existing franchise permit nearing expiry without re-entering unchanged vehicle data.</div>
    <ol class="step-list">
      <li>In the Operator Dashboard, locate your existing franchise card with an <em>"Expiring Soon"</em> or <em>"Renewable"</em> badge.</li>
      <li>Click the amber <strong>"Renew Franchise"</strong> button.</li>
      <li>The existing vehicle details are pre-loaded automatically.</li>
      <li>Upload the updated annual Cedula and current LTO OR/CR validation receipt.</li>
      <li>Click <strong>"Submit Renewal"</strong>.</li>
    </ol>
    <div class="expected-result">Expected Result: Renewal application is queued directly to BPLO for verification and Cashier fee settlement.</div>
  </div>

  <div class="step-box">
    <div class="step-title">Feature: Accessing Digital Operator ID & MTOP Certificate with QR</div>
    <div class="step-purpose">Presents genuine, verifiable digital credentials on smartphones during road inspections.</div>
    <ol class="step-list">
      <li>Once the franchise is approved and active, click <strong>"View Digital ID"</strong> on your dashboard.</li>
      <li>The digital ID renders your registered photo, Operator Full Name, TODA Association, Plate Number, and official QR code.</li>
      <li>Click <strong>"Download MTOP Certificate"</strong> to save a printable copy with municipal seals and security watermark.</li>
    </ol>
    <div class="expected-result">Expected Result: High-definition printable PDF or on-screen digital badge displays with active QR verification link.</div>
  </div>

  <div class="page-break"></div>

  <h2>4.2 TODA President Portal</h2>
  <p>
    TODA Presidents have exclusive administrative authority over their designated tricycle association roster. They endorse new members, monitor active drivers, and submit official membership filings to the BPLO.
  </p>

  <div class="step-box">
    <div class="step-title">Feature: TODA Member Roster & Individual Member Addition</div>
    <div class="step-purpose">Registers a single new tricycle driver or operator into the TODA roster with a unique Body Number.</div>
    <ol class="step-list">
      <li>Log in using your TODA President account.</li>
      <li>Click <strong>"Submit Members"</strong> on the navigation menu.</li>
      <li>Click the <strong>"Add Member"</strong> button.</li>
      <li>Type the <strong>Member Full Name</strong>, <strong>Contact Number</strong>, and <strong>Assigned Body Number</strong> (e.g. 042).</li>
      <li>Click <strong>"Save Member"</strong>. G-TRAMS performs an instant conflict check against the municipal masterlist to ensure no other tricycle in Gasan possesses that Body Number.</li>
    </ol>
    <div class="expected-result">Expected Result: The member is added to your association roster and an official TODA endorsement is generated in the municipal database.</div>
  </div>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.todaRoster}" class="figure-img" alt="TODA Roster Management">
    </div>
    <div class="figure-caption">Figure 7. TODA President Roster Management & Membership Submission Interface</div>
  </div>

  <div class="step-box">
    <div class="step-title">Feature: Member Removal Request</div>
    <div class="step-purpose">Files an official request to remove or drop a member who has transferred, retired, or violated TODA rules.</div>
    <ol class="step-list">
      <li>In the TODA Roster table, click the red <strong>"Request Removal"</strong> icon next to the member's name.</li>
      <li>Select the removal reason (e.g., Voluntary Resignation, Expulsion, Transfer of Residence).</li>
      <li>Upload supporting minutes or resolution document.</li>
      <li>Click <strong>"Submit Removal Request"</strong>.</li>
    </ol>
    <div class="expected-result">Expected Result: Request is sent to BPLO for revocation review, preventing unauthorized franchise renewals under that TODA.</div>
  </div>

  <div class="page-break"></div>

  <h2>4.3 Traffic Enforcer / PNP Mobile Verification Portal</h2>
  <p>
    Traffic enforcers on the road can authenticate any tricycle operating in Gasan within seconds using any mobile phone camera or built-in scanner.
  </p>

  <div class="step-box">
    <div class="step-title">Feature: QR Code Inspection & Dual-Lookup Verification</div>
    <div class="step-purpose">Instantly validates whether a tricycle holds an authentic, active MTOP permit issued by the LGU.</div>
    <ol class="step-list">
      <li>Using any smartphone camera or QR scanning app, scan the QR code printed on the operator's physical ID card OR on the vehicle's MTOP windshield sticker.</li>
      <li>The browser automatically opens the secure verification page: <strong>https://g-trams-official.vercel.app/verify/:id</strong>.</li>
      <li>G-TRAMS' dual-lookup engine checks both User IDs and Franchise IDs.</li>
      <li>The screen displays:
        <ul>
          <li><strong>Franchise Status:</strong> <span class="badge badge-success">ACTIVE</span> or <span class="badge badge-primary">EXPIRED / UNREGISTERED</span></li>
          <li><strong>Official Body Number</strong> (e.g. GAS-104)</li>
          <li><strong>Registered Owner & Driver Name</strong></li>
          <li><strong>TODA Association & Zone</strong></li>
          <li><strong>Plate Number, Make & Motor Number</strong></li>
        </ul>
      </li>
    </ol>
    <div class="expected-result">Expected Result: Verified genuine information displays with an official municipal green verification shield. If forged, a red warning is shown.</div>
  </div>

  <div class="step-box">
    <div class="step-title">Feature: Issuing Digital Citation Tickets & Violation Logging</div>
    <div class="step-purpose">Logs road traffic infractions on-site and triggers instant SMS alert to the operator.</div>
    <ol class="step-list">
      <li>On the verification page or enforcer terminal, click <strong>"Issue Violation Ticket"</strong>.</li>
      <li>Select the violation offense from the ordinance masterlist (e.g. Overcharging Fare, No Franchise/Colorum, Refusal to Convey, Arrogant Driver).</li>
      <li>Specify the apprehension location (e.g., Maharlika Highway, Poblacion).</li>
      <li>Click <strong>"Issue Citation"</strong>.</li>
    </ol>
    <div class="expected-result">Expected Result: A citation ticket number is recorded in the municipal database, the operator receives an immediate SMS notification, and the fine is queued in the Treasury Cashier terminal.</div>
  </div>

  <div class="page-break"></div>

  <h2>4.4 Municipal Cashier & Treasury Portal</h2>
  <p>
    The Cashier Module is strictly restricted to Municipal Treasury personnel to handle payment settlement, issue official receipts (OR), and balance daily collections.
  </p>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.cashierDash}" class="figure-img" alt="Cashier Terminal">
    </div>
    <div class="figure-caption">Figure 8. Municipal Treasury Cashier Collection Terminal</div>
  </div>

  <div class="step-box">
    <div class="step-title">Feature: Payment Collection & Official Receipt (OR) Issuance</div>
    <div class="step-purpose">Processes fee settlement for franchise applications and citation penalties.</div>
    <ol class="step-list">
      <li>In the Cashier Dashboard, view the <strong>"Payment Queue"</strong> tab. All applications marked <em>"For Payment"</em> appear here.</li>
      <li>Click <strong>"Process Payment"</strong> on the applicant's row.</li>
      <li>Verify the total amount (e.g. Franchise Fee: ₱350.00, Inspection: ₱50.00, Total: ₱400.00).</li>
      <li>Select payment method: <strong>Cash (Over-the-Counter)</strong> or <strong>GCash / Digital Payment</strong>.</li>
      <li>Type the physical <strong>Official Receipt (OR) Number</strong> from the LGU receipt booklet.</li>
      <li>Click <strong>"Confirm & Issue Receipt"</strong>.</li>
    </ol>
    <div class="expected-result">Expected Result: The payment is permanently stamped with timestamp, cashier ID, and OR number. The franchise status advances to <em>"For Signing"</em>.</div>
  </div>

  <div class="step-box">
    <div class="step-title">Feature: Daily Treasury Remittance Sheet & 1-Click CSV Export</div>
    <div class="step-purpose">Generates an end-of-day COA-compliant collection summary for turnover to the Municipal Treasurer.</div>
    <ol class="step-list">
      <li>In the Cashier Dashboard, click the gold <strong>"Remittance Sheet"</strong> button in the header.</li>
      <li>The modal displays today's metrics:
        <ul>
          <li><strong>Total Collections:</strong> Exact gross pesos collected today.</li>
          <li><strong>Total Receipts:</strong> Count of official receipts issued.</li>
          <li><strong>Breakdown by Type:</strong> New Franchise vs. Renewal vs. Violations.</li>
        </ul>
      </li>
      <li>Click <strong>"Print Remittance Sheet"</strong> for a paper turnover copy with official signature lines for <em>Cashier / Disbursing Officer</em> and <em>Municipal Treasurer</em>.</li>
      <li>Click <strong>"Export CSV"</strong> to download the spreadsheet file: <code>GTRAMS_Treasury_Daily_Remittance_YYYY-MM-DD.csv</code>.</li>
    </ol>
    <div class="expected-result">Expected Result: Complete audit reconciliation is exported and archived for Commission on Audit (COA) compliance.</div>
  </div>

  <div class="page-break"></div>

  <h2>4.5 BPLO Licensing & Franchising Staff Portal</h2>
  <p>
    The Business Permits and Licensing Office (BPLO) staff serves as the core operational review team responsible for vetting applications, verifying vehicle documents, and releasing MTOP certificates.
  </p>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.bploDash}" class="figure-img" alt="BPLO Dashboard">
    </div>
    <div class="figure-caption">Figure 9. BPLO Licensing Overview Dashboard with Active Franchise Telemetry</div>
  </div>

  <div class="step-box">
    <div class="step-title">Feature: Application Queue Review & OCR Document Inspection</div>
    <div class="step-purpose">Reviews submitted applications, inspects attached credentials, and verifies OCR results.</div>
    <ol class="step-list">
      <li>Navigate to <strong>"Franchise Approval"</strong> on the sidebar.</li>
      <li>Click <strong>"Review"</strong> on an application in the <em>Pending Review</em> queue.</li>
      <li>View the side-by-side comparison between the applicant's typed entries and the OCR extracted values from the uploaded LTO OR/CR and Driver's License.</li>
      <li>If documents are authentic and match the registered owner, click <strong>"Approve for Payment"</strong>.</li>
      <li>If an uploaded document is blurred or incorrect, click <strong>"Request Correction"</strong> and provide specific feedback (an SMS alert is dispatched automatically to the applicant).</li>
    </ol>
    <div class="expected-result">Expected Result: Validated application transitions to the Cashier fee settlement queue.</div>
  </div>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.bploQueue}" class="figure-img" alt="Franchise Approval Queue">
    </div>
    <div class="figure-caption">Figure 10. Franchise Approval Pipeline & Multi-Stage Stage Status Filters</div>
  </div>

  <div class="step-box">
    <div class="step-title">Feature: Physical Inspection Scheduling & MTOP Certificate Issuance</div>
    <div class="step-purpose">Coordinates vehicle roadworthiness inspection and approves final permit release.</div>
    <ol class="step-list">
      <li>Once payment is settled by the Cashier, open the application in the <em>"For Inspection"</em> stage.</li>
      <li>Assign an inspection timeslot and inspector name.</li>
      <li>Once the vehicle passes smoke, lights, sidecar, and brake inspection, mark <strong>"Inspection Passed"</strong>.</li>
      <li>Assign the final official <strong>Tricycle Body Number</strong> (system validates uniqueness).</li>
      <li>Click <strong>"Approve & Release MTOP"</strong>.</li>
    </ol>
    <div class="expected-result">Expected Result: Franchise status becomes <span class="badge badge-success">ACTIVE</span>. An MTOP certificate and digital ID card are instantly generated and accessible by the operator.</div>
  </div>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.masterlist}" class="figure-img" alt="Franchise Masterlist">
    </div>
    <div class="figure-caption">Figure 11. Comprehensive Franchise Masterlist with Search, Filter & CSV Export</div>
  </div>

  <div class="page-break"></div>

  <h2>4.6 System Administrator & IT Portal</h2>
  <p>
    The System Administrator portal gives municipal IT officers full supervision over system security, user accounts, audit telemetry, and disaster recovery.
  </p>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.adminDash}" class="figure-img" alt="Admin Dashboard">
    </div>
    <div class="figure-caption">Figure 12. System Administrator Master Dashboard with Live System Health & KPIs</div>
  </div>

  <div class="step-box">
    <div class="step-title">Feature: Role-Based User Account Management</div>
    <div class="step-purpose">Provisions user accounts, assigns roles, and deactivates accounts upon departure.</div>
    <ol class="step-list">
      <li>Click <strong>"User Accounts"</strong> on the sidebar.</li>
      <li>Search users by name, contact, or assigned role.</li>
      <li>To change role (e.g. promote staff to Cashier or BPLO), click <strong>"Edit Role"</strong>.</li>
      <li>To suspend an account for policy violations, click <strong>"Deactivate"</strong>.</li>
    </ol>
    <div class="expected-result">Expected Result: Role permissions take effect immediately across all active sessions.</div>
  </div>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.userMgmt}" class="figure-img" alt="User Management">
    </div>
    <div class="figure-caption">Figure 13. Role-Based User Account Management & Status Management</div>
  </div>

  <div class="step-box">
    <div class="step-title">Feature: Database Backup & Disaster Recovery Plan (DRP)</div>
    <div class="step-purpose">Executes scheduled weekly backups, manual offline snapshot downloads, and database restoration.</div>
    <ol class="step-list">
      <li>Navigate to <strong>"System Settings & Policy"</strong> and click Tab 5: <strong>"Database Backup & Disaster Recovery"</strong>.</li>
      <li><strong>Automated Weekly Cron:</strong> Runs every <strong>Sunday at 12:00 MN</strong>, creating a compressed <code>.json.gz</code> snapshot of all 13 collections with an 8-week rolling retention.</li>
      <li><strong>On-Demand Manual Snapshot:</strong> Click <strong>"Backup Database Now"</strong> to trigger an immediate live database dump.</li>
      <li><strong>Direct Offline Download:</strong> Click <strong>"Direct Offline Download"</strong> to stream the compressed gzipped database archive directly to your local laptop or flash drive (solves ephemeral cloud container resets).</li>
      <li><strong>Upload & Restore:</strong> In the event of catastrophic server failure, click <strong>"Upload & Restore"</strong>, select the <code>.json.gz</code> archive, type <code>RESTORE</code> in the confirmation prompt, and click <strong>"Execute Restore"</strong>.</li>
    </ol>
    <div class="expected-result">Expected Result: Database collections are fully restored to the selected snapshot within seconds with zero data corruption.</div>
  </div>

  <div class="figure-container">
    <div class="figure-img-wrapper">
      <img src="${images.adminSettings}" class="figure-img" alt="Admin Database Backup">
    </div>
    <div class="figure-caption">Figure 14. Database Backup & Disaster Recovery Management in System Settings</div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 5: ERROR HANDLING AND TROUBLESHOOTING -->
  <h1>5. Error Handling and Troubleshooting</h1>
  <p>
    This section outlines common operational errors, their root causes, and step-by-step resolution procedures.
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Problem / Error</th>
        <th style="width: 35%;">Probable Cause</th>
        <th style="width: 40%;">Recommended Solution</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Unable to Log In ("Invalid Credentials")</strong></td>
        <td>Incorrect email/phone or password was typed. Account may also be deactivated.</td>
        <td>
          1. Verify Caps Lock is turned off.<br>
          2. Check phone number format (must be 09XXXXXXXXX).<br>
          3. Use the "Forgot Password" link to reset credentials via OTP.<br>
          4. Contact Municipal IT if account has been deactivated.
        </td>
      </tr>
      <tr>
        <td><strong>OTP Not Received on Mobile Phone</strong></td>
        <td>Network carrier signal delay, SMS gateway congestion, or incorrect phone number.</td>
        <td>
          1. Wait for the 60-second countdown before requesting a resend.<br>
          2. Ensure mobile phone has cellular signal and inbox is not full.<br>
          3. If mobile SIM is lost, use the secondary recovery email option on the registration/recovery screen.
        </td>
      </tr>
      <tr>
        <td><strong>OCR Scanning Failed / Unreadable Document</strong></td>
        <td>Uploaded image is blurred, poorly lit, angled, or has glare covering text.</td>
        <td>
          1. Retake photo of the LTO OR/CR under bright lighting.<br>
          2. Ensure all four corners of the document are visible.<br>
          3. Use the manual entry fields to type the correct details if OCR encounters handwritten text.
        </td>
      </tr>
      <tr>
        <td><strong>Duplicate Body Number Error</strong></td>
        <td>The assigned tricycle body number is already active or allocated to another operator in Gasan.</td>
        <td>
          1. Check the TODA masterlist in the system.<br>
          2. Coordinate with BPLO licensing officer to reassign an available body number within your association's designated series.
        </td>
      </tr>
      <tr>
        <td><strong>Form Submission Error ("Network Error")</strong></td>
        <td>Intermittent Internet connection or file attachment exceeds 10 MB.</td>
        <td>
          1. Ensure file attachments (JPEG, PNG, PDF) are under 10 MB each.<br>
          2. Verify internet connection.<br>
          3. Clear browser cache and refresh page.
        </td>
      </tr>
      <tr>
        <td><strong>"Access Denied / Unauthorized" (403)</strong></td>
        <td>Attempting to access a URL outside your permitted user role (e.g., Operator accessing Cashier terminal).</td>
        <td>
          1. Return to your designated role dashboard.<br>
          2. If your role changed (e.g., promoted to BPLO staff), request the System Admin to update your account role in User Management.
        </td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- SECTION 6: FREQUENTLY ASKED QUESTIONS (FAQS) -->
  <h1>6. Frequently Asked Questions (FAQs)</h1>

  <div class="step-box">
    <div class="step-title">Q1: Sino ang kwalipikadong mag-apply ng tricycle franchise sa G-TRAMS?</div>
    <p>
      Lahat ng lehitimong residente ng Bayan ng Gasan na nagmamay-ari ng rehistradong motorized tricycle para sa pampublikong transportasyon, may wastong LTO OR/CR, Professional Driver's License, at Barangay / TODA Clearance ay kwalipikadong mag-apply.
    </p>
  </div>

  <div class="step-box">
    <div class="step-title">Q2: Gaano katagal ang validity ng isang MTOP franchise sa Gasan?</div>
    <p>
      Ayon sa Municipal Ordinance at nakatakda sa System Settings ng LGU Gasan, ang bagong prangkisa ay may bisa ng <strong>isang (1) taon</strong>. Ang mga aplikasyon para sa renewal ay maaaring isumite 30 hanggang 60 araw bago ang petsa ng pagkapaso upang maiwasan ang multa at penalty.
    </p>
  </div>

  <div class="step-box">
    <div class="step-title">Q3: Ano ang dapat kong gawin kung nawala ang aking cellphone o SIM card kung saan nakarehistro ang account?</div>
    <p>
      Pumunta sa <strong>Forgot Password</strong> page at piliin ang opsyon na magpadala ng reset code sa inyong nakatalang <strong>Backup / Recovery Contact</strong> (email o pangalawang telepono na inilagay noong rehistrasyon). Kung walang na-setup na recovery contact, magtungo sa BPLO Office sa Gasan Municipal Hall dala ang inyong valid government ID para sa manual account verification.
    </p>
  </div>

  <div class="step-box">
    <div class="step-title">Q4: Paano magbabayad ng franchise fee o violation ticket fine?</div>
    <p>
      Maaaring magbayad sa dalawang paraan:
      <strong>1. Over-the-Counter sa Municipal Treasury Cashier:</strong> Magtungo sa Window ng Cashier sa Municipal Hall at ibigay ang inyong Application / Ticket Number.
      <strong>2. Digital Payment (GCash):</strong> Maaaring gamitin ang GCash QR code terminal sa Cashier counter para sa cashless settlement.
      Palaging hingin ang inyong opisyal na Official Receipt (OR) pagkatapos magbayad.
    </p>
  </div>

  <div class="step-box">
    <div class="step-title">Q5: Paano malalaman ng Traffic Enforcer kung peke o expired ang aking prangkisa?</div>
    <p>
      Ang bawat MTOP Certificate at Operator Digital ID ay may natatanging encrypted QR Code. Kapag iniscan ito ng enforcer gamit ang anumang smartphone camera, bubukas ang live verification page ng LGU Gasan (<code>https://g-trams-official.vercel.app/verify/:id</code>) na nagpapakita ng tunay na status mula sa database. Hindi uubra ang mga pinatong o pekeng sticker dahil nakatugma ito sa plaka, motor number, at chassis number.
    </p>
  </div>

  <div class="step-box">
    <div class="step-title">Q6: Paano protektado ang aking personal na impormasyon alinsunod sa batas?</div>
    <p>
      Ang G-TRAMS ay mahigpit na sumusunod sa <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>. Ang mga password ay naka-encrypt gamit ang industry-standard Bcrypt hashing. Kapag nagpapatakbo ng automated database backup, ang mga pansamantalang OTP security tokens ay awtomatikong sinasala (stripped) upang hindi malantad ang security credentials.
    </p>
  </div>

  <div class="step-box">
    <div class="step-title">Q7: Ano ang gagawin kapag may "Maintenance Mode" notice sa portal?</div>
    <p>
      Nangangahulugan ito na ang Municipal IT Team ay nagsasagawa ng server upgrades, security patches, o annual database indexing. Maghintay lamang ng 15 hanggang 30 minuto bago muling mag-log in. Ang lahat ng nakabinbing aplikasyon ay mananatiling ligtas at hindi mawawala sa database.
    </p>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 7: SECURITY AND USER REMINDERS -->
  <h1>7. Security and User Reminders</h1>
  <p>
    Upang mapanatili ang integridad, seguridad, at legal na pagsunod ng system, ipinapaalala sa lahat ng mga gumagamit ang mga sumusunod na alituntunin:
  </p>

  <div class="alert-box">
    <div class="alert-title">1. Proteksyon ng Account Credentials at Passwords</div>
    Huwag kailanman ibahagi ang inyong password o One-Time Password (OTP) sa ibang tao, maging sa sinumang nagpapanggap na empleyado ng munisipyo. Ang lehitimong BPLO at IT staff ay hindi hihingin ang inyong password kailanman. Gumamit ng malalakas na password na may kombinasyon ng uppercase letters, numero, at simbolo.
  </div>

  <div class="alert-box">
    <div class="alert-title">2. Wastong Pag-Logout sa mga Shared Devices</div>
    Kung kayo ay gumagamit ng computer sa pampublikong lugar (tulad ng computer shop, municipal public kiosk, o hiniram na tablet), laging pindutin ang <strong>"Log Out"</strong> button bago lisanin ang estasyon. Huwag i-save ang password sa browser ng shared computer.
  </div>

  <div class="alert-box">
    <div class="alert-title">3. Pagsunod sa Data Privacy Act of 2012 (RA 10173)</div>
    Lahat ng personal na dokumento (OR/CR, lisensya, sedula) na inia-upload sa G-TRAMS ay gagamitin lamang para sa lehitimong layunin ng pagsusuri ng prangkisa sa Bayan ng Gasan. Mahigpit na ipinagbabawal sa mga kawani ng munisipyo ang pag-export o pagpapakalat ng personal na impormasyon ng mga operator nang walang pahintulot ng batas.
  </div>

  <div class="alert-box">
    <div class="alert-title">4. Paggamit Ayon sa Tamang Layunin (Fair Use Policy)</div>
    Ang G-TRAMS ay eksklusibong inilaan para sa pamamahala ng pampublikong prangkisa ng tricycle sa Munisipalidad ng Gasan. Ang sinumang magtangkang mag-upload ng malisyosong file, mag-forge ng QR codes, o gumawa ng pekeng aplikasyon ay papatawan ng kaukulang parusa sa ilalim ng umiiral na ordinansa ng munisipyo at Cybercrime Prevention Act of 2012 (RA 10175).
  </div>

  <div class="page-break"></div>

  <!-- SECTION 8: SUPPORT AND CONTACT INFORMATION -->
  <h1>8. Support and Contact Information</h1>
  <p>
    Para sa anumang katanungan, teknikal na tulong, o pag-uulat ng problema sa system, mangyaring makipag-ugnayan sa mga sumusunod na opisyal na tanggapan at kinatawan:
  </p>

  <div class="cover-meta-card" style="max-width: 100%; margin: 20px 0;">
    <div class="cover-meta-row">
      <span class="cover-meta-label">Primary Office:</span>
      <span class="cover-meta-value"><strong>Business Permits and Licensing Office (BPLO)</strong></span>
    </div>
    <div class="cover-meta-row">
      <span class="cover-meta-label">Physical Address:</span>
      <span class="cover-meta-value">2nd Floor, Gasan Municipal Hall, Barangay I (Poblacion), Gasan, Marinduque</span>
    </div>
    <div class="cover-meta-row">
      <span class="cover-meta-label">Operating Hours:</span>
      <span class="cover-meta-value">Lunes hanggang Biyernes, 8:00 AM – 5:00 PM (maliban sa Official Holidays)</span>
    </div>
    <div class="cover-meta-row">
      <span class="cover-meta-label">Treasury Office:</span>
      <span class="cover-meta-value">Municipal Treasury & Cashiering Division, Ground Floor, Gasan Municipal Hall</span>
    </div>
    <div class="cover-meta-row">
      <span class="cover-meta-label">Contact Hotline:</span>
      <span class="cover-meta-value">(042) 342-1234 / 0912-345-6789</span>
    </div>
    <div class="cover-meta-row">
      <span class="cover-meta-label">Official Support Email:</span>
      <span class="cover-meta-value"><a href="mailto:support@gasan.ph" style="color:#9E2A2B;">support@gasan.ph</a></span>
    </div>
    <div class="cover-meta-row">
      <span class="cover-meta-label">Official Facebook Page:</span>
      <span class="cover-meta-value"><a href="https://www.facebook.com/profile.php?id=61594718891549" style="color:#9E2A2B;">Pamahalaang Bayan ng Gasan - G-TRAMS Portal</a></span>
    </div>
    <div class="cover-meta-row">
      <span class="cover-meta-label">Production System URL:</span>
      <span class="cover-meta-value"><a href="https://g-trams-official.vercel.app" style="color:#9E2A2B;">https://g-trams-official.vercel.app</a></span>
    </div>
  </div>

  <h2>Capstone Project Development Team (Marinduque State University - CICS)</h2>
  <table>
    <thead>
      <tr>
        <th>Team Member</th>
        <th>Project Role</th>
        <th>Contact & Affiliation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Jhon Kyn Axix H. Cabrigas</strong></td>
        <td>Lead Backend Developer</td>
        <td>College of Information and Computing Sciences, MarSU</td>
      </tr>
      <tr>
        <td><strong>Justine S. Lachica</strong></td>
        <td>Frontend Developer</td>
        <td>College of Information and Computing Sciences, MarSU</td>
      </tr>
      <tr>
        <td><strong>Jay Vincent G. Motol</strong></td>
        <td>Quality Assurance & Testing Lead</td>
        <td>College of Information and Computing Sciences, MarSU</td>
      </tr>
      <tr>
        <td><strong>Ian Simon Francis M. Rey</strong></td>
        <td>DevOps & Infrastructure Engineer</td>
        <td>College of Information and Computing Sciences, MarSU</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 40px; text-align: center; font-size: 10pt; color: #777777;">
    — End of Deliverable #7 User's Manual —<br>
    <strong>G-TRAMS v2.4.0 • Municipality of Gasan, Marinduque • Marinduque State University CICS</strong>
  </div>

</body>
</html>
`;

const htmlPath = path.join(__dirname, 'Deliverable7_Group5_GTRAMS_UsersManual.html');
fs.writeFileSync(htmlPath, htmlContent);
console.log('Successfully generated HTML User Manual at:', htmlPath);

// Generate PDF using headless Chrome
const pdfPath = path.join(__dirname, 'Deliverable7_Group5_GTRAMS_UsersManual.pdf');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

if (fs.existsSync(chromePath)) {
  console.log('Compiling PDF with Google Chrome Headless...');
  const cmd = `"${chromePath}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" --no-pdf-header-footer "${htmlPath}"`;
  execSync(cmd);
  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log(`PDF successfully created! Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
  } else {
    console.error('Failed to create PDF file.');
  }
} else {
  console.log('Chrome binary not found at default path.');
}
