import assert from 'node:assert';
import test from 'node:test';
import {
    DEFAULT_THEME,
    applyTheme,
    formatTheme,
    parseTheme,
    readTheme,
    variantOf,
    writeTheme,
} from '../src/theme.js';

function storageOf(value) {
    const store = new Map();

    if (value !== undefined) {
        store.set('theme', value);
    }

    return {
        getItem: k => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, v),
        read: () => store.get('theme'),
    };
}

function windowOf(dark) {
    return { matchMedia: () => ({ matches: dark }) };
}

function rootOf() {
    const classes = new Set();
    const attributes = new Map();

    return {
        style: {},
        classList: {
            toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)),
            contains: name => classes.has(name),
        },
        setAttribute: (name, value) => attributes.set(name, value),
        removeAttribute: name => attributes.delete(name),
        getAttribute: name => (attributes.has(name) ? attributes.get(name) : null),
    };
}

test('a pair reads as a theme and a variant', async (t) => {
    assert.deepStrictEqual(parseTheme('cyberpunk:dark'), { palette: 'cyberpunk', mode: 'dark' });
    assert.deepStrictEqual(parseTheme('default:system'), { palette: 'default', mode: 'system' });
    assert.deepStrictEqual(parseTheme('  paper:light  '), { palette: 'paper', mode: 'light' });
});

test('a theme this build has never heard of is still read', async (t) => {
    assert.deepStrictEqual(parseTheme('vaporwave:dark'), { palette: 'vaporwave', mode: 'dark' });
});

test('what the older builds wrote still reads', async (t) => {
    assert.deepStrictEqual(parseTheme('dark'), { palette: 'default', mode: 'dark' });
    assert.deepStrictEqual(parseTheme('light'), { palette: 'default', mode: 'light' });
    assert.deepStrictEqual(parseTheme('true'), { palette: 'default', mode: 'dark' });
    assert.deepStrictEqual(parseTheme('"false"'), { palette: 'default', mode: 'light' });
});

test('nonsense is not a preference', async (t) => {
    for (const held of ['', '   ', 'midnight', 'cyberpunk:', ':dark', 'cyberpunk:sideways', 'a b:dark', null, 7]) {
        assert.strictEqual(parseTheme(held), null, `${held} should not parse`);
    }
});

test('a name too long to be an attribute is refused', async (t) => {
    assert.strictEqual(parseTheme(`${'x'.repeat(33)}:dark`), null);
    assert.deepStrictEqual(parseTheme(`${'x'.repeat(32)}:dark`), { palette: 'x'.repeat(32), mode: 'dark' });
});

test('reading falls back to the shipped theme, following the machine', async (t) => {
    assert.deepStrictEqual(readTheme(storageOf()), DEFAULT_THEME);
    assert.deepStrictEqual(readTheme(storageOf('nonsense')), DEFAULT_THEME);
});

test('writing stores the pair, and replaces a legacy value', async (t) => {
    const storage = storageOf('true');

    writeTheme({ palette: 'paper', mode: 'light' }, storage);

    assert.strictEqual(storage.read(), 'paper:light');
    assert.deepStrictEqual(readTheme(storage), { palette: 'paper', mode: 'light' });
});

test('a half-written choice still stores something usable', async (t) => {
    assert.strictEqual(formatTheme({ palette: 'paper' }), 'paper:system');
    assert.strictEqual(formatTheme({ mode: 'dark' }), 'default:dark');
    assert.strictEqual(formatTheme(null), 'default:system');
});

test('system means what the machine says, the other two mean themselves', async (t) => {
    assert.strictEqual(variantOf({ palette: 'default', mode: 'system' }, windowOf(true)), 'dark');
    assert.strictEqual(variantOf({ palette: 'default', mode: 'system' }, windowOf(false)), 'light');
    assert.strictEqual(variantOf({ palette: 'default', mode: 'dark' }, windowOf(false)), 'dark');
    assert.strictEqual(variantOf({ palette: 'default', mode: 'light' }, windowOf(true)), 'light');
});

test('applying puts the variant on the class and the theme on the attribute', async (t) => {
    const root = rootOf();

    applyTheme({ palette: 'cyberpunk', mode: 'dark' }, root, windowOf(false));

    assert.strictEqual(root.classList.contains('dark'), true);
    assert.strictEqual(root.getAttribute('data-theme'), 'cyberpunk');
    assert.strictEqual(root.style.colorScheme, 'dark');
});

test('the shipped theme carries no attribute, and a stale one is taken off', async (t) => {
    const root = rootOf();

    applyTheme({ palette: 'cyberpunk', mode: 'dark' }, root, windowOf(false));
    applyTheme({ palette: 'default', mode: 'light' }, root, windowOf(false));

    assert.strictEqual(root.getAttribute('data-theme'), null);
    assert.strictEqual(root.classList.contains('dark'), false);
    assert.strictEqual(root.style.colorScheme, 'light');
});

test('a storage that refuses to answer is not a crash', async (t) => {
    const blocked = {
        getItem: () => { throw new Error('blocked'); },
        setItem: () => { throw new Error('blocked'); },
    };

    assert.deepStrictEqual(readTheme(blocked), DEFAULT_THEME);
    assert.doesNotThrow(() => writeTheme({ palette: 'paper', mode: 'dark' }, blocked));
});
