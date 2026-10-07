const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const User = require('../src/models/userModel');

const accountsToSeed = [
  {
    name: 'Tester Admin (OVM Gasan)',
    contact: '09111111111',
    email: 'admin.tester@gtrams.com',
    password: 'Password123!',
    role: 'admin',
    address: 'Municipal Hall, Maharlika, Gasan, Marinduque',
    todaAssociation: 'NON-TODA'
  },
  {
    name: 'Tester Operator (Juan Dela Cruz)',
    contact: '09222222222',
    email: 'operator.tester@gtrams.com',
    password: 'Password123!',
    role: 'operator',
    address: 'Barangay Bahi, Gasan, Marinduque',
    todaAssociation: 'GASAN CENTRAL TODA'
  },
  {
    name: 'Tester TODA President (Pedro Santos)',
    contact: '09333333333',
    email: 'todapres.tester@gtrams.com',
    password: 'Password123!',
    role: 'toda president',
    address: 'Barangay Libtangin, Gasan, Marinduque',
    todaAssociation: 'GASAN CENTRAL TODA'
  },
  {
    name: 'Tester Cashier (Maria Clara)',
    contact: '09444444444',
    email: 'cashier.tester@gtrams.com',
    password: 'Password123!',
    role: 'cashier',
    address: 'Treasury Office, Municipal Hall, Gasan, Marinduque',
    todaAssociation: 'NON-TODA'
  }
];

async function seedTesterAccounts() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    console.log('Successfully connected to MongoDB Atlas!');

    const results = [];

    for (const acc of accountsToSeed) {
      let user = await User.findOne({
        $or: [
          { contact: acc.contact },
          { email: acc.email }
        ]
      });

      if (user) {
        console.log(`Updating existing tester user: ${acc.email} (${acc.role})`);
        user.name = acc.name;
        user.contact = acc.contact;
        user.email = acc.email;
        user.role = acc.role;
        user.address = acc.address;
        user.todaAssociation = acc.todaAssociation;
        user.isVerified = true;
        user.isActive = true;
        user.authProvider = 'local';
        user.password = acc.password; // Triggers pre('save') bcrypt hashing
        await user.save();
      } else {
        console.log(`Creating new tester user: ${acc.email} (${acc.role})`);
        user = new User({
          name: acc.name,
          contact: acc.contact,
          email: acc.email,
          password: acc.password,
          role: acc.role,
          address: acc.address,
          todaAssociation: acc.todaAssociation,
          isVerified: true,
          isActive: true,
          authProvider: 'local'
        });
        await user.save();
      }

      // Verify password matches
      const isMatch = await user.matchPassword(acc.password);
      console.log(`  -> Saved ID: ${user._id}, Role: "${user.role}", Password Verified: ${isMatch}`);

      results.push({
        id: user._id,
        role: user.role,
        name: user.name,
        contact: user.contact,
        email: user.email,
        password: acc.password,
        passwordVerified: isMatch
      });
    }

    console.log('\n================ SEEDING COMPLETE ================\n');
    console.table(results.map(r => ({
      Role: r.role,
      Name: r.name,
      Email: r.email,
      Contact: r.contact,
      Password: r.password,
      Verified: r.passwordVerified
    })));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedTesterAccounts();
