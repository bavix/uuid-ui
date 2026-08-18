'use strict';

const QUOTES = ['"', "'", '`'];

export function unquote(value) {
    if (typeof value !== 'string') {
        return value;
    }

    let held = value.trim().replace(/,+$/, '').trim();

    while (held.length > 1 && QUOTES.includes(held[0]) && held[held.length - 1] === held[0]) {
        held = held.slice(1, -1).trim();
    }

    return held;
}
