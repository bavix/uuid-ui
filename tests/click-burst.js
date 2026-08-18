import assert from 'node:assert';
import test from 'node:test';
import { burst, forgetBursts } from '../src/click-burst.js';

test('five clicks close together are a run', async (t) => {
    forgetBursts();

    const said = [1, 2, 3, 4, 5].map(i => burst('x', { now: 1000 + i * 60 }));

    assert.deepStrictEqual(said, [false, false, false, false, true]);
});

test('a pause starts the run over', async (t) => {
    forgetBursts();

    burst('x', { now: 0 });
    burst('x', { now: 100 });

    assert.strictEqual(burst('x', { now: 900 }), false, 'the run should have restarted');
    assert.strictEqual(burst('x', { now: 1000 }), false);
    assert.strictEqual(burst('x', { now: 1100 }), false);
    assert.strictEqual(burst('x', { now: 1200 }), false);
    assert.strictEqual(burst('x', { now: 1300 }), true);
});

test('a completed run does not fire again on the next click', async (t) => {
    forgetBursts();

    for (let i = 0; i < 5; i += 1) {
        burst('x', { now: i * 50 });
    }

    assert.strictEqual(burst('x', { now: 260 }), false);
});

test('two things being clicked are counted apart', async (t) => {
    forgetBursts();

    for (let i = 0; i < 4; i += 1) {
        burst('a', { now: i * 50 });
        burst('b', { now: i * 50 });
    }

    assert.strictEqual(burst('a', { now: 220 }), true);
    assert.strictEqual(burst('b', { now: 230 }), true);
});
