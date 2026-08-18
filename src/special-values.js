'use strict';

import {MAX, NIL} from 'uuid';
import {uuidToHex} from './uuid-bytes.js';
import {uuidFormatter} from './uuid-formatter.js';
import {timestampFromUlid, timestampFromUuid} from './uuid-timestamp.js';
import {isValid as isUlid} from './uuid-ulid.js';
import {formsOf} from './identifier-forms.js';

const NIL_FORMS = new Set(formsOf(NIL));
const MAX_FORMS = new Set(formsOf(MAX));

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

    const hex = uuidToHex(normalized);
    if (hex === null) {
        return found;
    }

    if (found.length === 0 && /^0{32}$/.test(hex)) {
        found.push('nil', 'palindrome');
    } else if (found.length === 0 && /^f{32}$/i.test(hex)) {
        found.push('max', 'palindrome');
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
    const nibbles = new Uint8Array(16);
    crypto.getRandomValues(nibbles);

    let half = '';
    for (const nibble of nibbles) {
        half += '0123456789abcdef'[nibble & 0x0f];
    }

    return uuidFormatter(half + [...half].reverse().join(''));
}
