import assert from 'node:assert';
import test from 'node:test';
import { SIGNED, UNSIGNED } from '../src/int-type.js';
import { detectIntPair, detectIntType, intTypeOfValue, toUuid } from '../src/to-uuid.js';
import { uuidToUints } from '../src/uuid-high-low.js';
import { uuidToWords, wordsToUuid } from '../src/uuid-words.js';

test('a value says its own reading when the numbers can only be one', async (t) => {
    assert.strictEqual(intTypeOfValue('{"w1":-1,"w2":0,"w3":0,"w4":0}'), SIGNED);
    assert.strictEqual(intTypeOfValue('{"w1":4294967295,"w2":0,"w3":0,"w4":0}'), UNSIGNED);
    assert.strictEqual(intTypeOfValue('{"high":-1,"low":0}'), SIGNED);
    assert.strictEqual(intTypeOfValue('{"high":9223372036854775808,"low":0}'), UNSIGNED);
});

test('a value that fits both readings says nothing', async (t) => {
    assert.strictEqual(intTypeOfValue('{"w1":1,"w2":2,"w3":3,"w4":4}'), null);
    assert.strictEqual(intTypeOfValue('{"high":1,"low":0}'), null);
    assert.strictEqual(intTypeOfValue('71a46cec-4809-4cc5-9689-5b0441b46186'), null);
    assert.strictEqual(intTypeOfValue('nonsense'), null);
});

test('the two sides of one row can be written in different readings', async (t) => {
    const input = '{"w1":-1,"w2":-2,"w3":-3,"w4":-4}';
    const output = '{"w1":4294967295,"w2":4294967294,"w3":4294967293,"w4":4294967292}';

    assert.strictEqual(intTypeOfValue(input), SIGNED, 'the side written with negatives is signed');
    assert.strictEqual(intTypeOfValue(output), UNSIGNED, 'the side written past the signed range is unsigned');
    assert.strictEqual(detectIntType(input, output), SIGNED, 'the row still has one reading for its bits');
});

test('one pair, read at one end and written at the other, keeps its identifier', async (t) => {
    const pair = '{"high":1,"low":1}';
    const uuid = toUuid(pair, SIGNED);

    assert.strictEqual(uuid, '01000000-0000-0000-0100-000000000000');
    assert.deepStrictEqual(uuidToUints(uuid), { high: '72057594037927936', low: '72057594037927936' });
    assert.strictEqual(toUuid(JSON.stringify(uuidToUints(uuid)), UNSIGNED), uuid, 'the written pair still names it');
});

test('the same pair read at the other end names a different identifier', async (t) => {
    const pair = '{"high":1,"low":1}';

    assert.notStrictEqual(toUuid(pair, SIGNED), toUuid(pair, UNSIGNED));
    assert.strictEqual(toUuid(pair, UNSIGNED), '00000000-0000-0001-0000-000000000001');
});

test('words are written at whichever end is asked for, over the same bytes', async (t) => {
    const uuid = '018f3c00-1122-7000-8000-0000deadbeef';

    assert.deepStrictEqual(uuidToWords(uuid, true), { w1: 26164224, w2: 287469568, w3: -2147483648, w4: -559038737 });
    assert.deepStrictEqual(uuidToWords(uuid, false), { w1: 26164224, w2: 287469568, w3: 2147483648, w4: 3735928559 });
    assert.strictEqual(wordsToUuid(uuidToWords(uuid, true)), wordsToUuid(uuidToWords(uuid, false)));
});

test('the shorthand spellings carry their reading like the object does', async (t) => {
    assert.strictEqual(intTypeOfValue('-1;2'), SIGNED);
    assert.strictEqual(intTypeOfValue('9223372040590704367;1'), UNSIGNED);
    assert.strictEqual(intTypeOfValue('1;1'), null);
    assert.strictEqual(intTypeOfValue('-1;-2;-3;-4'), SIGNED);
    assert.strictEqual(intTypeOfValue('4294967295;0;0;0'), UNSIGNED);
    assert.strictEqual(intTypeOfValue('1;2;3;4'), null);
});

test('a row written in shorthand still has one reading for its bits', async (t) => {
    const input = '{"w1":-1,"w2":-2,"w3":-3,"w4":-4}';
    const output = '4294967295;4294967294;4294967293;4294967292';

    assert.strictEqual(detectIntType(input, output), SIGNED);
    assert.strictEqual(intTypeOfValue(output), UNSIGNED);
});

test('a side that proves itself settles the other one', async (t) => {
    const held = detectIntPair('{"high":1,"low":2000000}', '{"high":72057594037927936,"low":9260559719129415680}');

    assert.strictEqual(held.write, UNSIGNED, 'a value past the signed range can only be unsigned');
    assert.strictEqual(held.read, SIGNED, 'and that leaves one reading for the other side');
});

test('a row that two readings fit equally says nothing at all', async (t) => {
    const held = detectIntPair('{"high":1,"low":1}', '{"high":72057594037927936,"low":72057594037927936}');

    assert.strictEqual(held.read, null);
    assert.strictEqual(held.write, null);
});

test('a row read and written the same way names both sides', async (t) => {
    const held = detectIntPair('{"high":1,"low":9}', '01000000-0000-0000-0900-000000000000');

    assert.strictEqual(held.read, SIGNED);
    assert.strictEqual(held.write, SIGNED);
});

test('rows with no integers anywhere are answered without parsing them', async (t) => {
    const held = detectIntPair('71a46cec-4809-4cc5-9689-5b0441b46186', '71a46cec48094cc596895b0441b46186');

    assert.strictEqual(held.read, null);
    assert.strictEqual(held.write, null);
});

test('asking twice for the same row gives the same answer', async (t) => {
    const first = detectIntPair('{"high":1,"low":9}', '01000000-0000-0000-0900-000000000000');
    const again = detectIntPair('{"high":1,"low":9}', '01000000-0000-0000-0900-000000000000');

    assert.deepStrictEqual(first, again);
    assert.strictEqual(first.read, SIGNED);
});
