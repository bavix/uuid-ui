'use strict';

import {TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_WORDS, typeDetector} from './type-detector.js';
import {bytesToUuid, uuidToBytes} from './uuid-bytes.js';
import {base64ToUuid} from './base64.js';
import {ulidToUuid} from './uuid-ulid.js';
import {intsToUuid, uintsToUuid} from './uuid-high-low.js';
import {wordsIntType, wordsToUuid} from './uuid-words.js';
import {objectParse} from './object-parser.js';
import {SIGNED, UNSIGNED} from './int-type.js';

/**
 * Any value this app accepts, as the canonical dashed UUID, or null.
 * `intType` only matters for high/low, which reads as two different
 * identifiers depending on it.
 */
export function toUuid(value, intType) {
    if (typeof value !== 'string') {
        return null;
    }

    try {
        switch (typeDetector(value)) {
            case TYPE_BYTES:
                return bytesToUuid(objectParse(value));
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
