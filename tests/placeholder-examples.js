import assert from 'node:assert';
import test from 'node:test';
import { makeExample, writeOne } from '../src/placeholder-examples.js';
import { toUuid } from '../src/to-uuid.js';
import { SIGNED, UNSIGNED } from '../src/int-type.js';
import { stripComment } from '../src/comment.js';
import { EXAMPLES } from '../src/placeholder-cycle.js';
import { normalizeInput } from '../src/normalize-input.js';

function seeded(seed) {
    let held = seed;

    return () => {
        held = (held * 1103515245 + 12345) % 2147483648;

        return held / 2147483648;
    };
}

function converts(line) {
    const held = normalizeInput(stripComment(line));

    return stripComment(line).trim() === '' || (held !== null && (toUuid(held, SIGNED) !== null || toUuid(held, UNSIGNED) !== null));
}

function objectConverts(example) {
    const held = normalizeInput(example.replace(/\/\/[^\n]*|#[^\n]*/g, ''));

    return held !== null && (toUuid(held, SIGNED) !== null || toUuid(held, UNSIGNED) !== null);
}

test('every line of every generated example is something the converter reads', async (t) => {
    const random = seeded(7);

    for (let i = 0; i < 300; i += 1) {
        const example = makeExample(random);

        if (example.startsWith('{ //')) {
            assert.ok(example.includes('low:') && example.includes('high:'), example);
            assert.ok(objectConverts(example), `the object example does not convert: ${example}`);
            continue;
        }

        for (const line of example.split('\n')) {
            assert.ok(converts(line), `this line does not convert: ${line}`);
        }
    }
});

test('the examples are varied: several formats, some notes, some pastes', async (t) => {
    const random = seeded(11);
    const seen = { multi: 0, comment: 0, object: 0, single: 0 };

    for (let i = 0; i < 300; i += 1) {
        const example = makeExample(random);

        if (example.startsWith('{ //')) {
            seen.object += 1;
        } else if (example.includes('\n')) {
            seen.multi += 1;
        } else if (example.includes('//') || example.includes('#')) {
            seen.comment += 1;
        } else {
            seen.single += 1;
        }
    }

    for (const [kind, count] of Object.entries(seen)) {
        assert.ok(count > 5, `only ${count} examples of kind ${kind}`);
    }
});

test('one identifier is written in many different ways', async (t) => {
    const random = seeded(3);
    const uuid = '71a46cec-4809-4cc5-9689-5b0441b46186';
    const written = new Set(Array.from({ length: 60 }, () => writeOne(uuid, random)));

    assert.ok(written.size > 6, `only ${written.size} spellings came out`);

    for (const line of written) {
        assert.ok(toUuid(line, SIGNED) === uuid || toUuid(line, UNSIGNED) === uuid, line);
    }
});

test('every hint the placeholder can show converts, over many seeds', async (t) => {
    for (const seed of [1, 3, 17, 91, 404, 2718, 65537]) {
        const random = seeded(seed);

        for (let i = 0; i < 400; i += 1) {
            const example = makeExample(random);

            if (example.startsWith('{ //')) {
                assert.ok(objectConverts(example), `seed ${seed}: ${example}`);
                continue;
            }

            for (const line of example.split('\n')) {
                assert.ok(converts(line), `seed ${seed}, line does not convert: ${line}`);
            }
        }
    }
});

test('the fixed list of hints converts too', async (t) => {
    for (const example of EXAMPLES) {
        assert.ok(converts(example), `this hint does not convert: ${example}`);
    }
});

test('quoted hints appear and read back as the same identifier', async (t) => {
    const random = seeded(23);
    let quotedSeen = 0;

    for (let i = 0; i < 400; i += 1) {
        const line = writeOne('71a46cec-4809-4cc5-9689-5b0441b46186', random);

        if (/^["'`]/.test(line)) {
            quotedSeen += 1;
            assert.ok(converts(line), `quoted hint does not convert: ${line}`);
        }
    }

    assert.ok(quotedSeen > 20, `too few quoted hints: ${quotedSeen}`);
});
