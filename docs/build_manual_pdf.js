const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const assetsDir = path.join(__dirname, 'manual_assets');

// Helper to convert local image to base64 data URI so Chrome prints without local CORS or broken paths
function getBase64Image(filename) {
  const filePath = path.join(assetsDir, filename);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filename).replace('.', '') || 'png';
    const data = fs.readFileSync(filePath).toString('base64');
    return `data:image/${ext};base64,${data}`;
  }
  return '';
}

const images = {
  fig1: getBase64Image('fig1_login_page.png'),
  fig2: getBase64Image('fig2_register_page.png'),
  fig3: getBase64Image('fig3_forgot_password.png'),
  fig4: getBase64Image('fig4_landing_page.png'),
  fig5: getBase64Image('fig5_operator_dashboard.png'),
  fig6: getBase64Image('fig6_apply_franchise.png'),
  fig7: getBase64Image('fig7_qr_verification.png'),
  fig8: getBase64Image('fig8_toda_roster.png'),
  fig9: getBase64Image('fig9_cashier_dashboard.png'),
  fig11: getBase64Image('fig11_bplo_dashboard.png'),
  fig12: getBase64Image('fig12_bplo_approval_queue.png'),
  fig13: getBase64Image('fig13_franchise_masterlist.png'),
  fig14: getBase64Image('fig14_admin_dashboard.png'),
  fig15: getBase64Image('fig15_user_management.png'),
  fig16: getBase64Image('fig16_admin_settings.png'),
};

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Deliverable #7 – User's Manual of the System: G-TRAMS</title>
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
      color: #1F1D1B;
      background: #FFF;
      margin: 0;
      padding: 0;
    }
    
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    
    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      height: 245mm;
      text-align: center;
      padding: 20mm 10mm;
      border: 3px double #9E2A2B;
      background: linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%);
    }
    
    .univ-header {
      margin-bottom: 25px;
    }
    .univ-title {
      font-size: 16pt;
      font-weight: 800;
      color: #1F1D1B;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0;
    }
    .college-title {
      font-size: 13pt;
      font-weight: 600;
      color: #9E2A2B;
      margin: 6px 0 0 0;
    }
    .address {
      font-size: 9pt;
      color: #6B6761;
      margin: 4px 0 0 0;
    }
    
    .cover-main {
      margin: 30px 0;
    }
    .deliverable-badge {
      display: inline-block;
      background-color: #9E2A2B;
      color: #FFFFFF;
      font-size: 11pt;
      font-weight: 700;
      padding: 6px 18px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }
    .system-title {
      font-size: 26pt;
      font-weight: 900;
      color: #9E2A2B;
      line-height: 1.2;
      margin: 0 0 10px 0;
    }
    .system-subtitle {
      font-size: 13pt;
      font-weight: 600;
      color: #D4AF37;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 20px 0;
    }
    .doc-type {
      font-size: 18pt;
      font-weight: 800;
      color: #1F1D1B;
      border-top: 2px solid #D4AF37;
      border-bottom: 2px solid #D4AF37;
      padding: 8px 0;
      margin: 15px auto;
      max-width: 400px;
    }
    
    .meta-box {
      background: #FFFFFF;
      border: 1px solid #E4E1DC;
      border-radius: 6px;
      padding: 15px 25px;
      text-align: left;
      font-size: 10pt;
      margin-top: 25px;
      display: inline-block;
      min-width: 320px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    .meta-row {
      margin-bottom: 6px;
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
      font-size: 9pt;
      color: #6B6761;
      margin-top: 20px;
    }
    
    /* Document Body */
    h1 {
      color: #9E2A2B;
      font-size: 16pt;
      font-weight: 800;
      border-bottom: 2px solid #9E2A2B;
      padding-bottom: 5px;
      margin-top: 25px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    h2 {
      color: #1F1D1B;
      font-size: 13pt;
      font-weight: 700;
      border-left: 4px solid #D4AF37;
      padding-left: 10px;
      margin-top: 22px;
      margin-bottom: 10px;
    }
    
    h3 {
      color: #9E2A2B;
      font-size: 11pt;
      font-weight: 700;
      margin-top: 16px;
      margin-bottom: 8px;
    }
    
    p {
      margin: 0 0 10px 0;
      text-align: justify;
    }
    
    ul, ol {
      margin: 0 0 12px 0;
      padding-left: 24px;
    }
    
    li {
      margin-bottom: 4px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 9.5pt;
    }
    
    th, td {
      border: 1px solid #D6D3D1;
      padding: 8px 10px;
      text-align: left;
    }
    
    th {
      background-color: #9E2A2B;
      color: #FFFFFF;
      font-weight: 700;
    }
    
    tr:nth-child(even) {
      background-color: #F8F7F5;
    }
    
    .figure-container {
      margin: 15px 0 20px 0;
      text-align: center;
      background: #FAFAF9;
      border: 1px solid #E4E1DC;
      border-radius: 6px;
      padding: 10px;
      page-break-inside: avoid;
    }
    
    .figure-img {
      max-width: 95%;
      max-height: 95mm;
      height: auto;
      border: 1px solid #D6D3D1;
      border-radius: 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    
    .figure-caption {
      font-size: 9pt;
      font-weight: 700;
      color: #6B6761;
      margin-top: 8px;
    }
    
    .callout {
      background-color: #F8F5EE;
      border-left: 4px solid #D4AF37;
      padding: 10px 14px;
      border-radius: 0 4px 4px 0;
      margin: 14px 0;
      font-size: 9.5pt;
    }
    .callout-title {
      font-weight: 700;
      color: #9E2A2B;
      margin-bottom: 4px;
    }
    
    .badge {
      display: inline-block;
      font-size: 8pt;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 3px;
      background-color: #9E2A2B;
      color: #FFF;
      text-transform: uppercase;
    }
    
    .step-box {
      background: #FFFFFF;
      border: 1px solid #E4E1DC;
      border-left: 4px solid #9E2A2B;
      border-radius: 4px;
      padding: 12px 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .step-header {
      font-size: 11pt;
      font-weight: 700;
      color: #9E2A2B;
      margin-bottom: 6px;
    }
    .step-purpose {
      font-size: 9.5pt;
      color: #6B6761;
      margin-bottom: 8px;
      font-style: italic;
    }
    .step-result {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      color: #166534;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 9pt;
      margin-top: 8px;
    }
    
    .header-tag {
      float: right;
      font-size: 9pt;
      font-weight: 600;
      color: #D4AF37;
      text-transform: uppercase;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page page-break">
    <div class="univ-header">
      <h2 class="univ-title">Marinduque State University</h2>
      <h3 class="college-title">College of Information and Computing Sciences</h3>
      <p class="address">Panfilo M. Manguera Sr. Rd., Brgy. Tanza, Boac, Marinduque, Philippines 4900</p>
    </div>
    
    <div class="cover-main">
      <div class="deliverable-badge">Deliverable #7</div>
      <h1 class="system-title">G-TRAMS</h1>
      <div class="system-subtitle">Gasan Tricycle Regulatory & Automated Management System</div>
      <div class="doc-type">USER’S MANUAL OF THE SYSTEM</div>
      
      <div class="meta-box">
        <div class="meta-row">
          <span class="meta-label">Course / Program:</span>
          <span class="meta-value">BS Information Technology (Capstone Project)</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">System Version:</span>
          <span class="meta-value">v2.4.0 (Production Release)</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Deployment URL:</span>
          <span class="meta-value">https://g-trams-official.vercel.app</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Development Team:</span>
          <span class="meta-value">Group 5 (CICS)</span>
        </div>
        <div class="meta-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #E4E1DC;">
          <span class="meta-label">Lead Backend:</span>
          <span class="meta-value">Jhon Kyn Axix H. Cabrigas</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Frontend Lead:</span>
          <span class="meta-value">Justine S. Lachica</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Quality Assurance:</span>
          <span class="meta-value">Jay Vincent G. Motol</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">DevOps & Cloud:</span>
          <span class="meta-value">Ian Simon Francis M. Rey</span>
        </div>
      </div>
    </div>
    
    <div class="cover-footer">
      <p style="margin: 0; text-align: center;">Municipality of Gasan, Province of Marinduque • Academic Year 2026–2027</p>
    </div>
  </div>

  <!-- TABLE OF CONTENTS & SYSTEM OVERVIEW -->
  <div>
    <h1>1. System Overview</h1>
    <p>
      The <strong>Gasan Tricycle Regulatory and Automated Management System (G-TRAMS)</strong> is an enterprise-grade, cloud-native web portal developed for the Local Government Unit (LGU) of Gasan, Marinduque. It replaces outdated, paper-intensive tricycle franchising procedures with a fully synchronized, role-based digital architecture.
    </p>
    
    <h2>1.1 Purpose and Objectives</h2>
    <ul>
      <li><strong>Automate MTOP Issuance:</strong> Streamline the entire lifecycle of Motorized Tricycle Operator's Permits (MTOP) from online application, verification, fee settlement, to digital permit issuance.</li>
      <li><strong>Eliminate "Colorum" Units:</strong> Enforce strict municipal body number assignments, preventing vehicle duplicates, forged documents, and unregistered commercial operations.</li>
      <li><strong>Integrate Roadside Enforcement:</strong> Equip municipal police and traffic enforcers with mobile QR code scanning tools to verify legitimate permits in under 3 seconds.</li>
      <li><strong>Promote Financial Transparency:</strong> Provide the Municipal Treasury with real-time payment audit trails, instant official receipting, and COA-compliant daily remittance sheets.</li>
      <li><strong>Comply with National Standards:</strong> Ensure full adherence to the <em>Data Privacy Act of 2012 (RA 10173)</em>, ARTA Ease of Doing Business regulations, and ISO-standard local government recordkeeping.</li>
    </ul>

    <h2>1.2 Intended User Roles</h2>
    <table>
      <thead>
        <tr>
          <th>User Role</th>
          <th>Description & Scope of Authority</th>
          <th>Primary Workflows</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Tricycle Operator / Driver</strong></td>
          <td>Individual tricycle franchise holders and drivers residing in Gasan.</td>
          <td>Online franchise filing (New/Renewal/Dropping), document upload, application tracking, digital ID/certificate viewing.</td>
        </tr>
        <tr>
          <td><strong>TODA President</strong></td>
          <td>Elected leaders of accredited Tricycle Operators and Drivers Associations.</td>
          <td>Master roster management, individual member addition, digital clearance issuance, and member removal requests.</td>
        </tr>
        <tr>
          <td><strong>Traffic Enforcer (PNP / CTMO)</strong></td>
          <td>Field traffic officers authorized to inspect tricycles on municipal routes.</td>
          <td>Mobile QR code verification of operator IDs and vehicle MTOPs, issuing digital traffic citation tickets.</td>
        </tr>
        <tr>
          <td><strong>Municipal Cashier / Treasury</strong></td>
          <td>Municipal Treasury disbursing officers handling revenue collection.</td>
          <td>Payment assessment, logging cash and digital payments, issuing official receipts, and generating daily remittance sheets.</td>
        </tr>
        <tr>
          <td><strong>BPLO Licensing Officer</strong></td>
          <td>Business Permits and Licensing Office regulatory staff.</td>
          <td>Queue review, document inspection with AI OCR extraction, physical inspection scheduling, and permit approval.</td>
        </tr>
        <tr>
          <td><strong>System Administrator (IT)</strong></td>
          <td>Municipal IT officers responsible for system availability and security.</td>
          <td>User access control (RBAC), audit logging, and automated weekly database backups with disaster recovery.</td>
        </tr>
      </tbody>
    </table>
    
    <div class="figure-container">
      <img src="${images.fig4}" class="figure-img" alt="Landing Page">
      <div class="figure-caption">Figure 1. G-TRAMS Public Citizen Portal & Services Landing Page</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SYSTEM REQUIREMENTS & GETTING STARTED -->
  <div>
    <h1>2. System Requirements and Access</h1>
    <p>
      G-TRAMS operates as a lightweight Progressive Web Application (PWA) accessible via any modern web browser without requiring dedicated software installations.
    </p>

    <h2>2.1 Hardware and Software Requirements</h2>
    <table>
      <thead>
        <tr>
          <th>Component</th>
          <th>Minimum Requirement</th>
          <th>Recommended Specification</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Devices Supported</strong></td>
          <td>Android / iOS Smartphone, Tablet</td>
          <td>Desktop PC or Laptop (1080p Display) for LGU Staff</td>
        </tr>
        <tr>
          <td><strong>Web Browser</strong></td>
          <td>Chrome 100+, Edge 100+, Safari 15+, Firefox 100+</td>
          <td>Latest Google Chrome or Microsoft Edge</td>
        </tr>
        <tr>
          <td><strong>Internet Connection</strong></td>
          <td>Stable 3G/4G Mobile Data (minimum 1 Mbps)</td>
          <td>Broadband / Wi-Fi (5 Mbps or higher)</td>
        </tr>
        <tr>
          <td><strong>Official URL</strong></td>
          <td colspan="2"><a href="https://g-trams-official.vercel.app">https://g-trams-official.vercel.app</a></td>
        </tr>
      </tbody>
    </table>

    <h1>3. Getting Started: Access, Registration & Login</h1>
    
    <div class="step-box">
      <div class="step-header">3.1 Account Registration Procedure</div>
      <div class="step-purpose">Purpose: Allows new tricycle operators and TODA leaders to create a verified personal account.</div>
      <ol>
        <li>Open your browser and navigate to <strong>https://g-trams-official.vercel.app</strong>.</li>
        <li>Click the <strong>"Register"</strong> link located on the top navigation bar or below the login form.</li>
        <li>Complete the registration form with your <strong>Full Legal Name</strong>, <strong>Primary Mobile Number</strong>, <strong>Email Address</strong>, and <strong>Barangay Address</strong> in Gasan.</li>
        <li>Provide a secondary <strong>Recovery Contact</strong> (backup phone number or email) to ensure account recovery if your primary SIM or email is misplaced.</li>
        <li>Select your designated <strong>TODA Association</strong> (or "NON-TODA" if unaffiliated) and vehicle body number.</li>
        <li>Create a secure password containing at least 8 characters, an uppercase letter, and a number.</li>
        <li>Click <strong>"Create Account"</strong> and enter the 6-digit OTP code received on your registered contact.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Account is successfully registered, verified, and redirected to your role-specific dashboard.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig2}" class="figure-img" alt="Registration Page">
      <div class="figure-caption">Figure 2. G-TRAMS New User Account Registration with Recovery Contacts</div>
    </div>

    <div class="step-box">
      <div class="step-header">3.2 Portal Login Procedure</div>
      <div class="step-purpose">Purpose: Grants authenticated access to authorized modules based on role permissions.</div>
      <ol>
        <li>Navigate to <strong>https://g-trams-official.vercel.app/login</strong>.</li>
        <li>Enter your registered <strong>Email Address</strong> or <strong>Mobile Phone Number</strong>.</li>
        <li>Type your password in the password field. You may click the eye icon to verify visibility.</li>
        <li>Click the <strong>"Log In"</strong> button.</li>
      </ol>
      <div class="step-result">✓ Expected Result: The system authenticates your token and directs you immediately to your active dashboard.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig1}" class="figure-img" alt="Login Page">
      <div class="figure-caption">Figure 3. Official G-TRAMS Secure Authentication Login Terminal</div>
    </div>

    <div class="step-box">
      <div class="step-header">3.3 Password Recovery (Forgot Password)</div>
      <div class="step-purpose">Purpose: Enables operators to regain account access via SMS or email verification.</div>
      <ol>
        <li>On the login page, click <strong>"Forgot Password?"</strong>.</li>
        <li>Enter your registered primary email, phone number, or backup recovery contact.</li>
        <li>Click <strong>"Send Reset Code"</strong> to receive an authorized 6-digit one-time PIN.</li>
        <li>Enter the received OTP code and configure your new secure password.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Password is updated securely, allowing immediate sign-in with your new credentials.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig3}" class="figure-img" alt="Forgot Password Page">
      <div class="figure-caption">Figure 4. Password Recovery & Multi-Channel OTP Reset Interface</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- OPERATOR PORTAL INSTRUCTIONS -->
  <div>
    <h1>4. Operator Portal: Step-by-Step Instructions</h1>
    <p>
      The Operator Portal is designed for ease of use by tricycle owners and drivers. It presents a clear overview of active franchises, inspection dates, and permit credentials.
    </p>

    <div class="figure-container">
      <img src="${images.fig5}" class="figure-img" alt="Operator Dashboard">
      <div class="figure-caption">Figure 5. Operator Dashboard with Unit Allocation & Digital ID Badge</div>
    </div>

    <div class="step-box">
      <div class="step-header">4.1 Submitting an Online Franchise Application</div>
      <div class="step-purpose">Purpose: Apply for a New Franchise, Annual Renewal, Dropping, or Transfer without visiting the municipal hall.</div>
      <ol>
        <li>From your Operator Dashboard, click the <strong>"Apply for Franchise"</strong> or <strong>"Apply Online"</strong> button.</li>
        <li>Select the application type: <strong>New Franchise</strong>, <strong>Renewal</strong>, or <strong>Transfer of Ownership</strong>.</li>
        <li>Input the tricycle vehicle technical details:
          <ul>
            <li><strong>LTO Plate Number</strong> (e.g., 123-ABC)</li>
            <li><strong>Motor Number</strong> & <strong>Chassis Number</strong> (from vehicle registration)</li>
            <li><strong>Make / Brand</strong> (e.g., Honda TMX 125, Kawasaki Barako)</li>
            <li><strong>Assigned Body Number</strong></li>
          </ul>
        </li>
        <li>Upload clear digital photos or scans of mandatory credentials:
          <ul>
            <li><strong>LTO Official Receipt & Certificate of Registration (OR/CR)</strong></li>
            <li><strong>Community Tax Certificate (Cedula)</strong> with serial number and date</li>
            <li><strong>Valid Professional Driver's License</strong></li>
            <li><strong>TODA Clearance & Certification</strong> issued by your TODA President</li>
          </ul>
        </li>
        <li>Click <strong>"Submit Application"</strong>. The system's integrated AI OCR engine will immediately inspect document text clarity and queue the submission for BPLO verification.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Application status transitions to <em>"Pending Review"</em> with a generated application reference ID.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig6}" class="figure-img" alt="Apply Franchise Form">
      <div class="figure-caption">Figure 6. Online MTOP Application Form with Document Upload & OCR Pre-Check</div>
    </div>

    <div class="step-box">
      <div class="step-header">4.2 Accessing Digital Operator ID & MTOP Certificate</div>
      <div class="step-purpose">Purpose: Display official digital credentials on mobile devices for inspection by authorities.</div>
      <ol>
        <li>Log in to your Operator account and locate your approved unit under <strong>"Active Franchises"</strong>.</li>
        <li>Click <strong>"View Digital ID"</strong> to open the full-screen official digital identification card.</li>
        <li>To view or print your MTOP permit certificate, click <strong>"Download / View MTOP Certificate"</strong>.</li>
        <li>Present the tamper-evident QR code directly to any municipal traffic officer during roadside inspection.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Full digital permit displays with certified municipal seals, validity date, and route authorization.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TODA PRESIDENT & TRAFFIC ENFORCER INSTRUCTIONS -->
  <div>
    <h1>5. TODA President Portal: Roster & Clearances</h1>
    <p>
      TODA Presidents possess delegated authority to endorse members, manage association roster allocations, and ensure that only accredited operators receive barangay franchise privileges.
    </p>

    <div class="step-box">
      <div class="step-header">5.1 Managing Association Member Rosters</div>
      <div class="step-purpose">Purpose: Register new association members and verify compliance before LGU submission.</div>
      <ol>
        <li>Log in with your verified TODA President credentials.</li>
        <li>Navigate to the <strong>"Submit / Manage Members"</strong> module from the sidebar.</li>
        <li>To register a single new member: Click <strong>"Add Member"</strong>, input the member's full name, license number, and assign a unique association body number. The system automatically blocks duplicate numbers.</li>
        <li>To upload multiple members: Click <strong>"Bulk Roster Upload"</strong> and select your association's masterlist spreadsheet or photo.</li>
        <li>Review each member's status and click <strong>"Endorse / Issue Clearance"</strong> to authorize their municipal MTOP application.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Endorsed members immediately appear in the BPLO verification queue with validated TODA accreditation.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig8}" class="figure-img" alt="TODA Roster Management">
      <div class="figure-caption">Figure 7. TODA President Member Roster Management & Body Number Assignment</div>
    </div>

    <h1>6. Traffic Enforcer Portal: Roadside Inspection</h1>
    <p>
      Field traffic enforcers and PNP personnel utilize mobile devices to scan tricycle QR codes and verify franchise validity instantaneously.
    </p>

    <div class="step-box">
      <div class="step-header">6.1 Scanning QR Codes and Roadside Verification</div>
      <div class="step-purpose">Purpose: Instantly detect illegal colorum vehicles, expired permits, and unauthorized drivers.</div>
      <ol>
        <li>Open any mobile camera or QR scanner and point it at the physical tricycle MTOP sticker or driver's digital ID.</li>
        <li>The browser opens the secure verification URL: <code>https://g-trams-official.vercel.app/verify/:id</code>.</li>
        <li>Inspect the verification display:
          <ul>
            <li><strong>Franchise Status Badge:</strong> Green (Active / Valid), Yellow (Renewal Pending), or Red (Expired / Revoked).</li>
            <li><strong>Verified Vehicle Specs:</strong> Plate Number, Motor Number, Body Number, and Registered TODA.</li>
            <li><strong>Operator Identity:</strong> Full legal name and registered contact number.</li>
          </ul>
        </li>
      </ol>
      <div class="step-result">✓ Expected Result: Official LGU verification is displayed within 1 to 2 seconds, confirming genuine permit records.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig7}" class="figure-img" alt="QR Verification Result">
      <div class="figure-caption">Figure 8. Live Real-Time Roadside QR Code Verification Terminal</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- CASHIER & TREASURY INSTRUCTIONS -->
  <div>
    <h1>7. Municipal Cashier & Treasury Portal</h1>
    <p>
      The Cashier Portal is an isolated financial terminal where treasury personnel assess regulatory fees, log official receipts (OR), and produce end-of-day revenue reconciliation sheets.
    </p>

    <div class="step-box">
      <div class="step-header">7.1 Processing Fee Settlements & Issuing Official Receipts</div>
      <div class="step-purpose">Purpose: Record payments for franchise permits, renewal fees, and violation citations.</div>
      <ol>
        <li>From the Cashier Dashboard, locate the applicant in the <strong>"Payment Queue"</strong> or search by Plate Number, Body Number, or Applicant Name.</li>
        <li>Verify the assessed fees: Standard MTOP regulatory fee, sticker fee, inspection fee, or penalty charges.</li>
        <li>Select the payment channel: <strong>Cash (Over-the-Counter)</strong> or <strong>GCash / Digital Payment</strong>.</li>
        <li>Input the <strong>Official Receipt (OR) Number</strong> issued by the Municipal Treasury.</li>
        <li>Click <strong>"Confirm & Release Receipt"</strong>. The transaction is instantly recorded in the immutable treasury ledger.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Permit status automatically advances to <em>"For Signing / Ready for Pickup"</em>, and an SMS notification is sent to the operator.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig9}" class="figure-img" alt="Cashier Dashboard">
      <div class="figure-caption">Figure 9. Municipal Cashier Payment Terminal with Real-Time Collection Counter</div>
    </div>

    <div class="step-box">
      <div class="step-header">7.2 Generating Daily Treasury Collection & Remittance Sheet</div>
      <div class="step-purpose">Purpose: Produce COA-compliant daily financial turnover sheets with 1-click CSV export.</div>
      <ol>
        <li>Click the <strong>"Daily Remittance Sheet"</strong> button located on the top action bar of the Cashier Terminal.</li>
        <li>Review the daily collection breakdown: Total transactions, cash receipts, digital collections, and total municipal turnover.</li>
        <li>Click <strong>"Export Remittance CSV"</strong> to download a formatted spreadsheet (<code>GTRAMS_Treasury_Daily_Remittance_&lt;DATE&gt;.csv</code>) for municipal accounting archives.</li>
        <li>Click <strong>"Print Remittance Form"</strong> to generate the physical audit sheet complete with authorized signature blocks for the Cashier and Municipal Treasurer.</li>
      </ol>
      <div class="step-result">✓ Expected Result: End-of-day treasury reconciliation is completed in under 1 minute without manual recalculations.</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- BPLO & SYSTEM ADMIN INSTRUCTIONS -->
  <div>
    <h1>8. BPLO Licensing Officer Portal</h1>
    <p>
      BPLO personnel evaluate submitted documents, verify technical specifications, schedule physical inspections, and authorize final MTOP certificate issuance.
    </p>

    <div class="step-box">
      <div class="step-header">8.1 Evaluating Applications in the Review Queue</div>
      <div class="step-purpose">Purpose: Inspect uploaded credentials side-by-side with automated AI OCR extraction data.</div>
      <ol>
        <li>Access the <strong>"Franchise Approval"</strong> module from the BPLO sidebar.</li>
        <li>Click <strong>"Review"</strong> on any pending application.</li>
        <li>Inspect the uploaded OR/CR, Cedula, Driver's License, and TODA Clearance images alongside the automated OCR field comparison.</li>
        <li>If details match: Assign the scheduled physical inspection date and click <strong>"Approve for Payment"</strong>.</li>
        <li>If documents are blurred or mismatched: Click <strong>"Request Correction"</strong> and type a specific note guiding the applicant.</li>
      </ol>
      <div class="step-result">✓ Expected Result: Applicant is notified immediately via SMS and dashboard banner regarding the review outcome.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig12}" class="figure-img" alt="BPLO Approval Queue">
      <div class="figure-caption">Figure 10. BPLO Application Review Queue & Document Inspection Interface</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig13}" class="figure-img" alt="Franchise Masterlist">
      <div class="figure-caption">Figure 11. Municipal Franchise Masterlist Registry with Filter & Export Controls</div>
    </div>

    <h1>9. System Administrator Portal & Disaster Recovery</h1>
    <p>
      The System Admin module provides Municipal IT staff with comprehensive user management, security audit logging, and automated database disaster recovery protocols.
    </p>

    <div class="step-box">
      <div class="step-header">9.1 Database Backup & Disaster Recovery Management (DRP)</div>
      <div class="step-purpose">Purpose: Safeguard municipal franchise records through automated weekly archives and instant offline downloads.</div>
      <ol>
        <li>Navigate to <strong>Admin Settings</strong> and select <strong>Tab 5: "Database Backup & Disaster Recovery"</strong>.</li>
        <li><strong>Automated Backup:</strong> The system automatically performs a full compressed database backup every Sunday at 12:00 MN (Midnight) with rolling 8-week retention.</li>
        <li><strong>Direct Offline Download:</strong> Click <strong>"Direct Offline Download"</strong> to stream a fresh compressed gzip snapshot (<code>.json.gz</code>) directly to your local laptop or secure USB flash drive.</li>
        <li><strong>Restoring Data:</strong> In the event of server failure, select <strong>"Upload & Restore Backup"</strong>, choose your archive file, type <code>RESTORE</code> in the confirmation prompt, and click confirm.</li>
      </ol>
      <div class="step-result">✓ Expected Result: All 13 municipal database collections are restored with 100% data integrity within seconds.</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig16}" class="figure-img" alt="Admin Settings & Backup">
      <div class="figure-caption">Figure 12. Database Backup & Disaster Recovery Protocol in System Admin Settings</div>
    </div>

    <div class="figure-container">
      <img src="${images.fig15}" class="figure-img" alt="User Management">
      <div class="figure-caption">Figure 13. System User Management & Role-Based Access Control (RBAC) Interface</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TROUBLESHOOTING, FAQS & SECURITY -->
  <div>
    <h1>10. Error Handling and Troubleshooting</h1>
    <p>
      The following matrix outlines common operational issues, root causes, and verified resolution steps:
    </p>

    <table>
      <thead>
        <tr>
          <th>Symptom / Error Message</th>
          <th>Likely Root Cause</th>
          <th>Step-by-Step Resolution</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>"Invalid credentials or incorrect password"</strong></td>
          <td>Typo in password or non-activated account.</td>
          <td>Verify Caps Lock is disabled. If problem persists, click "Forgot Password?" to reset your password via SMS OTP.</td>
        </tr>
        <tr>
          <td><strong>"OTP code has expired or is invalid"</strong></td>
          <td>More than 5 minutes elapsed since code dispatch.</td>
          <td>Click "Resend OTP". Ensure your phone has active mobile network signal in Gasan.</td>
        </tr>
        <tr>
          <td><strong>"Document upload failed / File too large"</strong></td>
          <td>File format unsupported or exceeds 10 MB limit.</td>
          <td>Upload files in JPG, PNG, or PDF format. Reduce camera photo resolution if image exceeds 10 MB.</td>
        </tr>
        <tr>
          <td><strong>"Duplicate body number detected"</strong></td>
          <td>Another operator is already assigned this body number.</td>
          <td>Consult your TODA President or BPLO officer to assign an unallocated municipal body number.</td>
        </tr>
        <tr>
          <td><strong>"Access Denied (403 Unauthorized)"</strong></td>
          <td>Logged-in account does not possess role permissions.</td>
          <td>Log out and re-login with the correct authorized credentials for the specific portal module.</td>
        </tr>
        <tr>
          <td><strong>"Server connection timeout / Offline"</strong></td>
          <td>Temporary network drop or maintenance mode.</td>
          <td>Check internet connectivity. If scheduled maintenance is underway, wait until service resumes.</td>
        </tr>
      </tbody>
    </table>

    <h1>11. Frequently Asked Questions (FAQs)</h1>
    
    <div class="callout">
      <div class="callout-title">Q1: How long does it take for a new franchise application to be approved?</div>
      Applications typically take <strong>2 to 3 business days</strong> upon submission of complete documents. You can track real-time progress on your Operator Dashboard.
    </div>

    <div class="callout">
      <div class="callout-title">Q2: Can I renew my franchise before it officially expires?</div>
      Yes. The system activates the <strong>"Renew Franchise"</strong> button on your dashboard <strong>60 days prior</strong> to your permit expiration date.
    </div>

    <div class="callout">
      <div class="callout-title">Q3: What if I lose my primary mobile phone or email address?</div>
      During registration, G-TRAMS captures a <strong>Recovery Contact</strong> (secondary phone or email). You can receive password reset OTPs through your registered recovery channel.
    </div>

    <div class="callout">
      <div class="callout-title">Q4: How do traffic enforcers know my digital permit is legitimate?</div>
      Every digital ID and MTOP certificate features a secure, dynamic <strong>QR Code</strong>. When scanned by enforcers, it retrieves the live record directly from the municipal database.
    </div>

    <div class="callout">
      <div class="callout-title">Q5: Is my personal information and document data secure?</div>
      Yes. In compliance with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>, all passwords use one-way bcrypt hashing, active OTPs are stripped from archives, and documents are stored in encrypted cloud storage.
    </div>

    <h1>12. Security Reminders & Official Support</h1>
    <ul>
      <li><strong>Credential Protection:</strong> Never disclose your account password or OTP to anyone, including municipal personnel or fellow drivers.</li>
      <li><strong>Session Hygiene:</strong> Always click <strong>"Log Out"</strong> when accessing the portal on shared devices, public internet cafes, or mobile kiosks.</li>
      <li><strong>Document Authenticity:</strong> Uploading forged or altered LTO credentials constitutes a criminal violation under Philippine law and leads to permanent franchise revocation.</li>
    </ul>

    <h2>12.1 Technical Support & LGU Contact Channels</h2>
    <table>
      <thead>
        <tr>
          <th>Office / Department</th>
          <th>Physical Office Location</th>
          <th>Contact Number & Email</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>BPLO Franchising Division</strong></td>
          <td>2nd Floor, Gasan Municipal Hall, Poblacion, Gasan</td>
          <td>(042) 342-1234 • bplo@gasan.ph</td>
        </tr>
        <tr>
          <td><strong>Municipal Treasury Office</strong></td>
          <td>Ground Floor, Gasan Municipal Hall, Poblacion, Gasan</td>
          <td>(042) 342-1235 • treasury@gasan.ph</td>
        </tr>
        <tr>
          <td><strong>G-TRAMS IT Technical Support</strong></td>
          <td>College of Information and Computing Sciences, MarSU</td>
          <td>support@gtrams.ph • cics@mar-su.edu.ph</td>
        </tr>
      </tbody>
    </table>
  </div>

</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'generate_manual.html'), htmlContent, 'utf8');
console.log('HTML manual successfully generated at docs/generate_manual.html!');

// Now run Chrome headless to print to PDF
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const inputHtml = path.join(__dirname, 'generate_manual.html');
const outputPdf = path.join(__dirname, '..', 'Deliverable7_Group5_GTRAMS_UsersManual.pdf');

console.log('Rendering publication-grade PDF via Chrome Headless...');
const cmd = `"${chromePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdf}" "${inputHtml}"`;
try {
  execSync(cmd, { stdio: 'inherit' });
  console.log(`PDF successfully created at: ${outputPdf}`);
} catch (err) {
  console.error('Error generating PDF with Chrome:', err.message);
}
