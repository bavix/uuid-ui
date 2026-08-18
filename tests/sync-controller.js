import assert from 'node:assert';
import test from 'node:test';
import { createBus } from '../src/data/bus.js';
import { createDataStore } from '../src/data/store.js';
import { createSyncState } from '../src/sync/state.js';
import { createController, forgetSharedController, sharedController, startLive } from '../src/sync/controller.js';
import { SYNC_CODES, SyncError } from '../src/sync/provider.js';
import { buildSnapshot } from '../src/sync/snapshot.js';
import { storageOf } from './storage-double.js';

const NOW = 1_755_330_000_000;
const row = (input, at, info = '') => ({ input, output: `${input}-out`, info, at });

function remoteSnapshot(overrides = {}) {
    return JSON.stringify(buildSnapshot({
        items: [], favorites: {}, settings: {},
        tombstones: {}, favoriteTombstones: {}, clearedAt: 0,
        ...overrides,
    }, NOW));
}

function providerOf(session, needs = []) {
    return {
        id: 'stub',
        label: 'Stub store',
        needs,
        create: () => session,
    };
}

function setup(session, { storage, vault } = {}) {
    const bus = createBus();
    const local = storage || storageOf();
    const store = createDataStore({ storage: local, bus });
    const state = createSyncState(local, storageOf());
    const events = [];

    bus.on('sync-state', payload => events.push(payload.status));

    const controller = createController({
        store, bus, state,
        resolve: async () => providerOf(session),
        ...(vault ? { vault } : {}),
    });

    return { bus, store, state, controller, events, local };
}

function storeSession(content, overrides = {}) {
    const calls = { reads: 0, writes: 0, located: 0 };

    return {
        calls,
        async account() {
            return { name: '@tester' };
        },
        async locate() {
            calls.located += 1;

            return overrides.found || [];
        },
        async read() {
            calls.reads += 1;

            if (overrides.readFails) {
                throw overrides.readFails;
            }

            return { unchanged: false, content, cursor: 'c2', staleBase: true };
        },
        async write(target, body) {
            calls.writes += 1;
            calls.body = body;

            return { target: target || 'target-1', cursor: 'c3' };
        },
        link: (target) => (target ? `stub://${target}` : null),
    };
}

test('connecting stores the account and looks for an existing store', async (t) => {
    const session = storeSession(remoteSnapshot());
    const { controller, state } = setup(session);

    const result = await controller.connect('stub', { token: 'x' }, true);

    assert.strictEqual(result.account.name, '@tester');
    assert.strictEqual(state.activeProvider(), 'stub');
    assert.strictEqual(state.readAccount('stub'), '@tester');
    assert.strictEqual(session.calls.located, 1);
    assert.strictEqual(controller.status().connected, true);
});

test('one store found is taken, several are offered', async (t) => {
    const single = storeSession(remoteSnapshot(), { found: [{ targetId: 'only', label: '', updatedAt: '' }] });
    const one = setup(single);
    await one.controller.connect('stub', { token: 'x' }, true);
    assert.strictEqual(one.state.readTarget('stub'), 'only');

    const many = storeSession(remoteSnapshot(), {
        found: [{ targetId: 'a', label: '', updatedAt: '' }, { targetId: 'b', label: '', updatedAt: '' }],
    });
    const two = setup(many);
    const result = await two.controller.connect('stub', { token: 'x' }, true);

    assert.strictEqual(two.state.readTarget('stub'), null);
    assert.strictEqual(result.found.length, 2);

    two.controller.chooseTarget('b');
    assert.strictEqual(two.state.readTarget('stub'), 'b');
});

test('a sync writes remote data into the store without inventing deletions', async (t) => {
    const content = remoteSnapshot({ items: [row('remote', NOW)] });
    const session = storeSession(content);
    const { controller, store, state } = setup(session);

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');
    store.setRows([{ input: 'local', output: 'local-out', info: '' }]);

    await controller.sync();

    assert.deepStrictEqual(store.snapshot().items.map(r => r.input).sort(), ['local', 'remote']);
    assert.deepStrictEqual(store.snapshot().tombstones, {});
    assert.ok(state.readCursor('stub'));
    assert.ok(state.readLastSync() > 0);
});

test('a sync applies the settings that won the merge', async (t) => {
    const content = remoteSnapshot({
        settings: { theme: { value: 'dark', at: NOW + 1000 }, uuidType: { value: 'v7', at: NOW + 1000 } },
    });
    const { controller, store, state } = setup(storeSession(content));

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');

    await controller.sync();

    assert.strictEqual(store.snapshot().settings.theme.value, 'dark');
    assert.strictEqual(store.snapshot().settings.uuidType.value, 'v7');
});

test('a deletion made here is not undone by what comes back', async (t) => {
    const content = remoteSnapshot({ items: [row('a', NOW - 1000), row('b', NOW - 1000)] });
    const { controller, store, state } = setup(storeSession(content));

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');

    store.setRows([{ input: 'a', output: 'a-out', info: '' }, { input: 'b', output: 'b-out', info: '' }]);
    store.setRows([{ input: 'b', output: 'b-out', info: '' }]);

    await controller.sync();

    assert.deepStrictEqual(store.snapshot().items.map(r => r.input), ['b']);
});

test('the store is told the data came from elsewhere', async (t) => {
    const { controller, bus, state } = setup(storeSession(remoteSnapshot({ items: [row('remote', NOW)] })));
    const origins = [];
    bus.on('data', payload => origins.push(payload.origin));

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');

    await controller.sync();

    assert.ok(origins.includes('remote'));
});

test('a second tab holding the lock is skipped, not fought', async (t) => {
    const { controller, state } = setup(storeSession(remoteSnapshot()));

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');
    state.acquireLock('other-tab', Date.now());

    assert.deepStrictEqual(await controller.sync(), { skipped: true, locked: true });
});

test('a vanished store is forgotten instead of retried forever', async (t) => {
    const session = storeSession(remoteSnapshot(), { readFails: new SyncError(SYNC_CODES.MISSING, 'gone') });
    const { controller, state } = setup(session);

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');

    await assert.rejects(() => controller.sync(), (e) => e.code === SYNC_CODES.MISSING);
    assert.strictEqual(state.readTarget('stub'), null);
});

test('the lock is released even when the exchange fails', async (t) => {
    const session = storeSession(remoteSnapshot(), { readFails: new SyncError(SYNC_CODES.OFFLINE, 'no net') });
    const { controller, state, events } = setup(session);

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');

    await assert.rejects(() => controller.sync());
    assert.strictEqual(state.acquireLock('another-tab', Date.now()), true);
    assert.deepStrictEqual(events, ['connected', 'working', 'failed', 'idle']);
});

test('syncing with nothing connected asks for credentials rather than throwing at random', async (t) => {
    const { controller } = setup(storeSession(remoteSnapshot()));

    await assert.rejects(() => controller.sync(), (e) => e.code === SYNC_CODES.UNAUTHORIZED);
});

test('disconnecting forgets the connection and keeps the history', async (t) => {
    const { controller, store, state } = setup(storeSession(remoteSnapshot()));

    await controller.connect('stub', { token: 'x' }, true);
    store.setRows([{ input: 'a', output: 'a-out', info: '' }]);

    controller.disconnect();

    assert.strictEqual(state.readSecret('stub'), null);
    assert.strictEqual(controller.status().connected, false);
    assert.deepStrictEqual(store.snapshot().items.map(r => r.input), ['a']);
});


test('one sync covers both directions: create, then fetch, then send', async (t) => {
    const session = storeSession(remoteSnapshot({ items: [row('remote', NOW)] }));
    const { controller, store, state } = setup(session);

    await controller.connect('stub', { token: 'x' }, true);

    const created = await controller.sync();
    assert.strictEqual(created.target, 'target-1', 'with no target yet, syncing creates one');

    session.calls.body = null;
    state.writeCursor('stub', 'stale');
    const fetched = await controller.sync();
    assert.deepStrictEqual(store.snapshot().items.map(r => r.input), ['remote'], 'what was out there comes in');
    assert.strictEqual(fetched.applied, true, 'a moved store is read into this browser, not blindly overwritten');

    store.setRows([{ input: 'local', output: 'local-out', info: '' }, ...store.snapshot().items]);
    await controller.sync();

    const stored = JSON.parse(session.calls.body).items.map(r => r.input).sort();
    assert.deepStrictEqual(stored, ['local', 'remote'], 'work done here goes out on the next sync');
});


test('a finished exchange is announced, so the indicator can settle', async (t) => {
    const { controller, state, events } = setup(storeSession(remoteSnapshot()));

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');
    events.length = 0;

    await controller.sync();

    assert.deepStrictEqual(events, ['working', 'synced', 'idle']);
});

function liveHarness(session) {
    const parts = setup(session);
    const listeners = {};
    const win = {
        addEventListener: (name, fn) => { listeners[name] = fn; },
        removeEventListener: (name) => { delete listeners[name]; },
    };
    const doc = {
        visibilityState: 'visible',
        addEventListener: (name, fn) => { listeners[name] = fn; },
        removeEventListener: (name) => { delete listeners[name]; },
    };

    return { ...parts, listeners, win, doc };
}

const settle = () => new Promise(resolve => setImmediate(resolve));

async function quiet(session, rounds = 8) {
    let seen = -1;

    for (let i = 0; i < rounds && seen !== session.calls.writes; i++) {
        seen = session.calls.writes;
        await settle();
    }
}

test('a page that opens already connected syncs at once, with no timer', async (t) => {
    const session = storeSession(remoteSnapshot({ items: [row('remote', NOW)] }));
    const { controller, state, store, bus, win, doc } = liveHarness(session);

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');
    state.writeCursor('stub', 'stale');

    const stop = startLive({ controller, bus, state, win, doc });
    await settle();

    assert.deepStrictEqual(store.snapshot().items.map(r => r.input), ['remote'], 'what is out there arrives on load');

    stop();
});

test('a local write goes out immediately', async (t) => {
    const session = storeSession(remoteSnapshot());
    const { controller, state, store, bus, win, doc } = liveHarness(session);

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');

    const stop = startLive({ controller, bus, state, win, doc });
    await settle();

    const before = session.calls.writes;
    store.setRows([{ input: 'typed', output: 'typed-out', info: '' }]);
    await settle();

    assert.ok(session.calls.writes > before, 'the write reached the store without waiting');
    assert.ok(JSON.parse(session.calls.body).items.some(item => item.input === 'typed'));

    stop();
});

test('writes made while an exchange is in flight are not lost', async (t) => {
    const session = storeSession(remoteSnapshot());
    const { controller, state, store, bus, win, doc } = liveHarness(session);

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');

    const stop = startLive({ controller, bus, state, win, doc });
    await settle();

    let held = null;
    const original = session.write;
    session.write = (target, content) => {
        if (!held) {
            return new Promise(resolve => { held = () => resolve(original(target, content)); });
        }

        return original(target, content);
    };

    store.setRows([{ input: 'first', output: 'first-out', info: '' }]);
    await settle();

    store.setRows([{ input: 'second', output: 'second-out', info: '' }, ...store.snapshot().items]);
    await settle();

    held();
    await quiet(session);

    const stored = JSON.parse(session.calls.body).items.map(item => item.input).sort();
    assert.deepStrictEqual(stored, ['first', 'second'], 'the write that happened mid-flight still went out');

    stop();
});

test('data arriving from the store does not bounce back as a new sync', async (t) => {
    const session = storeSession(remoteSnapshot({ items: [row('remote', NOW)] }));
    const { controller, state, store, bus, win, doc } = liveHarness(session);

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');
    state.writeCursor('stub', 'stale');

    const stop = startLive({ controller, bus, state, win, doc });
    await settle();

    const reads = session.calls.reads;
    store.applyRemote({
        items: [{ input: 'remote', output: 'remote-out', info: '', at: NOW }],
        favorites: {}, tombstones: {}, favoriteTombstones: {}, clearedAt: 0, settings: {},
    });
    await settle();

    assert.strictEqual(session.calls.reads, reads, 'applying remote data starts no exchange');

    stop();
});

test('coming back to the tab, regaining focus and going online all sync', async (t) => {
    const session = storeSession(remoteSnapshot());
    const { controller, state, bus, win, doc, listeners } = liveHarness(session);

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');

    const stop = startLive({ controller, bus, state, win, doc });
    await settle();

    for (const name of ['visibilitychange', 'focus', 'online', 'storage']) {
        const reads = session.calls.reads;
        state.writeCursor('stub', `stale-${name}`);
        await listeners[name]({ key: 'uuidItems' });
        await settle();

        assert.ok(session.calls.reads > reads, `${name} did not reach the store`);
    }

    stop();
});

test('a used-up rate limit stops further requests until it lifts', async (t) => {
    const session = storeSession(remoteSnapshot(), {
        readFails: new SyncError(SYNC_CODES.RATE_LIMITED, 'slow down', { minutes: 10 }),
    });
    const { controller, state, store, bus, win, doc } = liveHarness(session);

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');

    const stop = startLive({ controller, bus, state, win, doc });
    await settle();

    assert.ok(state.readBlockedUntil() > Date.now(), 'the block is remembered');

    const reads = session.calls.reads;
    store.setRows([{ input: 'typed', output: 'typed-out', info: '' }]);
    await settle();

    assert.strictEqual(session.calls.reads, reads, 'nothing is sent while the limit holds');

    state.writeBlockedUntil(0);
    store.setRows([{ input: 'later', output: 'later-out', info: '' }, ...store.snapshot().items]);
    await settle();

    assert.ok(session.calls.reads > reads, 'once it lifts, the next change goes out');

    stop();
});

test('nothing happens at all while no store is connected', async (t) => {
    const session = storeSession(remoteSnapshot());
    const { controller, state, store, bus, win, doc } = liveHarness(session);

    const stop = startLive({ controller, bus, state, win, doc });
    await settle();

    store.setRows([{ input: 'typed', output: 'typed-out', info: '' }]);
    await settle();

    assert.strictEqual(session.calls.reads, 0);
    assert.strictEqual(session.calls.writes, 0);

    stop();
});

test('what was typed during an exchange is not overwritten by what comes back', async (t) => {
    const session = storeSession(remoteSnapshot({ items: [row('remote', NOW)] }));
    const { controller, store, state } = setup(session);

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');
    store.setRows([{ input: 'local', output: 'local-out', info: '' }]);

    let held = null;
    const original = session.write;
    session.write = (target, content) => {
        store.setRows([{ input: 'typed-meanwhile', output: 'typed-out', info: '' }, ...store.snapshot().items]);

        if (!held) {
            held = true;
        }

        return original(target, content);
    };

    await controller.sync();

    assert.ok(held, 'the store was written to');
    assert.deepStrictEqual(
        store.snapshot().items.map(r => r.input).sort(),
        ['local', 'remote', 'typed-meanwhile'],
        'the row written mid-exchange survived the snapshot coming back',
    );
});

test('two tabs on one machine settle instead of waking each other forever', async (t) => {
    const listeners = [[], []];
    const map = new Map();
    const shared = {
        getItem: key => (map.has(key) ? map.get(key) : null),
        setItem: (key, value) => {
            const held = map.get(key);
            map.set(key, value);

            if (held !== value) {
                for (const group of listeners) {
                    for (const fn of group) {
                        fn({ key });
                    }
                }
            }
        },
        removeItem: key => map.delete(key),
    };

    const store = {
        content: remoteSnapshot(),
        revision: '1',
        writes: 0,
    };

    const provider = {
        id: 'shared',
        needs: [],
        create: () => ({
            async account() { return { name: 'shared' }; },
            async locate() { return [{ targetId: 'one', label: '', updatedAt: '' }]; },
            async read(target, cursor) {
                if (cursor === store.revision) {
                    return { unchanged: true };
                }

                return { unchanged: false, content: store.content, cursor: store.revision, staleBase: cursor !== store.revision };
            },
            async write(target, content) {
                store.writes += 1;
                store.content = content;
                store.revision = `r${store.writes + 1}`;
                shared.setItem('sync.shared.store', store.revision);

                return { target: 'one', cursor: store.revision };
            },
            link: () => null,
        }),
    };

    function openTab(index) {
        const bus = createBus();
        const store = createDataStore({ storage: shared, bus });
        const state = createSyncState(shared, storageOf());
        const controller = createController({ store, bus, state, resolve: async () => provider });
        const win = {
            addEventListener: (name, fn) => { if (name === 'storage') { listeners[index].push(fn); } },
            removeEventListener: () => {},
        };
        const doc = { visibilityState: 'visible', addEventListener: () => {}, removeEventListener: () => {} };

        return { bus, store, state, controller, win, doc };
    }

    const first = openTab(0);
    await first.controller.connect('shared', {}, true);

    const second = openTab(1);
    const stopFirst = startLive({ ...first, controller: first.controller });
    const stopSecond = startLive({ ...second, controller: second.controller });

    for (let i = 0; i < 40; i++) {
        await settle();
    }

    const quietWrites = store.writes;

    for (let i = 0; i < 40; i++) {
        await settle();
    }

    assert.strictEqual(store.writes, quietWrites, 'idle tabs must stop writing to the store');

    first.store.setRows([{ input: 'typed', output: 'typed-out', info: '' }]);

    for (let i = 0; i < 60; i++) {
        await settle();
    }

    assert.ok(store.writes <= quietWrites + 3, `one change must not cascade (${store.writes - quietWrites} writes)`);
    assert.ok(JSON.parse(store.content).items.some(item => item.input === 'typed'));

    stopFirst();
    stopSecond();
});

test('disconnecting mid-exchange writes no keys for a store that is gone', async (t) => {
    const session = storeSession(remoteSnapshot({ items: [row('remote', NOW)] }));
    const parts = setup(session);
    const { controller, state, local } = parts;

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');
    parts.store.setRows([{ input: 'local', output: 'local-out', info: '' }]);

    const original = session.write;
    session.write = async (target, content) => {
        controller.disconnect();

        return original(target, content);
    };

    const stamped = state.readLastSync();

    await controller.sync().catch(() => {});

    const stray = Object.keys(local._keys ? local._keys() : {}).filter(key => key.includes('.null.'));

    assert.deepStrictEqual(stray, [], 'no sync.null.* keys');
    assert.strictEqual(state.readLastSync(), stamped, 'an exchange for a store that was dropped stamps nothing');
});

test('one controller per tab, however many callers ask for it', async (t) => {
    const parts = setup(storeSession(remoteSnapshot()));

    forgetSharedController();

    const first = sharedController({ store: parts.store, bus: parts.bus, state: parts.state });
    const second = sharedController({ store: parts.store, bus: parts.bus, state: parts.state });

    assert.strictEqual(first, second);

    forgetSharedController();

    assert.notStrictEqual(sharedController({ store: parts.store, bus: parts.bus, state: parts.state }), first);
});

test('unsent work is visible until the exchange takes it', async (t) => {
    const session = storeSession(remoteSnapshot());
    const { controller, state, store } = setup(session);

    await controller.connect('stub', { token: 'x' }, true);
    state.writeTarget('stub', 'target-1');

    await controller.sync();
    assert.strictEqual(controller.pending(), false, 'right after a sync there is nothing waiting');

    store.setRows([{ input: 'typed', output: 'typed-out', info: '' }]);
    assert.strictEqual(controller.pending(), true, 'a local write is waiting');

    await controller.sync();
    assert.strictEqual(controller.pending(), false, 'the exchange took it');
});

test('nothing is waiting while no store is connected', async (t) => {
    const { controller } = setup(storeSession(remoteSnapshot()));

    assert.strictEqual(controller.pending(), false);
});

test('opening the page is itself a sync, with no event and no timer', async (t) => {
    const session = storeSession(remoteSnapshot({ items: [row('waiting-out-there', NOW)] }));
    const parts = setup(session);

    await parts.controller.connect('stub', { token: 'x' }, true);
    parts.state.writeTarget('stub', 'target-1');
    parts.state.writeCursor('stub', 'stale');

    const reads = session.calls.reads;
    const stop = startLive({
        controller: parts.controller,
        bus: parts.bus,
        state: parts.state,
        win: { addEventListener: () => {}, removeEventListener: () => {} },
        doc: null,
    });

    await new Promise(resolve => setImmediate(resolve));

    assert.ok(session.calls.reads > reads, 'the store was read on mount');
    assert.deepStrictEqual(parts.store.snapshot().items.map(r => r.input), ['waiting-out-there']);

    stop();
});

function markingVault() {
    const seen = { seals: 0 };

    return {
        seen,
        sealed(text) {
            return typeof text === 'string' && text.startsWith('sealed:');
        },
        async seal(text) {
            seen.seals += 1;

            return `sealed:${Buffer.from(text).toString('base64')}`;
        },
        async open(text) {
            if (!text) {
                return null;
            }

            if (!text.startsWith('sealed:')) {
                return text;
            }

            return Buffer.from(text.slice('sealed:'.length), 'base64').toString('utf8');
        },
    };
}

test('the token is never written down in the open', async (t) => {
    const vault = markingVault();
    const { controller, state } = setup(storeSession(null), { vault });

    await controller.connect('stub', { token: 'ghp_secretvalue' }, true);

    const held = state.readSecret('stub');

    assert.ok(vault.sealed(held), 'what reaches storage is sealed');
    assert.ok(!held.includes('ghp_secretvalue'), 'the token itself is not in storage');
});

test('a token left in the open by an older build is sealed the first time it is used', async (t) => {
    const vault = markingVault();
    const session = storeSession(remoteSnapshot({ items: [row('a', NOW)] }));
    const storage = storageOf();

    storage.setItem('sync.provider', 'stub');
    storage.setItem('sync.stub.secret', JSON.stringify({ token: 'ghp_fromthepast' }));
    storage.setItem('sync.stub.target', 'target-1');

    const { controller, state } = setup(session, { vault, storage });

    await controller.sync();

    const held = state.readSecret('stub');

    assert.ok(vault.sealed(held), 'the old plain token was put away');
    assert.ok(!held.includes('ghp_fromthepast'));
});

test('a token that can no longer be opened reads as no credentials', async (t) => {
    const vault = markingVault();
    const storage = storageOf();

    storage.setItem('sync.provider', 'stub');
    storage.setItem('sync.stub.secret', 'sealed:lostkey');

    const { controller } = setup(storeSession(null), { vault, storage });

    vault.open = async () => null;

    await assert.rejects(() => controller.sync(), error => error.code === SYNC_CODES.UNAUTHORIZED);
});

test('the backup file carries no credentials', async (t) => {
    const vault = markingVault();
    const { controller, store } = setup(storeSession(null), { vault });

    store.setRows([row('a', NOW)]);
    await controller.connect('stub', { token: 'ghp_secretvalue' }, true);

    const backup = controller.exportSnapshot();

    assert.ok(!backup.includes('ghp_secretvalue'), 'the export is data only');
    assert.ok(!backup.includes('token'));
});

test('a store that only reads and writes is store enough', async (t) => {
    let content = null;
    const bare = {
        id: 'bare',
        label: 'Bare store',
        create: () => ({
            async read(target, cursor) {
                return content === null
                    ? { unchanged: false, content: null, cursor: null, staleBase: false }
                    : { unchanged: cursor === 'mark', content, cursor: 'mark', staleBase: cursor !== 'mark' };
            },
            async write(target, body) {
                content = body;

                return { target: target || 'bare-1', cursor: 'mark', applied: true };
            },
        }),
    };

    const bus = createBus();
    const local = storageOf();
    const store = createDataStore({ storage: local, bus });
    const state = createSyncState(local, storageOf());
    const controller = createController({ store, bus, state, resolve: async () => bare });

    store.setRows([{ input: 'a', output: 'a-out', info: '' }]);

    const { account, found } = await controller.connect('bare', {}, true);

    assert.deepStrictEqual(account, { name: 'Bare store' }, 'the label stands in for an account');
    assert.deepStrictEqual(found, [], 'a store that cannot list candidates offers none');

    await controller.sync();

    assert.deepStrictEqual(JSON.parse(content).items.map(row => row.input), ['a']);
    assert.strictEqual(state.readTarget('bare'), 'bare-1');
});

test('a store that cannot read or write is refused at the door', async (t) => {
    const broken = { id: 'broken', label: 'Broken', create: () => ({}) };
    const bus = createBus();
    const local = storageOf();
    const controller = createController({
        store: createDataStore({ storage: local, bus }),
        bus,
        state: createSyncState(local, storageOf()),
        resolve: async () => broken,
    });

    await assert.rejects(() => controller.connect('broken', {}, true), error => error.code === SYNC_CODES.REFUSED);
});
