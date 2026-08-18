import assert from 'node:assert';
import test from 'node:test';
import { startingHighScore } from '../src/runner-score.js';

test('the shared records win when they hold a score', async (t) => {
    assert.strictEqual(startingHighScore({ 'Space Runner': 120 }, '42'), 120);
    assert.strictEqual(startingHighScore({ 'Space Runner': 0 }, '42'), 0);
});

test('the key this game used before is read when the records say nothing', async (t) => {
    assert.strictEqual(startingHighScore({}, '42'), 42);
    assert.strictEqual(startingHighScore({ Minesweeper: 9 }, '7'), 7);
});

test('nothing kept anywhere is a score of zero', async (t) => {
    assert.strictEqual(startingHighScore({}, null), 0);
    assert.strictEqual(startingHighScore({}, 'not a number'), 0);
    assert.strictEqual(startingHighScore({}, '-5'), 0);
});
