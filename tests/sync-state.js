import assert from 'node:assert';
import test from 'node:test';
import { LOCK_TTL_MS, SYNC_KEY, createSyncState, migrateSyncState } from '../src/sync/state.js';
import { storageOf } from './storage-double.js';

const NOW = 1_755_330_000_000;

test('remembering keeps the secret past the tab, not remembering does not', (t) => {
    const local = storageOf();
    const session = storageOf();
    const state = createSyncState(local, session);

    state.writeSecret('gist', 'ghp_1', true);
    assert.strictEqual(local.getItem('sync.secret.gist'), 'ghp_1');
    assert.strictEqual(session.has('sync.secret.gist'), false);
    assert.strictEqual(state.isRemembered('gist'), true);

    state.writeSecret('gist', 'ghp_2', false);
    assert.strictEqual(local.has('sync.secret.gist'), false);
    assert.strictEqual(state.readSecret('gist'), 'ghp_2');
    assert.strictEqual(state.isRemembered('gist'), false);
});

test('two providers do not step on each other', (t) => {
    const local = storageOf();
    const state = createSyncState(local, storageOf());

    state.writeSecret('gist', 'ghp_1', true);
    state.writeTarget('gist', 'abc123');
    state.writeSecret('file', 'none', true);
    state.writeTarget('file', 'backup.json');

    assert.strictEqual(state.readTarget('gist'), 'abc123');
    assert.strictEqual(state.readTarget('file'), 'backup.json');

    state.disconnect('gist');

    assert.strictEqual(state.readTarget('gist'), null);
    assert.strictEqual(state.readTarget('file'), 'backup.json');
    assert.strictEqual(state.readSecret('file'), 'none');
});

test('disconnecting clears the connection and keeps the data', (t) => {
    const local = storageOf({ uuidItems: '[]', uuidDeletions: '{}' });
    const state = createSyncState(local, storageOf());

    state.setActiveProvider('gist');
    state.writeSecret('gist', 'ghp_1', true);
    state.writeTarget('gist', 'abc123');
    state.writeCursor('gist', 'c1');
    state.writeAccount('gist', '@bavix');
    state.writeLastSync(NOW);

    state.disconnect('gist');

    assert.strictEqual(state.readSecret('gist'), null);
    assert.strictEqual(state.readCursor('gist'), null);
    assert.strictEqual(state.readAccount('gist'), null);
    assert.strictEqual(state.activeProvider(), null);
    assert.strictEqual(state.readLastSync(), 0);
    assert.strictEqual(local.getItem('uuidItems'), '[]');
    assert.strictEqual(local.getItem('uuidDeletions'), '{}');
});

test('forgetting a vanished target leaves the credentials alone', (t) => {
    const state = createSyncState(storageOf(), storageOf());

    state.writeSecret('gist', 'ghp_1', true);
    state.writeTarget('gist', 'abc123');
    state.writeCursor('gist', 'c1');

    state.forgetTarget('gist');

    assert.strictEqual(state.readTarget('gist'), null);
    assert.strictEqual(state.readCursor('gist'), null);
    assert.strictEqual(state.readSecret('gist'), 'ghp_1');
});

test('a second tab waits while the first is syncing', (t) => {
    const state = createSyncState(storageOf(), storageOf());

    assert.strictEqual(state.acquireLock('tab-1', NOW), true);
    assert.strictEqual(state.acquireLock('tab-2', NOW + 1000), false);
    assert.strictEqual(state.acquireLock('tab-1', NOW + 1000), true);

    state.releaseLock('tab-1');
    assert.strictEqual(state.acquireLock('tab-2', NOW + 2000), true);
});

test('a tab that died holding the lock does not block forever', (t) => {
    const state = createSyncState(storageOf(), storageOf());

    state.acquireLock('tab-1', NOW);

    assert.strictEqual(state.acquireLock('tab-2', NOW + LOCK_TTL_MS + 1), true);
});

test('a storage that refuses to answer is not a crash', (t) => {
    const blocked = {
        getItem: () => { throw new Error('blocked'); },
        setItem: () => { throw new Error('blocked'); },
        removeItem: () => { throw new Error('blocked'); },
    };
    const state = createSyncState(blocked, blocked);

    assert.strictEqual(state.readSecret('gist'), null);
    assert.strictEqual(state.readLastSync(), 0);
    assert.doesNotThrow(() => state.writeSecret('gist', 'ghp_1', true));
    assert.doesNotThrow(() => state.disconnect('gist'));
    assert.strictEqual(state.acquireLock('tab-1', NOW), true);
});

test('the whole of the sync state lives under one key', (t) => {
    const local = storageOf();
    const state = createSyncState(local, storageOf());

    state.setActiveProvider('gist');
    state.writeTarget('gist', 'target-1');
    state.writeCursor('gist', 'etag-1');
    state.writeAccount('gist', '@tester');
    state.writeExpiry('gist', '2026-11-01');
    state.writeFingerprint('gist', 'mark-1');
    state.writeLastSync(NOW);
    state.acquireLock('tab-1', NOW);

    const keys = Object.keys(local._keys());

    assert.deepStrictEqual(keys, [SYNC_KEY], 'one key, not eight');
    assert.deepStrictEqual(JSON.parse(local.getItem(SYNC_KEY)), {
        provider: 'gist',
        lastSync: NOW,
        blockedUntil: 0,
        lock: { owner: 'tab-1', at: NOW },
        stores: {
            gist: { target: 'target-1', cursor: 'etag-1', account: '@tester', sent: 'mark-1', expires: '2026-11-01' },
        },
    });
});

test('a profile written before the split is carried over whole', (t) => {
    const local = storageOf({
        'sync.provider': 'gist',
        'sync.lastSync': String(NOW),
        'sync.blockedUntil': String(NOW + 1000),
        'sync.lock': `tab-9:${NOW}`,
        'sync.gist.target': 'target-1',
        'sync.gist.cursor': 'etag-1',
        'sync.gist.account': '@tester',
        'sync.gist.sent': 'mark-1',
        'sync.gist.secret': 'v1:sealed',
        uuidActiveSeconds: '5',
    });
    const session = storageOf();

    assert.strictEqual(migrateSyncState(local, session), true);

    const state = createSyncState(local, session);

    assert.strictEqual(state.activeProvider(), 'gist');
    assert.strictEqual(state.readTarget('gist'), 'target-1');
    assert.strictEqual(state.readCursor('gist'), 'etag-1');
    assert.strictEqual(state.readAccount('gist'), '@tester');
    assert.strictEqual(state.readFingerprint('gist'), 'mark-1');
    assert.strictEqual(state.readLastSync(), NOW);
    assert.strictEqual(state.readBlockedUntil(), NOW + 1000);
    assert.strictEqual(state.readSecret('gist'), 'v1:sealed');
    assert.strictEqual(state.acquireLock('tab-1', NOW), false, 'the lock another tab held is still held');

    assert.deepStrictEqual(Object.keys(local._keys()).sort((a, b) => a.localeCompare(b)), ['sync', 'sync.secret.gist', 'uuidActiveSeconds']);
});

test('a secret kept only for the session moves without touching the other storage', (t) => {
    const local = storageOf({ 'sync.provider': 'gist', 'sync.gist.target': 'target-1' });
    const session = storageOf({ 'sync.gist.secret': 'v1:sealed' });

    migrateSyncState(local, session);

    assert.strictEqual(session.getItem('sync.secret.gist'), 'v1:sealed');
    assert.strictEqual(session.has('sync.gist.secret'), false);
    assert.strictEqual(local.has('sync.secret.gist'), false);
});

test('a profile that cannot be written keeps every old key', (t) => {
    const local = storageOf({ 'sync.provider': 'gist', 'sync.gist.secret': 'v1:sealed' });

    local.setItem = () => { throw new Error('quota'); };

    assert.strictEqual(migrateSyncState(local, storageOf()), false);
    assert.strictEqual(local.getItem('sync.provider'), 'gist');
    assert.strictEqual(local.getItem('sync.gist.secret'), 'v1:sealed');
});

test('a fresh profile has nothing to carry over, and migrating twice is a no-op', (t) => {
    const local = storageOf();

    assert.strictEqual(migrateSyncState(local, storageOf()), false);
    assert.strictEqual(local.has(SYNC_KEY), false);

    const state = createSyncState(local, storageOf());

    state.setActiveProvider('gist');

    assert.strictEqual(migrateSyncState(local, storageOf()), false);
    assert.strictEqual(state.activeProvider(), 'gist');
});

test('rubbish under the key reads as nothing connected', (t) => {
    const local = storageOf({ sync: 'not json' });
    const state = createSyncState(local, storageOf());

    assert.strictEqual(state.activeProvider(), null);
    assert.strictEqual(state.readLastSync(), 0);
    assert.strictEqual(state.readTarget('gist'), null);
});

test('disconnecting takes the store out of the object and leaves the rest', (t) => {
    const local = storageOf();
    const state = createSyncState(local, storageOf());

    state.setActiveProvider('gist');
    state.writeTarget('gist', 'target-1');
    state.writeSecret('gist', 'v1:sealed', true);
    state.writeTarget('other', 'target-2');

    state.disconnect('gist');

    const held = JSON.parse(local.getItem(SYNC_KEY));

    assert.strictEqual(held.provider, null);
    assert.deepStrictEqual(Object.keys(held.stores), ['other']);
    assert.strictEqual(local.has('sync.secret.gist'), false);
});

test('reading state on a fresh profile writes nothing at all', (t) => {
    const local = storageOf();
    const state = createSyncState(local, storageOf());

    state.activeProvider();
    state.readSecret('gist');
    state.readTarget('gist');
    state.readCursor('gist');
    state.readAccount('gist');
    state.readExpiry('gist');
    state.readFingerprint('gist');
    state.readLastSync();
    state.readBlockedUntil();

    assert.deepStrictEqual(Object.keys(local._keys()), [], 'nothing connected, nothing stored');
});
