'use strict';

export const LOCK_TTL_MS = 30 * 1000;

export const SYNC_KEY = 'sync';

const LEGACY_PARTS = ['target', 'cursor', 'account', 'sent', 'expires'];
const LEGACY_PART = /^sync\.([^.]+)\.(target|cursor|account|sent|expires|secret)$/;
const LEGACY_TOP = ['sync.provider', 'sync.lastSync', 'sync.lock', 'sync.blockedUntil'];

function secretKey(id) {
    return `sync.secret.${id}`;
}

function read(key, storage) {
    try {
        return storage.getItem(key);
    } catch (e) {
        return null;
    }
}

function write(key, value, storage) {
    try {
        if (value === null || value === undefined || value === '') {
            storage.removeItem(key);

            return true;
        }

        storage.setItem(key, value);

        return true;
    } catch (e) {
        return false;
    }
}

function keysOf(storage) {
    try {
        if (typeof storage.key === 'function' && Number.isFinite(storage.length)) {
            return Array.from({ length: storage.length }, (unused, at) => storage.key(at)).filter(key => typeof key === 'string');
        }

        return Object.keys(storage);
    } catch (e) {
        return [];
    }
}

function empty() {
    return { provider: null, lastSync: 0, blockedUntil: 0, lock: null, stores: {} };
}

function storeShape(held) {
    const store = {};

    for (const part of LEGACY_PARTS) {
        store[part] = typeof held?.[part] === 'string' ? held[part] : null;
    }

    return store;
}

function shapeOf(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return empty();
    }

    const stores = {};

    if (raw.stores && typeof raw.stores === 'object' && !Array.isArray(raw.stores)) {
        for (const [id, held] of Object.entries(raw.stores)) {
            if (held && typeof held === 'object' && !Array.isArray(held)) {
                stores[id] = storeShape(held);
            }
        }
    }

    const at = Number(raw.lastSync);
    const blocked = Number(raw.blockedUntil);
    const lockAt = Number(raw.lock?.at);

    return {
        provider: typeof raw.provider === 'string' ? raw.provider : null,
        lastSync: Number.isFinite(at) && at > 0 ? at : 0,
        blockedUntil: Number.isFinite(blocked) && blocked > 0 ? blocked : 0,
        lock: typeof raw.lock?.owner === 'string' && Number.isFinite(lockAt)
            ? { owner: raw.lock.owner, at: lockAt }
            : null,
        stores,
    };
}

function parse(text) {
    try {
        return shapeOf(JSON.parse(text));
    } catch (e) {
        return empty();
    }
}

export function migrateSyncState(local = localStorage, session = sessionStorage) {
    if (read(SYNC_KEY, local) !== null) {
        return false;
    }

    const keys = keysOf(local);

    const legacy = keys.filter(key => LEGACY_TOP.includes(key) || LEGACY_PART.test(key));

    if (legacy.length === 0) {
        return false;
    }

    const state = empty();
    const held = read('sync.lock', local);
    const ids = new Set();

    state.provider = read('sync.provider', local);
    state.lastSync = Number(read('sync.lastSync', local)) || 0;
    state.blockedUntil = Number(read('sync.blockedUntil', local)) || 0;

    if (held) {
        const [owner, at] = held.split(':');

        state.lock = { owner, at: Number(at) || 0 };
    }

    for (const key of legacy) {
        const parts = LEGACY_PART.exec(key);

        if (parts) {
            ids.add(parts[1]);
        }
    }

    for (const id of ids) {
        const store = {};

        for (const part of LEGACY_PARTS) {
            store[part] = read(`sync.${id}.${part}`, local);
        }

        state.stores[id] = storeShape(store);
    }

    const body = JSON.stringify(state);

    if (!write(SYNC_KEY, body, local) || read(SYNC_KEY, local) !== body) {
        return false;
    }

    for (const id of ids) {
        for (const storage of [local, session]) {
            const secret = read(`sync.${id}.secret`, storage);

            if (secret === null) {
                continue;
            }

            if (!write(secretKey(id), secret, storage) || read(secretKey(id), storage) !== secret) {
                return true;
            }

            write(`sync.${id}.secret`, null, storage);
        }
    }

    for (const key of legacy) {
        if (!key.endsWith('.secret')) {
            write(key, null, local);
        }
    }

    return true;
}

export function createSyncState(local = localStorage, session = sessionStorage) {
    migrateSyncState(local, session);

    function state() {
        return parse(read(SYNC_KEY, local));
    }

    function save(next) {
        return write(SYNC_KEY, JSON.stringify(next), local);
    }

    function change(work) {
        const next = state();

        work(next);

        return save(next);
    }

    function storeOf(next, id) {
        if (!next.stores[id]) {
            next.stores[id] = storeShape(null);
        }

        return next.stores[id];
    }

    function partOf(id, name) {
        return state().stores[id]?.[name] ?? null;
    }

    function setPart(id, name, value) {
        change((next) => {
            storeOf(next, id)[name] = value === undefined || value === '' ? null : value;
        });
    }

    return {
        activeProvider() {
            return state().provider;
        },

        setActiveProvider(id) {
            change((next) => { next.provider = id || null; });
        },

        readSecret(id) {
            return read(secretKey(id), local) || read(secretKey(id), session) || null;
        },

        writeSecret(id, secret, remember) {
            write(secretKey(id), null, local);
            write(secretKey(id), null, session);
            write(secretKey(id), secret, remember ? local : session);
        },

        isRemembered(id) {
            return read(secretKey(id), local) !== null;
        },

        readTarget(id) {
            return partOf(id, 'target');
        },

        writeTarget(id, target) {
            setPart(id, 'target', target);
        },

        readCursor(id) {
            return partOf(id, 'cursor');
        },

        writeCursor(id, cursor) {
            setPart(id, 'cursor', cursor);
        },

        readExpiry(id) {
            return partOf(id, 'expires');
        },

        writeExpiry(id, expires) {
            setPart(id, 'expires', expires);
        },

        readAccount(id) {
            return partOf(id, 'account');
        },

        writeAccount(id, account) {
            setPart(id, 'account', account);
        },

        readBlockedUntil() {
            return state().blockedUntil;
        },

        writeBlockedUntil(at) {
            change((next) => { next.blockedUntil = at || 0; });
        },

        readFingerprint(id) {
            return partOf(id, 'sent');
        },

        writeFingerprint(id, value) {
            setPart(id, 'sent', value);
        },

        readLastSync() {
            return state().lastSync;
        },

        writeLastSync(at) {
            change((next) => { next.lastSync = at || 0; });
        },

        forgetTarget(id) {
            change((next) => {
                const store = storeOf(next, id);

                store.target = null;
                store.cursor = null;
                store.sent = null;
            });
        },

        disconnect(id) {
            write(secretKey(id), null, local);
            write(secretKey(id), null, session);

            change((next) => {
                delete next.stores[id];
                next.provider = null;
                next.lastSync = 0;
                next.blockedUntil = 0;
            });
        },

        acquireLock(owner, now = Date.now()) {
            const next = state();

            if (next.lock && next.lock.owner !== owner && next.lock.at > now - LOCK_TTL_MS) {
                return false;
            }

            next.lock = { owner, at: now };
            save(next);

            return true;
        },

        releaseLock(owner) {
            change((next) => {
                if (!next.lock || next.lock.owner === owner) {
                    next.lock = null;
                }
            });
        },
    };
}
