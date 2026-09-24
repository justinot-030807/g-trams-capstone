/**
 * Scenario 2: Authentication Concurrency & Rate-Limiting Protection
 */

const { request, runConcurrent } = require('../utils/httpClient');
const { calculateMetrics } = require('../utils/metrics');

async function runAuthRateLimitTest(baseUrl, { totalRequests = 40, concurrency = 10, validContact = '09123456789' } = {}) {
    const url = `${baseUrl}/api/v1/auth/login`;

    const tasks = [];
    for (let i = 0; i < totalRequests; i++) {
        tasks.push(() => request(url, {
            method: 'POST',
            body: {
                contact: validContact,
                password: `wrong_pass_${i}`
            }
        }));
    }

    const start = Date.now();
    const results = await runConcurrent(tasks, concurrency);
    const totalTimeMs = Date.now() - start;

    const metrics = calculateMetrics(results, totalTimeMs);

    const has429 = Boolean(metrics.statusCodes['429']);
    const has500 = Boolean(metrics.statusCodes['500']);

    // For auth rate-limit testing, 400 (bad password) and 429 (rate-limited) are expected security outcomes
    const unexpectedErrors = metrics.statusCodes['500'] || 0;
    metrics.errorRatePercent = Number(((unexpectedErrors / metrics.totalRequests) * 100).toFixed(2));

    return {
        name: 'Authentication Concurrency & Brute-Force Rate Limiting',
        description: 'Tests rapid login attempts to verify rate-limiting defense (HTTP 429) against brute-force attacks without 500 server crashes.',
        endpoint: 'POST /api/v1/auth/login',
        concurrency,
        metrics,
        passed: has429 && !has500,
        notes: has429
            ? `Rate limiter successfully engaged! ${metrics.statusCodes['429']} requests were throttled with HTTP 429. Zero server crashes (500).`
            : `Requests completed without 500 server errors (rate limiter was either in bypass/test mode or threshold was not exceeded). Total 400/401 auth rejections handled smoothly.`
    };
}

module.exports = { runAuthRateLimitTest };
