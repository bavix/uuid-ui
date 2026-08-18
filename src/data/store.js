'use strict';

import { useSyncExternalStore } from 'preact/compat';
import { HISTORY_LIMIT } from '../limits.js';
import { DEFAULT_PALETTE, MODES, THEME_KEY, formatTheme, isPaletteName, readTheme, writeTheme } from '../theme.js';
import { favoriteKey, itemKey } from './keys.js';
import { cleanConvention } from '../int-convention.js';

export const DATA_KEY = 'uuid.data';
export const APP = 'uuid-ui';
export const DATA_VERSION = 2;
export const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
export const TOMBSTONE_LIMIT = 2000;
export const CUSTOM_THEME_LIMIT = 8192;
// A theme somebody wrote is part of their choice of theme, so it travels with
// the palette that names it; without it the other browser holds a palette it
// has no colours for.
export const SYNCED_SETTINGS = ['uuidType', 'theme', 'palette', 'customTheme'];
export const LOCAL_SETTINGS = ['resultType', 'intRead', 'intWrite', 'spelling', 'case'];
export const SETTINGS = [...SYNCED_SETTINGS, ...LOCAL_SETTINGS];

// The variant is a closed list; the theme's name is not. A name this build
// does not know is kept as it is — a newer build on another machine may have
// sent it, and dropping it would quietly undo somebody's choice.
const THEMES = MODES;

function parse(raw) {
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function readRaw(key, storage) {
    try {
        return storage.getItem(key);
    } catch (e) {
        return null;
    }
}

function cleanRow(row) {
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
        at: Number.isFinite(row.at) && row.at >= 0 ? row.at : 0,
        ...cleanConvention(row),
    };
}

function cleanRows(list) {
    if (!Array.isArray(list)) {
        return [];
    }

    const rows = [];
    const seen = new Set();

    for (const row of list) {
        const clean = cleanRow(row);

        if (!clean || seen.has(itemKey(clean))) {
            continue;
        }

        seen.add(itemKey(clean));
        rows.push(clean);
    }

    return rows;
}

function cleanTimes(map) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) {
        return {};
    }

    const clean = {};

    for (const [key, at] of Object.entries(map)) {
        if (Number.isFinite(at) && at >= 0) {
            clean[key] = at;
        }
    }

    return clean;
}

/** The variant is one of three words; everything else is checked by shape. */
function allowedFor(name) {
    return name === 'theme' ? THEMES : null;
}

function cleanTags(stored) {
    const tags = {};

    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
        return tags;
    }

    for (const [tag, value] of Object.entries(stored)) {
        const list = Array.isArray(value) ? value : value?.items;

        if (!Array.isArray(list)) {
            continue;
        }

        tags[tag] = {
            at: Array.isArray(value) ? 0 : (Number.isFinite(value.at) && value.at >= 0 ? value.at : 0),
            items: cleanRows(list),
        };
    }

    return tags;
}

function cleanSetting(setting, allowed) {
    if (!setting || typeof setting.value !== 'string') {
        return null;
    }

    if (allowed && !allowed.includes(setting.value)) {
        return null;
    }

    return { value: setting.value, at: Number.isFinite(setting.at) && setting.at >= 0 ? setting.at : 0 };
}

function cleanTime(at) {
    return Number.isFinite(at) && at > 0 ? at : 0;
}

export function prune(map, now) {
    const alive = Object.entries(map).filter(([, at]) => now - at < TOMBSTONE_TTL_MS);

    if (alive.length <= TOMBSTONE_LIMIT) {
        return Object.fromEntries(alive);
    }

    alive.sort(([, a], [, b]) => b - a);

    return Object.fromEntries(alive.slice(0, TOMBSTONE_LIMIT));
}

function stampRows(rows, previous, now) {
    const before = new Map(previous.map(row => [itemKey(row), row]));

    return rows.map(row => {
        const held = before.get(itemKey(row));
        const same = held && held.info === (row.info ?? '');

        return { ...row, at: same ? held.at : now };
    });
}

function missingRows(before, after) {
    const kept = new Set(after.map(itemKey));

    return before.filter(row => !kept.has(itemKey(row)));
}

function emptyData() {
    return {
        items: [],
        clearedAt: 0,
        tombstones: {},
        favorites: {},
        favoriteTombstones: {},
        settings: Object.fromEntries(SETTINGS.map(name => [name, null])),
    };
}

function shapeOf(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return emptyData();
    }

    return {
        items: cleanRows(raw.items),
        clearedAt: cleanTime(raw.clearedAt),
        tombstones: cleanTimes(raw.tombstones),
        favorites: cleanTags(raw.favorites),
        favoriteTombstones: cleanTimes(raw.favoriteTombstones),
        settings: Object.fromEntries(
            SETTINGS.map(name => [name, cleanSetting(raw.settings?.[name], allowedFor(name))]),
        ),
    };
}

export function createDataStore({ storage = localStorage, bus = null, win = null, clock = Date.now } = {}) {
    let data = load();
    let revision = 1;
    const listeners = new Set();

    function load() {
        const held = shapeOf(parse(readRaw(DATA_KEY, storage)));
        const kept = readTheme(storage);

        if (!held.settings.theme) {
            held.settings.theme = { value: kept.mode, at: 0 };
        }

        if (!held.settings.palette && kept.palette !== DEFAULT_PALETTE) {
            held.settings.palette = { value: kept.palette, at: 0 };
        }

        return held;
    }

    function persist(next) {
        const body = JSON.stringify({
            app: APP,
            version: DATA_VERSION,
            items: next.items,
            clearedAt: next.clearedAt,
            tombstones: next.tombstones,
            favorites: next.favorites,
            favoriteTombstones: next.favoriteTombstones,
            settings: next.settings,
        });

        try {
            if (readRaw(DATA_KEY, storage) !== body) {
                storage.setItem(DATA_KEY, body);
            }
        } catch (e) {
            return false;
        }

        // The key the pre-paint script reads: one string, both halves. Written
        // only when it would change, so a write to the history stays one write.
        const theme = formatTheme({
            palette: next.settings.palette?.value ?? DEFAULT_PALETTE,
            mode: next.settings.theme?.value,
        });

        if (readRaw(THEME_KEY, storage) !== theme) {
            writeTheme(theme, storage);
        }

        return true;
    }

    function notify(origin, synced = true) {
        revision += 1;

        for (const listener of [...listeners]) {
            try {
                listener();
            } catch (e) {
                console.error('Store listener failed:', e);
            }
        }

        if (bus) {
            bus.emit('data', { origin, synced });
        }
    }

    function commit(next, origin = 'local', synced = true) {
        data = next;
        persist(data);
        notify(origin, synced);

        return true;
    }

    function bury(keys, field, now, next) {
        if (keys.length === 0) {
            return next;
        }

        const marked = { ...next[field] };

        for (const key of keys) {
            if (!(marked[key] > now)) {
                marked[key] = now;
            }
        }

        return {
            ...next,
            tombstones: prune(field === 'tombstones' ? marked : next.tombstones, now),
            favoriteTombstones: prune(field === 'favoriteTombstones' ? marked : next.favoriteTombstones, now),
        };
    }

    function writeRows(rows, { cleared = false } = {}) {
        const now = clock();
        const held = cleanRows(rows);
        const after = held.slice(0, HISTORY_LIMIT);
        // What the cap pushes off the end is only out of *this* browser: a
        // tombstone would tell every other one to delete it for good, and the
        // row was never deleted — it simply did not fit here.
        const evicted = new Set(held.slice(HISTORY_LIMIT).map(itemKey));
        const stamped = stampRows(after, data.items, now);

        let next = { ...data, items: stamped };

        if (cleared) {
            next = now > data.clearedAt ? { ...next, clearedAt: now } : next;
        } else {
            const gone = missingRows(data.items, after).map(itemKey).filter(key => !evicted.has(key));

            next = bury(gone, 'tombstones', now, next);
        }

        return commit(next);
    }

    function writeTags(tags) {
        const now = clock();
        const after = cleanTags(tags);
        const stamped = {};

        for (const [tag, value] of Object.entries(after)) {
            const held = data.favorites[tag];

            stamped[tag] = {
                at: held ? held.at : now,
                items: stampRows(value.items, held ? held.items : [], now),
            };
        }

        const gone = [];

        for (const [tag, held] of Object.entries(data.favorites)) {
            const value = after[tag];

            if (value === undefined) {
                gone.push(tag);
                continue;
            }

            for (const row of missingRows(held.items, value.items)) {
                gone.push(favoriteKey(tag, row));
            }
        }

        return commit(bury(gone, 'favoriteTombstones', now, { ...data, favorites: stamped }));
    }

    const store = {
        snapshot() {
            return data;
        },

        revision() {
            return revision;
        },

        subscribe(listener) {
            listeners.add(listener);

            return () => listeners.delete(listener);
        },

        reload() {
            const next = load();

            if (JSON.stringify(next) === JSON.stringify(data)) {
                return false;
            }

            data = next;
            notify('remote');

            return true;
        },

        setRows(rows, meta = {}) {
            return writeRows(rows, meta);
        },

        addRows(rows) {
            const added = cleanRows(rows);
            const keys = new Set(added.map(itemKey));

            return writeRows([...added, ...data.items.filter(row => !keys.has(itemKey(row)))]);
        },

        clearRows() {
            return writeRows([], { cleared: true });
        },

        setTags(tags) {
            return writeTags(tags);
        },

        star(tag, row) {
            const held = data.favorites[tag];
            const items = held ? held.items : [];

            if (items.some(kept => itemKey(kept) === itemKey(row))) {
                return false;
            }

            return writeTags({ ...data.favorites, [tag]: { ...(held || {}), items: [row, ...items] } });
        },

        unstar(tag, row) {
            const held = data.favorites[tag];

            if (!held) {
                return false;
            }

            return writeTags({
                ...data.favorites,
                [tag]: { ...held, items: held.items.filter(kept => itemKey(kept) !== itemKey(row)) },
            });
        },

        createTag(tag) {
            if (data.favorites[tag]) {
                return false;
            }

            return writeTags({ ...data.favorites, [tag]: { items: [] } });
        },

        deleteTag(tag) {
            if (!data.favorites[tag]) {
                return false;
            }

            const next = { ...data.favorites };

            delete next[tag];

            return writeTags(next);
        },

        restoreTag(tag, items) {
            return writeTags({ ...data.favorites, [tag]: { items: items || [] } });
        },

        setSetting(name, value) {
            if (!SETTINGS.includes(name) || typeof value !== 'string') {
                return false;
            }

            const setting = cleanSetting({ value, at: clock() }, allowedFor(name));

            if (name === 'palette' && !isPaletteName(value)) {
                return false;
            }

            // A theme somebody wrote is the one setting long enough to be worth
            // a ceiling: everything else here is a word.
            if (name === 'customTheme' && value.length > CUSTOM_THEME_LIMIT) {
                return false;
            }

            if (!setting) {
                return false;
            }

            return commit(
                { ...data, settings: { ...data.settings, [name]: setting } },
                'local',
                SYNCED_SETTINGS.includes(name),
            );
        },

        applyRemote(snapshot) {
            return commit(shapeOf(snapshot), 'remote');
        },
    };

    if (win) {
        const onStorage = (event) => {
            if (!event.key || event.key === DATA_KEY || event.key === 'theme') {
                store.reload();
            }
        };

        win.addEventListener('storage', onStorage);
        store.stop = () => {
            win.removeEventListener('storage', onStorage);
            listeners.clear();
        };
    } else {
        store.stop = () => listeners.clear();
    }

    return store;
}

export function useStore(store) {
    return useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
}

export function selector(build) {
    let input = null;
    let output = null;

    return (value) => {
        if (value !== input) {
            input = value;
            output = build(value);
        }

        return output;
    };
}
