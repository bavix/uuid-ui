'use strict';

import {base64StdToUuid} from "./base64.js";
import {objectParse} from "./object-parser.js";

export const TYPE_HIGH_LOW = 2**0
export const TYPE_BASE64 = 2**1
export const TYPE_BYTES = 2**2
export const TYPE_UUID = 2**3

const UUID_LENGTH = 36

export function typeDetector(input) {
    // high-low-type or bytes-type
    try {
        return Array.isArray(objectParse(input))
            ? TYPE_BYTES
            : TYPE_HIGH_LOW
    } catch (e) {}

    // base64-type
    try {
        if (base64StdToUuid(input).length === UUID_LENGTH) {
            return TYPE_BASE64
        }
    } catch (e) {}

    // default-type
    return TYPE_UUID
}
