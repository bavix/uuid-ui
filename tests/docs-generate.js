import assert from 'node:assert';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { GENERATORS, generate } from '../src/docs-runtime-core.js';
import { typeDetector, TYPE_ULID } from '../src/type-detector.js';
import { uuidToHex } from '../src/uuid-bytes.js';

const VERSIONS = { v1: 1, v3: 3, v4: 4, v5: 5, v6: 6, v7: 7, v8: 8 };

test('every generator the widget offers makes what its name says', async (t) => {
    for (const type of GENERATORS) {
        const held = generate(type, { name: 'example.com' });

        assert.notStrictEqual(held, null, `${type} made nothing`);

        if (type === 'ulid') {
            assert.strictEqual(typeDetector(held), TYPE_ULID);

            continue;
        }

        const hex = uuidToHex(held);

        assert.strictEqual(hex.length, 32, `${type} is not 16 bytes`);

        if (VERSIONS[type] !== undefined) {
            assert.strictEqual(parseInt(hex[12], 16), VERSIONS[type], `${type} carries another version`);
        }
    }
});

test('a type nobody offers makes nothing, instead of quietly making a v4', async (t) => {
    assert.strictEqual(generate(7), null);
    assert.strictEqual(generate('V7'), null);
    assert.strictEqual(generate('uuid'), null);
});

test('the playground fills from the button it was given', async (t) => {
    const source = readFileSync(new URL('../src/docs-play.js', import.meta.url), 'utf-8');

    assert.match(source, /generate\(button\.dataset\.fill\)/, 'the fill button would make some other version');
});
