'use strict';

export const TAG_NAME_LIMIT = 32;

/** One space between words, nothing at the ends, and short enough to read on a
 *  chip. Returns an empty string for anything that is only whitespace. */
export function cleanTagName(raw) {
    if (typeof raw !== 'string') {
        return '';
    }

    return raw.replace(/\s+/g, ' ').trim().slice(0, TAG_NAME_LIMIT).trim();
}

function fold(name) {
    return cleanTagName(name).toLocaleLowerCase();
}

/** The tag already there that means the same name, or null. Case and spacing
 *  do not make a second tag: "Billing" and "billing" are one. */
export function findTag(names, raw) {
    const held = fold(raw);

    if (held === '') {
        return null;
    }

    return (names || []).find(name => fold(name) === held) ?? null;
}
