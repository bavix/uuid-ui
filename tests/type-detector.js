import assert from 'node:assert';
import test from 'node:test';
import {TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_UUID, typeDetector} from "../src/type-detector.js";
import {uuidToBytesString} from "../src/uuid-bytes.js";
import {uuidToUints} from "../src/uuid-high-low.js";
import {uuidToBase64Std} from "../src/base64.js";

test('type detector', (t) => {
    const guid = '86e5bae4-ef58-4031-b34f-5e9ff914cd55'

    assert.strictEqual(TYPE_UUID, typeDetector(guid));
    assert.strictEqual(TYPE_BYTES, typeDetector(uuidToBytesString(guid)));
    assert.strictEqual(TYPE_HIGH_LOW, typeDetector(JSON.stringify(uuidToUints(guid))));
    assert.strictEqual(TYPE_BASE64, typeDetector(uuidToBase64Std(guid)));

    assert.strictEqual(TYPE_HIGH_LOW, typeDetector('0;0'));
    assert.strictEqual(TYPE_HIGH_LOW, typeDetector('-1;-1'));
});
