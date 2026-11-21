// Keep test authentication independent of local .env files, including reloads with override enabled.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
jest.mock('dotenv', () => ({ ...jest.requireActual('dotenv'), config: () => ({ parsed: {} }) }));
