'use strict';

/**
 * Narrows rows to those mentioning the query, on either side or in the comment:
 * whichever form of an identifier someone remembers is the one they will type.
 *
 * An empty or blank query returns the rows untouched, so callers do not need a
 * branch for "no search".
 */
export function searchItems(rows, query) {
    if (!Array.isArray(rows)) {
        return [];
    }

    const needle = typeof query === 'string' ? query.trim().toLowerCase() : '';

    if (needle === '') {
        return rows;
    }

    return rows.filter(row => row && [row.input, row.output, row.info]
        .some(value => typeof value === 'string' && value.toLowerCase().includes(needle)));
}
