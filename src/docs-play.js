'use strict';

import { collisionCount, collisionOdds, convert, convertMany, detect, generate } from './docs-runtime-core.js';
import { fieldsFor } from './rfc9562.js';
import { toFieldValue } from './generate-at.js';

const FORMAT_NAMES = {
    'uuid': 'UUID text',
    'base64': 'Base64',
    'high-low': 'high/low pair',
    'bytes': 'byte array',
    'ulid': 'ULID',
    'words': '32-bit words',
};

function fieldAt(fields, index) {
    return fields.find(([from, to]) => index >= from && index <= to) || null;
}

function readingOf(hex, from, to, name) {
    const whole = BigInt(`0x${hex}`);
    const width = to - from + 1;
    const value = (whole >> BigInt(127 - to)) & ((1n << BigInt(width)) - 1n);
    const digits = Math.ceil(width / 4);
    const parts = [`0x${value.toString(16).padStart(digits, '0')}`];

    if (value <= 9007199254740991n) {
        parts.push(value.toString());
    }

    if (width <= 8) {
        parts.push(value.toString(2).padStart(width, '0'));
    }

    return `${name} · bits ${from}-${to} · ${parts.join('  ·  ')}`;
}

function playground(node) {
    const input = node.querySelector('.doc-play-input');
    const output = node.querySelector('.doc-play-out code');
    const note = node.querySelector('.doc-play-note');
    const chips = [...node.querySelectorAll('.doc-play-chip')];
    let format = node.dataset.to || 'uuid';
    const reading = node.dataset.int || undefined;

    function paint() {
        const value = input.value.trim();

        if (value === '') {
            output.textContent = '';
            note.textContent = 'Paste an identifier, or take a fresh one.';

            return;
        }

        const held = convert(value, { to: format, int: reading });

        if (held === null) {
            output.textContent = '';
            note.textContent = 'Not an identifier this tool reads.';

            return;
        }

        output.textContent = held;

        const found = detect(value);

        note.textContent = found === null || found.version === null
            ? `read as ${found === null ? 'an identifier' : found.format}`
            : `read as ${found.format}, version ${found.version}${found.at === null ? '' : `, made ${found.at}`}`;
    }

    input.addEventListener('input', paint);

    for (const chip of chips) {
        chip.addEventListener('click', () => {
            format = chip.dataset.format;

            for (const other of chips) {
                other.classList.toggle('is-on', other === chip);
                other.setAttribute('aria-pressed', String(other === chip));
            }

            paint();
        });
    }

    for (const button of node.querySelectorAll('[data-fill]')) {
        button.addEventListener('click', () => {
            input.value = generate(button.dataset.fill);
            paint();
        });
    }

    node.hidden = false;
    paint();
}

function specimen(figure) {
    const chars = [...figure.querySelectorAll('.report-char')];
    const bits = [...figure.querySelectorAll('.report-bit')];
    const runs = [...figure.querySelectorAll('.report-run')];
    const reading = figure.querySelector('.doc-reading');

    if (chars.length !== 32 || reading === null) {
        return;
    }

    const hex = chars.map(node => node.textContent).join('');
    const version = parseInt(hex[12], 16);
    const fields = version >= 1 && version <= 8 ? fieldsFor(version) : [[0, 127, 'random', 'no fields']];

    function pick(from, to, name) {
        chars.forEach((node, index) => node.classList.toggle('is-picked', index * 4 >= from && index * 4 <= to));
        bits.forEach((node, index) => node.classList.toggle('is-picked', index >= from && index <= to));
        runs.forEach(node => node.classList.toggle('is-picked', node.textContent === name));
        reading.textContent = readingOf(hex, from, to, name);
    }

    chars.forEach((node, index) => {
        const field = fieldAt(fields, index * 4);

        if (field === null) {
            return;
        }

        node.setAttribute('tabindex', '0');
        node.setAttribute('role', 'button');
        node.addEventListener('click', () => pick(field[0], field[1], field[3]));
        node.addEventListener('mouseenter', () => pick(field[0], field[1], field[3]));
        node.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                pick(field[0], field[1], field[3]);
            }
        });
    });

    for (const run of runs) {
        const field = fields.find(([, , , name]) => name === run.textContent);

        if (field !== undefined) {
            run.addEventListener('click', () => pick(field[0], field[1], field[3]));
        }
    }

    figure.classList.add('is-live');
    reading.textContent = 'Point at a character to read its field.';
}

function generator(node) {
    const type = node.querySelector('#gen-type');
    const moment = node.querySelector('#gen-moment');
    const space = node.querySelector('#gen-space');
    const spaceBox = space.closest('.doc-play-pick');
    const name = node.querySelector('#gen-name');
    const out = node.querySelector('.doc-play-out code');
    const note = node.querySelector('.doc-play-note');
    const timed = ['v1', 'v6', 'v7', 'ulid'];
    const named = ['v3', 'v5'];

    function paint() {
        const kind = type.value;

        moment.hidden = !timed.includes(kind);
        spaceBox.hidden = !named.includes(kind);
        name.hidden = !named.includes(kind);

        const held = generate(kind, { moment: moment.value, namespace: space.value, name: name.value });

        if (held === null) {
            out.textContent = '';
            note.textContent = 'A name is needed for v3 and v5.';

            return;
        }

        out.textContent = held;

        const found = detect(held);

        note.textContent = found === null || found.at === null
            ? `${kind}, fresh from this page`
            : `${kind}, carrying ${found.at}`;
    }

    type.addEventListener('change', paint);
    moment.addEventListener('input', paint);
    space.addEventListener('change', paint);
    name.addEventListener('input', paint);
    node.querySelector('[data-again]').addEventListener('click', paint);

    node.hidden = false;
    paint();
}

function bulk(node) {
    const input = node.querySelector('.doc-play-input');
    const out = node.querySelector('.doc-play-lines code');
    const note = node.querySelector('.doc-play-note');
    const chips = [...node.querySelectorAll('.doc-play-chip')];
    let format = 'uuid';

    function paint() {
        const rows = convertMany(input.value, { to: format });

        out.textContent = rows
            .map(row => {
                const held = row.ok ? row.output : `${row.input}  ← not an identifier`;

                return row.comment ? `${held}  # ${row.comment}` : held;
            })
            .join('\n');

        const bad = rows.filter(row => !row.ok).length;

        note.textContent = rows.length === 0
            ? 'Paste a column of identifiers.'
            : `${rows.length} line${rows.length === 1 ? '' : 's'}, ${bad} unread`;
    }

    input.addEventListener('input', paint);

    for (const chip of chips) {
        chip.addEventListener('click', () => {
            format = chip.dataset.format;

            for (const other of chips) {
                other.classList.toggle('is-on', other === chip);
                other.setAttribute('aria-pressed', String(other === chip));
            }

            paint();
        });
    }

    const fill = node.querySelector('[data-fill-many]');

    fill.addEventListener('click', () => {
        const many = Number(fill.dataset.fillMany);

        input.value = Array.from({ length: many }, () => generate('v7')).join('\n');
        paint();
    });

    node.hidden = false;
    paint();
}

function readNumber(value) {
    const held = Number(String(value).replace(/[\s_]/g, ''));

    return Number.isFinite(held) ? held : null;
}

function short(value) {
    if (value >= 1e6) {
        return value.toExponential(2).replace('e+', ' × 10^');
    }

    return Math.round(value).toLocaleString('en-US');
}

function collision(node) {
    const count = node.querySelector('#odds-count');
    const target = node.querySelector('#odds-target');
    const odds = node.querySelector('.doc-play-out code');
    const need = node.querySelector('.doc-play-out.is-second code');
    const note = node.querySelector('.doc-play-note');

    function paint() {
        const n = readNumber(count.value);
        const p = readNumber(target.value);

        odds.textContent = n === null ? '—' : `${collisionOdds(n).toExponential(3)} chance that any two match`;
        need.textContent = p === null || p <= 0 || p >= 1 ? '—' : `${short(collisionCount(p))} identifiers`;
        note.textContent = 'Over the 122 random bits of a v4. A generator with a broken random source beats every number here.';
    }

    count.addEventListener('input', paint);
    target.addEventListener('input', paint);

    node.hidden = false;
    paint();
}

function sortDemo(node) {
    const lists = { v4: node.querySelector('[data-list="v4"]'), v7: node.querySelector('[data-list="v7"]') };
    const note = node.querySelector('.doc-play-note');

    function draw() {
        const start = Date.now() - 1000;

        for (const kind of ['v4', 'v7']) {
            const made = Array.from({ length: 5 }, (all, index) => generate(kind, {
                moment: toFieldValue(new Date(start + index * 250)),
            }));
            const order = new Map(made.map((id, index) => [id, index + 1]));
            const sorted = [...made].sort();

            lists[kind].innerHTML = '';

            for (const id of sorted) {
                const item = document.createElement('li');

                item.textContent = `${id}  (made ${order.get(id)})`;
                item.className = order.get(id) === sorted.indexOf(id) + 1 ? 'is-kept' : 'is-moved';
                lists[kind].appendChild(item);
            }
        }

        note.textContent = 'Five of each, made a quarter of a second apart, then sorted as text. The number in brackets is the order they were made in: v7 keeps it, v4 does not. Inside a single millisecond even v7 depends on its generator spending rand_a on a counter.';
    }

    node.querySelector('[data-again]').addEventListener('click', draw);
    node.hidden = false;
    draw();
}

const WIDGETS = { generate: generator, bulk, collision, sort: sortDemo };

export function boot() {
    for (const node of document.querySelectorAll('[data-widget]')) {
        const start = WIDGETS[node.dataset.widget];

        if (start !== undefined) {
            start(node);
        }
    }

    for (const node of document.querySelectorAll('[data-play]')) {
        playground(node);
    }

    for (const figure of document.querySelectorAll('.doc-specimen')) {
        specimen(figure);
    }
}

export { FORMAT_NAMES };
