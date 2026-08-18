'use strict';

/**
 * A theme somebody wrote themselves. It is a list of tokens and nothing else:
 * no selectors, no rules, no images fetched from anywhere. What arrives as text
 * is checked name by name and value by value before a single pixel changes.
 */

export const CUSTOM_PALETTE = 'custom';
export const MAX_BYTES = 8192;

/** Colours the interface is built from. A theme must be able to set all of them. */
export const COLOUR_TOKENS = [
    'surface', 'surface-sunken', 'surface-raised', 'surface-hover', 'row-alt',
    'line', 'line-strong',
    'ink', 'ink-muted', 'ink-muted-chip',
    'accent', 'accent-soft', 'accent-fill', 'accent-ink',
    'brand-1', 'brand-2', 'brand-3',
    'fmt-uuid', 'fmt-base64', 'fmt-ulid', 'fmt-highlow', 'fmt-bytes', 'fmt-words',
    'warn', 'warn-strong', 'alarm', 'void',
    'bit-off', 'bit-random', 'bit-fixed', 'bit-time', 'bit-clock', 'bit-node',
    'sync-danger', 'sync-good',
    'chip-on-bg', 'chip-on-ink', 'chip-on-dot', 'seg-on-bg', 'seg-on-ink',
    'label-fill', 'label-ink', 'signature-ink', 'mark-note', 'mark-bad',
];

/**
 * Everything else a theme may bend, with what a value has to look like. The
 * list matches what the built-in themes are allowed to set, so "copy this one"
 * hands back a theme that can be pasted straight in without losing its shape,
 * its weight of shadow or its type scale.
 */
export const SHAPE_TOKENS = {
    'radius-xs': 'length', 'radius-sm': 'length', 'radius-md': 'length',
    'radius-lg': 'length', 'radius-pill': 'length',
    'radius-xl': 'length', 'radius-2xl': 'length', 'radius-3xl': 'length',
    'bit-mix': 'percent', 'map-mix': 'percent', 'tint-badge': 'percent',
    'tint-output': 'percent', 'tint-nil': 'percent', 'tint-nil-glow': 'percent',
    'output-edge': 'length', 'label-pad': 'length',
    'title-tracking': 'length', 'title-transform': 'transform',
    'signature-time': 'time',
    'motion-fast': 'time', 'motion-base': 'time', 'motion-slow': 'time',
    'motion-scale': 'number',
    'ui-2xs': 'length', 'ui-xs': 'length', 'ui-sm': 'length',
    'ui-base': 'length', 'ui-lg': 'length', 'ui-title': 'length',
    'shadow-sm': 'shadow', 'shadow-md': 'shadow', 'shadow-lg': 'shadow',
    'glow-accent': 'shadow', 'glow-chip': 'shadow',
    'logo-filter': 'filter',
    'font-ui': 'font',
};

export const TOKEN_NAMES = [...COLOUR_TOKENS, ...Object.keys(SHAPE_TOKENS)];

const BANNED = /url\(|image-set\(|element\(|expression|@import|var\(|;|\{|\}/i;
const TRANSFORMS = ['none', 'uppercase', 'lowercase', 'capitalize'];

function supports(property, value) {
    try {
        return typeof CSS !== 'undefined' && CSS.supports(property, value);
    } catch (e) {
        return false;
    }
}

function shapeIsFine(kind, value) {
    if (kind === 'transform') {
        return TRANSFORMS.includes(value);
    }

    // Shadows, filters and font stacks are long values with commas in them, so
    // the browser is asked whether it would accept them rather than guessed at.
    if (kind === 'shadow') {
        return value === 'none' || supports('box-shadow', value);
    }

    if (kind === 'filter') {
        return value === 'none' || supports('filter', value);
    }

    if (kind === 'font') {
        return supports('font-family', value);
    }

    if (kind === 'number') {
        return /^\d(\.\d+)?$/.test(value) && Number(value) <= 3;
    }

    if (kind === 'percent') {
        return /^\d{1,3}(\.\d+)?%$/.test(value);
    }

    if (kind === 'time') {
        return /^\d{1,5}(\.\d+)?m?s$/.test(value);
    }

    return /^-?\d{1,4}(\.\d+)?(px|rem|em|%)?$/.test(value) || value === '0';
}

/**
 * Reads a theme out of text. Never throws: it answers with the theme it could
 * make and the list of things it refused, so the interface can say why.
 */
function keepTokens(tokens, problems, prefix = '') {
    const kept = {};

    for (const [name, value] of Object.entries(tokens)) {
        const bare = String(name).replace(/^--/, '');

        if (!TOKEN_NAMES.includes(bare)) {
            problems.push(`${prefix}${bare}: not a token this build reads.`);
            continue;
        }

        const text = String(value).trim();

        if (BANNED.test(text)) {
            problems.push(`${prefix}${bare}: only plain values, nothing that fetches or nests.`);
            continue;
        }

        const kind = SHAPE_TOKENS[bare];

        if (kind ? !shapeIsFine(kind, text) : !supports('color', text)) {
            problems.push(`${prefix}${bare}: ${text} is not a ${kind ? kind : 'colour'}.`);
            continue;
        }

        kept[bare] = text;
    }

    return kept;
}

function tokenMap(held) {
    return held && typeof held === 'object' && !Array.isArray(held) ? held : null;
}

export function readTheme(text) {
    const problems = [];

    if (typeof text !== 'string' || text.trim() === '') {
        return { theme: null, problems: ['Nothing to read.'] };
    }

    if (text.length > MAX_BYTES) {
        return { theme: null, problems: [`Too long: ${text.length} characters, ${MAX_BYTES} is the most.`] };
    }

    let held;

    try {
        held = JSON.parse(text);
    } catch (e) {
        return { theme: null, problems: ['Not JSON.'] };
    }

    if (!held || typeof held !== 'object' || Array.isArray(held)) {
        return { theme: null, problems: ['A theme is an object.'] };
    }

    const pair = { light: tokenMap(held.light?.tokens ?? held.light), dark: tokenMap(held.dark?.tokens ?? held.dark) };
    const single = tokenMap(held.tokens);

    if (!single && !pair.light && !pair.dark) {
        return { theme: null, problems: ['No tokens in it.'] };
    }

    const variants = {};

    if (pair.light || pair.dark) {
        for (const mode of ['light', 'dark']) {
            if (pair[mode]) {
                const kept = keepTokens(pair[mode], problems, `${mode}/`);

                if (Object.keys(kept).length > 0) {
                    variants[mode] = kept;
                }
            }
        }
    } else {
        const kept = keepTokens(single, problems);

        if (Object.keys(kept).length > 0) {
            variants[held.mode === 'light' ? 'light' : 'dark'] = kept;
        }
    }

    const modes = Object.keys(variants);

    if (modes.length === 0) {
        problems.push('Nothing usable was left.');

        return { theme: null, problems };
    }

    const mode = held.mode === 'light' || held.mode === 'dark'
        ? (variants[held.mode] ? held.mode : modes[0])
        : (variants.dark ? 'dark' : 'light');

    return {
        theme: {
            name: typeof held.name === 'string' && held.name.trim() !== '' ? held.name.trim().slice(0, 32) : 'Custom',
            mode,
            modes,
            tokens: variants[mode],
            variants,
        },
        problems,
    };
}

/** What the theme on screen right now is made of, as text somebody can edit. */
export function writeTheme(root = document.documentElement, name = 'My theme') {
    const style = getComputedStyle(root);
    const tokens = {};

    for (const token of TOKEN_NAMES) {
        const held = style.getPropertyValue(`--${token}`).trim();

        if (held !== '') {
            tokens[token] = held;
        }
    }

    return JSON.stringify({
        name,
        mode: root.classList.contains('dark') ? 'dark' : 'light',
        tokens,
    }, null, 2);
}

export function applyCustom(theme, root = document.documentElement) {
    clearCustom(root);

    if (!theme) {
        return;
    }

    const mode = root.classList.contains('dark') ? 'dark' : 'light';
    const tokens = theme.variants?.[mode] ?? theme.variants?.[mode === 'dark' ? 'light' : 'dark'] ?? theme.tokens;

    for (const [name, value] of Object.entries(tokens)) {
        root.style.setProperty(`--${name}`, value);
    }
}

export function clearCustom(root = document.documentElement) {
    for (const token of TOKEN_NAMES) {
        root.style.removeProperty(`--${token}`);
    }
}
