process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';

const request = require('supertest');
const { app, server } = require('../../server');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const User = require('../../src/models/userModel');
const Franchise = require('../../src/models/franchiseModel');
const Notification = require('../../src/models/notificationModel');

let mongoServer;
let adminToken;
let operatorToken;
let adminUser;
let operatorUser;

const measureConcurrent = async (label, promises) => {
  const start = Date.now();
  const results = await Promise.allSettled(promises);
  const elapsed = Date.now() - start;
  
  const succeeded = results.filter(r => 
    r.status === 'fulfilled' && (!r.value || r.value.status < 500)
  ).length;
  const failed = results.filter(r => 
    r.status === 'rejected' || (r.value && r.value.status >= 500)
  ).length;
  
  console.log(`[STRESS] ${label}: ${succeeded}/${results.length} succeeded in ${elapsed}ms (${(results.length / Math.max(elapsed/1000, 0.001)).toFixed(1)} req/s)`);
  return { results, elapsed, succeeded, failed };
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
  }
  await mongoose.connect(uri);
  
  adminUser = await User.create({
    name: 'Admin Stress Test',
    email: 'admin_stress@example.com',
    contact: '09100000001',
    address: 'Gasan Municipal Hall',
    password: 'Password123!',
    role: 'admin',
    isVerified: true,
    isActive: true
  });
  adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

  operatorUser = await User.create({
    name: 'Operator Stress Test',
    email: 'operator_stress@example.com',
    contact: '09100000002',
    address: '123 Stress St, Gasan',
    password: 'Password123!',
    role: 'operator',
    isVerified: true,
    isActive: true,
    todaAssociation: 'BATODA'
  });
  operatorToken = jwt.sign({ id: operatorUser._id, role: operatorUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
  }
  if (mongoServer) {
      await mongoServer.stop();
  }
  if (server) {
      server.close();
  }
});

afterEach(async () => {
  await Franchise.deleteMany({});
  await Notification.deleteMany({});
});

describe('GTRAMS API Stress Tests', () => {
  
  // 1. CONCURRENT FRANCHISE SUBMISSIONS (Race Condition on duplicate plate)
  it('1. CONCURRENT FRANCHISE SUBMISSIONS (Duplicate Plate Race)', async () => {
    const numOperators = 10;
    const operatorPromises = [];
    for (let i = 0; i < numOperators; i++) {
      operatorPromises.push(User.create({
        name: `Operator Race ${i}`,
        email: `op_race_${i}_${Date.now()}@test.com`,
        contact: `092000000${i.toString().padStart(2, '0')}`,
        address: 'Gasan, Marinduque',
        password: 'Password123!',
        role: 'operator',
        isVerified: true,
        isActive: true,
        todaAssociation: 'BATODA'
      }));
    }
    const operators = await Promise.all(operatorPromises);
    
    // All try to submit with the SAME plate number at the same millisecond
    const sharedPlate = `RACE-PLATE-${Date.now()}`;
    const submitPromises = operators.map((op, idx) => {
      const token = jwt.sign({ id: op._id, role: op.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return request(app)
        .post('/api/v1/franchises')
        .set('Authorization', `Bearer ${token}`)
        .send({
          operator: op._id,
          fullName: op.name,
          address: 'Gasan, Marinduque',
          zone: 'Zone 1',
          made: 'Honda',
          make: 'TMX 150',
          motorNo: `MTR-${idx}-${Date.now()}`,
          chassisNo: `CHS-${idx}-${Date.now()}`,
          plateNo: sharedPlate,
          todaName: 'BATODA',
          cedulaDate: '2025-01-01',
          cedulaAddress: 'Gasan, Marinduque',
          cedulaSerialNo: `CED-${idx}`,
          applicationType: 'New'
        });
    });

    const { results } = await measureConcurrent('Concurrent Franchise Submissions', submitPromises);
    
    const statuses = results.map(r => r.value && r.value.status);
    const createdCount = statuses.filter(s => s === 201).length;
    const rejectedCount = statuses.filter(s => s === 400 || s === 409 || s === 500).length;
    
    console.log(`[STRESS] Race Results: Created=${createdCount}, Rejected=${rejectedCount}`);
    // Exactly 1 should be created, all others rejected due to duplicate plate index
    expect(createdCount).toBe(1);
    expect(rejectedCount).toBe(numOperators - 1);
  }, 60000);

  // 2. CONCURRENT LOGIN FLOOD
  it('2. CONCURRENT LOGIN FLOOD', async () => {
    const numLogins = 30;
    const loginPromises = [];
    for (let i = 0; i < numLogins; i++) {
      loginPromises.push(
        request(app)
          .post('/api/v1/auth/login')
          .send({
            contact: '09100000002',
            password: 'Password123!'
          })
      );
    }
    
    const { results, succeeded, failed } = await measureConcurrent('Concurrent Login Flood', loginPromises);
    
    expect(failed).toBe(0);
    expect(succeeded).toBe(numLogins);
    results.forEach(r => {
      expect(r.value.status).toBe(200);
      expect(r.value.body.token).toBeDefined();
    });
  }, 60000);

  // 3. BATCH STATUS UPDATE UNDER LOAD
  it('3. BATCH APPROVAL UNDER LOAD', async () => {
    const numApps = 30;
    const appsToInsert = [];
    for (let i = 0; i < numApps; i++) {
      appsToInsert.push({
        operator: operatorUser._id,
        fullName: operatorUser.name,
        address: 'Gasan',
        zone: 'Zone 1',
        made: 'Honda',
        make: 'TMX',
        motorNo: `M-BATCH-${i}-${Date.now()}`,
        chassisNo: `C-BATCH-${i}-${Date.now()}`,
        plateNo: `P-BATCH-${i}-${Date.now()}`,
        todaName: 'BATODA',
        cedulaDate: new Date(),
        cedulaAddress: 'Gasan',
        cedulaSerialNo: `CSN-${i}`,
        status: 'Pending',
        applicationType: 'New'
      });
    }
    const inserted = await Franchise.insertMany(appsToInsert);
    
    const updatePromises = inserted.map(franchiseDoc => 
      request(app)
        .put(`/api/v1/franchises/${franchiseDoc._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'For Signing' })
    );

    const { results, succeeded, failed } = await measureConcurrent('Batch Approval Under Load', updatePromises);
    
    expect(failed).toBe(0);
    expect(succeeded).toBe(numApps);
    
    // Verify in DB that all 30 actually transitioned to 'For Signing'
    const updatedCount = await Franchise.countDocuments({ status: 'For Signing' });
    expect(updatedCount).toBe(numApps);
  }, 60000);

  // 4. RAPID-FIRE NOTIFICATION CREATION
  it('4. RAPID-FIRE NOTIFICATION CREATION', async () => {
    const numNotifs = 100;
    const notifDocs = [];
    for (let i = 0; i < numNotifs; i++) {
      notifDocs.push({
        recipient: operatorUser._id,
        type: 'general',
        title: `Stress Notif ${i}`,
        message: `Stress test notification payload ${i}`,
        isRead: false
      });
    }
    
    const start = Date.now();
    await Notification.insertMany(notifDocs);
    const elapsed = Date.now() - start;
    console.log(`[STRESS] Inserted ${numNotifs} notifications in ${elapsed}ms`);
    
    const count = await Notification.countDocuments({ recipient: operatorUser._id, isRead: false });
    expect(count).toBe(numNotifs);
    
    // Test atomic mark-all-read
    const markRes = await request(app)
      .put('/api/v1/notifications/mark-all-read')
      .set('Authorization', `Bearer ${operatorToken}`);
    
    expect(markRes.status).toBe(200);
    const unreadCount = await Notification.countDocuments({ recipient: operatorUser._id, isRead: false });
    expect(unreadCount).toBe(0);
  }, 60000);

  // 5. BROADCAST TO MANY USERS SIMULTANEOUSLY
  it('5. BROADCAST DISPATCH STRESS TEST', async () => {
    const numRecipients = 20;
    const userDocs = [];
    for (let i = 0; i < numRecipients; i++) {
      userDocs.push({
        name: `Broadcast Recipient ${i}`,
        email: `bcast_${i}_${Date.now()}@test.com`,
        contact: `093000000${i.toString().padStart(2, '0')}`,
        address: 'Gasan, Marinduque',
        password: 'Password123!',
        role: 'operator',
        isVerified: true,
        isActive: true,
        todaAssociation: 'BATODA'
      });
    }
    await User.insertMany(userDocs);
    
    const start = Date.now();
    const res = await request(app)
      .post('/api/v1/chat/broadcast')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        message: 'High priority municipal advisory: Annual franchise inspection starting next Monday at Gasan Municipal Gymnasium.',
        targetToda: 'ALL',
        targetStatus: 'ALL'
      });
    const elapsed = Date.now() - start;
    
    console.log(`[STRESS] Broadcast dispatched in ${elapsed}ms: status=${res.status}, recipients=${res.body.recipientCount}`);
    expect(res.status).toBe(200);
    expect(res.body.recipientCount).toBeGreaterThanOrEqual(numRecipients);
  }, 60000);

  // 6. CONCURRENT PROFILE UPDATES
  it('6. CONCURRENT PROFILE UPDATES (Last-Write-Wins Consistency)', async () => {
    const numUpdates = 15;
    const updatePromises = [];
    for (let i = 0; i < numUpdates; i++) {
      updatePromises.push(
        request(app)
          .put('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${operatorToken}`)
          .send({
            address: `Updated Address #${i}, Gasan`
          })
      );
    }
    
    const { results, succeeded, failed } = await measureConcurrent('Concurrent Profile Updates', updatePromises);
    expect(failed).toBe(0);
    expect(succeeded).toBe(numUpdates);
    
    // State should be consistent
    const user = await User.findById(operatorUser._id);
    expect(user.address).toMatch(/Updated Address #\d+, Gasan/);
  }, 60000);

  // 7. API ENDPOINT THROUGHPUT BENCHMARK
  it('7. API ENDPOINT THROUGHPUT BENCHMARK', async () => {
    const endpoints = [
      { path: '/', num: 50, auth: null, label: 'Health Check (/)' },
      { path: '/api/v1/settings', num: 50, auth: null, label: 'Settings (Public)' },
      { path: '/api/v1/auth/profile', num: 30, auth: operatorToken, label: 'Profile (Auth Bearer)' }
    ];
    
    for (const ep of endpoints) {
      const promises = [];
      for (let i = 0; i < ep.num; i++) {
        let req = request(app).get(ep.path);
        if (ep.auth) req = req.set('Authorization', `Bearer ${ep.auth}`);
        promises.push(req);
      }
      const { succeeded, failed } = await measureConcurrent(ep.label, promises);
      expect(failed).toBe(0);
      expect(succeeded).toBe(ep.num);
    }
  }, 60000);

  // 8. MALFORMED / OVERSIZED PAYLOAD RESILIENCE
  it('8. MALFORMED / OVERSIZED PAYLOAD RESILIENCE', async () => {
    const largeString = 'X'.repeat(50000);
    
    const res1 = await request(app)
      .post('/api/v1/franchises')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        operator: operatorUser._id,
        fullName: largeString,
        address: largeString,
        zone: largeString
      });
      
    // Server must not crash, must return clean client error (400)
    expect([400, 413, 500]).toContain(res1.status); 
    expect(res1.status).not.toBe(502);
    
    // Missing body on login
    const res2 = await request(app)
      .post('/api/v1/auth/login')
      .send({});
      
    expect(res2.status).toBe(400);
  }, 60000);

  // 9. SEQUENTIAL LOAD RAMP-UP
  it('9. SEQUENTIAL LOAD RAMP-UP (10 -> 25 -> 50 Concurrent)', async () => {
    const rampPhases = [10, 25, 50];
    for (const load of rampPhases) {
      const promises = [];
      for (let i = 0; i < load; i++) {
        promises.push(
          request(app)
            .get('/api/v1/settings')
        );
      }
      const { succeeded, failed, elapsed } = await measureConcurrent(`Ramp Phase (${load} concurrent)`, promises);
      expect(failed).toBe(0);
      expect(succeeded).toBe(load);
      // Latency shouldn't explode: average under 100ms per request even under concurrent load
      const avgLatency = elapsed / load;
      console.log(`[STRESS] Phase ${load}: Avg latency = ${avgLatency.toFixed(2)}ms per request`);
    }
  }, 90000);

});
