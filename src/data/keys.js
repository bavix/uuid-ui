'use strict';

export function itemKey(row) {
    return `${row.input}:${row.output}`;
}

export function favoriteKey(tag, row) {
    return `${tag} ${itemKey(row)}`;
}
