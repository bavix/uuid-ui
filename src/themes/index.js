'use strict';

/**
 * The themes this build ships. Only what the interface needs to draw a choice
 * lives here — the colours themselves are CSS, so a swatch can never drift from
 * the theme it stands for by more than the three values quoted below.
 *
 * `modes` says which variants a theme actually has: a theme is allowed to be
 * dark only, and the mode control greys out what it cannot give.
 *
 * `egg` names the easter egg that unlocks the theme, or null when it is open.
 */
export const THEMES = [
    {
        id: 'default',
        name: 'Default',
        blurb: 'The quiet one.',
        modes: ['light', 'dark'],
        egg: null,
        swatch: {
            light: ['#ffffff', '#1d4ed8', '#175e59'],
            dark: ['#111827', '#93c5fd', '#5eead4'],
        },
    },
    {
        id: 'solarized',
        name: 'Solarized',
        blurb: 'Cyan glass, cream paper.',
        modes: ['light', 'dark'],
        egg: null,
        swatch: {
            light: ['#fdf6e3', '#127a74', '#b44214'],
            dark: ['#002b36', '#2aa198', '#268bd2'],
        },
    },
    {
        id: 'catppuccin',
        name: 'Catppuccin',
        blurb: 'Pastel, day and night.',
        modes: ['light', 'dark'],
        egg: null,
        swatch: {
            light: ['#eff1f5', '#8839ef', '#179299'],
            dark: ['#1e1e2e', '#cba6f7', '#94e2d5'],
        },
    },
    {
        id: 'gruvbox',
        name: 'Gruvbox',
        blurb: 'Retro groove, hard warmth.',
        modes: ['light', 'dark'],
        egg: null,
        swatch: {
            light: ['#fbf1c7', '#af3a03', '#427b58'],
            dark: ['#282828', '#fabd2f', '#8ec07c'],
        },
    },
];

export const DEFAULT_PALETTE = 'default';

export function listThemes() {
    return THEMES;
}

export function themeById(id) {
    return THEMES.find(theme => theme.id === id) ?? null;
}

export function isKnownTheme(id) {
    return themeById(id) !== null;
}

/** The variants a theme has, or both when the theme is unknown to this build. */
export function modesOf(id) {
    return themeById(id)?.modes ?? ['light', 'dark'];
}
