'use strict';

import { fromUuid } from './from-uuid.js';
import { toUuid } from './to-uuid.js';
import { typeDetector, uuidTypeList } from './type-detector.js';
import { parseIntType, parseTarget, parseUuidStyle } from './url-state.js';
import { timestampFromUlid, timestampFromUuid } from './uuid-timestamp.js';
import { isValid as isUlid } from './uuid-ulid.js';
import { specialValues } from './special-values.js';
import { variantOf } from './rfc9562.js';
import { uuidToHex } from './uuid-bytes.js';
import { normalizeInput } from './normalize-input.js';
import { extractComment, stripComment } from './comment.js';
import { spell } from './spellings.js';
import { TYPE_UUID } from './type-detector.js';
import { MAX, NIL, v1, v4, v6, v7 } from 'uuid';
import { nameBased, namespaceOf } from './uuid-names.js';
import { v8 } from './uuid-v8.js';
import { hexWordUuid, randomPalindromeUuid } from './special-values.js';
import { uuidToUlid } from './uuid-ulid.js';
import { isTimed, momentOptions } from './generate-at.js';

function target(name) {
    const type = parseTarget(`#to=${name}`);

    if (type === null) {
        throw new Error(`unknown format: ${name}`);
    }

    return type;
}

export function convert(value, options = {}) {
    const uuid = toUuid(value, options.int === undefined ? undefined : parseIntType(`#in=${options.int}`));

    if (uuid === null) {
        return null;
    }

    const resultType = target(options.to ?? 'uuid');
    const held = fromUuid(uuid, {
        resultType,
        intType: options.int === undefined ? undefined : parseIntType(`#in=${options.int}`),
        uuidStyle: options.style === undefined ? undefined : parseUuidStyle(`#style=${options.style}`),
        uuidUpper: options.upper === true,
    });

    if (held === null) {
        return null;
    }

    return resultType === TYPE_UUID
        ? held
        : spell(resultType, normalizeInput(held), options.style, options.upper === true);
}

export function detect(value) {
    const name = uuidTypeList()[typeDetector(value)] ?? null;

    if (name === null) {
        return null;
    }

    const uuid = toUuid(value);
    const hex = uuid === null ? null : uuidToHex(uuid);
    const version = hex === null ? null : parseInt(hex[12], 16);

    return {
        format: name,
        uuid,
        variant: hex === null ? null : variantOf(hex),
        version: version !== null && version >= 1 && version <= 8 ? version : null,
        special: specialValues(uuid ?? value),
        at: uuid === null ? null : (timestampFromUuid(uuid) ?? (isUlid(value.trim()) ? timestampFromUlid(value.trim()) : null)),
    };
}

export const GENERATORS = ['v1', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'nil', 'max', 'ulid', 'deadbeef', 'cafebabe', 'palindrome'];

export function generate(type = 'v4', options = {}) {
    if (!GENERATORS.includes(type)) {
        return null;
    }

    const at = isTimed(type) ? momentOptions(options.moment ?? '') : {};

    switch (type) {
        case 'v1':
            return v1(at);
        case 'v6':
            return v6(at);
        case 'v7':
            return v7(at);
        case 'ulid':
            return uuidToUlid(v7(at));
        case 'v3':
        case 'v5':
            return nameBased(type === 'v3' ? 3 : 5, options.namespace ?? 'dns', options.name ?? '');
        case 'v8':
            return v8();
        case 'nil':
            return NIL;
        case 'max':
            return MAX;
        case 'palindrome':
            return randomPalindromeUuid();
        case 'deadbeef':
        case 'cafebabe':
            return hexWordUuid(type);
        default:
            return v4();
    }
}

export function namespaceId(name) {
    return namespaceOf(name);
}

export function convertMany(text, options = {}) {
    return String(text)
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .map(line => {
            const value = stripComment(line).trim();
            const comment = extractComment(line);
            const held = value === '' ? null : convert(value, options);

            return { input: value, comment, output: held, ok: held !== null };
        });
}

export function collisionOdds(count, bits = 122) {
    const space = 2 ** bits;
    const n = Number(count);

    if (!Number.isFinite(n) || n <= 1) {
        return 0;
    }

    return 1 - Math.exp(-(n * (n - 1)) / (2 * space));
}

export function collisionCount(probability, bits = 122) {
    const space = 2 ** bits;
    const p = Number(probability);

    if (!Number.isFinite(p) || p <= 0 || p >= 1) {
        return Infinity;
    }

    return Math.sqrt(2 * space * Math.log(1 / (1 - p)));
}

export function derive(version, namespace, name) {
    return nameBased(version, namespace, name);
}

export const FORMATS = uuidTypeList().reduce((held, name) => held.concat([name]), []);
