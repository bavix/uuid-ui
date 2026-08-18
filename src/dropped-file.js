'use strict';

import { HISTORY_LIMIT } from './limits.js';

export const MAX_BYTES = 512 * 1024;
export const MAX_LINES = HISTORY_LIMIT;

const NAMES = /\.(txt|csv|tsv|log|list|json|md|text)$/i;
const TEXTUAL = /^(text\/|application\/(json|csv|x-ndjson))/i;

export function fileIsText(file) {
    if (!file) {
        return false;
    }

    return TEXTUAL.test(file.type || '') || NAMES.test(file.name || '');
}

export function textOf(raw) {
    if (typeof raw !== 'string' || raw.trim() === '') {
        return { text: null, problem: 'That file has nothing in it.' };
    }

    if (raw.includes('\u0000')) {
        return { text: null, problem: 'That looks like a binary file, not a list.' };
    }

    const lines = raw.replace(/\r\n?/g, '\n').split('\n');
    const kept = lines.filter(line => line.trim() !== '');

    if (kept.length === 0) {
        return { text: null, problem: 'That file has nothing in it.' };
    }

    if (kept.length > MAX_LINES) {
        return {
            text: `${kept.slice(0, MAX_LINES).join('\n')}\n`,
            problem: null,
            dropped: kept.length - MAX_LINES,
        };
    }

    return { text: `${kept.join('\n')}\n`, problem: null, dropped: 0 };
}

export function sizeIsFine(file) {
    return !!file && file.size <= MAX_BYTES;
}
