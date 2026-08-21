import assert from 'node:assert';
import test from 'node:test';
import { PAGES } from '../scripts/pages/pages.data.mjs';
import { renderPage } from '../scripts/pages/render.mjs';
import { convert, exampleValue } from '../scripts/pages/examples.mjs';
import { fromUuid } from '../src/from-uuid.js';
import { SIGNED, UNSIGNED } from '../src/int-type.js';
import { TYPE_HIGH_LOW } from '../src/type-detector.js';
import { uuidToInts, uuidToUints } from '../src/uuid-high-low.js';
import { mysqlSwapped } from '../scripts/pages/tables.mjs';
import { NAMESPACES } from '../src/uuid-names.js';
import { timestampFromUuid } from '../src/uuid-timestamp.js';
import { toUuid } from '../src/to-uuid.js';
import { GENERATORS, collisionCount, collisionOdds, convertMany, generate } from '../src/docs-runtime-core.js';

const titles = new Map(PAGES.map(page => [page.slug, page.h1]));
const context = { hubTitle: titles.get('reference'), titleOf: slug => titles.get(slug) };

function escaped(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

test('every worked example is what the converter would produce', async (t) => {
    for (const page of PAGES) {
        if (page.example === undefined) {
            continue;
        }

        const html = renderPage(page, context);

        for (const item of page.example.cases) {
            const expected = exampleValue(item.uuid, page.example);

            assert.ok(expected.length > 0, `${page.slug}: ${item.uuid} converts to nothing`);
            assert.ok(html.includes(escaped(expected)), `${page.slug}: ${item.uuid} is documented as something else`);
        }
    }
});

test('the documented sign rule holds for the pair the page shows', async (t) => {
    const pairs = [
        ['f81d4fae-7dec-11d0-a765-00a0c91e6bf6', '17878533706586264016', '-568210367123287600'],
        ['0c5b2444-70a0-4932-980c-b4dc0d3f02b5', '890345227701733682', '890345227701733682'],
    ];

    for (const [uuid, unsigned, java] of pairs) {
        assert.strictEqual(uuidToUints(uuid).high, unsigned);
        assert.strictEqual(BigInt.asIntN(64, BigInt(unsigned)).toString(), java);
    }
});

test('the two readings differ exactly as the page says they do', async (t) => {
    const uuid = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    const big = BigInt(uuidToUints(uuid).high);
    const little = BigInt.asUintN(64, BigInt(uuidToInts(uuid).high));

    const bytes = big.toString(16).padStart(16, '0').match(/../g);
    const swapped = BigInt(`0x${bytes.reverse().join('')}`);

    assert.strictEqual(little, swapped);
    assert.strictEqual(
        fromUuid(uuid, { resultType: TYPE_HIGH_LOW, intType: UNSIGNED }),
        JSON.stringify(uuidToUints(uuid))
    );
    assert.strictEqual(
        fromUuid(uuid, { resultType: TYPE_HIGH_LOW, intType: SIGNED }),
        JSON.stringify(uuidToInts(uuid))
    );
});

test('the documented protobuf pair is the reading the tool writes', async (t) => {
    const documented = [
        ['f81d4fae-7dec-11d0-a765-00a0c91e6bf6', '-3453719414676972040', '-690424266549598809'],
        ['01890a5d-ac96-774b-bcce-b302099a8057', '5437980742112676097', '6305208841809415868'],
        ['0c5b2444-70a0-4932-980c-b4dc0d3f02b5', '3623603779236289292', '-5403687274121261928'],
    ];

    const page = PAGES.find(held => held.slug === 'uuid-to-long');
    const html = renderPage(page, context);

    for (const [uuid, high, low] of documented) {
        assert.deepStrictEqual(uuidToInts(uuid), { high, low }, uuid);
        assert.ok(html.includes(high) && html.includes(low), `${uuid} is documented as something else`);
    }
});

test('the pages point at the protobuf definition and its implementation', async (t) => {
    const links = [
        'https://github.com/bavix/apis/blob/master/bavix/api/v1/uuid.proto',
        'https://github.com/bavix/apis/blob/master/pkg/uuidconv/uuid.go',
        'https://github.com/bavix/apis',
    ];

    const html = renderPage(PAGES.find(held => held.slug === 'uuid-to-long'), context);

    for (const href of links) {
        assert.ok(html.includes(`href="${href}"`), `missing ${href}`);
    }
});

test('the MySQL swap matches the example in the MySQL manual', async (t) => {
    assert.strictEqual(mysqlSwapped('6ccd780c-baba-1026-9564-5b8c656024db'), '1026baba6ccd780c95645b8c656024db');
});

test('four words are the identifier cut into big-endian quarters', async (t) => {
    const uuid = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
    const hex = uuid.replace(/-/g, '');
    const quarters = [0, 8, 16, 24].map(at => Number.parseInt(hex.slice(at, at + 8), 16));

    assert.deepStrictEqual(JSON.parse(convert(uuid, { to: 'words', int: 'unsigned' })), {
        w1: quarters[0], w2: quarters[1], w3: quarters[2], w4: quarters[3],
    });

    assert.deepStrictEqual(JSON.parse(convert(uuid, { to: 'words', int: 'signed' })), {
        w1: -132296786, w2: 2112623056, w3: -1486552928, w4: -920753162,
    });
});

test('a swapped identifier cannot be spotted by its version nibble alone', async (t) => {
    const swapped = (uuid) => {
        const bytes = uuid.replace(/-/g, '').match(/../g);

        return [
            ...bytes.slice(0, 4).reverse(),
            ...bytes.slice(4, 6).reverse(),
            ...bytes.slice(6, 8).reverse(),
            ...bytes.slice(8),
        ].join('');
    };

    const seen = new Set();

    for (const uuid of ['0c5b2444-70a0-4932-980c-b4dc0d3f02b5', '06b01cbc-8d90-46ca-bdb4-e030d28dfd3a', '01890a5d-ac96-774b-bcce-b302099a8057']) {
        seen.add(swapped(uuid)[12]);
    }

    assert.ok(seen.size > 1, 'the page claims the swapped version nibble scatters');
    assert.strictEqual(swapped('f81d4fae-7dec-11d0-a765-00a0c91e6bf6'), 'ae4f1df8ec7dd011a76500a0c91e6bf6');
});

test('the lengths and alphabets the pages quote are the ones the tool produces', async (t) => {
    const uuid = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';

    assert.strictEqual(convert(uuid, { to: 'base64' }).length, 24);
    assert.strictEqual(convert(uuid, { to: 'base64', style: 'url' }).length, 22);
    assert.ok(!convert(uuid, { to: 'base64', style: 'url' }).includes('='));
    assert.strictEqual(convert(uuid, { to: 'uuid', style: 'hex' }).length, 32);
    assert.strictEqual(convert(uuid, { to: 'uuid', style: 'braces' }).length, 38);
    assert.strictEqual(convert(uuid, { to: 'uuid', style: 'urn' }).length, 45);
    assert.strictEqual(convert(uuid, { to: 'ulid' }).length, 26);
    assert.ok(!/[ILOU]/.test(convert(uuid, { to: 'ulid' })), 'Crockford base32 drops I, L, O and U');
    assert.strictEqual(JSON.parse(convert(uuid, { to: 'bytes' })).length, 16);
    assert.ok(convert('01890a5d-ac96-774b-bcce-b302099a8057', { to: 'ulid' })[0] <= '7');
});

test('the namespace ids on the page are the four the standard registers', async (t) => {
    assert.strictEqual(NAMESPACES.dns, '6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    assert.strictEqual(NAMESPACES.url, '6ba7b811-9dad-11d1-80b4-00c04fd430c8');
    assert.strictEqual(NAMESPACES.oid, '6ba7b812-9dad-11d1-80b4-00c04fd430c8');
    assert.strictEqual(NAMESPACES.x500, '6ba7b814-9dad-11d1-80b4-00c04fd430c8');
    assert.ok(!Object.values(NAMESPACES).some(id => id.startsWith('6ba7b813')), 'there is no 813');
});

test('the registered namespaces carry the one instant the page quotes', async (t) => {
    for (const id of Object.values(NAMESPACES)) {
        assert.strictEqual(timestampFromUuid(id), '1998-02-04T22:13:53.151Z', id);
    }
});

test('a pair read back with the wrong reading gives the identifier the page names', async (t) => {
    const pair = JSON.stringify(uuidToUints('f81d4fae-7dec-11d0-a765-00a0c91e6bf6'));

    assert.strictEqual(toUuid(pair, UNSIGNED), 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6');
    assert.strictEqual(toUuid(pair, SIGNED), 'd011ec7d-ae4f-1df8-f66b-1ec9a00065a7');
});

test('the bulk reader keeps comments, as the page promises', async (t) => {
    const rows = convertMany('f81d4fae-7dec-11d0-a765-00a0c91e6bf6 # the row that broke\nnonsense', { to: 'base64' });

    assert.strictEqual(rows.length, 2);
    assert.deepStrictEqual(rows[0], {
        input: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
        comment: 'the row that broke',
        output: '+B1Prn3sEdCnZQCgyR5r9g==',
        ok: true,
    });
    assert.strictEqual(rows[1].ok, false);
});

test('the generators the page lists are the generators the runtime has', async (t) => {
    assert.deepStrictEqual(GENERATORS, ['v1', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'nil', 'max', 'ulid', 'deadbeef', 'cafebabe', 'palindrome']);

    for (const type of GENERATORS) {
        const held = generate(type, { name: 'example.com', namespace: 'dns' });

        assert.ok(typeof held === 'string' && held.length >= 26, `${type} produced nothing`);
    }

    assert.strictEqual(generate('v3', { name: '' }), null, 'v3 needs a name');
});

test('the collision numbers on the page are the ones the calculator gives', async (t) => {
    assert.strictEqual(collisionCount(0.5).toExponential(1), '2.7e+18');
    assert.strictEqual(collisionCount(1e-9).toExponential(1), '1.0e+14');
    assert.strictEqual(collisionCount(1e-6).toExponential(1), '3.3e+15');
    assert.ok(collisionOdds(1e14) > 9e-10 && collisionOdds(1e14) < 1.1e-9);
});

test('a worked example may start from any format the tool reads', async (t) => {
    const target = { to: 'uuid' };

    assert.strictEqual(convert('f81d4fae7dec11d0a76500a0c91e6bf6', target), 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6');
    assert.strictEqual(convert('{01890a5d-ac96-774b-bcce-b302099a8057}', target), '01890a5d-ac96-774b-bcce-b302099a8057');
    assert.strictEqual(convert('AYkKXayWd0u8zrMCCZqAVw==', target), '01890a5d-ac96-774b-bcce-b302099a8057');
    assert.strictEqual(convert('7R3N7TWZFC278AES80M34HWTZP', target), 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6');
    assert.throws(() => convert('nonsense', target), /cannot read/);
});
