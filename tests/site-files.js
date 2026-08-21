import assert from 'node:assert';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { PAGES } from '../scripts/pages/pages.data.mjs';
import { AI_AGENTS, renderFacts, renderLlms, renderLlmsFull, renderRobots, renderSitemap } from '../scripts/pages/derived.mjs';
import { SITE_URL, pageUrl } from '../scripts/pages/site.mjs';
import { fieldsFor } from '../src/rfc9562.js';
import { uuidTypeList } from '../src/type-detector.js';

test('the sitemap lists the tool and every page, absolute and with a slash', async (t) => {
    const xml = renderSitemap(PAGES);
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);

    assert.strictEqual(locs.length, PAGES.length + 1);
    assert.strictEqual(new Set(locs).size, locs.length);

    for (const loc of locs) {
        assert.ok(loc.startsWith(SITE_URL), loc);
        assert.ok(loc.endsWith('/'), loc);
    }

    for (const page of PAGES) {
        assert.ok(locs.includes(pageUrl(page.slug)), page.slug);
    }
});

test('robots points at the sitemap and shuts nobody out', async (t) => {
    const robots = renderRobots();

    assert.ok(robots.includes(`Sitemap: ${SITE_URL}sitemap.xml`));
    assert.ok(!robots.includes('Disallow: /'));

    for (const agent of AI_AGENTS) {
        assert.ok(robots.includes(`User-agent: ${agent}`), `${agent} is not named`);
    }
});

test('llms.txt maps the site once and hands out the link contract', async (t) => {
    const llms = renderLlms(PAGES);

    for (const page of PAGES) {
        const url = pageUrl(page.slug);

        assert.strictEqual(llms.split(url).length - 1, 1, `${page.slug} is listed more than once`);
        assert.ok(llms.includes(page.description), page.slug);
    }

    for (const slug of uuidTypeList().filter(Boolean)) {
        assert.ok(llms.includes(`\`${slug}\``), `${slug} is missing from the format list`);
    }

    assert.ok(llms.includes(`${SITE_URL}#to=`));
    assert.ok(llms.includes('&in=<signed|unsigned>'));
});

test('llms-full carries the text of every page', async (t) => {
    const full = renderLlmsFull(PAGES);

    for (const page of PAGES) {
        assert.ok(full.includes(page.h1), page.slug);
        assert.ok(full.includes(page.tldr), page.slug);
        assert.ok(full.includes(page.lede), page.slug);
    }
});

test('uuid-facts.json is valid and says what the code says', async (t) => {
    const facts = JSON.parse(renderFacts(PAGES));

    assert.strictEqual(facts.bits, 128);
    assert.strictEqual(facts.pages.length, PAGES.length);

    for (const version of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const fields = facts.versions[`v${version}`].fields;

        assert.deepStrictEqual(
            fields.map(field => [field.from, field.to, field.kind, field.name]),
            fieldsFor(version)
        );

        assert.strictEqual(fields.reduce((held, field) => held + field.bits, 0), 128);
    }
});

test('the tool page itself carries the tags a search engine reads', async (t) => {
    const html = readFileSync(new URL('../src/index.html', import.meta.url), 'utf-8');

    assert.ok(html.includes('<link rel="canonical" href="https://bavix.github.io/uuid-ui/">'));
    assert.ok(html.includes('<meta name="description"'));
    assert.ok(html.includes('property="og:image"'));
    assert.ok(html.includes('application/ld+json'));
    assert.ok(html.includes('__SITE_JSON_LD__'), 'the build fills this in');
    assert.strictEqual((html.match(/<h1[ >]/g) || []).length, 1);
    assert.ok(html.includes('href="./reference/"'), 'the tool does not link into the reference');
});

test('a production build regenerates the reference, not just the bundle', async (t) => {
    const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8')).scripts;

    assert.match(scripts.build, /build-pages\.mjs/, 'npm run build would ship a stale reference');
    assert.match(scripts.pages, /build-pages\.mjs/);
});

test('the dev server serves the reference instead of falling back to the tool', async (t) => {
    const config = readFileSync(new URL('../vite.config.js', import.meta.url), 'utf-8');

    assert.match(config, /name: 'serve-pages',\s*\n\s*apply: 'serve'/, 'npm run dev would answer every page with the tool');
    assert.match(config, /name: 'clean-assets',\s*\n\s*apply: 'build'/, 'npm run dev would delete the built assets');
});
