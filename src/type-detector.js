'use strict';

import {base64ToUuid} from "./base64.js";
import {objectParse} from "./object-parser.js";
import {isWords} from "./uuid-words.js";
import {isValid as isValidUlid} from './uuid-ulid.js';
import {unquote} from './quotes.js';

export const TYPE_UUID = 2 ** 0;
export const TYPE_HIGH_LOW = 2 ** 1;
export const TYPE_BASE64 = 2 ** 2;
export const TYPE_BYTES = 2 ** 3;
export const TYPE_ULID = 2 ** 4;

// Kept for links written before hex became a spelling of uuid.
export const TYPE_HEX = 2 ** 5;

// Four 32-bit words, the shape protobuf schemas carry a UUID in.
export const TYPE_WORDS = 2 ** 6;

const UUID_LENGTH = 36;

const SPACED_BYTES = /^[0-9a-f]{2}(?:[\s,]+[0-9a-f]{2}){15}$/i;

export function uuidTypeList() {
    const list = []
    list[TYPE_UUID] = 'uuid'
    list[TYPE_BASE64] = 'base64'
    list[TYPE_HIGH_LOW] = 'high-low'
    list[TYPE_BYTES] = 'bytes'
    list[TYPE_ULID] = 'ulid'
    list[TYPE_WORDS] = 'words'
    return list
}

export function typeDetector(raw) {
    if (typeof raw !== 'string') {
        return TYPE_UUID;
    }

    const input = unquote(raw);

    if (isValidUlid(input.trim())) {
        return TYPE_ULID;
    }

    if (SPACED_BYTES.test(input.trim())) {
        return TYPE_BYTES;
    }

    try {
        const parsed = objectParse(input);

        if (Array.isArray(parsed)) {
            return TYPE_BYTES;
        }

        return isWords(parsed) ? TYPE_WORDS : TYPE_HIGH_LOW;
    } catch (e) {
    }

    try {
        const uuid = base64ToUuid(input);
        if (uuid !== null && uuid.length === UUID_LENGTH) {
            return TYPE_BASE64;
        }
    } catch (e) {
    }

    return TYPE_UUID;
}
