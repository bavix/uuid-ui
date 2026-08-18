'use strict';

import { TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_UUID, TYPE_WORDS } from './type-detector.js';
import { SPELLINGS, spell } from './spellings.js';
import { uuidToBytesString, uuidToHex } from './uuid-bytes.js';
import { uuidToBase64Std } from './base64.js';
import { uuidToUlid } from './uuid-ulid.js';
import { uuidToInts, uuidToUints } from './uuid-high-low.js';
import { uuidToWords } from './uuid-words.js';

const QUOTED_NUMBERS = /"(-?\d+)"/g;

function plain(value) {
    return value === null ? null : JSON.stringify(value).replace(QUOTED_NUMBERS, '$1');
}

function canonicalForms(uuid) {
    return {
        [TYPE_UUID]: uuid,
        [TYPE_BASE64]: uuidToBase64Std(uuid),
        [TYPE_ULID]: uuidToUlid(uuid),
        [TYPE_BYTES]: uuidToBytesString(uuid),
        [TYPE_HIGH_LOW]: plain(uuidToInts(uuid)),
        [TYPE_WORDS]: plain(uuidToWords(uuid, true)),
    };
}

export function formsOf(uuid) {
    if (typeof uuid !== 'string' || uuid === '') {
        return [];
    }

    const canonical = canonicalForms(uuid);
    const written = [uuidToHex(uuid), plain(uuidToUints(uuid))];

    for (const [type, text] of Object.entries(canonical)) {
        if (!text) {
            continue;
        }

        for (const option of SPELLINGS[type] || []) {
            written.push(spell(Number(type), text, option.id, false));
            written.push(spell(Number(type), text, option.id, true));
        }
    }

    return [...new Set(written.filter(Boolean).map(value => value.toLowerCase()))];
}
