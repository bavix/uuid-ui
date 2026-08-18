'use strict';

import { SIGNED, UNSIGNED } from './int-type.js';

export const READING_NAMES = { [SIGNED]: 'signed', [UNSIGNED]: 'unsigned' };
const READINGS = { signed: SIGNED, unsigned: UNSIGNED };

export function readingName(type) {
    return READING_NAMES[type] ?? null;
}

export function readingOf(name) {
    return typeof name === 'string' ? (READINGS[name] ?? null) : null;
}

export function cleanConvention(row) {
    const held = {};

    if (typeof row?.readAs === 'string' && READINGS[row.readAs]) {
        held.readAs = row.readAs;
    }

    if (typeof row?.writeAs === 'string' && READINGS[row.writeAs]) {
        held.writeAs = row.writeAs;
    }

    return held;
}

export function readingsFor(stored, detected) {
    return {
        read: detected?.read ?? stored?.read ?? null,
        write: detected?.write ?? stored?.write ?? null,
    };
}
