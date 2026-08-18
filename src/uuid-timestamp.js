'use strict';

const B32_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const HEX_32 = /^[0-9a-f]{32}$/;

// Distance between the Gregorian epoch (1582-10-15) and the Unix epoch.
const GREGORIAN_TO_UNIX_MS = 12219292800000n;

// 100-nanosecond ticks per millisecond, the unit used by UUID v1 and v6.
const TICKS_PER_MS = 10000n;

const MAX_TIMESTAMP_MS = 8640000000000000;

function toIsoString(ms) {
    if (!Number.isFinite(ms) || ms < 0 || ms > MAX_TIMESTAMP_MS) {
        return null;
    }

    return new Date(ms).toISOString();
}

/**
 * Reads the millisecond timestamp out of a ULID's first 10 base32 characters.
 * Accepts either case: isValid() does too.
 */
export function timestampFromUlid(ulid) {
    if (typeof ulid !== 'string' || ulid.length < 10) {
        return null;
    }

    let time = 0;
    for (const char of ulid.slice(0, 10).toUpperCase()) {
        const index = B32_CHARS.indexOf(char);
        if (index === -1) {
            return null;
        }
        time = (time * 32) + index;
    }

    return toIsoString(time);
}

/**
 * Reads the embedded timestamp out of a time-based UUID (v1, v6, v7).
 * Returns null for every other version, and for malformed input.
 */
export function timestampFromUuid(uuid) {
    const hex = String(uuid)
        .trim()
        .toLowerCase()
        .replace(/^urn:uuid:/, '')
        .replace(/^\{|\}$/g, '')
        .replace(/-/g, '');
    if (!HEX_32.test(hex)) {
        return null;
    }

    switch (parseInt(hex[12], 16)) {
        case 1: {
            // time_low is 32 bits, time_mid 16, time_high 12 - in that field order.
            const timeLow = BigInt('0x' + hex.slice(0, 8));
            const timeMid = BigInt('0x' + hex.slice(8, 12));
            const timeHigh = BigInt('0x' + hex.slice(13, 16));
            const ticks = (timeHigh << 48n) | (timeMid << 32n) | timeLow;

            return toIsoString(Number(ticks / TICKS_PER_MS - GREGORIAN_TO_UNIX_MS));
        }

        case 6: {
            // v6 is v1 with the time fields reordered most-significant first:
            // 48 bits before the version nibble, 12 bits after it.
            const ticks = (BigInt('0x' + hex.slice(0, 12)) << 12n) | BigInt('0x' + hex.slice(13, 16));

            return toIsoString(Number(ticks / TICKS_PER_MS - GREGORIAN_TO_UNIX_MS));
        }

        case 7:
            return toIsoString(parseInt(hex.slice(0, 12), 16));

        default:
            return null;
    }
}
