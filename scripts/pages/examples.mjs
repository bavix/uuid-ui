'use strict';

import { fromUuid } from '../../src/from-uuid.js';
import { toUuid } from '../../src/to-uuid.js';
import { parseIntType, parseTarget } from '../../src/url-state.js';
import { TYPE_UUID, uuidTypeList } from '../../src/type-detector.js';
import { normalizeInput } from '../../src/normalize-input.js';
import { timestampFromUuid } from '../../src/uuid-timestamp.js';
import { typeDetector, uuidTypeList as typeNames } from '../../src/type-detector.js';
import { specialValues } from '../../src/special-values.js';
import { variantOf } from '../../src/rfc9562.js';
import { uuidToHex } from '../../src/uuid-bytes.js';
import { spell } from '../../src/spellings.js';

export const FORMAT_NAMES = {
    'uuid': 'UUID text',
    'base64': 'Base64',
    'high-low': 'high/low 64-bit pair',
    'bytes': 'byte array',
    'ulid': 'ULID',
    'hex': 'hex',
    'words': 'four 32-bit words',
};

export function formatSlugs() {
    return uuidTypeList().reduce((held, name) => held.concat([name]), []);
}

export function formatName(slug) {
    return FORMAT_NAMES[slug] ?? slug;
}

export function convert(value, cta) {
    const resultType = parseTarget(`#to=${cta.to}`);

    if (resultType === null) {
        throw new Error(`unknown target format: ${cta.to}`);
    }

    const reading = typeof cta.int === 'string' ? parseIntType(`#in=${cta.int}`) : undefined;
    const uuid = toUuid(value, reading);

    if (uuid === null) {
        throw new Error(`the tool cannot read ${value}`);
    }

    const held = fromUuid(uuid, {
        resultType,
        intType: reading,
        uuidStyle: cta.style,
        uuidUpper: cta.upper === true,
    });

    if (held === null) {
        throw new Error(`the tool cannot convert ${value} to ${cta.to}`);
    }

    if (resultType === TYPE_UUID) {
        return held;
    }

    return spell(resultType, normalizeInput(held), cta.style, cta.upper === true);
}

function describe(value) {
    const name = typeNames()[typeDetector(value)] ?? 'unknown';
    const hex = uuidToHex(value);
    const parts = [name];

    if (hex !== null && hex.length === 32) {
        parts.push(variantOf(hex));

        const version = parseInt(hex[12], 16);

        parts.push(version >= 1 && version <= 8 ? `version ${version}` : 'no version');
    }

    const special = specialValues(value);

    if (special.length > 0) {
        parts.push(special.join(', '));
    }

    return parts.join(' · ');
}

export function exampleValue(uuid, example) {
    if (example.kind === 'detect') {
        return describe(uuid);
    }

    if (example.kind === 'timestamp') {
        const held = timestampFromUuid(uuid);

        if (held === null) {
            throw new Error(`${uuid} carries no timestamp`);
        }

        return held;
    }

    return convert(uuid, example.cta);
}

export function exampleColumn(example) {
    return example.column ?? formatName(example.cta.to);
}
