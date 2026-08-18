import assert from 'node:assert';
import test from 'node:test';
import { v1, v6, v7 } from 'uuid';
import { isTimed, momentOptions, toFieldValue, isNamed} from '../src/generate-at.js';
import { timestampFromUuid } from '../src/uuid-timestamp.js';

test('only the clock-carrying types can be aimed', (t) => {
    assert.ok(isTimed('v1') && isTimed('v6') && isTimed('v7') && isTimed('ulid'));
    assert.ok(!isTimed('v4') && !isTimed('nil') && !isTimed('deadbeef'));
});

test('an empty or broken field means now', (t) => {
    assert.deepStrictEqual(momentOptions(''), {});
    assert.deepStrictEqual(momentOptions('   '), {});
    assert.deepStrictEqual(momentOptions('not a date'), {});
    assert.deepStrictEqual(momentOptions(undefined), {});
});

test('the field is read as local time', (t) => {
    const value = '2024-05-03T01:09:44.064';
    const expected = new Date(2024, 4, 3, 1, 9, 44, 64).getTime();

    assert.deepStrictEqual(momentOptions(value), { msecs: expected });
});

test('what is generated at a moment reads back as that moment', (t) => {
    const options = momentOptions('2001-02-03T04:05:06.789');

    for (const generate of [v1, v6, v7]) {
        const uuid = generate(options);
        assert.strictEqual(timestampFromUuid(uuid), new Date(options.msecs).toISOString());
    }
});

test('a field value round-trips through the field format', (t) => {
    const date = new Date(2024, 4, 3, 1, 9, 44, 64);

    assert.strictEqual(toFieldValue(date), '2024-05-03T01:09:44.064');
    assert.deepStrictEqual(momentOptions(toFieldValue(date)), { msecs: date.getTime() });
});

test('the name-based versions are the ones that ask for a name', async (t) => {
    assert.strictEqual(isNamed('v3'), true);
    assert.strictEqual(isNamed('v5'), true);
    for (const type of ['v1', 'v4', 'v6', 'v7', 'v8', 'nil', 'ulid']) {
        assert.strictEqual(isNamed(type), false, type);
    }
});
