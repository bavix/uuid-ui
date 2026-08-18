import assert from 'node:assert';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import { browserVault, createVault } from '../src/sync/vault.js';
import { expiryOf } from '../src/sync/format.js';

function fakeIndexedDb() {
    const stores = new Map();
    const state = { opens: 0, keys: () => stores };

    const settle = (request, value, error) => {
        setTimeout(() => {
            if (error) {
                request.error = error;
                request.onerror?.();

                return;
            }

            request.result = value;
            request.onsuccess?.();
        }, 0);
    };

    return {
        state,

        open(name) {
            state.opens += 1;

            const db = {
                objectStoreNames: { contains: (store) => stores.has(store) },
                createObjectStore: (store) => stores.set(store, new Map()),
                close() {},
                transaction(store) {
                    return {
                        objectStore() {
                            return {
                                get(id) {
                                    const request = {};
                                    settle(request, stores.get(store)?.get(id));

                                    return request;
                                },
                                put(value, id) {
                                    const request = {};
                                    stores.get(store).set(id, value);
                                    settle(request, id);

                                    return request;
                                },
                            };
                        },
                    };
                },
            };

            const request = {};

            setTimeout(() => {
                request.result = db;
                request.onupgradeneeded?.();
                request.onsuccess?.();
            }, 0);

            return request;
        },
    };
}

function vaultOf(factory = fakeIndexedDb()) {
    return {
        factory,
        vault: createVault({
            factory,
            subtle: webcrypto.subtle,
            random: bytes => webcrypto.getRandomValues(bytes),
        }),
    };
}

test('a sealed token no longer reads as a token', async (t) => {
    const { vault } = vaultOf();
    const secret = JSON.stringify({ token: 'ghp_averyrealtokenvalue' });

    const sealed = await vault.seal(secret);

    assert.ok(vault.sealed(sealed));
    assert.ok(!sealed.includes('ghp_'), 'the token does not survive in the stored text');
    assert.strictEqual(await vault.open(sealed), secret);
});

test('the key is made once and reused across seals', async (t) => {
    const { factory, vault } = vaultOf();

    const one = await vault.seal('first');
    const two = await vault.seal('second');

    assert.notStrictEqual(one, two);
    assert.strictEqual(await vault.open(one), 'first');
    assert.strictEqual(await vault.open(two), 'second');
    assert.strictEqual(factory.state.keys().get('keys').size, 1);
});

test('the same text seals differently every time', async (t) => {
    const { vault } = vaultOf();

    const one = await vault.seal('same');
    const two = await vault.seal('same');

    assert.notStrictEqual(one, two, 'a fresh iv per seal');
});

test('a tampered box opens as nothing rather than as garbage', async (t) => {
    const { vault } = vaultOf();
    const sealed = await vault.seal('mine');
    const broken = `${sealed.slice(0, -4)}AAAA`;

    assert.strictEqual(await vault.open(broken), null);
});

test('a box whose key is gone opens as nothing', async (t) => {
    const first = vaultOf();
    const sealed = await first.vault.seal('mine');
    const second = vaultOf();

    assert.strictEqual(await second.vault.open(sealed), null, 'losing the key loses the token');
});

test('a token stored in the open still opens, so old profiles keep working', async (t) => {
    const { vault } = vaultOf();
    const plain = JSON.stringify({ token: 'ghp_old' });

    assert.strictEqual(await vault.open(plain), plain);
    assert.strictEqual(vault.sealed(plain), false);
});

test('nothing to open is nothing, not an empty string', async (t) => {
    const { vault } = vaultOf();

    assert.strictEqual(await vault.open(null), null);
    assert.strictEqual(await vault.open(''), null);
});

test('without crypto or a database the token is kept as it is', async (t) => {
    const bare = createVault({});

    assert.strictEqual(await bare.seal('mine'), 'mine');
    assert.strictEqual(await bare.open('mine'), 'mine');
});

test('a sealed box cannot be opened without crypto', async (t) => {
    const { vault } = vaultOf();
    const sealed = await vault.seal('mine');
    const bare = createVault({});

    assert.strictEqual(await bare.open(sealed), null);
});

test('the browser vault degrades instead of throwing where there is no window', async (t) => {
    const vault = browserVault({});

    assert.strictEqual(await vault.seal('mine'), 'mine');
});

test('an expiry date is read as time left, and a near one is called out', async (t) => {
    const now = Date.parse('2026-08-17T12:00:00Z');
    const at = (days) => new Date(now + days * 86_400_000).toISOString();

    assert.deepStrictEqual(expiryOf(at(30), now), { tone: '', text: 'expires in 30 days' });
    assert.deepStrictEqual(expiryOf(at(3), now), { tone: 'is-warn', text: 'expires in 3 days' });
    assert.deepStrictEqual(expiryOf(at(1), now), { tone: 'is-warn', text: 'expires in 1 day' });
    assert.deepStrictEqual(expiryOf(at(0.5), now), { tone: 'is-warn', text: 'expires today' });
    assert.deepStrictEqual(expiryOf(at(-2), now), { tone: 'is-warn', text: 'expired' });
});

test('a key with no expiry says nothing at all', async (t) => {
    assert.strictEqual(expiryOf(null), null);
    assert.strictEqual(expiryOf(''), null);
    assert.strictEqual(expiryOf('whenever'), null);
});
