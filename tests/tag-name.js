import assert from 'node:assert';
import test from 'node:test';
import { TAG_NAME_LIMIT, cleanTagName, findTag } from '../src/tag-name.js';

test('a name loses its edges and its double spaces', async (t) => {
    assert.strictEqual(cleanTagName('  billing  '), 'billing');
    assert.strictEqual(cleanTagName('two   words'), 'two words');
    assert.strictEqual(cleanTagName('\tinvoice\n'), 'invoice');
});

test('a name that is only whitespace is no name at all', async (t) => {
    assert.strictEqual(cleanTagName('   '), '');
    assert.strictEqual(cleanTagName(''), '');
    assert.strictEqual(cleanTagName(null), '');
    assert.strictEqual(cleanTagName(7), '');
});

test('a long name is cut to something a chip can hold', async (t) => {
    const held = cleanTagName('x'.repeat(100));

    assert.strictEqual(held.length, TAG_NAME_LIMIT);
    assert.strictEqual(cleanTagName(`${'y'.repeat(TAG_NAME_LIMIT - 1)}   tail`).length, TAG_NAME_LIMIT - 1);
});

test('emoji and other letters survive', async (t) => {
    assert.strictEqual(cleanTagName(' 🔥 hot '), '🔥 hot');
    assert.strictEqual(cleanTagName(' счета '), 'счета');
});

test('the same name in another case is the same tag', async (t) => {
    const names = ['billing', '🔥 hot', 'Счета'];

    assert.strictEqual(findTag(names, 'Billing'), 'billing');
    assert.strictEqual(findTag(names, '  BILLING '), 'billing');
    assert.strictEqual(findTag(names, 'счета'), 'Счета');
    assert.strictEqual(findTag(names, 'invoices'), null);
    assert.strictEqual(findTag(names, '   '), null);
    assert.strictEqual(findTag(null, 'billing'), null);
});
