'use strict';

import JSON5 from 'json5';

/**
 * Parses a string representation of an object into a JavaScript object.
 * 
 * @param {string} val - The string representation of the object.
 * @returns {Object} - The parsed object.
 */
export function objectParse(val) {
    const hlrg = /^(-?\d+)[;:,](-?\d+)$/
    const trg = /["']?(-?\d+)["']?/g

    // If the string starts with '[', it is a JSON array and needs to be parsed.
    if (val[0] === '[') {
        // Replace all occurrences of numbers with the same number without quotes.
        return JSON5.parse(val.replace(trg, '$1'))
    }

    // If the string matches the regular expression for a high-low pair, split it into an array.
    if (val.match(hlrg)) {
        // Replace the high-low pair with the same numbers separated by semicolons.
        const split = val.replace(hlrg, '$1;$2').split(';')

        // Return an object with the high and low properties.
        return {
            high: split[0].toString(),
            low: split[1].toString()
        }
    }

    // Parse the string representation of the object.
    const obj = JSON5.parse(val.replace(trg, '"$1"'))

    // Return an object with the high and low properties.
    return {
        high: obj.high,
        low: obj.low
    }
}
