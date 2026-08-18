import assert from 'node:assert';
import test from 'node:test';
import {v1, v6, v7, NIL, v4} from 'uuid';
import {timestampFromUlid, timestampFromUuid} from "../src/uuid-timestamp.js";
import {uuidToUlid} from "../src/uuid-ulid.js";

const MSECS = 1700000000000; // 2023-11-14T22:13:20.000Z
const EXPECTED = new Date(MSECS).toISOString();

test('timestampFromUuid reads v1 timestamps', (t) => {
    // The previous implementation shifted by 32/16 instead of 48/32 and
    // multiplied by 10000 instead of dividing, landing in the year 2255.
    assert.strictEqual(timestampFromUuid(v1({msecs: MSECS, nsecs: 0})), EXPECTED);
    assert.strictEqual(timestampFromUuid(v1({msecs: 0, nsecs: 0})), '1970-01-01T00:00:00.000Z');
});

test('timestampFromUuid reads v6 timestamps', (t) => {
    // clock_seq bits used to leak into the time value.
    assert.strictEqual(timestampFromUuid(v6({msecs: MSECS, nsecs: 0})), EXPECTED);
    assert.strictEqual(timestampFromUuid(v6({msecs: 0, nsecs: 0})), '1970-01-01T00:00:00.000Z');
});

test('timestampFromUuid reads v7 timestamps', (t) => {
    assert.strictEqual(timestampFromUuid(v7({msecs: MSECS})), EXPECTED);
});

test('timestampFromUuid is case and separator insensitive', (t) => {
    const uuid = v7({msecs: MSECS});

    assert.strictEqual(timestampFromUuid(uuid.toUpperCase()), EXPECTED);
    assert.strictEqual(timestampFromUuid(uuid.replace(/-/g, '')), EXPECTED);
});

test('timestampFromUuid returns null for timeless or invalid input', (t) => {
    assert.strictEqual(timestampFromUuid(v4()), null);
    assert.strictEqual(timestampFromUuid(NIL), null);
    assert.strictEqual(timestampFromUuid('not a uuid'), null);
    assert.strictEqual(timestampFromUuid(''), null);
    assert.strictEqual(timestampFromUuid(null), null);
});

test('timestampFromUlid accepts both cases', (t) => {
    const ulid = uuidToUlid(v7({msecs: MSECS}));

    assert.strictEqual(timestampFromUlid(ulid), EXPECTED);
    // Lowercase ULIDs pass isValid(), so they must resolve identically.
    assert.strictEqual(timestampFromUlid(ulid.toLowerCase()), EXPECTED);
});

test('timestampFromUlid returns null for invalid input', (t) => {
    assert.strictEqual(timestampFromUlid('IIIIIIIIII0000000000000000'), null);
    assert.strictEqual(timestampFromUlid('short'), null);
    assert.strictEqual(timestampFromUlid(null), null);
});

test('the clock is read whichever way the identifier is spelled', async (t) => {
    const uuid = '018f3c00-1122-7000-8000-0000deadbeef';
    const expected = timestampFromUuid(uuid);

    assert.ok(expected);

    for (const written of [
        uuid.toUpperCase(),
        uuid.replace(/-/g, ''),
        `{${uuid}}`,
        `{${uuid.toUpperCase()}}`,
        `urn:uuid:${uuid}`,
        `  urn:uuid:${uuid.toUpperCase()}  `,
    ]) {
        assert.strictEqual(timestampFromUuid(written), expected, written);
    }
});

test('a spelling that is not an identifier still reads as no clock', async (t) => {
    assert.strictEqual(timestampFromUuid('{not a uuid}'), null);
    assert.strictEqual(timestampFromUuid('urn:uuid:'), null);
    assert.strictEqual(timestampFromUuid(''), null);
});
