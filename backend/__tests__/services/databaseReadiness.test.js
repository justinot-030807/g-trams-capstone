describe('database index readiness', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousMongoUri = process.env.MONGO_URI;

    afterEach(() => {
        process.env.NODE_ENV = previousNodeEnv;
        if (previousMongoUri === undefined) delete process.env.MONGO_URI;
        else process.env.MONGO_URI = previousMongoUri;
        jest.resetModules();
    });

    it.each([true, false])('retains the startup index check across a driver reconnect (indexes ready: %s)', async (verified) => {
        const { EventEmitter } = require('node:events');
        const connection = Object.assign(new EventEmitter(), { readyState: 0, host: '127.0.0.1' });
        const franchiseSyncIndexes = jest.fn(async () => {
            if (!verified) throw new Error('Index check failed');
        });
        const userSyncIndexes = jest.fn(async () => {});
        const todaSyncIndexes = jest.fn(async () => {});

        jest.doMock('mongoose', () => ({
            connection,
            connect: async () => {
                connection.readyState = 1;
                return { connection };
            }
        }));
        jest.doMock('../../src/models/franchiseModel', () => ({ syncIndexes: franchiseSyncIndexes }));
        jest.doMock('../../src/models/userModel', () => ({ syncIndexes: userSyncIndexes }));
        jest.doMock('../../src/models/todaModel', () => ({ syncIndexes: todaSyncIndexes }));
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        process.env.NODE_ENV = 'development';
        process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/readiness_test';
        const connectDB = require('../../src/config/db');

        expect(connectDB.areIndexesReady()).toBe(false);
        await connectDB();
        expect(franchiseSyncIndexes).toHaveBeenCalledTimes(1);
        expect(userSyncIndexes).toHaveBeenCalledTimes(1);
        expect(todaSyncIndexes).toHaveBeenCalledTimes(1);
        expect(connectDB.areIndexesReady()).toBe(verified);
        connection.readyState = 0;
        connection.emit('disconnected');
        expect(connectDB.areIndexesReady()).toBe(false);
        connection.readyState = 1;
        connection.emit('reconnected');
        expect(connectDB.areIndexesReady()).toBe(verified);
    });
});
