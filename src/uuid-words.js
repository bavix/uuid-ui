'use strict';

import { bytesToUuid, uuidToBytes } from './uuid-bytes.js';

/**
 * A UUID as four 32-bit words — the shape protobuf schemas keep reinventing:
 *
 *   message WellKnownUUID { uint32 w1 = 1; uint32 w2 = 2; uint32 w3 = 3; uint32 w4 = 4; }
 *
 * w1 is the first four bytes of the identifier, big-endian, and so on to w4.
 * That is the order the textual form reads in, so the words line up with the
 * blocks a person sees: w1 is `018f3c00` in `018f3c00-0000-7000-...`.
 *
 * Signed simply reinterprets the same bytes as int32 — protobuf's `int32`
 * against its `uint32`. Unlike the high/low pair, no byte order changes here.
 */

const WORD_KEYS = ['w1', 'w2', 'w3', 'w4'];
const UINT32 = 4294967296;

function toSigned(value) {
    return value >= 2147483648 ? value - UINT32 : value;
}

function toUnsigned(value) {
    return value < 0 ? value + UINT32 : value;
}

/** @returns {{w1: number, w2: number, w3: number, w4: number}|null} */
export function uuidToWords(input, signed = false) {
    const bytes = uuidToBytes(input);

    if (bytes === null) {
        return null;
    }

    const words = {};

    WORD_KEYS.forEach((key, index) => {
        const at = index * 4;
        const value = ((bytes[at] * 16777216) + (bytes[at + 1] << 16) + (bytes[at + 2] << 8) + bytes[at + 3]) >>> 0;
        words[key] = signed ? toSigned(value) : value;
    });

    return words;
}

/** @returns {string|null} the canonical UUID, or null if the words are not four int32s */
export function wordsToUuid(words) {
    if (words === null || typeof words !== 'object') {
        return null;
    }

    const bytes = [];

    for (const key of WORD_KEYS) {
        const raw = Number(words[key]);

        if (!Number.isInteger(raw) || raw < -2147483648 || raw > 4294967295) {
            return null;
        }

        const value = toUnsigned(raw);

        bytes.push(
            Math.floor(value / 16777216) & 0xff,
            (value >>> 16) & 0xff,
            (value >>> 8) & 0xff,
            value & 0xff,
        );
    }

    return bytesToUuid(bytes);
}

/**
 * Which reading a written-out set of words must have come from.
 *
 * A negative word can only have been written as int32; a word above the int32
 * range can only have been written as uint32. When all four fit in both, the
 * two readings are the same text and there is nothing to tell apart — null,
 * rather than a guess dressed up as a fact.
 *
 * @returns {'signed'|'unsigned'|null}
 */
export function wordsIntType(words) {
    if (!isWords(words)) {
        return null;
    }

    const values = WORD_KEYS.map(key => Number(words[key]));

    if (values.some(value => !Number.isFinite(value))) {
        return null;
    }

    if (values.some(value => value < 0)) {
        return 'signed';
    }

    if (values.some(value => value > 2147483647)) {
        return 'unsigned';
    }

    return null;
}

/** True for an object carrying exactly the four words and nothing else. */
export function isWords(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const keys = Object.keys(value);

    return keys.length === WORD_KEYS.length && WORD_KEYS.every(key => keys.includes(key));
}
