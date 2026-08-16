import assert from 'node:assert';
import test from 'node:test';
import {ActiveTime, readActiveSeconds, writeActiveSeconds} from "../src/active-time.js";

const SECOND = 1000;

test('a tab left open earns nothing', (t) => {
    const clock = new ActiveTime();
    let now = 0;

    clock.markActivity(now);
    // three hours of ticks with nobody touching anything
    for (let i = 0; i < 3 * 60 * 6; i++) {
        now += 10 * SECOND;
        clock.tick(now, true);
    }

    // only the first minute after the last activity counts as work
    assert.ok(clock.seconds <= 60, `banked ${clock.seconds}s of idling`);
});

test('a hidden tab earns nothing, however busy it looks', (t) => {
    const clock = new ActiveTime();
    let now = 0;

    for (let i = 0; i < 100; i++) {
        now += 5 * SECOND;
        clock.markActivity(now);
        clock.tick(now, false);
    }

    assert.strictEqual(clock.seconds, 0);
});

test('working time accumulates', (t) => {
    const clock = new ActiveTime();
    let now = 0;

    clock.markActivity(now);
    for (let i = 0; i < 12; i++) {
        now += 5 * SECOND;
        clock.markActivity(now);
        clock.tick(now, true);
    }

    assert.strictEqual(Math.round(clock.seconds), 60);
});

test('a suspended tab cannot bank the gap it slept through', (t) => {
    const clock = new ActiveTime();
    let now = 0;

    clock.markActivity(now);
    now += 5 * SECOND;
    clock.tick(now, true);
    assert.strictEqual(Math.round(clock.seconds), 5);

    // the machine sleeps for two hours, then one tick reports the whole gap
    now += 2 * 60 * 60 * SECOND;
    clock.markActivity(now);
    clock.tick(now, true);

    assert.ok(clock.seconds <= 35, `banked ${clock.seconds}s from a sleep`);
});

test('after a suspend the next slice starts from the resume', (t) => {
    const clock = new ActiveTime();
    let now = 0;

    clock.markActivity(now);
    clock.tick(now + SECOND, true);
    clock.suspend();

    now += 60 * 60 * SECOND;
    clock.markActivity(now);
    clock.tick(now, true);

    assert.ok(clock.seconds <= 2, `banked ${clock.seconds}s across a suspend`);
});

test('the stored total survives a reload and shrugs off nonsense', (t) => {
    const store = new Map();
    const storage = {
        getItem: k => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, v),
    };

    writeActiveSeconds(4321.6, storage);
    assert.strictEqual(readActiveSeconds(storage), 4322);

    // a second tab with a smaller count must not erase the bigger one
    writeActiveSeconds(10, storage);
    assert.strictEqual(readActiveSeconds(storage), 4322);

    storage.setItem('uuidActiveSeconds', 'not a number');
    assert.strictEqual(readActiveSeconds(storage), 0);

    storage.setItem('uuidActiveSeconds', '-5');
    assert.strictEqual(readActiveSeconds(storage), 0);

    assert.strictEqual(new ActiveTime({ seconds: -1 }).seconds, 0);
});
