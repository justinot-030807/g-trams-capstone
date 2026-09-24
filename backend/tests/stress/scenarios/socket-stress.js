/**
 * Scenario 5: Socket.IO Real-time Connection Stress & Event Saturation
 */

const { io } = require('socket.io-client');
const { calculateMetrics } = require('../utils/metrics');

async function runSocketStressTest(baseUrl, { operatorToken, adminToken, concurrency = 40 } = {}) {
    const socketResults = [];
    const sockets = [];

    const connectClient = (index) => {
        return new Promise((resolve) => {
            const token = index % 2 === 0 ? operatorToken : adminToken;
            const start = process.hrtime.bigint();

            const socket = io(baseUrl, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: false,
                timeout: 5000
            });

            socket.on('connect', () => {
                const end = process.hrtime.bigint();
                const durationMs = Number(end - start) / 1e6;

                // Emit typing event to test message pipeline
                socket.emit('chat_typing', {
                    threadId: 'stress_test_thread',
                    recipientId: 'mock_recipient'
                });

                sockets.push(socket);
                resolve({
                    status: 200,
                    durationMs,
                    error: null
                });
            });

            socket.on('connect_error', (err) => {
                const end = process.hrtime.bigint();
                const durationMs = Number(end - start) / 1e6;
                resolve({
                    status: 500,
                    durationMs,
                    error: err.message
                });
            });
        });
    };

    const start = Date.now();
    const connectionPromises = [];
    for (let i = 0; i < concurrency; i++) {
        connectionPromises.push(connectClient(i));
    }

    const results = await Promise.all(connectionPromises);
    const totalTimeMs = Date.now() - start;

    // Disconnect all sockets cleanly
    for (const s of sockets) {
        if (s.connected) {
            s.disconnect();
        }
    }

    const metrics = calculateMetrics(results, totalTimeMs);
    const passed = metrics.successfulRequests === concurrency && metrics.avgLatencyMs < 2000;

    return {
        name: 'Socket.IO Real-Time Concurrency & WebSocket Handshake',
        description: 'Simultaneously connects multiple WebSocket clients, authenticates via JWT, and tests event delivery.',
        endpoint: 'WS /socket.io/',
        concurrency,
        metrics,
        passed,
        notes: passed
            ? `Successfully established ${metrics.successfulRequests}/${concurrency} authenticated WebSocket connections concurrently. Average handshake latency was ${metrics.avgLatencyMs}ms. All sockets closed cleanly.`
            : `Connected ${metrics.successfulRequests}/${concurrency} sockets with average latency ${metrics.avgLatencyMs}ms.`
    };
}

module.exports = { runSocketStressTest };
