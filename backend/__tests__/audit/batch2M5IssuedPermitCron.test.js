const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Franchise = require('../../src/models/franchiseModel');
const Notification = require('../../src/models/notificationModel');
const { getManilaNow } = require('../../src/utils/phTime');
const { sendPushToUser } = require('../../src/services/pushService');
const { syncFranchiseStatuses } = require('../../src/services/cronService');

jest.mock('../../src/utils/phTime', () => ({
    ...jest.requireActual('../../src/utils/phTime'),
    getManilaNow: jest.fn()
}));
jest.mock('../../src/services/pushService', () => ({ sendPushToUser: jest.fn() }));

const midnight = new Date('2026-09-01T16:00:00.000Z');
const endedTerm = new Date('2026-09-01T15:59:59.999Z');
const validTerm = new Date('2026-09-21T15:59:59.999Z');
let database;

async function insertPermit(fields) {
    const result = await Franchise.collection.insertOne({
        operator: new mongoose.Types.ObjectId(),
        plateNo: 'AUDIT-M5',
        ...fields
    });
    return result.insertedId;
}

beforeAll(async () => {
    database = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    await mongoose.connect(database.getUri());
}, 60000);

beforeEach(async () => {
    getManilaNow.mockReturnValue(midnight);
    sendPushToUser.mockResolvedValue(undefined);
    await Franchise.deleteMany({});
    await Notification.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    if (database) await database.stop();
});

describe('Batch 2 M5 issued permit cron invariants', () => {
    it.each([
        ['For Signing', true],
        ['Cancelled', false]
    ])('expires the issued permit while the renewal stays %s', async (status, isRenewalPending) => {
        const id = await insertPermit({
            status,
            applicationType: 'Renewal',
            isRenewalPending,
            previousStatus: 'Active - Under Warning',
            previousExpiryDate: endedTerm,
            expiryDate: validTerm
        });

        await expect(syncFranchiseStatuses()).resolves.toEqual({ count: 1 });
        await expect(Franchise.collection.findOne({ _id: id })).resolves.toMatchObject({
            status,
            expiryDate: validTerm,
            previousStatus: 'Expired',
            previousExpiryDate: endedTerm
        });

        await expect(syncFranchiseStatuses()).resolves.toEqual({ count: 0 });
        await expect(Notification.countDocuments({ relatedFranchise: id })).resolves.toBe(1);
        expect(sendPushToUser).toHaveBeenCalledTimes(1);
    });

    it('restores a completed suspension only while the issued term is valid', async () => {
        const suspendedRenewal = {
            status: 'For Payment',
            applicationType: 'Renewal',
            previousStatus: 'Suspended',
            currentSanction: 'Suspension',
            suspensionEndDate: endedTerm
        };
        const valid = await insertPermit({ ...suspendedRenewal, previousExpiryDate: validTerm });
        const expired = await insertPermit({ ...suspendedRenewal, previousExpiryDate: endedTerm });
        const stillSuspended = await insertPermit({
            ...suspendedRenewal,
            previousExpiryDate: endedTerm,
            suspensionEndDate: validTerm
        });

        await expect(syncFranchiseStatuses()).resolves.toEqual({ count: 1 });
        await expect(Franchise.collection.findOne({ _id: valid })).resolves.toMatchObject({
            status: 'For Payment',
            previousStatus: 'Active - Under Warning',
            currentSanction: 'Warning',
            suspensionEndDate: null
        });
        await expect(Franchise.collection.findOne({ _id: expired })).resolves.toMatchObject({
            status: 'For Payment',
            previousStatus: 'Expired',
            currentSanction: 'Warning',
            suspensionEndDate: null
        });
        await expect(Franchise.collection.findOne({ _id: stillSuspended })).resolves.toMatchObject({
            status: 'For Payment',
            previousStatus: 'Suspended',
            suspensionEndDate: validTerm
        });
    });

    it('preserves a corrected expiry entered after candidate selection', async () => {
        const id = await insertPermit({ status: 'Active', expiryDate: endedTerm });
        const updateOne = Franchise.collection.updateOne.bind(Franchise.collection);
        jest.spyOn(Franchise.collection, 'updateOne').mockImplementationOnce(async (...args) => {
            await updateOne({ _id: id }, { $set: { expiryDate: validTerm } });
            return updateOne(...args);
        });

        await expect(syncFranchiseStatuses()).resolves.toEqual({ count: 0 });
        await expect(Franchise.collection.findOne({ _id: id })).resolves.toMatchObject({
            status: 'Active',
            expiryDate: validTerm
        });
        await expect(Notification.countDocuments({ relatedFranchise: id })).resolves.toBe(0);
        expect(sendPushToUser).not.toHaveBeenCalled();
    });

    it('preserves the expired status and retries a failed alert write once', async () => {
        const id = await insertPermit({ status: 'Active', expiryDate: endedTerm });
        jest.spyOn(Notification, 'create').mockRejectedValueOnce(new Error('Alert store unavailable'));

        await expect(syncFranchiseStatuses()).resolves.toEqual({ count: 1 });
        const expired = await Franchise.collection.findOne({ _id: id });
        expect(expired).toMatchObject({ status: 'Expired', expiryDate: endedTerm });
        expect(expired.pendingExpiryNotifications).toHaveLength(1);
        await expect(Notification.countDocuments({ relatedFranchise: id })).resolves.toBe(0);
        expect(sendPushToUser).not.toHaveBeenCalled();

        await expect(syncFranchiseStatuses()).resolves.toEqual({ count: 0 });
        await expect(Franchise.collection.findOne({ _id: id })).resolves.toMatchObject({
            status: 'Expired',
            pendingExpiryNotifications: []
        });
        await expect(Notification.findById(expired.pendingExpiryNotifications[0]._id).lean()).resolves.toMatchObject({
            recipient: expired.operator,
            relatedFranchise: id,
            title: 'Franchise Permit Expired'
        });

        await expect(syncFranchiseStatuses()).resolves.toEqual({ count: 0 });
        await expect(Notification.countDocuments({ relatedFranchise: id })).resolves.toBe(1);
        expect(sendPushToUser).toHaveBeenCalledTimes(1);
    });

    it('clears the pending alert after a persisted insert is retried without a second notification', async () => {
        const id = await insertPermit({ status: 'Active', expiryDate: endedTerm });
        const create = Notification.create.bind(Notification);
        jest.spyOn(Notification, 'create').mockImplementationOnce(async (...args) => {
            await create(...args);
            throw new Error('Alert write acknowledgment unavailable');
        });

        await expect(syncFranchiseStatuses()).resolves.toEqual({ count: 1 });
        await expect(Notification.countDocuments({ relatedFranchise: id })).resolves.toBe(1);
        await expect(syncFranchiseStatuses()).resolves.toEqual({ count: 0 });
        await expect(Notification.countDocuments({ relatedFranchise: id })).resolves.toBe(1);
        await expect(Franchise.collection.findOne({ _id: id })).resolves.toMatchObject({
            status: 'Expired',
            pendingExpiryNotifications: []
        });
    });
});
