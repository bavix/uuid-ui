import assert from 'node:assert';
import test from 'node:test';
import { DOC_HUB, DOC_PAGES, docFor, docHref } from '../src/doc-links.js';
import { PAGES } from '../scripts/pages/pages.data.mjs';
import { uuidTypeList } from '../src/type-detector.js';

const slugs = PAGES.map(page => page.slug);

test('every link out of the tool lands on a page that exists', async (t) => {
    for (const [type, doc] of Object.entries(DOC_PAGES)) {
        assert.ok(slugs.includes(doc.slug), `${type} points at missing ${doc.slug}`);
        assert.strictEqual(docHref(doc.slug), `./${doc.slug}/`);
    }

    assert.ok(slugs.includes(DOC_HUB));
});

test('every format the tool offers has somewhere to read about it', async (t) => {
    uuidTypeList().forEach((name, type) => {
        const doc = docFor(type);

        assert.ok(slugs.includes(doc.slug), `${name} has no reference page`);
        assert.ok(doc.label.length > 0, `${name} has no label`);
    });
});
