'use strict';

import { rfcRef } from './rfc.mjs';
import { fieldsFor } from '../../src/rfc9562.js';
import { GENERATORS } from '../../src/docs-runtime-core.js';
import { NAMESPACES } from '../../src/uuid-names.js';
import { formatSlugs } from './examples.mjs';

export function copyButton(what) {
    return `<button type="button" class="doc-copy" aria-label="Copy ${escape(what)}">` +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
        '<rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" stroke-width="1.7"/>' +
        '<path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-6A3.5 3.5 0 0 0 3 6.5v6A2.5 2.5 0 0 0 5.5 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
        '</svg><svg class="doc-copy-done" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
        '<path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg></button>';
}

export function escape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function text(value) {
    return escape(value).replace(/`([^`]+)`/g, (all, code) => `<code>${code}</code>`);
}

function list(tag, items) {
    return `<${tag}>${items.map(item => `<li>${text(item)}</li>`).join('')}</${tag}>`;
}

function table(block) {
    const head = block.head.map(cell => `<th scope="col">${text(cell)}</th>`).join('');
    const rows = block.rows
        .map(row => `<tr>${row
            .map((cell, at) => {
                const name = (block.head[at] ?? '').trim();
                const label = name === '' ? '' : ` data-th="${escape(name)}"`;

                return `<td${label}>${text(cell)}</td>`;
            })
            .join('')}</tr>`)
        .join('');

    return `<div class="scroller"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function code(block) {
    const label = block.lang ? escape(block.lang) : 'code';

    return '<figure class="code"><div class="code-head">' +
        `<span class="code-lang">${label}</span>${copyButton('this snippet')}</div>` +
        `<pre><code>${escape(block.code)}</code></pre></figure>`;
}

function rfc(block) {
    const ref = rfcRef(block.doc, block.section);
    const note = block.note ? `<span class="rfc-note">${text(block.note)}</span>` : '';

    return `<p class="rfc"><a href="${escape(ref.url)}" target="_blank" rel="noopener noreferrer">` +
        `${escape(ref.label)}</a>${note}</p>`;
}

function links(block) {
    const items = block.items.map(item =>
        `<li><a href="${escape(item.href)}" target="_blank" rel="noopener noreferrer">${text(item.label)}</a>` +
        (item.note ? `<span class="doc-link-note">${text(item.note)}</span>` : '') +
        '</li>'
    ).join('');

    return `<ul class="doc-links">${items}</ul>`;
}

const BIT_KINDS = {
    time: 'timestamp',
    random: 'random',
    version: 'version',
    variant: 'variant',
    clock: 'clock sequence',
    node: 'node',
    hash: 'hash of the name',
};

const GROUP_STARTS = new Set([8, 12, 16, 20]);
const BIT_GROUPS = new Set([32, 48, 64, 80]);

function fieldAt(fields, index) {
    return fields.find(([from, to]) => index >= from && index <= to) || [0, 127, 'random', 'unassigned'];
}

function layoutOf(uuid) {
    const hex = uuid.replace(/-/g, '').toLowerCase();

    if (!/^[0-9a-f]{32}$/.test(hex)) {
        throw new Error(`not an identifier: ${uuid}`);
    }

    const version = parseInt(hex[12], 16);
    const known = version >= 1 && version <= 8;

    return {
        hex,
        version: known ? version : null,
        fields: known ? fieldsFor(version) : [[0, 127, 'random', 'no fields']],
    };
}

function specimen(block) {
    const { hex, version, fields } = layoutOf(block.uuid);
    const bytes = hex.match(/../g).map(pair => parseInt(pair, 16));
    const runs = fields.slice().sort((left, right) => left[0] - right[0]);

    const chars = Array.from({ length: 32 }, (all, i) => {
        const [, , kind, name] = fieldAt(fields, i * 4);

        return `<span class="report-char k-${kind}${GROUP_STARTS.has(i) ? ' is-group' : ''}"` +
            ` title="${escape(name)}">${hex[i]}</span>`;
    }).join('');

    const cells = Array.from({ length: 128 }, (all, i) => {
        const [, , kind] = fieldAt(fields, i);
        const on = (bytes[i >> 3] >> (7 - (i % 8))) & 1;

        return `<span class="report-bit k-${kind}${on ? ' is-on' : ''}${BIT_GROUPS.has(i) ? ' is-group' : ''}"></span>`;
    }).join('');

    const ruler = runs.map(([from, to, kind, name]) => {
        const wide = to - from + 1 >= 12;

        return `<span class="report-run k-${kind}${wide ? '' : ' is-narrow'}" style="flex-grow:${to - from + 1}">` +
            `${escape(name)}</span>`;
    }).join('');

    const octets = Array.from({ length: 16 }, (all, i) =>
        `<span class="report-octet">${i % 4 === 0 ? `byte ${i}` : ''}</span>`).join('');

    const legend = runs.map(([from, to, kind, name]) =>
        `<span class="report-chip k-${kind}">${escape(name)} ${from}-${to}</span>`).join('');

    const title = version === null
        ? `${block.uuid}, which carries no version`
        : `${block.uuid}, a version ${version} identifier, field by field`;

    return '<figure class="doc-specimen report">' +
        '<div class="report-specimen">' +
        `<div class="report-chars" role="img" aria-label="${escape(title)}">${chars}</div>` +
        `<div class="report-bits" aria-hidden="true">${cells}</div>` +
        `<div class="report-ruler" aria-hidden="true">${ruler}</div>` +
        `<div class="report-octets" aria-hidden="true">${octets}</div>` +
        '</div>' +
        `<div class="report-chips">${legend}</div>` +
        '<p class="doc-reading" aria-live="polite"></p>' +
        (block.note ? `<figcaption>${text(block.note)}</figcaption>` : '') +
        '</figure>';
}

function pick(id, label, options, hidden) {
    return `<label class="sr-only" for="${id}">${escape(label)}</label>` +
        `<span class="doc-play-pick"${hidden ? ' hidden' : ''}>` +
        `<select id="${id}" class="doc-play-select">${options}</select>` +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>' +
        '</svg></span>';
}

function widgetHead(title, hint) {
    return `<div class="doc-play-head"><span class="doc-chip">${escape(title)}</span>` +
        `<span class="doc-play-hint">${escape(hint)}</span></div>`;
}

function generateWidget() {
    const types = GENERATORS
        .map(type => `<option value="${escape(type)}"${type === 'v4' ? ' selected' : ''}>${escape(type)}</option>`)
        .join('');
    const spaces = Object.keys(NAMESPACES)
        .map(name => `<option value="${escape(name)}">${escape(name)}</option>`)
        .join('');

    return '<section class="doc-play" data-widget="generate" hidden>' +
        widgetHead('Generator', 'the same generators the tool runs, in this page') +
        '<div class="doc-play-row">' +
        pick('gen-type', 'Version', types, false) +
        '<label class="sr-only" for="gen-moment">Moment</label>' +
        '<input id="gen-moment" class="doc-play-input is-inline" type="datetime-local" step="0.001" hidden>' +
        pick('gen-space', 'Namespace', spaces, true) +
        '<label class="sr-only" for="gen-name">Name</label>' +
        '<input id="gen-name" class="doc-play-input is-inline" placeholder="name" hidden>' +
        '<button type="button" class="doc-play-fill" data-again>Generate</button>' +
        '</div>' +
        '<p class="doc-play-out"><code></code></p><p class="doc-play-note"></p></section>';
}

function bulkWidget() {
    const chips = formatSlugs()
        .map((slug, index) => `<button type="button" class="doc-play-chip${index === 0 ? ' is-on' : ''}"` +
            ` data-format="${escape(slug)}" aria-pressed="${index === 0}">${escape(slug)}</button>`)
        .join('');

    return '<section class="doc-play" data-widget="bulk" hidden>' +
        widgetHead('Bulk', 'one identifier per line, converted as you type') +
        `<div class="doc-play-formats" role="group" aria-label="Format">${chips}</div>` +
        '<label class="sr-only" for="bulk-in">Identifiers</label>' +
        '<textarea id="bulk-in" class="doc-play-input is-area" rows="4" spellcheck="false"' +
        ' placeholder="f81d4fae-7dec-11d0-a765-00a0c91e6bf6&#10;01890a5d-ac96-774b-bcce-b302099a8057"></textarea>' +
        '<div class="doc-play-row"><button type="button" class="doc-play-fill" data-fill-many="5">Five fresh v7</button></div>' +
        '<pre class="doc-play-lines"><code></code></pre><p class="doc-play-note"></p></section>';
}

function collisionWidget() {
    return '<section class="doc-play" data-widget="collision" hidden>' +
        widgetHead('Odds', 'the birthday problem over 122 random bits') +
        '<div class="doc-play-row"><label class="doc-play-label" for="odds-count">Identifiers</label>' +
        '<input id="odds-count" class="doc-play-input is-inline" inputmode="numeric" value="1e12"></div>' +
        '<p class="doc-play-out"><code></code></p>' +
        '<div class="doc-play-row"><label class="doc-play-label" for="odds-target">Chance of one collision</label>' +
        '<input id="odds-target" class="doc-play-input is-inline" inputmode="decimal" value="0.000000001"></div>' +
        '<p class="doc-play-out is-second"><code></code></p><p class="doc-play-note"></p></section>';
}

function sortWidget() {
    return '<section class="doc-play" data-widget="sort" hidden>' +
        widgetHead('Sorting', 'five of each, then sorted as text') +
        '<div class="doc-play-row"><button type="button" class="doc-play-fill" data-again>Draw ten</button></div>' +
        '<div class="doc-sort"><div><p class="doc-play-label">v4, sorted</p><ol class="doc-sort-list" data-list="v4"></ol></div>' +
        '<div><p class="doc-play-label">v7, sorted</p><ol class="doc-sort-list" data-list="v7"></ol></div></div>' +
        '<p class="doc-play-note"></p></section>';
}

const WIDGETS = {
    generate: generateWidget,
    bulk: bulkWidget,
    collision: collisionWidget,
    sort: sortWidget,
};

function widget(block) {
    const make = WIDGETS[block.name];

    if (make === undefined) {
        throw new Error(`unknown widget: ${block.name}`);
    }

    return make();
}

const RENDERERS = {
    h2: block => {
        const id = anchor(block.text);

        return `<h2 id="${escape(id)}">${text(block.text)}` +
            `<a class="doc-anchor" href="#${escape(id)}" aria-label="Link to this section">#</a></h2>`;
    },
    h3: block => `<h3>${text(block.text)}</h3>`,
    p: block => `<p>${text(block.text)}</p>`,
    note: block => `<aside class="note">${text(block.text)}</aside>`,
    ul: block => list('ul', block.items),
    ol: block => list('ol', block.items),
    table,
    code,
    rfc,
    links,
    specimen,
    widget,
};

export function anchor(value) {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

export function renderBlocks(blocks) {
    return blocks.map(block => {
        const render = RENDERERS[block.type];

        if (render === undefined) {
            throw new Error(`unknown block type: ${block.type}`);
        }

        return render(block);
    }).join('\n');
}

export function headings(blocks) {
    return blocks.filter(block => block.type === 'h2').map(block => block.text);
}

function plainOne(block) {
    switch (block.type) {
        case 'h2':
        case 'h3':
            return `## ${block.text}`;
        case 'p':
        case 'note':
            return block.text;
        case 'ul':
        case 'ol':
            return block.items.map(item => `- ${item}`).join('\n');
        case 'table':
            return [block.head.join(' | ')].concat(block.rows.map(row => row.join(' | '))).join('\n');
        case 'code':
            return block.code;
        case 'widget':
            return null;
        case 'specimen': {
            const { fields } = layoutOf(block.uuid);

            return [`${block.uuid}, field by field:`].concat(fields
                .slice()
                .sort((left, right) => left[0] - right[0])
                .map(([from, to, kind, name]) => `- ${name}: bits ${from}-${to} (${BIT_KINDS[kind]})`)
            ).join('\n');
        }
        case 'rfc':
            return null;
        case 'links':
            return block.items.map(item => `- ${item.label}: ${item.href}`).join('\n');
        default:
            throw new Error(`unknown block type: ${block.type}`);
    }
}

export function plainBlocks(blocks) {
    return blocks.map(plainOne).filter(part => part !== null).join('\n\n').replace(/`/g, '');
}
