import assert from 'node:assert';
import test from 'node:test';
import { buildSnapshot, parseSnapshot } from '../src/sync/snapshot.js';
import { exchange, fingerprint } from '../src/sync/engine.js';

const NOW = 1_755_330_000_000;
const T = (offset) => NOW + offset;
const row = (input, at, info = '') => ({ input, output: `${input}-out`, info, at });
const keys = (snapshot) => snapshot.items.map(item => item.input);

function snapshotOf(overrides = {}) {
    return buildSnapshot({
        items: [], favorites: {}, settings: {},
        tombstones: {}, favoriteTombstones: {}, clearedAt: 0,
        ...overrides,
    }, NOW);
}

function sideOf(snapshot, { name = 'side' } = {}) {
    const state = {
        content: snapshot === null ? null : JSON.stringify(snapshot),
        cursor: snapshot === null ? null : `${name}-1`,
        reads: 0,
        writes: 0,
    };

    const session = {
        async read(target, cursor) {
            state.reads += 1;

            if (cursor && cursor === state.cursor) {
                return { unchanged: true };
            }

            return {
                unchanged: false,
                content: state.content,
                cursor: state.cursor,
                staleBase: cursor !== state.cursor,
            };
        },

        async write(target, content) {
            state.writes += 1;
            state.content = content;
            state.cursor = `${name}-${state.writes + 1}`;

            return { target: target || 'target-1', cursor: state.cursor, applied: true };
        },
    };

    return { state, session, snapshot: () => parseSnapshot(state.content, NOW) };
}

test('with no target yet, what is here creates the store', async (t) => {
    const here = sideOf(snapshotOf({ items: [row('a', T(0))] }), { name: 'here' });
    const there = sideOf(null, { name: 'there' });

    const result = await exchange(here.session, there.session, { target: null, now: NOW });

    assert.strictEqual(result.target, 'target-1');
    assert.deepStrictEqual(keys(there.snapshot()), ['a']);
    assert.strictEqual(here.state.writes, 0, 'nothing was written back into this browser');
});

test('a store that has not moved, and a browser that has not either, costs two reads', async (t) => {
    const shared = snapshotOf({ items: [row('a', T(0))] });
    const here = sideOf(shared, { name: 'here' });
    const there = sideOf(shared, { name: 'there' });

    const result = await exchange(here.session, there.session, {
        target: 'target-1',
        cursor: there.state.cursor,
        hereCursor: here.state.cursor,
        now: NOW,
    });

    assert.strictEqual(result.skipped, true);
    assert.strictEqual(here.state.writes + there.state.writes, 0);
});

test('work done here goes out when the store has not moved', async (t) => {
    const here = sideOf(snapshotOf({ items: [row('a', T(0)), row('b', T(5))] }), { name: 'here' });
    const there = sideOf(snapshotOf({ items: [row('a', T(0))] }), { name: 'there' });

    await exchange(here.session, there.session, {
        target: 'target-1',
        cursor: there.state.cursor,
        hereCursor: 'stale',
        now: NOW,
    });

    assert.deepStrictEqual(keys(there.snapshot()), ['b', 'a']);
    assert.strictEqual(here.state.writes, 0);
});

test('a store that moved is merged into this browser and back out', async (t) => {
    const here = sideOf(snapshotOf({ items: [row('a', T(0))] }), { name: 'here' });
    const there = sideOf(snapshotOf({ items: [row('b', T(10))] }), { name: 'there' });

    const result = await exchange(here.session, there.session, {
        target: 'target-1',
        cursor: 'stale',
        hereCursor: 'stale',
        now: NOW,
    });

    assert.strictEqual(result.merged, true);
    assert.strictEqual(result.applied, true);
    assert.deepStrictEqual(keys(here.snapshot()), ['b', 'a']);
    assert.deepStrictEqual(keys(there.snapshot()), ['b', 'a']);
    assert.deepStrictEqual(result.summary, { added: 1, removed: 0, tags: 0 });
});

test('what only the store had comes in without writing back to it', async (t) => {
    const here = sideOf(snapshotOf({ items: [row('a', T(0))] }), { name: 'here' });
    const there = sideOf(snapshotOf({ items: [row('a', T(0)), row('b', T(10))] }), { name: 'there' });

    await exchange(here.session, there.session, {
        target: 'target-1',
        cursor: 'stale',
        hereCursor: 'stale',
        now: NOW,
    });

    assert.deepStrictEqual(keys(here.snapshot()), ['b', 'a']);
    assert.strictEqual(there.state.writes, 0, 'the store already held the merge');
});

test('a deletion recorded here survives the exchange and reaches the store', async (t) => {
    const here = sideOf(snapshotOf({
        items: [row('b', T(0))],
        tombstones: { 'a:a-out': T(100) }, favoriteTombstones: {}, clearedAt: 0,
    }), { name: 'here' });
    const there = sideOf(snapshotOf({ items: [row('a', T(0)), row('b', T(0))] }), { name: 'there' });

    await exchange(here.session, there.session, {
        target: 'target-1',
        cursor: 'stale',
        hereCursor: 'stale',
        now: NOW,
    });

    assert.deepStrictEqual(keys(there.snapshot()), ['b']);
});

test('two browsers meeting over one store converge', async (t) => {
    const store = sideOf(null, { name: 'store' });
    const first = sideOf(snapshotOf({ items: [row('a', T(0))] }), { name: 'first' });
    const second = sideOf(snapshotOf({ items: [row('b', T(10))] }), { name: 'second' });

    const created = await exchange(first.session, store.session, { target: null, now: NOW });

    await exchange(second.session, store.session, {
        target: created.target,
        cursor: null,
        hereCursor: null,
        now: NOW,
    });

    await exchange(first.session, store.session, {
        target: created.target,
        cursor: created.cursor,
        hereCursor: created.hereCursor,
        now: NOW,
    });

    assert.deepStrictEqual(keys(first.snapshot()), ['b', 'a']);
    assert.deepStrictEqual(keys(second.snapshot()), ['b', 'a']);
    assert.deepStrictEqual(keys(store.snapshot()), ['b', 'a']);
});

test('creating a store works even when the local fingerprint is current', async (t) => {
    const held = snapshotOf({ items: [row('a', T(0))] });
    const here = sideOf(held, { name: 'here' });
    const there = sideOf(null, { name: 'there' });

    const result = await exchange(here.session, there.session, {
        target: null,
        hereCursor: here.state.cursor,
        now: NOW,
    });

    assert.deepStrictEqual(keys(there.snapshot()), ['a'], 'the browser is read in full, not skipped as unchanged');
    assert.strictEqual(result.target, 'target-1');
});

test('the engine never mentions the store it talks to', async (t) => {
    const source = await import('node:fs').then(fs => fs.readFileSync('src/sync/engine.js', 'utf8'));

    for (const word of ['gist', 'github', 'etag', 'token', 'http', 'fetch', 'localstorage']) {
        assert.ok(!source.toLowerCase().includes(word), `engine.js mentions "${word}"`);
    }
});

test('the fingerprint ignores the timestamp and nothing else', async (t) => {
    const one = snapshotOf({ items: [row('a', T(0))] });
    const two = { ...one, timestamp: new Date(NOW + 5000).toISOString() };
    const three = snapshotOf({ items: [row('a', T(1))] });

    assert.strictEqual(fingerprint(one), fingerprint(two));
    assert.notStrictEqual(fingerprint(one), fingerprint(three));
});

test('the sync layer holds no timers at all', async (t) => {
    const fs = await import('node:fs');
    const files = fs.readdirSync('src/sync').filter(name => name.endsWith('.js'));
    files.push(...fs.readdirSync('src/sync/providers').map(name => `providers/${name}`));

    const offenders = [];

    for (const name of files) {
        const source = fs.readFileSync(`src/sync/${name}`, 'utf8');

        for (const timer of ['setTimeout', 'setInterval', 'requestAnimationFrame', 'requestIdleCallback']) {
            if (source.includes(timer)) {
                offenders.push(`${name}: ${timer}`);
            }
        }
    }

    assert.deepStrictEqual(offenders, [], 'sync runs on events, never on a clock');
});

test('one exchange settles both sides when both have moved', async (t) => {
    const here = sideOf(snapshotOf({ items: [row('mine', T(0))] }), { name: 'here' });
    const there = sideOf(snapshotOf({ items: [row('theirs', T(5))] }), { name: 'there' });

    const result = await exchange(here.session, there.session, {
        target: 'target-1',
        cursor: 'stale',
        hereCursor: 'stale',
        now: NOW,
    });

    assert.strictEqual(result.applied, true, 'this browser took what the store had');
    assert.strictEqual(here.state.writes, 1, 'exactly one write here');
    assert.strictEqual(there.state.writes, 1, 'exactly one write there');
    assert.deepStrictEqual(keys(here.snapshot()), ['theirs', 'mine']);
    assert.deepStrictEqual(keys(there.snapshot()), ['theirs', 'mine']);
});
