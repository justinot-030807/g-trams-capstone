'use strict';

/**
 * Isolated child-process runner for tesseract.js.
 * Running OCR in a short-lived child process guarantees that any WebAssembly /
 * wasm-feature-detect SyntaxError or native OOM on constrained containers
 * (e.g., Render) can NEVER crash the main Express API process.
 */
const os = require('os');

async function run() {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (!raw) {
        process.stdout.write(JSON.stringify({ ok: true, text: '' }));
        return;
    }

    const imgBuffer = Buffer.from(raw, 'base64');
    const Tesseract = require('tesseract.js');
    const worker = await Tesseract.createWorker('eng', 1, { cachePath: os.tmpdir() });
    try {
        const { data } = await worker.recognize(imgBuffer);
        const text = (data && data.text ? String(data.text) : '').replace(/\r/g, '').trim();
        process.stdout.write(JSON.stringify({ ok: true, text }));
    } finally {
        await worker.terminate().catch(() => {});
    }
}

run().catch((err) => {
    process.stderr.write(String(err && err.message ? err.message : err));
    process.exit(1);
});
