'use strict';

import {base64StdToUuid} from "./base64.js";
import {objectParse} from "./object-parser.js";
import {isValid as isValidUlid} from './uuid-ulid.js';

/**
 * Represents the type of UUID.
 *
 * @type {number}
 */
export const TYPE_UUID = 2 ** 0; // 0b0001

/**
 * Represents the type of UUID represented as high-low pairs.
 *
 * @type {number}
 */
export const TYPE_HIGH_LOW = 2 ** 1; // 0b0010

/**
 * Represents the type of UUID represented in base64 string.
 *
 * @type {number}
 */
export const TYPE_BASE64 = 2 ** 2; // 0b0100

/**
 * Represents the type of UUID represented as bytes string.
 *
 * @type {number}
 */
export const TYPE_BYTES = 2 ** 3; // 0b1000

/**
 * Represents the type of UUID represented as ULID.
 * 
 * @type {number}
 */
export const TYPE_ULID = 2 ** 4;

/**
 * Represents the length of a UUID string.
 *
 * A UUID is a 128-bit value represented as a 36-character string.
 * Each character in the string represents a hexadecimal digit.
 *
 * @type {number}
 */
const UUID_LENGTH = 36; // 36 characters in a UUID string

/**
 * Returns a list of UUID types and their corresponding names.
 *
 * @return {Object} An object with UUID types as keys and their corresponding names as values.
 */
export function uuidTypeList() {
    // Initialize an empty array to store the UUID types and their names.
    const list = []

    // Add each UUID type and its corresponding name to the list.
    list[TYPE_UUID] = 'uuid' // UUID type
    list[TYPE_BASE64] = 'base64' // Base64 type
    list[TYPE_HIGH_LOW] = 'high-low' // High-low type
    list[TYPE_BYTES] = 'bytes' // Bytes type
    list[TYPE_ULID] = 'ulid'

    // Return the list of UUID types and their names.
    return list
}

/**
 * Detects the type of the given input.
 *
 * The function attempts to parse the input as a JSON array (bytes-type) or
 * JSON object (high-low-type). If parsing succeeds, it returns the bytes-type
 * or high-low-type accordingly.
 *
 * If parsing fails, the function checks if the input can be parsed as a valid
 * base64-type UUID. If it can, the function returns the base64-type.
 *
 * If parsing fails for both bytes-type and base64-type, the function returns
 * the default UUID type.
 *
 * @param {string} input - The input to be parsed and detected.
 * @return {number} The type of the input.
 */
export function typeDetector(input) {
    // Attempt to parse the input as a JSON array (bytes-type) or JSON object
    // (high-low-type).
    try {
        // If the input can be parsed as a JSON array, return the bytes-type.
        return Array.isArray(objectParse(input))
            ? TYPE_BYTES
            // If the input can be parsed as a JSON object, return the high-low-type.
            : TYPE_HIGH_LOW;
    } catch (e) {
        // Do nothing if parsing fails.
    }

    // Attempt to parse the input as a valid base64-type UUID.
    try {
        // If the input can be parsed as a valid base64-type UUID with the correct
        // length, return the base64-type.
        if (base64StdToUuid(input).length === UUID_LENGTH) {
            return TYPE_BASE64;
        }
    } catch (e) {
        // Do nothing if parsing fails.
    }

    // Check if the input can be parsed as a valid ULID.
    if (isValidUlid(input.trim())) {
        return TYPE_ULID;
    }

    // If parsing fails for both bytes-type and base64-type, return the default
    // UUID type.
    return TYPE_UUID;
}
