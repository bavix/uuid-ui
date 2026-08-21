'use strict';

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePage } from './markdown.mjs';
import { generatedTable } from './tables.mjs';

const HUB = 'reference';
const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../../content');

function resolved(page) {
    return {
        ...page,
        body: (page.body ?? []).map(block => (block.type === 'generated'
            ? generatedTable(block.name, block.args)
            : block)),
    };
}

function read() {
    return readdirSync(dir)
        .filter(name => name.endsWith('.md'))
        .map(name => resolved(parsePage(readFileSync(join(dir, name), 'utf-8'), name.slice(0, -3))));
}

function ordered(pages) {
    const hub = pages.find(page => page.slug === HUB);

    if (hub === undefined) {
        throw new Error(`content/${HUB}.md is missing: it holds the order of the reference`);
    }

    const listed = (hub.index ?? []).flatMap(group => group.items.map(item => item.slug));
    const bySlug = new Map(pages.map(page => [page.slug, page]));
    const held = [hub];

    for (const slug of listed) {
        const page = bySlug.get(slug);

        if (page === undefined) {
            throw new Error(`${HUB}.md lists ${slug}, and content/${slug}.md does not exist`);
        }

        held.push(page);
    }

    for (const page of pages) {
        if (!held.includes(page)) {
            throw new Error(`content/${page.slug}.md is not listed on the hub, so nothing links to it`);
        }
    }

    return held;
}

export const PAGES = ordered(read());
