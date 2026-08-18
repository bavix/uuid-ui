import assert from 'node:assert';
import test from 'node:test';
import { factsAbout } from '../src/lab.js';
import { normalizeInput } from '../src/normalize-input.js';
import { toUuid } from '../src/to-uuid.js';
import { SIGNED, UNSIGNED } from '../src/int-type.js';

const UUIDS = [
    '71a46cec-4809-4cc5-9689-5b0441b46186',
    'deadbeef-dead-beef-dead-beefdeadbeef',
    '01000000-0000-0000-8084-1e0000000000',
    '00000000-0000-0000-0000-000000000000',
];

function spellingsOf(uuid) {
    const hex = uuid.replace(/-/g, '');
    const version = parseInt(hex[12], 16);
    const held = Object.fromEntries(factsAbout(uuid, hex, version));

    return held['The same value, other spellings'];
}

test('every spelling the report lists reads back as the identifier it describes', async (t) => {
    // Two of the rows are deliberately other conventions: .NET order is a
    // different identifier read as RFC bytes, and the C struct is source code.
    const aside = ['Bytes, .NET order', 'C struct'];

    for (const uuid of UUIDS) {
        const rows = spellingsOf(uuid);

        assert.ok(rows.length > 10, `${uuid} lists too few spellings`);

        for (const row of rows) {
            if (aside.includes(row.label ?? row[0])) {
                continue;
            }

            const text = row.value ?? row[1];
            const normal = normalizeInput(text);

            assert.notStrictEqual(normal, null, `${uuid}: the report writes ${text} and the box refuses it`);
            assert.ok(
                toUuid(normal, SIGNED) === uuid || toUuid(normal, UNSIGNED) === uuid,
                `${uuid}: the report writes ${text}, which reads as something else`,
            );
        }
    }
});

test('the report writes whole numbers bare, the way the app does', async (t) => {
    for (const uuid of UUIDS) {
        for (const row of spellingsOf(uuid)) {
            const label = row.label ?? row[0];
            const text = row.value ?? row[1];

            if (/high\/low|words/i.test(label)) {
                assert.ok(!/"-?\d+"/.test(text), `${label} quotes its numbers: ${text}`);
            }
        }
    }
});
