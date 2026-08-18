import assert from 'node:assert';
import test from 'node:test';
import browser, { BROWSER_TARGET } from '../src/sync/providers/browser.js';
import { createDataStore } from '../src/data/store.js';
import { buildSnapshot } from '../src/sync/snapshot.js';
import { storageOf } from './storage-double.js';

const NOW = 1_755_330_000_000;
const row = (input, at, info = '') => ({ input, output: `${input}-out`, info, at });

function sessionOf(storage = storageOf()) {
    const store = createDataStore({ storage, clock: () => NOW });

    return { store, session: browser.create({}, { store }) };
}

function snapshotOf(overrides = {}) {
    return JSON.stringify(buildSnapshot({
        history: [], favorites: {}, settings: {},
        tombstones: {}, favoriteTombstones: {}, clearedAt: 0,
        ...overrides,
    }, NOW));
}

test('the browser answers the same questions as any other store', async (t) => {
    const { session } = sessionOf();

    assert.deepStrictEqual(await session.account(), { name: 'This browser' });
    assert.deepStrictEqual(await session.locate(), [{ targetId: BROWSER_TARGET, label: 'This browser', updatedAt: '' }]);
    assert.strictEqual(browser.link(), null);
    assert.deepStrictEqual(browser.needs, []);
});

test('reading returns what this browser holds, with a cursor of its own', async (t) => {
    const { store, session } = sessionOf();

    store.setRows([{ input: 'a', output: 'a-out', info: '' }]);

    const read = await session.read(null, null);

    assert.strictEqual(read.unchanged, false);
    assert.deepStrictEqual(JSON.parse(read.content).items.map(r => r.input), ['a']);
    assert.ok(read.cursor);
});

test('an unchanged browser reports unchanged, exactly like a remote store', async (t) => {
    const { store, session } = sessionOf();

    store.setRows([{ input: 'a', output: 'a-out', info: '' }]);

    const first = await session.read(null, null);
    const second = await session.read(null, first.cursor);

    assert.deepStrictEqual(second, { unchanged: true });
});

test('writing merges into the browser instead of replacing it', async (t) => {
    const { store, session } = sessionOf();

    store.setRows([{ input: 'mine', output: 'mine-out', info: '' }]);

    const result = await session.write(BROWSER_TARGET, snapshotOf({ items: [row('theirs', NOW)] }));

    assert.strictEqual(result.applied, true);
    assert.deepStrictEqual(store.snapshot().items.map(r => r.input).sort(), ['mine', 'theirs']);
});

test('writing what is already here changes nothing and says so', async (t) => {
    const { store, session } = sessionOf();

    store.setRows([{ input: 'a', output: 'a-out', info: '' }]);

    const read = await session.read(null, null);
    const result = await session.write(BROWSER_TARGET, read.content);

    assert.strictEqual(result.applied, false);
    assert.strictEqual(result.cursor, read.cursor);
});

test('a deletion recorded here survives a write coming back', async (t) => {
    const storage = storageOf();
    const { store, session } = sessionOf(storage);

    store.setRows([{ input: 'a', output: 'a-out', info: '' }, { input: 'b', output: 'b-out', info: '' }]);
    store.setRows([{ input: 'b', output: 'b-out', info: '' }]);

    await session.write(BROWSER_TARGET, snapshotOf({ items: [row('a', NOW - 1000), row('b', NOW - 1000)] }));

    assert.deepStrictEqual(store.snapshot().items.map(r => r.input), ['b']);
});
