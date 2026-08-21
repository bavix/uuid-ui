import assert from 'node:assert';
import test from 'node:test';
import { PAGES } from '../scripts/pages/pages.data.mjs';
import { parseIntType, parseTarget } from '../src/url-state.js';
import { parsePage } from '../scripts/pages/markdown.mjs';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

test('every page carries what a search result needs', async (t) => {
    for (const page of PAGES) {
        assert.match(page.slug, SLUG, `${page.slug} is not a kebab-case slug`);
        assert.ok(page.title.length >= 20 && page.title.length <= 70, `${page.slug} title is ${page.title.length} chars`);
        assert.ok(
            page.description.length >= 110 && page.description.length <= 200,
            `${page.slug} description is ${page.description.length} chars`
        );
        assert.ok(page.h1.length > 0, `${page.slug} has no h1`);
        assert.ok(page.tldr.length > 0, `${page.slug} has no tldr`);
        assert.ok(page.lede.length > 0, `${page.slug} has no lede`);
        assert.match(page.updated, DAY, `${page.slug} has no ISO date`);
        assert.ok(Array.isArray(page.body) && page.body.length > 0, `${page.slug} has no body`);
    }
});

test('every page is reachable from the hub, exactly once', async (t) => {
    const hub = PAGES.find(page => page.slug === 'reference');
    const listed = (hub.index ?? []).flatMap(group => group.items.map(item => item.slug));

    assert.strictEqual(new Set(listed).size, listed.length, 'a page is listed twice on the hub');

    for (const page of PAGES) {
        if (page.slug === 'reference') {
            continue;
        }

        assert.ok(listed.includes(page.slug), `${page.slug} is an orphan: nothing on the hub links to it`);
    }
});

test('slugs are unique and every related link resolves', async (t) => {
    const slugs = PAGES.map(page => page.slug);

    assert.strictEqual(new Set(slugs).size, slugs.length);

    for (const page of PAGES) {
        assert.ok((page.related ?? []).length >= 2, `${page.slug} has fewer than two related pages`);

        for (const slug of page.related ?? []) {
            assert.ok(slugs.includes(slug), `${page.slug} links to missing ${slug}`);
            assert.notStrictEqual(slug, page.slug, `${page.slug} links to itself`);
        }

        for (const group of page.index ?? []) {
            for (const item of group.items) {
                assert.ok(slugs.includes(item.slug), `${page.slug} indexes missing ${item.slug}`);
            }
        }
    }
});

test('every call to action opens a format the tool actually has', async (t) => {
    for (const page of PAGES) {
        for (const cta of [page.cta, page.example?.cta].filter(Boolean)) {
            assert.notStrictEqual(parseTarget(`#to=${cta.to}`), null, `${page.slug}: ${cta.to}`);

            if (cta.int !== undefined) {
                assert.notStrictEqual(parseIntType(`#in=${cta.int}`), null, `${page.slug}: ${cta.int}`);
            }
        }
    }
});

test('a page points at a section of the RFC, not just at the RFC', async (t) => {
    for (const page of PAGES) {
        const refs = page.body.filter(block => block.type === 'rfc' && block.section !== undefined);

        assert.ok(refs.length >= 1, `${page.slug} cites no section of any RFC`);
    }
});

test('a page that answers questions answers at least two', async (t) => {
    for (const page of PAGES) {
        assert.notStrictEqual(page.faq, undefined, `${page.slug} answers nothing: a swallowed block eats the questions`);
        assert.ok(page.faq.length >= 2, `${page.slug} has a single question`);

        for (const entry of page.faq) {
            assert.ok(entry.q.length > 0 && entry.a.length > 0, `${page.slug} has an empty entry`);
        }
    }
});

test('a page carries enough of its own text to stand alone', async (t) => {
    for (const page of PAGES) {
        const words = JSON.stringify(page).split(/\s+/).length;

        assert.ok(words >= 250, `${page.slug} is thin: ${words} words`);
    }
});

test('a block left open is a build error, not a silently eaten page', async (t) => {
    const text = [
        '---',
        'title: t',
        'description: d',
        'h1: h',
        'tldr: s',
        'lede: l',
        'related: uuid-v7',
        'priority: 0.5',
        'updated: 2026-08-21',
        '---',
        '',
        '::links',
        '- https://example.com | Example | note',
        '',
        '::faq',
        'Q: q',
        'A: a',
        '::',
        '',
    ].join('\n');

    assert.throws(() => parsePage(text, 'open-block'), /never closed/);
});
