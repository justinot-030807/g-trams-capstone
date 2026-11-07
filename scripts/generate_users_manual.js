const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building Deliverable #7: User Manual of the System for Marinduque State University (CICS)...');

const assetsDir = path.join(__dirname, '..', 'docs', 'manual_assets');
const outputHtmlPath = path.join(__dirname, '..', 'docs', 'Deliverable7_Group5_UsersManual.html');
const outputPdfPath = path.join(__dirname, '..', 'docs', 'Deliverable7_Group5_UsersManual.pdf');
const outputMdPath = path.join(__dirname, '..', 'docs', 'GTRAMS_USER_MANUAL.md');

// Helper to convert image to base64 for self-contained document
function getBase64Image(fileName) {
  const filePath = path.join(assetsDir, fileName);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

const images = {
  fig1_login: getBase64Image('fig1_login_page.png'),
  fig2_register: getBase64Image('fig2_register_page.png'),
  fig3_forgot: getBase64Image('fig3_forgot_password.png'),
  fig4_landing: getBase64Image('fig4_landing_page.png'),
  fig5_operator_dashboard: getBase64Image('fig5_operator_dashboard.png'),
  fig6_apply_franchise: getBase64Image('fig6_apply_franchise.png'),
  fig8_toda_roster: getBase64Image('fig8_toda_roster.png'),
  fig9_cashier_dashboard: getBase64Image('fig9_cashier_dashboard.png'),
  fig11_bplo_dashboard: getBase64Image('fig11_bplo_dashboard.png'),
  fig12_bplo_approval_queue: getBase64Image('fig12_bplo_approval_queue.png'),
  fig13_franchise_masterlist: getBase64Image('fig13_franchise_masterlist.png'),
  fig14_admin_dashboard: getBase64Image('fig14_admin_dashboard.png'),
  fig15_user_management: getBase64Image('fig15_user_management.png'),
};

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Deliverable #7: User's Manual of the System - G-TRAMS</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #718096;
      }
      @bottom-left {
        content: "G-TRAMS System User's Manual • Municipality of Gasan, Marinduque";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #718096;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a202c;
      line-height: 1.55;
      font-size: 9.5pt;
      background: #ffffff;
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

    /* COVER PAGE STYLING */
    .cover-page {
      height: 100vh;
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 3px double #9E2A2B;
      padding: 40px 30px;
      text-align: center;
      background: linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 100%);
    }

    .univ-header {
      margin-bottom: 25px;
    }

    .univ-title {
      font-size: 16pt;
      font-weight: 800;
      color: #1a202c;
      letter-spacing: 0.5px;
      margin: 0;
      text-transform: uppercase;
    }

    .college-title {
      font-size: 12pt;
      font-weight: 600;
      color: #9E2A2B;
      margin: 4px 0 0 0;
    }

    .dept-title {
      font-size: 9pt;
      font-weight: 500;
      color: #718096;
      margin: 2px 0 0 0;
    }

    .cover-divider {
      width: 120px;
      height: 4px;
      background: #D4AF37;
      margin: 20px auto;
      border-radius: 2px;
    }

    .deliverable-badge {
      display: inline-block;
      background: #9E2A2B;
      color: #ffffff;
      padding: 6px 18px;
      border-radius: 20px;
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 15px;
    }

    .system-title {
      font-size: 26pt;
      font-weight: 800;
      color: #1F1D1B;
      line-height: 1.15;
      margin: 0 0 8px 0;
    }

    .system-subtitle {
      font-size: 13pt;
      font-weight: 600;
      color: #9E2A2B;
      margin: 0 0 15px 0;
    }

    .system-desc-cover {
      font-size: 10pt;
      color: #4a5568;
      max-width: 500px;
      margin: 0 auto 30px auto;
      line-height: 1.45;
    }

    .team-box {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-left: 4px solid #9E2A2B;
      padding: 15px 25px;
      max-width: 480px;
      margin: 0 auto;
      text-align: left;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }

    .team-box-title {
      font-size: 9pt;
      font-weight: 700;
      color: #9E2A2B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .member-item {
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      padding: 3px 0;
      border-bottom: 1px dashed #EDF2F7;
    }
    .member-item:last-child {
      border-bottom: none;
    }
    .member-name {
      font-weight: 600;
      color: #2D3748;
    }
    .member-role {
      color: #718096;
      font-size: 8pt;
    }

    .cover-meta {
      font-size: 8.5pt;
      color: #718096;
      margin-top: 25px;
    }

    /* DOCUMENT HEADINGS & SECTIONS */
    h1.section-header {
      font-size: 16pt;
      font-weight: 800;
      color: #9E2A2B;
      border-bottom: 2px solid #D4AF37;
      padding-bottom: 6px;
      margin-top: 25px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    h2.subsection-header {
      font-size: 12pt;
      font-weight: 700;
      color: #1F1D1B;
      border-left: 4px solid #9E2A2B;
      padding-left: 10px;
      margin-top: 20px;
      margin-bottom: 10px;
    }

    h3.feature-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #2D3748;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    p {
      margin-top: 0;
      margin-bottom: 10px;
      text-align: justify;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 12px;
      padding-left: 20px;
    }

    li {
      margin-bottom: 4px;
    }

    /* CALLOUT BOXES */
    .callout {
      background: #F7FAFC;
      border-left: 4px solid #3182CE;
      padding: 10px 14px;
      margin: 12px 0;
      border-radius: 0 6px 6px 0;
      font-size: 9pt;
    }
    .callout-title {
      font-weight: 700;
      color: #2B6CB0;
      margin-bottom: 3px;
    }

    .callout-warning {
      background: #FFFDF5;
      border-left: 4px solid #D69E2E;
    }
    .callout-warning .callout-title {
      color: #B7791F;
    }

    .callout-security {
      background: #FFF5F5;
      border-left: 4px solid #E53E3E;
    }
    .callout-security .callout-title {
      color: #C53030;
    }

    .callout-success {
      background: #F0FFF4;
      border-left: 4px solid #38A169;
    }
    .callout-success .callout-title {
      color: #276749;
    }

    /* SCREENSHOT / FIGURE STYLING */
    .figure-container {
      margin: 14px auto;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .figure-img {
      max-width: 95%;
      height: auto;
      border: 1px solid #CBD5E0;
      border-radius: 6px;
      box-shadow: 0 3px 6px rgba(0,0,0,0.08);
      display: block;
      margin: 0 auto;
    }

    .figure-caption {
      font-size: 8pt;
      font-weight: 600;
      color: #4A5568;
      margin-top: 6px;
      font-style: italic;
    }

    /* TABLES */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    table.data-table th, table.data-table td {
      border: 1px solid #E2E8F0;
      padding: 8px 10px;
      text-align: left;
    }

    table.data-table th {
      background: #9E2A2B;
      color: #FFFFFF;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.5px;
    }

    table.data-table tr:nth-child(even) {
      background: #F7FAFC;
    }

    /* STEP LIST */
    .steps-container {
      margin: 8px 0;
    }
    .step-item {
      margin-bottom: 6px;
    }
    .step-num {
      font-weight: 700;
      color: #9E2A2B;
    }
    .field-tag {
      background: #EDF2F7;
      color: #2D3748;
      padding: 1px 6px;
      border-radius: 3px;
      font-family: 'IBM Plex Sans', monospace;
      font-size: 8.5pt;
      font-weight: 600;
      border: 1px solid #CBD5E0;
    }
    .btn-tag {
      background: #9E2A2B;
      color: #FFFFFF;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-page">
    <div class="univ-header">
      <div class="univ-title">Marinduque State University</div>
      <div class="college-title">College of Information and Computing Sciences</div>
      <div class="dept-title">Bachelor of Science in Information Technology</div>
      <div class="cover-divider"></div>
      <div class="deliverable-badge">Deliverable #7 — Capstone Project</div>
    </div>

    <div class="cover-main">
      <div class="system-title">G-TRAMS</div>
      <div class="system-subtitle">Gasan Tricycle Regulatory and Automated Management System</div>
      <div class="system-desc-cover">
        A Comprehensive Web-Based Management and Enforcement System for Motorized Tricycle Operator's Permits (MTOP), Franchise Compliance, and Revenue Remittance in the Municipality of Gasan, Marinduque.
      </div>

      <div style="font-size: 14pt; font-weight: 800; color: #1a202c; letter-spacing: 1px; margin-bottom: 20px;">
        USER’S MANUAL OF THE SYSTEM
      </div>

      <div class="team-box">
        <div class="team-box-title">System Development Team (Group 5)</div>
        <div class="member-item">
          <span class="member-name">Jhon Kyn Axix H. Cabrigas</span>
          <span class="member-role">Lead Backend Developer</span>
        </div>
        <div class="member-item">
          <span class="member-name">Justine S. Lachica</span>
          <span class="member-role">Frontend & UI/UX Developer</span>
        </div>
        <div class="member-item">
          <span class="member-name">Jay Vincent G. Motol</span>
          <span class="member-role">Quality Assurance & Tester</span>
        </div>
        <div class="member-item">
          <span class="member-name">Ian Simon Francis M. Rey</span>
          <span class="member-role">DevOps & Infrastructure</span>
        </div>
      </div>
    </div>

    <div class="cover-meta">
      <strong>Official System Version:</strong> 2.4.0 (Production Release)<br>
      <strong>Deployment Environment:</strong> Vercel Global Edge & Cloudflare Worker API<br>
      <strong>Academic Term:</strong> Academic Year 2026–2027 • Municipality of Gasan, Marinduque
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== TABLE OF CONTENTS ==================== -->
  <h1 class="section-header">Table of Contents</h1>
  <table class="data-table" style="margin-top: 15px;">
    <thead>
      <tr>
        <th style="width: 15%;">Section</th>
        <th style="width: 70%;">Title and Topic</th>
        <th style="width: 15%;">Page</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Section 1</strong></td>
        <td>System Overview & Objectives</td>
        <td>3</td>
      </tr>
      <tr>
        <td><strong>Section 2</strong></td>
        <td>System Requirements and Access Instructions</td>
        <td>4</td>
      </tr>
      <tr>
        <td><strong>Section 3</strong></td>
        <td>Getting Started: Registration, Authentication & Navigation</td>
        <td>5</td>
      </tr>
      <tr>
        <td><strong>Section 4</strong></td>
        <td>Step-by-Step User Instructions (By User Role)</td>
        <td>7</td>
      </tr>
      <tr>
        <td></td>
        <td>• 4.1 Citizen / Tricycle Operator Portal</td>
        <td>7</td>
      </tr>
      <tr>
        <td></td>
        <td>• 4.2 TODA President Portal</td>
        <td>11</td>
      </tr>
      <tr>
        <td></td>
        <td>• 4.3 Traffic Enforcement Officer Portal (Mobile Web)</td>
        <td>13</td>
      </tr>
      <tr>
        <td></td>
        <td>• 4.4 Municipal Cashier & Treasury Portal</td>
        <td>15</td>
      </tr>
      <tr>
        <td></td>
        <td>• 4.5 BPLO Franchising & Licensing Staff Portal</td>
        <td>18</td>
      </tr>
      <tr>
        <td></td>
        <td>• 4.6 IT System Administrator Portal</td>
        <td>22</td>
      </tr>
      <tr>
        <td><strong>Section 5</strong></td>
        <td>Error Handling and Troubleshooting Guide</td>
        <td>26</td>
      </tr>
      <tr>
        <td><strong>Section 6</strong></td>
        <td>Frequently Asked Questions (FAQs)</td>
        <td>28</td>
      </tr>
      <tr>
        <td><strong>Section 7</strong></td>
        <td>Security, User Reminders & Data Privacy Act (RA 10173)</td>
        <td>30</td>
      </tr>
      <tr>
        <td><strong>Section 8</strong></td>
        <td>Support and Contact Information</td>
        <td>31</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-warning">
    <div class="callout-title">Notice for System Evaluators & Users</div>
    This User's Manual is written for end-users operating the actual working system. In accordance with Marinduque State University CICS guidelines, technical programming code, database schemas, and inner algorithmic implementations are omitted in favor of operational workflows, verified procedures, and authentic system screenshots.
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 1: SYSTEM OVERVIEW ==================== -->
  <h1 class="section-header">1. System Overview</h1>

  <h2 class="subsection-header">1.1 System Description</h2>
  <p>
    <strong>G-TRAMS (Gasan Tricycle Regulatory and Automated Management System)</strong> is an enterprise-grade, web-based regulatory management and enforcement platform engineered specifically for the <strong>Municipality of Gasan, Marinduque</strong>. The system serves as the centralized digital infrastructure for managing Motorized Tricycle Operator's Permits (MTOP), organizing Tricycle Operators and Drivers Association (TODA) member rosters, streamlining municipal treasury fee collections, enforcing local traffic ordinances via mobile QR verification, and ensuring full regulatory transparency across all public transport units operating within municipal boundaries.
  </p>

  <div class="figure-container">
    <img src="${images.fig4_landing}" class="figure-img" alt="G-TRAMS Public Portal">
    <div class="figure-caption">Figure 1. Official G-TRAMS Public Landing Portal (https://g-trams-official.vercel.app/)</div>
  </div>

  <h2 class="subsection-header">1.2 Purpose and Objectives</h2>
  <p>
    The primary purpose of G-TRAMS is to replace obsolete, paper-heavy filing cabinets and slow manual processing with an integrated, automated, and secure digital environment. Specific objectives include:
  </p>
  <ul>
    <li><strong>Eliminate Application Delays:</strong> Provide operators with a 24/7 online application portal featuring automated document scanning and optical verification, reducing turnaround times from several weeks to just a few days.</li>
    <li><strong>Prevent Fraud & Duplicate Franchises:</strong> Enforce strict, automated body number allocation and duplicate prevention algorithms, eliminating unauthorized "colorum" units and body number conflicts.</li>
    <li><strong>Ensure Real-Time Field Verification:</strong> Empower traffic enforcers and police officers with instant QR code scanning on mobile devices to verify vehicle legality, route zone authorization, and driver validity on the road without physical paperwork.</li>
    <li><strong>Streamline Municipal Treasury Remittance:</strong> Provide a dedicated Cashier Terminal for issuing official receipts, tracking cash and digital GCash payments, and generating daily COA-compliant revenue remittance sheets.</li>
    <li><strong>Comply with Data Privacy Laws:</strong> Protect personal sensitive data of operators and drivers in strict compliance with the Data Privacy Act of 2012 (Republic Act No. 10173).</li>
  </ul>

  <h2 class="subsection-header">1.3 Intended Users and Roles</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">User Role</th>
        <th style="width: 40%;">Primary Responsibility</th>
        <th style="width: 35%;">System Access Portal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Citizen / Tricycle Operator</strong></td>
        <td>Registers accounts, applies for new/renewal franchises, uploads vehicle OR/CR and credentials, tracks permit progress, and downloads digital MTOP credentials.</td>
        <td>Operator Portal & Mobile Web Garage</td>
      </tr>
      <tr>
        <td><strong>TODA President</strong></td>
        <td>Maintains association rosters, registers individual members, issues TODA clearances, and submits formal member removal requests.</td>
        <td>TODA Management Console</td>
      </tr>
      <tr>
        <td><strong>Traffic Enforcement Officer</strong></td>
        <td>Performs on-road QR code scanning of operator IDs and vehicle stickers, verifies compliance, and issues traffic citation tickets.</td>
        <td>Enforcer Mobile Web Scanner</td>
      </tr>
      <tr>
        <td><strong>Municipal Cashier / Treasury</strong></td>
        <td>Assesses regulatory fees, accepts cash or GCash payments, logs official receipts (OR), and prints daily revenue remittance sheets.</td>
        <td>Cashier & Payment Terminal</td>
      </tr>
      <tr>
        <td><strong>BPLO Franchising Officer</strong></td>
        <td>Inspects submitted documents, verifies AI OCR accuracy, schedules vehicle inspections, approves permits, and routes for signing.</td>
        <td>BPLO Operations Dashboard</td>
      </tr>
      <tr>
        <td><strong>IT System Administrator</strong></td>
        <td>Governs user accounts (RBAC), monitors server telemetry, configures municipal ordinances and fees, and oversees weekly database backups.</td>
        <td>IT System Administration Console</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== SECTION 2: SYSTEM REQUIREMENTS ==================== -->
  <h1 class="section-header">2. System Requirements and Access</h1>

  <h2 class="subsection-header">2.1 Hardware and Device Requirements</h2>
  <p>
    G-TRAMS is engineered with a mobile-first, responsive Progressive Web App (PWA) architecture. Users can access the platform using any modern internet-connected computing device:
  </p>
  <ul>
    <li><strong>For Operators & Enforcers (Mobile):</strong> Any Android smartphone (Android 8.0 or higher) or Apple iPhone (iOS 13.0 or higher) with a working camera for QR code scanning and document photography.</li>
    <li><strong>For Municipal Staff & Administrators (Desktop/Laptop):</strong> Windows 10/11, macOS, or Linux workstation with at least 4 GB RAM and a display resolution of 1280x720 or higher.</li>
    <li><strong>Printing Hardware:</strong> Standard thermal receipt printer or A4 laser/inkjet printer for printing MTOP Certificates and Daily Remittance Sheets.</li>
  </ul>

  <h2 class="subsection-header">2.2 Web Browser and Software Requirements</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>Supported Browser</th>
        <th>Minimum Version</th>
        <th>Recommended Settings</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Google Chrome</strong></td>
        <td>Version 90 or higher</td>
        <td>JavaScript enabled, Camera permission allowed</td>
      </tr>
      <tr>
        <td><strong>Microsoft Edge</strong></td>
        <td>Version 90 or higher</td>
        <td>Chromium-based, pop-ups enabled for receipts</td>
      </tr>
      <tr>
        <td><strong>Mozilla Firefox</strong></td>
        <td>Version 88 or higher</td>
        <td>Standard tracking protection enabled</td>
      </tr>
      <tr>
        <td><strong>Apple Safari</strong></td>
        <td>Version 14 or higher</td>
        <td>iOS / iPadOS / macOS compatible</td>
      </tr>
    </tbody>
  </table>

  <h2 class="subsection-header">2.3 Internet Connectivity</h2>
  <p>
    G-TRAMS requires an active internet connection (Mobile 4G/5G, Broadband, or Wi-Fi) with a minimum recommended speed of <strong>1 Mbps</strong> for operators and <strong>5 Mbps</strong> for municipal office workstations handling multiple document uploads.
  </p>

  <h2 class="subsection-header">2.4 System Access URL</h2>
  <div class="callout callout-success">
    <div class="callout-title">Official Production Access Link</div>
    Users and municipal personnel can access the live system at:
    <br><strong>System URL:</strong> <a href="https://g-trams-official.vercel.app" style="color: #276749; font-weight: 700;">https://g-trams-official.vercel.app/</a>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 3: GETTING STARTED ==================== -->
  <h1 class="section-header">3. Getting Started</h1>

  <h2 class="subsection-header">3.1 How to Access the System</h2>
  <ol>
    <li>Open your preferred web browser on your computer or mobile device.</li>
    <li>Enter the official address: <span class="field-tag">https://g-trams-official.vercel.app</span> into the URL bar and press <strong>Enter</strong>.</li>
    <li>The public landing page will display municipal announcements, quick links, and options to Log In or Register.</li>
  </ol>

  <h2 class="subsection-header">3.2 How to Register a New Account</h2>
  <div class="steps-container">
    <div class="step-item"><span class="step-num">Step 1:</span> From the top navigation or login page, click the <span class="btn-tag">Register</span> button.</div>
    <div class="step-item"><span class="step-num">Step 2:</span> Enter your <strong>Full Legal Name</strong>, active <strong>11-digit Mobile Number</strong> (e.g. 09123456789), and valid <strong>Email Address</strong>.</div>
    <div class="step-item"><span class="step-num">Step 3:</span> Select your <strong>Barangay of Residence</strong> within Gasan and your associated <strong>TODA Group</strong>.</div>
    <div class="step-item"><span class="step-num">Step 4:</span> Create a secure password (minimum 8 characters with at least one letter and one number) and confirm it.</div>
    <div class="step-item"><span class="step-num">Step 5:</span> Click <span class="btn-tag">Create Account</span>. The system will prompt you for an SMS/Email One-Time Password (OTP) verification code.</div>
    <div class="step-item"><span class="step-num">Step 6:</span> Enter the 6-digit OTP code received on your phone to activate your account.</div>
  </div>

  <div class="figure-container">
    <img src="${images.fig2_register}" class="figure-img" alt="G-TRAMS Registration Screen">
    <div class="figure-caption">Figure 2. G-TRAMS Account Registration Portal</div>
  </div>

  <h2 class="subsection-header">3.3 How to Log In and Log Out</h2>
  <div class="figure-container">
    <img src="${images.fig1_login}" class="figure-img" alt="G-TRAMS Login Screen">
    <div class="figure-caption">Figure 3. Official G-TRAMS Login Portal</div>
  </div>

  <div class="steps-container">
    <div class="step-item"><span class="step-num">Logging In:</span></div>
    <ol>
      <li>Navigate to <span class="field-tag">/login</span>.</li>
      <li>Enter your registered <strong>Email Address</strong> or <strong>Mobile Phone Number</strong> in the first field.</li>
      <li>Enter your confidential <strong>Password</strong> in the password box.</li>
      <li>Click the <span class="btn-tag">Log In</span> button. The system will authenticate your credentials and automatically route you to your designated portal based on your assigned role.</li>
    </ol>
    <div class="step-item"><span class="step-num">Logging Out:</span></div>
    <ol>
      <li>Locate the sidebar navigation on desktop or the profile menu on mobile.</li>
      <li>Click the <span class="btn-tag">Log Out</span> button with the red exit icon.</li>
      <li>Your session token will be immediately cleared from local storage to prevent unauthorized access.</li>
    </ol>
  </div>

  <h2 class="subsection-header">3.4 Forgot Password & Account Recovery</h2>
  <div class="figure-container">
    <img src="${images.fig3_forgot}" class="figure-img" alt="Forgot Password Screen">
    <div class="figure-caption">Figure 4. G-TRAMS Self-Service Password Recovery Portal</div>
  </div>
  <p>
    If you forget your password, click the <span class="field-tag">Forgot Password?</span> link on the login page. Enter your registered email or phone number. The system will dispatch a secure 6-digit recovery OTP code. Once verified, you will be prompted to establish a fresh, secure password.
  </p>

  <div class="page-break"></div>

  <!-- ==================== SECTION 4: STEP-BY-STEP USER INSTRUCTIONS ==================== -->
  <h1 class="section-header">4. Step-by-Step User Instructions</h1>

  <!-- 4.1 OPERATOR PORTAL -->
  <h2 class="subsection-header">4.1 Citizen / Tricycle Operator Portal</h2>
  <p>
    The Operator Portal enables tricycle owners to manage vehicle registrations, apply for new MTOP franchises, submit required credentials, track inspection progress, and display digital certificates.
  </p>

  <h3 class="feature-title">Feature 4.1.1: Navigating the Operator Garage & Unit Capacity</h3>
  <p><strong>Purpose:</strong> View all registered tricycles under the operator's name and monitor remaining franchise slot capacity (maximum 2 units per operator as mandated by municipal ordinance).</p>
  <div class="figure-container">
    <img src="${images.fig5_operator_dashboard}" class="figure-img" alt="Operator Dashboard Garage">
    <div class="figure-caption">Figure 5. Operator Dashboard and Franchise Garage Overview</div>
  </div>
  <div class="steps-container">
    <ol>
      <li>Log in with your Operator account. You will arrive at the <strong>Operator Dashboard</strong>.</li>
      <li>Review the <strong>Unit Capacity</strong> widget at the top (e.g., "1 / 2 Slots Available").</li>
      <li>In the <strong>My Franchise Garage</strong> section, view all registered units with their Plate Number, Motorcycle Model, Body Number, Route Zone, and Current Status (e.g., Active, For Payment, Needs Attention).</li>
      <li>Click <span class="btn-tag">View Details</span> on any vehicle card to see full application history and remarks.</li>
    </ol>
  </div>
  <p><strong>Expected Result:</strong> The operator gains immediate visibility into vehicle legal statuses and active municipal permits.</p>

  <h3 class="feature-title">Feature 4.1.2: Filing a New Franchise Application</h3>
  <p><strong>Purpose:</strong> Submit an application for an unfranchised tricycle unit with digital document scanning.</p>
  <div class="figure-container">
    <img src="${images.fig6_apply_franchise}" class="figure-img" alt="Apply Franchise Portal">
    <div class="figure-caption">Figure 6. G-TRAMS Multi-Step Franchise Application Form</div>
  </div>
  <div class="steps-container">
    <ol>
      <li>From the sidebar navigation, click <span class="btn-tag">Apply / Renew</span>.</li>
      <li>Select the application type: <strong>New Franchise Application</strong>.</li>
      <li>Fill out the vehicle technical specifications: <strong>Plate Number</strong>, <strong>Engine/Motor Number</strong>, <strong>Chassis Number</strong>, <strong>Make/Brand</strong> (e.g., Honda, Kawasaki), and <strong>Year Model</strong>.</li>
      <li>Select your designated <strong>TODA Association</strong> (e.g., Gasan Central TODA, Bahi TODA).</li>
      <li>Upload the required supporting credentials (see Feature 4.1.3 below).</li>
      <li>Review the municipal declaration statement and click <span class="btn-tag">Submit Application</span>.</li>
    </ol>
  </div>
  <p><strong>Expected Result:</strong> The application is queued with status <strong>"Pending Review"</strong> and routed directly to the BPLO Franchising Officer queue.</p>

  <h3 class="feature-title">Feature 4.1.3: Document Upload with AI OCR Validation</h3>
  <p><strong>Purpose:</strong> Upload clear photos of mandatory legal documents for automated pre-verification.</p>
  <table class="data-table">
    <thead>
      <tr>
        <th>Required Document</th>
        <th>Acceptable Formats</th>
        <th>Special Requirement</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>LTO Official Receipt (OR)</strong></td>
        <td>JPG, PNG, PDF (Max 10MB)</td>
        <td>Current year validity, legible plate number</td>
      </tr>
      <tr>
        <td><strong>LTO Certificate of Registration (CR)</strong></td>
        <td>JPG, PNG, PDF (Max 10MB)</td>
        <td>Registered owner must match operator legal name</td>
      </tr>
      <tr>
        <td><strong>Community Tax Certificate (Cedula)</strong></td>
        <td>JPG, PNG, PDF (Max 10MB)</td>
        <td>Issued by Municipality of Gasan for current year</td>
      </tr>
      <tr>
        <td><strong>TODA Clearance / Endorsement</strong></td>
        <td>JPG, PNG, PDF (Max 10MB)</td>
        <td>Signed by the accredited TODA President</td>
      </tr>
      <tr>
        <td><strong>Professional Driver's License</strong></td>
        <td>JPG, PNG, PDF (Max 10MB)</td>
        <td>Valid Restriction Code 1 or DL Code A/A1</td>
      </tr>
    </tbody>
  </table>
  <div class="callout callout-warning">
    <div class="callout-title">AI OCR Compliance Rule</div>
    Ensure all photos are taken in well-lit conditions with no glare or blurry corners. The system's built-in optical scanner automatically extracts plate numbers and motor numbers to verify document authenticity.
  </div>

  <div class="page-break"></div>

  <!-- 4.2 TODA PRESIDENT PORTAL -->
  <h2 class="subsection-header">4.2 TODA President Portal</h2>
  <p>
    TODA Presidents oversee association membership, ensure route compliance, register new drivers under their umbrella, and endorse legitimate applicants to the LGU.
  </p>

  <h3 class="feature-title">Feature 4.2.1: TODA Roster Management & Member Directory</h3>
  <p><strong>Purpose:</strong> Maintain an official, audited directory of all operators and drivers operating within the association's authorized route.</p>
  <div class="figure-container">
    <img src="${images.fig8_toda_roster}" class="figure-img" alt="TODA Roster Management">
    <div class="figure-caption">Figure 7. TODA President Member Submission and Roster Management Console</div>
  </div>
  <div class="steps-container">
    <ol>
      <li>Log in with your TODA President account and click <span class="btn-tag">Submit Members</span> from the sidebar.</li>
      <li>The console displays your association's total registered members, active tricycle units, and pending clearance requests.</li>
      <li>To add an individual member, click the <span class="btn-tag">+ Add Individual Member</span> button.</li>
      <li>Input the member's <strong>Full Legal Name</strong>, <strong>Contact Number</strong>, <strong>Plate Number</strong>, and <strong>Tricycle Body Number</strong>.</li>
      <li>Click <span class="btn-tag">Save to Official Roster</span>.</li>
    </ol>
  </div>
  <p><strong>Expected Result:</strong> The member is immediately entered into the municipal TODA database and verified against duplicate body number assignments.</p>

  <div class="page-break"></div>

  <!-- 4.3 ENFORCER PORTAL -->
  <h2 class="subsection-header">4.3 Traffic Enforcement Officer Portal (Mobile Web)</h2>
  <p>
    Enforcers from the Gasan Municipal Police Station (MPS), Traffic Management Unit, and POSO use the mobile web portal for rapid, on-road vehicle compliance auditing.
  </p>

  <h3 class="feature-title">Feature 4.3.1: Live Mobile QR Code Scanning (Dual-Lookup)</h3>
  <p><strong>Purpose:</strong> Instantly verify franchise legality by scanning either the Operator's Physical ID Card OR the Tricycle's MTOP Vehicle Certificate.</p>
  <div class="steps-container">
    <ol>
      <li>Open the G-TRAMS portal on your mobile smartphone browser.</li>
      <li>Navigate to the QR scanner or point the phone's native camera at the vehicle's MTOP sticker or driver's ID QR code.</li>
      <li>The system invokes the <strong>Dual-Lookup Engine</strong> to retrieve real-time compliance data.</li>
      <li>The verification screen instantly displays:
        <ul>
          <li><strong>Franchise Status Badge:</strong> Green (ACTIVE), Amber (FOR PAYMENT), or Red (EXPIRED / CANCELLED).</li>
          <li><strong>Assigned Body Number & Plate Number.</strong></li>
          <li><strong>Authorized TODA Association & Route Zone.</strong></li>
          <li><strong>Permit Expiration Date.</strong></li>
        </ul>
      </li>
    </ol>
  </div>
  <p><strong>Expected Result:</strong> The enforcer can immediately identify whether a unit is legitimately franchised or operating illegally ("colorum").</p>

  <h3 class="feature-title">Feature 4.3.2: Field Citation Issuance</h3>
  <p><strong>Purpose:</strong> Log traffic violations (e.g., Overcharging, Out of Route, No Valid Permit) directly into the municipal database.</p>
  <div class="steps-container">
    <ol>
      <li>From the verified unit screen, click <span class="btn-tag">Issue Citation Ticket</span>.</li>
      <li>Select the specific violation from the Municipal Traffic Ordinance dropdown list.</li>
      <li>Enter the exact location in Gasan (e.g., Poblacion Market, National Highway).</li>
      <li>Upload optional photographic proof.</li>
      <li>Click <span class="btn-tag">Submit Citation</span>.</li>
    </ol>
  </div>
  <p><strong>Expected Result:</strong> An automated SMS warning is immediately dispatched to the operator's registered mobile number, and the fine is added to the Cashier settlement ledger.</p>

  <div class="page-break"></div>

  <!-- 4.4 CASHIER PORTAL -->
  <h2 class="subsection-header">4.4 Municipal Cashier & Treasury Portal</h2>
  <p>
    The Municipal Cashier Terminal handles fee collection, official receipt logging, and revenue accounting in compliance with Commission on Audit (COA) standards.
  </p>

  <h3 class="feature-title">Feature 4.4.1: Fee Settlement & Official Receipt (OR) Issuance</h3>
  <p><strong>Purpose:</strong> Collect annual franchise fees or citation penalties and record official government receipts.</p>
  <div class="figure-container">
    <img src="${images.fig9_cashier_dashboard}" class="figure-img" alt="Cashier Terminal Dashboard">
    <div class="figure-caption">Figure 8. Municipal Treasury Cashier Collection Terminal</div>
  </div>
  <div class="steps-container">
    <ol>
      <li>Log in with your Cashier account to reach the <strong>Cashier Collection Terminal</strong>.</li>
      <li>In the <strong>Awaiting Collection</strong> queue, locate the applicant by typing their Plate Number, Operator Name, or MTOP Application ID in the search bar.</li>
      <li>Click the <span class="btn-tag">Process Payment</span> button corresponding to the record.</li>
      <li>The assessment modal displays the fee breakdown (Franchise Fee, Sticker Fee, Inspection Fee).</li>
      <li>Select payment mode: <strong>Over-the-Counter Cash</strong> or <strong>Digital GCash</strong>.</li>
      <li>Input the official government <strong>Official Receipt (OR) Number</strong> and amount tendered.</li>
      <li>Click <span class="btn-tag">Confirm & Issue Official Receipt</span>.</li>
    </ol>
  </div>
  <p><strong>Expected Result:</strong> The payment is recorded with precise timestamp, the application advances to <strong>"For Signing"</strong>, and an official printable receipt voucher is generated.</p>

  <h3 class="feature-title">Feature 4.4.2: Daily Treasury Collection & Remittance Sheet</h3>
  <p><strong>Purpose:</strong> Generate an audited daily remittance statement with treasurer signature blocks and 1-click CSV spreadsheet export.</p>
  <div class="steps-container">
    <ol>
      <li>From the top right of the Cashier Terminal, click the <span class="btn-tag">Remittance Sheet</span> button.</li>
      <li>The system aggregates all transactions completed during the business day, categorized into Cash Collections and Digital Collections.</li>
      <li>Click <span class="btn-tag">Print Remittance Sheet</span> to open the COA-compliant printable format with formal signature lines for the <strong>Cashier / Disbursing Officer</strong> and the <strong>Municipal Treasurer</strong>.</li>
      <li>Click <span class="btn-tag">Export to CSV</span> to immediately download the raw spreadsheet record: <span class="field-tag">GTRAMS_Treasury_Daily_Remittance_YYYY-MM-DD.csv</span>.</li>
    </ol>
  </div>
  <p><strong>Expected Result:</strong> Complete financial transparency with zero discrepancy between cash drawers and digital records.</p>

  <div class="page-break"></div>

  <!-- 4.5 BPLO PORTAL -->
  <h2 class="subsection-header">4.5 BPLO Franchising & Licensing Staff Portal</h2>
  <p>
    The Business Permits and Licensing Office (BPLO) manages the core approval pipeline, performs document scrutiny, schedules physical unit inspections, and issues MTOP certificates.
  </p>

  <h3 class="feature-title">Feature 4.5.1: BPLO Operations Dashboard & Queue Counters</h3>
  <p><strong>Purpose:</strong> Monitor application queues across all 5 municipal processing stages.</p>
  <div class="figure-container">
    <img src="${images.fig11_bplo_dashboard}" class="figure-img" alt="BPLO Operations Dashboard">
    <div class="figure-caption">Figure 9. BPLO Operations Dashboard and Real-Time Pipeline Counters</div>
  </div>
  <p>The dashboard categorizes pending workloads into three immediate actionable queues: <strong>Needs Review</strong>, <strong>For Signing</strong>, and <strong>Ready for Pickup</strong>.</p>

  <h3 class="feature-title">Feature 4.5.2: In-Depth Document Review & Approval Pipeline</h3>
  <p><strong>Purpose:</strong> Inspect uploaded documents against OCR extracted values and approve applications.</p>
  <div class="figure-container">
    <img src="${images.fig12_bplo_approval_queue}" class="figure-img" alt="BPLO Approval Queue">
    <div class="figure-caption">Figure 10. Franchise Approval and Document Inspection Queue</div>
  </div>
  <div class="steps-container">
    <ol>
      <li>From the sidebar, click <span class="btn-tag">Franchise Approval</span>.</li>
      <li>Click <span class="btn-tag">Review</span> on any pending applicant.</li>
      <li>Side-by-side comparison opens showing the uploaded OR/CR images and the system's OCR match score.</li>
      <li>Verify that the CR Owner matches the Operator name and that all numbers match.</li>
      <li>If compliant, select <span class="btn-tag">Approve & Route to Payment</span>. If issues are found, click <span class="btn-tag">Request Correction</span> and specify the reason.</li>
    </ol>
  </div>
  <p><strong>Expected Result:</strong> Operators receive instant SMS and email notifications informing them of their application approval or requested document fixes.</p>

  <h3 class="feature-title">Feature 4.5.3: Franchise Masterlist & Archival Search</h3>
  <p><strong>Purpose:</strong> Search, filter, and audit all historical and active tricycle records in the municipality.</p>
  <div class="figure-container">
    <img src="${images.fig13_franchise_masterlist}" class="figure-img" alt="Franchise Masterlist">
    <div class="figure-caption">Figure 11. Complete Municipal Franchise Masterlist Directory</div>
  </div>

  <div class="page-break"></div>

  <!-- 4.6 ADMIN PORTAL -->
  <h2 class="subsection-header">4.6 IT System Administrator Portal</h2>
  <p>
    The System Administrator console provides IT governance, infrastructure telemetry, user role assignment, and disaster recovery data protection.
  </p>

  <h3 class="feature-title">Feature 4.6.1: IT Telemetry & Infrastructure Health</h3>
  <p><strong>Purpose:</strong> Monitor live server health, database round-trip latency, and system security events.</p>
  <div class="figure-container">
    <img src="${images.fig14_admin_dashboard}" class="figure-img" alt="IT Admin Dashboard">
    <div class="figure-caption">Figure 12. IT System Administration and Telemetry Dashboard</div>
  </div>

  <h3 class="feature-title">Feature 4.6.2: User Accounts Directory & Role Separation</h3>
  <p><strong>Purpose:</strong> Manage staff user permissions and enforce Role-Based Access Control (RBAC).</p>
  <div class="figure-container">
    <img src="${images.fig15_user_management}" class="figure-img" alt="User Management Directory">
    <div class="figure-caption">Figure 13. System User Accounts Directory and RBAC Governance</div>
  </div>
  <div class="steps-container">
    <ol>
      <li>Click <span class="btn-tag">User Accounts</span> from the admin sidebar.</li>
      <li>Filter by role: Operator, TODA President, BPLO Staff, Cashier, or System Admin.</li>
      <li>To change a user's role or deactivate an account, click the corresponding action button.</li>
    </ol>
  </div>

  <h3 class="feature-title">Feature 4.6.3: Automated Weekly Database Backup & Disaster Recovery (DRP)</h3>
  <p><strong>Purpose:</strong> Safeguard municipal data with automated weekly cron snapshots and instant offline downloads.</p>
  <div class="steps-container">
    <ol>
      <li>Navigate to <span class="btn-tag">System Settings</span> &rarr; <strong>Tab 5: Database Backup & Disaster Recovery</strong>.</li>
      <li>Review the automated backup status: runs automatically <strong>every Sunday at 12:00 Midnight (PST)</strong> with an 8-week rolling retention policy.</li>
      <li>To take an immediate backup before server maintenance, click <span class="btn-tag">Backup Database Now</span>.</li>
      <li>To archive the database directly to a local computer or external USB drive, click <span class="btn-tag">Direct Offline Download</span>. The system streams a compressed Gzip archive (<span class="field-tag">.json.gz</span>) containing all 13 database collections.</li>
      <li>To restore data after hardware replacement, click <span class="btn-tag">Upload & Restore</span>, choose the archive, and type <span class="field-tag">RESTORE</span> to confirm.</li>
    </ol>
  </div>
  <div class="callout callout-security">
    <div class="callout-title">Data Privacy Act (RA 10173) Backup Sanitization</div>
    During backup generation, all temporary authentication tokens and active OTP codes are stripped from the archive, while passwords remain protected by one-way bcrypt encryption.
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 5: ERROR HANDLING ==================== -->
  <h1 class="section-header">5. Error Handling and Troubleshooting</h1>
  <p>
    This section provides actionable solutions to common operational challenges encountered by users and municipal staff.
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">Problem / Error</th>
        <th style="width: 35%;">Likely Cause</th>
        <th style="width: 40%;">Recommended Corrective Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>"Invalid email or password" error on login</strong></td>
        <td>Typographical error in email/phone or incorrect password.</td>
        <td>Check Caps Lock. Use the "Show Password" eye icon to verify spelling. If forgotten, use the "Forgot Password?" link to reset via SMS OTP.</td>
      </tr>
      <tr>
        <td><strong>OTP SMS not received within 2 minutes</strong></td>
        <td>Network carrier signal delay or incorrect mobile number format.</td>
        <td>Ensure number starts with '09' and is 11 digits long. Click "Resend OTP Code". Verify phone has cellular signal reception.</td>
      </tr>
      <tr>
        <td><strong>"Document rejected / Low match score"</strong></td>
        <td>Uploaded image is blurry, has light reflections, or corners are cropped out.</td>
        <td>Retake the photograph in good lighting on a dark, flat surface. Ensure all text (especially Plate No. and Motor No.) is sharp and clear.</td>
      </tr>
      <tr>
        <td><strong>"Body Number Already In Use" conflict</strong></td>
        <td>Another tricycle in the same TODA association already holds that number.</td>
        <td>The system strictly prevents duplicates. The TODA President or BPLO staff must assign the next available unique body number.</td>
      </tr>
      <tr>
        <td><strong>"Access Denied / 403 Forbidden"</strong></td>
        <td>Attempting to access a portal outside your assigned role permissions.</td>
        <td>Log out and log in with the correct account. For staff role upgrades, contact the IT System Administrator.</td>
      </tr>
      <tr>
        <td><strong>Page fails to load or displays spinner</strong></td>
        <td>Intermittent internet connection or stale browser cache.</td>
        <td>Perform a hard refresh (<span class="field-tag">Ctrl + F5</span> on Windows or <span class="field-tag">Cmd + Shift + R</span> on Mac). Clear browser cookies if problem persists.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== SECTION 6: FAQS ==================== -->
  <h1 class="section-header">6. Frequently Asked Questions (FAQs)</h1>

  <div class="steps-container">
    <p><strong>Q1: Ilang tricycle ang pinapayagang ma-rehistro ng isang operator sa ilalim ng G-TRAMS?</strong></p>
    <p><em>Sagot:</em> Ayon sa Municipal Ordinance ng Bayan ng Gasan, ang bawat rehistradong operator ay pinapayagan lamang magkaroon ng hanggang <strong>dalawang (2) prangkisa</strong> upang magkaroon ng pantay na oportunidad ang lahat ng mga mamamayan.</p>

    <p><strong>Q2: Paano ko malalaman kung approved na ang aking franchise application?</strong></p>
    <p><em>Sagot:</em> Makakatanggap ka ng opisyal na <strong>SMS notification</strong> sa iyong rehistradong cellphone number sa bawat pagbabago ng estado ng iyong aplikasyon. Maaari mo ring tingnan ang iyong Operator Dashboard anumang oras.</p>

    <p><strong>Q3: Pwede ba akong magbayad sa pamamagitan ng GCash sa halip na magdala ng cash?</strong></p>
    <p><em>Sagot:</em> Opo. Ang Municipal Treasury Cashier Terminal ay tumatanggap ng parehong Over-the-Counter Cash at Digital GCash transfers. Ipakita lamang ang inyong GCash transaction reference number sa cashier para sa issuance ng inyong Official Receipt.</p>

    <p><strong>Q4: Ano ang dapat gawin ng enforcer kung walang internet signal sa daan habang nag-i-scan?</strong></p>
    <p><em>Sagot:</em> Ang G-TRAMS Mobile PWA ay may offline caching capability. Kung pansamantalang walang signal, basahin ang nakalimbag na impormasyon sa physical MTOP Certificate at i-recheck ang QR code sa sandaling magkaroon muli ng mobile data connectivity.</p>

    <p><strong>Q5: Ano ang pagkakaiba ng QR Code sa Operator ID kumpara sa QR Code sa MTOP Certificate?</strong></p>
    <p><em>Sagot:</em> Ang system ay may <strong>Dual-Lookup Engine</strong>. Ang QR code sa Operator ID ay nagpapatunay ng pagkakakilanlan ng drayber/operator, habang ang QR sa MTOP Certificate ay nagpapatunay ng legalidad ng mismong sasakyan. Pareho itong gagana kapag ini-scan ng traffic enforcers.</p>

    <p><strong>Q6: Paano kung lumipat ng ibang TODA ang isang miyembro?</strong></p>
    <p><em>Sagot:</em> Kailangang maghain ang dating TODA President ng <strong>Member Removal Request</strong> kalakip ang clearance, at mag-apply ang operator ng TODA Transfer sa BPLO portal.</p>

    <p><strong>Q7: Ligtas ba ang aking mga personal na dokumento sa system?</strong></p>
    <p><em>Sagot:</em> Opo. Ang lahat ng mga dokumento at personal na impormasyon ay naka-imbak sa mga secure cloud servers na sumusunod sa mga pamantayan ng Data Privacy Act of 2012 (RA 10173).</p>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 7: SECURITY REMINDERS ==================== -->
  <h1 class="section-header">7. Security and User Reminders</h1>
  <p>
    To ensure the integrity, confidentiality, and reliability of G-TRAMS, all users and municipal personnel must strictly observe the following security protocols:
  </p>

  <div class="callout callout-security">
    <div class="callout-title">1. Protection of Account Credentials & Passwords</div>
    Never share your login credentials, passwords, or SMS OTP codes with anyone. Municipal employees will never ask for your password. Ensure your password is at least 8 characters with numbers and special symbols.
  </div>

  <div class="callout callout-warning">
    <div class="callout-title">2. Mandatory Session Logout on Shared Workstations</div>
    Always click the <strong>Log Out</strong> button before leaving any computer terminal, especially in municipal offices, internet cafes, or shared family devices. Closing the browser window without logging out may leave your session vulnerable.
  </div>

  <div class="callout callout-success">
    <div class="callout-title">3. Compliance with Data Privacy Act of 2012 (RA 10173)</div>
    All information uploaded to G-TRAMS—including photos, contact numbers, and vehicle credentials—is classified as official regulatory data. Republic Act 10173 strictly penalizes unauthorized disclosure, copying, or dissemination of personal data.
  </div>

  <div class="callout">
    <div class="callout-title">4. Lawful System Usage</div>
    This system is intended exclusively for authorized tricycle regulatory management in the Municipality of Gasan. Falsification of uploaded documents, submission of fraudulent receipts, or attempted unauthorized access constitutes a criminal offense under Philippine cybercrime and local regulatory laws.
  </div>

  <div class="page-break"></div>

  <!-- ==================== SECTION 8: SUPPORT & CONTACT ==================== -->
  <h1 class="section-header">8. Support and Contact Information</h1>
  <p>
    If you experience technical errors, account lockouts, or have operational inquiries regarding franchise applications, contact the appropriate municipal office or development representative:
  </p>

  <table class="data-table">
    <thead>
      <tr>
        <th>Office / Channel</th>
        <th>Physical Location</th>
        <th>Contact Information</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Business Permits & Licensing Office (BPLO)</strong></td>
        <td>Ground Floor, Municipal Hall, Barangay I (Poblacion), Gasan, Marinduque</td>
        <td>
          Phone: (042) 342-1234<br>
          Email: <span class="field-tag">bplo@gasan.ph</span><br>
          Office Hours: Mon–Fri, 8:00 AM – 5:00 PM
        </td>
      </tr>
      <tr>
        <td><strong>Municipal Treasury Office</strong></td>
        <td>Ground Floor, Municipal Hall, Gasan, Marinduque</td>
        <td>
          Phone: (042) 342-1235<br>
          Email: <span class="field-tag">treasury@gasan.ph</span><br>
          Office Hours: Mon–Fri, 8:00 AM – 4:30 PM
        </td>
      </tr>
      <tr>
        <td><strong>G-TRAMS Technical Support Team</strong></td>
        <td>College of Information and Computing Sciences, Marinduque State University</td>
        <td>
          Group Lead: Jhon Kyn Axix H. Cabrigas<br>
          Frontend Support: Justine S. Lachica<br>
          Email: <span class="field-tag">support@g-trams-official.vercel.app</span>
        </td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 40px; padding: 20px; border: 1px solid #E2E8F0; text-align: center; border-radius: 6px; background: #FAF8F5;">
    <div style="font-size: 11pt; font-weight: 700; color: #9E2A2B; margin-bottom: 5px;">MUNICIPALITY OF GASAN • PROVINCE OF MARINDUQUE</div>
    <div style="font-size: 9pt; color: #4A5568;">Empowering Public Transport Transparency through Modern Digital Governance</div>
    <div style="font-size: 8pt; color: #718096; margin-top: 8px;">G-TRAMS System User's Manual • Version 2.4.0 • Academic Year 2026–2027</div>
  </div>

</body>
</html>
`;

fs.writeFileSync(outputHtmlPath, htmlContent, 'utf8');
console.log(`Successfully generated HTML manual at: ${outputHtmlPath}`);

// Also generate markdown companion
const mdContent = `# Deliverable #7: User's Manual of the System
**Project Title:** G-TRAMS (Gasan Tricycle Regulatory and Automated Management System)  
**Institution:** Marinduque State University - College of Information and Computing Sciences (CICS)  
**Authors:** Jhon Kyn Axix H. Cabrigas, Justine S. Lachica, Jay Vincent G. Motol, Ian Simon Francis M. Rey  
**Version:** 2.4.0 (Production Release)  
**Live URL:** [https://g-trams-official.vercel.app/](https://g-trams-official.vercel.app/)  

---

## 1. System Overview & Objectives
G-TRAMS is a web-based management and regulatory platform designed for the Municipality of Gasan, Marinduque. It centralizes Motorized Tricycle Operator's Permit (MTOP) issuance, TODA member directories, traffic enforcement citations, municipal cashier collections, and disaster recovery database administration.

## 2. Intended Users & Major Roles
1. **Citizen / Tricycle Operator:** Applies for permits, uploads OR/CR credentials, tracks approval queue, and displays digital certificates.
2. **TODA President:** Maintains association rosters, registers members with collision-free body numbers, and submits clearances.
3. **Traffic Enforcement Officer:** Performs mobile QR code verification on-road and logs citation tickets.
4. **Municipal Cashier:** Assesses franchise fees, accepts cash/GCash payments, issues official receipts, and exports daily remittance sheets.
5. **BPLO Licensing Staff:** Scrutinizes applications against AI OCR data, schedules vehicle inspections, and approves permits.
6. **IT System Administrator:** Governs user roles (RBAC), monitors server telemetry, and oversees weekly database backups.

## 3. System Access
- **System URL:** \`https://g-trams-official.vercel.app\`
- **Supported Browsers:** Google Chrome, Microsoft Edge, Safari, Mozilla Firefox
- **Device Support:** Smartphones (Android/iOS), Tablets, Desktop Workstations

## 4. Documentation & PDF Output
- Complete printable PDF: \`docs/Deliverable7_Group5_UsersManual.pdf\`
- Complete HTML source: \`docs/Deliverable7_Group5_UsersManual.html\`
`;

fs.writeFileSync(outputMdPath, mdContent, 'utf8');
console.log(`Successfully generated Markdown summary at: ${outputMdPath}`);

// Run Chrome headless to compile PDF
console.log('Compiling PDF via Google Chrome headless print-to-pdf...');
try {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const command = `"${chromePath}" --headless=new --no-sandbox --disable-gpu --print-to-pdf="${outputPdfPath}" "${outputHtmlPath}"`;
  execSync(command, { timeout: 30000 });
  console.log(`SUCCESS! Generated Deliverable7_Group5_UsersManual.pdf at: ${outputPdfPath}`);
} catch (err) {
  console.error('Error during Chrome headless PDF compilation:', err.message);
}
