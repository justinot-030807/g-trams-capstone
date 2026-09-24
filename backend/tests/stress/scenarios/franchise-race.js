/**
 * Scenario 3: Franchise Submission Race Condition & Concurrency Guard
 */

const { request } = require('../utils/httpClient');
const { calculateMetrics } = require('../utils/metrics');

async function runFranchiseRaceConditionTest(baseUrl, { operatorToken, operatorId, concurrency = 20 } = {}) {
    const url = `${baseUrl}/api/v1/franchises`;

    const uniqueSuffix = Date.now().toString().slice(-5);
    const conflictingPayload = {
        operator: operatorId,
        fullName: 'Juan Dela Cruz',
        address: 'Barangay Bahi, Gasan',
        zone: 'Zone 1',
        made: 'Kawasaki',
        make: 'Tricycle',
        motorNo: `MOT-RACE-${uniqueSuffix}`,
        chassisNo: `CHAS-RACE-${uniqueSuffix}`,
        plateNo: `RC-${uniqueSuffix}`,
        todaName: 'GASAN TODA',
        cedulaDate: '2026-01-15',
        cedulaAddress: 'Gasan, Marinduque',
        cedulaSerialNo: '998877',
        applicationType: 'New'
    };

    const headers = {
        'Authorization': `Bearer ${operatorToken}`
    };

    // Fire all simultaneous submissions at the EXACT SAME millisecond using Promise.all
    const promises = [];
    const start = Date.now();
    for (let i = 0; i < concurrency; i++) {
        promises.push(request(url, {
            method: 'POST',
            headers,
            body: conflictingPayload
        }));
    }

    const results = await Promise.all(promises);
    const totalTimeMs = Date.now() - start;

    const metrics = calculateMetrics(results, totalTimeMs);

    const createdCount = metrics.statusCodes['201'] || 0;
    const conflictCount = (metrics.statusCodes['400'] || 0) + (metrics.statusCodes['409'] || 0);
    const serverErrorCount = metrics.statusCodes['500'] || 0;

    // Error rate for race condition is unexpected server errors (500)
    metrics.errorRatePercent = Number(((serverErrorCount / metrics.totalRequests) * 100).toFixed(2));

    const passed = createdCount === 1 && conflictCount === (concurrency - 1) && serverErrorCount === 0;

    return {
        name: 'Franchise Race-Condition & Atomic Concurrency Guard',
        description: 'Simultaneously fires conflicting franchise applications with identical plate/motor numbers in the exact same millisecond.',
        endpoint: 'POST /api/v1/franchises',
        concurrency,
        metrics,
        passed,
        notes: passed
            ? `PERFECT ATOMIC CONCURRENCY! Exactly 1 submission succeeded (HTTP 201), and all ${conflictCount} other conflicting submissions were safely rejected (HTTP 400/409). 0 duplicates created, 0 server errors (500).`
            : `Created: ${createdCount}, Rejected: ${conflictCount}, 500 Errors: ${serverErrorCount}.`
    };
}

module.exports = { runFranchiseRaceConditionTest };
