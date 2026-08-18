import assert from 'node:assert';
import test from 'node:test';
import { HUE_LIST, SURFACES, contrast, mix, tagColors, tagHue } from '../src/tag-color.js';

const NAMES = ['billing', 'invoices', 'staging', 'prod', 'ops', 'archive', '🔥 hot', 'счета', 'ticket 1174', 'payments', 'a', 'zzz', 'import bug', 'x'.repeat(32), 'Ω'];

function rgb(text) {
    return text.match(/\d+/g).map(Number);
}

test('every name lands on one of the hues, and the same name always on the same one', async (t) => {
    for (const name of NAMES) {
        assert.ok(HUE_LIST.includes(tagHue(name)), `${name} is off the wheel`);
        assert.strictEqual(tagHue(name), tagHue(name));
    }
});

test('text on a chosen tag can be read, whatever the hue', async (t) => {
    for (const hue of HUE_LIST) {
        const name = NAMES.find(held => tagHue(held) === hue) ?? `hue-${hue}`;
        const { fill, onFill } = tagColors(name);

        assert.ok(contrast(rgb(onFill), rgb(fill)) >= 4.5, `hue ${hue}: ${contrast(rgb(onFill), rgb(fill)).toFixed(2)}:1 on the filled chip`);
    }
});

test('text on a quiet chip can be read in both themes', async (t) => {
    for (const hue of HUE_LIST) {
        for (const dark of [false, true]) {
            const name = `hue-${hue}`;
            const { fill, ink } = tagColors(name, dark);
            // The chip's background, mixed the way the stylesheet mixes it.
            const background = mix(rgb(fill), dark ? SURFACES.dark : SURFACES.light, 0.1);
            const held = contrast(rgb(ink), background);

            assert.ok(held >= 4.5, `hue ${hue} ${dark ? 'dark' : 'light'}: ${held.toFixed(2)}:1`);
        }
    }
});

test('the dot is visible against the panel it sits on', async (t) => {
    for (const hue of HUE_LIST) {
        for (const dark of [false, true]) {
            const { dot } = tagColors(`hue-${hue}`, dark);
            const held = contrast(rgb(dot), dark ? SURFACES.dark : SURFACES.light);

            assert.ok(held >= 3, `hue ${hue} ${dark ? 'dark' : 'light'}: ${held.toFixed(2)}:1`);
        }
    }
});

test('the same name and theme gives the same colours back', async (t) => {
    assert.deepStrictEqual(tagColors('billing', true), tagColors('billing', true));
    assert.notDeepStrictEqual(tagColors('billing', true), tagColors('billing', false));
});
