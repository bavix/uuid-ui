import assert from 'node:assert';
import test from 'node:test';
import { takeGroups } from '../src/fresh-lines.js';

function texts(held) {
    return held.groups.map(group => group.text);
}

test('a line already converted is not converted again', async (t) => {
    const first = takeGroups('', 'one\n');

    assert.deepStrictEqual(texts(first), ['one']);
    assert.strictEqual(first.consumed, 'one\n');

    const second = takeGroups(first.consumed, 'one\ntwo\n');

    assert.deepStrictEqual(texts(second), ['two']);
    assert.strictEqual(second.consumed, 'one\ntwo\n');
});

test('a line still being typed waits for its newline', async (t) => {
    const held = takeGroups('one\n', 'one\ntwo');

    assert.deepStrictEqual(texts(held), []);
    assert.strictEqual(held.consumed, 'one\n');
});

test('a paste without a closing newline is taken whole', async (t) => {
    const held = takeGroups('', 'one\ntwo', true);

    assert.deepStrictEqual(texts(held), ['one', 'two']);
    assert.strictEqual(held.consumed, 'one\ntwo');
});

test('an object waits until its brace closes', async (t) => {
    const opening = takeGroups('', '{ // a note\n');

    assert.deepStrictEqual(texts(opening), []);
    assert.strictEqual(opening.consumed, '');

    const half = takeGroups(opening.consumed, '{ // a note\n    low: 1,\n');

    assert.deepStrictEqual(texts(half), []);

    const whole = takeGroups(half.consumed, '{ // a note\n    low: 1,\n    high: 2,\n}\n');

    assert.deepStrictEqual(texts(whole), ['{ // a note\n    low: 1,\n    high: 2,\n}']);
    assert.strictEqual(whole.groups[0].block, true);
    assert.strictEqual(whole.consumed, '{ // a note\n    low: 1,\n    high: 2,\n}\n');
});

test('a line after a finished object is its own group', async (t) => {
    const held = takeGroups('', '{low: 1, high: 2}\nabc\n');

    assert.deepStrictEqual(texts(held), ['{low: 1, high: 2}', 'abc']);
});

test('a brace inside a comment does not open a block', async (t) => {
    const held = takeGroups('', 'abc // {\ndef\n');

    assert.deepStrictEqual(texts(held), ['abc // {', 'def']);
});

test('blank lines are dropped, not converted', async (t) => {
    const held = takeGroups('', 'one\n\n\ntwo\n');

    assert.deepStrictEqual(texts(held), ['one', 'two']);
    assert.strictEqual(held.consumed, 'one\n\n\ntwo\n');
});

test('editing what came before starts the box over', async (t) => {
    const held = takeGroups('one\ntwo\n', 'ONE\ntwo\n');

    assert.deepStrictEqual(texts(held), ['ONE', 'two']);
    assert.strictEqual(held.consumed, 'ONE\ntwo\n');
});

test('an emptied box forgets what it had', async (t) => {
    const held = takeGroups('one\n', '');

    assert.deepStrictEqual(texts(held), []);
    assert.strictEqual(held.consumed, '');
});

test('nothing but a string is handled', async (t) => {
    assert.deepStrictEqual(takeGroups('one\n', null), { groups: [], consumed: '' });
});

test('a group remembers which line of the box it came from', async (t) => {
    const first = takeGroups('', 'one\ntwo\n');

    assert.deepStrictEqual(first.groups.map(group => group.line), [1, 2]);

    const next = takeGroups(first.consumed, 'one\ntwo\n\nfour\n');

    assert.deepStrictEqual(next.groups.map(group => [group.text, group.line]), [['four', 4]]);

    const block = takeGroups('', 'a\n{low: 1, high: 2}\n');

    assert.deepStrictEqual(block.groups.map(group => [group.text, group.line]), [['a', 1], ['{low: 1, high: 2}', 2]]);
});
