import assert from 'node:assert';
import test from 'node:test';
import { favoriteKey, itemKey } from '../src/data/keys.js';

test('a row is known by both of its sides', async (t) => {
    assert.strictEqual(itemKey({ input: 'a', output: 'b' }), 'a:b');
    assert.notStrictEqual(
        itemKey({ input: 'a', output: 'b' }),
        itemKey({ input: 'a', output: 'c' }),
        'the same input written two ways is two rows',
    );
});

test('the same identifier converted to two formats is two rows', async (t) => {
    const uuid = '71a46cec-4809-4cc5-9689-5b0441b46186';

    assert.notStrictEqual(
        itemKey({ input: uuid, output: '{"high":1,"low":2}' }),
        itemKey({ input: uuid, output: 'caRs7EgJTMWWiVsEQbRhhg==' }),
    );
});

test('a favourite is a row under one tag', async (t) => {
    const row = { input: 'a', output: 'b' };

    assert.strictEqual(favoriteKey('billing', row), 'billing a:b');
    assert.notStrictEqual(favoriteKey('billing', row), favoriteKey('invoices', row));
});
