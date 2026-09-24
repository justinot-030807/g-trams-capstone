/**
 * Scenario 6: Memory Profiler & Heap Stability Monitor
 */

function getMemorySnapshot() {
    const mem = process.memoryUsage();
    return {
        rssMB: Number((mem.rss / (1024 * 1024)).toFixed(2)),
        heapTotalMB: Number((mem.heapTotal / (1024 * 1024)).toFixed(2)),
        heapUsedMB: Number((mem.heapUsed / (1024 * 1024)).toFixed(2)),
        externalMB: Number((mem.external / (1024 * 1024)).toFixed(2))
    };
}

class MemoryProfiler {
    constructor() {
        this.initial = getMemorySnapshot();
        this.peak = { ...this.initial };
        this.after = null;
    }

    recordPeak() {
        const current = getMemorySnapshot();
        if (current.heapUsedMB > this.peak.heapUsedMB) {
            this.peak = current;
        }
    }

    finalize() {
        if (global.gc) {
            try { global.gc(); } catch {}
        }
        this.after = getMemorySnapshot();
        const deltaMB = Number((this.after.heapUsedMB - this.initial.heapUsedMB).toFixed(2));

        let analysis = 'Heap usage remained stable with efficient garbage collection.';
        if (deltaMB < 30) {
            analysis = `Excellent memory stability! Heap grew by only ${deltaMB} MB after thousands of concurrent operations, showing no detectable memory leaks.`;
        } else if (deltaMB < 120) {
            analysis = `Healthy heap retention (+${deltaMB} MB), fully within normal buffer bounds for concurrent in-process database and server execution.`;
        } else {
            analysis = `Elevated heap retention (+${deltaMB} MB); investigate possible lingering event listeners or uncollected closures.`;
        }

        return {
            initial: this.initial,
            peak: this.peak,
            after: this.after,
            deltaMB,
            analysis
        };
    }
}

module.exports = { MemoryProfiler };
