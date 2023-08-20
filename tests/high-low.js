import assert from 'node:assert';
import test from 'test';
import {intsToUuid, uintsToUuid, uuidToInts, uuidToUints} from "../src/uuid-high-low.js";

test('to-high-low-integer64', (t) => {
    assert.deepEqual(
        {high: '0', low: '0'},
        uuidToInts("00000000-0000-0000-0000-000000000000"),
    );
    assert.deepEqual(
        {high: '0', low: '72057594037927936'},
        uuidToInts("00000000-0000-0000-0000-000000000001"),
    );
    assert.deepEqual(
        {high: '72057594037927936', low: '0'},
        uuidToInts("00000000-0000-0001-0000-000000000000"),
    );
    assert.deepEqual(
        {high: '0', low: '-1'},
        uuidToInts("00000000-0000-0000-FFFF-FFFFFFFFFFFF"),
    );
    assert.deepEqual(
        {high: '-1', low: '0'},
        uuidToInts("FFFFFFFF-FFFF-FFFF-0000-000000000000"),
    );
    assert.deepEqual(
        {high: '-1', low: '-1'},
        uuidToInts("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF"),
    );
    assert.deepEqual(
        {high: '-858980353', low: '0'},
        uuidToInts("FFFFCCCC-FFFF-FFFF-0000-000000000000"),
    );
    assert.deepEqual(
        {high: '3623603779236289292', low: '-5403687274121261928'},
        uuidToInts("0c5b2444-70a0-4932-980c-b4dc0d3f02b5"),
    );
});

test('from-high-low-integer64', (t) => {
    assert.deepEqual(
        "00000000-0000-0000-0000-000000000000".toLowerCase(),
        intsToUuid('0', '0'),
    );
    assert.deepEqual(
        "00000000-0000-0000-0000-000000000001".toLowerCase(),
        intsToUuid('0', '72057594037927936'),
    );
    assert.deepEqual(
        "00000000-0000-0001-0000-000000000000".toLowerCase(),
        intsToUuid('72057594037927936', '0'),
    );
    assert.deepEqual(
        "00000000-0000-0000-FFFF-FFFFFFFFFFFF".toLowerCase(),
        intsToUuid('0', '-1'),
    );
    assert.deepEqual(
        "FFFFFFFF-FFFF-FFFF-0000-000000000000".toLowerCase(),
        intsToUuid('-1', '0'),
    );
    assert.deepEqual(
        "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF".toLowerCase(),
        intsToUuid('-1', '-1'),
    );
    assert.deepEqual(
        "FFFFCCCC-FFFF-FFFF-0000-000000000000".toLowerCase(),
        intsToUuid('-858980353', '0'),
    );
    assert.deepEqual(
        "0c5b2444-70a0-4932-980c-b4dc0d3f02b5".toLowerCase(),
        intsToUuid('3623603779236289292', '-5403687274121261928'),
    );
});

test('to-high-low-unsigned-integer-64', (t) => {
    assert.deepEqual(
        {high: '0', low: '0'},
        uuidToUints("00000000-0000-0000-0000-000000000000"),
    );
    assert.deepEqual(
        {high: '0', low: '1'},
        uuidToUints("00000000-0000-0000-0000-000000000001"),
    );
    assert.deepEqual(
        {high: '1', low: '0'},
        uuidToUints("00000000-0000-0001-0000-000000000000"),
    );
    assert.deepEqual(
        {high: '1', low: '1'},
        uuidToUints("00000000-0000-0001-0000-000000000001"),
    );
    assert.deepEqual(
        {high: '0', low: '18446744073709551615'},
        uuidToUints("00000000-0000-0000-FFFF-FFFFFFFFFFFF"),
    );
    assert.deepEqual(
        {high: '18446744073709551615', low: '0'},
        uuidToUints("FFFFFFFF-FFFF-FFFF-0000-000000000000"),
    );
    assert.deepEqual(
        {high: '18446744073709551615', low: '18446744073709551615'},
        uuidToUints("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF"),
    );
    assert.deepEqual(
        {high: '890345227701733682', low: '10956330850693612213'},
        uuidToUints("0c5b2444-70a0-4932-980c-b4dc0d3f02b5"),
    );
});

test('from-high-low-integer64', (t) => {
    assert.deepEqual(
        "00000000-0000-0000-0000-000000000000".toLowerCase(),
        uintsToUuid('0', '0'),
    );
    assert.deepEqual(
        "00000000-0000-0000-0000-000000000001".toLowerCase(),
        uintsToUuid('0', '1'),
    );
    assert.deepEqual(
        "00000000-0000-0001-0000-000000000000".toLowerCase(),
        uintsToUuid('1', '0'),
    );
    assert.deepEqual(
        "00000000-0000-0000-FFFF-FFFFFFFFFFFF".toLowerCase(),
        uintsToUuid('0', '18446744073709551615'),
    );
    assert.deepEqual(
        "FFFFFFFF-FFFF-FFFF-0000-000000000000".toLowerCase(),
        uintsToUuid('18446744073709551615', '0'),
    );
    assert.deepEqual(
        "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF".toLowerCase(),
        uintsToUuid('18446744073709551615', '18446744073709551615'),
    );
    assert.deepEqual(
        "0c5b2444-70a0-4932-980c-b4dc0d3f02b5".toLowerCase(),
        uintsToUuid('890345227701733682', '10956330850693612213'),
    );
});
