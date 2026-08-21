'use strict';

import { parseIntType, parseTarget, parseUuidStyle } from '../../src/url-state.js';

function ensureSlash(url) {
    return url.endsWith('/') ? url : `${url}/`;
}

export const SITE_URL = ensureSlash(process.env.SITE_URL || 'https://bavix.github.io/uuid-ui/');
export const SITE_NAME = 'UUIDConv';
export const SITE_TAGLINE = 'UUID converter and generator that runs in your browser';
export const REPO_URL = 'https://github.com/bavix/uuid-ui';
export const DOCKER_URL = 'https://hub.docker.com/r/bavix/uuid-ui';
export const AUTHOR_NAME = 'Babichev Maksim';
export const AUTHOR_URL = 'https://github.com/rez1dent3';
export const OG_IMAGE = `${SITE_URL}og.png`;
export const HUB_SLUG = 'reference';

export function pageUrl(slug) {
    return slug === '' ? SITE_URL : `${SITE_URL}${slug}/`;
}

export function toolHash(cta) {
    if (!cta || typeof cta.to !== 'string') {
        return '';
    }

    if (parseTarget(`#to=${cta.to}`) === null) {
        throw new Error(`unknown target format: ${cta.to}`);
    }

    let hash = `#to=${cta.to}`;

    if (typeof cta.int === 'string') {
        if (parseIntType(`#in=${cta.int}`) === null) {
            throw new Error(`unknown int reading: ${cta.int}`);
        }

        hash += `&in=${cta.int}`;
    }

    if (typeof cta.style === 'string') {
        if (parseUuidStyle(`#style=${cta.style}`) === null) {
            throw new Error(`unknown spelling: ${cta.style}`);
        }

        hash += `&style=${cta.style}`;
    }

    if (cta.upper === true) {
        hash += '&case=upper';
    }

    return hash;
}

export function toolLink(cta) {
    return `../${toolHash(cta)}`;
}

export function docLink(slug) {
    return `../${slug}/`;
}
