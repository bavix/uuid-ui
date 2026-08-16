'use strict';

import {bytesToUuid, uuidToBytes} from "./uuid-bytes.js";

export function base64StdToUuid(base64) {
    const bytes = atob(base64)
        .split('')
        .map(c => c.charCodeAt(0));

    return bytesToUuid(bytes);
}

const BASE64_URL = /^[A-Za-z0-9_-]+={0,2}$/;

/**
 * Rewrites the URL-safe alphabet (RFC 4648 §5, padded or not) as standard
 * base64. JWT payloads, Go's base64.RawURLEncoding and most URL shorteners
 * emit it, and it used to be rejected as garbage.
 */
export function base64UrlToStd(base64) {
    if (typeof base64 !== 'string' || !BASE64_URL.test(base64)) {
        return null;
    }

    const standard = base64.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');

    return standard + '='.repeat((4 - (standard.length % 4)) % 4);
}

const BASE64_ANY = /^[A-Za-z0-9+/_-]+={0,2}$/;

/**
 * The canonical padded standard form of any base64 spelling this app accepts,
 * or null. Padding is rebuilt rather than trusted: atob tolerates it missing,
 * so an unpadded string would otherwise pass through uncanonicalized.
 */
export function normalizeBase64(input) {
    if (typeof input !== 'string' || !BASE64_ANY.test(input)) {
        return null;
    }

    // One alphabet or the other, never a mix of the two.
    if (/[+/]/.test(input) && /[-_]/.test(input)) {
        return null;
    }

    const body = input.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    const standard = body + '='.repeat((4 - (body.length % 4)) % 4);

    return base64StdToUuid_safe(standard) !== null ? standard : null;
}

/** Accepts either alphabet. */
export function base64ToUuid(input) {
    const standard = normalizeBase64(input);

    return standard === null ? null : base64StdToUuid(standard);
}

function base64StdToUuid_safe(input) {
    try {
        return base64StdToUuid(input);
    } catch (e) {
        return null;
    }
}

export function uuidToBase64Std(uuid) {
    const bytes = uuidToBytes(uuid);
    if (bytes === null) {
        return null;
    }

    return btoa(
        String.fromCharCode.apply(null, new Uint8Array(bytes))
    );
}
