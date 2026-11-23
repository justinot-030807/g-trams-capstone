const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const clock = pathToFileURL(path.resolve(__dirname, '../../../frontend/src/utils/serverTime.js')).href;

it('advances Manila server time across midnight after the browser wall clock changes', () => {
    execFileSync(process.execPath, ['--input-type=module', '-e', `
        import assert from 'node:assert/strict';
        import { getServerNow, getManilaServerDateString, syncWithServerTime } from ${JSON.stringify(clock)};

        let elapsed = 100;
        Object.defineProperty(globalThis, 'performance', { value: { now: () => elapsed } });
        syncWithServerTime('2026-12-31T15:59:59.500Z');
        assert.equal(getManilaServerDateString(), '2026-12-31');

        Date.now = () => Date.parse('2050-01-01T00:00:00.000Z');
        elapsed += 1000;
        assert.equal(getServerNow().toISOString(), '2026-12-31T16:00:00.500Z');
        assert.equal(getManilaServerDateString(), '2027-01-01');
    `], { timeout: 15000 });
}, 20000);
