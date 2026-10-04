const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureScreens() {
  const assetsDir = path.resolve(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Copy logos into remotion/assets
  const publicDir = path.resolve(__dirname, '..', 'frontend', 'public');
  ['gtrams-logo.png', 'gasan-logo.png', 'tricycle-home.jpg', 'tricycle-icon.png'].forEach(file => {
    const src = path.join(publicDir, file);
    const dest = path.join(assetsDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${file} to assets`);
    }
  });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2
  });

  // SCREEN 1: Landing Page & Service Charter
  console.log('Capturing Screen 1: Landing Page...');
  const page1 = await context.newPage();
  await page1.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page1.waitForTimeout(2000); // allow animations to settle
  await page1.screenshot({
    path: path.join(assetsDir, 'screen1_landing.png'),
    fullPage: false
  });
  console.log('Saved screen1_landing.png');
  await page1.close();

  // SCREEN 2: Operator Application & Renewal Wizard
  console.log('Capturing Screen 2: Apply Franchise Wizard...');
  const page2 = await context.newPage();
  await page2.addInitScript(() => {
    localStorage.setItem('token', 'mock-operator-token-gtrams');
    localStorage.setItem('role', 'operator');
    localStorage.setItem('name', 'Juan Dela Cruz');
    localStorage.setItem('userId', 'op-001');
    localStorage.setItem('user', JSON.stringify({
      id: 'op-001',
      name: 'Juan Dela Cruz',
      role: 'operator',
      email: 'operator.gasan@gmail.com'
    }));
    localStorage.setItem('gtrams_apply_draft', JSON.stringify({
      step: 1,
      operatorType: 'Individual',
      applicationType: 'New',
      vehicleMake: 'Honda TMX 125',
      motorNumber: 'ENG-49102-GAS',
      chassisNumber: 'CHS-88192-LGU',
      plateNumber: 'TR-8921',
      toda: 'GASAN CENTRAL TODA',
      zone: 'Zone 1 - Poblacion District'
    }));
  });

  await page2.goto('http://localhost:5173/apply-franchise?step=1', { waitUntil: 'networkidle', timeout: 30000 });
  await page2.waitForTimeout(2000);
  await page2.screenshot({
    path: path.join(assetsDir, 'screen2_application.png'),
    fullPage: false
  });
  console.log('Saved screen2_application.png');
  await page2.close();

  // SCREEN 3: Admin Franchise Masterlist & Live Monitoring
  console.log('Capturing Screen 3: Admin Franchise Masterlist...');
  const page3 = await context.newPage();
  await page3.addInitScript(() => {
    localStorage.setItem('token', 'mock-admin-token-gtrams');
    localStorage.setItem('role', 'admin');
    localStorage.setItem('name', 'Municipal Franchising Officer');
    localStorage.setItem('userId', 'adm-001');
    localStorage.setItem('user', JSON.stringify({
      id: 'adm-001',
      name: 'Municipal Franchising Officer',
      role: 'admin',
      email: 'mtfrb.gasan@gov.ph'
    }));
  });

  // Mock API responses for admin masterlist
  await page3.route('**/api/v1/franchises*', async route => {
    const mockData = {
      success: true,
      data: [
        {
          _id: 'fr-001',
          mtopNumber: 'MTOP-2026-0042',
          operator: { name: 'Juan Dela Cruz', contactNumber: '0917-123-4567' },
          fullName: 'Juan Dela Cruz',
          toda: 'GASAN CENTRAL TODA',
          todaAssociation: 'GASAN CENTRAL TODA',
          zone: 'Zone 1 - Poblacion',
          plateNumber: 'TR-8921',
          status: 'Active',
          applicationType: 'Renewal',
          issuedDate: '2026-01-10',
          expirationDate: '2027-01-10'
        },
        {
          _id: 'fr-002',
          mtopNumber: 'MTOP-2026-0089',
          operator: { name: 'Ricardo Santos', contactNumber: '0918-987-6543' },
          fullName: 'Ricardo Santos',
          toda: 'POB-BAC TODA',
          todaAssociation: 'POB-BAC TODA',
          zone: 'Zone 2 - BacONG District',
          plateNumber: 'TR-4432',
          status: 'Pending',
          applicationType: 'New',
          issuedDate: '2026-02-14',
          expirationDate: '2027-02-14'
        },
        {
          _id: 'fr-003',
          mtopNumber: 'MTOP-2026-0105',
          operator: { name: 'Elena Reyes', contactNumber: '0920-555-1234' },
          fullName: 'Elena Reyes',
          toda: 'DAWIS-LIBAS TODA',
          todaAssociation: 'DAWIS-LIBAS TODA',
          zone: 'Zone 3 - Coastal',
          plateNumber: 'TR-1029',
          status: 'For Signing',
          applicationType: 'Renewal',
          issuedDate: '2026-02-20',
          expirationDate: '2027-02-20'
        },
        {
          _id: 'fr-004',
          mtopNumber: 'MTOP-2026-0122',
          operator: { name: 'Mateo Villanueva', contactNumber: '0919-444-9876' },
          fullName: 'Mateo Villanueva',
          toda: 'BANGBANG TODA',
          todaAssociation: 'BANGBANG TODA',
          zone: 'Zone 4 - Inland',
          plateNumber: 'TR-7721',
          status: 'Ready for Pickup',
          applicationType: 'New',
          issuedDate: '2026-02-28',
          expirationDate: '2027-02-28'
        },
        {
          _id: 'fr-005',
          mtopNumber: 'MTOP-2025-0981',
          operator: { name: 'Antonio Ramos', contactNumber: '0922-333-8899' },
          fullName: 'Antonio Ramos',
          toda: 'BOGHA-PINGGAN TODA',
          todaAssociation: 'BOGHA-PINGGAN TODA',
          zone: 'Zone 5 - Southern',
          plateNumber: 'TR-3390',
          status: 'Expired',
          applicationType: 'Renewal',
          issuedDate: '2025-01-05',
          expirationDate: '2026-01-05'
        }
      ],
      meta: {
        totalRecords: 248,
        totalPages: 25,
        currentPage: 1,
        hasNextPage: true,
        hasPrevPage: false
      }
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockData)
    });
  });

  await page3.goto('http://localhost:5173/franchise-masterlist', { waitUntil: 'networkidle', timeout: 30000 });
  await page3.waitForTimeout(2000);
  await page3.screenshot({
    path: path.join(assetsDir, 'screen3_masterlist.png'),
    fullPage: false
  });
  console.log('Saved screen3_masterlist.png');
  await page3.close();

  // SCREEN 4: Public QR Verification Card
  console.log('Capturing Screen 4: Public QR Verification...');
  const page4 = await context.newPage();
  await page4.setViewportSize({ width: 1200, height: 1080 });
  await page4.goto('http://localhost:5173/verify/GASAN-2026-0042', { waitUntil: 'networkidle', timeout: 30000 });
  await page4.waitForTimeout(2000);
  await page4.screenshot({
    path: path.join(assetsDir, 'screen4_verify.png'),
    fullPage: false
  });
  console.log('Saved screen4_verify.png');
  await page4.close();

  await browser.close();
  console.log('All screen assets successfully captured into remotion/assets/');
}

captureScreens().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
