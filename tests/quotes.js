import assert from 'node:assert';
import test from 'node:test';
import { unquote } from '../src/quotes.js';
import { toUuid } from '../src/to-uuid.js';
import { typeDetector, TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_WORDS } from '../src/type-detector.js';
import { SIGNED, UNSIGNED } from '../src/int-type.js';
import { SPELLINGS, spell } from '../src/spellings.js';
import { uuidToBytesString } from '../src/uuid-bytes.js';
import { uuidToBase64Std } from '../src/base64.js';
import { uuidToUlid } from '../src/uuid-ulid.js';
import { uuidToInts } from '../src/uuid-high-low.js';
import { uuidToWords } from '../src/uuid-words.js';

const UUID = '71a46cec-4809-4cc5-9689-5b0441b46186';

function canonical(type) {
    switch (Number(type)) {
        case TYPE_BASE64: return uuidToBase64Std(UUID);
        case TYPE_ULID: return uuidToUlid(UUID);
        case TYPE_BYTES: return uuidToBytesString(UUID);
        case TYPE_HIGH_LOW: return JSON.stringify(uuidToInts(UUID)).replace(/"(-?\d+)"/g, '$1');
        case TYPE_WORDS: return JSON.stringify(uuidToWords(UUID, true));
        default: return UUID;
    }
}

test('a wrapping pair of quotes comes off, in any of the three marks', async (t) => {
    assert.strictEqual(unquote(`"${UUID}"`), UUID);
    assert.strictEqual(unquote(`'${UUID}'`), UUID);
    assert.strictEqual(unquote(`\`${UUID}\``), UUID);
    assert.strictEqual(unquote(`"${UUID}",`), UUID);
    assert.strictEqual(unquote(`  "${UUID}" ,, `), UUID);
});

test('quotes inside the value stay where they are', async (t) => {
    assert.strictEqual(unquote('{"high": 1, "low": 2}'), '{"high": 1, "low": 2}');
    assert.strictEqual(unquote('"{"high": 1, "low": 2}"'), '{"high": 1, "low": 2}');
    assert.strictEqual(unquote("it's"), "it's");
    assert.strictEqual(unquote('"'), '"');
    assert.strictEqual(unquote(''), '');
});

test('nothing but a string is touched', async (t) => {
    assert.strictEqual(unquote(null), null);
    assert.strictEqual(unquote(7), 7);
});

test('every spelling reads the same quoted as it does bare', async (t) => {
    for (const [type, options] of Object.entries(SPELLINGS)) {
        for (const option of options) {
            for (const upper of [false, true]) {
                const bare = spell(Number(type), canonical(type), option.id, upper);

                for (const mark of ['"', "'", '`']) {
                    for (const tail of ['', ',']) {
                        const quoted = `${mark}${bare}${mark}${tail}`;
                        const read = toUuid(quoted, SIGNED) ?? toUuid(quoted, UNSIGNED);

                        assert.strictEqual(read, UUID, `${type}/${option.id}: ${quoted}`);
                        assert.strictEqual(typeDetector(quoted), Number(type), `type of ${quoted}`);
                    }
                }
            }
        }
    }
});
