'use strict';

import {base64StdToUuid} from "./base64.js";
import {objectParse} from "./object-parser.js";
import {isValid as isValidUlid} from './uuid-ulid.js';

export const TYPE_UUID = 2 ** 0;
export const TYPE_HIGH_LOW = 2 ** 1;
export const TYPE_BASE64 = 2 ** 2;
export const TYPE_BYTES = 2 ** 3;
export const TYPE_ULID = 2 ** 4;

const UUID_LENGTH = 36;

export function uuidTypeList() {
    const list = []
    list[TYPE_UUID] = 'uuid'
    list[TYPE_BASE64] = 'base64'
    list[TYPE_HIGH_LOW] = 'high-low'
    list[TYPE_BYTES] = 'bytes'
    list[TYPE_ULID] = 'ulid'
    return list
}

export function typeDetector(input) {
    if (isValidUlid(input.trim())) {
        return TYPE_ULID;
    }

    try {
        return Array.isArray(objectParse(input))
            ? TYPE_BYTES
            : TYPE_HIGH_LOW;
    } catch (e) {
    }

    try {
        if (base64StdToUuid(input).length === UUID_LENGTH) {
            return TYPE_BASE64;
        }
    } catch (e) {
    }

    return TYPE_UUID;
}
