import assert from 'node:assert';
import test from 'node:test';
import { DATA_KEY, createDataStore } from '../src/data/store.js';
import { LEGACY_KEYS, migrate } from '../src/data/migrate.js';
import { storageOf } from './storage-double.js';

const NOW = 1_755_330_000_000;

function oldProfile(extra = {}) {
    return storageOf({
        uuidItems: JSON.stringify([{ input: 'a', output: 'a-out', info: '', at: NOW }]),
        uuidFavorites: JSON.stringify({ test: { at: NOW, items: [{ input: 'a', output: 'a-out', info: '', at: NOW }] } }),
        uuidDeletions: JSON.stringify({ items: { 'gone:gone-out': NOW }, favorites: {}, clearedAt: NOW - 5000 }),
        uuidSettingsAt: JSON.stringify({ uuidType: NOW, theme: NOW - 1000 }),
        uuidType: 'base64',
        theme: 'dark',
        ...extra,
    });
}

test('an old profile is carried over whole', async (t) => {
    const storage = oldProfile();

    assert.strictEqual(migrate(storage), true);

    const store = createDataStore({ storage, clock: () => NOW });
    const data = store.snapshot();

    assert.deepStrictEqual(data.items.map(item => item.input), ['a']);
    assert.deepStrictEqual(data.favorites.test.items.map(item => item.input), ['a']);
    assert.deepStrictEqual(data.tombstones, { 'gone:gone-out': NOW });
    assert.strictEqual(data.clearedAt, NOW - 5000);
    assert.deepStrictEqual(data.settings.uuidType, { value: 'base64', at: NOW });
    assert.deepStrictEqual(data.settings.theme, { value: 'dark', at: NOW - 1000 });
});

test('the old keys go only once the new one is safely down', async (t) => {
    const storage = oldProfile();

    migrate(storage);

    for (const key of LEGACY_KEYS) {
        assert.strictEqual(storage.getItem(key), null, `${key} was cleared away`);
    }

    assert.ok(storage.getItem(DATA_KEY), 'the new key holds everything now');
});

test('the theme keeps its own key, because the page reads it before the bundle', async (t) => {
    const storage = oldProfile();

    migrate(storage);

    assert.strictEqual(storage.getItem('theme'), 'dark');
});

test('a profile that cannot be written keeps every old key', async (t) => {
    const storage = oldProfile();
    const inner = storage.setItem;

    storage.setItem = () => { throw new Error('quota'); };

    assert.strictEqual(migrate(storage), false);

    storage.setItem = inner;

    for (const key of LEGACY_KEYS) {
        assert.ok(storage.getItem(key), `${key} is still there`);
    }
});

test('a write that silently does not stick leaves the old keys alone', async (t) => {
    const storage = oldProfile();

    storage.setItem = () => {};

    assert.strictEqual(migrate(storage), false);
    assert.strictEqual(storage.getItem(DATA_KEY), null);
    assert.ok(storage.getItem('uuidItems'));
});

test('migrating twice does nothing the second time', async (t) => {
    const storage = oldProfile();

    assert.strictEqual(migrate(storage), true);

    const body = storage.getItem(DATA_KEY);

    assert.strictEqual(migrate(storage), false);
    assert.strictEqual(storage.getItem(DATA_KEY), body);
});

test('a fresh profile has nothing to carry over', async (t) => {
    const storage = storageOf();

    assert.strictEqual(migrate(storage), false);
    assert.strictEqual(storage.getItem(DATA_KEY), null);
});

test('a profile with only a theme is left as a fresh start', async (t) => {
    const storage = storageOf({ theme: 'dark' });

    assert.strictEqual(migrate(storage), false);
    assert.strictEqual(storage.getItem('theme'), 'dark');
});

test('rubbish in the old keys does not stop the move', async (t) => {
    const storage = oldProfile({ uuidItems: 'not json', uuidDeletions: '{{' });

    assert.strictEqual(migrate(storage), true);

    const store = createDataStore({ storage, clock: () => NOW });

    assert.deepStrictEqual(store.snapshot().items, []);
    assert.deepStrictEqual(store.snapshot().favorites.test.items.map(item => item.input), ['a']);
});
