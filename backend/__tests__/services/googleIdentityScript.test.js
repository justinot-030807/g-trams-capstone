const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const loader = pathToFileURL(path.resolve(__dirname, '../../../frontend/src/utils/googleIdentityScript.js')).href;

it('shares a Google Identity script across concurrent mounts and can retry a failed load', () => {
    execFileSync(process.execPath, ['--input-type=module', '-e', `
        import assert from 'node:assert/strict';
        import { loadGoogleIdentityScript } from ${JSON.stringify(loader)};

        const scripts = [];
        globalThis.window = {};
        globalThis.document = {
            querySelector: () => scripts.at(-1),
            createElement: () => Object.assign(new EventTarget(), { remove: () => scripts.pop() }),
            body: { appendChild: (script) => scripts.push(script) }
        };

        const firstLoad = loadGoogleIdentityScript();
        assert.equal(loadGoogleIdentityScript(), firstLoad);
        assert.equal(scripts.length, 1);
        scripts[0].dispatchEvent(new Event('error'));
        await assert.rejects(firstLoad, /could not load/);
        assert.equal(scripts.length, 0);

        const nextLoad = loadGoogleIdentityScript();
        assert.equal(scripts.length, 1);
        const id = {};
        window.google = { accounts: { id } };
        scripts[0].dispatchEvent(new Event('load'));
        assert.equal(await nextLoad, id);
        assert.equal(await loadGoogleIdentityScript(), id);
        assert.equal(scripts.length, 1);
    `], { timeout: 15000 });
}, 20000);
