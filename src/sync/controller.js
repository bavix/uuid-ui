'use strict';

import { buildSnapshot, parseSnapshot, summarize } from './snapshot.js';
import { exchange, fingerprint } from './engine.js';
import { loadProvider } from './registry.js';
import browser from './providers/browser.js';
import { SYNC_CODES, SyncError, openSession } from './provider.js';
import { browserVault } from './vault.js';
import { SYNC_KEY } from './state.js';

const TAB = `tab-${crypto.getRandomValues(new Uint32Array(2)).reduce((held, part) => held + part.toString(36), '')}`;

let shared = null;

export function sharedController(options) {
    if (!shared) {
        shared = createController(options);
    }

    return shared;
}

export function forgetSharedController() {
    shared = null;
}

export function createController({ store, bus, state, deps = {}, resolve = loadProvider, vault = browserVault() }) {
    let providerId = state.activeProvider();
    let provider = null;
    let session = null;
    let busy = false;

    const here = openSession(browser, {}, { store });

    function announce(status, detail = {}) {
        bus.emit('sync-state', { status, providerId, ...detail });
    }

    function snapshot(now) {
        return buildSnapshot(store.snapshot(), now);
    }

    function remember(result, id) {
        if (!id || id !== providerId) {
            return;
        }

        if (result.target && result.target !== state.readTarget(providerId)) {
            state.writeTarget(providerId, result.target);
        }

        if (result.cursor && result.cursor !== state.readCursor(providerId)) {
            state.writeCursor(providerId, result.cursor);
        }

        const mark = result.hereCursor || (result.snapshot ? fingerprint(result.snapshot) : null);

        if (mark && mark !== state.readFingerprint(providerId)) {
            state.writeFingerprint(providerId, mark);
        }

        state.writeLastSync(Date.now());
    }

    async function ensureSession() {
        if (session) {
            return session;
        }

        if (!providerId) {
            throw new SyncError(SYNC_CODES.UNAUTHORIZED, 'No store is connected.');
        }

        const secret = state.readSecret(providerId);
        const plain = await vault.open(secret);

        if (!plain) {
            throw new SyncError(SYNC_CODES.UNAUTHORIZED, 'No credentials in this browser.');
        }

        if (!vault.sealed(secret)) {
            state.writeSecret(providerId, await vault.seal(plain), state.isRemembered(providerId));
        }

        provider = provider || await resolve(providerId);
        session = openSession(provider, JSON.parse(plain), deps);

        return session;
    }

    async function guard(work) {
        if (busy) {
            return { skipped: true, busy: true };
        }

        if (!state.acquireLock(TAB)) {
            return { skipped: true, locked: true };
        }

        if (state.readBlockedUntil() > Date.now()) {
            state.releaseLock(TAB);

            return { skipped: true, blocked: true };
        }

        busy = true;
        announce('working');

        try {
            const result = await work();
            announce('synced');

            return result;
        } catch (error) {
            announce('failed', { error });

            if (error?.code === SYNC_CODES.UNAUTHORIZED) {
                session = null;
            }

            if (error?.code === SYNC_CODES.MISSING) {
                state.forgetTarget(providerId);
            }

            if (error?.code === SYNC_CODES.RATE_LIMITED) {
                state.writeBlockedUntil(Date.now() + Math.max(1, error.minutes || 1) * 60 * 1000);
            }

            throw error;
        } finally {
            busy = false;
            state.releaseLock(TAB);
            announce('idle');
        }
    }

    return {
        status() {
            const id = providerId;

            return {
                providerId: id,
                connected: Boolean(id && state.readSecret(id)),
                account: id ? state.readAccount(id) : null,
                expires: id ? state.readExpiry(id) : null,
                target: id ? state.readTarget(id) : null,
                remembered: id ? state.isRemembered(id) : false,
                lastSync: state.readLastSync(),
                busy,
            };
        },

        async connect(id, credentials, remember_) {
            provider = await resolve(id);
            const candidate = openSession(provider, credentials, deps);
            const account = await candidate.account();

            providerId = id;
            session = candidate;
            state.setActiveProvider(id);
            state.writeSecret(id, await vault.seal(JSON.stringify(credentials)), remember_);
            state.writeAccount(id, account.name);
            state.writeExpiry(id, account.expires || null);

            let found = [];

            if (!state.readTarget(id)) {
                found = await candidate.locate();

                if (found.length === 1) {
                    state.writeTarget(id, found[0].targetId);
                }
            }

            announce('connected', { account: account.name });

            if (found.length !== 1 && !state.readTarget(id)) {
                return { account, found };
            }

            await this.sync().catch(() => {});

            return { account, found };
        },

        pending() {
            if (!providerId) {
                return false;
            }

            const sent = state.readFingerprint(providerId);

            return Boolean(sent) && sent !== fingerprint(snapshot(Date.now()));
        },

        exportSnapshot() {
            return JSON.stringify(snapshot(Date.now()), null, 2);
        },

        async importSnapshot(text) {
            const now = Date.now();
            const before = snapshot(now);

            parseSnapshot(text, now);
            await here.write(null, text);

            const summary = summarize(before, snapshot(now));

            announce('synced');

            return summary;
        },

        chooseTarget(targetId) {
            state.writeTarget(providerId, targetId);
            state.writeCursor(providerId, null);
        },

        disconnect() {
            if (!providerId) {
                return;
            }

            state.disconnect(providerId);
            session = null;
            provider = null;
            providerId = null;
            announce('disconnected');
        },

        link() {
            return provider && provider.link ? provider.link(state.readTarget(providerId)) : null;
        },

        sync() {
            return guard(async () => {
                const there = await ensureSession();
                const now = Date.now();

                const id = providerId;

                const result = await exchange(here, there, {
                    target: state.readTarget(id),
                    cursor: state.readCursor(id),
                    hereCursor: state.readFingerprint(id),
                    now,
                });

                remember(result, id);

                return result;
            });
        },
    };
}

export function startLive({ controller, bus, state, win = typeof window === 'undefined' ? null : window, doc = typeof document === 'undefined' ? null : document }) {
    const stops = [];
    let running = false;
    let again = false;
    let queued = false;

    const stats = { runs: 0, rounds: 0 };

    if (typeof window !== 'undefined' && import.meta.env?.DEV) {
        window.__syncStats = stats;
    }

    async function drain() {
        running = true;
        stats.runs += 1;

        try {
            do {
                again = false;
                stats.rounds += 1;

                const result = await controller.sync().catch((error) => {
                    if (import.meta.env?.DEV) {
                        console.warn('[sync] failed', error);
                    }

                    return null;
                });

                if (result && (result.busy || result.locked || result.blocked)) {
                    return;
                }
            } while (again);
        } finally {
            running = false;
        }
    }

    function request() {
        if (!controller.status().connected) {
            return;
        }

        if (running) {
            again = true;

            return;
        }

        if (queued) {
            return;
        }

        queued = true;

        queueMicrotask(() => {
            queued = false;

            if (!running) {
                drain();
            } else {
                again = true;
            }
        });
    }

    const onLocalWrite = (payload = {}) => {
        if (payload.origin !== 'remote' && payload.synced !== false) {
            request();
        }
    };

    stops.push(bus.on('data', onLocalWrite));

    const onVisible = () => {
        if (doc.visibilityState === 'visible') {
            request();
        }
    };

    const onStorage = (event) => {
        if (!event.key || event.key === SYNC_KEY || event.key.startsWith('sync.')) {
            return;
        }

        request();
    };

    if (doc) {
        doc.addEventListener('visibilitychange', onVisible);
        stops.push(() => doc.removeEventListener('visibilitychange', onVisible));
    }

    if (win) {
        for (const name of ['focus', 'online']) {
            win.addEventListener(name, request);
            stops.push(() => win.removeEventListener(name, request));
        }

        win.addEventListener('storage', onStorage);
        stops.push(() => win.removeEventListener('storage', onStorage));
    }

    request();

    return () => {
        for (const stop of stops) {
            stop();
        }
    };
}
