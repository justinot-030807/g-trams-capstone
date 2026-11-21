module.exports = {
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/jest.setup.js'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    testTimeout: 30000,
};
