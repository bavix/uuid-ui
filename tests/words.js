import assert from 'node:assert';
import test from 'node:test';
import { isWords, uuidToWords, wordsIntType, wordsToUuid } from '../src/uuid-words.js';

const UUID = '018f3c00-1122-7000-8000-0000deadbeef';

test('the words are the four blocks of the identifier, in reading order', (t) => {
    assert.deepStrictEqual(uuidToWords(UUID), {
        w1: 0x018f3c00,
        w2: 0x11227000,
        w3: 0x80000000,
        w4: 0xdeadbeef,
    });
});

test('signed reinterprets the same bytes, it does not reorder them', (t) => {
    const unsigned = uuidToWords(UUID);
    const signed = uuidToWords(UUID, true);

    assert.strictEqual(signed.w1, unsigned.w1);
    assert.strictEqual(signed.w3, unsigned.w3 - 4294967296);
    assert.strictEqual(signed.w4, unsigned.w4 - 4294967296);
    assert.strictEqual(wordsToUuid(signed), wordsToUuid(unsigned));
});

test('a round trip returns the identifier it started with', (t) => {
    for (const value of [UUID, '00000000-0000-0000-0000-000000000000', 'ffffffff-ffff-ffff-ffff-ffffffffffff']) {
        assert.strictEqual(wordsToUuid(uuidToWords(value)), value);
        assert.strictEqual(wordsToUuid(uuidToWords(value, true)), value);
    }
});

test('nonsense in returns null, never a broken identifier', (t) => {
    assert.strictEqual(uuidToWords('not a uuid'), null);
    assert.strictEqual(wordsToUuid(null), null);
    assert.strictEqual(wordsToUuid({ w1: 1, w2: 2, w3: 3 }), null);
    assert.strictEqual(wordsToUuid({ w1: 1.5, w2: 2, w3: 3, w4: 4 }), null);
    assert.strictEqual(wordsToUuid({ w1: 4294967296, w2: 0, w3: 0, w4: 0 }), null);
    assert.strictEqual(wordsToUuid({ w1: -2147483649, w2: 0, w3: 0, w4: 0 }), null);
});

test('only an object with exactly the four words counts as one', (t) => {
    assert.ok(isWords({ w1: 0, w2: 0, w3: 0, w4: 0 }));
    assert.ok(!isWords({ w1: 0, w2: 0, w3: 0 }));
    assert.ok(!isWords({ w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 }));
    assert.ok(!isWords({ high: 0, low: 0 }));
    assert.ok(!isWords([0, 0, 0, 0]));
    assert.ok(!isWords(null));
});

test('a negative word can only have been written signed', (t) => {
    assert.strictEqual(wordsIntType({ w1: 1, w2: 2, w3: 3, w4: -559038737 }), 'signed');
});

test('a word above the int32 range can only have been written unsigned', (t) => {
    assert.strictEqual(wordsIntType({ w1: 1, w2: 2, w3: 3, w4: 3735928559 }), 'unsigned');
});

test('words that fit in both readings name neither', (t) => {
    assert.strictEqual(wordsIntType({ w1: 1, w2: 2, w3: 3, w4: 4 }), null);
    assert.strictEqual(wordsIntType({ w1: 0, w2: 0, w3: 0, w4: 2147483647 }), null);
});

test('anything that is not four words names nothing', (t) => {
    assert.strictEqual(wordsIntType({ high: -1, low: -1 }), null);
    assert.strictEqual(wordsIntType(null), null);
    assert.strictEqual(wordsIntType({ w1: 'x', w2: 2, w3: 3, w4: 4 }), null);
});
