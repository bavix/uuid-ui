'use strict';

/** The generator types that carry a clock, and can therefore be aimed at one. */
export const TIMED_TYPES = ['v1', 'v6', 'v7', 'ulid'];

export function isNamed(type) {
    return type === 'v3' || type === 'v5';
}

export function isTimed(type) {
    return TIMED_TYPES.includes(type);
}

/**
 * Options for the uuid generators from the value of a datetime-local field.
 * An empty or unparsable field means now, which is what the generators do when
 * given nothing — so the caller never needs a branch.
 *
 * The field has no timezone, so the browser reads it as local time; that is
 * what someone typing "2024-05-03 01:09" into it means.
 */
export function momentOptions(value) {
    if (typeof value !== 'string' || value.trim() === '') {
        return {};
    }

    const msecs = Date.parse(value);

    return Number.isFinite(msecs) ? { msecs } : {};
}

/** The current local time in the format a datetime-local field accepts. */
export function toFieldValue(date) {
    const pad = (n, width = 2) => String(n).padStart(width, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
        `.${pad(date.getMilliseconds(), 3)}`;
}
