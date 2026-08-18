'use strict';

import { SYNC_CODES, SyncError } from '../provider.js';

const API = 'https://api.github.com';
const API_VERSION = '2022-11-28';
const FILENAME = 'uuid-ui-data.json';
const DESCRIPTION = 'UUID UI - Sync Data';

function minutesUntil(reset) {
    const seconds = Number(reset) - Math.floor(Date.now() / 1000);

    return seconds > 0 ? Math.ceil(seconds / 60) : 1;
}

async function toError(response) {
    let detail = '';

    try {
        const parsed = await response.json();
        detail = typeof parsed?.message === 'string' ? parsed.message : '';
    } catch (e) {
        detail = '';
    }

    if (response.status === 401) {
        return new SyncError(SYNC_CODES.UNAUTHORIZED, detail || 'Bad credentials.');
    }

    if (response.status === 404) {
        return new SyncError(SYNC_CODES.MISSING, detail || 'The gist is gone.');
    }

    if (response.status === 403 || response.status === 429) {
        if (response.headers.get('x-ratelimit-remaining') === '0') {
            return new SyncError(SYNC_CODES.RATE_LIMITED, 'GitHub request limit reached.', {
                minutes: minutesUntil(response.headers.get('x-ratelimit-reset')),
            });
        }

        return new SyncError(SYNC_CODES.FORBIDDEN, detail || 'GitHub refused the request.');
    }

    return new SyncError(SYNC_CODES.REFUSED, detail || `GitHub answered ${response.status}.`);
}

function cursorOf(response, gist) {
    return JSON.stringify({
        etag: response.headers.get('etag') || null,
        version: gist?.history?.[0]?.version || null,
    });
}

function readCursor(cursor) {
    try {
        const parsed = JSON.parse(cursor);

        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
        return {};
    }
}

export default {
    id: 'gist',
    label: 'GitHub Gist',

    needs: [{
        name: 'token',
        label: 'Paste the token',
        secret: true,
        placeholder: 'ghp_… or github_pat_…',
        hint: 'Set an expiry when you make it.',
        warning: 'The key reaches every gist on the account — GitHub cannot narrow it to one.',
        link: {
            href: 'https://github.com/settings/tokens/new?scopes=gist&description=UUIDConv%20UI',
            label: 'Create one',
        },
    }],

    link(target) {
        return target ? `https://gist.github.com/${target}` : null;
    },

    create(credentials, deps = {}) {
        const token = (credentials?.token || '').trim();
        const call = deps.fetch || ((...args) => fetch(...args));

        if (token === '' || !/^[\x21-\x7e]+$/.test(token)) {
            return {
                async account() {
                    throw new SyncError(
                        SYNC_CODES.UNAUTHORIZED,
                        'That key holds characters a GitHub token never has. Copy it again, with nothing around it.',
                    );
                },
                async locate() {
                    return [];
                },
                async read() {
                    throw new SyncError(SYNC_CODES.UNAUTHORIZED, 'No usable key.');
                },
                async write() {
                    throw new SyncError(SYNC_CODES.UNAUTHORIZED, 'No usable key.');
                },
            };
        }

        function headers(extra) {
            return {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': API_VERSION,
                ...extra,
            };
        }

        async function request(url, options = {}) {
            try {
                return await call(url, { ...options, headers: headers(options.headers) });
            } catch (e) {
                if (e instanceof TypeError && !/fetch|network|load failed/i.test(e.message)) {
                    throw new SyncError(SYNC_CODES.REFUSED, 'The browser refused to send the request with that key.');
                }

                throw new SyncError(SYNC_CODES.OFFLINE, 'No connection to GitHub.');
            }
        }

        return {
            async account() {
                const response = await request(`${API}/user`);

                if (!response.ok) {
                    throw await toError(response);
                }

                const scopes = (response.headers.get('x-oauth-scopes') || '')
                    .split(',')
                    .map(scope => scope.trim())
                    .filter(Boolean);

                if (scopes.length > 0 && !scopes.includes('gist')) {
                    throw new SyncError(SYNC_CODES.FORBIDDEN, 'This token has no access to gists.');
                }

                const body = await response.json();

                return {
                    name: body?.login ? `@${body.login}` : 'GitHub',
                    expires: response.headers.get('github-authentication-token-expiration') || null,
                };
            },

            async locate() {
                const response = await request(`${API}/gists?per_page=100`);

                if (!response.ok) {
                    throw await toError(response);
                }

                const gists = await response.json();

                return (Array.isArray(gists) ? gists : [])
                    .filter(gist => gist?.files && gist.files[FILENAME])
                    .map(gist => ({
                        targetId: gist.id,
                        label: gist.description || gist.id,
                        updatedAt: gist.updated_at || '',
                    }));
            },

            async read(target, cursor) {
                const { etag, version } = readCursor(cursor);
                const response = await request(`${API}/gists/${target}`, {
                    headers: etag ? { 'If-None-Match': etag } : undefined,
                });

                if (response.status === 304) {
                    return { unchanged: true };
                }

                if (!response.ok) {
                    throw await toError(response);
                }

                const gist = await response.json();
                const file = gist?.files?.[FILENAME];

                if (!file) {
                    throw new SyncError(SYNC_CODES.NO_TARGET, 'That gist holds no UUIDConv UI data.');
                }

                let content = file.content || '';

                if (file.truncated && file.raw_url) {
                    const raw = await request(file.raw_url);

                    if (!raw.ok) {
                        throw await toError(raw);
                    }

                    content = await raw.text();
                }

                const now = gist?.history?.[0]?.version || null;

                return {
                    unchanged: false,
                    content,
                    cursor: cursorOf(response, gist),
                    staleBase: !version || !now || version !== now,
                };
            },

            async write(target, content) {
                const payload = {
                    description: DESCRIPTION,
                    files: { [FILENAME]: { content } },
                };

                if (!target) {
                    payload.public = false;
                }

                const response = await request(target ? `${API}/gists/${target}` : `${API}/gists`, {
                    method: target ? 'PATCH' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw await toError(response);
                }

                const gist = await response.json();

                return { target: gist?.id || target, cursor: cursorOf(response, gist) };
            },
        };
    },
};
