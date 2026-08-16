'use strict';

import {MAX, NIL} from 'uuid';
import {uuidToBytesString, uuidToHex} from './uuid-bytes.js';
import {uuidFormatter} from './uuid-formatter.js';
import {timestampFromUlid, timestampFromUuid} from './uuid-timestamp.js';
import {isValid as isUlid} from './uuid-ulid.js';
import {uuidToBase64Std} from './base64.js';
import {uuidToUlid} from './uuid-ulid.js';
import {uuidToInts, uuidToUints} from './uuid-high-low.js';

/**
 * The two identifiers the standard singles out: all zero bits and all one bits.
 * Every spelling the app can produce for them is enumerated from the app's own
 * encoders, so a new output format is covered the moment it is added here.
 */
const QUOTED_NUMBERS = /"(-?\d+)"/g;

function spellings(uuid) {
    const ints = uuidToInts(uuid);
    const uints = uuidToUints(uuid);

    return [
        uuid,
        uuidToHex(uuid),
        uuidToBytesString(uuid),
        uuidToBase64Std(uuid),
        uuidToUlid(uuid),
        ints && JSON.stringify(ints).replace(QUOTED_NUMBERS, '$1'),
        uints && JSON.stringify(uints).replace(QUOTED_NUMBERS, '$1'),
    ].filter(Boolean).map(value => value.toLowerCase());
}

const NIL_FORMS = new Set(spellings(NIL));
const MAX_FORMS = new Set(spellings(MAX));

// Hex words old enough to be folklore. The whole identifier has to be one of
// them repeated four times, so stumbling on one is a deliberate act.
export const HEX_WORDS = ['deadbeef', 'cafebabe', 'feedface', 'deadc0de', 'badc0ffe', '8badf00d'];
const WORD_FORMS = new Map(HEX_WORDS.map(word => [word.repeat(4), word]));

function isPalindrome(hex) {
    for (let i = 0, j = hex.length - 1; i < j; i++, j--) {
        if (hex[i] !== hex[j]) {
            return false;
        }
    }

    return true;
}

// RFC 9562 spends four bits on the version (1-8) and two on the variant, where
// only 10xx is its own; 0xxx is NCS, 110x is Microsoft, 111x is reserved. An
// identifier shaped like a UUID that respects neither is still a fine 128-bit
// value — it is just not what its shape promises.
const RFC_VARIANTS = new Set(['8', '9', 'a', 'b']);

function isNonRfc(hex) {
    const version = parseInt(hex[12], 16);

    return !(version >= 1 && version <= 8) || !RFC_VARIANTS.has(hex[16]);
}

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Time-based identifiers carry a clock. Sometimes it is obviously wrong: a
// machine with a broken RTC, a hand-written value, or a decoder that read the
// fields in the wrong order — the very bug this app used to have.
function isOutOfTime(value) {
    // Ask the ULID clock only of an actual ULID: any 32-hex string decodes as
    // base32 too, and all-zero hex would "read" as 1970.
    const stamp = timestampFromUuid(value) || (isUlid(value) ? timestampFromUlid(value) : null);
    if (stamp === null) {
        return false;
    }

    const at = Date.parse(stamp);

    return at > Date.now() + YEAR_MS || at < Date.parse('1971-01-01T00:00:00Z');
}

/**
 * Everything notable about an identifier, most specific first. A value can be
 * several things at once: the nil UUID is also a palindrome.
 *
 * @returns {string[]} labels such as ['nil', 'palindrome'] or ['deadbeef']
 */
export function specialValues(value) {
    if (typeof value !== 'string') {
        return [];
    }

    const normalized = value.trim().toLowerCase();
    const found = [];

    if (NIL_FORMS.has(normalized)) {
        // All-zero and all-one bytes read the same from either end, whatever
        // spelling they arrived in.
        found.push('nil', 'palindrome');
    } else if (MAX_FORMS.has(normalized)) {
        found.push('max', 'palindrome');
    }

    // Everything below is a property of the bytes, so it needs the hex form.
    const hex = uuidToHex(normalized);
    if (hex === null) {
        return found;
    }

    const word = WORD_FORMS.get(hex);
    if (word) {
        found.push(word);
    }

    if (!found.includes('palindrome') && isPalindrome(hex)) {
        found.push('palindrome');
    }

    // nil and max are named by the RFC itself and their clocks are degenerate by
    // definition, so neither the version rules nor the clock apply to them.
    if (found.includes('nil') || found.includes('max')) {
        return found;
    }

    if (isNonRfc(hex)) {
        found.push('non-rfc');
    }

    if (isOutOfTime(normalized)) {
        found.push('time traveler');
    }

    return found;
}

/** The identifier made of one hex word, four times over. */
export function hexWordUuid(word) {
    return HEX_WORDS.includes(word) ? uuidFormatter(word.repeat(4)) : null;
}

/**
 * A random identifier that reads the same from either end. Sixteen random hex
 * digits mirrored, so the version and variant nibbles fall where the mirror
 * puts them: it is a palindrome first and a UUID second.
 */
export function randomPalindromeUuid() {
    let half = '';
    for (let i = 0; i < 16; i++) {
        half += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    return uuidFormatter(half + [...half].reverse().join(''));
}
