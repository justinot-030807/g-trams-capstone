/**
 * High-Performance HTTP Request Pool for GTRAMS Stress Testing
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 500 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 500 });

async function request(urlStr, options = {}) {
    const url = new URL(urlStr);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const agent = isHttps ? httpsAgent : httpAgent;

    const payload = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;

    const headers = {
        'Accept': 'application/json',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(options.headers || {})
    };

    const reqOptions = {
        method: options.method || 'GET',
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + (url.search || ''),
        headers,
        agent,
        timeout: options.timeout || 10000
    };

    return new Promise((resolve) => {
        const start = process.hrtime.bigint();

        const req = lib.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                const end = process.hrtime.bigint();
                const durationMs = Number(end - start) / 1e6;
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({
                    status: res.statusCode,
                    durationMs,
                    headers: res.headers,
                    data: parsed,
                    error: null
                });
            });
        });

        req.on('error', (err) => {
            const end = process.hrtime.bigint();
            resolve({
                status: 0,
                durationMs: Number(end - start) / 1e6,
                headers: {},
                data: null,
                error: err.message
            });
        });

        req.on('timeout', () => {
            req.destroy(new Error('Request timeout'));
        });

        if (payload) {
            req.write(payload);
        }
        req.end();
    });
}

/**
 * Execute tasks with bounded concurrency
 */
async function runConcurrent(tasks, concurrency) {
    const results = new Array(tasks.length);
    let currentIndex = 0;

    async function worker() {
        while (currentIndex < tasks.length) {
            const index = currentIndex++;
            try {
                results[index] = await tasks[index]();
            } catch (err) {
                results[index] = {
                    status: 0,
                    durationMs: 0,
                    error: err.message
                };
            }
        }
    }

    const pool = [];
    const actualConcurrency = Math.min(concurrency, tasks.length);
    for (let i = 0; i < actualConcurrency; i++) {
        pool.push(worker());
    }

    await Promise.all(pool);
    return results;
}

module.exports = { request, runConcurrent };
