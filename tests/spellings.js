import assert from 'node:assert';
import test from 'node:test';
import { SPELLINGS, defaultSpelling, hasCase, isSpelling, spell, spellingLabel, spellingsOf } from '../src/spellings.js';
import { TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_UUID, TYPE_WORDS, typeDetector } from '../src/type-detector.js';
import { toUuid } from '../src/to-uuid.js';
import { SIGNED } from '../src/int-type.js';
import { uuidToBytesString } from '../src/uuid-bytes.js';
import { uuidToBase64Std } from '../src/base64.js';
import { uuidToUlid } from '../src/uuid-ulid.js';
import { uuidToInts } from '../src/uuid-high-low.js';
import { uuidToWords } from '../src/uuid-words.js';

const UUID = '71a46cec-4809-4cc5-9689-5b0441b46186';

const CANONICAL = {
    [TYPE_UUID]: UUID,
    [TYPE_BASE64]: uuidToBase64Std(UUID),
    [TYPE_ULID]: uuidToUlid(UUID),
    [TYPE_BYTES]: uuidToBytesString(UUID),
    [TYPE_HIGH_LOW]: JSON.stringify(uuidToInts(UUID)),
    [TYPE_WORDS]: JSON.stringify(uuidToWords(UUID, true)),
};

test('every spelling of every format is read back as the same identifier', async (t) => {
    for (const [type, options] of Object.entries(SPELLINGS)) {
        for (const option of options) {
            for (const upper of [false, true]) {
                const written = spell(Number(type), CANONICAL[type], option.id, upper);

                assert.strictEqual(toUuid(written, SIGNED), UUID, `${option.id}${upper ? ' upper' : ''}: ${written}`);
            }
        }
    }
});

test('every spelling is recognised as the format it came from', async (t) => {
    for (const [type, options] of Object.entries(SPELLINGS)) {
        for (const option of options) {
            const written = spell(Number(type), CANONICAL[type], option.id, false);

            assert.strictEqual(typeDetector(written), Number(type), `${option.id}: ${written}`);
        }
    }
});

test('the bytes spellings say the same sixteen numbers three ways', async (t) => {
    assert.strictEqual(spell(TYPE_BYTES, CANONICAL[TYPE_BYTES], 'hex'), '71 a4 6c ec 48 09 4c c5 96 89 5b 04 41 b4 61 86');
    assert.strictEqual(spell(TYPE_BYTES, CANONICAL[TYPE_BYTES], 'hex', true), '71 A4 6C EC 48 09 4C C5 96 89 5B 04 41 B4 61 86');
    assert.match(spell(TYPE_BYTES, CANONICAL[TYPE_BYTES], 'chex'), /^\[0x71, 0xa4, /);
});

test('the pair and the words drop to their shorthand', async (t) => {
    assert.strictEqual(spell(TYPE_HIGH_LOW, CANONICAL[TYPE_HIGH_LOW], 'pair'), '-4229995741198900111;-8763525208547292778');
    assert.strictEqual(spell(TYPE_WORDS, CANONICAL[TYPE_WORDS], 'quad'), '1906601196;1208569029;-1769383164;1102340486');
});

test('url-safe base64 loses the padding and the two awkward characters', async (t) => {
    const url = spell(TYPE_BASE64, 'a+b/c==', 'url');

    assert.strictEqual(url, 'a-b_c');
});

test('a spelling nobody asked for leaves the text alone', async (t) => {
    assert.strictEqual(spell(TYPE_BYTES, CANONICAL[TYPE_BYTES], 'nonsense'), CANONICAL[TYPE_BYTES]);
    assert.strictEqual(spell(TYPE_UUID, '', 'braces'), '');
    assert.strictEqual(spell(TYPE_BYTES, 'not a list', 'hex'), 'not a list');
});

test('each format knows its own spellings and its default', async (t) => {
    assert.strictEqual(defaultSpelling(TYPE_UUID), 'plain');
    assert.strictEqual(defaultSpelling(TYPE_BASE64), 'std');
    assert.strictEqual(isSpelling(TYPE_BASE64, 'braces'), false);
    assert.strictEqual(isSpelling(TYPE_BASE64, 'url'), true);
    assert.deepStrictEqual(spellingsOf(TYPE_ULID).map(option => option.id), ['upper', 'lower']);
});

test('case belongs to the formats where it is a choice, not to base64', async (t) => {
    assert.strictEqual(hasCase(TYPE_UUID), true);
    assert.strictEqual(hasCase(TYPE_BYTES), true);
    assert.strictEqual(hasCase(TYPE_BASE64), false);
    assert.strictEqual(hasCase(TYPE_HIGH_LOW), false);
});

test('the chip names a spelling only when it is not the ordinary one', async (t) => {
    assert.strictEqual(spellingLabel(TYPE_UUID, 'plain', false), null);
    assert.strictEqual(spellingLabel(TYPE_UUID, 'braces', false), 'braces');
    assert.strictEqual(spellingLabel(TYPE_UUID, 'plain', true), 'capitals');
    assert.strictEqual(spellingLabel(TYPE_UUID, 'hex', true), 'HEX');
    assert.strictEqual(spellingLabel(TYPE_BASE64, 'url', false), 'url-safe');
    assert.strictEqual(spellingLabel(TYPE_BASE64, 'std', true), null, 'base64 has no case to name');
});

test('the shorthand keeps every digit of a 64-bit pair', async (t) => {
    const object = '{"high":8188789784543055045,"low":10847301251338887558}';

    assert.strictEqual(spell(TYPE_HIGH_LOW, object, 'pair'), '8188789784543055045;10847301251338887558');
});

test('the shorthand reads the same numbers whether they are quoted or not', async (t) => {
    assert.strictEqual(spell(TYPE_HIGH_LOW, '{"high":"-1","low":"2"}', 'pair'), '-1;2');
    assert.strictEqual(spell(TYPE_WORDS, '{"w1":"1","w2":2,"w3":3,"w4":4}', 'quad'), '1;2;3;4');
});

test('a value that is not a pair at all is left as it is', async (t) => {
    assert.strictEqual(spell(TYPE_HIGH_LOW, '{"left":1}', 'pair'), '{"left":1}');
    assert.strictEqual(spell(TYPE_WORDS, '{"w1":1}', 'quad'), '{"w1":1}');
});
