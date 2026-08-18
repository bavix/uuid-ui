'use strict';

import {TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_WORDS, typeDetector} from './type-detector.js';
import {bytesToUuid, uuidToBytes} from './uuid-bytes.js';
import {base64ToUuid} from './base64.js';
import {ulidToUuid} from './uuid-ulid.js';
import {intsToUuid, uintsToUuid} from './uuid-high-low.js';
import {wordsIntType, wordsToUuid} from './uuid-words.js';
import {objectParse} from './object-parser.js';
import {unquote} from './quotes.js';
import {SIGNED, UNSIGNED} from './int-type.js';

/**
 * Any value this app accepts, as the canonical dashed UUID, or null.
 * `intType` only matters for high/low, which reads as two different
 * identifiers depending on it.
 */
export function toUuid(raw, intType) {
    if (typeof raw !== 'string') {
        return null;
    }

    const value = unquote(raw);

    try {
        switch (typeDetector(value)) {
            case TYPE_BYTES: {
                try {
                    return bytesToUuid(objectParse(value));
                } catch (e) {
                    const bytes = uuidToBytes(value);

                    return bytes === null ? null : bytesToUuid(bytes);
                }
            }
            case TYPE_HIGH_LOW: {
                const pair = objectParse(value);
                const convert = intType === UNSIGNED ? uintsToUuid : intsToUuid;
                return convert(pair.high, pair.low);
            }
            case TYPE_WORDS:
                return wordsToUuid(objectParse(value));
            case TYPE_BASE64:
                return base64ToUuid(value);
            case TYPE_ULID:
                return ulidToUuid(value);
            default: {
                const bytes = uuidToBytes(value);
                return bytes === null ? null : bytesToUuid(bytes);
            }
        }
    } catch (e) {
        return null;
    }
}

/**
 * Which integer type a finished conversion was made under, derived rather than
 * remembered: run both sides through both readings and keep the one where the
 * two sides describe the same identifier.
 *
 * Returns null when the answer is not knowable — either high/low is not
 * involved at all, or the pair is symmetric (nil, max) and both readings agree,
 * in which case the distinction has no consequence for that row.
 */
/**
 * How one written value reads, when the value itself says so: a negative word
 * or pair member can only have been written signed, one past the signed range
 * only unsigned. Values that fit both readings say nothing, and get null.
 */
export function intTypeOfValue(value) {
    try {
        const type = typeDetector(value);

        if (type === TYPE_WORDS) {
            const named = wordsIntType(objectParse(value));

            return named === null ? null : (named === 'signed' ? SIGNED : UNSIGNED);
        }

        if (type === TYPE_HIGH_LOW) {
            const pair = objectParse(value);
            const numbers = [pair.high, pair.low].map(part => BigInt(part));

            if (numbers.some(part => part < 0n)) {
                return SIGNED;
            }

            if (numbers.some(part => part > 9223372036854775807n)) {
                return UNSIGNED;
            }
        }
    } catch (e) {
        return null;
    }

    return null;
}

const PAIR_CACHE = new Map();
const PAIR_CACHE_LIMIT = 4000;

function usesReadings(value) {
    try {
        const type = typeDetector(value);

        return type === TYPE_HIGH_LOW || type === TYPE_WORDS;
    } catch (e) {
        return false;
    }
}

export function detectIntPair(input, output) {
    const key = `${input}\u0000${output}`;
    const cached = PAIR_CACHE.get(key);

    if (cached !== undefined) {
        return cached;
    }

    const held = readingsOf(input, output);

    if (PAIR_CACHE.size >= PAIR_CACHE_LIMIT) {
        PAIR_CACHE.clear();
    }

    PAIR_CACHE.set(key, held);

    return held;
}

function readingsOf(input, output) {
    if (!usesReadings(input) && !usesReadings(output)) {
        return { read: null, write: null };
    }

    const named = { read: intTypeOfValue(input), write: intTypeOfValue(output) };

    if (named.read !== null && named.write !== null) {
        return named;
    }

    const matches = [];
    const left = { [SIGNED]: null, [UNSIGNED]: null };
    const right = { [SIGNED]: null, [UNSIGNED]: null };

    for (const reading of [SIGNED, UNSIGNED]) {
        if (named.read === null || named.read === reading) {
            left[reading] = toUuid(input, reading);
        }

        if (named.write === null || named.write === reading) {
            right[reading] = toUuid(output, reading);
        }
    }

    for (const read of [SIGNED, UNSIGNED]) {
        for (const write of [SIGNED, UNSIGNED]) {
            if (left[read] !== null && left[read] === right[write]) {
                matches.push({ read, write });
            }
        }
    }

    if (matches.length === 0) {
        return named;
    }

    const same = matches.find(match => match.read === match.write);
    const held = matches.length === 1 ? matches[0] : (same ?? null);

    if (held === null) {
        return named;
    }

    return {
        read: named.read ?? held.read,
        write: named.write ?? held.write,
    };
}

export function detectIntType(input, output) {
    // Four words tell their own story: both readings parse to the same
    // identifier, so the comparison below can never separate them, but a
    // negative word or one above the int32 range names the reading outright.
    for (const value of [input, output]) {
        try {
            if (typeDetector(value) === TYPE_WORDS) {
                const named = wordsIntType(objectParse(value));

                if (named !== null) {
                    return named === 'signed' ? SIGNED : UNSIGNED;
                }
            }
        } catch (e) {
            // not a readable pair of words; fall through to the comparison
        }
    }

    const matches = [SIGNED, UNSIGNED].filter(candidate => {
        const left = toUuid(input, candidate);
        if (left === null) {
            return false;
        }

        return left === toUuid(output, candidate);
    });

    return matches.length === 1 ? matches[0] : null;
}
