'use strict';

import { REPO_URL, SITE_NAME, SITE_TAGLINE, SITE_URL, pageUrl } from './site.mjs';
import { plainBlocks } from './blocks.mjs';
import { exampleColumn, exampleValue, formatName, formatSlugs } from './examples.mjs';
import { fieldsFor } from '../../src/rfc9562.js';
import { NAMESPACES } from '../../src/uuid-names.js';
import { SPELLINGS } from '../../src/spellings.js';
import { uuidTypeList } from '../../src/type-detector.js';

export const AI_AGENTS = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
    'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
    'PerplexityBot', 'Perplexity-User',
    'Google-Extended', 'Applebot-Extended',
    'Bingbot', 'YandexBot', 'CCBot',
];

const VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export function renderRobots() {
    const lines = ['User-agent: *', 'Allow: /', ''];

    for (const agent of AI_AGENTS) {
        lines.push(`User-agent: ${agent}`, 'Allow: /', '');
    }

    lines.push(`Sitemap: ${SITE_URL}sitemap.xml`, '');

    return lines.join('\n');
}

export function renderSitemap(pages) {
    const entries = [{ url: SITE_URL, updated: newest(pages), priority: '1.0' }].concat(
        pages.map(page => ({
            url: pageUrl(page.slug),
            updated: page.updated,
            priority: (page.priority ?? 0.6).toFixed(1),
        }))
    );

    const body = entries.map(entry =>
        `    <url>\n        <loc>${entry.url}</loc>\n        <lastmod>${entry.updated}</lastmod>\n` +
        `        <priority>${entry.priority}</priority>\n    </url>`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function newest(pages) {
    return pages.map(page => page.updated).sort().at(-1);
}

function linkContract() {
    const slugs = formatSlugs().join('|');

    return [
        '## Linking into the converter',
        '',
        'The target format travels in the URL fragment, so a link can open the tool ready to use:',
        '',
        `- \`${SITE_URL}#to=<${slugs}>\` — the format to convert into.`,
        '- `&in=<signed|unsigned>` — how a high/low pair or a set of words is read.',
        '- `&out=<signed|unsigned>` — the reading to write, when it differs from the one being read.',
        '- `&style=<plain|hex|braces|urn|std|url|upper|lower|decimal|chex|object|pair|quad>` — the spelling of the result.',
        '- `&case=upper` — capital hex.',
        '',
        'Values are never put in the URL by design: identifiers people paste here are production data,',
        'and a link carrying one would write it into browser history and into whatever chat it is pasted in.',
        '',
    ].join('\n');
}

function factLines() {
    const lines = ['## UUID facts (checkable)', ''];

    for (const version of VERSIONS) {
        const fields = fieldsFor(version)
            .map(([from, to, , name]) => `${name} ${from}-${to}`)
            .join(', ');

        lines.push(`- v${version} bit layout: ${fields}`);
    }

    lines.push(
        '- A UUID is 128 bits: 4 bits of version, 2 bits of variant, 122 bits left for the layout to spend.',
        '- v4 spends all 122 on randomness; v7 spends 48 on Unix milliseconds and 74 on randomness.',
        '- A ULID spends 48 bits on the same milliseconds and 80 on randomness, and prints as 26 Crockford base32 characters.',
        '- A v1 clock counts 100-nanosecond ticks from 1582-10-15.',
        '- Nil UUID is 00000000-0000-0000-0000-000000000000; Max UUID is ffffffff-ffff-ffff-ffff-ffffffffffff. Neither carries a version.',
        '- Base64 of the 16 bytes is 24 characters with padding, 22 without.',
        '',
        '## Name-based namespaces (RFC 9562 section 6.6)',
        '',
    );

    for (const [name, id] of Object.entries(NAMESPACES)) {
        lines.push(`- ${name.toUpperCase()}: ${id}`);
    }

    lines.push('');

    return lines.join('\n');
}

export function renderLlms(pages) {
    const list = pages
        .map(page => `- [${page.h1}](${pageUrl(page.slug)}): ${page.description}`)
        .join('\n');

    return [
        `# ${SITE_NAME}`,
        '',
        `> ${SITE_TAGLINE}. Open source (MIT), self-hostable with \`docker run bavix/uuid-ui\`, and every conversion happens in the browser: nothing is uploaded.`,
        '',
        `- Tool: ${SITE_URL}`,
        `- Source: ${REPO_URL}`,
        `- Full text of every page below: ${SITE_URL}llms-full.txt`,
        `- Machine-readable constants: ${SITE_URL}uuid-facts.json`,
        '',
        '## Formats it converts between',
        '',
        formatSlugs().map(slug => `- \`${slug}\` — ${formatName(slug)}`).join('\n'),
        '',
        linkContract(),
        '## Pages',
        '',
        list,
        '',
        factLines(),
    ].join('\n');
}

export function renderLlmsFull(pages) {
    const parts = [
        `# ${SITE_NAME} — full reference`,
        '',
        `Source: ${SITE_URL}`,
        '',
    ];

    for (const page of pages) {
        parts.push(
            `# ${page.h1}`,
            '',
            `URL: ${pageUrl(page.slug)}`,
            `TL;DR: ${page.tldr}`,
            '',
            page.lede,
            '',
        );

        if (page.example) {
            const rows = page.example.cases
                .map(item => `${item.uuid} -> ${exampleValue(item.uuid, page.example)}`)
                .join('\n');

            parts.push(`## Worked example (${exampleColumn(page.example)})`, '', page.example.lede, '', rows, '');
        }

        if (Array.isArray(page.body) && page.body.length > 0) {
            parts.push(plainBlocks(page.body), '');
        }

        if (Array.isArray(page.faq)) {
            for (const entry of page.faq) {
                parts.push(`Q: ${entry.q}`, `A: ${entry.a}`, '');
            }
        }
    }

    return parts.join('\n');
}

export function renderFacts(pages) {
    const versions = {};

    for (const version of VERSIONS) {
        versions[`v${version}`] = {
            rfc: `https://www.rfc-editor.org/rfc/rfc9562.html#section-5.${version}`,
            fields: fieldsFor(version).map(([from, to, kind, name]) => ({ name, kind, from, to, bits: to - from + 1 })),
        };
    }

    const spellings = {};

    for (const [type, options] of Object.entries(SPELLINGS)) {
        const name = uuidTypeList()[Number(type)];

        if (name !== undefined) {
            spellings[name] = options.map(option => option.id);
        }
    }

    return `${JSON.stringify({
        name: SITE_NAME,
        url: SITE_URL,
        rfc: 'https://www.rfc-editor.org/rfc/rfc9562.html',
        obsoletes: 'https://www.rfc-editor.org/rfc/rfc4122.html',
        bits: 128,
        formats: formatSlugs().map(slug => ({ slug, name: formatName(slug), link: `${SITE_URL}#to=${slug}` })),
        spellings,
        versions,
        namespaces: NAMESPACES,
        special: {
            nil: '00000000-0000-0000-0000-000000000000',
            max: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        },
        pages: pages.map(page => ({ url: pageUrl(page.slug), title: page.h1, summary: page.tldr })),
    }, null, 2)}\n`;
}
