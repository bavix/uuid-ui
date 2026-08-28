import assert from 'node:assert';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { PAGES } from '../scripts/pages/pages.data.mjs';
import { render404, renderPage } from '../scripts/pages/render.mjs';
import { analyticsScripts } from '../scripts/pages/analytics.mjs';
import { GA_ID, METRIKA_ID } from '../src/analytics-ids.js';

const titles = new Map(PAGES.map(page => [page.slug, page.h1]));
const context = { hubTitle: titles.get('reference'), titleOf: slug => titles.get(slug) };

function carriesBothCounters(html, where) {
    assert.ok(html.includes('https://mc.yandex.ru/metrika/tag.js'), `${where}: no metrika loader`);
    assert.ok(html.includes(`ym(${METRIKA_ID},'init'`), `${where}: metrika is never initialised`);
    assert.ok(html.includes(`gtag/js?id=${GA_ID}`), `${where}: no gtag`);
    assert.ok(html.includes('<link rel="preconnect" href="https://mc.yandex.ru">'), `${where}: no metrika preconnect`);
    assert.ok(html.includes('<link rel="preconnect" href="https://www.googletagmanager.com">'), `${where}: no gtag preconnect`);
}

test('every generated page counts its visitors', async (t) => {
    for (const page of PAGES) {
        carriesBothCounters(renderPage(page, context), page.slug);
    }
});

test('the page nobody meant to land on counts too', async (t) => {
    carriesBothCounters(render404(), '404');
});

test('the counters load after the page, never in front of it', async (t) => {
    const html = renderPage(PAGES[0], context);
    const counter = html.indexOf('mc.yandex.ru/metrika/tag.js');

    assert.ok(counter > html.indexOf('</main>'), 'the counter sits above the content');
    assert.ok(counter < html.indexOf('</body>'), 'the counter is outside the body');
});

test('a page served from a laptop is not a visit', async (t) => {
    const snippet = analyticsScripts();

    assert.ok(snippet.includes("h==='localhost'"), 'localhost still reports');
    assert.ok(snippet.includes("h==='127.0.0.1'"), '127.0.0.1 still reports');
});

test('the tool page leaves the counters to the build', async (t) => {
    const html = readFileSync(new URL('../src/index.html', import.meta.url), 'utf-8');

    assert.ok(html.includes('__ANALYTICS_PRECONNECT__'), 'the build fills this in');
    assert.ok(html.includes('__ANALYTICS__'), 'the build fills this in');
    assert.ok(!html.includes(String(METRIKA_ID)), 'the counter id is written twice');
    assert.ok(!html.includes(GA_ID), 'the measurement id is written twice');
});
