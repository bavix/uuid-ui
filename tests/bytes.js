import assert from 'node:assert';
import test from 'node:test';
import {parse as uuidParse} from 'uuid';
import {uuidToBytesString} from "../src/uuid-bytes.js";
import { TYPE_BYTES, typeDetector } from '../src/type-detector.js';
import { toUuid } from '../src/to-uuid.js';
import { SIGNED } from '../src/int-type.js';

test('uuid to bytes [toString]', (t) => {
    const guid = '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'

    const bytes = uuidParse(guid);
    const uuidParseResult = '[' + [...bytes].join(',') + ']'
    const uuidToBigIntsResult = uuidToBytesString(guid)

    assert.deepEqual(uuidParseResult, uuidToBigIntsResult);
});

test('bytes written apart as hex pairs are bytes, and convert like them', async (t) => {
    const spaced = '71 a4 6c ec 48 09 4c c5 96 89 5b 04 41 b4 61 86';

    assert.strictEqual(typeDetector(spaced), TYPE_BYTES);
    assert.strictEqual(toUuid(spaced, SIGNED), '71a46cec-4809-4cc5-9689-5b0441b46186');
    assert.strictEqual(typeDetector(spaced.toUpperCase()), TYPE_BYTES);
    assert.strictEqual(toUuid(spaced.replace(/ /g, ', '), SIGNED), '71a46cec-4809-4cc5-9689-5b0441b46186');
});

test('fifteen pairs or seventeen are not a set of bytes', async (t) => {
    const pairs = '71 a4 6c ec 48 09 4c c5 96 89 5b 04 41 b4 61 86'.split(' ');

    assert.notStrictEqual(typeDetector(pairs.slice(0, 15).join(' ')), TYPE_BYTES);
    assert.notStrictEqual(typeDetector([...pairs, '00'].join(' ')), TYPE_BYTES);
});
