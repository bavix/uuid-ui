import assert from 'node:assert';
import test from 'node:test';
import { variantOf } from '../src/lab.js';

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
