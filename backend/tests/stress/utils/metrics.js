/**
 * Statistical Metrics Calculator for GTRAMS Stress Testing
 */

function calculateMetrics(results, totalTimeMs) {
    if (!results || results.length === 0) {
        return {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rps: 0,
            avgLatencyMs: 0,
            minLatencyMs: 0,
            maxLatencyMs: 0,
            p50Ms: 0,
            p90Ms: 0,
            p95Ms: 0,
            p99Ms: 0,
            statusCodes: {},
            errorRatePercent: 0
        };
    }

    const latencies = results.map(r => r.durationMs).sort((a, b) => a - b);
    const totalRequests = results.length;
    const successfulRequests = results.filter(r => r.status >= 200 && r.status < 400).length;
    const failedRequests = totalRequests - successfulRequests;

    const sumLatency = latencies.reduce((acc, curr) => acc + curr, 0);
    const avgLatencyMs = Number((sumLatency / totalRequests).toFixed(2));
    const minLatencyMs = Number(latencies[0].toFixed(2));
    const maxLatencyMs = Number(latencies[latencies.length - 1].toFixed(2));

    const getPercentile = (pct) => {
        const index = Math.ceil((pct / 100) * latencies.length) - 1;
        return Number(latencies[Math.max(0, Math.min(index, latencies.length - 1))].toFixed(2));
    };

    const statusCodes = {};
    for (const r of results) {
        const code = r.status || (r.error ? 'ERR' : 'UNKNOWN');
        statusCodes[code] = (statusCodes[code] || 0) + 1;
    }

    const rps = totalTimeMs > 0 ? Number(((totalRequests / totalTimeMs) * 1000).toFixed(2)) : 0;
    const errorRatePercent = Number(((failedRequests / totalRequests) * 100).toFixed(2));

    return {
        totalRequests,
        successfulRequests,
        failedRequests,
        rps,
        avgLatencyMs,
        minLatencyMs,
        maxLatencyMs,
        p50Ms: getPercentile(50),
        p90Ms: getPercentile(90),
        p95Ms: getPercentile(95),
        p99Ms: getPercentile(99),
        statusCodes,
        errorRatePercent
    };
}

module.exports = { calculateMetrics };
