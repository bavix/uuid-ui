'use strict';

import { commentIndex, stripComment } from './comment.js';
import { normalizeInput } from './normalize-input.js';
import { unquote } from './quotes.js';

export const LINE_CEILING = 4000;
export const READ_CEILING = 400;

const cache = new Map();
const CACHE_CEILING = 4096;

function kindOf(bare) {
    const held = cache.get(bare);

    if (held !== undefined) {
        return held;
    }

    const kind = normalizeInput(unquote(bare)) === null ? 'bad' : 'ok';

    if (cache.size >= CACHE_CEILING) {
        cache.clear();
    }

    cache.set(bare, kind);

    return kind;
}

function depthOf(line) {
    let depth = 0;

    for (const ch of line) {
        if (ch === '{') {
            depth += 1;
        }

        if (ch === '}') {
            depth -= 1;
        }
    }

    return depth;
}

function partsOf(line) {
    const cut = commentIndex(line);

    return {
        code: cut === -1 ? line : line.slice(0, cut),
        note: cut === -1 ? '' : line.slice(cut),
    };
}

export function markLine(line, read = true) {
    const { code, note } = partsOf(line);
    const bare = code.trim();

    return { code, note, bad: read && bare !== '' && kindOf(bare) === 'bad' };
}

export function markText(text) {
    const rows = text.split('\n');

    if (rows.length > LINE_CEILING) {
        return null;
    }

    const read = rows.length <= READ_CEILING;
    const marks = rows.map(row => ({ ...partsOf(row), bad: false }));

    let at = 0;

    while (at < rows.length) {
        const bare = stripComment(rows[at]).trim();

        if (bare === '') {
            at += 1;
            continue;
        }

        if (!bare.startsWith('{')) {
            marks[at].bad = read && kindOf(bare) === 'bad';
            at += 1;
            continue;
        }

        let depth = 0;
        let end = at;

        while (end < rows.length) {
            depth += depthOf(stripComment(rows[end]));
            end += 1;

            if (depth <= 0) {
                break;
            }
        }

        if (depth > 0) {
            break;
        }

        const block = rows.slice(at, end).map(row => stripComment(row)).join('\n').trim();
        const bad = read && kindOf(block) === 'bad';

        for (let i = at; i < end; i += 1) {
            marks[i].bad = bad && stripComment(rows[i]).trim() !== '';
        }

        at = end;
    }

    return marks;
}

export function readable(rows) {
    const marks = markText(rows.join('\n'));

    if (marks === null) {
        return rows.length;
    }

    return marks.filter(mark => !mark.bad).length;
}
