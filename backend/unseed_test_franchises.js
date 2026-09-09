const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

const seededPlates = [
  '0401-CS01', '0401-CS02', '0401-EXP01', '0401-EXP02',
  '0401-RVK01', '0401-RVK02', '0401-CAN01', '0401-CAN02',
  '0401-PND01', '0401-PND02', '0401-RDY01', '0401-RDY02',
  '0401-ACT01', '0401-ARC01'
];

async function unseed() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected successfully!');

    const col = mongoose.connection.db.collection('franchises');
    
    // Delete all seeded test records
    const deleteResult = await col.deleteMany({ plateNo: { $in: seededPlates } });
    console.log(`Successfully deleted ${deleteResult.deletedCount} seeded test franchises.`);

    const remaining = await col.countDocuments({});
    console.log(`Remaining franchises in database: ${remaining}`);

    const remainingList = await col.find({}, { projection: { plateNo: 1, fullName: 1, status: 1 } }).toArray();
    console.log('\nRemaining Real Franchises:');
    remainingList.forEach((f, i) => {
      console.log(`  ${i + 1}. Plate: ${f.plateNo.padEnd(12)} | Status: ${f.status.padEnd(16)} | Operator: ${f.fullName}`);
    });

    console.log('\nUnseed complete! Database returned to original state.');
    process.exit(0);
  } catch (err) {
    console.error('Unseed Error:', err.message);
    process.exit(1);
  }
}

unseed();
