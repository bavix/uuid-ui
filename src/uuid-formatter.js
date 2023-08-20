'use strict';

export function uuidFormatter(input) {
    if (input.length === 32) {
        return input.slice(0, 8)
            + '-' + input.slice(8, 12)
            + '-' + input.slice(12, 16)
            + '-' + input.slice(16, 20)
            + '-' + input.slice(20, 32)
    }

    return input
}
