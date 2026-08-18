import assert from 'node:assert';
import test from 'node:test';
import { version as versionOf, validate } from 'uuid';
import { v8 } from '../src/uuid-v8.js';
import { DEFAULT_NAME, NAMESPACES, nameBased, namespaceOf } from '../src/uuid-names.js';

test('version 8 is a valid identifier that says it is version 8', async (t) => {
    for (let i = 0; i < 50; i += 1) {
        const uuid = v8();

        assert.ok(validate(uuid), uuid);
        assert.strictEqual(versionOf(uuid), 8, uuid);
        assert.match(uuid[19], /[89ab]/, `variant bits in ${uuid}`);
    }
});

test('two version 8 identifiers differ', async (t) => {
    assert.notStrictEqual(v8(), v8());
});

test('the name-based versions match the vectors everybody publishes', async (t) => {
    assert.strictEqual(nameBased(3, 'dns', 'www.example.com'), '5df41881-3aed-3515-88a7-2f4a814cf09e');
    assert.strictEqual(nameBased(5, 'dns', 'www.example.com'), '2ed6657d-e927-568b-95e1-2665a8aea6a2');
});

test('the same namespace and name always give the same identifier', async (t) => {
    assert.strictEqual(nameBased(5, 'url', 'https://bavix.ru'), nameBased(5, 'url', 'https://bavix.ru'));
    assert.notStrictEqual(nameBased(5, 'url', 'https://bavix.ru'), nameBased(5, 'dns', 'https://bavix.ru'));
});

test('a namespace can be one of the four named ones or any identifier', async (t) => {
    assert.strictEqual(namespaceOf('dns'), NAMESPACES.dns);
    assert.strictEqual(namespaceOf('X500'), NAMESPACES.x500);
    assert.strictEqual(namespaceOf('71A46CEC-4809-4CC5-9689-5B0441B46186'), '71a46cec-4809-4cc5-9689-5b0441b46186');
    assert.strictEqual(namespaceOf('not a namespace'), null);
});

test('a name-based identifier needs a name', async (t) => {
    assert.strictEqual(nameBased(5, 'dns', ''), null);
    assert.strictEqual(nameBased(5, 'nonsense', DEFAULT_NAME), null);
});

test('a name-based version without a name produces nothing rather than a broken identifier', async (t) => {
    for (const version of [3, 5]) {
        assert.strictEqual(nameBased(version, 'dns', ''), null);
        assert.strictEqual(nameBased(version, 'dns', null), null);
        assert.strictEqual(nameBased(version, '', 'example.com'), null, 'an empty namespace is not the default one');
    }
});

test('a custom namespace is any identifier, in any spelling of it', async (t) => {
    const held = nameBased(5, '71a46cec-4809-4cc5-9689-5b0441b46186', 'thing');

    assert.ok(held);
    assert.strictEqual(nameBased(5, '71A46CEC-4809-4CC5-9689-5B0441B46186', 'thing'), held);
});
