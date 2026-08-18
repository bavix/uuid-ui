import assert from 'node:assert';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';

/**
 * What a theme cannot reach, a theme cannot change. These are the leaks that
 * kept turning up by eye — a Tailwind grey in JSX, a fixed navy behind a modal,
 * a corner measured in pixels — each one a place where a named theme stopped
 * being the theme.
 */

const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');

function bodyOf(text) {
    return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

function jsxFiles() {
    const held = [];
    const walk = (dir) => {
        for (const entry of readdirSync(new URL(dir, import.meta.url), { withFileTypes: true })) {
            if (entry.isDirectory()) {
                walk(`${dir}${entry.name}/`);
                continue;
            }

            if (/\.(jsx|js)$/.test(entry.name)) {
                held.push(`${dir}${entry.name}`);
            }
        }
    };

    walk('../src/');

    return held;
}

test('no rule paints a corner the theme cannot straighten', () => {
    const bare = bodyOf(css).match(/border(-[a-z-]+)?-radius:\s*([^;]+);/g) ?? [];

    for (const held of bare) {
        const value = held.slice(held.indexOf(':') + 1).replace(';', '').trim();

        assert.ok(
            value.includes('var(--radius') || /^0[a-z%]*$/.test(value) || value === '50%' || value === '1px',
            `${held.trim()} is a corner no theme can change`,
        );
    }
});

test('no rule paints a colour out of the theme', () => {
    const body = bodyOf(css);
    const leaks = body.match(/\b(bg|text|border|from|via|to|ring|fill|stroke|divide)-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-\d{2,3})?\b/g) ?? [];

    assert.deepStrictEqual(leaks, [], 'Tailwind palette utilities are outside every theme');

    // Shadows are allowed to be black; nothing else is.
    const blacks = body
        .split('\n')
        .filter(line => /rgba?\(\s*0[,\s]+0[,\s]+0/.test(line))
        .filter(line => !line.includes('--shadow-'));

    assert.deepStrictEqual(blacks, [], 'a fixed black is a theme that cannot be lightened');
});

test('the interface asks for colours by name, not by number', () => {
    const offenders = [];

    for (const file of jsxFiles()) {
        if (file.includes('/themes/') || file.endsWith('tag-color.js') || file.endsWith('space-runner.jsx')) {
            continue;
        }

        const text = readFileSync(new URL(file, import.meta.url), 'utf8');

        for (const [line] of text.matchAll(/^.*(?:backgroundColor|borderColor|\bcolor)\s*:\s*['"`]#[0-9a-fA-F]{3,8}['"`].*$/gm)) {
            offenders.push(`${file}: ${line.trim()}`);
        }
    }

    assert.deepStrictEqual(offenders, [], 'these paint themselves and ignore the theme');
});
