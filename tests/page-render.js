import assert from 'node:assert';
import test from 'node:test';
import { PAGES } from '../scripts/pages/pages.data.mjs';
import { MARK, render404, renderPage } from '../scripts/pages/render.mjs';
import { renderBlocks } from '../scripts/pages/blocks.mjs';
import { fieldsFor } from '../src/rfc9562.js';
import { pageUrl } from '../scripts/pages/site.mjs';

const titles = new Map(PAGES.map(page => [page.slug, page.h1]));
const context = { hubTitle: titles.get('reference'), titleOf: slug => titles.get(slug) };

function rendered() {
    return PAGES.map(page => [page, renderPage(page, context)]);
}

test('a generated page is marked as generated', async (t) => {
    for (const [page, html] of rendered()) {
        assert.ok(html.startsWith(`<!DOCTYPE html>\n${MARK}`), `${page.slug} carries no marker`);
    }
});

test('a page has exactly one h1 and its own canonical', async (t) => {
    for (const [page, html] of rendered()) {
        assert.strictEqual((html.match(/<h1[ >]/g) || []).length, 1, `${page.slug}`);
        assert.ok(html.includes(`<link rel="canonical" href="${pageUrl(page.slug)}">`), `${page.slug}`);
    }
});

test('nothing on a page resolves against the site root', async (t) => {
    for (const [page, html] of rendered()) {
        assert.ok(!html.includes('="./'), `${page.slug} has a link that breaks one level down`);
        assert.ok(!html.includes('="/'), `${page.slug} has a root-absolute link`);
    }
});

test('the structured data parses and matches the visible text', async (t) => {
    for (const [page, html] of rendered()) {
        const raw = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
        const graph = JSON.parse(raw)['@graph'];

        assert.ok(graph.length >= 3, `${page.slug}`);

        const faq = graph.find(node => node['@type'] === 'FAQPage');

        if (page.faq === undefined) {
            assert.strictEqual(faq, undefined, `${page.slug} claims questions it does not show`);
            continue;
        }

        for (const entry of faq.mainEntity) {
            assert.ok(html.includes(`<h3>${entry.name}</h3>`), `${page.slug} hides "${entry.name}"`);
            assert.ok(html.includes(entry.acceptedAnswer.text), `${page.slug} hides the answer to "${entry.name}"`);
        }
    }
});

test('a block cannot inject markup', async (t) => {
    const page = {
        ...PAGES[0],
        body: [{ type: 'p', text: '<script>alert(1)</script> tea & coffee' }, { type: 'rfc', doc: 9562, section: '4.1' }],
    };
    const html = renderPage(page, context);

    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt; tea &amp; coffee'));
    assert.ok(!html.includes('<script>alert(1)'));
});

test('a link to a page that does not exist stops the build', async (t) => {
    assert.throws(
        () => renderPage({ ...PAGES[0], related: ['nowhere'] }, context),
        /nowhere/
    );
});

test('every RFC reference names a section', async (t) => {
    for (const [page, html] of rendered()) {
        const refs = html.match(/href="(https:\/\/www\.rfc-editor\.org[^"]+)"/g) ?? [];

        assert.ok(refs.length >= 1, `${page.slug}`);
        assert.ok(refs.some(ref => ref.includes('#section-')), `${page.slug} links no section`);
    }
});

test('the 404 page stands on its own', async (t) => {
    const html = render404();

    assert.ok(html.includes('<meta name="robots" content="noindex">'));
    assert.ok(!html.includes('href="../'), 'a relative link on 404 breaks under GitHub Pages');
    assert.ok(!html.includes('docs.css'));
    assert.ok(html.includes('https://'));
});

test('a specimen is drawn from the layout the app uses', async (t) => {
    const samples = {
        1: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
        4: '0c5b2444-70a0-4932-980c-b4dc0d3f02b5',
        7: '01890a5d-ac96-774b-bcce-b302099a8057',
    };

    for (const [version, uuid] of Object.entries(samples)) {
        const html = renderBlocks([{ type: 'specimen', uuid }]);

        assert.strictEqual((html.match(/class="report-char /g) || []).length, 32, `v${version} characters`);
        assert.strictEqual((html.match(/class="report-bit /g) || []).length, 128, `v${version} bits`);
        assert.strictEqual((html.match(/class="report-run /g) || []).length, fieldsFor(Number(version)).length, `v${version} runs`);
        assert.ok(html.includes(`a version ${version} identifier`), `v${version} label`);

        const grown = [...html.matchAll(/flex-grow:(\d+)/g)].reduce((held, match) => held + Number(match[1]), 0);

        assert.strictEqual(grown, 128, `v${version} covers ${grown} bits`);
    }
});

test('an identifier with no version says so instead of inventing fields', async (t) => {
    const html = renderBlocks([{ type: 'specimen', uuid: '00000000-0000-0000-0000-000000000000' }]);

    assert.ok(html.includes('carries no version'));
    assert.ok(html.includes('no fields'));
});

test('every section can be linked to on its own', async (t) => {
    for (const [page, html] of rendered()) {
        const ids = [...html.matchAll(/<h2 id="([^"]+)"/g)].map(match => match[1]);
        const anchors = [...html.matchAll(/class="doc-anchor" href="#([^"]+)"/g)].map(match => match[1]);

        assert.ok(ids.length > 0, `${page.slug} has no sections`);
        assert.deepStrictEqual(anchors, ids, `${page.slug} has a section without an anchor`);
        assert.strictEqual(new Set(ids).size, ids.length, `${page.slug} repeats a section id`);
    }
});

test('a computed value can be copied', async (t) => {
    for (const [page, html] of rendered()) {
        if (page.example === undefined) {
            continue;
        }

        const values = (html.match(/class="doc-case-out"/g) || []).length;
        const buttons = (html.match(/class="doc-copy"/g) || []).length;

        assert.strictEqual(values, page.example.cases.length, `${page.slug}`);
        assert.ok(buttons >= values, `${page.slug} has a value with no copy button`);
    }
});

test('a page carries its playground and still reads without one', async (t) => {
    for (const [page, html] of rendered()) {
        const custom = (page.body ?? []).some(block => block.type === 'widget');

        if (custom) {
            assert.ok(html.includes('data-widget="'), `${page.slug} names a widget it does not render`);
            assert.ok(!html.includes('data-play'), `${page.slug} shows two playgrounds`);
            assert.ok(html.includes('src="../docs.js"'), `${page.slug} never loads the runtime`);
            continue;
        }

        if (page.cta === null || page.cta === undefined) {
            assert.ok(!html.includes('class="doc-play"'), `${page.slug} has a playground with no format`);
            continue;
        }

        assert.ok(html.includes('<section class="doc-play" data-play'), `${page.slug} has no playground`);
        assert.ok(html.includes('hidden>'), `${page.slug} shows an empty playground when the script does not load`);
        assert.ok(html.includes('src="../docs.js"'), `${page.slug} never loads the runtime`);

        const withoutPlay = html.replace(/<section class="doc-play"[\s\S]*?<\/section>/, '');

        assert.ok(withoutPlay.includes('doc-try'), `${page.slug} loses its worked example without the script`);
    }
});

test('every table cell names its column, so a phone can stack the row', async (t) => {
    for (const page of PAGES) {
        for (const block of page.body) {
            if (block.type !== 'table') {
                continue;
            }

            const html = renderBlocks([block], context);
            const cells = html.match(/<td[^>]*>/g) ?? [];
            const named = block.head.filter(cell => cell.trim() !== '').length;

            assert.ok(cells.length > 0, `${page.slug} renders a table with no cells`);

            for (const row of block.rows) {
                assert.strictEqual(row.length, block.head.length, `${page.slug} has a row of another width`);
            }

            const labelled = cells.filter(cell => cell.includes('data-th=')).length;

            assert.strictEqual(labelled, named * block.rows.length, `${page.slug} leaves cells without their column name`);
        }
    }
});
