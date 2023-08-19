import assert from 'node:assert';
import test from 'test';
import {base64StdToUuid, uuidToBase64Std} from "../src/base64.js";

test('base64std encode', (t) => {
    const guid = '86e5bae4-ef58-4031-b34f-5e9ff914cd55'

    assert.deepEqual('huW65O9YQDGzT16f+RTNVQ==', uuidToBase64Std(guid));
    assert.deepEqual(guid, base64StdToUuid(uuidToBase64Std(guid)));
});
