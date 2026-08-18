import assert from 'node:assert';
import test from 'node:test';
import { SIGNED, UNSIGNED } from '../src/int-type.js';
import { cleanConvention, readingName, readingOf, readingsFor } from '../src/int-convention.js';
import { createDataStore } from '../src/data/store.js';
import { buildSnapshot, mergeSnapshot, parseSnapshot } from '../src/sync/snapshot.js';
import { storageOf } from './storage-double.js';

const NOW = 1_755_330_000_000;
const row = (extra = {}) => ({ input: '{"high":1,"low":1}', output: '{"high":72057594037927936,"low":72057594037927936}', info: '', ...extra });

test('a reading has one name and one value', async (t) => {
    assert.strictEqual(readingName(SIGNED), 'signed');
    assert.strictEqual(readingName(UNSIGNED), 'unsigned');
    assert.strictEqual(readingName(null), null);
    assert.strictEqual(readingOf('unsigned'), UNSIGNED);
    assert.strictEqual(readingOf('nonsense'), null);
    assert.strictEqual(readingOf(null), null);
});

test('only the two readings are kept, anything else is dropped', async (t) => {
    assert.deepStrictEqual(cleanConvention({ readAs: 'signed', writeAs: 'unsigned' }), { readAs: 'signed', writeAs: 'unsigned' });
    assert.deepStrictEqual(cleanConvention({ readAs: 'sideways' }), {});
    assert.deepStrictEqual(cleanConvention({}), {});
    assert.deepStrictEqual(cleanConvention(null), {});
});

test('a row keeps the readings it was made with', async (t) => {
    const store = createDataStore({ storage: storageOf(), clock: () => NOW });

    store.setRows([row({ readAs: 'signed', writeAs: 'unsigned' })]);

    const held = store.snapshot().items[0];

    assert.strictEqual(held.readAs, 'signed');
    assert.strictEqual(held.writeAs, 'unsigned');
});

test('the readings survive the trip to a store and back', async (t) => {
    const store = createDataStore({ storage: storageOf(), clock: () => NOW });

    store.setRows([row({ readAs: 'unsigned', writeAs: 'signed' })]);

    const snapshot = buildSnapshot(store.snapshot(), NOW);
    const back = parseSnapshot(JSON.stringify(snapshot), NOW);

    assert.strictEqual(back.items[0].readAs, 'unsigned');
    assert.strictEqual(back.items[0].writeAs, 'signed');
});

test('a merge keeps the readings of the row it kept', async (t) => {
    const store = createDataStore({ storage: storageOf(), clock: () => NOW });

    store.setRows([row({ readAs: 'signed', writeAs: 'unsigned' })]);

    const mine = buildSnapshot(store.snapshot(), NOW);
    const merged = mergeSnapshot(mine, buildSnapshot({ items: [], favorites: {}, tombstones: {}, favoriteTombstones: {}, clearedAt: 0, settings: {} }, NOW), NOW);

    assert.strictEqual(merged.items[0].readAs, 'signed');
    assert.strictEqual(merged.items[0].writeAs, 'unsigned');
});

test('a row written before the readings were kept simply has none', async (t) => {
    const store = createDataStore({ storage: storageOf(), clock: () => NOW });

    store.setRows([row()]);

    const held = store.snapshot().items[0];

    assert.strictEqual(held.readAs, undefined);
    assert.strictEqual(held.writeAs, undefined);
});

test('a starred row keeps the readings the conversion had', async (t) => {
    const store = createDataStore({ storage: storageOf(), clock: () => NOW });

    store.setTags({ work: { items: [row({ readAs: 'signed', writeAs: 'unsigned' })] } });

    const held = store.snapshot().favorites.work.items[0];

    assert.strictEqual(held.readAs, 'signed');
    assert.strictEqual(held.writeAs, 'unsigned');
});

test('the readings ride along into a tag and back out of a snapshot', async (t) => {
    const store = createDataStore({ storage: storageOf(), clock: () => NOW });

    store.setTags({ work: { items: [row({ readAs: 'unsigned', writeAs: 'signed' })] } });

    const back = parseSnapshot(JSON.stringify(buildSnapshot(store.snapshot(), NOW)), NOW);
    const held = back.favorites.work.items[0];

    assert.strictEqual(held.readAs, 'unsigned');
    assert.strictEqual(held.writeAs, 'signed');
});

test('a row that changes its reading keeps the newer one after a merge', async (t) => {
    const older = buildSnapshot({
        items: [{ ...row({ readAs: 'signed', writeAs: 'unsigned' }), at: NOW - 1000 }],
        favorites: {}, tombstones: {}, favoriteTombstones: {}, clearedAt: 0, settings: {},
    }, NOW);
    const newer = buildSnapshot({
        items: [{ ...row({ readAs: 'unsigned', writeAs: 'signed' }), at: NOW }],
        favorites: {}, tombstones: {}, favoriteTombstones: {}, clearedAt: 0, settings: {},
    }, NOW);

    const merged = mergeSnapshot(older, newer, NOW);

    assert.strictEqual(merged.items.length, 1);
    assert.strictEqual(merged.items[0].readAs, 'unsigned');
    assert.strictEqual(merged.items[0].writeAs, 'signed');
});

test('what the values say outranks what the settings said', async (t) => {
    const stored = { read: 'unsigned', write: 'unsigned' };

    assert.deepStrictEqual(
        readingsFor(stored, { read: 'signed', write: null }),
        { read: 'signed', write: 'unsigned' },
        'a negative pair is signed however it was read',
    );

    assert.deepStrictEqual(
        readingsFor(stored, { read: null, write: null }),
        { read: 'unsigned', write: 'unsigned' },
        'when both readings fit, the row keeps what it was converted under',
    );

    assert.deepStrictEqual(
        readingsFor(null, { read: 'unsigned', write: 'signed' }),
        { read: 'unsigned', write: 'signed' },
        'a row from before conventions were stored still reads off its values',
    );

    assert.deepStrictEqual(readingsFor(null, { read: null, write: null }), { read: null, write: null });
});
