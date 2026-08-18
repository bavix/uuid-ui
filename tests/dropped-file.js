import assert from 'node:assert';
import test from 'node:test';
import { MAX_LINES, fileIsText, sizeIsFine, textOf } from '../src/dropped-file.js';

test('a list arrives as text, whatever the system calls it', async (t) => {
    assert.ok(fileIsText({ name: 'ids.txt', type: '' }));
    assert.ok(fileIsText({ name: 'export', type: 'text/plain' }));
    assert.ok(fileIsText({ name: 'rows.csv', type: 'application/csv' }));
    assert.ok(!fileIsText({ name: 'photo.png', type: 'image/png' }));
    assert.ok(!fileIsText(null));
});

test('a file bigger than the ceiling is refused before it is read', async (t) => {
    assert.ok(sizeIsFine({ size: 1024 }));
    assert.ok(!sizeIsFine({ size: 900 * 1024 }));
});

test('what comes out is lines, and nothing else', async (t) => {
    assert.deepStrictEqual(textOf('a\r\nb\r\n\r\nc'), { text: 'a\nb\nc\n', problem: null, dropped: 0 });
    assert.strictEqual(textOf('   ').text, null);
    assert.match(textOf('   ').problem, /nothing in it/);
});

test('a binary file is caught by the bytes text never has', async (t) => {
    const held = textOf('PNG\u0000\u0000IHDR');

    assert.strictEqual(held.text, null);
    assert.match(held.problem, /binary/);
});

test('a file longer than the history is cut, and says so', async (t) => {
    const many = Array.from({ length: MAX_LINES + 5 }, (item, at) => `line-${at}`).join('\n');
    const held = textOf(many);

    assert.strictEqual(held.dropped, 5);
    assert.strictEqual(held.text.split('\n').filter(Boolean).length, MAX_LINES);
});
