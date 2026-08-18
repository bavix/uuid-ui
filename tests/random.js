import assert from 'node:assert';
import test from 'node:test';
import { randomFloat, randomInt, randomPick, randomRange } from '../src/random.js';

test('a draw stays inside [0, 1), across more draws than the pool holds', async (t) => {
    for (let i = 0; i < 1000; i += 1) {
        const held = randomFloat();

        assert.ok(held >= 0 && held < 1, `${held} is outside [0, 1)`);
    }
});

test('the pool refills rather than repeating itself', async (t) => {
    const first = Array.from({ length: 256 }, () => randomFloat());
    const second = Array.from({ length: 256 }, () => randomFloat());

    assert.notDeepStrictEqual(first, second);
    assert.ok(new Set(first).size > 200, 'a refilled pool should not repeat its draws');
});

test('an integer draw covers its range and never leaves it', async (t) => {
    const seen = new Set();

    for (let i = 0; i < 500; i += 1) {
        const held = randomInt(5);

        assert.ok(Number.isInteger(held) && held >= 0 && held < 5, `${held} is out of range`);
        seen.add(held);
    }

    assert.strictEqual(seen.size, 5, 'every value in the range should turn up');
});

test('an empty range is zero, not a broken index', async (t) => {
    assert.strictEqual(randomInt(0), 0);
    assert.strictEqual(randomInt(-3), 0);
    assert.strictEqual(randomPick([]), undefined);
});

test('a range draw stays between its ends', async (t) => {
    for (let i = 0; i < 200; i += 1) {
        const held = randomRange(-5, 5);

        assert.ok(held >= -5 && held < 5, `${held} is outside [-5, 5)`);
    }
});

test('a pick comes from the list it was given', async (t) => {
    const items = ['a', 'b', 'c'];
    const seen = new Set();

    for (let i = 0; i < 200; i += 1) {
        const held = randomPick(items);

        assert.ok(items.includes(held));
        seen.add(held);
    }

    assert.strictEqual(seen.size, 3);
});
