const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const User = require('../src/models/userModel');
const Franchise = require('../src/models/franchiseModel');
const TodaSubmission = require('../src/models/todaSubmission');

async function run() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    console.log('Connected to MongoDB Atlas successfully.');

    // 1. Fetch all users
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} total users in DB.`);

    // Test accounts to KEEP:
    const KEEP_EMAILS = new Set([
      'admin.tester@gtrams.com',
      'cashier.tester@gtrams.com',
      'todapres.tester@gtrams.com',
      'operator.tester@gtrams.com'
    ]);

    const usersToDelete = [];
    for (const u of allUsers) {
      const role = String(u.role || '').toLowerCase();
      const email = String(u.email || '').toLowerCase().trim();

      // Always keep admin/administrator accounts
      if (role === 'admin' || role === 'administrator') {
        console.log(`KEEPING ADMIN: ${u.name} (${u.email}) [Role: ${u.role}]`);
        continue;
      }

      // Keep designated official test accounts
      if (KEEP_EMAILS.has(email)) {
        console.log(`KEEPING TEST ACCOUNT: ${u.name} (${u.email}) [Role: ${u.role}]`);
        continue;
      }

      // Delete everything else (including Ian test account and user created accounts)
      usersToDelete.push(u);
    }

    console.log(`\nDeleting ${usersToDelete.length} user accounts...`);
    for (const u of usersToDelete) {
      console.log(` -> Deleting User: ${u.name} (${u.email || u.contact}) [Role: ${u.role}]`);
      await User.findByIdAndDelete(u._id);
      // Also delete any franchises attached to this deleted user
      const deletedFranchises = await Franchise.deleteMany({ operator: u._id });
      console.log(`    Deleted ${deletedFranchises.deletedCount} franchises for ${u.name}`);
    }

    // 2. Set up / Seed the 2 Operator Accounts: TAMA and MALI
    // Account 1 (TAMA): Juan Dela Cruz
    let opTama = await User.findOne({ email: 'operator.tester@gtrams.com' });
    if (!opTama) {
      opTama = new User({ email: 'operator.tester@gtrams.com' });
    }
    opTama.name = 'Juan Dela Cruz';
    opTama.contact = '09222222222';
    opTama.password = 'Password123!';
    opTama.role = 'operator';
    opTama.address = 'Barangay I (Poblacion)';
    opTama.todaAssociation = 'POB TODA';
    opTama.bodyNumber = '01';
    opTama.isVerified = true;
    opTama.isActive = true;
    opTama.authProvider = 'local';
    await opTama.save();
    console.log(`\n[SETUP TAMA] ${opTama.name} (${opTama.email}) saved with Body No. 01. Password: Password123!`);

    // Clean any existing franchises for Juan Dela Cruz so he has a fresh slate for demo!
    await Franchise.deleteMany({ operator: opTama._id });
    console.log(`Cleaned existing franchises for ${opTama.name} (Ready for fresh demo application).`);

    // Account 2 (MALI): Mario Santos
    let opMali = await User.findOne({ email: 'operator.mali@gtrams.com' });
    if (!opMali) {
      opMali = new User({ email: 'operator.mali@gtrams.com' });
    }
    opMali.name = 'Mario Santos';
    opMali.contact = '09888888888';
    opMali.password = 'Password123!';
    opMali.role = 'operator';
    opMali.address = 'Antipolo';
    opMali.todaAssociation = 'NON-TODA';
    opMali.isVerified = true;
    opMali.isActive = true;
    opMali.authProvider = 'local';
    await opMali.save();
    console.log(`[SETUP MALI] ${opMali.name} (${opMali.email}) saved. Password: Password123!`);

    // Clean any existing franchises for Mario Santos
    await Franchise.deleteMany({ operator: opMali._id });
    console.log(`Cleaned existing franchises for ${opMali.name} (Ready for error-testing demo).`);

    // 3. Ensure Admin, Cashier, and TODA President are in place
    // Admin
    let admin = await User.findOne({ email: 'admin.tester@gtrams.com' });
    if (admin) {
      admin.name = 'Tester Admin (OVM Gasan)';
      admin.password = 'Password123!';
      admin.role = 'admin';
      admin.isVerified = true;
      admin.isActive = true;
      await admin.save();
    }

    // Cashier
    let cashier = await User.findOne({ email: 'cashier.tester@gtrams.com' });
    if (cashier) {
      cashier.name = 'Tester Cashier (Maria Clara)';
      cashier.password = 'Password123!';
      cashier.role = 'cashier';
      cashier.isVerified = true;
      cashier.isActive = true;
      await cashier.save();
    }

    // TODA President
    let todaPres = await User.findOne({ email: 'todapres.tester@gtrams.com' });
    if (todaPres) {
      todaPres.name = 'Tester TODA President (Pedro Santos)';
      todaPres.password = 'Password123!';
      todaPres.role = 'toda president';
      todaPres.todaAssociation = 'POB TODA';
      todaPres.isVerified = true;
      todaPres.isActive = true;
      await todaPres.save();
    }

    // 4. Ensure an Approved TodaSubmission exists for POB TODA with Juan Dela Cruz
    let pobRoster = await TodaSubmission.findOne({ todaAssociation: 'POB TODA', status: 'Approved' });
    if (!pobRoster) {
      pobRoster = new TodaSubmission({
        submittedBy: todaPres._id,
        presidentName: 'Pedro Santos',
        fileName: 'POB_TODA_Masterlist_2026.png',
        filePath: 'sample_docs/08_toda_roster.png',
        status: 'Approved',
        todaAssociation: 'POB TODA',
        extractedCount: 5,
        extractedMembers: [
          { name: 'JUAN DELA CRUZ', operatorName: 'JUAN DELA CRUZ', bodyNumber: '01', unitNo: '01', plateNo: '4528-TC', confidence: 0.98 },
          { name: 'PEDRO SANTOS', operatorName: 'PEDRO SANTOS', bodyNumber: '02', unitNo: '02', plateNo: '5678-CD', confidence: 0.98 },
          { name: 'ROBERTO REYES', operatorName: 'ROBERTO REYES', bodyNumber: '03', unitNo: '03', plateNo: '9012-EF', confidence: 0.95 },
          { name: 'EDGARDO RAMOS', operatorName: 'EDGARDO RAMOS', bodyNumber: '04', unitNo: '04', plateNo: '7890-IJ', confidence: 0.95 },
          { name: 'MARIO BAUTISTA', operatorName: 'MARIO BAUTISTA', bodyNumber: '05', unitNo: '05', plateNo: '3456-GH', confidence: 0.95 }
        ],
        ocrNotes: 'Verified Official TODA Roster'
      });
      await pobRoster.save();
      console.log('Seeded Approved TodaSubmission for POB TODA (Juan Dela Cruz is verified member).');
    } else {
      // Ensure Juan Dela Cruz is in the members list with bodyNumber
      pobRoster.extractedMembers = [
        { name: 'JUAN DELA CRUZ', operatorName: 'JUAN DELA CRUZ', bodyNumber: '01', unitNo: '01', plateNo: '4528-TC', confidence: 0.98 },
        { name: 'PEDRO SANTOS', operatorName: 'PEDRO SANTOS', bodyNumber: '02', unitNo: '02', plateNo: '5678-CD', confidence: 0.98 },
        { name: 'ROBERTO REYES', operatorName: 'ROBERTO REYES', bodyNumber: '03', unitNo: '03', plateNo: '9012-EF', confidence: 0.95 },
        { name: 'EDGARDO RAMOS', operatorName: 'EDGARDO RAMOS', bodyNumber: '04', unitNo: '04', plateNo: '7890-IJ', confidence: 0.95 },
        { name: 'MARIO BAUTISTA', operatorName: 'MARIO BAUTISTA', bodyNumber: '05', unitNo: '05', plateNo: '3456-GH', confidence: 0.95 }
      ];
      await pobRoster.save();
      console.log('Updated POB TODA roster with operatorName and bodyNumber.');
    }

    // Also sync into TodaRoster collection for fast indexing
    const TodaRoster = require('../src/models/todaModel');
    for (const m of pobRoster.extractedMembers) {
      await TodaRoster.findOneAndUpdate(
        { todaAssociation: 'POB TODA', bodyNumber: m.bodyNumber },
        {
          todaAssociation: 'POB TODA',
          operatorName: m.operatorName || m.name,
          bodyNumber: m.bodyNumber,
          plateNo: m.plateNo || '',
          status: 'Active',
          submissionRef: pobRoster._id
        },
        { upsert: true, new: true }
      );
    }
    console.log('Synchronized POB TODA masterlist to TodaRoster collection.');

    console.log('\n================ CLEANUP & SETUP COMPLETE ================');
    const finalUsers = await User.find({}, 'name email contact role todaAssociation isVerified');
    console.table(finalUsers.map(u => ({ id: u._id.toString(), name: u.name, email: u.email, contact: u.contact, role: u.role, toda: u.todaAssociation })));

    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup and setup:', err);
    process.exit(1);
  }
}

run();
