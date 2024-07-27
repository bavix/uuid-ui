'use strict';

import {bytesToUuid, uuidToBytes} from "./uuid-bytes.js";

/**
 * Converts a UUID string to an object with high and low unsigned 64-bit integers.
 *
 * @param {string} input - The UUID string to convert.
 * @return {Object} An object with high and low unsigned 64-bit integers as strings,
 *                  or null if input is invalid.
 */
export function uuidToInts(input) {
    // Convert the UUID string to an array of BigInts.
    const v = uuidToBytes(input).map(i => BigInt(i))
    // If the conversion failed, return null.
    if (v === null) {
        return null
    }

    // Combine the bytes into high and low unsigned 64-bit integers.
    const high = BigInt(v[0] | v[1] << BigInt(8) | v[2] << BigInt(16) | v[3] << BigInt(24) |
        v[4] << BigInt(32) | v[5] << BigInt(40) | v[6] << BigInt(48) | v[7] << BigInt(56))

    const low = BigInt(v[8] | v[9] << BigInt(8) | v[10] << BigInt(16) | v[11] << BigInt(24) |
        v[12] << BigInt(32) | v[13] << BigInt(40) | v[14] << BigInt(48) | v[15] << BigInt(56))

    // Return the high and low integers as strings.
    return {
        // Convert the high and low integers to strings.
        high: BigInt.asIntN(64, high) + "",
        low: BigInt.asIntN(64, low) + "",
    }
}

/**
 * Converts two unsigned 64-bit integers to a UUID string.
 *
 * @param {string} high - The high unsigned 64-bit integer as a string.
 * @param {string} low - The low unsigned 64-bit integer as a string.
 * @return {string} The UUID string.
 */
export function intsToUuid(high, low) {
    // Convert the high and low integers to an array of bytes.
    return bytesToUuid([
        // Extract the bytes from the high integer.
        BigInt(high) & BigInt(0xff),
        BigInt(high) >> BigInt(8) & BigInt(0xff),
        BigInt(high) >> BigInt(16) & BigInt(0xff),
        BigInt(high) >> BigInt(24) & BigInt(0xff),
        BigInt(high) >> BigInt(32) & BigInt(0xff),
        BigInt(high) >> BigInt(40) & BigInt(0xff),
        BigInt(high) >> BigInt(48) & BigInt(0xff),
        BigInt(high) >> BigInt(56) & BigInt(0xff),
        // Extract the bytes from the low integer.
        BigInt(low) & BigInt(0xff),
        BigInt(low) >> BigInt(8) & BigInt(0xff),
        BigInt(low) >> BigInt(16) & BigInt(0xff),
        BigInt(low) >> BigInt(24) & BigInt(0xff),
        BigInt(low) >> BigInt(32) & BigInt(0xff),
        BigInt(low) >> BigInt(40) & BigInt(0xff),
        BigInt(low) >> BigInt(48) & BigInt(0xff),
        BigInt(low) >> BigInt(56) & BigInt(0xff),
    ])
}

/**
 * Converts a UUID string to an object with high and low unsigned 64-bit integers.
 *
 * @param {string} input - The UUID string to convert.
 * @return {Object} An object with high and low unsigned 64-bit integers as strings,
 *                  or null if input is invalid.
 */
export function uuidToUints(input) {
    // Convert the UUID string to an array of BigInts.
    const v = uuidToBytes(input).map(i => BigInt(i))
    // If the conversion failed, return null.
    if (v === null) {
        return null
    }

    // Combine the bytes into high and low unsigned 64-bit integers.
    const high = BigInt(
        v[7] | v[6] << BigInt(8) | v[5] << BigInt(16) | v[4] << BigInt(24) |
        v[3] << BigInt(32) | v[2] << BigInt(40) | v[1] << BigInt(48) | v[0] << BigInt(56)
    )

    const low = BigInt(
        v[15] | v[14] << BigInt(8) | v[13] << BigInt(16) | v[12] << BigInt(24) |
        v[11] << BigInt(32) | v[10] << BigInt(40) | v[9] << BigInt(48) | v[8] << BigInt(56)
    )

    // Return the high and low integers as strings.
    return {
        // Convert the high and low integers to unsigned 64-bit integers and convert them to strings.
        high: BigInt.asUintN(64, high) + "",
        low: BigInt.asUintN(64, low) + "",
    }
}

/**
 * Converts two unsigned 64-bit integers to a UUID string.
 *
 * @param {string} high - The high unsigned 64-bit integer as a string.
 * @param {string} low - The low unsigned 64-bit integer as a string.
 * @return {string} The UUID string.
 */
export function uintsToUuid(high, low) {
    // Convert the high and low integers to an array of bytes.
    return bytesToUuid([
        // Extract the most significant byte from the high integer.
        BigInt(high) >> BigInt(56) & BigInt(0xff),
        // Extract the next 7 bytes from the high integer.
        BigInt(high) >> BigInt(48) & BigInt(0xff),
        BigInt(high) >> BigInt(40) & BigInt(0xff),
        BigInt(high) >> BigInt(32) & BigInt(0xff),
        BigInt(high) >> BigInt(24) & BigInt(0xff),
        BigInt(high) >> BigInt(16) & BigInt(0xff),
        BigInt(high) >> BigInt(8) & BigInt(0xff),
        BigInt(high) & BigInt(0xff),
        // Extract the most significant byte from the low integer.
        BigInt(low) >> BigInt(56) & BigInt(0xff),
        // Extract the next 7 bytes from the low integer.
        BigInt(low) >> BigInt(48) & BigInt(0xff),
        BigInt(low) >> BigInt(40) & BigInt(0xff),
        BigInt(low) >> BigInt(32) & BigInt(0xff),
        BigInt(low) >> BigInt(24) & BigInt(0xff),
        BigInt(low) >> BigInt(16) & BigInt(0xff),
        BigInt(low) >> BigInt(8) & BigInt(0xff),
        BigInt(low) & BigInt(0xff),
    ])
}
