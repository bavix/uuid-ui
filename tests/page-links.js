import assert from 'node:assert';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { PAGES } from '../scripts/pages/pages.data.mjs';
import { renderPage } from '../scripts/pages/render.mjs';
import { SITE_URL } from '../scripts/pages/site.mjs';

const titles = new Map(PAGES.map(page => [page.slug, page.h1]));
const groups = PAGES.find(page => page.slug === 'reference').index ?? [];
const order = ['reference', ...groups.flatMap(group => group.items.map(item => item.slug))];
const context = { hubTitle: titles.get('reference'), titleOf: slug => titles.get(slug), groups, order };

const slugs = new Set(PAGES.map(page => page.slug));
const publicDir = new URL('../public/', import.meta.url);

function rendered() {
    return PAGES.map(page => [page, renderPage(page, context)]);
}

function targets(html) {
    return [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
}

test('every link on a page resolves from that page, under any base path', async (t) => {
    for (const [page, html] of rendered()) {
        for (const target of targets(html)) {
            if (target.startsWith('#') || target.startsWith('https://') || target.startsWith('mailto:')) {
                continue;
            }

            assert.ok(target.startsWith('../'), `${page.slug}: "${target}" is not relative to the page`);

            const rest = target.slice(3).split('#')[0];

            if (rest === '') {
                continue;
            }

            if (rest.endsWith('/')) {
                const slug = rest.slice(0, -1);

                assert.ok(slugs.has(slug), `${page.slug}: "${target}" points at no page`);
                continue;
            }

            assert.ok(existsSync(new URL(rest, publicDir)), `${page.slug}: "${target}" is not a file in public/`);
        }
    }
});

test('nothing on a page is fetched from the site root', async (t) => {
    for (const [page, html] of rendered()) {
        assert.ok(!html.includes('="/'), `${page.slug} has a root-absolute link, which breaks under /uuid-ui/`);
        assert.ok(!html.includes('="./'), `${page.slug} has a link relative to the page's own directory`);
    }
});

test('a link that leaves the site opens away from it, safely', async (t) => {
    for (const [page, html] of rendered()) {
        const offsite = [...html.matchAll(/<a[^>]*href="(https:\/\/[^"]+)"[^>]*>/g)];

        assert.ok(offsite.length > 0, `${page.slug} cites nothing`);

        for (const [tag, href] of offsite) {
            if (href.startsWith(SITE_URL)) {
                continue;
            }

            assert.ok(tag.includes('target="_blank"'), `${page.slug}: ${href} takes the reader away from the page`);
            assert.ok(tag.includes('rel="noopener noreferrer"'), `${page.slug}: ${href} has no rel`);
        }
    }
});

test('every anchor a page links to exists on that page', async (t) => {
    for (const [page, html] of rendered()) {
        const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]));

        for (const target of targets(html)) {
            if (!target.startsWith('#')) {
                continue;
            }

            assert.ok(ids.has(target.slice(1)), `${page.slug}: "${target}" leads nowhere`);
        }
    }
});

test('every asset a page asks for is in public/', async (t) => {
    for (const file of ['android-chrome-192x192.png', 'favicon.ico', 'favicon-32x32.png', 'apple-touch-icon.png', 'og.png', 'docs.js', 'docs.css', 'theme.css']) {
        assert.ok(existsSync(new URL(file, publicDir)), `${file} is missing`);
    }
});
