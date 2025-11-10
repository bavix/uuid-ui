export function ulidToUuid(input) {
    try {
        const bytes = decodeBase32(input);
        return formatBytesAsUuid(bytes);
    } catch (error) {
        console.error(error);
    }
    return null;
}

export function uuidToUlid(input) {
    try {
        const bytes = parseUuidToBytes(input);
        return encodeBase32(bytes);
    } catch (error) {
        console.error(error);
    }
    return null;
}

export function isValid(input) {
    const ULID_REGEX = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i;

    return typeof input === 'string' && ULID_REGEX.test(input.toUpperCase());
}

const B32_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

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

function parseUuidToBytes(input) {
    const hex = input.toUpperCase().replace(/-/g, '');
    const bytes = [];

    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }

    return new Uint8Array(bytes);
}

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
