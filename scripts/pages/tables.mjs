'use strict';

import { fieldsFor } from '../../src/rfc9562.js';
import { STYLE_BRACES, STYLE_HEX, STYLE_PLAIN, STYLE_URN, styleUuid } from '../../src/uuid-style.js';
import { NAMESPACES, nameBased } from '../../src/uuid-names.js';

const KIND_NAMES = {
    time: 'timestamp',
    random: 'random',
    version: 'version',
    variant: 'variant',
    clock: 'clock sequence',
    node: 'node',
    hash: 'hash of the name',
};

const SPELLING_NOTES = {
    [STYLE_PLAIN]: 'The canonical form. What RFC 9562 writes and what every parser accepts.',
    [STYLE_HEX]: '.NET format N. What a CHAR(32) column and most cache keys hold.',
    [STYLE_BRACES]: '.NET format B. The Windows registry and COM write this.',
    [STYLE_URN]: 'A valid URN, for XML, RDF and anything that needs a URI.',
};

export function spellingRows(uuid) {
    const rows = [STYLE_PLAIN, STYLE_HEX, STYLE_BRACES, STYLE_URN]
        .map(style => [style, styleUuid(uuid, style), SPELLING_NOTES[style]]);

    rows.push(['upper case', styleUuid(uuid, STYLE_PLAIN, true), 'Case is not significant; Windows tools write capitals.']);

    return rows;
}

export function namespaceRows() {
    const notes = {
        dns: 'A host name: example.com',
        url: 'A URL: https://example.com/a',
        oid: 'An ISO OID: 1.3.6.1',
        x500: 'An X.500 distinguished name',
    };

    return Object.entries(NAMESPACES).map(([name, id]) => [name.toUpperCase(), id, notes[name]]);
}

export function nameRows(version) {
    return ['example.com', 'bavix.github.io', 'uuid-ui']
        .map(name => [name, nameBased(version, 'dns', name)]);
}

export function groupsOf(uuid) {
    const hex = uuid.replace(/-/g, '');

    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)];
}
export function mysqlSwapped(uuid) {
    const [a, b, c, d, e] = groupsOf(uuid);

    return `${c}${b}${a}${d}${e}`;
}

export function layoutRows(version) {
    return fieldsFor(version)
        .slice()
        .sort((left, right) => left[0] - right[0])
        .map(([from, to, kind, name]) => [name, `${from}-${to}`, String(to - from + 1), KIND_NAMES[kind]]);
}

const GENERATED = {
    layout: args => ({
        head: ['Field', 'Bits', 'Width', 'Kind'],
        rows: layoutRows(Number(args[0])),
    }),
    spellings: args => ({
        head: ['Spelling', args[1] ?? 'The same identifier', 'Where it is expected'],
        rows: spellingRows(args[0]),
    }),
    namespaces: () => ({
        head: ['Namespace', 'ID', 'What the name should be'],
        rows: namespaceRows(),
    }),
    names: args => ({
        head: [`Name (DNS namespace)`, `UUID v${args[0]}`],
        rows: nameRows(Number(args[0])),
    }),
    'mysql-swap': () => ({
        head: ['Identifier', 'Stored with flag 0', 'Stored with flag 1'],
        rows: ['01890a5d-ac96-774b-bcce-b302099a8057', 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6']
            .map(uuid => [uuid, uuid.replace(/-/g, ''), mysqlSwapped(uuid)]),
    }),
};

export function generatedTable(name, args = []) {
    const make = GENERATED[name];

    if (make === undefined) {
        throw new Error(`unknown generated table: ${name}`);
    }

    return { type: 'table', ...make(args) };
}
