'use strict';

/**
 * The stored theme is a word — `dark` or `light` — rather than the `true` /
 * `false` it used to be. A boolean in storage says nothing about what it means
 * to whoever opens devtools, and it could not grow a third value.
 *
 * Anything written by the old build still reads correctly, and the first write
 * replaces it, so nobody has to clear their storage.
 */

const KEY = 'theme';
export const DARK = 'dark';
export const LIGHT = 'light';

/** @returns {boolean|null} null when nothing usable is stored */
export function readStoredTheme(storage = localStorage) {
    let stored;

    try {
        stored = storage.getItem(KEY);
    } catch (e) {
        return null;
    }

    if (stored === DARK) {
        return true;
    }

    if (stored === LIGHT) {
        return false;
    }

    // What the old build wrote: JSON booleans, and the odd quoted form.
    if (stored === 'true' || stored === '"true"') {
        return true;
    }

    if (stored === 'false' || stored === '"false"') {
        return false;
    }

    return null;
}

export function writeStoredTheme(dark, storage = localStorage) {
    try {
        storage.setItem(KEY, dark ? DARK : LIGHT);
    } catch (e) {
        // a blocked storage costs the preference, not the page
    }
}
