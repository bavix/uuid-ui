'use strict';

import { TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_UUID, TYPE_WORDS } from './type-detector.js';
import { STYLE_BRACES, STYLE_HEX, STYLE_PLAIN, STYLE_URN, styleUuid } from './uuid-style.js';

export const SPELLINGS = {
    [TYPE_UUID]: [
        { id: STYLE_PLAIN, label: 'plain' },
        { id: STYLE_HEX, label: 'hex' },
        { id: STYLE_BRACES, label: 'braces' },
        { id: STYLE_URN, label: 'urn' },
    ],
    [TYPE_BASE64]: [
        { id: 'std', label: 'standard' },
        { id: 'url', label: 'url-safe' },
    ],
    [TYPE_ULID]: [
        { id: 'upper', label: 'ABCDEF' },
        { id: 'lower', label: 'abcdef' },
    ],
    [TYPE_BYTES]: [
        { id: 'decimal', label: '113, 164' },
        { id: 'hex', label: '71 a4' },
        { id: 'chex', label: '0x71, 0xa4' },
    ],
    [TYPE_HIGH_LOW]: [
        { id: 'object', label: '{ high, low }' },
        { id: 'pair', label: 'high;low' },
    ],
    [TYPE_WORDS]: [
        { id: 'object', label: '{ w1…w4 }' },
        { id: 'quad', label: 'w1;w2;w3;w4' },
    ],
};

const CASED = [TYPE_UUID, TYPE_BYTES];

export const ALL_SPELLINGS = [...new Set(Object.values(SPELLINGS).flat().map(option => option.id))];

export function spellingsOf(type) {
    return SPELLINGS[type] || [];
}

export function defaultSpelling(type) {
    return spellingsOf(type)[0]?.id ?? null;
}

export function usesInts(type) {
    return type === TYPE_HIGH_LOW || type === TYPE_WORDS;
}

export function spellingLabel(type, id, upper = false) {
    const held = spellingsOf(type).find(option => option.id === id);
    const cased = upper && hasCase(type);

    if (held && held.id !== defaultSpelling(type)) {
        return cased ? held.label.toUpperCase() : held.label;
    }

    return cased ? 'capitals' : null;
}

export function isSpelling(type, id) {
    return spellingsOf(type).some(option => option.id === id);
}

export function hasCase(type) {
    return CASED.includes(type);
}

function bytesOf(text) {
    try {
        const held = JSON.parse(text);

        return Array.isArray(held) ? held : null;
    } catch (e) {
        return null;
    }
}

function numberAt(text, name) {
    const held = new RegExp(`"?${name}"?\\s*:\\s*"?(-?\\d+)"?`).exec(text);

    return held === null ? null : held[1];
}

function numbersOf(text, names) {
    const held = names.map(name => numberAt(text, name));

    return held.every(part => part !== null) ? held : null;
}

export function spell(type, text, spelling, upper = false) {
    if (typeof text !== 'string' || text === '') {
        return text;
    }

    if (type === TYPE_UUID) {
        return styleUuid(text, spelling ?? STYLE_PLAIN, upper);
    }

    if (type === TYPE_BASE64) {
        return spelling === 'url'
            ? text.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
            : text;
    }

    if (type === TYPE_ULID) {
        return spelling === 'lower' ? text.toLowerCase() : text.toUpperCase();
    }

    if (type === TYPE_BYTES) {
        const bytes = bytesOf(text);

        if (bytes === null) {
            return text;
        }

        if (spelling === 'hex') {
            const hex = bytes.map(byte => byte.toString(16).padStart(2, '0'));

            return (upper ? hex.map(part => part.toUpperCase()) : hex).join(' ');
        }

        if (spelling === 'chex') {
            const hex = bytes.map(byte => `0x${byte.toString(16).padStart(2, '0')}`);

            return `[${(upper ? hex.map(part => part.toUpperCase().replace('0X', '0x')) : hex).join(', ')}]`;
        }

        return text;
    }

    if (type === TYPE_HIGH_LOW && spelling === 'pair') {
        const pair = numbersOf(text, ['high', 'low']);

        return pair === null ? text : pair.join(';');
    }

    if (type === TYPE_WORDS && spelling === 'quad') {
        const words = numbersOf(text, ['w1', 'w2', 'w3', 'w4']);

        return words === null ? text : words.join(';');
    }

    return text;
}
