import assert from 'node:assert';
import test from 'node:test';
import {
    APP,
    CLOCK_SKEW_MS,
    SNAPSHOT_VERSION,
    SnapshotError,
    buildSnapshot,
    mergeSnapshot,
    parseSnapshot,
    summarize,
} from '../src/sync/snapshot.js';
import { HISTORY_LIMIT } from '../src/limits.js';

const NOW = 1_755_330_000_000;
const T = (offset) => NOW + offset;
const row = (input, at, info = '') => ({ input, output: `${input}-out`, info, at });
const keys = (snapshot) => snapshot.items.map(item => item.input);

function snapshotOf(overrides = {}) {
    return buildSnapshot({
        items: [],
        favorites: {},
        settings: {},
        tombstones: {},
        favoriteTombstones: {},
        clearedAt: 0,
        ...overrides,
    }, NOW);
}

test('a snapshot names itself and carries the version we write', (t) => {
    const snapshot = snapshotOf({ items: [row('a', T(0))] });

    assert.strictEqual(snapshot.app, APP);
    assert.strictEqual(snapshot.version, SNAPSHOT_VERSION);
    assert.strictEqual(snapshot.timestamp, new Date(NOW).toISOString());
    assert.deepStrictEqual(keys(snapshot), ['a']);
});

test('the history cap is the app limit, not the prototype hundred', (t) => {
    const many = Array.from({ length: HISTORY_LIMIT + 50 }, (_, i) => row(`k${i}`, T(-i)));

    assert.strictEqual(snapshotOf({ items: many }).items.length, HISTORY_LIMIT);
});

test('rows are ordered newest first, whatever order they came in', (t) => {
    const snapshot = snapshotOf({ items: [row('old', T(0)), row('new', T(500))] });

    assert.deepStrictEqual(keys(snapshot), ['new', 'old']);
});

test('broken rows drop out and a clock from the future is pulled back', (t) => {
    const snapshot = snapshotOf({
        items: [row('a', T(0)), null, { input: '', output: '' }, row('b', T(CLOCK_SKEW_MS * 10)), row('c', 'soon')],
    });

    assert.deepStrictEqual(keys(snapshot), ['b', 'a', 'c']);
    assert.strictEqual(snapshot.items[0].at, NOW + CLOCK_SKEW_MS);
    assert.strictEqual(snapshot.items[2].at, 0);
});

test('what is not ours is refused rather than merged', (t) => {
    assert.throws(() => parseSnapshot('not json', NOW), (e) => e instanceof SnapshotError && e.code === 'not-json');
    assert.throws(() => parseSnapshot('[1,2]', NOW), (e) => e.code === 'not-json');
    assert.throws(() => parseSnapshot('{"app":"other"}', NOW), (e) => e.code === 'foreign-app');
});

test('a snapshot from a newer app is never overwritten', (t) => {
    const future = JSON.stringify({ app: APP, version: SNAPSHOT_VERSION + 1, items: [] });

    assert.throws(() => parseSnapshot(future, NOW), (e) => e.code === 'future-version');
});

test('the prototype version 1 still reads', (t) => {
    const old = JSON.stringify({
        version: 1,
        items: [{ input: 'a', output: 'a-out', info: 'note' }],
        favorites: { work: [{ input: 'b', output: 'b-out', info: '' }] },
    });

    const parsed = parseSnapshot(old, NOW);

    assert.deepStrictEqual(keys(parsed), ['a']);
    assert.strictEqual(parsed.items[0].at, 0);
    assert.deepStrictEqual(parsed.favorites.work.items.map(r => r.input), ['b']);
    assert.deepStrictEqual(parsed.tombstones, {});
});

test('a hand-edited file loses the broken parts, not the good ones', (t) => {
    const messy = JSON.stringify({
        app: APP,
        version: 2,
        items: [{ input: 'a', output: 'a-out', at: T(0) }, 'nonsense', null],
        favorites: { work: 'not a list', real: { at: T(0), items: [{ input: 'b', output: 'b-out' }] } },
        tombstones: 'gone',
    });

    const parsed = parseSnapshot(messy, NOW);

    assert.deepStrictEqual(keys(parsed), ['a']);
    assert.deepStrictEqual(Object.keys(parsed.favorites), ['real']);
    assert.deepStrictEqual(parsed.tombstones, {});
});

test('what one side has and the other does not is kept by both', (t) => {
    const mine = snapshotOf({ items: [row('a', T(0))] });
    const theirs = snapshotOf({ items: [row('b', T(1))] });

    assert.deepStrictEqual(keys(mergeSnapshot(mine, theirs, NOW)), ['b', 'a']);
});

test('an empty side does not empty the other', (t) => {
    const mine = snapshotOf({ items: [row('a', T(0))] });
    const empty = snapshotOf();

    assert.deepStrictEqual(keys(mergeSnapshot(mine, empty, NOW)), ['a']);
    assert.deepStrictEqual(keys(mergeSnapshot(empty, mine, NOW)), ['a']);
});

test('the fresher comment wins, and a tie goes to the local side', (t) => {
    const mine = snapshotOf({ items: [row('a', T(0), 'old')] });
    const theirs = snapshotOf({ items: [row('a', T(500), 'new')] });
    const tie = snapshotOf({ items: [row('a', T(0), 'theirs')] });

    assert.strictEqual(mergeSnapshot(mine, theirs, NOW).items[0].info, 'new');
    assert.strictEqual(mergeSnapshot(theirs, mine, NOW).items[0].info, 'new');
    assert.strictEqual(mergeSnapshot(mine, tie, NOW).items[0].info, 'old');
});

test('merging is commutative and idempotent', (t) => {
    const mine = snapshotOf({
        items: [row('a', T(0)), row('b', T(10))],
        favorites: { work: { at: T(0), items: [row('a', T(0))] } },
         tombstones: { 'c:c-out': T(50) } ,
        settings: { theme: { value: 'dark', at: T(5) } },
    });
    const theirs = snapshotOf({
        items: [row('b', T(20)), row('c', T(1)), row('d', T(30))],
        favorites: { play: { at: T(30), items: [row('d', T(30))] } },
         tombstones: { 'a:a-out': T(5) } ,
        settings: { theme: { value: 'light', at: T(2) } },
    });

    const one = mergeSnapshot(mine, theirs, NOW);
    const other = mergeSnapshot(theirs, mine, NOW);

    assert.deepStrictEqual(one, other);
    assert.deepStrictEqual(mergeSnapshot(one, theirs, NOW), one);
    assert.deepStrictEqual(mergeSnapshot(one, one, NOW), one);
});

test('a deletion travels and the other browser stops pushing the row back', (t) => {
    const deleter = snapshotOf({  tombstones: { 'a:a-out': T(100) }  });
    const holder = snapshotOf({ items: [row('a', T(0))] });

    assert.deepStrictEqual(keys(mergeSnapshot(holder, deleter, NOW)), []);
    assert.deepStrictEqual(keys(mergeSnapshot(deleter, holder, NOW)), []);
});

test('a row touched after the deletion survives it', (t) => {
    const deleter = snapshotOf({  tombstones: { 'a:a-out': T(100) }  });
    const converter = snapshotOf({ items: [row('a', T(200), 'again')] });

    assert.deepStrictEqual(keys(mergeSnapshot(converter, deleter, NOW)), ['a']);
});

test('clearing reaches the other browser and spares what came after', (t) => {
    const cleared = snapshotOf({  clearedAt: T(100)  });
    const other = snapshotOf({ items: [row('old', T(50)), row('new', T(150))] });

    assert.deepStrictEqual(keys(mergeSnapshot(other, cleared, NOW)), ['new']);
});

test('the later clear stands, and favorites are untouched by it', (t) => {
    const early = snapshotOf({
        items: [row('a', T(120))],
        favorites: { work: { at: T(0), items: [row('a', T(120))] } },
         clearedAt: T(100) ,
    });
    const late = snapshotOf({  clearedAt: T(200)  });

    const merged = mergeSnapshot(early, late, NOW);

    assert.strictEqual(merged.clearedAt, T(200));
    assert.deepStrictEqual(keys(merged), []);
    assert.deepStrictEqual(merged.favorites.work.items.map(r => r.input), ['a']);
});

test('over the cap the newest rows are kept and unstamped ones go first', (t) => {
    const mine = snapshotOf({ items: Array.from({ length: HISTORY_LIMIT }, (_, i) => row(`m${i}`, T(-i - 1000))) });
    const theirs = snapshotOf({ items: [row('fresh', T(500)), row('legacy', 0)] });

    const merged = mergeSnapshot(mine, theirs, NOW);

    assert.strictEqual(merged.items.length, HISTORY_LIMIT);
    assert.strictEqual(merged.items[0].input, 'fresh');
    assert.ok(!keys(merged).includes('legacy'));
});

test('tags merge by name and entries by key', (t) => {
    const mine = snapshotOf({ favorites: { work: { at: T(0), items: [row('a', T(0))] } } });
    const theirs = snapshotOf({
        favorites: { work: { at: T(1), items: [row('b', T(5))] }, play: { at: T(5), items: [row('c', T(5))] } },
    });

    const merged = mergeSnapshot(mine, theirs, NOW);

    assert.deepStrictEqual(merged.favorites.work.items.map(r => r.input), ['b', 'a']);
    assert.deepStrictEqual(merged.favorites.play.items.map(r => r.input), ['c']);
});

test('a deleted tag stays deleted unless something was added after', (t) => {
    const deleter = snapshotOf({  favoriteTombstones: { work: T(100) }  });
    const holder = snapshotOf({ favorites: { work: { at: T(0), items: [row('a', T(0))] } } });
    const adder = snapshotOf({ favorites: { work: { at: T(0), items: [row('a', T(0)), row('b', T(150))] } } });

    assert.deepStrictEqual(Object.keys(mergeSnapshot(holder, deleter, NOW).favorites), []);
    assert.deepStrictEqual(mergeSnapshot(adder, deleter, NOW).favorites.work.items.map(r => r.input), ['b']);
});

test('unstarring one entry leaves the rest of the tag alone', (t) => {
    const mine = snapshotOf({
        favorites: { work: { at: T(0), items: [row('a', T(0)), row('b', T(0))] } },
         favoriteTombstones: { 'work a:a-out': T(100) } ,
    });
    const theirs = snapshotOf({ favorites: { work: { at: T(0), items: [row('a', T(0)), row('b', T(0))] } } });

    assert.deepStrictEqual(mergeSnapshot(mine, theirs, NOW).favorites.work.items.map(r => r.input), ['b']);
});


test('a setting is chosen by its own stamp, not the snapshot timestamp', (t) => {
    const mine = snapshotOf({ settings: { theme: { value: 'dark', at: T(100) }, uuidType: { value: 'v7', at: T(0) } } });
    const theirs = snapshotOf({ settings: { theme: { value: 'light', at: T(50) }, uuidType: { value: 'v4', at: T(200) } } });

    const merged = mergeSnapshot(mine, theirs, NOW);

    assert.strictEqual(merged.settings.theme.value, 'dark');
    assert.strictEqual(merged.settings.uuidType.value, 'v4');
});

test('a variant nobody recognises is not a variant', (t) => {
    assert.strictEqual(snapshotOf({ settings: { theme: { value: 'midnight', at: T(0) } } }).settings.theme, null);
});

test('a theme this build has never heard of travels anyway', (t) => {
    const held = snapshotOf({ settings: { palette: { value: 'vaporwave', at: T(0) } } });

    assert.deepStrictEqual(held.settings.palette, { value: 'vaporwave', at: T(0) });
});

test('the newer choice of theme wins, whichever side it came from', (t) => {
    const mine = snapshotOf({ settings: { palette: { value: 'paper', at: T(1) } } });
    const theirs = snapshotOf({ settings: { palette: { value: 'cyberpunk', at: T(5) } } });

    assert.strictEqual(mergeSnapshot(mine, theirs, NOW).settings.palette.value, 'cyberpunk');
    assert.strictEqual(mergeSnapshot(theirs, mine, NOW).settings.palette.value, 'cyberpunk');
});

test('a snapshot is already the shape the browser keeps', (t) => {
    const snapshot = snapshotOf({
        items: [row('a', T(0), 'note')],
        favorites: { work: { at: T(1), items: [row('a', T(0))] } },
        tombstones: { 'b:b-out': T(10) },
        favoriteTombstones: { 'work c:c-out': T(10) },
        clearedAt: T(1),
        settings: { theme: { value: 'dark', at: T(2) } },
    });

    const plain = row => ({ input: row.input, output: row.output, info: row.info, at: row.at });

    assert.deepStrictEqual(snapshot.items.map(plain), [{ input: 'a', output: 'a-out', info: 'note', at: T(0) }]);
    assert.deepStrictEqual(snapshot.favorites.work.items.map(plain), [{ input: 'a', output: 'a-out', info: '', at: T(0) }]);
    assert.strictEqual(snapshot.favorites.work.at, T(1));
    assert.deepStrictEqual(snapshot.tombstones, { 'b:b-out': T(10) });
    assert.deepStrictEqual(snapshot.favoriteTombstones, { 'work c:c-out': T(10) });
    assert.strictEqual(snapshot.clearedAt, T(1));
    assert.deepStrictEqual(snapshot.settings, { theme: { value: 'dark', at: T(2) }, uuidType: null, palette: null, customTheme: null });
});

test('the summary counts against what the user had', (t) => {
    const before = snapshotOf({ items: [row('a', T(0)), row('b', T(0))], favorites: { work: { at: T(0), items: [] } } });
    const after = snapshotOf({
        items: [row('a', T(0)), row('c', T(0))],
        favorites: { work: { at: T(0), items: [] }, play: { at: T(0), items: [] } },
    });

    assert.deepStrictEqual(summarize(before, after), { added: 1, removed: 1, tags: 1 });
});

test('a round trip through JSON keeps the data', (t) => {
    const snapshot = snapshotOf({
        items: [row('a', T(0), 'note')],
        favorites: { work: { at: T(1), items: [row('a', T(0))] } },
         tombstones: { 'b:b-out': T(10) }, clearedAt: T(1) ,
        settings: { theme: { value: 'dark', at: T(2) }, uuidType: { value: 'v4', at: T(3) } },
    });

    const back = parseSnapshot(JSON.stringify(snapshot), NOW);

    const plain = row => ({ input: row.input, output: row.output, info: row.info, at: row.at });

    assert.deepStrictEqual(back.items.map(plain), snapshot.items.map(plain));
    assert.deepStrictEqual(back.favorites.work.items.map(plain), snapshot.favorites.work.items.map(plain));
    assert.deepStrictEqual(back.tombstones, snapshot.tombstones);
    assert.deepStrictEqual(back.settings, snapshot.settings);
    assert.strictEqual(back.clearedAt, snapshot.clearedAt);
});

test('the cap makes this browser a window on the newest work, and the window is stable', (t) => {
    const older = Array.from({ length: HISTORY_LIMIT }, (_, i) => row(`old${i}`, T(-i - 10_000)));
    const newer = Array.from({ length: HISTORY_LIMIT }, (_, i) => row(`new${i}`, T(-i)));

    const here = snapshotOf({ items: older });
    const there = snapshotOf({ items: newer });

    const merged = mergeSnapshot(here, there, NOW);

    assert.strictEqual(merged.items.length, HISTORY_LIMIT);
    assert.ok(keys(merged).every(input => input.startsWith('new')), 'the newest window wins');

    const again = mergeSnapshot(merged, here, NOW);

    assert.deepStrictEqual(keys(again), keys(merged), 'rows that fell off the window do not come back');
});

test('starred rows are never cut by the history cap', (t) => {
    const many = Array.from({ length: HISTORY_LIMIT + 50 }, (_, i) => row(`k${i}`, T(-i)));
    const starred = { work: { at: T(0), items: [row('kept-forever', T(-999_999))] } };

    const snapshot = snapshotOf({ items: many, favorites: starred });

    assert.strictEqual(snapshot.items.length, HISTORY_LIMIT);
    assert.deepStrictEqual(snapshot.favorites.work.items.map(r => r.input), ['kept-forever']);

    const merged = mergeSnapshot(snapshot, snapshotOf(), NOW);

    assert.deepStrictEqual(merged.favorites.work.items.map(r => r.input), ['kept-forever']);
});

test('a theme somebody wrote travels, unless it is too long to be one', (t) => {
    const mine = snapshotOf({ settings: { customTheme: { value: '{"tokens":{"ink":"#fff"}}', at: T(1) } } });
    const huge = snapshotOf({ settings: { customTheme: { value: `{"${'x'.repeat(9000)}":1}`, at: T(1) } } });

    assert.strictEqual(mine.settings.customTheme.value, '{"tokens":{"ink":"#fff"}}');
    assert.strictEqual(huge.settings.customTheme, null, 'a theme that big is not a theme');
});
