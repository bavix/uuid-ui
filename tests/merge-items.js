import assert from 'node:assert';
import test from 'node:test';
import {mergeItems} from "../src/merge-items.js";

const item = (input, output) => ({input, output, toString: () => `${input}:${output}`});
const inputs = list => list.map(i => i.input);

test('the batch is laid down newest first', (t) => {
    // The caller hands the batch over already newest-first; merge keeps it that
    // way, so the newest conversion is always the top row.
    const batch = [item('c', '3'), item('b', '2'), item('a', '1')];

    assert.deepStrictEqual(inputs(mergeItems(batch, [])), ['c', 'b', 'a']);
});

test('the batch sits on top of older history', (t) => {
    const batch = [item('new', '1')];
    const existing = [item('old', '2'), item('older', '3')];

    assert.deepStrictEqual(inputs(mergeItems(batch, existing)), ['new', 'old', 'older']);
});

test('converting one input to a second format adds a row, it does not replace', (t) => {
    // History is a log of conversions: switching the result type with text still
    // in the box is how you get the same identifier in two formats at once.
    const existing = [item('a', 'a-highlow'), item('b', 'b-highlow')];
    const merged = mergeItems([item('a', 'a-base64')], existing);

    assert.deepStrictEqual(merged.map(i => i.output), ['a-base64', 'a-highlow', 'b-highlow']);
});

test('an identical conversion does not pile up', (t) => {
    const existing = [item('a', 'a-highlow')];
    const merged = mergeItems([item('a', 'a-highlow')], existing);

    assert.strictEqual(merged.length, 1);
});

test('a batch that produced nothing leaves history untouched', (t) => {
    const existing = [item('a', 'a-highlow'), item('b', 'b-highlow')];

    assert.deepStrictEqual(inputs(mergeItems([], existing)), ['a', 'b']);
});

test('untouched history survives a batch', (t) => {
    const existing = [item('x', '1')];

    assert.deepStrictEqual(inputs(mergeItems([item('y', '2')], existing)), ['y', 'x']);
});

test('a duplicated line in one batch yields one row', (t) => {
    const merged = mergeItems([item('a', 'first'), item('a', 'first')], []);

    assert.strictEqual(merged.length, 1);
});

test('malformed entries are ignored rather than thrown on', (t) => {
    const merged = mergeItems([null, item('a', '1')], [undefined, item('b', '2')]);

    assert.deepStrictEqual(inputs(merged), ['a', 'b']);
});
