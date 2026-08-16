'use strict';

/**
 * Index at which an inline comment starts, or -1.
 *
 * `#` never appears in any format this app accepts, so it always opens a
 * comment. `//` does: standard base64 uses '/' as a payload character, and
 * roughly one UUID in 250 encodes to something like "CIRUS//hTd6wGG4veI3QBg==".
 * So `//` only opens a comment at the start of a line or after whitespace.
 */
export function commentIndex(line) {
    if (typeof line !== 'string') {
        return -1;
    }

    const hash = line.indexOf('#');

    let slash = -1;
    for (let i = line.indexOf('//'); i !== -1; i = line.indexOf('//', i + 1)) {
        if (i === 0 || /\s/.test(line[i - 1])) {
            slash = i;
            break;
        }
    }

    if (hash === -1) {
        return slash;
    }

    if (slash === -1) {
        return hash;
    }

    return Math.min(hash, slash);
}

export function stripComment(line) {
    const index = commentIndex(line);

    return index === -1 ? line : line.slice(0, index);
}

export function extractComment(line) {
    const index = commentIndex(line);
    if (index === -1) {
        return null;
    }

    return line.slice(index + (line[index] === '#' ? 1 : 2)).trim();
}
