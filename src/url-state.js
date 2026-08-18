'use strict';

import {TYPE_BASE64, TYPE_BYTES, TYPE_HEX, TYPE_HIGH_LOW, TYPE_ULID, TYPE_UUID, TYPE_WORDS} from './type-detector.js';
import {SIGNED, UNSIGNED} from './int-type.js';
import {ALL_SPELLINGS, defaultSpelling} from './spellings.js';

/**
 * The target format lives in the URL fragment so a link can carry it:
 * `…/#to=base64` opens the converter already set to base64.
 *
 * Only the format travels. The identifiers people paste here are production
 * data; putting them in the URL would write them into browser history and into
 * whatever chat the link is pasted in.
 */
const SLUGS = {
    'uuid': TYPE_UUID,
    'base64': TYPE_BASE64,
    'high-low': TYPE_HIGH_LOW,
    'bytes': TYPE_BYTES,
    'ulid': TYPE_ULID,
    'hex': TYPE_HEX,
    'words': TYPE_WORDS,
};

const TYPES = Object.fromEntries(Object.entries(SLUGS).map(([slug, type]) => [type, slug]));

// high/low is the one format whose reading depends on a second choice, and the
// two readings are different identifiers — so the link has to carry it too.
const INT_SLUGS = { 'signed': SIGNED, 'unsigned': UNSIGNED };
const INT_TYPES = Object.fromEntries(Object.entries(INT_SLUGS).map(([slug, type]) => [type, slug]));

export function intTypeSlug(type) {
    return INT_TYPES[type] || null;
}

function intAt(hash, name) {
    if (typeof hash !== 'string') {
        return null;
    }

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const slug = (params.get(name) || '').toLowerCase();

    return Object.prototype.hasOwnProperty.call(INT_SLUGS, slug) ? INT_SLUGS[slug] : null;
}

export function parseIntType(hash) {
    return intAt(hash, 'in') ?? intAt(hash, 'int');
}

export function parseIntTypes(hash) {
    const read = parseIntType(hash);
    const write = intAt(hash, 'out') ?? intAt(hash, 'int-out');

    // A link from before the split carries one choice; it means both ends.
    return { read, write: write ?? read };
}

export function readIntType() {
    try {
        return parseIntType(window.location.hash);
    } catch (e) {
        return null;
    }
}

export function parseUuidStyle(hash) {
    if (typeof hash !== 'string') {
        return null;
    }

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const slug = (params.get('style') || '').toLowerCase();

    return ALL_SPELLINGS.includes(slug) ? slug : null;
}

export function parseUuidUpper(hash) {
    if (typeof hash !== 'string') {
        return false;
    }

    return new URLSearchParams(hash.replace(/^#/, '')).get('case') === 'upper';
}

export function readUuidStyle() {
    try {
        return parseUuidStyle(window.location.hash);
    } catch (e) {
        return null;
    }
}

export function readUuidUpper() {
    try {
        return parseUuidUpper(window.location.hash);
    } catch (e) {
        return false;
    }
}

export function readIntTypes() {
    try {
        return parseIntTypes(window.location.hash);
    } catch (e) {
        return { read: null, write: null };
    }
}

export function targetSlug(type) {
    return TYPES[type] || null;
}

export function parseTarget(hash) {
    if (typeof hash !== 'string') {
        return null;
    }

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const slug = (params.get('to') || '').toLowerCase();

    return Object.prototype.hasOwnProperty.call(SLUGS, slug) ? SLUGS[slug] : null;
}

export function readTarget() {
    try {
        return parseTarget(window.location.hash);
    } catch (e) {
        return null;
    }
}

export function writeState({ resultType, intType, writeIntType, uuidStyle, uuidUpper }) {
    const target = targetSlug(resultType);
    if (target === null) {
        return;
    }

    const int = intTypeSlug(intType);
    const out = intTypeSlug(writeIntType ?? intType);
    let fragment = `#to=${target}`;

    if (int !== null) {
        fragment += `&in=${int}`;

        if (out !== null && out !== int) {
            fragment += `&out=${out}`;
        }
    }

    if (ALL_SPELLINGS.includes(uuidStyle) && uuidStyle !== defaultSpelling(resultType)) {
        fragment += `&style=${uuidStyle}`;
    }

    if (uuidUpper) {
        fragment += '&case=upper';
    }

    try {
        // replaceState, not a hash assignment: switching a format is not a
        // navigation and must not stack history entries under the back button.
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${fragment}`);
    } catch (e) {
    }
}
