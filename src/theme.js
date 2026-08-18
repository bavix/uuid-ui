'use strict';

/**
 * What is stored is a pair: which theme, and which of its variants.
 *
 *     theme = "cyberpunk:dark"   the named theme, forced dark
 *     theme = "default:system"   the shipped theme, following the machine
 *     theme = "dark"             what older builds wrote; still read
 *
 * One key, one string, because the script that runs before the first paint has
 * to parse it without a bundle. Everything else in the app works with the pair.
 */

export const THEME_KEY = 'theme';
const KEY = THEME_KEY;

export const DARK = 'dark';
export const LIGHT = 'light';
export const SYSTEM = 'system';
export const MODES = [SYSTEM, LIGHT, DARK];
export const DEFAULT_PALETTE = 'default';
export const DEFAULT_THEME = { palette: DEFAULT_PALETTE, mode: SYSTEM };

/** A theme name has to survive being a CSS attribute value and a file name. */
const NAME = /^[a-z0-9][a-z0-9-]{0,31}$/;

export function isPaletteName(value) {
    return typeof value === 'string' && NAME.test(value);
}

export function isMode(value) {
    return MODES.includes(value);
}

/**
 * Reads both the pair and everything older builds wrote. Returns null only when
 * the text says nothing at all, so a caller can tell "no preference" from
 * "the machine decides".
 */
export function parseTheme(raw) {
    if (typeof raw !== 'string' || raw.trim() === '') {
        return null;
    }

    const held = raw.trim();

    // The old builds: a word or a JSON boolean, meaning the shipped theme.
    if (held === DARK || held === 'true' || held === '"true"') {
        return { palette: DEFAULT_PALETTE, mode: DARK };
    }

    if (held === LIGHT || held === 'false' || held === '"false"') {
        return { palette: DEFAULT_PALETTE, mode: LIGHT };
    }

    if (held === SYSTEM) {
        return { palette: DEFAULT_PALETTE, mode: SYSTEM };
    }

    const [palette, mode] = held.split(':');

    if (!isPaletteName(palette) || !isMode(mode)) {
        return null;
    }

    return { palette, mode };
}

export function formatTheme(theme) {
    const palette = isPaletteName(theme?.palette) ? theme.palette : DEFAULT_PALETTE;
    const mode = isMode(theme?.mode) ? theme.mode : SYSTEM;

    return `${palette}:${mode}`;
}

export function readTheme(storage = localStorage) {
    try {
        return parseTheme(storage.getItem(KEY)) ?? { ...DEFAULT_THEME };
    } catch (e) {
        return { ...DEFAULT_THEME };
    }
}

export function writeTheme(theme, storage = localStorage) {
    try {
        storage.setItem(KEY, typeof theme === 'string' ? theme : formatTheme(theme));
    } catch (e) {
        // a blocked storage costs the preference, not the page
    }
}

export function prefersDark(win = typeof window === 'undefined' ? null : window) {
    try {
        return Boolean(win?.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (e) {
        return false;
    }
}

/** Which variant a choice comes down to right now. */
export function variantOf(theme, win) {
    const mode = isMode(theme?.mode) ? theme.mode : SYSTEM;

    if (mode === SYSTEM) {
        return prefersDark(win) ? DARK : LIGHT;
    }

    return mode;
}

/**
 * The one place that touches the document element, so the pre-paint script in
 * index.html has exactly one behaviour to copy.
 */
/**
 * The browser's own chrome — the address bar on a phone — takes the page's
 * colour. Without this a dark theme keeps a white bar above it.
 */
export function paintChrome(root, win) {
    const style = win?.getComputedStyle?.(root);
    const surface = style?.getPropertyValue('--surface')?.trim();

    if (!surface) {
        return;
    }

    for (const meta of root.ownerDocument?.querySelectorAll?.('meta[name="theme-color"]') ?? []) {
        meta.removeAttribute('media');
        meta.setAttribute('content', surface);
    }
}

export function applyTheme(theme, root, win) {
    if (!root) {
        return;
    }

    const palette = isPaletteName(theme?.palette) ? theme.palette : DEFAULT_PALETTE;
    const dark = variantOf(theme, win) === DARK;

    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';

    if (palette === DEFAULT_PALETTE) {
        root.removeAttribute('data-theme');
        paintChrome(root, win);

        return;
    }

    root.setAttribute('data-theme', palette);
    paintChrome(root, win);
}
