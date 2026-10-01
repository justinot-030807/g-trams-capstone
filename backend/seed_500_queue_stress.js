/**
 * DEV-ONLY SEED SCRIPT: 500 Dummy Applications for Peak Queue Load Testing
 * 
 * Safety Rules:
 * 1. Strictly disabled in PRODUCTION (checks NODE_ENV !== 'production').
 * 2. Uses recognizable plate numbers (TEST-LOAD-001 through TEST-LOAD-500).
 * 3. Supports full rollback/cleanup via:
 *    node backend/seed_500_queue_stress.js --clean
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

const Franchise = require('./src/models/franchiseModel');
const User = require('./src/models/userModel');

// Strict environment guard
if (process.env.NODE_ENV === 'production') {
  console.error('CRITICAL GUARD: Cannot run seed_500_queue_stress in PRODUCTION environment!');
  process.exit(1);
}

const isCleanOnly = process.argv.includes('--clean');

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB.');

    if (isCleanOnly) {
      console.log('Cleaning up all stress-test dummy applications (TEST-LOAD-*)...');
      const delResult = await Franchise.deleteMany({ plateNo: { $regex: /^TEST-LOAD-/ } });
      console.log(`Successfully deleted ${delResult.deletedCount} stress-test applications.`);
      process.exit(0);
    }

    // Ensure we have a dedicated dummy operator for these applications
    let testOperator = await User.findOne({ email: 'loadtest.operator@gtrams.internal' });
    if (!testOperator) {
      testOperator = await User.create({
        name: 'Stress Test Operator Account',
        email: 'loadtest.operator@gtrams.internal',
        password: 'Password123!',
        role: 'operator',
        isVerified: true,
        address: 'Barangay Poblacion, Gasan, Marinduque',
        contact: '09170000000'
      });
      console.log('Created dedicated load-test operator account.');
    }

    // Pre-clean previous load-test batch if any exists
    const preClean = await Franchise.deleteMany({ plateNo: { $regex: /^TEST-LOAD-/ } });
    if (preClean.deletedCount > 0) {
      console.log(`Pre-cleaned ${preClean.deletedCount} prior stress-test applications.`);
    }

    const BARANGAYS = [
      'Poblacion', 'Antipolo', 'Bachao Ibaba', 'Bachao Ilaya', 'Bacong-Bacong', 
      'Bahi', 'Bangbang', 'Bantad', 'Bognuyan', 'Cabugao', 'Dawis', 'Dili', 
      'Libtangin', 'Mahunig', 'Mangili', 'Masiga', 'Matandang Gasan', 'Pangi', 
      'Pinggan', 'Tabionan', 'Tapuyan', 'Tiguion'
    ];

    const TODAS = [
      'POB-TODA', 'BATODA', 'GT-TODA', 'BAP-TODA', 'BANGBANG IPIL', 
      'NBI-TODA', 'TAB-TODA', 'BAHI-TODA', 'GASAN CENTRAL', 'NON-TODA'
    ];

    const MAKES = [
      'Honda TMX 125 Alpha', 'Kawasaki Barako II 175', 'Yamaha YTX 125', 
      'Suzuki GD110', 'Bajaj CT100', 'TVS Max 125'
    ];

    const FIRST_NAMES = [
      'Juan', 'Pedro', 'Maria', 'Jose', 'Antonio', 'Manuel', 'Ramon', 'Eduardo', 
      'Carlos', 'Francisco', 'Arnel', 'Danilo', 'Reynaldo', 'Rodel', 'Joel', 
      'Mark', 'Angelo', 'Christian', 'Michael', 'Jerome', 'Noel', 'Edgardo'
    ];

    const LAST_NAMES = [
      'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 
      'Torres', 'Tomas', 'Andaya', 'Seda', 'Navarro', 'Villanueva', 'Ramos', 
      'Castillo', 'Flores', 'Morales', 'Rivera', 'Mercado', 'Aquino', 'Del Rosario'
    ];

    const DUMMY_DOC_URL = 'https://res.cloudinary.com/gtrams/image/upload/v1726000000/sample_doc.jpg';

    const applications = [];
    const now = Date.now();

    for (let i = 1; i <= 500; i++) {
      const plateNumber = `TEST-LOAD-${String(i).padStart(3, '0')}`;
      const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;
      const toda = TODAS[i % TODAS.length];
      const barangay = BARANGAYS[i % BARANGAYS.length];
      const make = MAKES[i % MAKES.length];
      const year = String(2018 + (i % 8));

      // Spread filing date across the last 30 days for testing waiting time calculations and FIFO
      const daysAgo = (i % 30);
      const hoursAgo = (i % 24);
      const appliedDate = new Date(now - (daysAgo * 86400000 + hoursAgo * 3600000));

      let status = 'Pending';
      let isResubmitted = false;
      let resubmittedAt = null;

      if (i <= 220) {
        status = 'Pending';
        if (i % 6 === 0) {
          isResubmitted = true;
          resubmittedAt = new Date(appliedDate.getTime() + 3600000);
        }
      } else if (i <= 340) {
        status = 'For Signing';
      } else if (i <= 420) {
        status = 'Ready for Pickup';
      } else if (i <= 470) {
        status = 'Active';
      } else if (i <= 490) {
        status = 'Expired';
      } else {
        status = 'Cancelled';
      }

      // Application type: ~65% Renewal (January Peak), ~35% New
      const applicationType = (i % 3 === 0) ? 'New' : 'Renewal';

      // Clean vs Flagged variation: ~75% clean, ~25% flagged
      const isClean = (i % 4 !== 0);

      // Expiry dates
      const orCrExpiryDate = isClean
        ? new Date(now + (60 + (i % 300)) * 86400000)
        : (i % 8 === 0 ? new Date(now - 15 * 86400000) : new Date(now + 10 * 86400000));

      const driverLicenseExpiryDate = new Date(now + (180 + (i % 500)) * 86400000);

      applications.push({
        operator: testOperator._id,
        fullName,
        address: `Barangay ${barangay}, Gasan, Marinduque`,
        zone: `Zone ${(i % 3) + 1}`,
        made: year,
        make,
        motorNo: `ENG-${String(100000 + i)}`,
        chassisNo: `CHS-${String(200000 + i)}`,
        plateNo: plateNumber,
        todaName: toda,
        orCrUrl: DUMMY_DOC_URL,
        licenseUrl: DUMMY_DOC_URL,
        cedulaUrl: DUMMY_DOC_URL,
        todaEndorsementUrl: isClean ? DUMMY_DOC_URL : (i % 8 === 0 ? '' : DUMMY_DOC_URL),
        brgyClearanceUrl: isClean ? DUMMY_DOC_URL : (i % 12 === 0 ? '' : DUMMY_DOC_URL),
        orCrNo: `OR-${String(900000 + i)}`,
        orCrExpiryDate,
        isOperatorDriver: i % 5 !== 0,
        driverName: i % 5 !== 0 ? fullName : `Driver ${firstName} ${lastName}`,
        driverLicenseNo: `D02-99-${String(100000 + i)}`,
        driverLicenseExpiryDate,
        todaCertNo: `TODA-CERT-${i}`,
        todaCertDate: appliedDate,
        brgyClearanceNo: `BRGY-${barangay.substring(0, 3).toUpperCase()}-${i}`,
        brgyClearanceDate: appliedDate,
        dateApplied: appliedDate,
        cedulaDate: appliedDate,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: `CTC-${String(500000 + i)}`,
        status,
        applicationType,
        isResubmitted,
        resubmittedAt,
        cancelReason: status === 'Cancelled' ? 'Expired LTO Official Receipt / Blurry Scan' : '',
        deficiencies: {
          hasOrcr: true,
          hasLicense: true,
          hasTodaEndorsement: isClean || i % 8 !== 0,
          hasBrgyClearance: isClean || i % 12 !== 0
        },
        aiVerification: {
          status: isClean ? 'verified' : 'flagged',
          verifiedAt: appliedDate,
          summary: {
            totalFields: 5,
            matchedFields: isClean ? 5 : 3,
            mismatchedFields: isClean ? 0 : 2,
            unclearFields: 0
          }
        },
        createdAt: appliedDate,
        updatedAt: appliedDate
      });
    }

    console.log(`Inserting 500 dummy applications in batches of 100...`);
    for (let b = 0; b < applications.length; b += 100) {
      const chunk = applications.slice(b, b + 100);
      await Franchise.insertMany(chunk, { ordered: false });
      console.log(`Inserted chunk ${b / 100 + 1}/5 (${b + chunk.length} total)`);
    }

    console.log('\n=== LOAD TESTING DATA SEEDED SUCCESSFULLY ===');
    console.log('500 dummy applications created with plates: TEST-LOAD-001 through TEST-LOAD-500.');
    console.log('Distribution:');
    console.log('- Needs Review (Pending): ~220');
    console.log('- For Signing: ~120');
    console.log('- Ready for Pickup: ~80');
    console.log('- Active / Expired / Cancelled: ~80');
    console.log('\nTo clean up all test records anytime, run:');
    console.log('node backend/seed_500_queue_stress.js --clean\n');
    process.exit(0);

  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

run();
