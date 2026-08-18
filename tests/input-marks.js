import assert from 'node:assert';
import test from 'node:test';
import { LINE_CEILING, markText, readable } from '../src/input-marks.js';

const kinds = text => markText(text).map(mark => (mark.bad ? 'bad' : (mark.note !== '' ? 'note' : 'ok')));

test('a value is left alone and a comment is named', async (t) => {
    assert.deepStrictEqual(
        kinds('71a46cec-4809-4cc5-9689-5b0441b46186 // billing\n# a note\n01ARZ3NDEKTSV4RRFFQ69G5FAV'),
        ['note', 'note', 'ok'],
    );
});

test('a line nothing can read is marked, an empty one is not', async (t) => {
    assert.deepStrictEqual(kinds('nope\n\n01ARZ3NDEKTSV4RRFFQ69G5FAV'), ['bad', 'ok', 'ok']);
});

test('a block is judged whole, not line by line', async (t) => {
    const good = markText('{\n  "high": -4229995741198900111,\n  "low": -8763525208547292778\n}');

    assert.deepStrictEqual(good.map(mark => mark.bad), [false, false, false, false]);

    const bad = markText('{\n  "high": "nonsense"\n}');

    assert.deepStrictEqual(bad.map(mark => mark.bad), [true, true, true]);
});

test('a block still being typed is not called wrong', async (t) => {
    const held = markText('{\n  "high": -4229995741198900111,');

    assert.deepStrictEqual(held.map(mark => mark.bad), [false, false]);
});

test('a comment inside a block belongs to the comment, not to the value', async (t) => {
    const held = markText('{ // a note inside\n  "high": -4229995741198900111,\n  "low": -8763525208547292778\n}');

    assert.strictEqual(held[0].note, '// a note inside');
    assert.deepStrictEqual(held.map(mark => mark.bad), [false, false, false, false]);
});

test('counting what can be read agrees with what is marked', async (t) => {
    assert.strictEqual(readable(['nope', '# note', '01ARZ3NDEKTSV4RRFFQ69G5FAV']), 2);
});

test('past the ceiling nothing is marked at all', async (t) => {
    const many = Array.from({ length: LINE_CEILING + 1 }, () => 'nope').join('\n');

    assert.strictEqual(markText(many), null);
});
