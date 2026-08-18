'use strict';

import { stripComment } from './comment.js';

function depthOf(line) {
    const bare = stripComment(line);

    return (bare.match(/{/g) || []).length - (bare.match(/}/g) || []).length;
}

export function takeGroups(consumed, text, whole = false) {
    if (typeof text !== 'string') {
        return { groups: [], consumed: '' };
    }

    const base = typeof consumed === 'string' && consumed !== '' && text.startsWith(consumed) ? consumed : '';
    const fresh = text.slice(base.length);
    const before = base === '' ? 0 : base.split('\n').length - 1;
    const lines = fresh.split('\n');
    const ready = whole ? lines.length : lines.length - 1;
    const groups = [];
    let i = 0;
    let taken = 0;

    while (i < ready) {
        if (lines[i].trimStart().startsWith('{')) {
            const block = [];
            let depth = 0;
            let j = i;

            while (j < ready) {
                block.push(lines[j]);
                depth += depthOf(lines[j]);
                j += 1;

                if (depth <= 0) {
                    break;
                }
            }

            // An unclosed brace is a block still being typed: leave it, and
            // everything after it, for the next call.
            if (depth > 0) {
                break;
            }

            groups.push({ text: block.join('\n'), block: true, line: before + i + 1 });
            i = j;
        } else {
            const held = lines[i].trim();

            if (held !== '') {
                groups.push({ text: held, block: false, line: before + i + 1 });
            }

            i += 1;
        }

        taken = i;
    }

    const eaten = taken === 0 ? '' : lines.slice(0, taken).join('\n') + (taken < lines.length ? '\n' : '');

    return { groups, consumed: base + eaten };
}
