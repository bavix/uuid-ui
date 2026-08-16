import assert from 'node:assert';
import test from 'node:test';
import {extractComment, stripComment} from "../src/comment.js";

test('comments are stripped and extracted', (t) => {
    assert.strictEqual(stripComment('0;1 // comment').trim(), '0;1');
    assert.strictEqual(extractComment('0;1 // comment'), 'comment');

    assert.strictEqual(stripComment('0;1 # comment').trim(), '0;1');
    assert.strictEqual(extractComment('0;1 # comment'), 'comment');

    assert.strictEqual(stripComment('// whole line').trim(), '');
    assert.strictEqual(extractComment('// whole line'), 'whole line');

    assert.strictEqual(stripComment('plain value'), 'plain value');
    assert.strictEqual(extractComment('plain value'), null);
});

test('base64 payloads containing // are not treated as comments', (t) => {
    // About 1 UUID in 250 base64-encodes to a string containing '//';
    // this used to be truncated to "CIRUS".
    const base64 = 'CIRUS//hTd6wGG4veI3QBg==';

    assert.strictEqual(stripComment(base64), base64);
    assert.strictEqual(extractComment(base64), null);

    assert.strictEqual(stripComment(`${base64} // note`).trim(), base64);
    assert.strictEqual(extractComment(`${base64} // note`), 'note');
});

test('the earliest valid marker wins', (t) => {
    assert.strictEqual(extractComment('a # hash // slash'), 'hash // slash');
    assert.strictEqual(extractComment('a // slash # hash'), 'slash # hash');
});
