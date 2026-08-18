import assert from 'node:assert';
import test from 'node:test';
import { MAX_BYTES, TOKEN_NAMES, readTheme } from '../src/themes/custom.js';
import { gradeTheme } from '../src/themes/contrast.js';

// The module asks the browser whether a value is a colour; node has no CSS
// object, so the tests give it one that knows the same rules the browser does.
globalThis.CSS = {
    supports: (property, value) => {
        if (property === 'color') {
            return /^#[0-9a-f]{3,8}$/i.test(value)
                || /^rgba?\([\d\s.,%/]+\)$/i.test(value)
                || /^hsla?\([\d\s.,%/deg]+\)$/i.test(value)
                || ['red', 'black', 'white', 'transparent'].includes(value);
        }

        if (property === 'box-shadow') {
            return /^[\d\s.a-z()#,%/-]+$/i.test(value) && /\d/.test(value);
        }

        if (property === 'filter') {
            return /^[a-z]+\([^()]*\)(\s+[a-z]+\([^()]*\))*$/i.test(value);
        }

        if (property === 'font-family') {
            return /^[\w\s,'"-]+$/.test(value);
        }

        return false;
    },
};

const theme = (tokens, extra = {}) => JSON.stringify({ name: 'Mine', mode: 'dark', tokens, ...extra });

test('a theme of colours is read back', async (t) => {
    const { theme: held, problems } = readTheme(theme({ surface: '#101418', ink: 'rgb(240, 240, 240)' }));

    assert.deepStrictEqual(problems, []);
    assert.strictEqual(held.name, 'Mine');
    assert.strictEqual(held.mode, 'dark');
    assert.deepStrictEqual(held.tokens, { surface: '#101418', ink: 'rgb(240, 240, 240)' });
});

test('a token this build never heard of is dropped, and said out loud', async (t) => {
    const { theme: held, problems } = readTheme(theme({ surface: '#fff', 'evil-token': '#fff' }));

    assert.deepStrictEqual(Object.keys(held.tokens), ['surface']);
    assert.match(problems.join(' '), /evil-token/);
});

test('anything that could fetch or nest is refused', async (t) => {
    for (const value of ['url(http://x/y.png)', 'image-set(url(a.png))', 'var(--ink)', 'red; background: url(x)']) {
        const { theme: held, problems } = readTheme(theme({ surface: value }));

        assert.strictEqual(held, null, `${value} should not survive`);
        assert.match(problems.join(' '), /plain values|Nothing usable/);
    }
});

test('a shape token has to look like a shape', async (t) => {
    const good = readTheme(theme({ 'radius-md': '4px', 'title-transform': 'uppercase', 'bit-mix': '30%', 'signature-time': '180ms' }));

    assert.deepStrictEqual(good.problems, []);
    assert.strictEqual(Object.keys(good.theme.tokens).length, 4);

    const bad = readTheme(theme({ 'radius-md': 'huge', 'title-transform': 'sideways' }));

    assert.strictEqual(bad.theme, null);
    assert.strictEqual(bad.problems.length, 3, 'two refusals and the summary');
});

test('junk in, nothing out', async (t) => {
    assert.strictEqual(readTheme('').theme, null);
    assert.strictEqual(readTheme('not json').theme, null);
    assert.strictEqual(readTheme('[1,2,3]').theme, null);
    assert.strictEqual(readTheme('{"name":"x"}').theme, null);
    assert.strictEqual(readTheme(`{"tokens":{"surface":"#fff"},"pad":"${'x'.repeat(MAX_BYTES)}"}`).theme, null);
});

test('the name is trimmed and capped, and the mode is one of two', async (t) => {
    const held = readTheme(theme({ surface: '#fff' }, { name: `  ${'n'.repeat(50)}  `, mode: 'sideways' })).theme;

    assert.strictEqual(held.name.length, 32);
    assert.strictEqual(held.mode, 'dark');
});

test('the vocabulary has no duplicates and is all kebab-case', async (t) => {
    assert.strictEqual(new Set(TOKEN_NAMES).size, TOKEN_NAMES.length);

    for (const name of TOKEN_NAMES) {
        assert.match(name, /^[a-z][a-z0-9-]*$/, name);
    }
});

test('the shapes a theme may bend are checked by kind', async (t) => {
    const { theme: held, problems } = readTheme(theme({
        'shadow-md': '0 4px 6px rgba(0,0,0,0.1)',
        'logo-filter': 'grayscale(1) sepia(0.5)',
        'font-ui': 'ui-monospace, Menlo, monospace',
        'ui-sm': '0.75rem',
        'motion-base': '220ms',
        'shadow-lg': 'url(x.png)',
    }));

    assert.deepStrictEqual(Object.keys(held.tokens).sort(), ['font-ui', 'logo-filter', 'motion-base', 'shadow-md', 'ui-sm']);
    assert.strictEqual(problems.length, 1, 'the one that fetches is refused');
    assert.match(problems[0], /shadow-lg/);
});

test('a pasted theme is measured by the floors the shipped ones clear', async (t) => {
    const dim = gradeTheme({ ink: '#8a8a8a', 'surface-raised': '#ffffff', 'surface': '#ffffff' });
    const fine = gradeTheme({ ink: '#101010', 'surface-raised': '#ffffff', 'surface': '#ffffff' });
    const partial = gradeTheme({ accent: '#1d4ed8' });

    assert.deepStrictEqual(dim.failures.map(fail => fail.ink), ['ink', 'ink'], 'grey on white is not body text');
    assert.deepStrictEqual(fine.failures, []);
    assert.deepStrictEqual(partial.failures, [], 'a theme that sets three tokens is not failed for the rest');
    assert.strictEqual(partial.worst, null);
});

test('a theme may carry both of its variants', async (t) => {
    const { theme, problems } = readTheme(JSON.stringify({
        name: 'Pair',
        mode: 'dark',
        dark: { tokens: { surface: '#0e1012', ink: '#e2e8e4' } },
        light: { tokens: { surface: '#eceeed', ink: '#181c1b', 'not-a-token': '#fff' } },
    }));

    assert.deepStrictEqual(problems, ['light/not-a-token: not a token this build reads.']);
    assert.deepStrictEqual(theme.modes.sort(), ['dark', 'light']);
    assert.strictEqual(theme.variants.dark.surface, '#0e1012');
    assert.strictEqual(theme.variants.light.surface, '#eceeed');
    assert.strictEqual(theme.mode, 'dark');
    assert.strictEqual(theme.tokens.surface, '#0e1012');
});

test('a single-variant theme still reads the way it always did', async (t) => {
    const { theme } = readTheme(JSON.stringify({ name: 'One', mode: 'light', tokens: { surface: '#eceeed' } }));

    assert.deepStrictEqual(theme.modes, ['light']);
    assert.strictEqual(theme.variants.light.surface, '#eceeed');
});
