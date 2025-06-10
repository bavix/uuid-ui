/**
 * Converts a ULID string to a UUID string.
 *
 * @param {string} input - The ULID string to convert.
 * @returns {string} The corresponding UUID string.
 */
export function ulidToUuid(input) {
    try {
        const bytes = decodeBase32(input);
        return formatBytesAsUuid(bytes);
    } catch (error) {
        console.error(error);
    }
    return null;
}

/**
 * Converts a UUID string to a ULID string.
 *
 * @param {string} input - The UUID string to convert.
 * @returns {string} The corresponding ULID string.
 */
export function uuidToUlid(input) {
    try {
        const bytes = parseUuidToBytes(input);
        return encodeBase32(bytes);
    } catch (error) {
        console.error(error);
    }
    return null;
}

/**
 * Validates if a string is a valid ULID.
 *
 * @param {string} input - The string to validate.
 * @returns {boolean} True if the input is a valid ULID, false otherwise.
 */
export function isValid(input) {
    const ULID_REGEX = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i;

    return typeof input === 'string' && ULID_REGEX.test(input.toUpperCase());
}

// === Internal helpers (not exported) ===

const B32_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Decodes base32-encoded ULID into Uint8Array of bytes.
 */
function decodeBase32(input) {
    let bits = 0;
    let value = 0;
    const bytes = [];

    for (let i = input.length - 1; i >= 0; i--) {
        const char = input[i].toUpperCase();
        const idx = B32_CHARS.indexOf(char);
        if (idx === -1) throw new Error('Invalid character in ULID');

        value |= idx << bits;
        bits += 5;

        while (bits >= 8) {
            bytes.unshift(value & 0xff);
            value >>>= 8;
            bits -= 8;
        }
    }

    if (value !== 0 || bits >= 5) {
        bytes.unshift(value & 0xff);
    }

    return new Uint8Array(bytes);
}

/**
 * Encodes a Uint8Array into Crockford base32 (ULID-compatible).
 */
function encodeBase32(bytes) {
    const reversed = [...bytes].reverse();

    let bits = 0;
    let value = 0;
    const output = [];

    for (const byte of reversed) {
        value |= byte << bits;
        bits += 8;

        while (bits >= 5) {
            output.unshift(value & 0x1f);
            value >>>= 5;
            bits -= 5;
        }
    }

    if (bits > 0 && bits < 5) {
        output.unshift(value & 0x1f);
    }

    return output.map(b => B32_CHARS[b]).join('');
}

/**
 * Parses UUID string into Uint8Array of raw bytes.
 */
function parseUuidToBytes(input) {
    const hex = input.toUpperCase().replace(/-/g, '');
    const bytes = [];

    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }

    return new Uint8Array(bytes);
}

/**
 * Formats a Uint8Array as a standard UUID string.
 */
function formatBytesAsUuid(bytes) {
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return (
        `${hex.slice(0, 8)}-` +
        `${hex.slice(8, 12)}-` +
        `${hex.slice(12, 16)}-` +
        `${hex.slice(16, 20)}-` +
        `${hex.slice(20)}`
    );
}
