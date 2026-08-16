import assert from 'node:assert';
import test from 'node:test';
import { trackEgg } from '../src/analytics.js';

function withCounters(run) {
    const gtagCalls = [];
    const ymCalls = [];

    globalThis.window = globalThis;
    globalThis.gtag = (...args) => gtagCalls.push(args);
    globalThis.ym = (...args) => ymCalls.push(args);

    try {
        run();
        return { gtagCalls, ymCalls };
    } finally {
        delete globalThis.gtag;
        delete globalThis.ym;
        delete globalThis.window;
    }
}

test('both counters hear about the egg', (t) => {
    const { gtagCalls, ymCalls } = withCounters(() => trackEgg('mines', 'typed'));

    assert.deepStrictEqual(gtagCalls, [['event', 'easter_egg', { egg: 'mines', how: 'typed' }]]);
    assert.deepStrictEqual(ymCalls, [[94685288, 'reachGoal', 'easter_egg', { egg: 'mines', how: 'typed' }]]);
});

test('nothing but the name travels', (t) => {
    const { gtagCalls } = withCounters(() => trackEgg('nil'));
    const [, , payload] = gtagCalls[0];

    assert.deepStrictEqual(Object.keys(payload), ['egg']);
});

test('a nameless event is not sent', (t) => {
    const { gtagCalls, ymCalls } = withCounters(() => { trackEgg(''); trackEgg(undefined); });

    assert.strictEqual(gtagCalls.length, 0);
    assert.strictEqual(ymCalls.length, 0);
});

test('a counter that throws does not break the caller', (t) => {
    globalThis.window = globalThis;
    globalThis.gtag = () => { throw new Error('blocked by an extension'); };
    globalThis.ym = () => { throw new Error('blocked too'); };

    try {
        assert.doesNotThrow(() => trackEgg('rain', 'typed'));
    } finally {
        delete globalThis.gtag;
        delete globalThis.ym;
        delete globalThis.window;
    }
});

test('a page without counters is silent, not broken', (t) => {
    assert.doesNotThrow(() => trackEgg('bits', 'typed'));
});
