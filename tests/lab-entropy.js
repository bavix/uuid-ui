import assert from 'node:assert';
import test from 'node:test';
import { ENTROPY_KINDS, fieldsOfKind, fillEntropyBytes } from '../src/lab.js';
import { bytesToUuid } from '../src/uuid-bytes.js';
import { timestampFromUuid } from '../src/uuid-timestamp.js';
import { uuidToUlid } from '../src/uuid-ulid.js';

const steady = { node: (1n << 40n) | 0x1234567n, clock: 0x2abcn, spin: 7 };

function filled(id) {
    const bytes = new Uint8Array(16);

    fillEntropyBytes(bytes, id, steady);

    return bytes;
}

test('every kind the panel offers has a layout that covers all 128 bits once', async (t) => {
    for (const kind of ENTROPY_KINDS) {
        const seen = new Array(128).fill(0);

        for (const [from, to] of fieldsOfKind(kind.id)) {
            for (let i = from; i <= to; i += 1) {
                seen[i] += 1;
            }
        }

        assert.deepStrictEqual([...new Set(seen)], [1], `${kind.label} does not cover every bit exactly once`);
    }
});

test('what the panel draws is a real identifier of that kind', async (t) => {
    for (const kind of ENTROPY_KINDS) {
        const uuid = bytesToUuid([...filled(kind.id)]);

        if (kind.id === 'ulid') {
            assert.strictEqual(uuidToUlid(uuid).length, 26);
            continue;
        }

        assert.strictEqual(uuid[14], kind.id, `${kind.label} writes the wrong version nibble`);
        assert.ok('89ab'.includes(uuid[19]), `${kind.label} writes the wrong variant`);
    }
});

test('the clock-carrying kinds carry this moment', async (t) => {
    const now = Date.now();

    for (const id of ['1', '6', '7', 'ulid']) {
        const uuid = bytesToUuid([...filled(id)]);
        const held = id === 'ulid' ? null : timestampFromUuid(uuid);
        const ms = held === null
            ? Number(BigInt('0x' + uuid.replace(/-/g, '').slice(0, 12)))
            : Date.parse(held);

        assert.ok(Math.abs(ms - now) < 5000, `${id} carries ${new Date(ms).toISOString()} rather than now`);
    }
});

test('a hash-based kind never moves: the same name is the same bits', async (t) => {
    assert.deepStrictEqual([...filled('5')], [...filled('5')]);
    assert.strictEqual(bytesToUuid([...filled('5')]), 'cfbff0d1-9375-5685-968c-48ce8b15ae17');
});

test('the node and the clock sequence hold still while the clock moves', async (t) => {
    const first = bytesToUuid([...filled('1')]);
    const second = bytesToUuid([...filled('1')]);

    assert.strictEqual(first.slice(24), second.slice(24), 'the node moved');
    assert.strictEqual(first.slice(19, 23), second.slice(19, 23), 'the clock sequence moved');
});

test('a version 4 has nothing fixed but the version and the variant', async (t) => {
    const kinds = fieldsOfKind('4').map(([, , kind]) => kind);

    assert.deepStrictEqual(new Set(kinds), new Set(['random', 'version', 'variant']));
});
