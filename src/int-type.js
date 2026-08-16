'use strict';

/**
 * How a high/low pair is read. Not a matter of sign but of byte order: the same
 * pair yields two different identifiers, so this choice is part of the meaning
 * of every high/low value the app shows.
 */
export const SIGNED = 2 ** 0;
export const UNSIGNED = 2 ** 1;

export const INT_TYPE_NAMES = {
    [SIGNED]: 'signed',
    [UNSIGNED]: 'unsigned',
};

export function intTypeList() {
    const list = [];
    list[SIGNED] = INT_TYPE_NAMES[SIGNED];
    list[UNSIGNED] = INT_TYPE_NAMES[UNSIGNED];
    return list;
}
