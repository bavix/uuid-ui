import assert from 'node:assert';
import test from 'node:test';
import { fieldsFor } from '../src/lab.js';

/** Every bit belongs to exactly one field, and the boundaries match the RFC. */
function coverage(version) {
    const fields = fieldsFor(version);
    const owner = new Array(128).fill(null);

    for (const [from, to, , label] of fields) {
        for (let i = from; i <= to; i++) {
            assert.strictEqual(owner[i], null, `bit ${i} claimed twice in v${version}`);
            owner[i] = label;
        }
    }

    return owner;
}

test('every version covers all 128 bits exactly once', (t) => {
    for (const version of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const owner = coverage(version);
        const unclaimed = owner.reduce((n, value) => (value === null ? n + 1 : n), 0);
        assert.strictEqual(unclaimed, 0, `v${version} leaves ${unclaimed} bits unassigned`);
    }
});

test('version and variant sit where the standard puts them', (t) => {
    for (const version of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const owner = coverage(version);

        for (let i = 48; i <= 51; i++) {
            assert.strictEqual(owner[i], 'version', `v${version} bit ${i}`);
        }

        assert.strictEqual(owner[64], 'variant');
        assert.strictEqual(owner[65], 'variant');
    }
});

test('v1 and v6 carry the same fields in a different order (5.1, 5.6)', (t) => {
    const v1 = coverage(1);
    const v6 = coverage(6);

    assert.strictEqual(v1[0], 'time_low');
    assert.strictEqual(v1[32], 'time_mid');
    assert.strictEqual(v1[52], 'time_high');

    assert.strictEqual(v6[0], 'time_high');
    assert.strictEqual(v6[32], 'time_mid');
    assert.strictEqual(v6[52], 'time_low');

    for (const owner of [v1, v6]) {
        assert.strictEqual(owner[66], 'clock_seq');
        assert.strictEqual(owner[80], 'node');
        assert.strictEqual(owner[127], 'node');
    }
});

test('v7 is 48 bits of Unix milliseconds, then rand_a and rand_b (5.7)', (t) => {
    const owner = coverage(7);

    assert.strictEqual(owner[0], 'unix_ts_ms');
    assert.strictEqual(owner[47], 'unix_ts_ms');
    assert.strictEqual(owner[52], 'rand_a');
    assert.strictEqual(owner[63], 'rand_a');
    assert.strictEqual(owner[66], 'rand_b');
    assert.strictEqual(owner[127], 'rand_b');
});

test('v2 trades time_low for a local id and half the clock for a domain (5.2)', (t) => {
    const owner = coverage(2);

    assert.strictEqual(owner[0], 'local_id');
    assert.strictEqual(owner[31], 'local_id');
    assert.strictEqual(owner[32], 'time_mid');
    assert.strictEqual(owner[66], 'clock_seq_hi');
    assert.strictEqual(owner[71], 'clock_seq_hi');
    assert.strictEqual(owner[72], 'local_domain');
    assert.strictEqual(owner[79], 'local_domain');
});

test('v8 is custom everywhere the standard does not speak (5.8)', (t) => {
    const owner = coverage(8);

    assert.strictEqual(owner[0], 'custom_a');
    assert.strictEqual(owner[47], 'custom_a');
    assert.strictEqual(owner[52], 'custom_b');
    assert.strictEqual(owner[66], 'custom_c');
    assert.strictEqual(owner[127], 'custom_c');
});
