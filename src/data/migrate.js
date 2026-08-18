'use strict';

import { DEFAULT_PALETTE, readTheme } from '../theme.js';
import { APP, DATA_KEY, DATA_VERSION } from './store.js';

export const LEGACY_KEYS = ['uuidItems', 'uuidFavorites', 'uuidDeletions', 'uuidSettingsAt', 'uuidType'];

function read(key, storage) {
    try {
        return storage.getItem(key);
    } catch (e) {
        return null;
    }
}

function parse(raw) {
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function times(raw) {
    const held = parse(raw);

    if (!held || typeof held !== 'object' || Array.isArray(held)) {
        return {};
    }

    return held;
}

export function migrate(storage = localStorage) {
    if (read(DATA_KEY, storage) !== null) {
        return false;
    }

    const legacy = LEGACY_KEYS.map(key => [key, read(key, storage)]);

    if (legacy.every(([, value]) => value === null)) {
        return false;
    }

    const held = Object.fromEntries(legacy);
    const deletions = parse(held.uuidDeletions) || {};
    const at = times(held.uuidSettingsAt);
    const kept = readTheme(storage);

    const body = JSON.stringify({
        app: APP,
        version: DATA_VERSION,
        items: parse(held.uuidItems) || [],
        clearedAt: deletions.clearedAt || 0,
        tombstones: deletions.items || {},
        favorites: parse(held.uuidFavorites) || {},
        favoriteTombstones: deletions.favorites || {},
        settings: {
            uuidType: held.uuidType ? { value: held.uuidType, at: at.uuidType || 0 } : null,
            theme: { value: kept.mode, at: at.theme || 0 },
            palette: kept.palette === DEFAULT_PALETTE ? null : { value: kept.palette, at: at.theme || 0 },
        },
    });

    try {
        storage.setItem(DATA_KEY, body);
    } catch (e) {
        return false;
    }

    if (read(DATA_KEY, storage) !== body) {
        return false;
    }

    for (const key of LEGACY_KEYS) {
        try {
            storage.removeItem(key);
        } catch (e) {
            continue;
        }
    }

    return true;
}
