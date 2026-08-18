'use strict';

import { TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_WORDS, typeDetector } from './type-detector.js';
import { objectParse } from './object-parser.js';
import { normalizeBase64 } from './base64.js';
import { uuidFormatter } from './uuid-formatter.js';
import { bytesToUuid, uuidToBytes } from './uuid-bytes.js';
import { unquote } from './quotes.js';

const nrg = /"(-?\d+)"/g;

export function normalizeInput(raw) {
    if (typeof raw !== 'string') {
        return null;
    }

    let input = unquote(raw);

    try {
        switch (typeDetector(input)) {
            case TYPE_BYTES: {
                const bytes = objectParse(input);

                if (!Array.isArray(bytes) || bytes.length !== 16 || bytes.some(byte => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
                    return null;
                }

                return JSON.stringify(bytes);
            }
            case TYPE_HIGH_LOW:
            case TYPE_WORDS: {
                const held = JSON.stringify(objectParse(input)).replace(/,$/g, '');

                return held.replace(nrg, '$1');
            }
            case TYPE_BASE64:
                return normalizeBase64(input);
            case TYPE_ULID:
                return input;
        }
    } catch (e) {
        return null;
    }

    if (input[0] === '{' && input[input.length - 1] === '}') {
        input = input.substring(1, input.length - 1);
    }

    const uuid = uuidFormatter(input);

    if (uuid.length === 36) {
        return uuid;
    }

    const bytes = uuidToBytes(input);

    return bytes === null ? null : bytesToUuid(bytes);
}
