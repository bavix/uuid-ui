'use strict';

import { v3, v5 } from 'uuid';

export const NAMESPACES = {
    dns: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    url: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    oid: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    x500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
};

export const DEFAULT_NAMESPACE = 'dns';
export const DEFAULT_NAME = 'example.com';

export function namespaceOf(value) {
    if (typeof value !== 'string') {
        return NAMESPACES[DEFAULT_NAMESPACE];
    }

    const named = NAMESPACES[value.toLowerCase()];

    if (named) {
        return named;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
        ? value.trim().toLowerCase()
        : null;
}

export function nameBased(version, namespace, name) {
    const held = namespaceOf(namespace);

    if (held === null || typeof name !== 'string' || name === '') {
        return null;
    }

    try {
        return version === 3 ? v3(name, held) : v5(name, held);
    } catch (e) {
        return null;
    }
}
