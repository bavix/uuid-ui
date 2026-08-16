import assert from 'node:assert';
import test from 'node:test';

// watchSequence only touches window when it is called, so a stub is enough.
const listeners = new Set();
globalThis.window = {
    addEventListener: (type, fn) => { if (type === 'keydown') listeners.add(fn); },
    removeEventListener: (type, fn) => { listeners.delete(fn); },
};

const {watchSequence} = await import('../src/key-sequence.js');
const watchRain = fn => watchSequence(['r', 'a', 'i', 'n'], fn);

const press = (key, target = {}) => listeners.forEach(fn => fn({ key, target }));
const CODE = ['r', 'a', 'i', 'n'];

test('the word fires once, at the last letter', (t) => {
    let fired = 0;
    const stop = watchRain(() => fired++);

    CODE.slice(0, -1).forEach(k => press(k));
    assert.strictEqual(fired, 0, 'fired before the sequence was complete');

    press('n');
    assert.strictEqual(fired, 1);

    stop();
});

test('case does not matter', (t) => {
    let fired = 0;
    const stop = watchRain(() => fired++);

    CODE.forEach(k => press(k.toUpperCase()));
    assert.strictEqual(fired, 1);

    stop();
});

test('a wrong key restarts, and may itself start the sequence', (t) => {
    let fired = 0;
    const stop = watchRain(() => fired++);

    press('x');
    CODE.forEach(k => press(k));
    assert.strictEqual(fired, 1, 'a stray key should not poison the next attempt');

    // A false start on the first letter must not desynchronize the match.
    press('r');
    press('x');
    CODE.forEach(k => press(k));
    assert.strictEqual(fired, 2);

    stop();
});

test('keys typed into a field are ignored', (t) => {
    let fired = 0;
    const stop = watchRain(() => fired++);

    CODE.forEach(k => press(k, { tagName: 'TEXTAREA' }));
    assert.strictEqual(fired, 0);

    CODE.forEach(k => press(k, { isContentEditable: true }));
    assert.strictEqual(fired, 0);

    stop();
});

test('unsubscribing stops the watch', (t) => {
    let fired = 0;
    watchRain(() => fired++)();

    CODE.forEach(k => press(k));
    assert.strictEqual(fired, 0);
});

test('a long pause starts the word over', async (t) => {
    let fired = 0;
    const stop = watchSequence(['r', 'a', 'i', 'n'], () => fired++, { resetAfterMs: 20 });

    press('r');
    press('a');
    await new Promise(r => setTimeout(r, 40));
    press('i');
    press('n');
    assert.strictEqual(fired, 0, 'the stale prefix should have been dropped');

    ['r', 'a', 'i', 'n'].forEach(k => press(k));
    assert.strictEqual(fired, 1);

    stop();
});
