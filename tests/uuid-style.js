import assert from 'node:assert';
import test from 'node:test';
import { STYLE_BRACES, STYLE_HEX, STYLE_PLAIN, STYLE_URN, styleUuid } from '../src/uuid-style.js';
import { spellingsOf } from '../src/spellings.js';
import { toUuid } from '../src/to-uuid.js';
import { SIGNED } from '../src/int-type.js';
import { TYPE_UUID, typeDetector, uuidTypeList } from '../src/type-detector.js';

const UUID = '71a46cec-4809-4cc5-9689-5b0441b46186';

test('the three spellings are the same identifier written three ways', async (t) => {
    assert.strictEqual(styleUuid(UUID, STYLE_PLAIN), UUID);
    assert.strictEqual(styleUuid(UUID, STYLE_BRACES), `{${UUID}}`);
    assert.strictEqual(styleUuid(UUID, STYLE_URN), `urn:uuid:${UUID}`);
});

test('capitals are what the Windows registry writes', async (t) => {
    assert.strictEqual(styleUuid(UUID, STYLE_BRACES, true), '{71A46CEC-4809-4CC5-9689-5B0441B46186}');
    assert.strictEqual(styleUuid(UUID, STYLE_PLAIN, true), '71A46CEC-4809-4CC5-9689-5B0441B46186');
});

test('an identifier already in capitals comes back in the case that was asked for', async (t) => {
    assert.strictEqual(styleUuid(UUID.toUpperCase(), STYLE_PLAIN, false), UUID);
});

test('nothing to write stays nothing', async (t) => {
    assert.strictEqual(styleUuid('', STYLE_BRACES), '');
    assert.strictEqual(styleUuid(null, STYLE_BRACES), null);
});

test('the uuid spellings are the four the control offers', async (t) => {
    assert.deepStrictEqual(spellingsOf(TYPE_UUID).map(option => option.id), ['plain', 'hex', 'braces', 'urn']);
});

test('hex is a spelling like the others, not a format of its own', async (t) => {
    assert.strictEqual(styleUuid(UUID, STYLE_HEX), '71a46cec48094cc596895b0441b46186');
    assert.strictEqual(styleUuid(UUID, STYLE_HEX, true), '71A46CEC48094CC596895B0441B46186');
});

test('every spelling reads back as the same identifier, so the row carries its own meaning', async (t) => {
    for (const style of spellingsOf(TYPE_UUID).map(option => option.id)) {
        for (const upper of [false, true]) {
            const written = styleUuid(UUID, style, upper);

            assert.strictEqual(toUuid(written, SIGNED), UUID, `${style}${upper ? ' upper' : ''}`);
            assert.strictEqual(typeDetector(written), TYPE_UUID, `${style}${upper ? ' upper' : ''}`);
        }
    }
});

test('the format list no longer offers hex as a target', async (t) => {
    assert.deepStrictEqual(uuidTypeList().filter(Boolean), ['uuid', 'high-low', 'base64', 'bytes', 'ulid', 'words']);
});
