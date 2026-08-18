'use strict';

import { SIGNED } from './int-type.js';
import { toUuid } from './to-uuid.js';
import { formsOf } from './identifier-forms.js';

/**
 * Narrows rows to those mentioning the query on either side or in the comment.
 * A query that is itself an identifier also matches every spelling of it, so a
 * row written as bytes is found by pasting the uuid.
 */
export function searchItems(rows, query) {
    if (!Array.isArray(rows)) {
        return [];
    }

    const raw = typeof query === 'string' ? query.trim() : '';
    const needle = raw.toLowerCase();

    if (needle === '') {
        return rows;
    }

    const uuid = toUuid(raw, SIGNED);
    const needles = uuid === null ? [needle] : [needle, ...formsOf(uuid)];

    return rows.filter(row => row && [row.input, row.output, row.info]
        .some(value => typeof value === 'string' && needles.some(part => value.toLowerCase().includes(part))));
}
