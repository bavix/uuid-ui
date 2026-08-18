import assert from 'node:assert';
import test from 'node:test';
import { uuidFormatter } from '../src/uuid-formatter.js';

test('thirty-two hex digits get their dashes back', async (t) => {
    assert.strictEqual(
        uuidFormatter('71a46cec48094cc596895b0441b46186'),
        '71a46cec-4809-4cc5-9689-5b0441b46186',
    );
});

test('anything else is handed back untouched', async (t) => {
    const dashed = '71a46cec-4809-4cc5-9689-5b0441b46186';

    assert.strictEqual(uuidFormatter(dashed), dashed);
    assert.strictEqual(uuidFormatter(''), '');
    assert.strictEqual(uuidFormatter('short'), 'short');
    assert.strictEqual(uuidFormatter('0'.repeat(33)), '0'.repeat(33));
});

test('the dashes go by position, not by what the characters are', async (t) => {
    assert.strictEqual(uuidFormatter('z'.repeat(32)), 'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz');
});
