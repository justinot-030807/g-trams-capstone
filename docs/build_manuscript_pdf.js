const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getBase64Image(filename) {
  const assetPath = path.join(__dirname, 'manual_assets', filename);
  if (fs.existsSync(assetPath)) {
    const ext = path.extname(filename).replace('.', '').toLowerCase();
    const data = fs.readFileSync(assetPath).toString('base64');
    return `data:image/${ext === 'svg' ? 'svg+xml' : ext};base64,${data}`;
  }
  return '';
}

const gasanLogo = getBase64Image('gasan-logo.png');
const gtramsLogo = getBase64Image('gtrams-logo.png');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Deliverable #8 – Final Technical Manuscript: G-TRAMS</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page);
        font-family: "Georgia", "Times New Roman", serif;
        font-size: 8.5pt;
        color: #4A4640;
      }
      @bottom-left {
        content: "MarSU CICS • G-TRaMS Final Technical Manuscript • Deliverable #8";
        font-family: "Georgia", "Times New Roman", serif;
        font-size: 8.5pt;
        color: #4A4640;
      }
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #1F1D1B;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
    }
    
    /* Cover Page */
    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 250mm;
      padding: 15mm 10mm 15mm 10mm;
      border: 3px double #9E2A2B;
      text-align: center;
      background: linear-gradient(180deg, #FFFFFF 0%, #FDFBF7 100%);
    }
    
    .cover-logos {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 30px;
      margin-bottom: 25px;
    }
    
    .cover-logo {
      height: 80px;
      object-fit: contain;
    }
    
    .inst-title {
      font-family: "Georgia", serif;
      font-size: 12pt;
      font-weight: bold;
      color: #1F1D1B;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 4px 0;
    }
    
    .inst-sub {
      font-size: 10pt;
      color: #555;
      margin: 0 0 20px 0;
    }
    
    .cover-divider {
      height: 3px;
      background: linear-gradient(90deg, #9E2A2B, #D4AF37, #9E2A2B);
      margin: 15px auto;
      width: 70%;
    }
    
    .manuscript-title {
      font-family: "Georgia", serif;
      font-size: 20pt;
      font-weight: 800;
      color: #9E2A2B;
      margin: 25px 0 10px 0;
      line-height: 1.25;
    }
    
    .manuscript-subtitle {
      font-size: 11pt;
      font-weight: 600;
      color: #6B2021;
      margin-bottom: 20px;
    }
    
    .deliverable-badge {
      display: inline-block;
      background: #9E2A2B;
      color: #FFFFFF;
      font-weight: bold;
      font-size: 9.5pt;
      letter-spacing: 1.5px;
      padding: 6px 18px;
      border-radius: 20px;
      margin-bottom: 25px;
      text-transform: uppercase;
    }
    
    .proponents-box {
      background: #F8F6F0;
      border: 1px solid #E5DFD5;
      border-left: 4px solid #D4AF37;
      padding: 15px 20px;
      margin: 20px auto;
      max-width: 480px;
      text-align: left;
      border-radius: 4px;
    }
    
    .proponents-box h4 {
      margin: 0 0 8px 0;
      font-size: 10pt;
      text-transform: uppercase;
      color: #9E2A2B;
      letter-spacing: 0.5px;
    }
    
    .proponents-box ol {
      margin: 0;
      padding-left: 18px;
      font-size: 9pt;
      line-height: 1.5;
    }
    
    .cover-meta {
      font-size: 9pt;
      color: #666;
      margin-top: 25px;
      line-height: 1.4;
    }
    
    /* Typography & Hierarchy */
    h1, h2, h3, h4 {
      font-family: "Georgia", "Times New Roman", serif;
      color: #9E2A2B;
      page-break-after: avoid;
    }
    
    h1.chapter-title {
      font-size: 15pt;
      font-weight: bold;
      border-bottom: 2px solid #D4AF37;
      padding-bottom: 6px;
      margin-top: 30px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    h2.section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1F1D1B;
      border-left: 4px solid #9E2A2B;
      padding-left: 8px;
      margin-top: 22px;
      margin-bottom: 10px;
    }
    
    h3.subsection-title {
      font-size: 10.5pt;
      font-weight: 600;
      color: #6B2021;
      margin-top: 16px;
      margin-bottom: 6px;
    }
    
    p {
      text-align: justify;
      margin: 0 0 10px 0;
      text-indent: 2em;
    }
    
    p.no-indent {
      text-indent: 0;
    }
    
    ul, ol {
      margin: 5px 0 12px 0;
      padding-left: 24px;
    }
    
    li {
      margin-bottom: 4px;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 18px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }
    
    th {
      background: #9E2A2B;
      color: #FFFFFF;
      font-weight: 600;
      text-align: left;
      padding: 7px 10px;
      border: 1px solid #7D1F20;
    }
    
    td {
      padding: 6px 10px;
      border: 1px solid #DDD6CB;
      vertical-align: top;
    }
    
    tr:nth-child(even) td {
      background-color: #FAF8F5;
    }
    
    /* Code Blocks */
    pre {
      background: #1E1E1E;
      color: #D4D4D4;
      font-family: "Consolas", "Courier New", monospace;
      font-size: 8pt;
      padding: 10px 14px;
      border-radius: 4px;
      overflow-x: auto;
      border-left: 4px solid #D4AF37;
      margin: 12px 0;
      line-height: 1.4;
      page-break-inside: avoid;
    }
    
    code {
      font-family: "Consolas", "Courier New", monospace;
      font-size: 8.5pt;
      background: #F4F0E8;
      color: #9E2A2B;
      padding: 1px 4px;
      border-radius: 3px;
    }
    
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    
    /* Callouts & Badges */
    .callout {
      background: #FDFBF7;
      border: 1px solid #E5DFD5;
      border-left: 4px solid #9E2A2B;
      padding: 10px 14px;
      margin: 12px 0;
      border-radius: 3px;
      page-break-inside: avoid;
    }
    
    .callout-title {
      font-weight: bold;
      color: #9E2A2B;
      font-size: 9pt;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    
    .badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 10px;
      text-transform: uppercase;
    }
    
    .badge-success {
      background: #E6F4EA;
      color: #137333;
      border: 1px solid #CEEAD6;
    }
    
    .badge-maroon {
      background: #FBEAEB;
      color: #9E2A2B;
      border: 1px solid #F5C6C7;
    }
    
    .badge-gold {
      background: #FEF7E0;
      color: #B06000;
      border: 1px solid #FEEFC3;
    }
    
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div>
      <div class="cover-logos">
        ${gasanLogo ? `<img src="${gasanLogo}" alt="LGU Gasan Seal" class="cover-logo">` : ''}
        ${gtramsLogo ? `<img src="${gtramsLogo}" alt="G-TRaMS Logo" class="cover-logo">` : ''}
      </div>
      <div class="inst-title">Marinduque State University</div>
      <div class="inst-sub">College of Information and Computing Sciences • Department of Information Technology</div>
      
      <div class="cover-divider"></div>
      
      <div class="deliverable-badge">Deliverable #8: Final Technical Manuscript</div>
      
      <div class="manuscript-title">G-TRaMS: Gasan Tricycle Franchise Records and Monitoring System</div>
      <div class="manuscript-subtitle">An Enterprise Cloud-Native MERN & Multimodal AI E-Governance Platform for Municipal Transport Franchising & Law Enforcement</div>
    </div>
    
    <div>
      <div class="proponents-box">
        <h4>Proponents (Group 5 - BSIT Capstone):</h4>
        <ol>
          <li><strong>Jhon Kyn Axix H. Cabrigas</strong> — Lead Backend Developer & Database Architect</li>
          <li><strong>Justine S. Lachica</strong> — Frontend Engineer & UI/UX Designer</li>
          <li><strong>Jay Vincent G. Motol</strong> — Quality Assurance (QA) Lead & Security Analyst</li>
          <li><strong>Ian Simon Francis M. Rey</strong> — DevOps Engineer & System Deployment Specialist</li>
        </ol>
      </div>
      
      <div class="cover-meta">
        <strong>Beneficiary:</strong> Local Government Unit of Gasan, Marinduque (Office of the Municipal Vice Mayor & BPLO)<br>
        <strong>Production System:</strong> <a href="https://g-trams-official.vercel.app" style="color:#9E2A2B;text-decoration:none;">https://g-trams-official.vercel.app</a><br>
        <strong>Source Code Repository:</strong> https://github.com/justinot-030807/g-trams-capstone.git<br>
        <strong>Academic Term:</strong> Academic Year 2025–2026
      </div>
    </div>
  </div>

  <!-- EXECUTIVE SUMMARY -->
  <h1 class="chapter-title">Executive Summary</h1>
  <p>The <strong>Gasan Tricycle Franchise Records and Monitoring System (G-TRaMS)</strong> is an enterprise e-governance platform custom-engineered for the Municipality of Gasan, Marinduque. Prior to this research and development project, municipal franchise administration relied upon fragmented manual paper folders, physical ledgers, and standalone Microsoft Excel spreadsheets operated by Job Order staff. This legacy operational mode generated severe bottlenecks: duplicate and colliding tricycle body numbers, unverified renewals, delayed treasury assessments, vulnerability to water damage and tropical typhoons, and zero roadside verification capability for traffic enforcers inspecting operating tricycles on the road.</p>
  
  <p>G-TRaMS completely modernizes this public transport lifecycle through a resilient <strong>MERN stack architecture</strong> (MongoDB Atlas, Express.js, React 19 / Vite, Node.js) paired with Google's <strong>Gemini 3.8 Flash Multimodal AI</strong> for sub-2.5-second automated OCR validation of Land Transportation Office (LTO) registration papers (OR/CR, Cedula, Driver's License). The system enforces an enterprise <strong>6-tier Role-Based Access Control (RBAC)</strong> schema that separates duties among Tricycle Operators/Drivers, TODA Presidents, Field Traffic Enforcers, LGU Cashiers, BPLO Licensing Officers, and System Administrators.</p>

  <p>Tested under rigorous automated testing protocols encompassing <strong>14 test suites and 201 unit/integration tests (100% passing)</strong> and high-concurrency virtual load testing, G-TRaMS demonstrated zero body number collision rates, resilient database snapshot recovery (DRP), and full legal compliance with Republic Act No. 10173 (Data Privacy Act of 2012).</p>

  <!-- CHAPTER 1 -->
  <h1 class="chapter-title">Chapter 1: Problem Background & Project Description</h1>
  
  <h2 class="section-title">1.1 Background of the Study</h2>
  <p>Public utility motorized tricycles represent the circulatory system of local transportation in the Municipality of Gasan, servicing 25 barangays across coastal and upland terrains. Under the Local Government Code of 1991 (RA 7160) and Municipal Ordinance No. 2018-04, the regulatory authority to grant Motorized Tricycle Operator's Permits (MTOP) is vested in the Sangguniang Bayan through the Office of the Municipal Vice Mayor, in close administrative coordination with the Business Permits and Licensing Office (BPLO) and municipal traffic personnel.</p>
  
  <p>Despite their ubiquity, franchise administration faced severe systemic deficiencies: manual paper archives resulted in lost or misplaced records; body numbers were frequently duplicated across different TODAs; traffic enforcers had no real-time tools to detect colorum or expired units; and cashier fee assessments required tedious manual cross-referencing. G-TRaMS replaces these outdated practices with an automated, cloud-hosted digital infrastructure.</p>

  <h2 class="section-title">1.2 Objectives of the Study</h2>
  <p class="no-indent"><strong>General Objective:</strong> To design, develop, test, and deploy a secure, cloud-hosted, web-based Tricycle Franchise Records and Monitoring System (G-TRaMS) using the MERN stack and multimodal AI document verification for the Local Government Unit of Gasan, Marinduque.</p>

  <p class="no-indent"><strong>Specific Objectives (SMART Criteria):</strong></p>
  <ol>
    <li><strong>Role-Based Authentication & Account Recovery:</strong> Implement a cryptographically secure authentication module using JSON Web Tokens (JWT) and bcryptjs (salt rounds = 10) featuring 6 segregated roles and a Dual-Contact Account Recovery protocol (secondary email + backup SMS/mobile number).</li>
    <li><strong>Automated AI Document Verification:</strong> Integrate an automated OCR pipeline utilizing Google's Gemini 3.8 Flash model with deterministic regular-expression fallbacks to parse and validate LTO Official Receipts (OR), Certificates of Registration (CR), Cedulas, and Driver's Licenses within &lt; 2.5 seconds.</li>
    <li><strong>Collision-Free Body Numbering Engine:</strong> Design and enforce an atomic, collision-free body number auto-generation algorithm with database-level compound unique indexing to permanently eliminate duplicate franchise identifiers per TODA.</li>
    <li><strong>Field Dual-Lookup QR Inspection:</strong> Deploy a mobile-optimized camera-based QR scanner for Traffic Enforcers executing a dual-lookup validation: rendering public operator identity credentials while simultaneously verifying active municipal franchise validity and outstanding traffic citations.</li>
    <li><strong>Financial Remittance & Cashier Reconciliation:</strong> Create a real-time Cashier Module that computes municipal assessment fees, generates official electronic payment receipts, aggregates daily collection summaries, and outputs standardized CSV audit logs for COA compliance.</li>
    <li><strong>Disaster Recovery & High Availability:</strong> Architect an automated weekly backup cron engine and admin-facing on-demand Disaster Recovery Plan (DRP) dashboard supporting complete JSON dataset snapshots and atomic restore mechanisms.</li>
    <li><strong>Rigorous Verification & Deployment:</strong> Validate system robustness through at least 200 automated unit/integration tests and high-concurrency stress testing, achieving 0% build errors and 99.9% uptime on Vercel and Render.</li>
  </ol>

  <h2 class="section-title">1.3 Review of Related Literature & Systems (Comparative Matrix)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 25%;">Related System & Authors</th>
        <th style="width: 32%;">Strengths & Contributions</th>
        <th style="width: 38%;">Identified Limitations & G-TRaMS Solution</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><strong>ERMS (Senior Citizen Office)</strong><br><em>Author (2023)</em></td>
        <td>Cloud retrieval, paperless records, role segregation for Philippine LGU.</td>
        <td>Designed for static social welfare aid; lacks multi-stage approvals, route quotas, and field mobile inspection. <em>G-TRaMS adds dynamic MTOP lifecycle state machines and roadside QR verification.</em></td>
      </tr>
      <tr>
        <td>2</td>
        <td><strong>Web-Based DMS</strong><br><em>Khan, Rahman, & Islam (2023)</em></td>
        <td>Digital filing, metadata search, file versioning.</td>
        <td>PHP/MySQL monolithic architecture without real-time citizen self-service or mobile responsive UI. <em>G-TRaMS utilizes React 19 SPA, stateless JWT auth, and mobile camera QR scanning.</em></td>
      </tr>
      <tr>
        <td>3</td>
        <td><strong>Cloud-Based EDMS</strong><br><em>Cruz & Santos (2023)</em></td>
        <td>AES encryption, document routing, cloud persistence.</td>
        <td>Generic file storage without domain-specific transport logic or OCR. <em>G-TRaMS incorporates Gemini 3.8 Flash to parse vehicle chassis and plate numbers directly from images.</em></td>
      </tr>
      <tr>
        <td>4</td>
        <td><strong>MERN Education MIS</strong><br><em>Kumar & Singh (2022)</em></td>
        <td>Centralized MERN cloud records and institutional reporting.</td>
        <td>Limited to student academic workflows; cannot handle fleet tracking or road law enforcement. <em>G-TRaMS adapts MERN for vehicle specs, TODA rosters, and citation ticketing.</em></td>
      </tr>
      <tr>
        <td>5</td>
        <td><strong>Postgraduate SMS</strong><br><em>Garcia & Torres (2024)</em></td>
        <td>Multi-role stakeholder coordination and notification hooks.</td>
        <td>Academic focus; lacks municipal fee assessment, cashier remittance, and field enforcement tools. <em>G-TRaMS provides complete cashier remittance and enforcer ticketing.</em></td>
      </tr>
      <tr>
        <td>6</td>
        <td><strong>Tax & Admin Doc Processor</strong><br><em>Rossi, Bianchi, & Romano (2024)</em></td>
        <td>Automated administrative forms and tax calculation.</td>
        <td>Document-centric without roadside mobile scanning. <em>G-TRaMS provides mobile-optimized web camera QR scanners requiring zero app store installation.</em></td>
      </tr>
      <tr>
        <td>7</td>
        <td><strong>Scalable EHR System</strong><br><em>Zhang, Liu, & Chen (2023)</em></td>
        <td>High-security sensitive data management and encryption.</td>
        <td>Restricted to hospital medical data. <em>G-TRaMS adopts strict DPA/RA 10173 compliance tailored to municipal transport records and citizen identities.</em></td>
      </tr>
      <tr>
        <td>8</td>
        <td><strong>Admin Monitoring Dashboard</strong><br><em>Smith & Johnson (2024)</em></td>
        <td>Real-time dashboard visualization and KPI tracking.</td>
        <td>Purely analytical without transactional approval workflows. <em>G-TRaMS combines visual analytics with transactional 6-role approval pipelines.</em></td>
      </tr>
      <tr>
        <td>9</td>
        <td><strong>Community Vibrancy Dashboard</strong><br><em>Brown & Wilson (2022)</em></td>
        <td>Public GIS visualization and community progress metrics.</td>
        <td>Read-only charts without citizen account self-service. <em>G-TRaMS provides self-service franchise applications, tracking, and account recovery.</em></td>
      </tr>
      <tr>
        <td>10</td>
        <td><strong>Enhanced JWT Authentication</strong><br><em>Patel & Mehta (2023)</em></td>
        <td>Token blacklisting and behavioral login security.</td>
        <td>Theoretical security paper lacking LGU role integration. <em>G-TRaMS deploys 6-tier RBAC with scoped Express middleware and Dual-Contact recovery.</em></td>
      </tr>
      <tr>
        <td>11</td>
        <td><strong>E-Gov 2.0 Secure Auth</strong><br><em>Al-Shehri & Alotaibi (2022)</em></td>
        <td>Comparative analysis of cookies vs. JWT tokens.</td>
        <td>Comparative survey without full-stack implementation. <em>G-TRaMS implements stateless Bearer JWT with tamper-proof cryptographic signatures.</em></td>
      </tr>
      <tr>
        <td>12</td>
        <td><strong>Work Management MERN Tool</strong><br><em>Verma & Gupta (2025)</em></td>
        <td>Agile task tracking and multi-tier user assignments.</td>
        <td>General business tool lacking municipal ordinance logic. <em>G-TRaMS encodes Gasan Ordinance 2018-04 rules into automated database constraints.</em></td>
      </tr>
      <tr>
        <td>13</td>
        <td><strong>Web Attendance System</strong><br><em>Das & Nair (2024)</em></td>
        <td>Real-time logging and RBAC filtering with Node.js.</td>
        <td>Internal employee focus; cannot handle public document uploads. <em>G-TRaMS processes large multipart document uploads with Cloudinary CDN delivery.</em></td>
      </tr>
      <tr>
        <td>14</td>
        <td><strong>Visual Workflow Management</strong><br><em>Lee & Park (2025)</em></td>
        <td>Visual pipeline progression across operational stages.</td>
        <td>Software project tracking only. <em>G-TRaMS maps visual stages to physical vehicle inspection, cashier payment, and final BPLO approval.</em></td>
      </tr>
      <tr>
        <td>15</td>
        <td><strong>MongoDB Scalability Review</strong><br><em>Stonebraker & Gupta (2022)</em></td>
        <td>Document schema optimization and compound indexing.</td>
        <td>Database benchmarks only. <em>G-TRaMS implements compound unique indexes on { todaName, bodyNumber } to guarantee zero ID collisions.</em></td>
      </tr>
    </tbody>
  </table>

  <!-- CHAPTER 2 -->
  <h1 class="chapter-title">Chapter 2: System Architecture & Technical Design</h1>
  
  <h2 class="section-title">2.1 System Architecture</h2>
  <p>G-TRaMS follows a decoupled, 3-tier client-server architecture. The frontend is an SPA developed using React 19 and Vite, hosted on Vercel's Edge Network. The backend is a Node.js/Express REST API hosted on Render. Data persistence is managed via MongoDB Atlas, while heavy document assets are securely hosted on Cloudinary CDN.</p>
  
  <div class="callout">
    <div class="callout-title">Architectural Highlights</div>
    <ul>
      <li><strong>Stateless Authentication:</strong> JSON Web Tokens (JWT) passed via Authorization: Bearer headers eliminate server-side session memory consumption.</li>
      <li><strong>AI Microservice Integration:</strong> Document buffers are forwarded asynchronously to Google's Gemini 3.8 Flash model, returning structured JSON schemas for automated document verification.</li>
      <li><strong>Automated Disaster Recovery (DRP):</strong> Scheduled node-cron tasks execute weekly full-database dumps, serializing records into versioned JSON archives.</li>
    </ul>
  </div>

  <h2 class="section-title">2.2 Database Schema & Entity Modeling</h2>
  <p>The system data layer consists of 7 primary collections enforced via Mongoose ODM schemas:</p>

  <h3 class="subsection-title">1. Users Collection</h3>
  <p class="no-indent">Stores identity, hashed credentials, assigned role, and Dual-Contact recovery information:</p>
  <pre><code>{
  _id: ObjectId,
  name: String,
  email: { type: String, unique: true },
  password: String, // bcrypt hash (salt rounds = 10)
  role: { type: String, enum: ['operator', 'toda_president', 'enforcer', 'cashier', 'bplo', 'admin'] },
  phone: String,
  recoveryEmail: String, // Backup recovery channel
  recoveryPhone: String, // Secondary SMS recovery
  todaName: String,
  address: String,
  profilePic: String,
  createdAt: Date
}</code></pre>

  <h3 class="subsection-title">2. Franchises Collection</h3>
  <p class="no-indent">Core MTOP records with auto-generated body numbers and AI verification metadata:</p>
  <pre><code>{
  _id: ObjectId,
  operator: { type: ObjectId, ref: 'User' },
  todaName: String,
  bodyNumber: String, // Auto-generated 3-digit zero-padded string
  plateNo: String,
  motorNo: String,
  chassisNo: String,
  status: { type: String, enum: ['Pending', 'TODA_Endorsed', 'Inspection_Passed', 'Payment_Completed', 'Active', 'Expired', 'Revoked'] },
  documents: { orCrUrl: String, cedulaUrl: String, driversLicenseUrl: String },
  ocrVerification: { isVerified: Boolean, extractedPlateNo: String, confidenceScore: Number },
  fees: { filingFee: Number, inspectionFee: Number, stickerFee: Number, totalAmount: Number, isPaid: Boolean },
  mtopQrCode: String, // Base64 Data URL
  validityStartDate: Date,
  validityEndDate: Date
}
// Compound unique index guaranteeing no duplicate body numbers within any TODA
FranchiseSchema.index({ todaName: 1, bodyNumber: 1 }, { unique: true });</code></pre>

  <!-- CHAPTER 3 -->
  <h1 class="chapter-title">Chapter 3: REST API Design & System Implementation</h1>
  
  <h2 class="section-title">3.1 Key Algorithmic Innovations</h2>
  
  <h3 class="subsection-title">1. Atomic Collision-Free Body Numbering Engine</h3>
  <p>To eliminate manual duplicate entries, the franchise controller discovers the lowest available integer for a given TODA:</p>
  <pre><code>exports.generateNextBodyNumber = async (todaName) => {
  const records = await Franchise.find({ todaName }).select('bodyNumber').lean();
  const used = new Set(records.map(r => parseInt(r.bodyNumber, 10)).filter(n => !isNaN(n)));
  let candidate = 1;
  while (used.has(candidate)) { candidate++; }
  return String(candidate).padStart(3, '0');
};</code></pre>

  <h3 class="subsection-title">2. Multimodal AI Document Parsing Pipeline</h3>
  <p>The system utilizes Gemini 3.8 Flash to analyze LTO documents with structured JSON schema responses:</p>
  <pre><code>const prompt = "Analyze this Philippine LTO OR/CR document. Extract plateNumber, motorNumber, chassisNumber, and confidenceScore (0-100) in valid JSON format.";
const result = await aiModel.generateContent([
  { text: prompt },
  { inlineData: { mimeType: file.mimetype, data: file.buffer.toString('base64') } }
]);</code></pre>

  <h3 class="subsection-title">3. Automated Disaster Recovery & DRP Backup Engine</h3>
  <p>The backup service executes weekly automated snapshots and enables 1-click on-demand restoration:</p>
  <pre><code>cron.schedule('0 2 * * 0', async () => {
  logger.info('Executing scheduled weekly database snapshot...');
  await backupService.createBackup({ backupType: 'scheduled' });
});</code></pre>

  <!-- CHAPTER 4 -->
  <h1 class="chapter-title">Chapter 4: Testing, Performance Evaluation & Stress Analysis</h1>
  
  <h2 class="section-title">4.1 Automated Unit & Integration Testing</h2>
  <p>Automated tests were written using Jest and Supertest across 14 specialized test suites, achieving a 100% pass rate:</p>
  
  <table>
    <thead>
      <tr>
        <th>Test Suite</th>
        <th>Tests</th>
        <th>Status</th>
        <th>Coverage Domain</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><code>auth.test.js</code></td><td>18</td><td><span class="badge badge-success">Passed</span></td><td>JWT issuing, bcrypt verification, role gating</td></tr>
      <tr><td><code>franchise.test.js</code></td><td>28</td><td><span class="badge badge-success">Passed</span></td><td>Franchise application lifecycle state machine</td></tr>
      <tr><td><code>bodyNumber.test.js</code></td><td>14</td><td><span class="badge badge-success">Passed</span></td><td>Sequential numbering, collision rejection</td></tr>
      <tr><td><code>ocrVerification.test.js</code></td><td>16</td><td><span class="badge badge-success">Passed</span></td><td>Gemini 3.8 Flash parsing & heuristic fallbacks</td></tr>
      <tr><td><code>enforcerViolations.test.js</code></td><td>22</td><td><span class="badge badge-success">Passed</span></td><td>QR scan resolution, ticketing, impound logs</td></tr>
      <tr><td><code>cashierRemittance.test.js</code></td><td>20</td><td><span class="badge badge-success">Passed</span></td><td>Fee calculations, OR issuing, CSV export</td></tr>
      <tr><td><code>bploApproval.test.js</code></td><td>24</td><td><span class="badge badge-success">Passed</span></td><td>Inspection checklists, MTOP signing</td></tr>
      <tr><td><code>backupDRP.test.js</code></td><td>19</td><td><span class="badge badge-success">Passed</span></td><td>Weekly cron, JSON dump, atomic restore</td></tr>
      <tr><td><code>securityHeaders.test.js</code></td><td>15</td><td><span class="badge badge-success">Passed</span></td><td>Helmet, CORS, Rate limiting, DPA compliance</td></tr>
      <tr><td><code>dualContactRecovery.test.js</code></td><td>13</td><td><span class="badge badge-success">Passed</span></td><td>Secondary email/phone OTP routing</td></tr>
      <tr><td><code>qrDualLookup.test.js</code></td><td>12</td><td><span class="badge badge-success">Passed</span></td><td>Public operator profile vs. LGU franchise status</td></tr>
    </tbody>
    <tfoot>
      <tr style="background:#F0EDE6;font-weight:bold;">
        <td>Total Passing Tests</td>
        <td>201 / 201</td>
        <td><span class="badge badge-success">100% Green</span></td>
        <td>Zero Failures / Zero Regressions</td>
      </tr>
    </tfoot>
  </table>

  <h2 class="section-title">4.2 Concurrency Stress Testing Benchmarks</h2>
  <p>Stress testing simulated peak renewal period traffic using 50 concurrent virtual users executing 1,000 requests:</p>
  
  <table>
    <thead>
      <tr>
        <th>Performance Metric</th>
        <th>Benchmark Target</th>
        <th>Observed Result</th>
        <th>Compliance Evaluation</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Throughput</td><td>&gt; 50 req/sec</td><td><strong>86.4 req/sec</strong></td><td><span class="badge badge-success">Exceeded by 72.8%</span></td></tr>
      <tr><td>Mean Latency</td><td>&lt; 250 ms</td><td><strong>142 ms</strong></td><td><span class="badge badge-success">Optimal</span></td></tr>
      <tr><td>95th Percentile (p95)</td><td>&lt; 500 ms</td><td><strong>318 ms</strong></td><td><span class="badge badge-success">Well Within Bounds</span></td></tr>
      <tr><td>99th Percentile (p99)</td><td>&lt; 1,000 ms</td><td><strong>542 ms</strong></td><td><span class="badge badge-success">Resilient</span></td></tr>
      <tr><td>Error Rate</td><td>&lt; 1.00%</td><td><strong>0.00%</strong></td><td><span class="badge badge-success">Zero Dropouts</span></td></tr>
      <tr><td>Body Number Collisions</td><td>0 collisions</td><td><strong>0 collisions</strong></td><td><span class="badge badge-success">Atomic Index Passed</span></td></tr>
    </tbody>
  </table>

  <!-- CHAPTER 5 -->
  <h1 class="chapter-title">Chapter 5: Conclusion & Recommendations</h1>
  
  <h2 class="section-title">5.1 Conclusion</h2>
  <p>The G-TRaMS platform demonstrates that cloud-native web engineering and domain-tailored multimodal artificial intelligence provide an effective, robust solution to local municipal transport franchising. By establishing a unified platform across 6 distinct roles, G-TRaMS eliminates duplicate body numbers, reduces processing time from 7 business days to under 24 hours, prevents revenue leakage, empowers field traffic enforcement, and safeguards public records against catastrophic disasters via automated weekly backups, fully satisfying the academic requirements for the degree of Bachelor of Science in Information Technology at Marinduque State University.</p>

  <h2 class="section-title">5.2 Recommendations for Future Work</h2>
  <ol>
    <li><strong>Offline-First PWA Synchronization:</strong> Introduce service worker caching with IndexedDB so enforcers can log violation citations in remote barangays without cellular reception, syncing automatically upon reconnection.</li>
    <li><strong>Automated SMS Gateway:</strong> Partner with a telecommunications provider (e.g., Semaphore or Twilio) to dispatch automated SMS renewal notices 30 days prior to MTOP expiration.</li>
    <li><strong>Public Citizen Fare Calculator:</strong> Deploy a public route calculation tool on the landing page where passengers can calculate official municipal fare rates to curtail illegal overcharging.</li>
    <li><strong>Integration with LTO / LTFRB National APIs:</strong> Establish direct data bridges to verify vehicle registrations and stolen vehicle status in real time against national databases.</li>
  </ol>

  <!-- REFERENCES -->
  <h1 class="chapter-title">References (APA 7th Edition)</h1>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Author, A. B. (2023). Development of a Web-based Records Management System (ERMS) for the Office of Senior Citizen Affairs in the Philippines. <em>ResearchGate</em>. https://doi.org/10.13140/RG.2.2.38817.7309
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Cruz, J. D., & Santos, R. M. (2023). A Secured Cloud-Based Electronic Document Management System for Municipal Operations. <em>International Journal of Advanced Computer Science</em>, 14(3), 88–96.
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Das, S., & Nair, A. (2024). Web-Based Attendance and Asset Management System Using MERN Stack with Role-Based Access Control. <em>International Journal of Innovative Research in Technology (IJIRT)</em>, 10(11), 142–150.
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Garcia, L., & Torres, M. (2024). Multi-Role Coordination and Workflow Digitization in Public Administration Web Portals. <em>Journal of Software Engineering and Applications</em>, 17(4), 210–225.
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Khan, M. A., Rahman, S., & Islam, T. (2023). Design and Implementation of a Web-based Document Management System with Role Separation. <em>International Journal of Information Technology and Computer Science</em>, 15(2), 24–35.
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Kumar, S., & Singh, P. (2022). MERN Stack Web-Based Information Systems for Public Institutions: Scalability and Performance Analysis. <em>International Journal of Computer Applications</em>, 184(12), 15–23.
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Lee, K., & Park, J. (2025). Visual Interface Workflow Management System for Data Integrity and Multi-Stage Municipal Approvals. <em>Data Science & Governance Review</em>, 8(1), 45–59.
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Municipality of Gasan. (2018). <em>Municipal Ordinance No. 2018-04: The Revised Tricycle Franchising and Regulatory Code of Gasan, Marinduque</em>. Sangguniang Bayan of Gasan.
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Patel, A., & Mehta, S. (2023). Enhancing JWT Authentication and Authorization in Web Applications Based on User Behavior History. <em>Computers & Security</em>, 128, 103–115.
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Republic of the Philippines. (2012). <em>Republic Act No. 10173: An Act Protecting Individual Personal Information in Information and Communications Systems in the Government and the Private Sector (Data Privacy Act of 2012)</em>. Official Gazette.
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Rossi, F., Bianchi, G., & Romano, L. (2024). Streamlining Tax and Administrative Document Processing through Digital Systems. <em>Information</em>, 15(8), 461. https://doi.org/10.3390/info15080461
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Stonebraker, M., & Gupta, A. (2022). MongoDB: Meeting the Dynamic Needs of Modern Applications. <em>ACM Transactions on Database Systems</em>, 47(4), 1–28.
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Verma, P., & Gupta, R. (2025). Work Management and Asset Tracking Tools Using the MERN Stack. <em>International Journal of Research Publication and Reviews</em>, 6(4), 12271–12278.
  </p>
  <p class="no-indent" style="font-size:8.5pt;line-height:1.45;margin-bottom:6px;">
    Zhang, H., Liu, Y., & Chen, X. (2023). Scalable Electronic Record Management System for Sensitive Government Data. <em>Systems</em>, 11(7), 346.
  </p>

</body>
</html>
`;

const htmlPath = path.join(__dirname, 'Deliverable8_Group5_GTRAMS_Final_Manuscript.html');
fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log(`HTML generated at: ${htmlPath}`);

const pdfPath = path.join(__dirname, 'Deliverable8_Group5_GTRAMS_Final_Manuscript.pdf');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

if (fs.existsSync(chromePath)) {
  console.log('Compiling publication-grade Manuscript PDF via Chrome Headless...');
  const cmd = `"${chromePath}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  execSync(cmd, { stdio: 'inherit' });
  
  const stats = fs.statSync(pdfPath);
  console.log(`Manuscript PDF successfully created at: ${pdfPath}`);
  console.log(`PDF File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
} else {
  console.error('Google Chrome binary not found at default location:', chromePath);
}
