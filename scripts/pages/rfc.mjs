'use strict';

const RFC9562 = {
    '4': 'UUID Format',
    '4.1': 'Variant Field',
    '4.2': 'Version Field',
    '5': 'UUID Layouts',
    '5.1': 'UUID Version 1',
    '5.2': 'UUID Version 2',
    '5.3': 'UUID Version 3',
    '5.4': 'UUID Version 4',
    '5.5': 'UUID Version 5',
    '5.6': 'UUID Version 6',
    '5.7': 'UUID Version 7',
    '5.8': 'UUID Version 8',
    '5.9': 'Nil UUID',
    '5.10': 'Max UUID',
    '6.1': 'Timestamp Considerations',
    '6.2': 'Monotonicity and Counters',
    '6.3': 'UUID Generator States',
    '6.4': 'Distributed UUID Generation',
    '6.5': 'Name-Based UUID Generation',
    '6.6': 'Namespace ID Usage and Allocation',
    '6.7': 'Collision Resistance',
    '6.8': 'Global and Local Uniqueness',
    '6.9': 'Unguessability',
    '6.10': 'UUIDs That Do Not Identify the Host',
    '6.11': 'Sorting',
    '6.12': 'Opacity',
    '6.13': 'DBMS and Database Considerations',
    '7.1': 'IANA UUID Subtype Registry and Registration',
    '7.2': 'IANA UUID Namespace ID Registry and Registration',
    '8': 'Security Considerations',
};

const RFC4122 = {
    '3': 'Namespace Registration Template',
    '4.1.2': 'Layout and Byte Order',
};

const RFC4648 = {
    '4': 'Base 64 Encoding',
    '5': 'Base 64 Encoding with URL and Filename Safe Alphabet',
};

const DOCS = {
    9562: { title: 'RFC 9562: Universally Unique IDentifiers (UUIDs)', sections: RFC9562 },
    4122: { title: 'RFC 4122 (obsoleted by RFC 9562)', sections: RFC4122 },
    4648: { title: 'RFC 4648: The Base16, Base32, and Base64 Data Encodings', sections: RFC4648 },
};

export function rfcRef(doc, section) {
    const held = DOCS[doc];

    if (held === undefined) {
        throw new Error(`unknown RFC: ${doc}`);
    }

    if (section === undefined) {
        return { url: `https://www.rfc-editor.org/rfc/rfc${doc}.html`, label: held.title };
    }

    const name = held.sections[section];

    if (name === undefined) {
        throw new Error(`RFC ${doc} has no section ${section} in the map`);
    }

    return {
        url: `https://www.rfc-editor.org/rfc/rfc${doc}.html#section-${section}`,
        label: `RFC ${doc} § ${section} · ${name}`,
    };
}
