#!/usr/bin/env node

/**
 * GTRAMS Comprehensive API Stress & Load Performance Test Suite
 * Master Orchestrator
 */

process.env.NODE_ENV = 'test';
process.env.FORCE_RATE_LIMIT = 'true';
require('dotenv').config();

const os = require('os');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const { printConsoleHeader, printScenarioResult, generateMarkdownReport } = require('./utils/report-generator');
const { MemoryProfiler } = require('./scenarios/memory-profiler');
const { runReadThroughputTest } = require('./scenarios/read-throughput');
const { runAuthRateLimitTest } = require('./scenarios/auth-ratelimit');
const { runFranchiseRaceConditionTest } = require('./scenarios/franchise-race');
const { runMasterlistLoadTest } = require('./scenarios/masterlist-load');
const { runSocketStressTest } = require('./scenarios/socket-stress');

async function main() {
    printConsoleHeader();

    const args = process.argv.slice(2);
    const targetArg = args.find(a => a.startsWith('--target='));
    const externalTarget = targetArg ? targetArg.split('=')[1] : null;

    let serverInstance = null;
    let mongoServer = null;
    let baseUrl = externalTarget;
    let operatorToken = null;
    let adminToken = null;
    let operatorId = null;

    const memoryProfiler = new MemoryProfiler();

    try {
        if (!externalTarget) {
            console.log('📦 Starting In-Memory Test Server & Isolated MongoDB...');
            mongoServer = await MongoMemoryServer.create();
            const uri = mongoServer.getUri();

            if (mongoose.connection.readyState !== 0) {
                await mongoose.disconnect();
            }
            await mongoose.connect(uri);

            // Import Models and Server App
            const User = require('../../src/models/userModel');
            const Franchise = require('../../src/models/franchiseModel');
            const { app, server } = require('../../server');

            // Build unique indexes before testing concurrency
            await User.init();
            await Franchise.init();

            // Seed Admin User
            const admin = await User.create({
                name: 'Stress Test Admin',
                email: 'admin.stress@gtrams.gov.ph',
                password: 'Password123!',
                role: 'admin',
                contact: '09123456789',
                address: 'Poblacion, Gasan, Marinduque'
            });

            // Seed Operator User
            const operator = await User.create({
                name: 'Stress Test Operator',
                email: 'operator.stress@gtrams.gov.ph',
                password: 'Password123!',
                role: 'operator',
                contact: '09987654321',
                address: 'Bahi, Gasan, Marinduque'
            });
            operatorId = operator._id;

            // Generate JWT Tokens
            const secret = process.env.JWT_SECRET || 'gtrams_stress_jwt_secret_key';
            adminToken = jwt.sign({ id: admin._id, role: admin.role }, secret, { expiresIn: '2h' });
            operatorToken = jwt.sign({ id: operator._id, role: operator.role }, secret, { expiresIn: '2h' });

            // Seed Sample Franchise Records for Masterlist Query Load
            const sampleFranchises = [];
            for (let i = 1; i <= 50; i++) {
                sampleFranchises.push({
                    operator: operator._id,
                    fullName: `Sample Operator ${i}`,
                    address: `Barangay ${i}, Gasan`,
                    zone: `Zone ${(i % 3) + 1}`,
                    made: 'Kawasaki',
                    make: 'Tricycle',
                    motorNo: `MOT-LOAD-${1000 + i}`,
                    chassisNo: `CHAS-LOAD-${1000 + i}`,
                    plateNo: `LOAD-${100 + i}`,
                    todaName: 'GASAN TODA',
                    cedulaDate: new Date(),
                    cedulaAddress: 'Gasan',
                    cedulaSerialNo: `CED-${i}`,
                    status: i % 2 === 0 ? 'Active' : 'Pending',
                    isArchived: false
                });
            }
            await Franchise.insertMany(sampleFranchises);

            // Start ephemeral server on random free port
            const port = 5055;
            await new Promise((resolve) => {
                serverInstance = server.listen(port, () => {
                    baseUrl = `http://localhost:${port}`;
                    console.log(`🚀 GTRAMS Test Server running at ${baseUrl}`);
                    resolve();
                });
            });
        } else {
            console.log(`🎯 Testing against live external server: ${baseUrl}`);
            const secret = process.env.JWT_SECRET || 'gtrams_stress_jwt_secret_key';
            adminToken = jwt.sign({ id: new mongoose.Types.ObjectId(), role: 'admin' }, secret, { expiresIn: '2h' });
            operatorToken = jwt.sign({ id: new mongoose.Types.ObjectId(), role: 'operator' }, secret, { expiresIn: '2h' });
            operatorId = new mongoose.Types.ObjectId();
        }

        console.log('\n⚡ Commencing Stress Testing Scenarios...\n');
        const scenarios = [];

        // Scenario 1: Read Throughput & Public Endpoints
        console.log('⏳ Running Scenario 1: Read Throughput & Public Endpoints...');
        const s1 = await runReadThroughputTest(baseUrl, { totalRequests: 250, concurrency: 50 });
        memoryProfiler.recordPeak();
        printScenarioResult(s1.name, s1.metrics, s1.description);
        scenarios.push(s1);

        // Scenario 2: Authentication & Rate-Limiter Protection
        console.log('\n⏳ Running Scenario 2: Authentication & Rate-Limiting Defense...');
        const s2 = await runAuthRateLimitTest(baseUrl, { totalRequests: 40, concurrency: 10 });
        memoryProfiler.recordPeak();
        printScenarioResult(s2.name, s2.metrics, s2.description);
        scenarios.push(s2);

        // Scenario 3: Franchise Race Condition & Concurrency Guard
        console.log('\n⏳ Running Scenario 3: Franchise Race-Condition Guard (Simultaneous Conflicting Submissions)...');
        const origConsoleError = console.error;
        console.error = () => {}; // Silence expected MongoDB 11000 duplicate logs
        const s3 = await runFranchiseRaceConditionTest(baseUrl, { operatorToken, operatorId, concurrency: 25 });
        console.error = origConsoleError;
        memoryProfiler.recordPeak();
        printScenarioResult(s3.name, s3.metrics, s3.description);
        scenarios.push(s3);

        // Scenario 4: Authenticated Masterlist Query Load
        console.log('\n⏳ Running Scenario 4: Authenticated Masterlist Query & Pagination Load...');
        const s4 = await runMasterlistLoadTest(baseUrl, { adminToken, totalRequests: 100, concurrency: 25 });
        memoryProfiler.recordPeak();
        printScenarioResult(s4.name, s4.metrics, s4.description);
        scenarios.push(s4);

        // Scenario 5: Socket.IO Real-time Connection Stress
        console.log('\n⏳ Running Scenario 5: Socket.IO Real-time Concurrency & Handshake...');
        const s5 = await runSocketStressTest(baseUrl, { operatorToken, adminToken, concurrency: 30 });
        memoryProfiler.recordPeak();
        printScenarioResult(s5.name, s5.metrics, s5.description);
        scenarios.push(s5);

        // Scenario 6: Memory Profiler Finalization
        await new Promise(r => setTimeout(r, 1000));
        const memoryProfile = memoryProfiler.finalize();

        // Environment information for reporting
        const envInfo = {
            target: baseUrl,
            nodeVersion: process.version,
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: `${(os.totalmem() / (1024 ** 3)).toFixed(1)} GB`
        };

        const reportData = {
            timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
            envInfo,
            scenarios,
            memoryProfile
        };

        // Write STRESS_TEST_REPORT.md in root of GTRAMS
        const reportPath = path.resolve(__dirname, '../../../STRESS_TEST_REPORT.md');
        generateMarkdownReport(reportData, reportPath);

        console.log('\n' + '='.repeat(80));
        console.log(`✅ ALL STRESS TESTING SCENARIOS COMPLETED SUCCESSFULLY!`);
        console.log(`📄 Comprehensive Markdown Report generated at:`);
        console.log(`   ${reportPath}`);
        console.log('='.repeat(80) + '\n');

    } catch (err) {
        console.error('❌ Error during stress testing execution:', err);
    } finally {
        if (serverInstance) {
            serverInstance.close();
        }
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
        process.exit(0);
    }
}

main();
