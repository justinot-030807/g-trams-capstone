const axios = require('axios');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const { ChatMessage, ChatThread } = require('../../src/models/chatModel');
const Notification = require('../../src/models/notificationModel');
const SystemSettings = require('../../src/models/systemSettingsModel');
const User = require('../../src/models/userModel');
const sendSms = require('../../src/utils/sendSms');

const app = express();
app.use(express.json());
app.use('/chat', require('../../src/routes/chatRoutes'));
app.use('/notifications', require('../../src/routes/notificationRoutes'));
app.use('/settings', require('../../src/routes/systemSettingsRoutes'));

function createUser(name, role) {
  return User.create({ name, role, contact: `${name.toLowerCase()}@example.test`, address: 'Gasan', password: 'FixturePass123!' });
}

function authorization(user) {
  const payload = { id: user._id, tokenType: 'access', tokenVersion: user.tokenVersion };
  return `Bearer ${jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })}`;
}

describe('Batch 1 chat and settings invariants', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    await mongoose.connect(mongoServer.getUri());
  }, 60000);

  beforeEach(async () => {
    await Promise.all([
      ChatMessage.deleteMany({}), ChatThread.deleteMany({}), Notification.deleteMany({}),
      SystemSettings.deleteMany({}), User.deleteMany({})
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
  });

  it('keeps inbound counts and read receipts aligned with the send-time roles', async () => {
    const reviewer = await createUser('Reviewer', 'system_admin');
    const promotedOperator = await createUser('Promoted', 'bplo_staff');
    const formerStaff = await createUser('Transferred', 'operator');
    const thread = await ChatThread.create({ owner: promotedOperator._id, participants: [promotedOperator._id, formerStaff._id] });
    const [question, staffReply] = await ChatMessage.create([
      { thread: thread._id, sender: promotedOperator._id, senderRole: 'operator', message: 'When does the office open?' },
      { thread: thread._id, sender: formerStaff._id, senderRole: 'bplo_staff', message: 'The office opens at 8 a.m.' }
    ]);
    const token = authorization(reviewer);

    const inbox = await request(app).get('/chat/unread-count').set('Authorization', token).expect(200);
    expect(inbox.body.unreadCount).toBe(1);
    const threads = await request(app).get('/chat/threads').set('Authorization', token).expect(200);
    expect(threads.body).toEqual([expect.objectContaining({ _id: String(thread._id), unreadCount: 1 })]);

    await request(app).put(`/chat/messages/${thread._id}/read`).set('Authorization', token).expect(200);
    const [readQuestion, savedReply] = await Promise.all([
      ChatMessage.findById(question._id).lean(), ChatMessage.findById(staffReply._id).lean()
    ]);
    expect(readQuestion.isRead).toBe(true);
    expect(readQuestion.readBy.map(String)).toContain(String(reviewer._id));
    expect(savedReply.isRead).toBe(false);
  });

  it('links a legacy support notice to its unique thread while keeping other notices unread', async () => {
    const operator = await createUser('Operator', 'operator');
    const [thread, announcement] = await ChatThread.create([{ owner: operator._id }, { isAnnouncement: true }]);
    const supportNotice = {
      recipient: operator._id, type: 'chat', isRead: false,
      title: 'GTRAMS Support', message: 'New message from GTRAMS Support', createdAt: thread.createdAt
    };
    const { insertedId } = await Notification.collection.insertOne(supportNotice);
    const advisory = await Notification.create({
      recipient: operator._id, type: 'chat', threadId: announcement._id,
      title: 'System Announcement', message: 'Admin broadcasted an announcement'
    });
    const token = authorization(operator);

    await request(app).put(`/chat/messages/${thread._id}/read`).set('Authorization', token).expect(200);
    const linkedNotice = await Notification.findById(insertedId).lean();
    expect(linkedNotice).toMatchObject({ threadId: thread._id, isRead: true });
    expect(await Notification.findById(advisory._id).lean()).toMatchObject({ threadId: announcement._id, isRead: false });

    await ChatThread.create({ owner: operator._id });
    const ambiguousNotice = await Notification.create({ ...supportNotice, _id: new mongoose.Types.ObjectId() });
    await request(app).put(`/chat/messages/${thread._id}/read`).set('Authorization', token).expect(200);
    expect(await Notification.findById(ambiguousNotice._id).lean()).toMatchObject({ threadId: null, isRead: false });
    const unread = await request(app).get('/notifications/unread-count').set('Authorization', token).expect(200);
    expect(unread.body.count).toBe(2);
  });

  it('preserves a saved announcement ID, assigns a draft ID, and persists an explicit empty list', async () => {
    const admin = await createUser('SettingsAdmin', 'system_admin');
    const token = authorization(admin);
    const existing = await SystemSettings.create({ announcementsConfigured: true });
    const [announcement] = existing.announcements;
    const saved = await request(app).put('/settings').set('Authorization', token).send({
      announcements: [
        { _id: String(announcement._id).toUpperCase(), title: announcement.title, desc: announcement.desc },
        { _id: 'draft-office-schedule', title: ' Office schedule ', desc: 'Office opens at 8 a.m.', isActive: false }
      ]
    }).expect(200);

    const [retained, added] = saved.body.data.announcements;
    expect(retained._id).toBe(String(announcement._id));
    expect(added).toMatchObject({ title: 'Office schedule', isActive: false, type: 'info' });
    expect(mongoose.isObjectIdOrHexString(added._id)).toBe(true);
    expect(added._id).not.toBe(retained._id);

    await request(app).put('/settings').set('Authorization', token).send({ announcements: [] }).expect(200);
    const current = await request(app).get('/settings').expect(200);
    expect(current.body.data).toMatchObject({ announcementsConfigured: true, announcements: [] });
  });
});

describe('Batch 1 SMS acceptance invariants', () => {
  const input = { phone: '09171234567', message: 'The licensing office opens at 8 a.m.' };

  beforeEach(() => {
    jest.replaceProperty(process, 'env', {
      ...process.env, NODE_ENV: 'development', TEXTBEE_API_KEY: 'fixture-key',
      TEXTBEE_DEVICE_ID: '66b1f2c3a4d5e6f7a8b9c0d1', SEMAPHORE_API_KEY: ''
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it.each([
    { success: true, smsBatchId: '66b1f2c3a4d5e6f7a8b9c0d2', recipientCount: 1 },
    { successCount: 1, failureCount: 0 }
  ])('reports the documented TextBee acknowledgement as accepted (%j)', async (data) => {
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ status: 200, data: { data } });
    await expect(sendSms(input)).resolves.toMatchObject({ success: true, provider: 'textbee', deliveryStatus: 'accepted' });
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('https://api.textbee.dev/api/v1/gateway/send-sms', {
      recipients: ['+639171234567'], message: input.message, deviceId: process.env.TEXTBEE_DEVICE_ID
    }, expect.objectContaining({ headers: expect.objectContaining({ 'x-api-key': 'fixture-key' }) }));
  });

  it('requires an acknowledgement before reporting acceptance and avoids a duplicate dispatch', async () => {
    process.env.SEMAPHORE_API_KEY = 'fallback-fixture-key';
    const post = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 204 });
    await expect(sendSms(input)).resolves.toMatchObject({ success: false });
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('reports an acknowledged Semaphore fallback as accepted after a TextBee rate-limit response', async () => {
    process.env.SEMAPHORE_API_KEY = 'fallback-fixture-key';
    const post = jest.spyOn(axios, 'post')
      .mockRejectedValueOnce({ response: { status: 429, data: { message: 'Daily limit reached' } } })
      .mockResolvedValueOnce({ status: 200, data: [{ message_id: 12345, status: 'Queued' }] });
    await expect(sendSms(input)).resolves.toMatchObject({ success: true, provider: 'semaphore', deliveryStatus: 'accepted' });
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1][0]).toBe('https://api.semaphore.co/api/v4/messages');
  });
});
