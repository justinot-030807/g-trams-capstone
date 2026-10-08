/**
 * Scenario 6: Cashier Payment Race Condition & Atomic Concurrency Guard
 * Simultaneously fires conflicting cashier payments for the same franchise in the exact same millisecond.
 * Also verifies that a Paid franchise strictly cannot be rejected/cancelled by an admin.
 */

const { request } = require('../utils/httpClient');
const { calculateMetrics } = require('../utils/metrics');

async function runCashierPaymentRaceTest(baseUrl, { cashierToken, adminToken, franchiseId, concurrency = 20 } = {}) {
    const payUrl = `${baseUrl}/api/v1/franchises/${franchiseId}/pay`;
    const statusUrl = `${baseUrl}/api/v1/franchises/${franchiseId}/status`;

    const cashierHeaders = {
        'Authorization': `Bearer ${cashierToken}`
    };

    const adminHeaders = {
        'Authorization': `Bearer ${adminToken}`
    };

    // 1. Fire simultaneous payment attempts at the EXACT SAME millisecond using Promise.all
    const promises = [];
    const start = Date.now();
    for (let i = 1; i <= concurrency; i++) {
        promises.push(request(payUrl, {
            method: 'POST',
            headers: cashierHeaders,
            body: {
                officialReceiptNo: `LGU-OR-STRESS-${String(i).padStart(3, '0')}`,
                payerName: `Operator Stress Payee ${i}`,
                amountPaid: 500,
                paymentMethod: 'Cash',
                paymentRemarks: `Concurrent test payment transaction ${i}`
            }
        }));
    }

    const results = await Promise.all(promises);
    const totalTimeMs = Date.now() - start;

    const metrics = calculateMetrics(results, totalTimeMs);

    const paidSuccessCount = metrics.statusCodes['200'] || 0;
    const conflictBlockedCount = metrics.statusCodes['409'] || 0;
    const serverErrorCount = metrics.statusCodes['500'] || 0;

    // Error rate is unexpected server crashes (500)
    metrics.errorRatePercent = Number(((serverErrorCount / metrics.totalRequests) * 100).toFixed(2));

    // 2. Post-condition check: verify that an Admin CANNOT cancel/reject a paid franchise
    let rejectionBlocked = false;
    try {
        const rejectRes = await request(statusUrl, {
            method: 'PUT',
            headers: adminHeaders,
            body: {
                status: 'Cancelled',
                cancelReason: 'Attempted stress-test illegal rejection of paid franchise'
            }
        });
        if (rejectRes.status === 400) {
            rejectionBlocked = true;
        }
    } catch (e) {
        // Ignored
    }

    const passed = paidSuccessCount === 1 && conflictBlockedCount === (concurrency - 1) && serverErrorCount === 0 && rejectionBlocked;

    return {
        name: 'Cashier Payment Atomic Concurrency & Rejection Immunity Guard',
        description: 'Simultaneously fires multiple cashier payments for the same application and confirms that Paid applications cannot be cancelled/rejected.',
        endpoint: 'POST /api/v1/franchises/:id/pay',
        concurrency,
        metrics,
        passed,
        notes: passed
            ? `PERFECT PAYMENT ATOMICITY! Exactly 1 payment succeeded (HTTP 200) under official LGU OR, and all ${conflictBlockedCount} concurrent attempts were safely rejected (HTTP 409). Rejection of paid application was strictly blocked (HTTP 400). 0 server crashes.`
            : `Paid: ${paidSuccessCount}, Conflicts: ${conflictBlockedCount}, 500 Errors: ${serverErrorCount}, Rejection Blocked: ${rejectionBlocked}.`
    };
}

module.exports = { runCashierPaymentRaceTest };
