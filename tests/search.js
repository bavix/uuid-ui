import assert from 'node:assert';
import test from 'node:test';
import { searchItems } from '../src/search.js';

const ROWS = [
    { input: 'deadbeef-dead-beef-dead-beefdeadbeef', output: '{"high":-1,"low":-1}', info: 'from the ticket' },
    { input: '018f3c00-0000-7000-8000-000000000000', output: 'AYs8AAAAcAAAAAAAAAAAAA==' },
    { input: '00000000-0000-0000-0000-000000000000', output: '{"high":0,"low":0}' },
];

test('a blank query keeps every row', (t) => {
    assert.strictEqual(searchItems(ROWS, ''), ROWS);
    assert.strictEqual(searchItems(ROWS, '   '), ROWS);
    assert.strictEqual(searchItems(ROWS, undefined), ROWS);
});

test('either side of the row matches', (t) => {
    assert.strictEqual(searchItems(ROWS, 'deadbeef').length, 1);
    // the base64 form of the second row, which its input does not contain
    assert.strictEqual(searchItems(ROWS, 'AYs8')[0].input, '018f3c00-0000-7000-8000-000000000000');
});

test('the comment matches too', (t) => {
    assert.deepStrictEqual(searchItems(ROWS, 'ticket').map(r => r.info), ['from the ticket']);
});

test('case and surrounding spaces do not matter', (t) => {
    assert.strictEqual(searchItems(ROWS, '  DEADBEEF  ').length, 1);
});

test('no match returns nothing, and nonsense input does not throw', (t) => {
    assert.deepStrictEqual(searchItems(ROWS, 'zzzz'), []);
    assert.deepStrictEqual(searchItems(null, 'x'), []);
    assert.deepStrictEqual(searchItems([null, undefined, {}], 'x'), []);
});

test('an identifier finds its own rows however they are spelled', async (t) => {
    const rows = [
        { input: '{"high":1,"low":1}', output: '71a46cec48094cc596895b0441b46186', info: '' },
        { input: 'something else', output: '{71A46CEC-4809-4CC5-9689-5B0441B46186}', info: '' },
        { input: 'unrelated', output: '00000000-0000-0000-0000-000000000000', info: '' },
    ];

    assert.strictEqual(searchItems(rows, '71a46cec-4809-4cc5-9689-5b0441b46186').length, 2);
    assert.strictEqual(searchItems(rows, 'caRs7EgJTMWWiVsEQbRhhg==').length, 2, 'base64 finds the same rows');
    assert.strictEqual(searchItems(rows, '00000000-0000-0000-0000-000000000000').length, 1);
});

test('a query that is not an identifier is still a plain substring', async (t) => {
    const rows = [
        { input: 'a', output: 'b', info: 'from the invoice service' },
        { input: 'c', output: 'd', info: '' },
    ];

    assert.strictEqual(searchItems(rows, 'invoice').length, 1);
    assert.strictEqual(searchItems(rows, 'nothing here').length, 0);
});
