import assert from 'node:assert';
import test from 'node:test';
import gist from '../src/sync/providers/gist.js';
import { SYNC_CODES } from '../src/sync/provider.js';

function response(status, { body = {}, headers = {}, text } = {}) {
    const map = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));

    return {
        ok: status >= 200 && status < 300,
        status,
        headers: { get: k => (map.has(k.toLowerCase()) ? map.get(k.toLowerCase()) : null) },
        json: async () => body,
        text: async () => (text === undefined ? JSON.stringify(body) : text),
    };
}

function sessionOf(handler, token = 'ghp_token') {
    const calls = [];

    const session = gist.create({ token }, {
        fetch: async (url, options) => {
            calls.push({ url, options });

            return handler(url, options, calls.length);
        },
    });

    return { session, calls };
}

const gistBody = (content, extra = {}) => ({
    id: 'abc123',
    files: { 'uuid-ui-data.json': { content, ...extra } },
    history: [{ version: 'sha-1' }],
});

test('the provider describes what it needs, so the UI does not have to know', (t) => {
    assert.strictEqual(gist.id, 'gist');
    assert.strictEqual(gist.needs.length, 1);
    assert.strictEqual(gist.needs[0].secret, true);
    assert.ok(gist.needs[0].warning.length > 0);
    assert.ok(gist.needs[0].link.href.startsWith('https://github.com/'));
});

test('every request carries the token and the pinned api version', async (t) => {
    const { session, calls } = sessionOf(() => response(200, {
        body: { login: 'bavix' }, headers: { 'x-oauth-scopes': 'gist' },
    }));

    assert.deepStrictEqual(await session.account(), { name: '@bavix', expires: null });
    assert.strictEqual(calls[0].options.headers.Authorization, 'Bearer ghp_token');
    assert.strictEqual(calls[0].options.headers.Accept, 'application/vnd.github+json');
    assert.strictEqual(calls[0].options.headers['X-GitHub-Api-Version'], '2022-11-28');
});

test('a pasted token keeps no stray whitespace', async (t) => {
    const { session, calls } = sessionOf(() => response(200, { body: { login: 'bavix' } }), '  ghp_token\n');

    await session.account();

    assert.strictEqual(calls[0].options.headers.Authorization, 'Bearer ghp_token');
});

test('a token without the gist scope is refused', async (t) => {
    const { session } = sessionOf(() => response(200, {
        body: { login: 'bavix' }, headers: { 'x-oauth-scopes': 'repo, read:org' },
    }));

    await assert.rejects(() => session.account(), (e) => e.code === SYNC_CODES.FORBIDDEN);
});

test('a fine-grained token sends no scope header and is fine', async (t) => {
    const { session } = sessionOf(() => response(200, { body: { login: 'bavix' } }));

    assert.deepStrictEqual(await session.account(), { name: '@bavix', expires: null });
});

test('failures come back as codes, not as HTTP', async (t) => {
    await assert.rejects(
        () => sessionOf(() => response(401, { body: { message: 'Bad credentials' } })).session.account(),
        (e) => e.code === SYNC_CODES.UNAUTHORIZED,
    );

    await assert.rejects(
        () => sessionOf(() => response(404, {})).session.read('abc123'),
        (e) => e.code === SYNC_CODES.MISSING,
    );

    const reset = Math.floor(Date.now() / 1000) + 600;
    await assert.rejects(
        () => sessionOf(() => response(403, {
            headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(reset) },
        })).session.read('abc123'),
        (e) => e.code === SYNC_CODES.RATE_LIMITED && e.minutes === 10,
    );

    await assert.rejects(
        () => sessionOf(() => { throw new TypeError('Failed to fetch'); }).session.read('abc123'),
        (e) => e.code === SYNC_CODES.OFFLINE,
    );
});

test('an unchanged gist is one conditional request and no parsing', async (t) => {
    const { session, calls } = sessionOf(() => response(304, {}));
    const cursor = JSON.stringify({ etag: 'W/"1"', version: 'sha-1' });

    assert.deepStrictEqual(await session.read('abc123', cursor), { unchanged: true });
    assert.strictEqual(calls[0].options.headers['If-None-Match'], 'W/"1"');
});

test('reading reports whether the base we held still stands', async (t) => {
    const answer = () => response(200, { body: gistBody('{"app":"uuid-ui"}'), headers: { etag: 'W/"1"' } });

    const fresh = await sessionOf(answer).session.read('abc123', JSON.stringify({ etag: 'W/"0"', version: 'sha-1' }));
    assert.strictEqual(fresh.staleBase, false);
    assert.strictEqual(fresh.content, '{"app":"uuid-ui"}');
    assert.deepStrictEqual(JSON.parse(fresh.cursor), { etag: 'W/"1"', version: 'sha-1' });

    const moved = await sessionOf(answer).session.read('abc123', JSON.stringify({ etag: 'W/"0"', version: 'sha-0' }));
    assert.strictEqual(moved.staleBase, true);

    const first = await sessionOf(answer).session.read('abc123', null);
    assert.strictEqual(first.staleBase, true);
});

test('a file GitHub truncated is fetched whole', async (t) => {
    const { session, calls } = sessionOf((url) => {
        if (url.startsWith('https://api.github.com')) {
            return response(200, {
                body: gistBody('cut off…', { truncated: true, raw_url: 'https://gist.githubusercontent.com/raw' }),
            });
        }

        return response(200, { text: '{"app":"uuid-ui","items":[]}' });
    });

    const read = await session.read('abc123', null);

    assert.strictEqual(read.content, '{"app":"uuid-ui","items":[]}');
    assert.strictEqual(calls[1].url, 'https://gist.githubusercontent.com/raw');
});

test('a gist without our file says so', async (t) => {
    const { session } = sessionOf(() => response(200, { body: { id: 'abc123', files: { 'notes.md': {} } } }));

    await assert.rejects(() => session.read('abc123', null), (e) => e.code === SYNC_CODES.NO_TARGET);
});

test('the first write creates a secret gist, later ones patch it', async (t) => {
    const { session, calls } = sessionOf(() => response(200, {
        body: { id: 'abc123', history: [{ version: 'sha-2' }] }, headers: { etag: 'W/"2"' },
    }));

    const created = await session.write(null, '{}');

    assert.strictEqual(calls[0].url, 'https://api.github.com/gists');
    assert.strictEqual(calls[0].options.method, 'POST');
    assert.strictEqual(JSON.parse(calls[0].options.body).public, false);
    assert.strictEqual(created.target, 'abc123');
    assert.deepStrictEqual(JSON.parse(created.cursor), { etag: 'W/"2"', version: 'sha-2' });

    await session.write('abc123', '{}');

    assert.strictEqual(calls[1].url, 'https://api.github.com/gists/abc123');
    assert.strictEqual(calls[1].options.method, 'PATCH');
    assert.strictEqual(JSON.parse(calls[1].options.body).public, undefined);
    assert.ok(JSON.parse(calls[1].options.body).files['uuid-ui-data.json']);
});

test('locating reports only gists that hold our file', async (t) => {
    const { session, calls } = sessionOf(() => response(200, {
        body: [
            { id: '1', files: { 'other.json': {} } },
            { id: '2', description: 'UUID UI - Sync Data', updated_at: '2026-08-16T10:00:00Z', files: { 'uuid-ui-data.json': {} } },
        ],
    }));

    assert.deepStrictEqual(await session.locate(), [
        { targetId: '2', label: 'UUID UI - Sync Data', updatedAt: '2026-08-16T10:00:00Z' },
    ]);
    assert.ok(calls[0].url.includes('per_page=100'));
});

test('the provider can point a browser at the target without a session', (t) => {
    assert.strictEqual(gist.link('abc123'), 'https://gist.github.com/abc123');
    assert.strictEqual(gist.link(null), null);
});

test('the token expiry github reports comes back with the account', async (t) => {
    const call = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({
            'x-oauth-scopes': 'gist',
            'github-authentication-token-expiration': '2026-11-01 00:00:00 UTC',
        }),
        async json() {
            return { login: 'bavix' };
        },
    });

    const session = gist.create({ token: 'ghp_x' }, { fetch: call });

    assert.deepStrictEqual(await session.account(), {
        name: '@bavix',
        expires: '2026-11-01 00:00:00 UTC',
    });
});

test('a key with characters a token never has is refused before any request', async (t) => {
    let called = 0;
    const session = gist.create({ token: 'ghp_абв' }, { fetch: async () => { called += 1; } });

    await assert.rejects(() => session.account(), error => error.code === SYNC_CODES.UNAUTHORIZED);
    assert.strictEqual(called, 0, 'nothing was sent');
});

test('an empty key is refused the same way', async (t) => {
    const session = gist.create({ token: '   ' }, { fetch: async () => ({ ok: true }) });

    await assert.rejects(() => session.account(), error => error.code === SYNC_CODES.UNAUTHORIZED);
});

test('a browser that refuses to send the request does not read as being offline', async (t) => {
    const session = gist.create({ token: 'ghp_x' }, {
        fetch: async () => { throw new TypeError('Failed to read the \'headers\' property'); },
    });

    await assert.rejects(() => session.account(), error => error.code === SYNC_CODES.REFUSED);
});

test('a real network failure still reads as being offline', async (t) => {
    const session = gist.create({ token: 'ghp_x' }, {
        fetch: async () => { throw new TypeError('Failed to fetch'); },
    });

    await assert.rejects(() => session.account(), error => error.code === SYNC_CODES.OFFLINE);
});
