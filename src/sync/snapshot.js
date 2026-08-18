'use strict';

import { mergeItems } from '../merge-items.js';
import { HISTORY_LIMIT } from '../limits.js';
import { CUSTOM_THEME_LIMIT } from '../data/store.js';
import { favoriteKey, itemKey } from '../data/keys.js';
import { cleanConvention } from '../int-convention.js';

export const APP = 'uuid-ui';
export const SNAPSHOT_VERSION = 2;
export const CLOCK_SKEW_MS = 5 * 60 * 1000;

const THEMES = ['system', 'dark', 'light'];

export class SnapshotError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'SnapshotError';
        this.code = code;
    }
}

function stamp(at, ceiling) {
    if (!Number.isFinite(at) || at < 0) {
        return 0;
    }

    return at > ceiling ? ceiling : at;
}

function keyed(row, ceiling) {
    if (!row || typeof row !== 'object') {
        return null;
    }

    const input = typeof row.input === 'string' ? row.input : '';
    const output = typeof row.output === 'string' ? row.output : '';

    if (input === '' && output === '') {
        return null;
    }

    return {
        input,
        output,
        info: typeof row.info === 'string' ? row.info : '',
        at: stamp(row.at, ceiling),
        ...cleanConvention(row),
        toString() {
            return itemKey(this);
        },
    };
}

function ordered(rows) {
    return [...rows].sort((a, b) => (b.at - a.at) || (itemKey(a) < itemKey(b) ? -1 : 1));
}

function rowsOf(list, ceiling) {
    if (!Array.isArray(list)) {
        return [];
    }

    const rows = ordered(list.map(row => keyed(row, ceiling)).filter(Boolean));
    const seen = new Set();

    return rows.filter((row) => {
        const key = itemKey(row);

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);

        return true;
    });
}

function timesOf(map, ceiling) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) {
        return {};
    }

    const clean = {};

    for (const [key, at] of Object.entries(map)) {
        if (Number.isFinite(at) && at >= 0) {
            clean[key] = stamp(at, ceiling);
        }
    }

    return clean;
}

function tagsOf(favorites, ceiling) {
    const clean = {};

    if (!favorites || typeof favorites !== 'object' || Array.isArray(favorites)) {
        return clean;
    }

    for (const [tag, value] of Object.entries(favorites)) {
        const list = Array.isArray(value) ? value : value?.items;

        if (!Array.isArray(list)) {
            continue;
        }

        clean[tag] = {
            at: Array.isArray(value) ? 0 : stamp(value.at, ceiling),
            items: rowsOf(list, ceiling),
        };
    }

    return clean;
}

function settingOf(setting, allowed, ceiling) {
    if (!setting || typeof setting.value !== 'string') {
        return null;
    }

    if (allowed && !allowed.includes(setting.value)) {
        return null;
    }

    return { value: setting.value, at: stamp(setting.at, ceiling) };
}

function capped(setting, limit) {
    return setting && setting.value.length <= limit ? setting : null;
}

function shape(data, now, ceiling) {
    return {
        app: APP,
        version: SNAPSHOT_VERSION,
        timestamp: new Date(now).toISOString(),
        items: rowsOf(data.items, ceiling).slice(0, HISTORY_LIMIT),
        clearedAt: stamp(data.clearedAt, ceiling),
        tombstones: timesOf(data.tombstones, ceiling),
        favorites: tagsOf(data.favorites, ceiling),
        favoriteTombstones: timesOf(data.favoriteTombstones, ceiling),
        settings: {
            uuidType: settingOf(data.settings?.uuidType, null, ceiling),
            theme: settingOf(data.settings?.theme, THEMES, ceiling),
            // The theme's name travels unchecked against a list: a machine on a
            // newer build may name a theme this one has never heard of, and
            // dropping it here would undo their choice on their own devices.
            palette: settingOf(data.settings?.palette, null, ceiling),
            // The one setting long enough to need a ceiling of its own.
            customTheme: capped(settingOf(data.settings?.customTheme, null, ceiling), CUSTOM_THEME_LIMIT),
        },
    };
}

export function buildSnapshot(data, now = Date.now()) {
    return shape(data, now, now + CLOCK_SKEW_MS);
}

export function parseSnapshot(text, now = Date.now()) {
    let raw;

    try {
        raw = JSON.parse(text);
    } catch (e) {
        throw new SnapshotError('not-json', 'The stored file is not valid JSON.');
    }

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new SnapshotError('not-json', 'The stored file is not a snapshot.');
    }

    if (raw.app !== undefined && raw.app !== APP) {
        throw new SnapshotError('foreign-app', 'This was not written by UUIDConv UI.');
    }

    const version = Number.isFinite(raw.version) ? raw.version : 1;

    if (version > SNAPSHOT_VERSION) {
        throw new SnapshotError('future-version', 'This was written by a newer version of the app.');
    }

    const ceiling = now + CLOCK_SKEW_MS;
    const snapshot = shape(raw, now, ceiling);

    return { ...snapshot, version, timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : null };
}

function laterTimes(mine, theirs) {
    const merged = { ...(mine || {}) };

    for (const [key, at] of Object.entries(theirs || {})) {
        if (Number.isFinite(at) && at >= 0 && !(merged[key] >= at)) {
            merged[key] = at;
        }
    }

    return merged;
}

function alive(row, tombstones, clearedAt) {
    if (clearedAt > 0 && row.at <= clearedAt) {
        return false;
    }

    const deleted = tombstones[itemKey(row)];

    return !(Number.isFinite(deleted) && row.at <= deleted);
}

function mergeRows(mine, theirs, tombstones, clearedAt) {
    const byKey = new Map(mine.map(row => [itemKey(row), row]));

    for (const row of theirs) {
        const held = byKey.get(itemKey(row));

        byKey.set(itemKey(row), held && held.at >= row.at ? held : row);
    }

    const survivors = [...byKey.values()].filter(row => alive(row, tombstones, clearedAt));

    return mergeItems(ordered(survivors), []);
}

function mergeTags(mine, theirs, tombstones) {
    const names = new Set([...Object.keys(mine), ...Object.keys(theirs)]);
    const merged = {};

    for (const name of names) {
        const held = mine[name] || { at: 0, items: [] };
        const other = theirs[name] || { at: 0, items: [] };

        const items = mergeRows(held.items, other.items, {}, 0)
            .filter(row => {
                const deleted = tombstones[favoriteKey(name, row)];

                return !(Number.isFinite(deleted) && row.at <= deleted);
            });

        const at = Math.max(held.at, other.at);
        const deleted = tombstones[name];

        if (!Number.isFinite(deleted)) {
            merged[name] = { at, items };
            continue;
        }

        const survivors = items.filter(row => row.at > deleted);

        if (at > deleted) {
            merged[name] = { at, items: survivors };
            continue;
        }

        if (survivors.length > 0) {
            merged[name] = { at: Math.max(...survivors.map(row => row.at)), items: survivors };
        }
    }

    return merged;
}

function mergeSetting(mine, theirs) {
    if (!mine) {
        return theirs || null;
    }

    if (!theirs) {
        return mine;
    }

    return theirs.at > mine.at ? theirs : mine;
}

export function mergeSnapshot(mine, theirs, now = Date.now()) {
    const tombstones = laterTimes(mine.tombstones, theirs.tombstones);
    const favoriteTombstones = laterTimes(mine.favoriteTombstones, theirs.favoriteTombstones);
    const clearedAt = Math.max(mine.clearedAt || 0, theirs.clearedAt || 0);

    return {
        app: APP,
        version: SNAPSHOT_VERSION,
        timestamp: new Date(now).toISOString(),
        items: mergeRows(mine.items, theirs.items, tombstones, clearedAt).slice(0, HISTORY_LIMIT),
        clearedAt,
        tombstones,
        favorites: mergeTags(mine.favorites, theirs.favorites, favoriteTombstones),
        favoriteTombstones,
        settings: {
            uuidType: mergeSetting(mine.settings?.uuidType, theirs.settings?.uuidType),
            theme: mergeSetting(mine.settings?.theme, theirs.settings?.theme),
            palette: mergeSetting(mine.settings?.palette, theirs.settings?.palette),
            customTheme: capped(mergeSetting(mine.settings?.customTheme, theirs.settings?.customTheme), CUSTOM_THEME_LIMIT),
        },
    };
}

export function summarize(before, after) {
    const had = new Set(before.items.map(itemKey));
    const kept = new Set(after.items.map(itemKey));

    return {
        added: after.items.filter(row => !had.has(itemKey(row))).length,
        removed: before.items.filter(row => !kept.has(itemKey(row))).length,
        tags: Object.keys(after.favorites).filter(tag => !(tag in before.favorites)).length,
    };
}
