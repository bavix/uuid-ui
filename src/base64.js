'use strict';

import {bytesToUuid, uuidToBytes} from "./uuid-bytes.js";

/**
 * Converts a base64 standard representation of a UUID to the UUID string.
 *
 * @param {string} base64 - The base64 standard representation of a UUID.
 * @returns {string} - The UUID string.
 */
export function base64StdToUuid(base64) {
    // Decode the base64 string to bytes.
    const bytes = atob(base64)
        // Convert each character to its corresponding character code.
        .split('')
        .map(c => c.charCodeAt(0))
        // Convert the array of character codes to bytes.
        ;

    // Convert the bytes to the UUID string.
    return bytesToUuid(bytes);
}

/**
 * Converts a UUID string to a base64 standard representation of a UUID.
 *
 * @param {string} uuid - The UUID string to be converted.
 * @returns {string} - The base64 standard representation of the UUID.
 */
export function uuidToBase64Std(uuid) {
    // Convert the UUID string to bytes.
    const bytes = uuidToBytes(uuid);

    // Convert the bytes to a base64 string.
    // The apply() method is used to convert the Uint8Array to an arguments list
    // that can be passed to the String.fromCharCode() method.
    return btoa(
        String.fromCharCode.apply(null, new Uint8Array(bytes))
    );
}
