/**
 * Scenario 4: Authenticated Masterlist Query & Pagination Load
 */

const { request, runConcurrent } = require('../utils/httpClient');
const { calculateMetrics } = require('../utils/metrics');

async function runMasterlistLoadTest(baseUrl, { adminToken, totalRequests = 100, concurrency = 25 } = {}) {
    const url = `${baseUrl}/api/v1/franchises?page=1&limit=20`;
    const headers = {
        'Authorization': `Bearer ${adminToken}`
    };

    const tasks = [];
    for (let i = 0; i < totalRequests; i++) {
        tasks.push(() => request(url, { method: 'GET', headers }));
    }

    const start = Date.now();
    const results = await runConcurrent(tasks, concurrency);
    const totalTimeMs = Date.now() - start;

    const metrics = calculateMetrics(results, totalTimeMs);

    const passed = metrics.errorRatePercent === 0 && metrics.avgLatencyMs < 5000;

    return {
        name: 'Authenticated Masterlist Query & Pagination Load',
        description: 'Simulates multiple administrators querying paginated franchise records simultaneously.',
        endpoint: 'GET /api/v1/franchises?page=1&limit=20',
        concurrency,
        metrics,
        passed,
        notes: passed
            ? `Processed ${metrics.totalRequests} authenticated requests with 0% error rate. Average database query + JWT verification response time was ${metrics.avgLatencyMs}ms at ${metrics.rps} req/sec.`
            : `Completed with ${metrics.errorRatePercent}% error rate or avg latency above 5000ms (${metrics.avgLatencyMs}ms).`
    };
}

module.exports = { runMasterlistLoadTest };
