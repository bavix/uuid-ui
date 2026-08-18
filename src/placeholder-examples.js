'use strict';

import { v1, v4, v7, MAX, NIL } from 'uuid';
import { TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_UUID, TYPE_WORDS } from './type-detector.js';
import { spell, spellingsOf } from './spellings.js';
import { uuidToBytesString } from './uuid-bytes.js';
import { uuidToBase64Std } from './base64.js';
import { randomFloat } from './random.js';
import { uuidToUlid } from './uuid-ulid.js';
import { uuidToInts, uuidToUints } from './uuid-high-low.js';
import { uuidToWords } from './uuid-words.js';
import { hexWordUuid } from './special-values.js';

const QUOTED = /"(-?\d+)"/g;
const FORMATS = [TYPE_UUID, TYPE_BASE64, TYPE_ULID, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_WORDS];

const NOTES = [
    'from the invoice service',
    'staging row 42',
    'the one that broke the import',
    'ticket 1174',
    'keep an eye on this one',
];

function pick(list, random) {
    return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}

function identifier(random) {
    const roll = random();

    if (roll < 0.08) {
        return NIL;
    }

    if (roll < 0.14) {
        return MAX;
    }

    if (roll < 0.22) {
        return hexWordUuid(pick(['deadbeef', 'cafebabe', 'feedface'], random));
    }

    if (roll < 0.42) {
        return v7();
    }

    if (roll < 0.52) {
        return v1();
    }

    return v4();
}

function canonical(type, uuid, signed) {
    switch (type) {
        case TYPE_BASE64: return uuidToBase64Std(uuid);
        case TYPE_ULID: return uuidToUlid(uuid);
        case TYPE_BYTES: return uuidToBytesString(uuid);
        case TYPE_HIGH_LOW: return JSON.stringify(signed ? uuidToInts(uuid) : uuidToUints(uuid)).replace(QUOTED, '$1');
        case TYPE_WORDS: return JSON.stringify(uuidToWords(uuid, signed));
        default: return uuid;
    }
}

function quoted(text, random) {
    if (text.startsWith('{') || text.startsWith('[') || random() >= 0.22) {
        return text;
    }

    const mark = pick(['"', "'", '`'], random);

    return `${mark}${text}${mark}${random() < 0.35 ? ',' : ''}`;
}

export function writeOne(uuid, random) {
    const type = pick(FORMATS, random);
    const options = spellingsOf(type);
    const spelling = options.length > 0 ? pick(options, random).id : null;

    return quoted(spell(type, canonical(type, uuid, random() < 0.5), spelling, random() < 0.25), random);
}

function commented(line, random) {
    return `${line}  ${random() < 0.5 ? '//' : '#'} ${pick(NOTES, random)}`;
}

function objectWithComments(uuid, random) {
    const pair = random() < 0.5 ? uuidToInts(uuid) : uuidToUints(uuid);

    return [
        '{ // comments live inside too',
        `    low: ${pair.low}, // the low half`,
        `    high: ${pair.high}, # or after a hash`,
        '}',
    ].join('\n');
}

function paste(random) {
    const lines = 2 + Math.floor(random() * 2);

    return Array.from({ length: lines }, () => writeOne(identifier(random), random)).join('\n');
}

export function makeExample(random = randomFloat) {
    const roll = random();
    const uuid = identifier(random);

    if (roll < 0.15) {
        return objectWithComments(uuid, random);
    }

    if (roll < 0.35) {
        return paste(random);
    }

    if (roll < 0.5) {
        return commented(writeOne(uuid, random), random);
    }

    return writeOne(uuid, random);
}
