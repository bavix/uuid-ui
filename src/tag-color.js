'use strict';

const HUES = [210, 280, 340, 20, 160, 220, 300, 45, 140, 0, 260, 180, 30, 270, 190];

const LIGHT_SURFACE = [255, 255, 255];
const DARK_SURFACE = [31, 41, 55];
const DARK_INK = [17, 24, 39];
const WHITE = [255, 255, 255];

const cache = new Map();

export function tagHue(name) {
    let hash = 0;

    for (let i = 0; i < String(name ?? '').length; i += 1) {
        hash = String(name).charCodeAt(i) + ((hash << 5) - hash);
    }

    return HUES[Math.abs(hash) % HUES.length];
}

export function hslToRgb(h, s, l) {
    const sat = s / 100;
    const light = l / 100;
    const a = sat * Math.min(light, 1 - light);
    const at = (n) => {
        const k = (n + h / 30) % 12;

        return light - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    };

    return [at(0), at(8), at(4)].map(value => Math.round(value * 255));
}

function channel(value) {
    const held = value / 255;

    return held <= 0.03928 ? held / 12.92 : ((held + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]) {
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a, b) {
    const first = luminance(a);
    const second = luminance(b);
    const [high, low] = first > second ? [first, second] : [second, first];

    return (high + 0.05) / (low + 0.05);
}

export function mix(a, b, weight) {
    return a.map((value, i) => Math.round(value * weight + b[i] * (1 - weight)));
}

function css([r, g, b]) {
    return `rgb(${r}, ${g}, ${b})`;
}

/** The chip's own colour: one lightness for every hue, so the strip reads as
 *  one family rather than fifteen different intensities. */
function fill(hue) {
    return hslToRgb(hue, 65, 38);
}

/** Text on the filled chip: white where white can be read, the theme's own
 *  darkest ink where it cannot. Cyan and yellow are where white gives up. */
function onFill(hue, ground) {
    const held = fill(hue);

    return contrast(WHITE, held) >= 4.5 ? WHITE : ground.deep;
}

/** Text on the quiet chip, walked towards the surface's opposite until it is
 *  readable on the chip's own tinted background. */
function ink(hue, dark, ground) {
    const background = mix(fill(hue), ground.surface, 0.1);
    const steps = dark
        ? [76, 80, 84, 88, 92]
        : [30, 26, 22, 18, 14];

    for (const lightness of steps) {
        const held = hslToRgb(hue, dark ? 70 : 68, lightness);

        if (contrast(held, background) >= 4.5) {
            return held;
        }
    }

    return dark ? WHITE : ground.deep;
}

/** The dot has no text in it, so it only has to be seen: 3:1 against the panel
 *  it sits on. The filled colour is too dark for that in the dark theme. */
function dot(hue, dark, ground) {
    const held = fill(hue);

    if (contrast(held, ground.surface) >= 3) {
        return held;
    }

    return ink(hue, dark, ground);
}

function groundOf(dark, ground) {
    return {
        surface: ground?.surface ?? (dark ? DARK_SURFACE : LIGHT_SURFACE),
        deep: ground?.deep ?? DARK_INK,
    };
}

/**
 * The card a tag sits on and the darkest ink the theme has, read off whatever
 * theme is applied. Without this the chips are drawn for a white card and a
 * Tailwind grey, which is neither of the surfaces a named theme paints.
 */
export function tagGround(root) {
    const node = root ?? (typeof document === 'undefined' ? null : document.documentElement);

    if (!node || typeof getComputedStyle !== 'function') {
        return null;
    }

    const style = getComputedStyle(node);
    const held = (name) => {
        const parts = style.getPropertyValue(name).match(/[\d.]+/g);

        return parts && parts.length >= 3 ? parts.slice(0, 3).map(Number) : null;
    };

    const surface = held('--surface-raised');
    const deep = held('--void');

    return surface && deep ? { surface, deep } : null;
}

export function tagColors(name, dark = false, ground = null) {
    const held0 = groundOf(dark, ground);
    const key = `${dark ? 'd' : 'l'}:${held0.surface.join()}:${held0.deep.join()}:${name}`;
    const held = cache.get(key);

    if (held) {
        return held;
    }

    const hue = tagHue(name);
    const colors = {
        fill: css(fill(hue)),
        onFill: css(onFill(hue, held0)),
        ink: css(ink(hue, dark, held0)),
        dot: css(dot(hue, dark, held0)),
    };

    cache.set(key, colors);

    return colors;
}

export const SURFACES = { light: LIGHT_SURFACE, dark: DARK_SURFACE };
export const HUE_LIST = HUES;
