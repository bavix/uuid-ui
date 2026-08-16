import assert from 'node:assert';
import test from 'node:test';
import {intTypeSlug, parseIntType, parseTarget, targetSlug} from "../src/url-state.js";
import {SIGNED, UNSIGNED} from "../src/int-type.js";
import {TYPE_BASE64, TYPE_BYTES, TYPE_HEX, TYPE_HIGH_LOW, TYPE_ULID, TYPE_UUID} from "../src/type-detector.js";

test('every target format has a stable slug and round-trips', (t) => {
    for (const type of [TYPE_UUID, TYPE_BASE64, TYPE_HIGH_LOW, TYPE_BYTES, TYPE_ULID, TYPE_HEX]) {
        const slug = targetSlug(type);
        assert.ok(slug, `no slug for type ${type}`);
        assert.strictEqual(parseTarget(`#to=${slug}`), type);
    }
});

test('the fragment is parsed the way a link would carry it', (t) => {
    assert.strictEqual(parseTarget('#to=base64'), TYPE_BASE64);
    assert.strictEqual(parseTarget('to=base64'), TYPE_BASE64);
    assert.strictEqual(parseTarget('#to=BASE64'), TYPE_BASE64);
    assert.strictEqual(parseTarget('#to=high-low&anything=else'), TYPE_HIGH_LOW);
});

test('anything unknown leaves the app on its default', (t) => {
    assert.strictEqual(parseTarget('#to=jwt'), null);
    assert.strictEqual(parseTarget('#to='), null);
    assert.strictEqual(parseTarget('#'), null);
    assert.strictEqual(parseTarget(''), null);
    assert.strictEqual(parseTarget(null), null);
    assert.strictEqual(parseTarget('#to=constructor'), null);
    assert.strictEqual(parseTarget('#to=__proto__'), null);
});

test('unknown types have no slug', (t) => {
    assert.strictEqual(targetSlug(9999), null);
    assert.strictEqual(targetSlug(undefined), null);
});

test('the hex view is linkable too', (t) => {
    assert.strictEqual(parseTarget('#to=hex'), TYPE_HEX);
    assert.strictEqual(targetSlug(TYPE_HEX), 'hex');
});

test('the integer type travels in the fragment too', (t) => {
    assert.strictEqual(parseIntType('#to=high-low&int=unsigned'), UNSIGNED);
    assert.strictEqual(parseIntType('#int=signed'), SIGNED);
    assert.strictEqual(parseIntType('#to=high-low&int=SIGNED'), SIGNED);
    assert.strictEqual(intTypeSlug(UNSIGNED), 'unsigned');
});

test('an absent or bogus integer type reads as nothing, not as a default', (t) => {
    // null means "the link said nothing", so the app keeps its own setting.
    assert.strictEqual(parseIntType('#to=high-low'), null);
    assert.strictEqual(parseIntType('#int=twos-complement'), null);
    assert.strictEqual(parseIntType('#int=__proto__'), null);
    assert.strictEqual(parseIntType(null), null);
    assert.strictEqual(intTypeSlug(999), null);
});
