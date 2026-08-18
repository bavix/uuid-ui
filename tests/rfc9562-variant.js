import assert from 'node:assert';
import test from 'node:test';
import { variantOf } from '../src/lab.js';
import { specialValues } from '../src/special-values.js';

/** Table 1 of RFC 9562, read off the first nibble of octet 8. */
const at = (nibble) => variantOf(`0000000000000000${nibble}000000000000000`);

test('0xxx is the NCS range', (t) => {
    for (const nibble of ['0', '1', '2', '3', '4', '5', '6', '7']) {
        assert.match(at(nibble), /^NCS/, `nibble ${nibble}`);
    }
});

test('10xx is this standard', (t) => {
    for (const nibble of ['8', '9', 'a', 'b']) {
        assert.strictEqual(at(nibble), 'RFC 9562 (10xx)', `nibble ${nibble}`);
    }
});

test('110x is the Microsoft range', (t) => {
    for (const nibble of ['c', 'd']) {
        assert.match(at(nibble), /^Microsoft/, `nibble ${nibble}`);
    }
});

test('111x is reserved, and holds the Max UUID', (t) => {
    for (const nibble of ['e', 'f']) {
        assert.match(at(nibble), /reserved for the future/, `nibble ${nibble}`);
    }
});

test('the Nil UUID falls in NCS, the Max UUID in the reserved range', (t) => {
    assert.match(variantOf('0'.repeat(32)), /^NCS/);
    assert.match(variantOf('f'.repeat(32)), /reserved for the future/);
});

test('a marker survives every spelling of the same identifier', async (t) => {
    const far = '0699e991-a800-7000-8000-0000deadbeef';

    for (const written of [far, far.toUpperCase(), far.replace(/-/g, ''), `{${far}}`, `urn:uuid:${far}`]) {
        assert.ok(specialValues(written).includes('time traveler'), written);
    }

    for (const written of ['00000000-0000-0000-0000-000000000000', '{00000000-0000-0000-0000-000000000000}', 'urn:uuid:00000000-0000-0000-0000-000000000000']) {
        const markers = specialValues(written);

        assert.ok(markers.includes('nil'), written);
        assert.ok(!markers.includes('non-rfc'), `${written} is named by the standard, not outside it`);
    }
});
