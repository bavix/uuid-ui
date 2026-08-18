import assert from 'node:assert';
import test from 'node:test';
import { EGGS_KEY, forgetEggs, foundEggs, markFound } from '../src/eggs-found.js';
import { storageOf } from './storage-double.js';

test('an egg found once is remembered', async (t) => {
    const storage = storageOf();

    assert.strictEqual(markFound('mines', storage), true);
    assert.strictEqual(markFound('mines', storage), false, 'the same one is not written twice');
    assert.deepStrictEqual([...foundEggs(storage)], ['mines']);
});

test('the list keeps its order and holds several', async (t) => {
    const storage = storageOf();

    markFound('mines', storage);
    markFound('rain', storage);
    markFound('sudo', storage);

    assert.deepStrictEqual(JSON.parse(storage.getItem(EGGS_KEY)), ['mines', 'rain', 'sudo']);
});

test('nothing found reads as nothing, and rubbish does too', async (t) => {
    assert.deepStrictEqual([...foundEggs(storageOf())], []);
    assert.deepStrictEqual([...foundEggs(storageOf({ [EGGS_KEY]: 'not json' }))], []);
    assert.deepStrictEqual([...foundEggs(storageOf({ [EGGS_KEY]: '{"mines":true}' }))], []);
});

test('an empty name is not an egg', async (t) => {
    const storage = storageOf();

    assert.strictEqual(markFound('', storage), false);
    assert.strictEqual(markFound(null, storage), false);
    assert.deepStrictEqual([...foundEggs(storage)], []);
});

test('storage that refuses to be written loses nothing else', async (t) => {
    const storage = storageOf();

    storage.setItem = () => { throw new Error('quota'); };

    assert.strictEqual(markFound('mines', storage), false);
    assert.deepStrictEqual([...foundEggs(storage)], []);
});

test('the list can be forgotten', async (t) => {
    const storage = storageOf();

    markFound('mines', storage);
    forgetEggs(storage);

    assert.deepStrictEqual([...foundEggs(storage)], []);
});
