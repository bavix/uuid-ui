import assert from 'node:assert';
import test from 'node:test';
import { normalizeInput } from '../src/normalize-input.js';
import { toUuid } from '../src/to-uuid.js';
import { SIGNED, UNSIGNED } from '../src/int-type.js';
import { SPELLINGS, spell } from '../src/spellings.js';
import { TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_WORDS } from '../src/type-detector.js';
import { uuidToBytesString } from '../src/uuid-bytes.js';
import { uuidToBase64Std } from '../src/base64.js';
import { uuidToUlid } from '../src/uuid-ulid.js';
import { uuidToInts, uuidToUints } from '../src/uuid-high-low.js';
import { uuidToWords } from '../src/uuid-words.js';

const UUIDS = [
    '71a46cec-4809-4cc5-9689-5b0441b46186',
    '00000000-0000-0000-0000-000000000000',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '01000000-0000-0000-8084-1e0000000000',
];

function canonical(type, uuid, signed) {
    switch (Number(type)) {
        case TYPE_BASE64: return uuidToBase64Std(uuid);
        case TYPE_ULID: return uuidToUlid(uuid);
        case TYPE_BYTES: return uuidToBytesString(uuid);
        case TYPE_HIGH_LOW: return JSON.stringify(signed ? uuidToInts(uuid) : uuidToUints(uuid)).replace(/"(-?\d+)"/g, '$1');
        case TYPE_WORDS: return JSON.stringify(uuidToWords(uuid, signed));
        default: return uuid;
    }
}

test('the input box reads every spelling of every format, bare or quoted', async (t) => {
    for (const uuid of UUIDS) {
        for (const [type, options] of Object.entries(SPELLINGS)) {
            for (const option of options) {
                for (const signed of [true, false]) {
                    for (const upper of [false, true]) {
                        const bare = spell(Number(type), canonical(type, uuid, signed), option.id, upper);

                        for (const wrap of [held => held, held => `"${held}"`, held => `'${held}',`, held => `\`${held}\``]) {
                            const line = wrap(bare);
                            const normal = normalizeInput(line);

                            assert.notStrictEqual(normal, null, `${type}/${option.id} is not recognized: ${line}`);

                            const read = toUuid(normal, signed ? SIGNED : UNSIGNED);

                            assert.strictEqual(read, uuid, `${type}/${option.id} reads back wrong: ${line}`);
                        }
                    }
                }
            }
        }
    }
});

test('a normalized line is already normal: running it again changes nothing', async (t) => {
    for (const uuid of UUIDS) {
        for (const [type, options] of Object.entries(SPELLINGS)) {
            for (const option of options) {
                const once = normalizeInput(spell(Number(type), canonical(type, uuid, true), option.id, false));

                assert.strictEqual(normalizeInput(once), once, `${type}/${option.id} is not stable`);
            }
        }
    }
});

test('what is not an identifier stays refused', async (t) => {
    for (const line of ['', 'hello', '71 a4 6c', '{high: 1}', '[1, 2, 3]', '"not an id"', '{"w1": 1}']) {
        assert.strictEqual(normalizeInput(line), null, `this should not be read: ${line}`);
    }
});
