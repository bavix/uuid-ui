import assert from 'node:assert';
import test from 'test';
import {parse as uuidParse} from 'uuid';
import {uuidToBytesString} from "../src/uuid-bytes.js";

test('uuid to bytes [toString]', (t) => {
    const guid = '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b'

    const bytes = uuidParse(guid);
    const uuidParseResult = '[' + [...bytes].join(',') + ']'
    const uuidToBigIntsResult = uuidToBytesString(guid)

    assert.deepEqual(uuidParseResult, uuidToBigIntsResult);
});
