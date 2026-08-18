import assert from 'node:assert';
import test from 'node:test';
import { SIGNED, UNSIGNED } from '../src/int-type.js';
import { TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_UUID, TYPE_WORDS } from '../src/type-detector.js';
import { detectIntPair, toUuid } from '../src/to-uuid.js';
import { spell, spellingsOf, usesInts } from '../src/spellings.js';
import { uuidToBytesString } from '../src/uuid-bytes.js';
import { uuidToBase64Std } from '../src/base64.js';
import { uuidToUlid } from '../src/uuid-ulid.js';
import { uuidToInts, uuidToUints } from '../src/uuid-high-low.js';
import { uuidToWords } from '../src/uuid-words.js';

const SAMPLES = [
    '71a46cec-4809-4cc5-9689-5b0441b46186',
    '018f3c00-1122-7000-8000-0000deadbeef',
    '00000000-0000-0000-0000-000000000001',
    'ffffffff-ffff-ffff-ffff-fffffffffffe',
];

const TYPES = [TYPE_UUID, TYPE_BASE64, TYPE_ULID, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_WORDS];
const NAMES = {
    [TYPE_UUID]: 'uuid',
    [TYPE_BASE64]: 'base64',
    [TYPE_ULID]: 'ulid',
    [TYPE_BYTES]: 'bytes',
    [TYPE_HIGH_LOW]: 'high-low',
    [TYPE_WORDS]: 'words',
};

const QUOTED = /"(-?\d+)"/g;

function written(type, uuid, convention) {
    const signed = convention === SIGNED;

    switch (type) {
        case TYPE_UUID: return uuid;
        case TYPE_BASE64: return uuidToBase64Std(uuid);
        case TYPE_ULID: return uuidToUlid(uuid);
        case TYPE_BYTES: return uuidToBytesString(uuid);
        case TYPE_HIGH_LOW: return JSON.stringify(signed ? uuidToInts(uuid) : uuidToUints(uuid)).replace(QUOTED, '$1');
        default: return JSON.stringify(uuidToWords(uuid, signed));
    }
}

const sameEitherWay = (type, uuid) => written(type, uuid, SIGNED) === written(type, uuid, UNSIGNED);

test('across every pair of formats, a reading is never named wrongly', async (t) => {
    const wrong = [];
    let checked = 0;

    for (const uuid of SAMPLES) {
        for (const from of TYPES) {
            for (const to of TYPES) {
                for (const read of [SIGNED, UNSIGNED]) {
                    for (const write of [SIGNED, UNSIGNED]) {
                        const input = written(from, uuid, read);
                        const output = written(to, uuid, write);

                        if (input === output || toUuid(input, read) !== uuid) {
                            continue;
                        }

                        checked += 1;

                        const held = detectIntPair(input, output);
                        const where = `${NAMES[from]} → ${NAMES[to]}`;

                        if (usesInts(from) && held.read !== null && held.read !== read && !sameEitherWay(from, uuid)) {
                            wrong.push(`${where}: read named wrongly for ${input}`);
                        }

                        if (usesInts(to) && held.write !== null && held.write !== write && !sameEitherWay(to, uuid)) {
                            wrong.push(`${where}: write named wrongly for ${output}`);
                        }
                    }
                }
            }
        }
    }

    assert.ok(checked > 400, `only ${checked} combinations were reachable`);
    assert.deepStrictEqual(wrong, []);
});

test('the only rows that cannot say are the symmetric pair-to-pair ones', async (t) => {
    const silent = new Set();

    for (const uuid of SAMPLES) {
        for (const from of TYPES) {
            for (const to of TYPES) {
                for (const read of [SIGNED, UNSIGNED]) {
                    for (const write of [SIGNED, UNSIGNED]) {
                        const input = written(from, uuid, read);
                        const output = written(to, uuid, write);

                        if (input === output || toUuid(input, read) !== uuid) {
                            continue;
                        }

                        const held = detectIntPair(input, output);

                        if ((usesInts(from) && held.read === null) || (usesInts(to) && held.write === null)) {
                            silent.add(`${NAMES[from]} → ${NAMES[to]}`);
                        }
                    }
                }
            }
        }
    }

    assert.deepStrictEqual([...silent], ['high-low → high-low']);
});

test('every spelling of a result keeps the reading readable', async (t) => {
    const uuid = SAMPLES[0];

    for (const to of TYPES) {
        for (const option of spellingsOf(to)) {
            for (const write of [SIGNED, UNSIGNED]) {
                const output = spell(to, written(to, uuid, write), option.id, false);
                const input = written(TYPE_UUID, uuid, SIGNED);
                const held = detectIntPair(input, output);

                assert.strictEqual(toUuid(output, write), uuid, `${NAMES[to]}/${option.id} does not read back`);

                if (usesInts(to) && !sameEitherWay(to, uuid)) {
                    assert.strictEqual(held.write, write, `${NAMES[to]}/${option.id} lost its reading`);
                }
            }
        }
    }
});
