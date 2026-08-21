'use strict';

import { TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_UUID, TYPE_WORDS } from './type-detector.js';

export const DOC_HUB = 'reference';

export const DOC_PAGES = {
    [TYPE_UUID]: { slug: 'uuid-formats', label: 'Dashes, braces, urn:uuid and capitals' },
    [TYPE_BASE64]: { slug: 'uuid-to-base64', label: 'Why Base64 is 22 characters' },
    [TYPE_BYTES]: { slug: 'uuid-to-bytes', label: 'Which byte holds the version' },
    [TYPE_HIGH_LOW]: { slug: 'uuid-to-long', label: 'Why the pair comes out negative' },
    [TYPE_WORDS]: { slug: 'uuid-to-words', label: 'Where four 32-bit words show up' },
    [TYPE_ULID]: { slug: 'ulid', label: 'What a ULID carries, and how it maps to a UUID' },
};

export function docFor(type) {
    return DOC_PAGES[type] ?? { slug: DOC_HUB, label: 'UUID reference' };
}

export function docHref(slug) {
    return `./${slug}/`;
}
