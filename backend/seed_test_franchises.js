const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

const Franchise = require('./src/models/franchiseModel');
const User = require('./src/models/userModel');

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected successfully to MongoDB!');

    // Fetch existing operator accounts
    const operators = await User.find({ 
      role: { $in: ['operator', 'toda_president', 'toda president'] } 
    }).lean();

    console.log(`Found ${operators.length} operator/TODA accounts in database.`);

    if (operators.length === 0) {
      console.log('No operators found in database. Exiting.');
      process.exit(1);
    }

    // Find specific test operators if available
    const christian = operators.find(o => o.name && o.name.toLowerCase().includes('seda')) || operators[0];
    const albert = operators.find(o => o.name && o.name.toLowerCase().includes('wesker')) || operators[1] || operators[0];
    const kyla = operators.find(o => o.name && o.name.toLowerCase().includes('patrice')) || operators[2] || operators[0];
    const testdaw = operators.find(o => o.name && o.name.toLowerCase().includes('testing')) || operators[3] || operators[0];
    const operatorA = operators.find(o => o.name && (o.name.toLowerCase().includes('account') || o.name.toLowerCase().includes('ccount'))) || operators[0];

    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const testFranchises = [
      // 1. ACTIVE - Christian Seda (Unit 1)
      {
        operator: christian._id,
        fullName: christian.name,
        address: christian.address || 'Barangay Poblacion, Gasan, Marinduque',
        zone: 'Zone 1',
        made: '2023',
        make: 'Honda TMX 125 Alpha',
        motorNo: 'MOT-CS-78192',
        chassisNo: 'CHS-CS-98124',
        plateNo: '0401-CS01',
        todaName: 'POB-TODA',
        status: 'Active',
        applicationType: 'New',
        eSigned: true,
        releaseDate: '2026-02-15',
        dateApplied: twoMonthsAgo,
        cedulaDate: twoMonthsAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2026-99120',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: true, hasBrgyClearance: true },
        isArchived: false
      },
      // 2. ACTIVE - Christian Seda (Unit 2 - Reaches MAX capacity 2/2)
      {
        operator: christian._id,
        fullName: christian.name,
        address: christian.address || 'Barangay Poblacion, Gasan, Marinduque',
        zone: 'Zone 1',
        made: '2024',
        make: 'Kawasaki Barako II 175',
        motorNo: 'MOT-CS-33419',
        chassisNo: 'CHS-CS-55812',
        plateNo: '0401-CS02',
        todaName: 'POB-TODA',
        status: 'Active',
        applicationType: 'New',
        eSigned: true,
        releaseDate: '2026-03-01',
        dateApplied: oneMonthAgo,
        cedulaDate: oneMonthAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2026-99121',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: true, hasBrgyClearance: true },
        isArchived: false
      },

      // 3. EXPIRED - Albert S. Wesker (Unit 1 - Needs Renewal)
      {
        operator: albert._id,
        fullName: albert.name,
        address: albert.address || 'Barangay Bantad, Gasan, Marinduque',
        zone: 'Zone 2',
        made: '2021',
        make: 'Yamaha YTX 125',
        motorNo: 'MOT-AW-90123',
        chassisNo: 'CHS-AW-11234',
        plateNo: '0401-EXP01',
        todaName: 'BAP-TODA',
        status: 'Expired',
        applicationType: 'Renew',
        eSigned: true,
        releaseDate: '2024-01-10',
        dateApplied: twoYearsAgo,
        cedulaDate: twoYearsAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2024-44123',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: true, hasBrgyClearance: true },
        isArchived: false
      },

      // 4. EXPIRED - Kyla Patrice Sace (Past Validity)
      {
        operator: kyla._id,
        fullName: kyla.name,
        address: kyla.address || 'Barangay Matandang Gasan, Gasan, Marinduque',
        zone: 'Zone 3',
        made: '2020',
        make: 'Suzuki GD 110',
        motorNo: 'MOT-KP-55612',
        chassisNo: 'CHS-KP-77890',
        plateNo: '0401-EXP02',
        todaName: 'MAT-TODA',
        status: 'Expired',
        applicationType: 'New',
        eSigned: true,
        releaseDate: '2024-06-20',
        dateApplied: oneYearAgo,
        cedulaDate: oneYearAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2024-88712',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: true, hasBrgyClearance: true },
        isArchived: false
      },

      // 5. REVOKED - With Ordinance Violation Reason
      {
        operator: testdaw._id,
        fullName: testdaw.name,
        address: testdaw.address || 'Barangay Bacongbacong, Gasan, Marinduque',
        zone: 'Zone 2',
        made: '2022',
        make: 'Honda TMX 125 Alpha',
        motorNo: 'MOT-RVK-88192',
        chassisNo: 'CHS-RVK-44192',
        plateNo: '0401-RVK01',
        todaName: 'BAC-TODA',
        status: 'Revoked',
        applicationType: 'New',
        cancelReason: 'Violation of Municipal Ordinance No. 2024-08: Repeated fare overcharging and operating outside designated TODA route without permit.',
        eSigned: true,
        releaseDate: '2025-08-12',
        dateApplied: oneYearAgo,
        cedulaDate: oneYearAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2025-11029',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: true, hasBrgyClearance: true },
        isArchived: false
      },

      // 6. REVOKED - Unlawful Transfer Sample
      {
        operator: albert._id,
        fullName: albert.name,
        address: albert.address || 'Barangay Bantad, Gasan, Marinduque',
        zone: 'Zone 2',
        made: '2021',
        make: 'Bajaj RE Tricycle',
        motorNo: 'MOT-RVK-99210',
        chassisNo: 'CHS-RVK-33012',
        plateNo: '0401-RVK02',
        todaName: 'BAP-TODA',
        status: 'Revoked',
        applicationType: 'New',
        cancelReason: 'Revoked due to unauthorized sub-leasing and illegal transfer of franchise plate to an unregistered third-party unit.',
        eSigned: false,
        releaseDate: '2025-11-04',
        dateApplied: oneYearAgo,
        cedulaDate: oneYearAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2025-44910',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: true, hasBrgyClearance: true },
        isArchived: false
      },

      // 7. CANCELLED - Operator Voluntary Cancellation
      {
        operator: kyla._id,
        fullName: kyla.name,
        address: kyla.address || 'Barangay Matandang Gasan, Gasan, Marinduque',
        zone: 'Zone 3',
        made: '2023',
        make: 'Kawasaki Barako II',
        motorNo: 'MOT-CAN-12345',
        chassisNo: 'CHS-CAN-67890',
        plateNo: '0401-CAN01',
        todaName: 'MAT-TODA',
        status: 'Cancelled',
        applicationType: 'New',
        cancelReason: 'Voluntary surrender of franchise: Sold the tricycle unit to relocate outside the municipality.',
        eSigned: false,
        releaseDate: '',
        dateApplied: twoMonthsAgo,
        cedulaDate: twoMonthsAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2026-33819',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: true, hasBrgyClearance: true },
        isArchived: false
      },

      // 8. CANCELLED - Cancelled due to duplicate submission
      {
        operator: testdaw._id,
        fullName: testdaw.name,
        address: testdaw.address || 'Barangay Bacongbacong, Gasan, Marinduque',
        zone: 'Zone 2',
        made: '2022',
        make: 'Suzuki GD 110',
        motorNo: 'MOT-CAN-55412',
        chassisNo: 'CHS-CAN-99120',
        plateNo: '0401-CAN02',
        todaName: 'BAC-TODA',
        status: 'Cancelled',
        applicationType: 'New',
        cancelReason: 'Cancelled by operator: Duplicate application submitted in error.',
        eSigned: false,
        releaseDate: '',
        dateApplied: oneWeekAgo,
        cedulaDate: oneWeekAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2026-88192',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: false, hasBrgyClearance: true },
        isArchived: false
      },

      // 9. PENDING - Brand New Application Waiting for LGU Review
      {
        operator: testdaw._id,
        fullName: testdaw.name,
        address: testdaw.address || 'Barangay Pinggan, Gasan, Marinduque',
        zone: 'Zone 1',
        made: '2024',
        make: 'Honda TMX 125 Alpha',
        motorNo: 'MOT-PND-10021',
        chassisNo: 'CHS-PND-30042',
        plateNo: '0401-PND01',
        todaName: 'PIN-TODA',
        status: 'Pending',
        applicationType: 'New',
        cancelReason: '',
        eSigned: false,
        releaseDate: '',
        dateApplied: oneWeekAgo,
        cedulaDate: oneWeekAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2026-55190',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: true, hasBrgyClearance: true },
        isArchived: false
      },

      // 10. PENDING - Renewal Application Pending TODA Validation
      {
        operator: operatorA._id,
        fullName: operatorA.name,
        address: operatorA.address || 'Barangay Bangbang, Gasan, Marinduque',
        zone: 'Zone 3',
        made: '2023',
        make: 'Yamaha YTX 125',
        motorNo: 'MOT-PND-77192',
        chassisNo: 'CHS-PND-88129',
        plateNo: '0401-PND02',
        todaName: 'BAN-TODA',
        status: 'Pending',
        applicationType: 'Renew',
        cancelReason: '',
        eSigned: false,
        releaseDate: '',
        dateApplied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        cedulaDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2026-66291',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: false, hasBrgyClearance: true },
        isArchived: false
      },

      // 11. READY FOR PICKUP - Approved, waiting for cashier payment & claim stub voucher
      {
        operator: kyla._id,
        fullName: kyla.name,
        address: kyla.address || 'Barangay Matandang Gasan, Gasan, Marinduque',
        zone: 'Zone 3',
        made: '2024',
        make: 'Honda TMX 125 Alpha',
        motorNo: 'MOT-RDY-99124',
        chassisNo: 'CHS-RDY-11029',
        plateNo: '0401-RDY01',
        todaName: 'MAT-TODA',
        status: 'Ready for Pickup',
        applicationType: 'New',
        eSigned: true,
        releaseDate: '',
        dateApplied: twoMonthsAgo,
        cedulaDate: twoMonthsAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2026-77821',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: true, hasBrgyClearance: true },
        isArchived: false
      },

      // 12. READY FOR PICKUP - Sample for testing claim voucher printing
      {
        operator: christian._id,
        fullName: christian.name,
        address: christian.address || 'Barangay Poblacion, Gasan, Marinduque',
        zone: 'Zone 1',
        made: '2023',
        make: 'Suzuki GD 110',
        motorNo: 'MOT-RDY-44912',
        chassisNo: 'CHS-RDY-77192',
        plateNo: '0401-RDY02',
        todaName: 'POB-TODA',
        status: 'Ready for Pickup',
        applicationType: 'Renew',
        eSigned: true,
        releaseDate: '',
        dateApplied: oneMonthAgo,
        cedulaDate: oneMonthAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2026-11928',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: true, hasBrgyClearance: true },
        isArchived: false
      },

      // 13. ACTIVE - Pinggan TODA Unit
      {
        operator: operatorA._id,
        fullName: operatorA.name,
        address: operatorA.address || 'Barangay Pinggan, Gasan, Marinduque',
        zone: 'Zone 1',
        made: '2023',
        make: 'Bajaj RE',
        motorNo: 'MOT-ACT-77123',
        chassisNo: 'CHS-ACT-88910',
        plateNo: '0401-ACT01',
        todaName: 'PIN-TODA',
        status: 'Active',
        applicationType: 'New',
        eSigned: true,
        releaseDate: '2026-01-20',
        dateApplied: twoMonthsAgo,
        cedulaDate: twoMonthsAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2026-12901',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: true, hasBrgyClearance: true },
        isArchived: false
      },

      // 14. ARCHIVED FRANCHISE (For testing archived tab / history)
      {
        operator: albert._id,
        fullName: albert.name,
        address: albert.address || 'Barangay Bantad, Gasan, Marinduque',
        zone: 'Zone 2',
        made: '2019',
        make: 'Honda TMX 125',
        motorNo: 'MOT-ARC-11029',
        chassisNo: 'CHS-ARC-33910',
        plateNo: '0401-ARC01',
        todaName: 'BAP-TODA',
        status: 'Expired',
        applicationType: 'New',
        eSigned: true,
        releaseDate: '2022-04-10',
        dateApplied: twoYearsAgo,
        cedulaDate: twoYearsAgo,
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: 'CCI2022-00918',
        deficiencies: { hasOrcr: true, hasLicense: true, hasTodaEndorsement: true, hasBrgyClearance: true },
        isArchived: true,
        archivedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      }
    ];

    console.log(`Inserting ${testFranchises.length} test franchises into MongoDB...`);

    for (const f of testFranchises) {
      await Franchise.findOneAndUpdate(
        { plateNo: f.plateNo },
        { $set: f },
        { upsert: true, new: true }
      );
      console.log(`✓ Seeded [${f.status.padEnd(16)}] Plate: ${f.plateNo} - Operator: ${f.fullName} (${f.todaName})`);
    }

    console.log('\n=========================================');
    console.log('🎉 ALL TEST FRANCHISES SEEDED SUCCESSFULLY!');
    console.log('=========================================');
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
}

seed();
