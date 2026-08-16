'use strict';

import {base64ToUuid} from "./base64.js";
import {objectParse} from "./object-parser.js";
import {isWords} from "./uuid-words.js";
import {isValid as isValidUlid} from './uuid-ulid.js';

export const TYPE_UUID = 2 ** 0;
export const TYPE_HIGH_LOW = 2 ** 1;
export const TYPE_BASE64 = 2 ** 2;
export const TYPE_BYTES = 2 ** 3;
export const TYPE_ULID = 2 ** 4;

// An output-only view: as *input* a bare hex string is already a UUID.
export const TYPE_HEX = 2 ** 5;

// Four 32-bit words, the shape protobuf schemas carry a UUID in.
export const TYPE_WORDS = 2 ** 6;

const UUID_LENGTH = 36;

export function uuidTypeList() {
    const list = []
    list[TYPE_UUID] = 'uuid'
    list[TYPE_BASE64] = 'base64'
    list[TYPE_HIGH_LOW] = 'high-low'
    list[TYPE_BYTES] = 'bytes'
    list[TYPE_ULID] = 'ulid'
    list[TYPE_HEX] = 'hex'
    list[TYPE_WORDS] = 'words'
    return list
}

export function typeDetector(input) {
    if (typeof input !== 'string') {
        return TYPE_UUID;
    }

    if (isValidUlid(input.trim())) {
        return TYPE_ULID;
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
