import assert from 'node:assert';
import test from 'node:test';
import { EXAMPLES, TIMING, createCycle } from '../src/placeholder-cycle.js';

test('a line is typed one character at a time and then held', async (t) => {
    const cycle = createCycle({ examples: ['abc'] });

    assert.strictEqual(cycle.text(), '');
    assert.strictEqual(cycle.step(), TIMING.type);
    assert.strictEqual(cycle.text(), 'a');
    cycle.step();
    assert.strictEqual(cycle.text(), 'ab');
    assert.strictEqual(cycle.step(), TIMING.hold, 'the last character is followed by a pause');
    assert.strictEqual(cycle.text(), 'abc');
    assert.strictEqual(cycle.phase(), 'holding');
});

test('what was typed is erased and the next line begins', async (t) => {
    const cycle = createCycle({ examples: ['ab', 'cd'] });

    for (let i = 0; i < 40; i += 1) {
        cycle.step();

        if (cycle.text() === 'c') {
            break;
        }
    }

    assert.strictEqual(cycle.text(), 'c', 'the second line starts after the first is gone');
});

test('the lines come round again', async (t) => {
    const cycle = createCycle({ examples: ['a', 'b'] });
    const seen = new Set();

    for (let i = 0; i < 60; i += 1) {
        cycle.step();
        seen.add(cycle.text());
    }

    assert.ok(seen.has('a') && seen.has('b'), 'both lines are shown');
});

test('erasing is quicker than typing, or the wait would drag', async (t) => {
    const cycle = createCycle({ examples: ['0123456789'] });
    let typed = 0;

    while (cycle.phase() === 'typing') {
        cycle.step();
        typed += 1;
    }

    cycle.step();

    let erased = 0;

    while (cycle.phase() === 'erasing') {
        cycle.step();
        erased += 1;
    }

    assert.ok(erased < typed, `erasing took ${erased} steps against ${typed} typed`);
});

test('an empty list never moves and never throws', async (t) => {
    const cycle = createCycle({ examples: [] });

    assert.strictEqual(cycle.text(), '');
    assert.strictEqual(cycle.step(), TIMING.hold);
    assert.strictEqual(cycle.text(), '');
});

test('every example is something the converter can read', async (t) => {
    const { toUuid } = await import('../src/to-uuid.js');
    const { SIGNED } = await import('../src/int-type.js');
    const { stripComment } = await import('../src/comment.js');

    for (const example of EXAMPLES) {
        const line = stripComment(example).trim();

        assert.ok(toUuid(line, SIGNED) !== null, `the placeholder shows ${example}, which does not convert`);
    }
});

test('with a source of its own, every turn brings a new example', async (t) => {
    const lines = ['one', 'two', 'three'];
    let at = 0;
    const cycle = createCycle({ source: () => lines[at++ % lines.length] });
    const seen = new Set();

    for (let i = 0; i < 80; i += 1) {
        cycle.step();

        if (cycle.text() !== '') {
            seen.add(cycle.text());
        }
    }

    assert.ok(seen.has('one') && seen.has('two'), 'the source is asked again after each line');
});

test('a multi-line example is typed through its newlines', async (t) => {
    const cycle = createCycle({ examples: ['a\nb'] });

    cycle.step();
    cycle.step();

    assert.strictEqual(cycle.text(), 'a\n');

    cycle.step();

    assert.strictEqual(cycle.text(), 'a\nb');
});
