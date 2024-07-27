'use strict';

/**
 * Formats a UUID string into the standard UUID format.
 *
 * @param {string} input - The UUID string to format.
 * @return {string} The formatted UUID string.
 */
export function uuidFormatter(input) {
    // Check if the input string has a length of 32, which is the length of a standard UUID.
    if (input.length === 32) {
        // Slice the input string into parts and join them with hyphens to form the formatted UUID.
        // The first 8 characters are the first part.
        // The next 4 characters are the second part.
        // The next 4 characters are the third part.
        // The next 4 characters are the fourth part.
        // The remaining 8 characters are the fifth part.
        return (
            input.slice(0, 8) + '-' + // First part
            input.slice(8, 12) + '-' + // Second part
            input.slice(12, 16) + '-' + // Third part
            input.slice(16, 20) + '-' + // Fourth part
            input.slice(20, 32) // Fifth part
        );
    }

    // If the input string is not a standard UUID, return it as is.
    return input;
}
