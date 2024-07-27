'use strict';

import {uuidFormatter} from "./uuid-formatter.js";

/**
 * Regular expression to match all non-alphanumeric characters in a UUID string.
 * Used to remove non-alphanumeric characters from the input when converting bytes to UUID.
 * @type {RegExp}
 */
const uuidAlf = /[^a-z0-9]/g; // eslint-disable-line no-useless-escape

/**
 * Regular expression to split a UUID string into 2-character chunks.
 * Used to split UUID string into bytes when converting bytes to UUID.
 * @type {RegExp}
 */
const chunk = /.{1,2}/g;

/**
 * Removes non-alphanumeric characters from a UUID string.
 * @param {string} input - The UUID string to be cleaned.
 * @returns {string|null} - The cleaned UUID string, or null if the input has an invalid length.
 */
function _getUuid(input) {
    // Lowercase the input and remove all non-alphanumeric characters.
    const uuidStr = input.toLowerCase().replaceAll(uuidAlf, '')
    
    // Check if the cleaned UUID string has the correct length (32 characters).
    if (uuidStr.length !== 32) {
        // If the length is invalid, return null.
        return null
    }

    // Return the cleaned UUID string.
    return uuidStr
}

/**
 * Converts a UUID string to an array of bytes.
 * Each byte is represented as a decimal number.
 *
 * @param {string} input - The UUID string to be converted.
 * @returns {Array<number>|null} - The array of bytes, or null if the input has an invalid length.
 */
export function uuidToBytes(input) {
    // Clean the input UUID string and check its length.
    const uuidStr = _getUuid(input)
    if (uuidStr === null) {
        return null
    }

    // Split the cleaned UUID string into 2-character chunks and convert each chunk to a decimal number.
    return uuidStr
        .match(chunk)
        .map(b => parseInt(b, 16))
}

export function bytesToUuid(bytes) {
    return uuidFormatter(
        bytes.map(b => b.toString(16).padStart(2, '0')).join('')
    )
}

/**
 * Converts a UUID string to a JSON string representation of an array of bytes.
 * Each byte is represented as a decimal number.
 *
 * @param {string} input - The UUID string to be converted.
 * @returns {string|null} - The JSON string representation of an array of bytes, or null if the input has an invalid length.
 */
export function uuidToBytesString(input) {
    // Convert the UUID string to an array of bytes.
    const bytes = uuidToBytes(input)
    
    // If the input has an invalid length, return null.
    if (bytes === null) {
        return null
    }

    // Convert the array of bytes to a JSON string.
    return JSON.stringify(bytes)
}
