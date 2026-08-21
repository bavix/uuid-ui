'use strict';

import { SIGNED } from './int-type.js';
import { TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_WORDS } from './type-detector.js';
import { uuidToBytesString } from './uuid-bytes.js';
import { uuidToWords } from './uuid-words.js';
import { uuidToInts, uuidToUints } from './uuid-high-low.js';
import { uuidToBase64Std } from './base64.js';
import { uuidToUlid } from './uuid-ulid.js';
import { STYLE_PLAIN, styleUuid } from './uuid-style.js';

export function fromUuid(uuid, { resultType, intType, uuidStyle = STYLE_PLAIN, uuidUpper = false } = {}) {
    switch (resultType) {
        case TYPE_BYTES:
            return uuidToBytesString(uuid);
        case TYPE_HIGH_LOW: {
            const pair = intType === SIGNED ? uuidToInts(uuid) : uuidToUints(uuid);

            return pair === null ? null : JSON.stringify(pair);
        }
        case TYPE_WORDS: {
            const words = uuidToWords(uuid, intType === SIGNED);

            return words === null ? null : JSON.stringify(words);
        }
        case TYPE_BASE64:
            return uuidToBase64Std(uuid);
        case TYPE_ULID:
            return uuidToUlid(uuid);
    }

    return styleUuid(uuid, uuidStyle, uuidUpper);
}
