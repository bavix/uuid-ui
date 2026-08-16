import assert from 'node:assert';
import test from 'node:test';
import {bytesToUuid, uuidToBytes, uuidToBytesString} from "../src/uuid-bytes.js";
import {intsToUuid, uintsToUuid, uuidToInts, uuidToUints} from "../src/uuid-high-low.js";
import {uuidToBase64Std} from "../src/base64.js";
import {objectParse} from "../src/object-parser.js";
import {ulidToUuid, uuidToUlid} from "../src/uuid-ulid.js";

test('uuidToBytes rejects non-hex payloads', (t) => {
    // Used to survive the [^a-z0-9] filter and decode to 16 x NaN.
    assert.strictEqual(uuidToBytes('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz'), null);
    assert.strictEqual(uuidToBytes('gc5b2444-70a0-4932-980c-b4dc0d3f02b5'), null);
    assert.strictEqual(uuidToBytes('0c5b2444-70a0-4932-980c-b4dc0d3f02'), null);
    assert.strictEqual(uuidToBytes(''), null);
    assert.strictEqual(uuidToBytes(null), null);
    assert.strictEqual(uuidToBytes(undefined), null);

    assert.strictEqual(uuidToBytesString('not a uuid'), null);
    assert.strictEqual(uuidToBase64Std('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz'), null);
});

test('uuidToBytes still accepts arbitrary separators', (t) => {
    const expected = uuidToBytes('0c5b244470a04932980cb4dc0d3f02b5');

    assert.deepStrictEqual(uuidToBytes('0c5b2444-70a0-4932-980c-b4dc0d3f02b5'), expected);
    assert.deepStrictEqual(uuidToBytes('0c5b2444:70a0:4932:980c:b4dc0d3f02b5'), expected);
    assert.deepStrictEqual(uuidToBytes('{0C5B2444-70A0-4932-980C-B4DC0D3F02B5}'), expected);
});

test('bytesToUuid rejects malformed byte arrays', (t) => {
    assert.strictEqual(bytesToUuid([]), null);
    assert.strictEqual(bytesToUuid([1, 2, 3]), null);
    assert.strictEqual(bytesToUuid(new Array(16).fill(NaN)), null);
    assert.strictEqual(bytesToUuid(new Array(16).fill(256)), null);
    assert.strictEqual(bytesToUuid(new Array(16).fill(-1)), null);
    assert.strictEqual(bytesToUuid(null), null);

    assert.strictEqual(
        bytesToUuid(new Array(16).fill(0)),
        '00000000-0000-0000-0000-000000000000',
    );
});

test('high/low conversions return null instead of throwing', (t) => {
    // The old null check ran after .map(), so these threw a TypeError that the
    // UI swallowed, dropping the line with no feedback at all.
    assert.strictEqual(uuidToInts('nope'), null);
    assert.strictEqual(uuidToUints('nope'), null);

    assert.strictEqual(intsToUuid(undefined, undefined), null);
    assert.strictEqual(uintsToUuid(undefined, undefined), null);
    assert.strictEqual(intsToUuid('abc', '0'), null);
    assert.strictEqual(uintsToUuid('0', 'abc'), null);
});

test('objectParse rejects objects without integer high/low', (t) => {
    // typeDetector used to classify all of these as high-low.
    for (const input of ['123', '{a:1}', '{high: 1}', '{"high":"x","low":"1"}', 'null']) {
        assert.throws(() => objectParse(input), undefined, `expected throw for ${input}`);
    }

    assert.deepStrictEqual(objectParse('{high: 1, low: 2}'), {high: '1', low: '2'});
});

test('ULID conversions reject malformed input', (t) => {
    // A non-hex "uuid" used to encode to a plausible all-zero ULID.
    assert.strictEqual(uuidToUlid('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz'), null);
    assert.strictEqual(uuidToUlid('nope'), null);
    assert.strictEqual(uuidToUlid(null), null);

    assert.strictEqual(ulidToUuid('not-a-ulid'), null);
    assert.strictEqual(ulidToUuid('IIIIIIIIIIIIIIIIIIIIIIIIII'), null);
    assert.strictEqual(ulidToUuid(''), null);
});
