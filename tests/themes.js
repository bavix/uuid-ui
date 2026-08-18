import assert from 'node:assert';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DEFAULT_PALETTE, THEMES, isKnownTheme, modesOf, themeById } from '../src/themes/index.js';
import { isPaletteName } from '../src/theme.js';
import { contrast } from '../src/tag-color.js';
import { FLOORS, gradeTheme, rgbOf as mixOf } from '../src/themes/contrast.js';

const TOKENS = [
    '--surface', '--surface-sunken', '--surface-raised', '--surface-hover', '--row-alt',
    '--line', '--line-strong',
    '--ink', '--ink-muted', '--ink-muted-chip',
    '--accent', '--accent-soft', '--accent-fill', '--accent-ink',
    '--fmt-uuid', '--fmt-base64', '--fmt-ulid', '--fmt-highlow', '--fmt-bytes', '--fmt-words',
    '--brand-1', '--brand-2', '--brand-3', '--fmt',
    '--warn', '--warn-strong', '--alarm', '--void',
    '--bit-off', '--bit-random', '--bit-fixed', '--bit-time', '--bit-clock', '--bit-node',
    '--bit-mix', '--map-mix',
    '--sync-danger', '--sync-good',
];

/* Shape, light and motion are the theme's to bend, but only through these. */
const OPTIONAL = [
    '--radius-xs', '--radius-sm', '--radius-md', '--radius-lg', '--radius-pill', '--shadow-sm', '--shadow-md', '--shadow-lg',
    '--glow-chip', '--glow-accent', '--title-tracking', '--title-transform',
    '--chip-clip', '--card-clip', '--panel-mark', '--divider-image', '--label-fill', '--label-ink', '--label-pad', '--mark-note', '--mark-bad', '--chip-on-bg', '--chip-on-ink', '--chip-on-dot', '--seg-on-bg', '--seg-on-ink', '--font-ui',
    '--page-texture', '--output-edge', '--signature-time', '--signature-ink', '--logo-filter',
    '--tint-badge', '--tint-output', '--tint-nil', '--tint-nil-glow',
    '--motion-fast', '--motion-base', '--motion-slow', '--motion-scale',
    '--ui-2xs', '--ui-xs', '--ui-sm', '--ui-base', '--ui-lg', '--ui-title',
];

function blocksOf(id) {
    const css = readFileSync(new URL(`../src/themes/${id}.css`, import.meta.url), 'utf8');
    const light = css.match(/:root\[data-theme="[^"]+"\]\s*\{([^}]*)\}/);
    const dark = css.match(/:root\[data-theme="[^"]+"\]\.dark\s*\{([^}]*)\}/);

    return { light: light?.[1] ?? '', dark: dark?.[1] ?? '' };
}

test('every theme has a name a browser can carry in an attribute', async (t) => {
    const seen = new Set();

    for (const theme of THEMES) {
        assert.ok(isPaletteName(theme.id), `${theme.id} is not a usable name`);
        assert.ok(!seen.has(theme.id), `${theme.id} appears twice`);
        assert.ok(theme.name && theme.blurb, `${theme.id} has nothing to show in the drawer`);
        seen.add(theme.id);
    }
});

test('the shipped theme is one of them, and it is the fallback', async (t) => {
    assert.ok(isKnownTheme(DEFAULT_PALETTE));
    assert.strictEqual(themeById('nothing-like-this'), null);
    assert.deepStrictEqual(modesOf('nothing-like-this'), ['light', 'dark'], 'an unknown theme is assumed to have both');
});

test('every theme offers a swatch for each variant it claims', async (t) => {
    for (const theme of THEMES) {
        for (const mode of theme.modes) {
            const swatch = theme.swatch[mode];

            assert.ok(Array.isArray(swatch) && swatch.length === 3, `${theme.id}/${mode} has no swatch`);

            for (const colour of swatch) {
                assert.match(colour, /^#[0-9a-f]{6}$/i, `${theme.id}/${mode}: ${colour}`);
            }
        }
    }
});

test('every named theme sets the whole set of tokens, in both variants', async (t) => {
    for (const theme of THEMES) {
        if (theme.id === DEFAULT_PALETTE) {
            continue;
        }

        const blocks = blocksOf(theme.id);

        for (const mode of theme.modes) {
            for (const token of TOKENS) {
                assert.match(blocks[mode], new RegExp(`${token}\\s*:`), `${theme.id}/${mode} is missing ${token}`);
            }
        }
    }
});

test('what a theme bends beyond colour is on the agreed list', async (t) => {
    for (const theme of THEMES) {
        if (theme.id === DEFAULT_PALETTE) {
            continue;
        }

        const css = readFileSync(new URL(`../src/themes/${theme.id}.css`, import.meta.url), 'utf8');
        const names = new Set((css.replace(/\/\*[\s\S]*?\*\//g, '').match(/--[a-z0-9-]+\s*:/g) ?? [])
            .map(held => held.replace(':', '').trim()));

        for (const name of names) {
            assert.ok(
                TOKENS.includes(name) || OPTIONAL.includes(name),
                `${theme.id} sets ${name}, which no rule reads`,
            );
        }
    }
});

test('a named theme only sets tokens, never a rule of its own', async (t) => {
    for (const theme of THEMES) {
        if (theme.id === DEFAULT_PALETTE) {
            continue;
        }

        const css = readFileSync(new URL(`../src/themes/${theme.id}.css`, import.meta.url), 'utf8');
        const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/^\s*[a-z-]+\s*:/gm) ?? [];

        for (const declaration of declarations) {
            const name = declaration.trim().replace(':', '');

            assert.ok(name.startsWith('--') || name === 'color-scheme', `${theme.id} styles ${name} itself`);
        }
    }
});

/** Every theme's variant, read straight out of the CSS it ships. */
function tokensOf(id, mode) {
    if (id !== DEFAULT_PALETTE) {
        return declarations(blocksOf(id)[mode]);
    }

    const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
    const block = mode === 'dark' ? css.match(/\n\.dark \{([\s\S]*?)\n\}/) : css.match(/\n:root \{([\s\S]*?)\n\}/);

    return declarations(block?.[1] ?? '');
}

function defaults(mode) {
    const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
    const block = mode === 'dark' ? css.match(/\n\.dark \{([\s\S]*?)\n\}/) : css.match(/\n:root \{([\s\S]*?)\n\}/);
    const root = css.match(/\n:root \{([\s\S]*?)\n\}/);
    const held = { ...declarations(root?.[1] ?? ''), ...declarations(block?.[1] ?? '') };

    return Object.fromEntries(Object.entries(held).map(([name, value]) => [name.slice(2), value]));
}

function declarations(text) {
    const held = {};

    for (const line of text.replace(/\/\*[\s\S]*?\*\//g, '').split(';')) {
        const at = line.indexOf(':');
        const name = line.slice(0, at).trim();

        if (name.startsWith('--')) {
            held[name] = line.slice(at + 1).trim();
        }
    }

    return held;
}

/** A colour a theme wrote, with any var() it points at followed to the end. */
function rgbOf(tokens, name, depth = 0) {
    const value = tokens[name];

    if (!value || depth > 4) {
        return null;
    }

    const points = value.match(/^var\((--[a-z0-9-]+)/);

    if (points) {
        return rgbOf(tokens, points[1], depth + 1);
    }

    const hex = value.match(/^#([0-9a-f]{6})$/i);

    if (hex) {
        return [0, 2, 4].map(at => parseInt(hex[1].slice(at, at + 2), 16));
    }

    const numbers = value.match(/^rgba?\(([^)]*)\)/);

    return numbers ? numbers[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(Number) : null;
}

/* Text has to be readable on the surface it lands on. A theme that fails this
   is not "a bit muddy" — it does not ship. The floors live with the themes, so
   a theme somebody pastes in is measured by exactly this. */
test('every theme is readable in both of its variants', async (t) => {
    for (const theme of THEMES) {
        for (const mode of theme.modes) {
            const tokens = tokensOf(theme.id, mode);
            const bare = Object.fromEntries(Object.entries(tokens).map(([name, value]) => [name.slice(2), value]));

            for (const [ink, surface] of FLOORS) {
                assert.ok(
                    rgbOf(bare, ink) && rgbOf(bare, surface),
                    `${theme.id}/${mode}: ${ink} or ${surface} is not a plain colour`,
                );
            }

            const { failures } = gradeTheme(bare);

            assert.deepStrictEqual(
                failures.map(fail => `${fail.what} ${fail.ratio.toFixed(2)}:1`),
                [],
                `${theme.id}/${mode} is not readable`,
            );
        }
    }
});

function apart(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

/* Six formats have to stay apart, or the badges stop telling them apart. */
test('the format hues of a theme are distinguishable', async (t) => {
    const FORMATS = ['--fmt-uuid', '--fmt-base64', '--fmt-ulid', '--fmt-highlow', '--fmt-bytes', '--fmt-words'];

    for (const theme of THEMES) {
        for (const mode of theme.modes) {
            const tokens = tokensOf(theme.id, mode);

            for (let i = 0; i < FORMATS.length; i += 1) {
                for (let j = i + 1; j < FORMATS.length; j += 1) {
                    const a = rgbOf(tokens, FORMATS[i]);
                    const b = rgbOf(tokens, FORMATS[j]);

                    assert.ok(a && b, `${theme.id}/${mode}: ${FORMATS[i]} or ${FORMATS[j]} is not a plain colour`);

                    const away = apart(a, b);

                    assert.ok(
                        away >= 60,
                        `${theme.id}/${mode}: ${FORMATS[i]} and ${FORMATS[j]} are ${away} apart, 60 is the floor`,
                    );
                }
            }
        }
    }
});

/* The three planes have to stay three planes: a card that matches the page is
   a card nobody can see. */
test('every theme keeps its surfaces apart and in order', async (t) => {
    for (const theme of THEMES) {
        for (const mode of theme.modes) {
            const tokens = tokensOf(theme.id, mode);
            const page = rgbOf(tokens, '--surface');
            const raised = rgbOf(tokens, '--surface-raised');
            const sunken = rgbOf(tokens, '--surface-sunken');
            const hover = rgbOf(tokens, '--surface-hover');
            const line = rgbOf(tokens, '--line');

            const sum = held => held[0] + held[1] + held[2];

            assert.ok(
                sum(raised) > sum(page) && sum(page) > sum(sunken),
                `${theme.id}/${mode}: raised, page and sunken are not three steps`,
            );
            assert.ok(apart(raised, page) >= 8, `${theme.id}/${mode}: a card is invisible on the page`);
            assert.ok(apart(hover, raised) >= 8, `${theme.id}/${mode}: hover looks like rest`);
            assert.ok(
                contrast(line, raised) >= 1.15,
                `${theme.id}/${mode}: the hairline does not show on a card`,
            );
        }
    }
});

/* An accent that reads as ink is not an accent, and a format hue that sinks
   into the card is not a label. */
test('every theme keeps its accent and its format hues legible', async (t) => {
    const FORMATS = ['--fmt-uuid', '--fmt-base64', '--fmt-ulid', '--fmt-highlow', '--fmt-bytes', '--fmt-words'];

    for (const theme of THEMES) {
        for (const mode of theme.modes) {
            const tokens = tokensOf(theme.id, mode);
            const raised = rgbOf(tokens, '--surface-raised');

            assert.ok(
                apart(rgbOf(tokens, '--accent'), rgbOf(tokens, '--ink')) >= 60,
                `${theme.id}/${mode}: the accent reads as ordinary ink`,
            );

            for (const format of FORMATS) {
                const ratio = contrast(rgbOf(tokens, format), raised);

                assert.ok(ratio >= 3, `${theme.id}/${mode}: ${format} is ${ratio.toFixed(2)}:1 on a card`);
            }
        }
    }
});

/* And the themes have to differ from each other, which is the whole point of
   there being more than one. */
test('no two themes are the same theme', async (t) => {
    for (const mode of ['light', 'dark']) {
        const shown = THEMES.filter(theme => theme.modes.includes(mode));

        for (let i = 0; i < shown.length; i += 1) {
            for (let j = i + 1; j < shown.length; j += 1) {
                const first = tokensOf(shown[i].id, mode);
                const second = tokensOf(shown[j].id, mode);
                const page = apart(rgbOf(first, '--surface'), rgbOf(second, '--surface'));
                const accent = apart(rgbOf(first, '--accent'), rgbOf(second, '--accent'));

                assert.ok(
                    page + accent >= 90,
                    `${shown[i].id} and ${shown[j].id} are ${page + accent} apart in ${mode}: same theme twice`,
                );
            }
        }
    }
});

test('what the box marks is readable in every theme', async (t) => {
    for (const theme of THEMES) {
        for (const mode of theme.modes) {
            const tokens = tokensOf(theme.id, mode);
            const bare = Object.fromEntries(Object.entries(tokens).map(([name, value]) => [name.slice(2), value]));
            const held = { ...defaults(mode), ...bare };
            const raised = mixOf(held, 'surface-raised');
            const note = mixOf(held, 'mark-note');
            const bad = mixOf(held, 'mark-bad');

            assert.ok(note && bad, `${theme.id}/${mode}: the marks are not plain colours`);

            const noteRatio = contrast(note, raised);
            const badRatio = contrast(bad, raised);
            const inkRatio = contrast(mixOf(held, 'ink'), raised);

            assert.ok(noteRatio >= 4.4, `${theme.id}/${mode}: a comment is ${noteRatio.toFixed(2)}:1`);
            assert.ok(noteRatio < inkRatio, `${theme.id}/${mode}: a comment is as loud as the value`);
            assert.ok(badRatio >= 3, `${theme.id}/${mode}: the mark under a bad line is ${badRatio.toFixed(2)}:1`);
        }
    }
});
