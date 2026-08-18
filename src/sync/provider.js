'use strict';

export const SYNC_CODES = {
    UNAUTHORIZED: 'unauthorized',
    FORBIDDEN: 'forbidden',
    RATE_LIMITED: 'rate-limited',
    MISSING: 'missing',
    NO_TARGET: 'no-target',
    OFFLINE: 'offline',
    REFUSED: 'refused',
};

export class SyncError extends Error {
    constructor(code, message, meta = {}) {
        super(message);
        this.name = 'SyncError';
        this.code = code;
        Object.assign(this, meta);
    }
}

export function describeError(error, where = 'sync') {
    switch (error?.code) {
        case SYNC_CODES.UNAUTHORIZED:
            return where === 'connect'
                ? 'The store refused this key. Check that it has not expired and grants access to gists.'
                : 'Access was refused — the key no longer works. Disconnect and connect again.';
        case SYNC_CODES.FORBIDDEN:
            return error.message || 'This account is not allowed to use that store.';
        case SYNC_CODES.RATE_LIMITED:
            return `Too many requests. Try again in ${error.minutes || 1} min.`;
        case SYNC_CODES.MISSING:
            return 'The store is gone. Send to create a new one.';
        case SYNC_CODES.NO_TARGET:
            return 'There is no UUIDConv UI data there.';
        case SYNC_CODES.OFFLINE:
            return 'GitHub could not be reached. Check the connection, or an extension blocking api.github.com. Nothing local was touched.';
        case SYNC_CODES.REFUSED:
            return error.message || 'The store refused the request.';
        case 'not-json':
            return 'The stored file is damaged.';
        case 'foreign-app':
            return 'That file was not written by UUIDConv UI.';
        case 'future-version':
            return 'That file comes from a newer version of the app. Reload the page.';
        default:
            return error?.message || 'Something went wrong.';
    }
}

export function openSession(provider, credentials, deps = {}) {
    const session = provider.create(credentials, deps);

    if (typeof session?.read !== 'function' || typeof session?.write !== 'function') {
        throw new SyncError(SYNC_CODES.REFUSED, `The store "${provider.id}" cannot read or write.`);
    }

    return {
        async account() {
            return session.account ? session.account() : { name: provider.label || provider.id };
        },

        async locate() {
            return session.locate ? session.locate() : [];
        },

        read(target, cursor) {
            return session.read(target, cursor);
        },

        write(target, content) {
            return session.write(target, content);
        },
    };
}

export function needsOf(provider) {
    return Array.isArray(provider?.needs) ? provider.needs : [];
}

export function linkOf(provider, target) {
    return typeof provider?.link === 'function' ? provider.link(target) : null;
}
