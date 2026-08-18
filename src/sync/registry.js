'use strict';

import browser from './providers/browser.js';

const PROVIDERS = {
    browser: {
        label: 'This browser',
        always: true,
        load: async () => ({ default: browser }),
    },
    gist: {
        label: 'GitHub Gist',
        load: () => import('./providers/gist.js'),
    },
};

export function listProviders() {
    return Object.entries(PROVIDERS).map(([id, provider]) => ({
        id,
        label: provider.label,
        always: Boolean(provider.always),
    }));
}

export function hasProvider(id) {
    return Object.prototype.hasOwnProperty.call(PROVIDERS, id);
}

export async function loadProvider(id) {
    if (!hasProvider(id)) {
        throw new Error(`Unknown sync provider: ${id}`);
    }

    const module = await PROVIDERS[id].load();

    return module.default;
}

export const DEFAULT_PROVIDER = 'gist';
