'use strict';

export const STYLE_PLAIN = 'plain';
export const STYLE_HEX = 'hex';
export const STYLE_BRACES = 'braces';
export const STYLE_URN = 'urn';

export function styleUuid(uuid, style = STYLE_PLAIN, upper = false) {
    if (typeof uuid !== 'string' || uuid === '') {
        return uuid;
    }

    const body = upper ? uuid.toUpperCase() : uuid.toLowerCase();

    if (style === STYLE_HEX) {
        return body.replace(/-/g, '');
    }

    if (style === STYLE_BRACES) {
        return `{${body}}`;
    }

    if (style === STYLE_URN) {
        return `urn:uuid:${body}`;
    }

    return body;
}
