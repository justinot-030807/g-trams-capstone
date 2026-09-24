/**
 * Scenario 1: Read Throughput & Public Endpoint Saturation
 */

const { request, runConcurrent } = require('../utils/httpClient');
const { calculateMetrics } = require('../utils/metrics');

async function runReadThroughputTest(baseUrl, { totalRequests = 200, concurrency = 50 } = {}) {
    const endpoints = [
        `${baseUrl}/`,
        `${baseUrl}/api/v1/auth/public-stats`
    ];

    const tasks = [];
    for (let i = 0; i < totalRequests; i++) {
        const url = endpoints[i % endpoints.length];
        tasks.push(() => request(url, { method: 'GET' }));
    }

    const start = Date.now();
    const results = await runConcurrent(tasks, concurrency);
    const totalTimeMs = Date.now() - start;

    const metrics = calculateMetrics(results, totalTimeMs);

    return {
        name: 'Read Throughput & Public Endpoints',
        description: 'Measures throughput (RPS) and latency under burst traffic on public endpoints.',
        endpoint: 'GET / & GET /api/v1/auth/public-stats',
        concurrency,
        metrics,
        passed: metrics.errorRatePercent === 0 && metrics.avgLatencyMs < 2000,
        notes: metrics.errorRatePercent === 0
            ? `All ${metrics.totalRequests} requests completed successfully with 0% error rate. Average latency was ${metrics.avgLatencyMs}ms at ${metrics.rps} req/sec.`
            : `Some requests failed with ${metrics.errorRatePercent}% error rate.`
    };
}

module.exports = { runReadThroughputTest };
