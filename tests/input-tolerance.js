import assert from 'node:assert';
import test from 'node:test';
import {v4, v7} from 'uuid';
import {base64ToUuid, base64UrlToStd, normalizeBase64, uuidToBase64Std} from "../src/base64.js";
import {uuidToBytes, uuidToHex} from "../src/uuid-bytes.js";
import {TYPE_BASE64, TYPE_UUID, typeDetector} from "../src/type-detector.js";
import {hexWordUuid, randomPalindromeUuid, specialValues} from "../src/special-values.js";
import {detectIntType, toUuid} from "../src/to-uuid.js";
import {SIGNED, UNSIGNED} from "../src/int-type.js";

const toUrlSafe = std => std.replace(/\+/g, '-').replace(/\//g, '_');
const unpadded = std => toUrlSafe(std).replace(/=+$/, '');

test('base64url is detected and decoded like standard base64', (t) => {
    for (let i = 0; i < 200; i++) {
        const uuid = v4();
        const std = uuidToBase64Std(uuid);

        for (const spelling of [toUrlSafe(std), unpadded(std)]) {
            assert.strictEqual(typeDetector(spelling), TYPE_BASE64, `not detected: ${spelling}`);
            assert.strictEqual(base64ToUuid(spelling), uuid, `not decoded: ${spelling}`);
            assert.strictEqual(normalizeBase64(spelling), std, `not normalized: ${spelling}`);
        }
    }
});

test('standard base64 keeps working untouched', (t) => {
    const uuid = '86e5bae4-ef58-4031-b34f-5e9ff914cd55';
    const std = uuidToBase64Std(uuid);

    assert.strictEqual(std, 'huW65O9YQDGzT16f+RTNVQ==');
    assert.strictEqual(typeDetector(std), TYPE_BASE64);
    assert.strictEqual(base64ToUuid(std), uuid);
    assert.strictEqual(normalizeBase64(std), std);
});

test('base64 helpers reject what is not base64', (t) => {
    assert.strictEqual(normalizeBase64('not base64!'), null);
    assert.strictEqual(normalizeBase64(''), null);
    assert.strictEqual(normalizeBase64(null), null);
    assert.strictEqual(base64ToUuid('---'), null);
    assert.strictEqual(base64UrlToStd('has spaces'), null);

    // Right alphabet, wrong length: 15 bytes is not a UUID.
    assert.strictEqual(normalizeBase64('AAAAAAAAAAAAAAAAAAAA'), null);
});

test('urn:uuid: prefixed identifiers are accepted', (t) => {
    const uuid = '71a46cec-4809-4cc5-9689-5b0441b46186';
    const expected = uuidToBytes(uuid);

    assert.deepStrictEqual(uuidToBytes(`urn:uuid:${uuid}`), expected);
    assert.deepStrictEqual(uuidToBytes(`URN:UUID:${uuid.toUpperCase()}`), expected);
    assert.strictEqual(typeDetector(`urn:uuid:${uuid}`), TYPE_UUID);

    // Still strict about the payload itself.
    assert.strictEqual(uuidToBytes('urn:uuid:zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz'), null);
});

test('the hex view round-trips back to the same uuid', (t) => {
    for (let i = 0; i < 200; i++) {
        const uuid = v4();
        const hex = uuidToHex(uuid);

        assert.match(hex, /^[0-9a-f]{32}$/);
        assert.deepStrictEqual(uuidToBytes(hex), uuidToBytes(uuid));
    }
});

test('the hex encoder refuses malformed input', (t) => {
    assert.strictEqual(uuidToHex('nope'), null);
    assert.strictEqual(uuidToHex(null), null);
    assert.strictEqual(uuidToHex('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz'), null);
});

test('nil and max are recognized in every spelling the app produces', (t) => {
    const nil = ['00000000-0000-0000-0000-000000000000', '00000000000000000000000000000000',
                 '00000000000000000000000000', '{"high":0,"low":0}',
                 '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]', 'AAAAAAAAAAAAAAAAAAAAAA=='];
    const max = ['ffffffff-ffff-ffff-ffff-ffffffffffff', 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
                 '7ZZZZZZZZZZZZZZZZZZZZZZZZZ', '{"high":-1,"low":-1}',
                 '{"high":18446744073709551615,"low":18446744073709551615}'];

    for (const value of nil) assert.deepStrictEqual(specialValues(value), ['nil', 'palindrome'], value);
    for (const value of max) assert.deepStrictEqual(specialValues(value), ['max', 'palindrome'], value);
});

test('ordinary identifiers are not special', (t) => {
    assert.deepStrictEqual(specialValues('0c5b2444-70a0-4932-980c-b4dc0d3f02b5'), []);
    assert.deepStrictEqual(specialValues(''), []);
    assert.deepStrictEqual(specialValues(null), []);

    // one bit away from nil, and a version nibble of 0: notable, just not nil
    assert.deepStrictEqual(specialValues('00000000-0000-0000-0000-000000000001'), ['non-rfc']);
});

test('hex folklore is recognized, in any spelling', (t) => {
    for (const word of ['deadbeef', 'cafebabe', 'feedface', 'deadc0de', 'badc0ffe', '8badf00d']) {
        const hex = word.repeat(4);
        const dashed = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;

        for (const spelling of [hex, dashed, dashed.toUpperCase(), `urn:uuid:${dashed}`]) {
            assert.strictEqual(specialValues(spelling)[0], word, spelling);
        }
    }
});

test('palindromes are recognized, and near-misses are not', (t) => {
    assert.ok(specialValues('01234567-89ab-cdef-fedc-ba9876543210').includes('palindrome'));
    assert.ok(specialValues('12345678-9abc-def0-0fed-cba987654321').includes('palindrome'));

    // one character off
    assert.ok(!specialValues('01234567-89ab-cdef-fedc-ba9876543211').includes('palindrome'));

    // nil and max are palindromes as well, and say so
    assert.deepStrictEqual(specialValues('00000000-0000-0000-0000-000000000000'), ['nil', 'palindrome']);
    assert.deepStrictEqual(specialValues('ffffffff-ffff-ffff-ffff-ffffffffffff'), ['max', 'palindrome']);
    assert.deepStrictEqual(specialValues('{"high":0,"low":0}'), ['nil', 'palindrome']);
});

test('what the generator produces is what the detector recognizes', (t) => {
    for (const word of ['deadbeef', 'cafebabe']) {
        assert.strictEqual(specialValues(hexWordUuid(word))[0], word);
    }

    assert.strictEqual(hexWordUuid('nope'), null);

    for (let i = 0; i < 500; i++) {
        const value = randomPalindromeUuid();
        assert.match(value, /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/, value);
        assert.ok(specialValues(value).includes('palindrome'), value);
    }
});

test('the integer type of a finished conversion is derived, not remembered', (t) => {
    const pair = '{"high":1,"low":2}';

    // the same pair, two readings, two different identifiers
    assert.strictEqual(detectIntType(pair, '01000000-0000-0000-0200-000000000000'), SIGNED);
    assert.strictEqual(detectIntType(pair, '00000000-0000-0001-0000-000000000002'), UNSIGNED);

    // and the same in the other direction
    const uuid = '0c5b2444-70a0-4932-980c-b4dc0d3f02b5';
    assert.strictEqual(detectIntType(uuid, '{"high":3623603779236289292,"low":-5403687274121261928}'), SIGNED);
    assert.strictEqual(detectIntType(uuid, '{"high":890345227701733682,"low":10956330850693612213}'), UNSIGNED);
});

test('unknowable readings report nothing rather than guessing', (t) => {
    // symmetric pairs read the same either way, so the distinction is empty
    assert.strictEqual(detectIntType('{"high":0,"low":0}', '00000000-0000-0000-0000-000000000000'), null);

    // high/low is not involved at all
    assert.strictEqual(detectIntType('71a46cec-4809-4cc5-9689-5b0441b46186', 'caRs7EgJTMWWiVsEQbRhhg=='), null);

    // the two sides simply do not describe the same identifier
    assert.strictEqual(detectIntType('{"high":1,"low":2}', 'ffffffff-ffff-ffff-ffff-ffffffffffff'), null);
    assert.strictEqual(detectIntType('nonsense', 'also nonsense'), null);
});

test('toUuid speaks every input format the app accepts', (t) => {
    const uuid = '0c5b2444-70a0-4932-980c-b4dc0d3f02b5';

    assert.strictEqual(toUuid(uuid, SIGNED), uuid);
    assert.strictEqual(toUuid(uuid.toUpperCase(), SIGNED), uuid);
    assert.strictEqual(toUuid(`urn:uuid:${uuid}`, SIGNED), uuid);
    assert.strictEqual(toUuid(uuidToHex(uuid), SIGNED), uuid);
    assert.strictEqual(toUuid('DFskRHCgSTKYDLTcDT8CtQ==', SIGNED), uuid);
    assert.strictEqual(toUuid('DFskRHCgSTKYDLTcDT8CtQ', SIGNED), uuid);
    assert.strictEqual(toUuid('[12,91,36,68,112,160,73,50,152,12,180,220,13,63,2,181]', SIGNED), uuid);
    assert.strictEqual(toUuid('01HKT2YXQ09WJXG1Y7Y6JR120V', SIGNED), '018cf42f-76e0-4f25-d807-c7f1a580881b');
    assert.strictEqual(toUuid('nonsense', SIGNED), null);
    assert.strictEqual(toUuid(null, SIGNED), null);
});

test('a shape that is not a UUID by the standard says so', (t) => {
    // version 0 and versions past 8 are not RFC 4122 versions
    assert.ok(specialValues('0c5b2444-70a0-0932-980c-b4dc0d3f02b5').includes('non-rfc'));
    assert.ok(specialValues('0c5b2444-70a0-f932-980c-b4dc0d3f02b5').includes('non-rfc'));

    // the variant bits have to be 10xx, i.e. 8..b in that position
    assert.ok(specialValues('0c5b2444-70a0-4932-080c-b4dc0d3f02b5').includes('non-rfc'));
    assert.ok(!specialValues('0c5b2444-70a0-4932-980c-b4dc0d3f02b5').includes('non-rfc'));

    // nil and max are named by the RFC itself, so they are never non-RFC
    assert.ok(!specialValues('00000000-0000-0000-0000-000000000000').includes('non-rfc'));
    assert.ok(!specialValues('ffffffff-ffff-ffff-ffff-ffffffffffff').includes('non-rfc'));
});

test('a clock pointing somewhere impossible is called out', (t) => {
    // a v7 whose timestamp field is all ones lands tens of thousands of years out
    assert.ok(specialValues('ffffffff-ffff-7fff-8fff-fffffffffffe').includes('time traveler'));
    // and one at the very start of the epoch predates the format itself
    assert.ok(specialValues('00000000-0000-7000-8000-000000000001').includes('time traveler'));

    // a normal v7 minted now is not a traveler
    assert.ok(!specialValues(v7()).includes('time traveler'));
    assert.ok(!specialValues(v4()).includes('time traveler'));
});
