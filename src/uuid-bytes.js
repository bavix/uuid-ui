'use strict';

import {uuidFormatter} from "./uuid-formatter.js";

const separators = /[^a-z0-9]/g;
const hex32 = /^[0-9a-f]{32}$/;
const chunk = /.{1,2}/g;

const urnPrefix = /^urn:uuid:/i;

function _getUuid(input) {
    if (typeof input !== 'string') {
        return null
    }

    // `urn:uuid:` would otherwise survive as letters and blow the length check.
    const uuidStr = input.replace(urnPrefix, '').toLowerCase().replaceAll(separators, '')

    // Separators are permissive, the payload is not: anything that is not
    // 32 hex digits would silently decode to NaN further down.
    if (!hex32.test(uuidStr)) {
        return null
    }

    return uuidStr
}

function isByte(value) {
    if (typeof value === 'bigint') {
        return value >= 0n && value <= 255n
    }

    return Number.isInteger(value) && value >= 0 && value <= 255
}

export function uuidToBytes(input) {
    const uuidStr = _getUuid(input)
    if (uuidStr === null) {
        return null
    }

    return uuidStr
        .match(chunk)
        .map(b => parseInt(b, 16))
}

export function bytesToUuid(bytes) {
    if (!Array.isArray(bytes) || bytes.length !== 16 || !bytes.every(isByte)) {
        return null
    }

    return uuidFormatter(
        bytes.map(b => b.toString(16).padStart(2, '0')).join('')
    )
}

/** 32 hex digits, no separators: MySQL BINARY(16) dumps, hexdumps, 0x literals. */
export function uuidToHex(input) {
    return _getUuid(input)
}

export function uuidToBytesString(input) {
    const bytes = uuidToBytes(input)

    if (bytes === null) {
        return null
    }

    return JSON.stringify(bytes)
}
