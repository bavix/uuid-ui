import assert from 'node:assert';
import test from 'node:test';
import {intTypeSlug, parseIntType, parseIntTypes, parseTarget, parseUuidStyle, parseUuidUpper, targetSlug, writeState} from "../src/url-state.js";
import {SIGNED, UNSIGNED} from "../src/int-type.js";
import {TYPE_BASE64, TYPE_BYTES, TYPE_HEX, TYPE_HIGH_LOW, TYPE_ULID, TYPE_UUID, TYPE_WORDS, uuidTypeList} from "../src/type-detector.js";

function withWindow(win, work) {
    const held = globalThis.window;

    globalThis.window = win;

    try {
        work();
    } finally {
        if (held === undefined) {
            delete globalThis.window;
        } else {
            globalThis.window = held;
        }
    }
}

test('every target format has a stable slug and round-trips', (t) => {
    for (const type of [TYPE_UUID, TYPE_BASE64, TYPE_HIGH_LOW, TYPE_BYTES, TYPE_ULID, TYPE_WORDS]) {
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

test('a link from before the split means the same at both ends', async (t) => {
    assert.deepStrictEqual(parseIntTypes('#to=high-low&in=unsigned'), { read: UNSIGNED, write: UNSIGNED });
    assert.deepStrictEqual(parseIntTypes('#to=high-low&in=signed'), { read: SIGNED, write: SIGNED });
});

test('links written with the older int and int-out still mean what they meant', async (t) => {
    assert.deepStrictEqual(parseIntTypes('#to=high-low&int=unsigned'), { read: UNSIGNED, write: UNSIGNED });
    assert.deepStrictEqual(parseIntTypes('#to=high-low&int=signed&int-out=unsigned'), { read: SIGNED, write: UNSIGNED });
    assert.strictEqual(parseIntType('#to=uuid&int=unsigned'), UNSIGNED);
});

test('a link can carry two different ends', async (t) => {
    assert.deepStrictEqual(parseIntTypes('#to=high-low&in=signed&out=unsigned'), { read: SIGNED, write: UNSIGNED });
});

test('a link with no reading at all leaves both ends unsaid', async (t) => {
    assert.deepStrictEqual(parseIntTypes('#to=uuid'), { read: null, write: null });
    assert.deepStrictEqual(parseIntTypes('#to=uuid&int=nonsense'), { read: null, write: null });
});

test('the second end is written only when it differs', async (t) => {
    const links = [];
    const win = {
        location: { pathname: '/', search: '', hash: '' },
        history: { replaceState: (a, b, url) => links.push(url) },
    };

    withWindow(win, () => {
        writeState({ resultType: TYPE_HIGH_LOW, intType: SIGNED, writeIntType: SIGNED });
        writeState({ resultType: TYPE_HIGH_LOW, intType: SIGNED, writeIntType: UNSIGNED });
    });

    assert.deepStrictEqual(links, ['/#to=high-low&in=signed', '/#to=high-low&in=signed&out=unsigned']);
});

test('words can be linked to, like every other format', async (t) => {
    const links = [];
    const win = {
        location: { pathname: '/', search: '', hash: '' },
        history: { replaceState: (a, b, url) => links.push(url) },
    };

    withWindow(win, () => writeState({ resultType: TYPE_WORDS, intType: SIGNED, writeIntType: SIGNED }));

    assert.strictEqual(parseTarget('#to=words'), TYPE_WORDS);
    assert.deepStrictEqual(links, ['/#to=words&in=signed']);
});

test('the spelling of a uuid travels in the link only when it is not the plain one', async (t) => {
    const links = [];
    const win = {
        location: { pathname: '/', search: '', hash: '' },
        history: { replaceState: (a, b, url) => links.push(url) },
    };

    withWindow(win, () => {
        writeState({ resultType: TYPE_UUID, intType: SIGNED, writeIntType: SIGNED, uuidStyle: 'plain', uuidUpper: false });
        writeState({ resultType: TYPE_UUID, intType: SIGNED, writeIntType: SIGNED, uuidStyle: 'braces', uuidUpper: true });
        writeState({ resultType: TYPE_UUID, intType: SIGNED, writeIntType: SIGNED, uuidStyle: 'urn', uuidUpper: false });
    });

    assert.deepStrictEqual(links, [
        '/#to=uuid&in=signed',
        '/#to=uuid&in=signed&style=braces&case=upper',
        '/#to=uuid&in=signed&style=urn',
    ]);
});

test('a link says which spelling it carries', async (t) => {
    assert.strictEqual(parseUuidStyle('#to=uuid&style=braces'), 'braces');
    assert.strictEqual(parseUuidStyle('#to=uuid&style=URN'), 'urn');
    assert.strictEqual(parseUuidStyle('#to=uuid&style=nonsense'), null);
    assert.strictEqual(parseUuidStyle('#to=uuid'), null);
    assert.strictEqual(parseUuidUpper('#to=uuid&case=upper'), true);
    assert.strictEqual(parseUuidUpper('#to=uuid'), false);
});

test('a link written when hex was a format still opens on hex', async (t) => {
    assert.strictEqual(parseTarget('#to=hex'), TYPE_HEX);
    assert.strictEqual(parseUuidStyle('#to=uuid&style=hex'), 'hex');
});

test('every format the tool can produce has a slug a link can carry', async (t) => {
    const types = uuidTypeList().reduce((held, name, type) => held.concat([[name, type]]), []);

    assert.ok(types.length > 0);

    for (const [name, type] of types) {
        const slug = targetSlug(type);

        assert.notStrictEqual(slug, null, `${name} has no slug`);
        assert.strictEqual(parseTarget(`#to=${slug}`), type, `${slug} does not round-trip`);
    }
});
