'use strict';

/**
 * Merges a freshly converted batch into the existing history.
 *
 * History is a log of conversions, not a table of inputs: the same identifier
 * converted to two formats is two rows, and switching the result type with text
 * still in the box is a normal way to produce another one. Rows are therefore
 * keyed by the input/output pair — only an identical conversion collapses.
 *
 * Newest first, everywhere: the batch sits on top of the older history, and
 * inside the batch the last line converted is the topmost one.
 *
 * @param {Array<{toString: function}>} converted  items produced by this pass, newest first
 * @param {Array<{toString: function}>} existing   current history, newest first
 * @returns {Array}
 */
export function mergeItems(converted, existing) {
    const result = new Map();

    for (const item of converted) {
        if (item) {
            result.set(item.toString(), item);
        }
    }

    for (const item of existing) {
        if (!item || result.has(item.toString())) {
            continue;
        }

        result.set(item.toString(), item);
    }

    return [...result.values()];
}
