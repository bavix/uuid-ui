import assert from 'node:assert';
import test from 'node:test';
import { HISTORY_LIMIT } from '../src/limits.js';
import { createBus } from '../src/data/bus.js';
import {
    DATA_KEY,
    TOMBSTONE_LIMIT,
    TOMBSTONE_TTL_MS,
    createDataStore,
} from '../src/data/store.js';
import { blockedStorage, storageOf } from './storage-double.js';
import { buildSnapshot } from '../src/sync/snapshot.js';

const NOW = 1_755_330_000_000;
const row = (input, info = '') => ({ input, output: `${input}-out`, info });

function countingStorage(initial) {
    const inner = storageOf(initial);
    const calls = { writes: 0 };

    return {
        ...inner,
        calls,
        setItem(key, value) {
            calls.writes += 1;
            inner.setItem(key, value);
        },
    };
}

function storeOf({ storage = storageOf(), bus = createBus(), now = NOW, win = null } = {}) {
    let clock = now;

    return {
        storage,
        bus,
        tick: (ms) => { clock += ms; },
        set: (at) => { clock = at; },
        store: createDataStore({ storage, bus, win, clock: () => clock }),
    };
}

function stored(storage) {
    return JSON.parse(storage.getItem(DATA_KEY));
}

test('a row written for the first time is stamped now', async (t) => {
    const { store, storage } = storeOf();

    store.addRows([row('a')]);

    assert.deepStrictEqual(stored(storage).items, [{ input: 'a', output: 'a-out', info: '', at: NOW }]);
});

test('a row that has not changed keeps the stamp it came with', async (t) => {
    const { store, tick } = storeOf();

    store.addRows([row('a')]);
    tick(5000);
    store.addRows([row('b')]);

    const items = store.snapshot().items;

    assert.deepStrictEqual(items.map(item => [item.input, item.at]), [['b', NOW + 5000], ['a', NOW]]);
});

test('a row whose note changed is stamped again', async (t) => {
    const { store, tick } = storeOf();

    store.addRows([row('a')]);
    tick(1000);
    store.setRows([row('a', 'now with a note')]);

    assert.strictEqual(store.snapshot().items[0].at, NOW + 1000);
});

test('removing a row leaves a tombstone behind', async (t) => {
    const { store, tick } = storeOf();

    store.addRows([row('a'), row('b')]);
    tick(2000);
    store.setRows([row('b')]);

    const data = store.snapshot();

    assert.deepStrictEqual(data.items.map(item => item.input), ['b']);
    assert.deepStrictEqual(data.tombstones, { 'a:a-out': NOW + 2000 });
});

test('removing a row costs one write, so it cannot half happen', async (t) => {
    const storage = countingStorage();
    const { store } = storeOf({ storage });

    store.addRows([row('a'), row('b')]);
    storage.calls.writes = 0;
    store.setRows([row('b')]);

    assert.strictEqual(storage.calls.writes, 1, 'the row and its tombstone go down together');
});

test('clearing the history writes a watermark instead of a tombstone per row', async (t) => {
    const { store, tick } = storeOf();

    store.addRows([row('a'), row('b'), row('c')]);
    tick(3000);
    store.clearRows();

    const data = store.snapshot();

    assert.deepStrictEqual(data.items, []);
    assert.deepStrictEqual(data.tombstones, {});
    assert.strictEqual(data.clearedAt, NOW + 3000);
});

test('a watermark never moves backwards', async (t) => {
    const { store, tick, set } = storeOf();

    tick(5000);
    store.clearRows();
    set(NOW);
    store.clearRows();

    assert.strictEqual(store.snapshot().clearedAt, NOW + 5000);
});

test('what comes in from elsewhere is taken as it is, with no stamping and no tombstones', async (t) => {
    const { store, tick } = storeOf();

    store.addRows([row('a')]);
    tick(9000);
    store.applyRemote({
        items: [{ input: 'b', output: 'b-out', info: '', at: 5 }],
        tombstones: {},
        favorites: {},
        favoriteTombstones: {},
        clearedAt: 0,
        settings: {},
    });

    const data = store.snapshot();

    assert.deepStrictEqual(data.items, [{ input: 'b', output: 'b-out', info: '', at: 5 }]);
    assert.deepStrictEqual(data.tombstones, {}, 'the row that went is not buried, it was never deleted here');
});

test('tombstones older than the ttl are dropped', async (t) => {
    const { store, tick } = storeOf();

    store.addRows([row('a')]);
    store.setRows([]);

    assert.strictEqual(Object.keys(store.snapshot().tombstones).length, 1);

    tick(TOMBSTONE_TTL_MS + 1000);
    store.addRows([row('b')]);
    store.setRows([]);

    assert.deepStrictEqual(Object.keys(store.snapshot().tombstones), ['b:b-out'], 'the old one aged out');
});

test('tombstones are capped, newest kept', async (t) => {
    const { store, tick } = storeOf();
    const rounds = Math.ceil((TOMBSTONE_LIMIT + HISTORY_LIMIT) / HISTORY_LIMIT);

    for (let round = 0; round < rounds; round += 1) {
        store.addRows(Array.from({ length: HISTORY_LIMIT }, (unused, i) => row(`round-${round}-row-${i}`)));
        tick(1000);
        store.setRows([]);
        tick(1000);
    }

    const graves = store.snapshot().tombstones;
    const newest = `round-${rounds - 1}-row-0:round-${rounds - 1}-row-0-out`;

    assert.strictEqual(Object.keys(graves).length, TOMBSTONE_LIMIT, 'the pile stops growing');
    assert.ok(graves[newest], 'the newest burial is kept');
    assert.ok(!graves['round-0-row-0:round-0-row-0-out'], 'the oldest is dropped');
});

test('the history keeps only what fits, the newest first', async (t) => {
    const { store } = storeOf();
    const many = Array.from({ length: HISTORY_LIMIT + 10 }, (unused, i) => row(`row-${i}`));

    store.addRows(many);

    const items = store.snapshot().items;

    assert.strictEqual(items.length, HISTORY_LIMIT);
    assert.strictEqual(items[0].input, 'row-0');
});

test('what the cap pushes out is not buried: another browser still has it', async (t) => {
    const { store, tick } = storeOf();

    store.addRows([row('oldest')]);
    tick(1000);
    store.addRows(Array.from({ length: HISTORY_LIMIT }, (unused, i) => row(`row-${i}`)));

    const snapshot = store.snapshot();

    assert.strictEqual(snapshot.items.length, HISTORY_LIMIT);
    assert.ok(!snapshot.items.some(item => item.input === 'oldest'), 'the oldest row did not fit');
    assert.deepStrictEqual(Object.keys(snapshot.tombstones), [], 'no grave was dug for it');
});

test('a row the person deletes is still buried while the cap is full', async (t) => {
    const { store, tick } = storeOf();

    store.addRows(Array.from({ length: HISTORY_LIMIT }, (unused, i) => row(`row-${i}`)));
    tick(1000);

    const kept = store.snapshot().items.filter(item => item.input !== 'row-5');

    store.setRows(kept);

    assert.deepStrictEqual(Object.keys(store.snapshot().tombstones), ['row-5:row-5-out']);
});

test('a tag holds its rows and never falls off with the history', async (t) => {
    const { store } = storeOf();
    const many = Array.from({ length: HISTORY_LIMIT + 50 }, (unused, i) => row(`row-${i}`));

    store.createTag('test');
    store.star('test', row('kept'));
    store.addRows(many);

    assert.deepStrictEqual(store.snapshot().favorites.test.items.map(item => item.input), ['kept']);
});

test('unstarring a row buries it under the tag, not under the history', async (t) => {
    const { store, tick } = storeOf();

    store.star('test', row('a'));
    tick(4000);
    store.unstar('test', row('a'));

    const data = store.snapshot();

    assert.deepStrictEqual(data.favorites.test.items, []);
    assert.deepStrictEqual(data.favoriteTombstones, { 'test a:a-out': NOW + 4000 });
    assert.deepStrictEqual(data.tombstones, {});
});

test('deleting a tag buries the tag itself', async (t) => {
    const { store, tick } = storeOf();

    store.star('test', row('a'));
    tick(1000);
    store.deleteTag('test');

    assert.deepStrictEqual(store.snapshot().favoriteTombstones, { test: NOW + 1000 });
});

test('a tag put back keeps its rows and loses nothing else', async (t) => {
    const { store, tick } = storeOf();

    store.star('test', row('a'));
    tick(1000);
    store.deleteTag('test');
    tick(1000);
    store.restoreTag('test', [{ input: 'a', output: 'a-out', info: '', at: NOW }]);

    assert.deepStrictEqual(store.snapshot().favorites.test.items.map(item => item.input), ['a']);
});

test('a setting carries the moment it was set', async (t) => {
    const { store, tick } = storeOf();

    tick(700);
    store.setSetting('uuidType', 'base64');

    assert.deepStrictEqual(store.snapshot().settings.uuidType, { value: 'base64', at: NOW + 700 });
});

test('the theme is also written where the page can read it before it paints', async (t) => {
    const { store, storage } = storeOf();

    store.setSetting('theme', 'dark');

    assert.strictEqual(storage.getItem('theme'), 'default:dark');
    assert.strictEqual(store.snapshot().settings.theme.value, 'dark');

    store.setSetting('palette', 'cyberpunk');

    assert.strictEqual(storage.getItem('theme'), 'cyberpunk:dark');
});

test('a variant it does not know is refused', async (t) => {
    const { store } = storeOf();

    assert.strictEqual(store.setSetting('theme', 'sepia'), false);
    assert.strictEqual(store.snapshot().settings.theme.value, 'system', 'the choice already there is left alone');
});

test('a theme this build has never heard of is still kept', async (t) => {
    const { store } = storeOf();

    assert.strictEqual(store.setSetting('palette', 'vaporwave'), true);
    assert.strictEqual(store.snapshot().settings.palette.value, 'vaporwave');
});

test('a theme somebody wrote is kept, up to a ceiling', async (t) => {
    const { store } = storeOf();

    assert.strictEqual(store.setSetting('customTheme', '{"tokens":{"ink":"#fff"}}'), true);
    assert.strictEqual(store.snapshot().settings.customTheme.value, '{"tokens":{"ink":"#fff"}}');
    assert.strictEqual(store.setSetting('customTheme', 'x'.repeat(8193)), false, 'a theme cannot be a novel');
});

test('a name that could not be an attribute is refused', async (t) => {
    const { store } = storeOf();

    for (const name of ['Cyberpunk', 'two words', '../etc', 'x'.repeat(33), '']) {
        assert.strictEqual(store.setSetting('palette', name), false, `${name} should be refused`);
    }

    assert.strictEqual(store.snapshot().settings.palette, null);
});

test('the snapshot is the same object until something is written', async (t) => {
    const { store } = storeOf();

    const first = store.snapshot();

    assert.strictEqual(store.snapshot(), first);

    store.addRows([row('a')]);

    assert.notStrictEqual(store.snapshot(), first);
});

test('the revision moves on every write and on nothing else', async (t) => {
    const { store } = storeOf();

    const start = store.revision();

    store.snapshot();
    assert.strictEqual(store.revision(), start);

    store.addRows([row('a')]);
    assert.strictEqual(store.revision(), start + 1);
});

test('listeners are woken once per write', async (t) => {
    const { store } = storeOf();
    let woken = 0;

    const stop = store.subscribe(() => { woken += 1; });

    store.addRows([row('a')]);
    store.setSetting('uuidType', 'uuid');
    stop();
    store.addRows([row('b')]);

    assert.strictEqual(woken, 2);
});

test('one listener throwing does not silence the others', async (t) => {
    const { store } = storeOf();
    let woken = 0;
    const held = console.error;

    console.error = () => {};
    store.subscribe(() => { throw new Error('bad listener'); });
    store.subscribe(() => { woken += 1; });

    try {
        store.addRows([row('a')]);
    } finally {
        console.error = held;
    }

    assert.strictEqual(woken, 1);
});

test('a write in another tab is picked up through the storage event', async (t) => {
    const storage = storageOf();
    const handlers = {};
    const win = {
        addEventListener: (name, fn) => { handlers[name] = fn; },
        removeEventListener: () => {},
    };
    const { store } = storeOf({ storage, win });
    let woken = 0;

    store.subscribe(() => { woken += 1; });

    storage.setItem(DATA_KEY, JSON.stringify({
        app: 'uuid-ui',
        version: 2,
        items: [{ input: 'elsewhere', output: 'elsewhere-out', info: '', at: NOW }],
    }));

    handlers.storage({ key: DATA_KEY });

    assert.strictEqual(woken, 1);
    assert.deepStrictEqual(store.snapshot().items.map(item => item.input), ['elsewhere']);
});

test('a storage event that changes nothing wakes nobody', async (t) => {
    const storage = storageOf();
    const handlers = {};
    const win = {
        addEventListener: (name, fn) => { handlers[name] = fn; },
        removeEventListener: () => {},
    };
    const { store } = storeOf({ storage, win });

    store.addRows([row('a')]);

    let woken = 0;

    store.subscribe(() => { woken += 1; });
    handlers.storage({ key: DATA_KEY });

    assert.strictEqual(woken, 0);
});

test('the bus hears where a change came from', async (t) => {
    const bus = createBus();
    const heard = [];

    bus.on('data', payload => heard.push(payload.origin));

    const { store } = storeOf({ bus });

    store.addRows([row('a')]);
    store.applyRemote({ items: [], favorites: {}, tombstones: {}, favoriteTombstones: {}, clearedAt: 0, settings: {} });

    assert.deepStrictEqual(heard, ['local', 'remote']);
});

test('storage that refuses to be written keeps the app running', async (t) => {
    const store = createDataStore({ storage: blockedStorage, clock: () => NOW });

    assert.strictEqual(store.addRows([row('a')]), true);
    assert.deepStrictEqual(store.snapshot().items.map(item => item.input), ['a']);
});

test('rubbish in storage reads as an empty start', async (t) => {
    const storage = storageOf({ [DATA_KEY]: 'not json at all' });
    const { store } = storeOf({ storage });

    assert.deepStrictEqual(store.snapshot().items, []);
    assert.deepStrictEqual(store.snapshot().favorites, {});
});

test('a theme left by an older build is taken as a setting', async (t) => {
    const storage = storageOf({ theme: 'dark' });
    const { store } = storeOf({ storage });

    assert.deepStrictEqual(store.snapshot().settings.theme, { value: 'dark', at: 0 });
});

test('settings that belong to this browser alone never reach a snapshot', async (t) => {
    const { store } = storeOf();

    store.setSetting('uuidType', 'v7');
    store.setSetting('theme', 'dark');
    store.setSetting('resultType', '2');
    store.setSetting('intRead', 'signed');
    store.setSetting('intWrite', 'unsigned');
    store.setSetting('spelling', 'braces');
    store.setSetting('case', 'upper');
    store.setSetting('customTheme', '{"tokens":{}}');

    const held = store.snapshot().settings;

    assert.deepStrictEqual(Object.keys(held).sort((a, b) => a.localeCompare(b)), ['case', 'customTheme', 'intRead', 'intWrite', 'palette', 'resultType', 'spelling', 'theme', 'uuidType']);
    assert.deepStrictEqual(Object.keys(buildSnapshot(store.snapshot(), NOW).settings).sort((a, b) => a.localeCompare(b)), ['customTheme', 'palette', 'theme', 'uuidType']);
});

test('a local setting does not ask the sync to run', async (t) => {
    const bus = createBus();
    const heard = [];

    bus.on('data', payload => heard.push(payload.synced !== false));

    const { store } = storeOf({ bus });

    store.setSetting('uuidType', 'v7');
    store.setSetting('spelling', 'braces');
    store.addRows([row('a')]);

    assert.deepStrictEqual(heard, [true, false, true]);
});
