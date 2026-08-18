import assert from 'node:assert';
import test from 'node:test';
import { HISTORY_LIMIT } from '../src/limits.js';
import {
    CLOCK_SKEW_MS,
    SNAPSHOT_VERSION,
    buildSnapshot,
    mergeSnapshot,
    parseSnapshot,
    summarize,
} from '../src/sync/snapshot.js';
import { exchange, fingerprint } from '../src/sync/engine.js';
import { TOMBSTONE_TTL_MS, createDataStore } from '../src/data/store.js';
import { storageOf } from './storage-double.js';

const NOW = 1_755_330_000_000;
const row = (input, at, info = '') => ({ input, output: `${input}-out`, info, at });
const keys = (snapshot) => snapshot.items.map(item => item.input);

function snapshotOf(overrides = {}) {
    return buildSnapshot({
        items: [], favorites: {}, settings: {},
        tombstones: {}, favoriteTombstones: {}, clearedAt: 0,
        ...overrides,
    }, NOW);
}

test('a row stamped exactly when it was buried stays buried', async (t) => {
    const mine = snapshotOf({ items: [row('a', 500)] });
    const theirs = snapshotOf({ tombstones: { 'a:a-out': 500 }, favoriteTombstones: {}, clearedAt: 0 });

    assert.deepStrictEqual(keys(mergeSnapshot(mine, theirs, NOW)), []);
});

test('a row stamped one tick after it was buried comes back', async (t) => {
    const mine = snapshotOf({ items: [row('a', 501)] });
    const theirs = snapshotOf({ tombstones: { 'a:a-out': 500 }, favoriteTombstones: {}, clearedAt: 0 });

    assert.deepStrictEqual(keys(mergeSnapshot(mine, theirs, NOW)), ['a']);
});

test('the clear watermark takes everything up to and including its own moment', async (t) => {
    const mine = snapshotOf({ items: [row('before', 1000), row('same', 2000), row('after', 2001)] });
    const theirs = snapshotOf({ tombstones: {}, favoriteTombstones: {}, clearedAt: 2000 });

    assert.deepStrictEqual(keys(mergeSnapshot(mine, theirs, NOW)), ['after']);
});

test('a stamp from a clock running ahead is pulled back to the edge of the allowance', async (t) => {
    const wild = buildSnapshot({
        items: [row('a', NOW + CLOCK_SKEW_MS + 60_000)],
        favorites: {}, settings: {},
        tombstones: {}, favoriteTombstones: {}, clearedAt: 0,
    }, NOW);

    assert.strictEqual(wild.items[0].at, NOW + CLOCK_SKEW_MS);
});

test('a stamp inside the allowance is left alone', async (t) => {
    const fine = buildSnapshot({
        items: [row('a', NOW + CLOCK_SKEW_MS)],
        favorites: {}, settings: {},
        tombstones: {}, favoriteTombstones: {}, clearedAt: 0,
    }, NOW);

    assert.strictEqual(fine.items[0].at, NOW + CLOCK_SKEW_MS);
});

test('a stamp in the past or missing altogether reads as zero, not as now', async (t) => {
    const odd = snapshotOf({ items: [{ input: 'a', output: 'a-out', info: '', at: -5 }, { input: 'b', output: 'b-out', info: '' }] });

    assert.deepStrictEqual(odd.items.map(item => item.at), [0, 0]);
});

test('two full histories merge to one full history, newest kept', async (t) => {
    const mine = snapshotOf({ items: Array.from({ length: HISTORY_LIMIT }, (unused, i) => row(`mine-${i}`, 1000 + i)) });
    const theirs = snapshotOf({ items: Array.from({ length: HISTORY_LIMIT }, (unused, i) => row(`theirs-${i}`, 5000 + i)) });

    const merged = mergeSnapshot(mine, theirs, NOW);

    assert.strictEqual(merged.items.length, HISTORY_LIMIT);
    assert.ok(merged.items.every(item => item.input.startsWith('theirs-')), 'the newer side fills the window');
});

test('a merge at the cap is still the same merge run twice', async (t) => {
    const mine = snapshotOf({ items: Array.from({ length: HISTORY_LIMIT }, (unused, i) => row(`mine-${i}`, 1000 + i)) });
    const theirs = snapshotOf({ items: Array.from({ length: HISTORY_LIMIT }, (unused, i) => row(`theirs-${i}`, 5000 + i)) });

    const once = mergeSnapshot(mine, theirs, NOW);
    const twice = mergeSnapshot(once, theirs, NOW);

    assert.strictEqual(fingerprint(once), fingerprint(twice));
});

test('the same row on both sides with the same stamp does not flip back and forth', async (t) => {
    const mine = snapshotOf({ items: [row('a', 1000, 'mine')] });
    const theirs = snapshotOf({ items: [row('a', 1000, 'theirs')] });

    const merged = mergeSnapshot(mine, theirs, NOW);
    const again = mergeSnapshot(merged, theirs, NOW);

    assert.strictEqual(merged.items[0].info, 'mine', 'a tie is settled by the side doing the merge');
    assert.strictEqual(fingerprint(merged), fingerprint(again), 'and settled once, it stays settled');
});

test('a tie at the same stamp settles on one text for both sides after one exchange', async (t) => {
    const sideOf = (snapshot, name) => {
        const state = { content: JSON.stringify(snapshot), cursor: `${name}-1`, writes: 0 };

        return {
            state,
            session: {
                async read(target, cursor) {
                    if (cursor && cursor === state.cursor) {
                        return { unchanged: true };
                    }

                    return { unchanged: false, content: state.content, cursor: state.cursor, staleBase: true };
                },
                async write(target, content) {
                    state.writes += 1;
                    state.content = content;
                    state.cursor = `${name}-${state.writes + 1}`;

                    return { target: target || 'target-1', cursor: state.cursor, applied: true };
                },
            },
        };
    };

    const here = sideOf(snapshotOf({ items: [row('a', 1000, 'mine')] }), 'here');
    const there = sideOf(snapshotOf({ items: [row('a', 1000, 'theirs')] }), 'there');

    await exchange(here.session, there.session, { target: 'target-1', cursor: 'stale', hereCursor: 'stale', now: NOW });

    const left = parseSnapshot(here.state.content, NOW);
    const right = parseSnapshot(there.state.content, NOW);

    assert.strictEqual(left.items[0].info, right.items[0].info, 'both sides end on the same text');
});

test('the same key written twice on one side collapses to one row', async (t) => {
    const doubled = snapshotOf({ items: [row('a', 1000, 'first'), row('a', 2000, 'second')] });
    const merged = mergeSnapshot(doubled, snapshotOf(), NOW);

    assert.strictEqual(merged.items.length, 1);
    assert.strictEqual(merged.items[0].at, 2000, 'the later writing wins');
});

test('a tag deleted at the very moment it was last touched stays deleted', async (t) => {
    const mine = snapshotOf({ favorites: { test: { at: 400, items: [row('a', 400)] } } });
    const theirs = snapshotOf({ tombstones: {}, favoriteTombstones: { test: 400 }, clearedAt: 0 });

    assert.deepStrictEqual(Object.keys(mergeSnapshot(mine, theirs, NOW).favorites), []);
});

test('a tag touched one tick after it was deleted comes back with what is newer', async (t) => {
    const mine = snapshotOf({ favorites: { test: { at: 401, items: [row('a', 401), row('old', 100)] } } });
    const theirs = snapshotOf({ tombstones: {}, favoriteTombstones: { test: 400 }, clearedAt: 0 });

    const merged = mergeSnapshot(mine, theirs, NOW);

    assert.deepStrictEqual(merged.favorites.test.items.map(item => item.input), ['a'], 'only the rows newer than the deletion');
});

test('an empty snapshot merges with an empty snapshot and stays empty', async (t) => {
    const merged = mergeSnapshot(snapshotOf(), snapshotOf(), NOW);

    assert.deepStrictEqual(merged.items, []);
    assert.deepStrictEqual(merged.favorites, {});
    assert.deepStrictEqual(summarize(snapshotOf(), merged), { added: 0, removed: 0, tags: 0 });
});

test('a file with nothing but braces reads as an empty snapshot', async (t) => {
    const parsed = parseSnapshot('{}', NOW);

    assert.deepStrictEqual(parsed.items, []);
    assert.strictEqual(parsed.version, 1, 'a file with no version is the first one');
});

test('a file from a newer app is refused, one from an older app is not', async (t) => {
    const newer = JSON.stringify({ app: 'uuid-ui', version: SNAPSHOT_VERSION + 1, items: [] });
    const older = JSON.stringify({ app: 'uuid-ui', version: 1, items: [{ input: 'a', output: 'a-out', at: 5 }] });

    assert.throws(() => parseSnapshot(newer, NOW), error => error.code === 'future-version');
    assert.deepStrictEqual(keys(parseSnapshot(older, NOW)), ['a']);
});

test('text that is not a snapshot at all is refused by shape, not by luck', async (t) => {
    assert.throws(() => parseSnapshot('[1,2,3]', NOW), error => error.code === 'not-json');
    assert.throws(() => parseSnapshot('7', NOW), error => error.code === 'not-json');
    assert.throws(() => parseSnapshot('', NOW), error => error.code === 'not-json');
    assert.throws(() => parseSnapshot(JSON.stringify({ app: 'other-app' }), NOW), error => error.code === 'foreign-app');
});

test('an identifier of any script or length survives the round trip', async (t) => {
    const long = 'x'.repeat(4096);
    const odd = '💾 ключ — ゆーゆーあいでぃー';
    const held = snapshotOf({ items: [row(long, 1000), row(odd, 2000, 'note — 注釈')] });

    const back = parseSnapshot(JSON.stringify(held), NOW);

    assert.deepStrictEqual(keys(back), [odd, long]);
    assert.strictEqual(back.items[0].info, 'note — 注釈');
});

test('a full history of realistic rows stays well inside what a gist and a browser hold', async (t) => {
    const history = Array.from({ length: HISTORY_LIMIT }, (unused, i) => ({
        input: `{"high":-387124789125757746${i % 10},"low":42507095572102975${i % 10}}`,
        output: `0198f3c0-0000-7000-8000-00000000${String(i).padStart(4, '0')}`,
        info: i % 5 === 0 ? 'a note somebody left on this row' : '',
        at: NOW - i,
    }));

    const bytes = new TextEncoder().encode(JSON.stringify(snapshotOf({ items: history }))).length;

    assert.ok(bytes < 1_000_000, `a full history is ${Math.round(bytes / 1024)} KB, under the 1 MB a gist file takes`);
    assert.ok(bytes < 2_500_000, 'and under the 5 MB a browser gives the whole origin');
});

test('a tombstone older than the ttl by one tick is dropped, one tick younger is kept', async (t) => {
    const storage = storageOf();
    let clock = NOW;
    const store = createDataStore({ storage, clock: () => clock });

    store.addRows([{ input: 'a', output: 'a-out', info: '' }]);
    store.setRows([]);

    clock = NOW + TOMBSTONE_TTL_MS - 1;
    store.addRows([{ input: 'keep', output: 'keep-out', info: '' }]);
    store.setRows([]);

    assert.ok(store.snapshot().tombstones['a:a-out'], 'still inside the window');

    clock = NOW + TOMBSTONE_TTL_MS;
    store.addRows([{ input: 'later', output: 'later-out', info: '' }]);
    store.setRows([]);

    assert.ok(!store.snapshot().tombstones['a:a-out'], 'the window closed');
});

test('a burial time already in the snapshot is not moved backwards by an older one', async (t) => {
    const mine = snapshotOf({ tombstones: { 'a:a-out': 9000 }, favoriteTombstones: {}, clearedAt: 0 });
    const theirs = snapshotOf({ tombstones: { 'a:a-out': 100 }, favoriteTombstones: {}, clearedAt: 0 });

    assert.strictEqual(mergeSnapshot(mine, theirs, NOW).tombstones['a:a-out'], 9000);
});

test('settings tie on the same stamp keeps what is already here', async (t) => {
    const mine = snapshotOf({ settings: { uuidType: { value: 'uuid', at: 1000 } } });
    const theirs = snapshotOf({ settings: { uuidType: { value: 'base64', at: 1000 } } });

    assert.strictEqual(mergeSnapshot(mine, theirs, NOW).settings.uuidType.value, 'uuid');
});

test('a setting nobody knows is dropped rather than carried', async (t) => {
    const held = snapshotOf({ settings: { theme: { value: 'sepia', at: 1000 }, uuidType: { value: 'words', at: 1000 } } });

    assert.strictEqual(held.settings.theme, null);
    assert.deepStrictEqual(held.settings.uuidType, { value: 'words', at: 1000 });
});

test('a row from a newer app keeps what this one understands and drops the rest', async (t) => {
    const raw = JSON.stringify({
        app: 'uuid-ui',
        version: 2,
        items: [{ input: 'a', output: 'a-out', info: '', at: 5, readAs: 'signed', writeAs: 'unsigned', mood: 'curious' }],
    });

    const parsed = parseSnapshot(raw, NOW);

    assert.strictEqual(parsed.items[0].readAs, 'signed');
    assert.strictEqual(parsed.items[0].writeAs, 'unsigned');
    assert.strictEqual(parsed.items[0].mood, undefined, 'a field this app does not know is not carried');
});

test('a reading that is not one of the two is dropped rather than trusted', async (t) => {
    const raw = JSON.stringify({
        app: 'uuid-ui',
        version: 2,
        items: [{ input: 'a', output: 'a-out', info: '', at: 5, readAs: 'sideways', writeAs: 7 }],
    });

    const parsed = parseSnapshot(raw, NOW);

    assert.strictEqual(parsed.items[0].readAs, undefined);
    assert.strictEqual(parsed.items[0].writeAs, undefined);
});
