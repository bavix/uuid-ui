import assert from 'node:assert';
import test from 'node:test';
import { readStoredTheme, writeStoredTheme } from '../src/theme.js';

function storageOf(value) {
    const store = new Map();

    if (value !== undefined) {
        store.set('theme', value);
    }

    return {
        getItem: k => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, v),
        read: () => store.get('theme'),
    };
}

test('the words read as themes', (t) => {
    assert.strictEqual(readStoredTheme(storageOf('dark')), true);
    assert.strictEqual(readStoredTheme(storageOf('light')), false);
});

test('what the old build wrote still reads', (t) => {
    assert.strictEqual(readStoredTheme(storageOf('true')), true);
    assert.strictEqual(readStoredTheme(storageOf('false')), false);
});

test('nothing stored, or nonsense, is not a preference', (t) => {
    assert.strictEqual(readStoredTheme(storageOf()), null);
    assert.strictEqual(readStoredTheme(storageOf('')), null);
    assert.strictEqual(readStoredTheme(storageOf('midnight')), null);
});

test('writing stores the word, and replaces a legacy value', (t) => {
    const storage = storageOf('true');

    writeStoredTheme(false, storage);
    assert.strictEqual(storage.read(), 'light');
    assert.strictEqual(readStoredTheme(storage), false);

    writeStoredTheme(true, storage);
    assert.strictEqual(storage.read(), 'dark');
});

test('a storage that refuses to answer is not a crash', (t) => {
    const blocked = {
        getItem: () => { throw new Error('blocked'); },
        setItem: () => { throw new Error('blocked'); },
    };

    assert.strictEqual(readStoredTheme(blocked), null);
    assert.doesNotThrow(() => writeStoredTheme(true, blocked));
});
