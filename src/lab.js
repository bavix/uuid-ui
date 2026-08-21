'use strict';

import { uuidToBytes, uuidToBytesString, uuidToHex } from './uuid-bytes.js';
import { fieldsFor, variantOf } from './rfc9562.js';
import { foundEggs } from './eggs-found.js';
import { timestampFromUuid } from './uuid-timestamp.js';
import { uuidToBase64Std } from './base64.js';
import { uuidToUlid } from './uuid-ulid.js';
import { uuidToInts, uuidToUints } from './uuid-high-low.js';
import { uuidToWords } from './uuid-words.js';
import { specialValues } from './special-values.js';
import { DEFAULT_NAME, DEFAULT_NAMESPACE, nameBased } from './uuid-names.js';
import { copyText } from './clipboard.js';
import { toast } from 'sonner';
import { readBestScores, readBestTimes, writeBestScore, writeBestTime } from './records.js';

/**
 * Three demonstrations that only make sense in a tool about identifiers. Loaded
 * on demand, so nobody pays for them by converting a UUID.
 *
 * The looks live in app.css (.lab-*): these panels are part of the app, and a
 * second palette mixed by hand in here would drift from the themes.
 */

function element(tag, className, text) {
    const node = document.createElement(tag);

    if (className) {
        node.className = className;
    }

    if (text !== undefined) {
        node.textContent = text;
    }

    return node;
}

/**
 * The shell every one of these shares. Two modes:
 *
 * - on its own, a real modal <dialog>: focus cannot wander off it, the page
 *   behind it stops taking clicks, and Escape is the browser's job;
 * - given a `mount`, the same head and body rendered inside it, so a game can
 *   live in the history panel and be played next to a conversion.
 */
function panel({ title, subtitle, id, width, mount, onDismiss }) {
    const embedded = !!mount;
    const box = element(embedded ? 'div' : 'dialog',
        `modal-panel${embedded ? ' is-embedded' : ''}${width && !embedded ? ' ' + width : ''}`);
    box.setAttribute('aria-label', title);
    box.dataset.lab = id;

    if (embedded) {
        box.setAttribute('role', 'group');
    }

    const head = element('div', 'modal-head');
    const heading = element('div');
    heading.append(element('p', 'modal-title', title), element('p', 'modal-subtitle', subtitle));

    const closeButton = element('button', 'modal-close');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
        '<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';

    const body = element('div', 'modal-body');
    head.append(heading, closeButton);
    box.append(head, body);

    if (embedded) {
        mount.appendChild(box);
    } else {
        document.body.appendChild(box);
        box.showModal();
    }

    let onClose = null;
    let cleaned = false;

    // Idempotent, and not left to the close event alone: Escape is the
    // browser's path in, our buttons are ours, and both end here exactly once.
    const cleanup = () => {
        if (cleaned) {
            return;
        }

        cleaned = true;
        box.remove();

        if (onClose) {
            onClose();
        }

        if (onDismiss) {
            onDismiss();
        }
    };

    const close = () => {
        if (!embedded) {
            box.close();
        }

        cleanup();
    };

    if (!embedded) {
        box.addEventListener('close', cleanup);
    }

    closeButton.addEventListener('click', close);
    // Clicking the backdrop targets the dialog itself; its contents fill it.
    box.addEventListener('click', e => { if (e.target === box && !embedded) close(); });

    return {
        body,
        isDark: document.documentElement.classList.contains('dark'),
        close,
        onClosed: fn => { onClose = fn; },
    };
}

/** True while any of these is on screen, in either mode. */
function alreadyOpen() {
    return document.querySelector('[data-lab]:not(.is-embedded)') !== null;
}

const PREFIX_CHOICES = [4, 6, 8];   // hex digits of the prefix being tested

/** Even odds of a repeat land near sqrt(2 * ln2 * N) draws. */
function evenOdds(space) {
    return Math.round(Math.sqrt(2 * Math.LN2 * space));
}

function collisionOdds(draws, space) {
    return 1 - Math.exp(-(draws * draws) / (2 * space));
}

function button(label, className = 'lab-btn') {
    const node = element('button', className, label);
    node.type = 'button';
    return node;
}

/**
 * Truncating an identifier to its first block feels safe and is not. Pick how
 * many hex digits to keep and watch the run: the counter, the odds and the
 * curve all move together, and the collision arrives while you are still
 * expecting it not to.
 */
export function birthdayParadox() {
    if (alreadyOpen()) {
        return;
    }

    const ui = panel({
        id: 'birthday',
        title: 'Birthday paradox',
        subtitle: 'How many random identifiers before two of them share a prefix. Pick a prefix length and watch.',
    });

    const toolbar = element('div', 'lab-toolbar');
    const segmented = element('div', 'lab-seg');
    segmented.setAttribute('role', 'group');
    segmented.setAttribute('aria-label', 'Prefix length');
    const again = button('Run again');
    toolbar.append(segmented, again);

    const stats = element('div', 'lab-stats');
    const drawsValue = element('p', 'lab-stat-value', '0');
    const oddsValue = element('p', 'lab-stat-value', '0%');
    stats.append(
        stat('Draws', drawsValue),
        stat('Odds of a repeat by now', oddsValue),
    );

    const svgNS = 'http://www.w3.org/2000/svg';
    const chart = document.createElementNS(svgNS, 'svg');
    chart.setAttribute('class', 'lab-curve');
    chart.setAttribute('viewBox', '0 0 300 90');
    chart.setAttribute('preserveAspectRatio', 'none');
    chart.setAttribute('aria-hidden', 'true');

    const curve = document.createElementNS(svgNS, 'path');
    curve.setAttribute('class', 'lab-curve-line');
    const halfLine = document.createElementNS(svgNS, 'line');
    halfLine.setAttribute('class', 'lab-curve-half');
    halfLine.setAttribute('x1', '0');
    halfLine.setAttribute('x2', '300');
    const marker = document.createElementNS(svgNS, 'line');
    marker.setAttribute('class', 'lab-curve-marker');
    marker.setAttribute('y1', '0');
    marker.setAttribute('y2', '90');
    chart.append(halfLine, curve, marker);

    const axis = element('p', 'lab-axis');
    const verdict = element('p', 'lab-note', '');
    ui.body.append(toolbar, stats, chart, axis, verdict);

    let timer = null;
    let stopped = false;
    ui.onClosed(() => { stopped = true; if (timer) clearTimeout(timer); });

    let prefixHex = PREFIX_CHOICES[PREFIX_CHOICES.length - 1];

    const run = () => {
        if (timer) {
            clearTimeout(timer);
        }

        const space = 16 ** prefixHex;
        const half = evenOdds(space);
        const span = Math.round(half * 2.2);          // how far the chart looks ahead
        const batch = Math.max(1, Math.round(half / 90));
        const buffer = new Uint32Array(batch);
        const mask = space - 1;
        const seen = new Set();
        let drawn = 0;

        halfLine.setAttribute('y1', '45');
        halfLine.setAttribute('y2', '45');
        curve.setAttribute('d', Array.from({ length: 61 }, (_, i) => {
            const n = (span / 60) * i;
            const y = 90 - collisionOdds(n, space) * 90;
            return `${i === 0 ? 'M' : 'L'}${(i * 5).toFixed(1)},${y.toFixed(1)}`;
        }).join(' '));

        axis.textContent = `0 to ${span.toLocaleString('en-US')} draws · even odds at ~${half.toLocaleString('en-US')}`;
        verdict.textContent = `${space.toLocaleString('en-US')} possible prefixes.`;
        marker.setAttribute('x1', '0');
        marker.setAttribute('x2', '0');

        const paint = () => {
            drawsValue.textContent = drawn.toLocaleString('en-US');
            const odds = collisionOdds(drawn, space);
            oddsValue.textContent = `${Math.round(odds * 100)}%`;
            const x = Math.min(300, (drawn / span) * 300).toFixed(1);
            marker.setAttribute('x1', x);
            marker.setAttribute('x2', x);
        };

        const step = () => {
            crypto.getRandomValues(buffer);

            for (const value of buffer) {
                const prefix = (value & mask) >>> 0;
                drawn++;

                if (seen.has(prefix)) {
                    paint();
                    const repeated = prefix.toString(16).padStart(prefixHex, '0');
                    verdict.innerHTML = `Two identifiers began <code>${repeated}</code> after ` +
                        `<strong>${drawn.toLocaleString('en-US')}</strong> draws, out of ` +
                        `${space.toLocaleString('en-US')} possible prefixes.<br>` +
                        'A prefix is not an identifier.';
                    return;
                }

                seen.add(prefix);
            }

            paint();

            if (!stopped) {
                // A timer, not an animation frame: this is arithmetic, and it
                // should keep running while the tab is in the background.
                timer = setTimeout(step, 16);
            }
        };

        paint();
        timer = setTimeout(step, 16);
    };

    PREFIX_CHOICES.forEach(choice => {
        const option = button(`${choice} hex`, '');
        option.setAttribute('aria-pressed', String(choice === prefixHex));
        option.classList.toggle('is-on', choice === prefixHex);
        option.addEventListener('click', () => {
            prefixHex = choice;
            segmented.querySelectorAll('button').forEach(other => {
                const on = other === option;
                other.classList.toggle('is-on', on);
                other.setAttribute('aria-pressed', String(on));
            });
            run();
        });
        segmented.appendChild(option);
    });

    again.addEventListener('click', run);
    run();
}

function stat(label, valueNode) {
    const box = element('div', 'lab-stat');
    box.append(element('p', 'lab-stat-label', label), valueNode);
    return box;
}

const BIT_KINDS = {
    random: 'random',
    version: 'version',
    variant: 'variant',
    time: 'timestamp',
    clock: 'clock sequence',
    node: 'node',
    hash: 'hash of the name',
};

/**
 * Which field each bit belongs to, following the layouts in RFC 9562 section 5.
 * The differences are the whole point: a v4 is 122 bits of chance, a v1 is a
 * clock and a MAC address, a v7 wears its milliseconds at the front, and a v2
 * gives up half its clock to a local domain.
 */
export { fieldsFor, variantOf };

function fieldAt(fields, index) {
    return fields.find(([from, to]) => index >= from && index <= to)
        || [0, 0, 'random', 'unassigned'];
}

/**
 * What the standard says about the parts that are not simply random, taken from
 * the timestamp considerations in RFC 9562 section 6.
 */
const VERSION_NOTES = {
    1: 'The clock counts 100-nanosecond ticks from 1582-10-15. clock_seq exists to keep identifiers apart when that clock is set backwards.',
    2: 'DCE Security: half the clock and all of time_low are given to a local domain and id, so the timestamp it carries is coarse and partial.',
    6: 'The same clock as a v1, reordered so that sorting the bytes sorts by time.',
    7: 'The clock is 48 bits of Unix milliseconds. rand_a may hold sub-millisecond precision or a monotonic counter instead of randomness — from the outside the two are indistinguishable.',
    8: 'Version 8 is deliberately unspecified: only the version and variant bits mean anything here.',
};

/** RFC 9562 table 1: only 10xx is this standard's own. */

const LOCAL_DOMAINS = { 0: 'person', 1: 'group', 2: 'org' };

function since(iso) {
    const at = Date.parse(iso);

    if (!Number.isFinite(at)) {
        return '';
    }

    const seconds = Math.round((Date.now() - at) / 1000);
    const ago = Math.abs(seconds);
    const units = [['year', 31557600], ['month', 2629800], ['day', 86400], ['hour', 3600], ['minute', 60]];

    for (const [name, size] of units) {
        if (ago >= size) {
            const count = Math.round(ago / size);
            return `${count} ${name}${count === 1 ? '' : 's'} ${seconds >= 0 ? 'ago' : 'from now'}`;
        }
    }

    return 'just now';
}

const FACT_IDENTITY = 'What it is';
const FACT_CLOCK = 'Its clock';
const FACT_SPELLINGS = 'The same value, other spellings';

// int64 travels as a string so it survives JSON; the app writes those numbers
// bare, and the report has to read the same way.
function plainNumbers(value) {
    return value ? JSON.stringify(value).replace(/"(-?\d+)"/g, '$1') : null;
}

/**
 * Everything this app can say about one identifier, in three groups: what it
 * is, what its clock reads, and every other way to write the same 128 bits. A
 * group with nothing in it is dropped, so read the result by name.
 */
export function factsAbout(uuid, hex, version) {
    const identity = [];
    const clock = [];
    const spellings = [];
    let facts = identity;
    const add = (label, value, copyable = false) => {
        if (value !== null && value !== undefined && value !== '') {
            facts.push([label, String(value), copyable]);
        }
    };

    const markers = specialValues(uuid);
    add('Version', version >= 1 && version <= 8 ? String(version) : `none — nibble reads ${version}`);
    add('Variant', variantOf(hex));
    add('Notable', markers.length > 0 ? markers.join(', ') : null);
    add('Uniqueness from', UNIQUENESS[version] ?? 'nothing the standard specifies');
    add('Random bits', ENTROPY[version] ?? null);
    add('Sorts by time', SORTABLE[version] ?? 'no');

    const stamp = timestampFromUuid(uuid);
    facts = clock;

    if (stamp) {
        add('Timestamp', `${stamp} (${since(stamp)})`, true);
        add('Local time', new Date(stamp).toLocaleString());

        if (version === 7) {
            add('Unix ms', parseInt(hex.slice(0, 12), 16), true);
        }

        if (version === 1 || version === 6) {
            const ticks = version === 1
                ? (BigInt('0x' + hex.slice(13, 16)) << 48n) | (BigInt('0x' + hex.slice(8, 12)) << 32n) | BigInt('0x' + hex.slice(0, 8))
                : (BigInt('0x' + hex.slice(0, 12)) << 12n) | BigInt('0x' + hex.slice(13, 16));
            add('100-ns ticks since 1582-10-15', ticks.toString(), true);
        }
    }

    if (version === 1 || version === 6) {
        add('clock_seq', `0x${hex.slice(16, 20)} & 0x3fff = ${parseInt(hex.slice(16, 20), 16) & 0x3fff}`);
        const node = hex.slice(20);
        const multicast = (parseInt(node.slice(0, 2), 16) & 1) === 1;
        add('node', `${node.match(/../g).join(':')} — ${multicast ? 'multicast bit set, so a random node, not a MAC' : 'unicast, so possibly a real MAC address'}`);
    }

    if (version === 2) {
        const domain = parseInt(hex.slice(18, 20), 16);
        add('local_domain', `${domain}${LOCAL_DOMAINS[domain] ? ` (${LOCAL_DOMAINS[domain]})` : ''}`);
        add('local_id', parseInt(hex.slice(0, 8), 16));
    }

    if (version === 7) {
        add('rand_a', `0x${hex.slice(13, 16)}`);
        add('rand_b', `0x${hex.slice(17)}`);
    }

    const ints = uuidToInts(uuid);
    const uints = uuidToUints(uuid);
    const ulid = uuidToUlid(uuid);

    facts = spellings;
    add('UUID', uuid, true);
    add('Hex', uuidToHex(uuid), true);
    add('Braces', `{${uuid.toUpperCase()}}`, true);
    add('URN', `urn:uuid:${uuid}`, true);
    add('Base64', uuidToBase64Std(uuid), true);
    add('Base64url', uuidToBase64Std(uuid).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), true);
    add('ULID', ulid, true);

    add('Bytes', uuidToBytesString(uuid), true);
    // The order .NET, COM and SQL Server put the first three groups in. Reading
    // a GUID written by one of them as RFC bytes is the classic mix-up.
    add('Bytes, .NET order', msGuidBytes(hex), true);
    add('C struct', cStruct(hex), true);
    add('High/low, signed', plainNumbers(ints), true);
    add('High/low, unsigned', plainNumbers(uints), true);
    // Both readings, the way high/low gets both: protobuf schemas carry these
    // as uint32 or int32 depending on who wrote them, and the same bytes read
    // as either. (Unlike high/low, only the sign differs — not the byte order.)
    const uwords = uuidToWords(uuid);
    const iwords = uuidToWords(uuid, true);
    add('Words, uint32', plainNumbers(uwords), true);
    add('Words, int32', plainNumbers(iwords), true);

    return [
        [FACT_IDENTITY, identity],
        [FACT_CLOCK, clock],
        [FACT_SPELLINGS, spellings],
    ].filter(([, rows]) => rows.length > 0);
}

/** Where a version gets its uniqueness, how much of it is chance, and whether
 *  sorting the text sorts by time. */
const UNIQUENESS = {
    1: 'a clock, a clock sequence and the machine',
    2: 'a clock and a local user or group id',
    3: 'the MD5 hash of a namespace and a name',
    4: 'chance alone',
    5: 'the SHA-1 hash of a namespace and a name',
    6: 'a clock, a clock sequence and the machine',
    7: 'a clock and chance',
    8: 'whatever the implementation chose',
};

const ENTROPY = {
    1: 'none — 14 bits of clock sequence at most',
    2: 'none',
    3: 'none — the same name always gives the same identifier',
    4: '122 of 128',
    5: 'none — the same name always gives the same identifier',
    6: 'none — 14 bits of clock sequence at most',
    7: '74 of 128',
};

const SORTABLE = {
    1: 'no — its time fields are stored low half first',
    2: 'no',
    6: 'yes — this is what it was reordered for',
    7: 'yes — 48 bits of Unix milliseconds lead',
};

function cStruct(hex) {
    const tail = hex.slice(16).match(/../g).map(byte => `0x${byte}`).join(', ');

    return `{ 0x${hex.slice(0, 8)}, 0x${hex.slice(8, 12)}, 0x${hex.slice(12, 16)}, { ${tail} } }`;
}

/** The first three groups little-endian, the way .NET writes a Guid. */
function msGuidBytes(hex) {
    const pairs = hex.match(/../g).map(byte => parseInt(byte, 16));
    const swapped = [
        ...pairs.slice(0, 4).reverse(),
        ...pairs.slice(4, 6).reverse(),
        ...pairs.slice(6, 8).reverse(),
        ...pairs.slice(8),
    ];

    return `[${swapped.join(',')}]`;
}

/** What each field is for, in one sentence, from RFC 9562. */
const FIELD_NOTES = {
    time_low: 'The low 32 bits of a 60-bit clock counting 100-nanosecond ticks since 1582-10-15.',
    time_mid: 'The middle 16 bits of that same clock.',
    time_high: 'The high 12 bits of that clock. In a v1 they sit last, which is why a v1 does not sort by time.',
    unix_ts_ms: '48 bits of Unix milliseconds, most significant first — this is what makes a v7 sort by time.',
    version: 'Which of the layouts in RFC 9562 the rest of the bits follow.',
    variant: 'Which family the identifier belongs to. 10xx is RFC 9562; the other patterns are NCS, Microsoft and reserved.',
    clock_seq: 'Bumped whenever the clock is set backwards, so identifiers made in the same tick still differ.',
    clock_seq_hi: 'The high bits of the clock sequence; a v2 gives the low half to the local domain.',
    local_domain: 'DCE Security: whether local_id is a person, a group, or an organisation.',
    local_id: 'DCE Security: a POSIX UID or GID, in place of the low half of the clock.',
    node: 'The machine: a MAC address, or 48 random bits with the multicast bit set to say it is not one.',
    rand_a: 'Random — unless the generator spent it on sub-millisecond precision or a monotonic counter.',
    rand_b: 'The remaining 62 bits of randomness.',
    md5_high: 'Bits of the MD5 hash of a namespace and a name. The same pair always gives the same identifier.',
    md5_mid: 'More of that hash.',
    md5_low: 'The rest of that hash.',
    sha1_high: 'Bits of the SHA-1 hash of a namespace and a name. The same pair always gives the same identifier.',
    sha1_mid: 'More of that hash.',
    sha1_low: 'The rest of that hash.',
    custom_a: 'Version 8 leaves this to whoever generated it.',
    custom_b: 'Version 8 leaves this to whoever generated it.',
    custom_c: 'Version 8 leaves this to whoever generated it.',
    random: 'Random bits, and nothing else is promised about them.',
};

/**
 * Which field's colour a chip borrows. A chip names an exception, so it takes
 * the colour of the field that exception is about: the version bits for a shape
 * the standard does not define, the clock for one pointing the wrong way. The
 * hex words are about the bytes as a whole, and take the node colour.
 */
const CHIP_KINDS = {
    'nil': 'k-variant',
    'max': 'k-variant',
    'non-rfc': 'k-version',
    'time traveler': 'k-time',
    'palindrome': 'k-clock',
};

/** The value of one field, as hex and — when it is small enough — as a number. */
function fieldValue(hex, from, to) {
    const bits = BigInt('0x' + hex);
    const width = BigInt(to - from + 1);
    const shifted = (bits >> BigInt(127 - to)) & ((1n << width) - 1n);
    const digits = Math.ceil((to - from + 1) / 4);

    return {
        hex: `0x${shifted.toString(16).padStart(digits, '0')}`,
        decimal: shifted <= 9007199254740991n ? shifted.toString() : null,
        bits: shifted.toString(2).padStart(to - from + 1, '0'),
    };
}

/** The runs of a layout, merged: one entry per field, in bit order. */
function fieldRuns(fields) {
    return [...fields].sort((a, b) => a[0] - b[0]);
}

/**
 * The report on one identifier.
 *
 * Designed around the order the questions come in: what is this, when was it
 * made, give it to me in another form, and only then what each part means. The
 * identifier is the specimen — its characters carry the colour of the field
 * they belong to, the bits are fused underneath at four per character, and a
 * ruler under those names the fields outright, so the anatomy reads without
 * touching anything. Hovering previews a field, clicking pins it, arrows walk
 * the characters.
 */
export function inspectBits(uuid) {
    if (alreadyOpen()) {
        return;
    }

    const bytes = uuidToBytes(uuid);

    if (bytes === null) {
        return;
    }

    const hex = uuidToHex(uuid);
    const version = bytes[6] >> 4;
    const fields = fieldsFor(version);
    const runs = fieldRuns(fields);
    const markers = specialValues(uuid);
    const stamp = timestampFromUuid(uuid);
    const versioned = version >= 1 && version <= 8;

    const ui = panel({
        id: 'inspect',
        width: 'is-wide',
        title: versioned ? `UUID v${version}` : 'UUID',
        subtitle: versioned
            ? `${UNIQUENESS[version]}, ${SORTABLE[version] ? 'sortable by time' : 'in no particular order'}.`
            : 'Neither a version nor a variant this standard defines.',
    });

    const report = element('div', 'report');
    ui.body.appendChild(report);

    // ---- 0. when it was made, and anything unusual about it ----
    if (stamp || markers.length > 0) {
        const meta = element('div', 'report-meta');

        if (stamp) {
            const when = element('p', 'report-when');
            when.append(
                element('span', 'report-when-relative', since(stamp)),
                element('span', 'report-when-exact', stamp),
            );
            meta.appendChild(when);
        }

        if (markers.length > 0) {
            const chips = element('div', 'report-chips');

            for (const marker of markers) {
                chips.appendChild(element('span', `report-chip ${CHIP_KINDS[marker] ?? 'k-node'}`, marker.toUpperCase()));
            }

            meta.appendChild(chips);
        }

        report.appendChild(meta);
    }

    // ---- 1. the specimen ----
    const specimen = element('div', 'report-specimen');
    const chars = element('div', 'report-chars');
    chars.setAttribute('role', 'group');
    chars.setAttribute('aria-label', `${uuid}, character by character`);
    const strip = element('div', 'report-bits');
    strip.setAttribute('aria-hidden', 'true');
    const ruler = element('div', 'report-ruler');
    ruler.setAttribute('aria-hidden', 'true');
    // The bridge between this map and the byte array two rows below it.
    const octets = element('div', 'report-octets');
    octets.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < 16; i++) {
        octets.appendChild(element('span', 'report-octet', i % 4 === 0 ? `byte ${i}` : ''));
    }

    specimen.append(chars, strip, ruler, octets);
    report.appendChild(specimen);

    const groupStarts = new Set([8, 12, 16, 20]);
    const charButtons = [];

    for (let i = 0; i < 32; i++) {
        const [from, to, kind, label] = fieldAt(fields, i * 4);
        const button = element('button', `report-char k-${kind}${groupStarts.has(i) ? ' is-group' : ''}`, hex[i]);
        button.type = 'button';
        button.tabIndex = i === 0 ? 0 : -1;
        button.dataset.field = label;
        button.dataset.from = String(from);
        button.dataset.to = String(to);
        button.setAttribute('aria-label', `character ${i + 1}, ${hex[i]}, ${label}`);
        chars.appendChild(button);
        charButtons.push(button);
    }

    const cells = [];

    for (let i = 0; i < 128; i++) {
        const [, , kind, label] = fieldAt(fields, i);
        const bit = (bytes[i >> 3] >> (7 - (i % 8))) & 1;
        const cell = element('span', `report-bit k-${kind}${bit ? ' is-on' : ''}${[32, 48, 64, 80].includes(i) ? ' is-group' : ''}`);
        cell.dataset.field = label;
        strip.appendChild(cell);
        cells.push(cell);
    }

    // The ruler: one segment per field, as wide as the field is.
    for (const [from, to, kind, label] of runs) {
        const wide = to - from + 1 >= 12;
        const segment = element('span', `report-run k-${kind}${wide ? '' : ' is-narrow'}`, label);
        segment.style.flexGrow = String(to - from + 1);
        segment.dataset.field = label;
        segment.dataset.from = String(from);
        segment.dataset.to = String(to);
        ruler.appendChild(segment);
    }

    // ---- 2. the reading ----
    const reading = element('div', 'report-reading');
    const readingTop = element('div', 'report-reading-top');
    const readingName = element('p', 'report-reading-name');
    const readingCopy = element('button', 'report-reading-copy', 'copy field');
    readingCopy.type = 'button';
    readingTop.append(readingName, readingCopy);
    const readingValue = element('p', 'report-reading-value');
    const readingBinary = element('p', 'report-reading-binary');
    const readingNote = element('p', 'report-reading-note');
    reading.append(readingTop, readingValue, readingBinary, readingNote);
    report.appendChild(reading);

    let readingText = '';

    readingCopy.addEventListener('click', () => {
        copyText(readingText)
            .then(() => {
                readingCopy.textContent = 'copied';
                setTimeout(() => { readingCopy.textContent = 'copy field'; }, 1200);
            })
            .catch(error => toast.error('Error copying text', { description: error.message }));
    });

    let pinned = null;

    const show = (label, from, to) => {
        const { hex: asHex, decimal, bits: asBits } = fieldValue(hex, from, to);
        const width = to - from + 1;

        readingName.textContent = `${label} · bits ${from}–${to}`;
        readingValue.textContent = decimal === null ? asHex : `${asHex} · ${decimal}`;
        readingText = asHex;
        // A field narrow enough to read bit by bit is worth showing that way:
        // the version and variant nibbles are the ones people check by eye.
        readingBinary.textContent = width <= 8 ? `${asBits} · ${width} bits` : '';
        readingNote.textContent = FIELD_NOTES[label] ?? '';

        for (const node of [...charButtons, ...cells, ...ruler.children]) {
            node.classList.toggle('is-picked', node.dataset.field === label);
        }
    };

    const showFrom = (node) => show(node.dataset.field, Number(node.dataset.from), Number(node.dataset.to));
    const restore = () => (pinned ? showFrom(pinned) : null);

    const focusChar = (next) => {
        const target = charButtons[Math.max(0, Math.min(charButtons.length - 1, next))];
        charButtons.forEach(button => { button.tabIndex = button === target ? 0 : -1; });
        // Walking the identifier must not scroll the sheet out from under it.
        target.focus({ preventScroll: true });
    };

    charButtons.forEach((button, index) => {
        button.addEventListener('mouseenter', () => showFrom(button));
        button.addEventListener('mouseleave', restore);
        button.addEventListener('focus', () => showFrom(button));
        button.addEventListener('click', () => { pinned = button; showFrom(button); });
        button.addEventListener('keydown', (e) => {
            const moves = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: charButtons.length - 1 };

            if (e.key in moves) {
                e.preventDefault();
                focusChar(moves[e.key]);
            }
        });
    });

    cells.forEach((cell, i) => {
        cell.addEventListener('mouseenter', () => showFrom(charButtons[Math.floor(i / 4)]));
        cell.addEventListener('mouseleave', restore);
    });

    [...ruler.children].forEach(segment => {
        segment.addEventListener('mouseenter', () => showFrom(segment));
        segment.addEventListener('mouseleave', restore);
    });

    const [versionFrom, versionTo, , versionLabel] = fieldAt(fields, 48);
    show(versionLabel, versionFrom, versionTo);

    // ---- 3. the same value, other spellings ----
    // By name, not by position: an identifier with no clock has no clock group,
    // and reading these off an array would then hand the spellings to
    // Properties and leave this section empty.
    const facts = Object.fromEntries(factsAbout(uuid, hex, version));
    const identity = facts[FACT_IDENTITY] ?? [];
    const clock = facts[FACT_CLOCK] ?? [];
    const spellings = facts[FACT_SPELLINGS] ?? [];

    if (spellings.length > 0) {
        report.appendChild(element('p', 'report-heading', FACT_SPELLINGS));
        const list = element('dl', 'report-copy');

        for (const [label, text] of spellings) {
            const row = element('div', 'report-copy-row');
            row.append(element('dt', 'report-copy-label', label));

            const value = element('button', 'report-copy-value', text);
            value.type = 'button';
            value.title = 'Click to copy';
            value.addEventListener('click', () => {
                copyText(text)
                    .then(() => {
                        value.classList.add('is-copied');
                        setTimeout(() => value.classList.remove('is-copied'), 1200);
                    })
                    .catch(error => toast.error('Error copying text', { description: error.message }));
            });

            const cell = element('dd', 'report-copy-cell');
            cell.appendChild(value);
            row.appendChild(cell);
            list.appendChild(row);
        }

        report.appendChild(list);
    }

    // ---- 4. the small print ----
    // What it is before what its clock reads, and no Timestamp row: the head of
    // the sheet already gives the time twice, relative and exact.
    const properties = [...identity, ...clock.filter(([label]) => label !== 'Timestamp')];

    if (properties.length > 0) {
        report.appendChild(element('p', 'report-heading', 'Properties'));
        const list = element('dl', 'report-properties');

        for (const [label, text] of properties) {
            list.append(
                element('dt', 'report-property-name', label),
                element('dd', 'report-property-value', text),
            );
        }

        report.appendChild(list);
    }

    const remark = VERSION_NOTES[version];

    if (remark) {
        report.appendChild(element('p', 'report-footnote', remark));
    }
}

/**
 * A v4 and a v7 laid out bit by bit. The point is what does *not* move: six bits
 * the standard fixes in both, and in a v7 the 48 leading bits of a clock that
 * only ever counts up. Click a cell to be told what it is.
 */
export const ENTROPY_KINDS = [
    { id: '1', label: 'v1', note: 'A clock and a node. The node never moves, the low bits of the clock never stop.' },
    { id: '4', label: 'v4', note: '122 bits of chance. Only the version and the variant are spoken for.' },
    { id: '5', label: 'v5', note: 'Nothing here is chance: the same namespace and name always give these same bits.' },
    { id: '6', label: 'v6', note: 'The v1 clock, reordered so that sorting the bytes sorts by time.' },
    { id: '7', label: 'v7', note: '48 bits of Unix milliseconds, then chance.' },
    { id: '8', label: 'v8', note: 'Whatever the implementation decided; here it is chance.' },
    { id: 'ulid', label: 'ULID', note: '48 bits of Unix milliseconds and 80 of chance. No version, no variant.' },
];

const ULID_FIELDS = [[0, 47, 'time', 'unix_ts_ms'], [48, 127, 'random', 'randomness']];

/** What holds a bit still, for the bits that chance does not decide. */
const BIT_HELD = {
    version: 'fixed by the format',
    variant: 'fixed by the format',
    time: 'moves with the clock',
    clock: 'steady while the machine runs',
    node: 'steady while the machine runs',
    hash: 'decided by the namespace and the name',
};

export function fieldsOfKind(id) {
    return id === 'ulid' ? ULID_FIELDS : fieldsFor(Number(id));
}

function writeBits(bytes, from, to, value) {
    let held = BigInt(value);

    for (let i = to; i >= from; i--) {
        const bit = Number(held & 1n);
        const mask = 1 << (7 - (i % 8));

        bytes[i >> 3] = bit ? (bytes[i >> 3] | mask) : (bytes[i >> 3] & ~mask);
        held >>= 1n;
    }
}

/**
 * A fresh identifier of the chosen kind, written into `bytes`. The parts that
 * a real generator holds still — a node, a clock sequence, the hash of a name —
 * are held still here too: the whole demonstration is which cells stop moving.
 */
export function fillEntropyBytes(bytes, id, steady) {
    crypto.getRandomValues(bytes);

    if (id === '5' || id === '3') {
        const held = uuidToBytes(nameBased(Number(id), DEFAULT_NAMESPACE, DEFAULT_NAME));

        bytes.set(held);

        return;
    }

    const now = Date.now();

    if (id === 'ulid') {
        writeBits(bytes, 0, 47, BigInt(now));

        return;
    }

    if (id === '1' || id === '6') {
        // 100-nanosecond ticks since 1582-10-15, the epoch RFC 9562 gives these
        // two. The sub-millisecond digits are what keeps the low bits moving.
        const ticks = (BigInt(now) + 12219292800000n) * 10000n + BigInt(steady.spin % 10000);

        if (id === '1') {
            writeBits(bytes, 0, 31, ticks & 0xffffffffn);
            writeBits(bytes, 32, 47, (ticks >> 32n) & 0xffffn);
            writeBits(bytes, 52, 63, (ticks >> 48n) & 0xfffn);
        } else {
            writeBits(bytes, 0, 31, (ticks >> 28n) & 0xffffffffn);
            writeBits(bytes, 32, 47, (ticks >> 12n) & 0xffffn);
            writeBits(bytes, 52, 63, ticks & 0xfffn);
        }

        writeBits(bytes, 66, 79, steady.clock);
        writeBits(bytes, 80, 127, steady.node);
    }

    if (id === '7') {
        writeBits(bytes, 0, 47, BigInt(now));
    }

    bytes[6] = (bytes[6] & 0x0f) | (Number(id) << 4);
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
}

export function entropyView() {
    if (alreadyOpen()) {
        return;
    }

    const ui = panel({
        id: 'entropy',
        title: 'What is random in an identifier',
        subtitle: 'Every cell is one bit of a fresh identifier. Watch which ones never change.',
    });

    const toolbar = element('div', 'lab-toolbar');
    const segmented = element('div', 'lab-seg');
    segmented.setAttribute('role', 'group');
    segmented.setAttribute('aria-label', 'Kind of identifier');
    const shuffle = button('New one');
    const pause = button('Pause');
    toolbar.append(segmented, shuffle, pause);

    const grid = element('div', 'lab-grid');
    const readout = element('p', 'lab-readout', 'Click a cell to see what that bit is.');
    const value = element('p', 'lab-uuid', '');
    const note = element('p', 'lab-note', '');
    const legend = element('div', 'lab-legend');
    ui.body.append(toolbar, grid, readout, value, note, legend);

    let kind = '4';
    let fields = fieldsOfKind(kind);

    // A machine keeps the same node and clock sequence for as long as it runs;
    // so does this panel, or the point of the two would be lost.
    const seed = new Uint32Array(4);
    crypto.getRandomValues(seed);
    const steady = {
        node: (BigInt(seed[0]) << 16n | BigInt(seed[1] & 0xffff)) | (1n << 40n),
        clock: BigInt(seed[2] & 0x3fff),
        spin: 0,
    };

    const at = (index) => fieldAt(fields, index);

    const cells = Array.from({ length: 128 }, (_, i) => {
        const cell = element('button', 'lab-bit');
        cell.type = 'button';
        const describe = () => {
            const [, , what, name] = at(i);
            const bit = cell.classList.contains('is-on') ? 1 : 0;
            const said = name === BIT_KINDS[what] ? name : `${name} · ${BIT_KINDS[what]}`;
            readout.textContent = `bit ${i} · ${said} · currently ${bit}` +
                (BIT_HELD[what] ? ` · ${BIT_HELD[what]}` : '');
        };
        cell.addEventListener('click', describe);
        cell.addEventListener('mouseenter', describe);
        grid.appendChild(cell);
        return cell;
    });

    for (const [what, label] of Object.entries(BIT_KINDS)) {
        const item = element('span', 'lab-legend-item');
        item.append(element('span', `lab-legend-key k-${what} is-on`), element('span', null, label));
        item.dataset.kind = what;
        legend.appendChild(item);
    }

    const bytes = new Uint8Array(16);
    const paint = () => {
        steady.spin += 1;
        fillEntropyBytes(bytes, kind, steady);

        cells.forEach((cell, i) => {
            const what = at(i)[2];
            const bit = (bytes[i >> 3] >> (7 - (i % 8))) & 1;
            cell.className = `lab-bit k-${what}${bit ? ' is-on' : ''}`;
            cell.setAttribute('aria-label', `bit ${i}, ${BIT_KINDS[what]}, ${bit}`);
        });

        const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
        const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        value.textContent = kind === 'ulid' ? uuidToUlid(uuid) : uuid;

        const present = new Set(fields.map(([, , what]) => what));
        legend.querySelectorAll('.lab-legend-item').forEach(item => {
            item.hidden = !present.has(item.dataset.kind);
        });
    };

    ENTROPY_KINDS.forEach(candidate => {
        const option = button(candidate.label, '');
        option.setAttribute('aria-pressed', String(candidate.id === kind));
        option.classList.toggle('is-on', candidate.id === kind);
        option.addEventListener('click', () => {
            kind = candidate.id;
            fields = fieldsOfKind(kind);
            note.textContent = candidate.note;
            segmented.querySelectorAll('button').forEach(other => {
                const on = other === option;
                other.classList.toggle('is-on', on);
                other.setAttribute('aria-pressed', String(on));
            });
            paint();
        });
        segmented.appendChild(option);
    });

    note.textContent = ENTROPY_KINDS.find(candidate => candidate.id === kind).note;

    let timer = setInterval(paint, 900);
    pause.addEventListener('click', () => {
        if (timer) {
            clearInterval(timer);
            timer = null;
            pause.textContent = 'Resume';
        } else {
            timer = setInterval(paint, 900);
            pause.textContent = 'Pause';
        }
    });

    shuffle.addEventListener('click', paint);
    paint();
    ui.onClosed(() => { if (timer) clearInterval(timer); });
}

const MINE_LEVELS = [
    { label: 'Small', side: 9, mines: 10 },
    { label: 'Medium', side: 12, mines: 22 },
    { label: 'Large', side: 16, mines: 40 },
];

const FLAG_SVG = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M4.5 2v12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M4.5 3h7l-2 2.5 2 2.5h-7z" fill="currentColor"/></svg>';

const MINE_SVG = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<circle cx="8" cy="8" r="3.4" fill="currentColor"/>' +
    '<path d="M8 1.5v2.2M8 12.3v2.2M1.5 8h2.2M12.3 8h2.2M3.4 3.4l1.6 1.6M11 11l1.6 1.6M12.6 3.4L11 5M5 11l-1.6 1.6" ' +
    'stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

/**
 * Minesweeper, dealt by the same source of randomness the rest of this tool
 * argues about. Everything the real game has: a safe first click, chording,
 * flags and question marks, a clock, a personal best, long-press on touch, and
 * the whole board playable from the keyboard.
 */
export function minesweeper(options = {}) {
    if (document.querySelector(`[data-lab="mines"]`)) {
        return;
    }

    const ui = panel({
        id: 'mines',
        mount: options.mount,
        onDismiss: options.onDismiss,
        title: 'Minesweeper',
        subtitle: 'Open a cell, right-click to flag, click a satisfied number to open the rest. Arrows, Enter and F play it from the keyboard.',
    });

    const toolbar = element('div', 'lab-toolbar');
    const segmented = element('div', 'lab-seg');
    segmented.setAttribute('role', 'group');
    segmented.setAttribute('aria-label', 'Board size');
    const again = button('New game');
    toolbar.append(segmented, again);

    const status = element('div', 'mine-status');
    const minesLeft = element('span', 'mine-stat');
    const clock = element('span', 'mine-stat');
    const best = element('span', 'mine-stat');
    const verdict = element('span', 'mine-verdict');
    // The only feedback a blind player gets, so it is announced.
    verdict.setAttribute('role', 'status');
    status.append(minesLeft, clock, best, verdict);

    const grid = element('div', 'mine-grid');
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', 'Minefield');
    ui.body.append(toolbar, status, grid);

    let level = MINE_LEVELS[0];
    let cells = [];
    let mines = new Set();
    let opened = new Set();
    let marks = new Map();      // index -> 'flag' | 'maybe'
    let placed = false;
    let over = false;
    let boom = -1;
    let cursor = 0;
    let seconds = 0;
    let ticker = null;

    const total = () => level.side * level.side;
    const isFlag = (i) => marks.get(i) === 'flag';
    const flagCount = () => [...marks.values()].filter(mark => mark === 'flag').length;

    const neighbours = (i) => {
        const x = i % level.side;
        const y = Math.floor(i / level.side);
        const out = [];

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;

                if ((dx || dy) && nx >= 0 && nx < level.side && ny >= 0 && ny < level.side) {
                    out.push(ny * level.side + nx);
                }
            }
        }

        return out;
    };

    const countAt = (i) => neighbours(i).filter(n => mines.has(n)).length;

    const stopClock = () => {
        if (ticker) {
            clearInterval(ticker);
            ticker = null;
        }
    };

    const showStats = () => {
        // The counter goes negative when over-flagged, exactly as the original
        // does: it counts flags, it does not police them.
        minesLeft.textContent = `${level.mines - flagCount()} left`;
        clock.textContent = `${seconds}s`;
        const record = readBestTimes()[level.label];
        best.textContent = typeof record === 'number' ? `best ${record}s` : 'best —';
    };

    const startClock = () => {
        stopClock();
        ticker = setInterval(() => {
            seconds++;
            showStats();
        }, 1000);
    };

    const paint = (i) => {
        const cell = cells[i];
        const isOpen = opened.has(i);
        const mark = isOpen ? null : marks.get(i);
        const isMine = mines.has(i);
        const count = isOpen && !isMine ? countAt(i) : 0;

        cell.className = 'mine-cell'
            + (isOpen ? ' is-open' : '')
            + (mark === 'flag' ? ' is-flag' : '')
            + (mark === 'maybe' ? ' is-maybe' : '')
            + (isOpen && isMine ? ' is-mine' : '')
            + (i === boom ? ' is-boom' : '')
            + (over && mark === 'flag' && !isMine ? ' is-wrong' : '');
        cell.innerHTML = '';
        delete cell.dataset.n;

        if (mark === 'flag') {
            cell.innerHTML = FLAG_SVG;
        } else if (mark === 'maybe') {
            cell.textContent = '?';
        } else if (isOpen && isMine) {
            cell.innerHTML = MINE_SVG;
        } else if (count > 0) {
            cell.textContent = String(count);
            cell.dataset.n = String(count);
        }

        const where = `${i % level.side + 1}, ${Math.floor(i / level.side) + 1}`;
        const what = mark === 'flag' ? 'flagged'
            : mark === 'maybe' ? 'marked unsure'
                : !isOpen ? 'closed'
                    : isMine ? 'mine'
                        : count > 0 ? `${count}` : 'empty';
        cell.setAttribute('aria-label', `${where}: ${what}`);
    };

    const repaint = () => cells.forEach((_, i) => paint(i));

    const finish = (won) => {
        over = true;
        stopClock();

        if (!won) {
            // A mine that was correctly flagged keeps its flag: the board should
            // show what the player got right, not overwrite it.
            mines.forEach(m => {
                if (marks.get(m) !== 'flag') {
                    opened.add(m);
                }
            });

            grid.classList.add('is-boom');
            setTimeout(() => grid.classList.remove('is-boom'), 400);
        }

        repaint();

        if (won) {
            const record = writeBestTime(level.label, seconds);
            verdict.textContent = record === seconds
                ? `Cleared in ${seconds}s — a new best.`
                : `Cleared in ${seconds}s.`;
        } else {
            verdict.textContent = 'Boom.';
        }

        showStats();
    };

    const place = (safe) => {
        const forbidden = new Set([safe, ...neighbours(safe)]);
        const draw = new Uint32Array(1);

        while (mines.size < level.mines) {
            crypto.getRandomValues(draw);
            const candidate = draw[0] % total();

            if (!forbidden.has(candidate)) {
                mines.add(candidate);
            }
        }

        placed = true;
        startClock();
    };

    const open = (start) => {
        if (over || isFlag(start) || opened.has(start)) {
            return;
        }

        if (!placed) {
            place(start);
        }

        marks.delete(start);

        if (mines.has(start)) {
            opened.add(start);
            boom = start;
            finish(false);
            return;
        }

        const queue = [start];
        const revealed = [];

        while (queue.length > 0) {
            const i = queue.pop();

            if (opened.has(i) || isFlag(i)) {
                continue;
            }

            marks.delete(i);
            opened.add(i);
            revealed.push(i);
            paint(i);

            if (countAt(i) === 0) {
                neighbours(i).forEach(n => queue.push(n));
            }
        }

        // The flood reads as one gesture when it arrives in the order it spread.
        const originX = start % level.side;
        const originY = Math.floor(start / level.side);
        revealed.forEach(i => {
            const distance = Math.max(
                Math.abs(i % level.side - originX),
                Math.abs(Math.floor(i / level.side) - originY),
            );
            cells[i].style.setProperty('--reveal-delay', `${Math.min(distance * 22, 260)}ms`);
            cells[i].classList.add('just-opened');
            setTimeout(() => cells[i]?.classList.remove('just-opened'), 500 + distance * 22);
        });

        if (opened.size === total() - level.mines) {
            finish(true);
            return;
        }

        showStats();
    };

    /** Opening a satisfied number: the move that makes the game quick. */
    const chord = (i) => {
        if (over || !opened.has(i) || mines.has(i)) {
            return;
        }

        const around = neighbours(i);

        if (around.filter(isFlag).length !== countAt(i)) {
            // Not satisfied: say so by flashing what is still closed around it.
            around.filter(n => !opened.has(n) && !isFlag(n)).forEach(n => {
                cells[n].classList.add('is-nudge');
                setTimeout(() => cells[n]?.classList.remove('is-nudge'), 200);
            });
            return;
        }

        around.filter(n => !isFlag(n) && !opened.has(n)).forEach(open);
    };

    /** none -> flag -> unsure -> none, the way the original cycles. */
    const cycleMark = (i) => {
        if (over || opened.has(i)) {
            return;
        }

        const mark = marks.get(i);

        if (mark === undefined) {
            marks.set(i, 'flag');
        } else if (mark === 'flag') {
            marks.set(i, 'maybe');
        } else {
            marks.delete(i);
        }

        paint(i);
        showStats();
    };

    // A roving tabindex: one stop for the whole board, arrows to move inside it.
    const focusCell = (next) => {
        const clamped = Math.max(0, Math.min(total() - 1, next));
        cells[cursor].tabIndex = -1;
        cursor = clamped;
        cells[cursor].tabIndex = 0;
        cells[cursor].focus();
    };

    const onGridKey = (e) => {
        const moves = {
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: -level.side,
            ArrowDown: level.side,
        };

        if (e.key in moves) {
            e.preventDefault();
            const x = cursor % level.side;

            if ((e.key === 'ArrowLeft' && x === 0) || (e.key === 'ArrowRight' && x === level.side - 1)) {
                return;
            }

            focusCell(cursor + moves[e.key]);
            return;
        }

        if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            cycleMark(cursor);
        }
    };

    const build = () => {
        stopClock();
        mines = new Set();
        opened = new Set();
        marks = new Map();
        placed = false;
        over = false;
        boom = -1;
        cursor = 0;
        seconds = 0;
        verdict.textContent = '';
        grid.textContent = '';
        grid.style.setProperty('--mine-side', String(level.side));

        cells = Array.from({ length: total() }, (_, i) => {
            const cell = element('button', 'mine-cell');
            cell.type = 'button';
            cell.tabIndex = i === 0 ? 0 : -1;

            let held = null;
            const cancelHold = () => {
                if (held) {
                    clearTimeout(held);
                    held = null;
                }
            };

            cell.addEventListener('click', () => {
                focusCell(i);

                if (held === false) {
                    // the click that follows a long press is not a move
                    held = null;
                    return;
                }

                if (opened.has(i)) {
                    chord(i);
                } else {
                    open(i);
                }
            });

            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                focusCell(i);
                cycleMark(i);
            });

            // Touch has no right button: holding a cell flags it.
            cell.addEventListener('pointerdown', (e) => {
                if (e.pointerType === 'mouse') {
                    return;
                }

                held = setTimeout(() => {
                    held = false;
                    cycleMark(i);
                }, 400);
            });
            cell.addEventListener('pointerup', cancelHold);
            cell.addEventListener('pointercancel', cancelHold);
            cell.addEventListener('pointerleave', cancelHold);

            grid.appendChild(cell);
            return cell;
        });

        repaint();
        showStats();
    };

    MINE_LEVELS.forEach(choice => {
        const option = button(`${choice.side}x${choice.side}`, '');
        option.title = `${choice.mines} mines`;
        option.setAttribute('aria-pressed', String(choice === level));
        option.classList.toggle('is-on', choice === level);
        option.addEventListener('click', () => {
            level = choice;
            segmented.querySelectorAll('button').forEach(other => {
                const on = other === option;
                other.classList.toggle('is-on', on);
                other.setAttribute('aria-pressed', String(on));
            });
            build();
        });
        segmented.appendChild(option);
    });

    grid.addEventListener('keydown', onGridKey);
    again.addEventListener('click', build);
    ui.onClosed(stopClock);
    build();
}

const TILE_SIDE = 4;

/** Two random cells to start, one per move after that; 4 shows up a tenth of the time. */
function spawnTile(board) {
    const empty = board.map((value, i) => (value === 0 ? i : -1)).filter(i => i >= 0);

    if (empty.length === 0) {
        return -1;
    }

    const draw = new Uint32Array(2);
    crypto.getRandomValues(draw);
    const where = empty[draw[0] % empty.length];
    board[where] = draw[1] % 10 === 0 ? 4 : 2;
    return where;
}

/**
 * One row, squeezed towards the front. Returns the row, what it scored, and
 * where every tile came from — without that last part there is nothing to
 * animate, and 2048 without sliding tiles is a spreadsheet.
 */
function squeeze(row) {
    const packed = [];
    row.forEach((value, from) => {
        if (value !== 0) {
            packed.push({ value, from });
        }
    });

    const out = [];
    const moves = [];
    let gained = 0;

    for (let i = 0; i < packed.length; i++) {
        const to = out.length;

        if (packed[i + 1] && packed[i].value === packed[i + 1].value) {
            out.push(packed[i].value * 2);
            gained += packed[i].value * 2;
            moves.push({ from: packed[i].from, to, merged: true });
            moves.push({ from: packed[i + 1].from, to, merged: true });
            i++;
        } else {
            out.push(packed[i].value);
            moves.push({ from: packed[i].from, to, merged: false });
        }
    }

    while (out.length < TILE_SIDE) {
        out.push(0);
    }

    return { row: out, gained, moves };
}

function lineOf(board, direction, index) {
    const cells = [];

    for (let i = 0; i < TILE_SIDE; i++) {
        const step = direction === 'left' || direction === 'right' ? index * TILE_SIDE + i : i * TILE_SIDE + index;
        cells.push(step);
    }

    return direction === 'right' || direction === 'down' ? cells.reverse() : cells;
}

/**
 * 2048. Arrows or WASD; every merge is a power of two, which is the one number
 * system this tool already lives in.
 */
export function tiles(options = {}) {
    if (document.querySelector(`[data-lab="tiles"]`)) {
        return;
    }

    const ui = panel({
        id: 'tiles',
        mount: options.mount,
        onDismiss: options.onDismiss,
        title: '2048',
        subtitle: 'Arrows or WASD slide everything one way; equal tiles merge. Powers of two, all the way up.',
    });

    const toolbar = element('div', 'lab-toolbar');
    const again = button('New game');
    const status = element('div', 'mine-status');
    const scoreValue = element('span', 'mine-stat');
    const bestValue = element('span', 'mine-stat');
    const verdict = element('span', 'mine-verdict');
    verdict.setAttribute('role', 'status');
    status.append(scoreValue, bestValue, verdict);
    toolbar.append(again);

    const grid = element('div', 'tile-grid');
    grid.tabIndex = 0;
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', '2048 board');
    ui.body.append(toolbar, status, grid);

    let board = [];
    let cells = [];
    let score = 0;
    let over = false;

    const showStats = () => {
        scoreValue.textContent = `score ${score}`;
        const record = readBestScores()['2048'];
        bestValue.textContent = typeof record === 'number' ? `best ${record}` : 'best —';
    };

    const paint = () => {
        board.forEach((value, i) => {
            cells[i].textContent = value === 0 ? '' : String(value);
            cells[i].className = `tile-cell${value ? ` is-set v-${Math.min(value, 2048)}` : ''}`;
        });
        showStats();
    };

    const canMove = () => board.some((value, i) => value === 0
        || (i % TILE_SIDE < TILE_SIDE - 1 && value === board[i + 1])
        || (i < board.length - TILE_SIDE && value === board[i + TILE_SIDE]));

    /** FLIP: the tile is already at its destination, so it starts displaced. */
    const slide = (steps, merged, spawned) => {
        // A move that lands while the previous one is still travelling must not
        // inherit its offset.
        cells.forEach(cell => { cell.style.transform = ''; });

        const first = cells[0].getBoundingClientRect();
        const step = first.width + 6;   // cell plus the grid gap

        steps.forEach(({ from, to }) => {
            const dx = ((from % TILE_SIDE) - (to % TILE_SIDE)) * step;
            const dy = (Math.floor(from / TILE_SIDE) - Math.floor(to / TILE_SIDE)) * step;

            if (dx === 0 && dy === 0) {
                return;
            }

            const cell = cells[to];
            cell.style.transition = 'none';
            cell.style.transform = `translate(${dx}px, ${dy}px)`;
            // read back, so the browser has a start state to animate from
            void cell.offsetWidth;
            cell.style.transition = '';
            cell.style.transform = '';
        });

        merged.forEach(i => {
            cells[i].classList.add('is-merged');
            setTimeout(() => cells[i]?.classList.remove('is-merged'), 220);
        });

        if (spawned >= 0) {
            cells[spawned].classList.add('is-new');
            setTimeout(() => cells[spawned]?.classList.remove('is-new'), 200);
        }
    };

    const move = (direction) => {
        if (over) {
            return;
        }

        let moved = false;
        let gainedThisMove = 0;
        const steps = [];
        const merged = [];

        for (let index = 0; index < TILE_SIDE; index++) {
            const line = lineOf(board, direction, index);
            const { row, gained, moves } = squeeze(line.map(cell => board[cell]));

            moves.forEach(({ from, to, merged: isMerge }) => {
                steps.push({ from: line[from], to: line[to] });

                if (isMerge && !merged.includes(line[to])) {
                    merged.push(line[to]);
                }
            });

            line.forEach((cell, i) => {
                if (board[cell] !== row[i]) {
                    moved = true;
                }
                board[cell] = row[i];
            });

            score += gained;
            gainedThisMove += gained;
        }

        if (!moved) {
            return;
        }

        const spawned = spawnTile(board);

        // The record follows the score up rather than waiting for the game to
        // end: a run abandoned at a personal best still counted.
        if (gainedThisMove > 0) {
            writeBestScore('2048', score);
        }

        paint();
        slide(steps, merged, spawned);

        if (board.includes(2048) && verdict.textContent === '') {
            verdict.textContent = '2048. Keep going.';
        }

        if (!canMove()) {
            over = true;
            verdict.textContent = `No moves left. ${score}.`;
            showStats();
        }
    };

    const KEYS = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', d: 'right', w: 'up', s: 'down',
    };

    grid.addEventListener('keydown', (e) => {
        const direction = KEYS[e.key];

        if (direction) {
            e.preventDefault();
            move(direction);
        }
    });

    const start = () => {
        board = new Array(TILE_SIDE * TILE_SIDE).fill(0);
        score = 0;
        over = false;
        verdict.textContent = '';
        grid.textContent = '';

        cells = Array.from({ length: TILE_SIDE * TILE_SIDE }, () => {
            const cell = element('div', 'tile-cell');
            grid.appendChild(cell);
            return cell;
        });

        spawnTile(board);
        spawnTile(board);
        paint();
        cells.forEach(cell => { cell.style.transform = ''; });
        grid.focus();
    };

    again.addEventListener('click', start);
    start();
}

const LIGHTS_SIDE = 5;

/**
 * Lights Out. Pressing a cell flips it and its four neighbours; the board is
 * dealt by flipping random cells from a solved one, so it is always solvable.
 */
export function lightsOut(options = {}) {
    if (document.querySelector(`[data-lab="lights"]`)) {
        return;
    }

    const ui = panel({
        id: 'lights',
        mount: options.mount,
        onDismiss: options.onDismiss,
        title: 'Lights Out',
        subtitle: 'A press flips the cell and its four neighbours. Turn everything off.',
    });

    const toolbar = element('div', 'lab-toolbar');
    const again = button('New board');
    toolbar.append(again);

    const status = element('div', 'mine-status');
    const moveCount = element('span', 'mine-stat');
    const bestValue = element('span', 'mine-stat');
    const verdict = element('span', 'mine-verdict');
    verdict.setAttribute('role', 'status');
    status.append(moveCount, bestValue, verdict);

    const grid = element('div', 'lights-grid');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Lights Out board');
    ui.body.append(toolbar, status, grid);

    let lit = [];
    let cells = [];
    let moves = 0;
    let solved = false;

    const showStats = () => {
        moveCount.textContent = `${moves} move${moves === 1 ? '' : 's'}`;
        const record = readBestTimes()['Lights Out'];
        bestValue.textContent = typeof record === 'number' ? `best ${record}` : 'best —';
    };

    const paint = () => {
        lit.forEach((on, i) => {
            cells[i].className = `lights-cell${on ? ' is-on' : ''}`;
            cells[i].setAttribute('aria-pressed', String(on));
        });
        showStats();
    };

    const flip = (i) => {
        const x = i % LIGHTS_SIDE;
        const y = Math.floor(i / LIGHTS_SIDE);
        const targets = [i];

        if (x > 0) targets.push(i - 1);
        if (x < LIGHTS_SIDE - 1) targets.push(i + 1);
        if (y > 0) targets.push(i - LIGHTS_SIDE);
        if (y < LIGHTS_SIDE - 1) targets.push(i + LIGHTS_SIDE);

        targets.forEach(t => { lit[t] = !lit[t]; });
    };

    const press = (i) => {
        if (solved) {
            return;
        }

        flip(i);
        moves++;
        paint();

        if (lit.every(on => !on)) {
            solved = true;
            const record = writeBestTime('Lights Out', moves);
            verdict.textContent = record === moves ? `Out in ${moves} — a new best.` : `Out in ${moves}.`;
            showStats();
        }
    };

    const deal = () => {
        lit = new Array(LIGHTS_SIDE * LIGHTS_SIDE).fill(false);
        moves = 0;
        solved = false;
        verdict.textContent = '';
        grid.textContent = '';

        cells = Array.from({ length: LIGHTS_SIDE * LIGHTS_SIDE }, (_, i) => {
            const cell = element('button', 'lights-cell');
            cell.type = 'button';
            cell.setAttribute('aria-label', `light ${i % LIGHTS_SIDE + 1}, ${Math.floor(i / LIGHTS_SIDE) + 1}`);
            cell.addEventListener('click', () => press(i));
            grid.appendChild(cell);
            return cell;
        });

        // Random presses from a solved board: unsolvable layouts cannot happen.
        const draw = new Uint32Array(12);
        crypto.getRandomValues(draw);
        draw.forEach(value => flip(value % (LIGHTS_SIDE * LIGHTS_SIDE)));

        if (lit.every(on => !on)) {
            flip(12);
        }

        paint();
    };

    again.addEventListener('click', deal);
    deal();
}

const TYPED = [
    ['collide', 'The birthday paradox, run for real.', 'collide'],
    ['mines', 'Minesweeper, dealt by crypto.getRandomValues.', 'mines'],
    ['2048', 'Powers of two, slid around a 4x4 board.', '2048'],
    ['lights', 'Lights Out: press a cell, flip its neighbours.', 'lights'],
    ['bits', 'Which bits of a v4 are actually random.', 'bits'],
    ['rain', 'Hex falls over the page.', 'rain'],
    ['game', 'Space Runner.', 'space-runner'],
    ['sudo', 'Try it.', 'sudo'],
    ['palette', 'A drawer of palettes, at the right edge.', 'themes'],
];

// The badge each one earns, drawn exactly as the history panel draws it.
const BADGES = [
    ['NIL', 'marker-nil', 'The all-zero identifier.', ['nil']],
    ['MAX', 'marker-max', 'The all-one identifier.', ['max']],
    ['PALINDROME', 'marker-palindrome', 'Reads the same backwards. Both of the above qualify.', ['palindrome']],
    ['DEADBEEF', 'marker-word', 'Any hex word: <code>deadbeef</code>, <code>cafebabe</code>, <code>feedface</code>. The generator makes them.', ['deadbeef', 'cafebabe', 'feedface']],
    ['NON-RFC', 'marker-non-rfc', 'UUID-shaped, with a version outside 1-8.', ['non-rfc']],
    ['TIME TRAVELER', 'marker-time-traveler', 'A v1/v6/v7/ULID whose clock is far from now.', ['time traveler']],
];

const CLICKED = [
    ['5', 'the format chip already chosen', 'Magnetic field: every chip is pulled towards it, each in its own colour.', 'magnetic-field'],
    ['5', 'the integer value already chosen', 'Guess the number.', 'guess-the-number'],
    ['5', 'Generate, within half a second', 'Five identifiers at once.', 'rapid-generator'],
    ['10', 'the icon of an empty history', 'Space Runner.', 'space-runner'],
];

function row(trigger, what, found = false) {
    const left = element('dt', `lab-trigger${found ? ' is-found' : ''}`);
    left.append(trigger);

    const right = element('dd', `lab-what${found ? ' is-found' : ''}`);
    right.innerHTML = what;

    return [left, right];
}

function key(text) {
    return element('span', 'lab-key', text);
}

function group(parent, title, rows) {
    parent.appendChild(element('p', 'lab-group', title));

    const list = element('dl', 'lab-list');
    rows.flat().forEach(node => list.appendChild(node));
    parent.appendChild(list);
}

/** The list of what is hidden, offered only to someone who has earned it. */
export function eggsHelp() {
    if (alreadyOpen()) {
        return;
    }

    const found = foundEggs();
    const total = TYPED.length + CLICKED.length + BADGES.length;
    const seen = TYPED.filter(([, , id]) => found.has(id)).length
        + CLICKED.filter(([, , , id]) => found.has(id)).length
        + BADGES.filter(([, , , ids]) => ids.some(id => found.has(id))).length;

    const ui = panel({
        id: 'help',
        width: 'is-wide',
        title: 'Easter eggs',
        subtitle: `${total} things hidden in a UUID converter, ${seen} of them found. None changes a conversion.`,
    });

    const columns = element('div', 'lab-columns');
    const left = element('div');
    const right = element('div');
    columns.append(left, right);
    ui.body.appendChild(columns);

    group(left, 'Type it, anywhere outside a text field',
        TYPED.map(([word, what, id]) => row(key(word), what, found.has(id))));

    group(left, 'Click one thing more often than anyone would',
        CLICKED.map(([times, target, what, id]) => row(element('span', 'lab-count', `${times} clicks`), `On ${target}. ${what}`, found.has(id))));

    group(right, 'Convert something the standard finds special',
        BADGES.map(([name, marker, what, ids]) => row(element('span', `history-marker-badge ${marker}`, name), what, ids.some(id => found.has(id)))));

    // Why this list is on screen at all, and the one promise worth repeating.
    const aside = element('p', 'lab-aside');
    aside.innerHTML = 'This list appeared because the tool has an hour of your work in it. ' +
        'Everything here runs in the browser — nothing you paste is sent anywhere, and what you have found is remembered only here.';
    right.appendChild(aside);
}
