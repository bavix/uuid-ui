'use strict';

import {TYPE_BASE64, TYPE_BYTES, TYPE_HEX, TYPE_HIGH_LOW, TYPE_ULID, TYPE_UUID} from './type-detector.js';
import {SIGNED, UNSIGNED} from './int-type.js';

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
};

const TYPES = Object.fromEntries(Object.entries(SLUGS).map(([slug, type]) => [type, slug]));

// high/low is the one format whose reading depends on a second choice, and the
// two readings are different identifiers — so the link has to carry it too.
const INT_SLUGS = { 'signed': SIGNED, 'unsigned': UNSIGNED };
const INT_TYPES = Object.fromEntries(Object.entries(INT_SLUGS).map(([slug, type]) => [type, slug]));

export function intTypeSlug(type) {
    return INT_TYPES[type] || null;
}

export function parseIntType(hash) {
    if (typeof hash !== 'string') {
        return null;
    }

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const slug = (params.get('int') || '').toLowerCase();

    return Object.prototype.hasOwnProperty.call(INT_SLUGS, slug) ? INT_SLUGS[slug] : null;
}

export function readIntType() {
    try {
        return parseIntType(window.location.hash);
    } catch (e) {
        return null;
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

export function writeState({ resultType, intType }) {
    const target = targetSlug(resultType);
    if (target === null) {
        return;
    }

    const int = intTypeSlug(intType);
    const fragment = int === null ? `#to=${target}` : `#to=${target}&int=${int}`;

    try {
        // replaceState, not a hash assignment: switching a format is not a
        // navigation and must not stack history entries under the back button.
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${fragment}`);
    } catch (e) {
    }
}
