'use strict';

import { contrast } from '../tag-color.js';

/**
 * What a theme has to clear before anybody reads identifiers off it. The same
 * numbers gate the built-in themes in the test suite and anything somebody
 * pastes in, so a hand-written theme is held to what the shipped ones are.
 */
export const FLOORS = [
    ['ink', 'surface-raised', 4.5, 'body text on a card'],
    ['ink', 'surface', 4.5, 'body text on the page'],
    ['ink-muted', 'surface-raised', 4.5, 'muted text on a card'],
    ['ink-muted', 'surface', 4.5, 'muted text on the page'],
    ['accent', 'surface-raised', 3, 'the accent on a card'],
    ['accent-ink', 'accent-fill', 4, 'text on a filled control'],
];

function splitTop(text) {
    const parts = [];
    let depth = 0;
    let held = '';

    for (const ch of text) {
        if (ch === '(') {
            depth += 1;
        }

        if (ch === ')') {
            depth -= 1;
        }

        if (ch === ',' && depth === 0) {
            parts.push(held.trim());
            held = '';
            continue;
        }

        held += ch;
    }

    if (held.trim() !== '') {
        parts.push(held.trim());
    }

    return parts;
}

function withWeight(tokens, part, depth) {
    const held = part.match(/^(.*?)\s+([\d.]+)%$/);
    const colour = held ? held[1] : part;
    const weight = held ? Number(held[2]) / 100 : null;

    return { rgb: rgbOf({ ...tokens, __held: colour }, '__held', depth + 1), weight };
}

/** A colour a theme wrote, with any var() it points at followed to the end. */
export function rgbOf(tokens, name, depth = 0) {
    const value = tokens?.[name];

    if (typeof value !== 'string' || depth > 4) {
        return null;
    }

    const points = value.match(/^var\((--[a-z0-9-]+)/);

    if (points) {
        return rgbOf(tokens, points[1].slice(2), depth + 1);
    }

    const hex = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

    if (hex) {
        const held = hex[1].length === 3 ? hex[1].replace(/./g, c => c + c) : hex[1];

        return [0, 2, 4].map(at => parseInt(held.slice(at, at + 2), 16));
    }

    const mixed = value.match(/^color-mix\(\s*in\s+[a-z-]+\s*,\s*(.+)\)$/i);

    if (mixed) {
        const parts = splitTop(mixed[1]);

        if (parts.length === 2) {
            const first = withWeight(tokens, parts[0], depth);
            const second = withWeight(tokens, parts[1], depth);

            if (first.rgb && second.rgb) {
                const weight = first.weight ?? (second.weight === null ? 0.5 : 1 - second.weight);

                return first.rgb.map((held, at) => Math.round(held * weight + second.rgb[at] * (1 - weight)));
            }
        }

        return null;
    }

    const numbers = value.match(/^rgba?\(([^)]*)\)/);

    return numbers
        ? numbers[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(Number)
        : null;
}

/**
 * Reads a theme's own values against the floors. Pairs the theme says nothing
 * about are skipped rather than failed: a theme may set three tokens and lean
 * on the shipped ones for the rest.
 */
export function gradeTheme(tokens) {
    const failures = [];
    let worst = Infinity;
    let worstText = Infinity;

    for (const [ink, surface, floor, what] of FLOORS) {
        const first = rgbOf(tokens, ink);
        const second = rgbOf(tokens, surface);

        if (!first || !second) {
            continue;
        }

        const ratio = contrast(first, second);

        worst = Math.min(worst, ratio);

        // The number worth showing is the one for reading: an accent is held to
        // 3:1 as a control, and quoting it made readable themes look marginal.
        if (floor >= 4.5) {
            worstText = Math.min(worstText, ratio);
        }

        if (ratio < floor) {
            failures.push({ ink, surface, ratio, floor, what });
        }
    }

    return {
        worst: worst === Infinity ? null : worst,
        worstText: worstText === Infinity ? null : worstText,
        failures,
    };
}
