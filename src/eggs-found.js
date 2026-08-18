'use strict';

export const EGGS_KEY = 'uuid.eggs';

const LIMIT = 64;

function read(storage) {
    try {
        const raw = storage.getItem(EGGS_KEY);
        const held = raw === null ? [] : JSON.parse(raw);

        return Array.isArray(held) ? held.filter(id => typeof id === 'string') : [];
    } catch (e) {
        return [];
    }
}

export function foundEggs(storage = localStorage) {
    return new Set(read(storage));
}

export function markFound(id, storage = localStorage) {
    if (typeof id !== 'string' || id === '') {
        return false;
    }

    const held = read(storage);

    if (held.includes(id)) {
        return false;
    }

    try {
        storage.setItem(EGGS_KEY, JSON.stringify([...held, id].slice(-LIMIT)));

        return true;
    } catch (e) {
        return false;
    }
}

export function forgetEggs(storage = localStorage) {
    try {
        storage.removeItem(EGGS_KEY);
    } catch (e) {
        return false;
    }

    return true;
}
