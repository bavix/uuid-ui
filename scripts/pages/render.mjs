'use strict';

import { AUTHOR_NAME, AUTHOR_URL, HUB_SLUG, REPO_URL, SITE_TAGLINE, SITE_URL, docLink, toolLink, pageUrl } from './site.mjs';
import { anchor, copyButton, escape, headings, renderBlocks, text } from './blocks.mjs';
import { renderHead } from './head.mjs';
import { exampleColumn, exampleValue, formatName, formatSlugs } from './examples.mjs';

export const MARK = '<!-- uuid-ui:generated-page -->';

const HUE_CLASS = {
    'uuid': 'type-uuid',
    'base64': 'type-base64',
    'high-low': 'type-highlow',
    'bytes': 'type-bytes',
    'ulid': 'type-ulid',
    'words': 'type-words',
    'hex': 'type-uuid',
};

const GITHUB_PATH = 'M12 .5C5.73.5.5 5.73.5 12c0 5.07 3.29 9.37 7.86 10.88.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.38-3.88-1.38-.53-1.36-1.3-1.73-1.3-1.73-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.75-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.19.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.5 3.17-1.19 3.17-1.19.64 1.58.24 2.75.12 3.04.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.69.42.36.79 1.08.79 2.17 0 1.57-.01 2.84-.01 3.22 0 .31.21.68.8.56C20.71 21.37 24 17.07 24 12 24 5.73 18.27.5 12 .5z';

const PAGE_SCRIPT = `(function(){
var root=document.documentElement;
var button=document.getElementById('doc-theme');
var applied=[];

function read(){
var raw=localStorage.getItem('theme')||'';var parts=raw.split(':');
if(parts.length===2){return{palette:parts[0],mode:parts[1]}}
if(raw==='dark'||raw==='true'||raw==='"true"'){return{palette:'default',mode:'dark'}}
if(raw==='light'||raw==='false'||raw==='"false"'){return{palette:'default',mode:'light'}}
return{palette:'default',mode:'system'};
}

function resolve(mode){
return mode==='system'
?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')
:mode;
}

function apply(palette,mode){
var shown=resolve(mode);
root.classList.toggle('dark',shown==='dark');
root.classList.toggle('light',shown==='light');
root.style.colorScheme=shown;
if(palette&&palette!=='default'&&/^[a-z0-9][a-z0-9-]{0,31}$/.test(palette)){root.setAttribute('data-theme',palette)}
else{root.removeAttribute('data-theme')}
applied.forEach(function(name){root.style.removeProperty(name)});
applied=[];
if(palette==='custom'&&window.__docCustom){
var before=root.getAttribute('style')||'';
window.__docCustom(root,shown);
var after=root.getAttribute('style')||'';
if(after!==before){applied=(after.match(/--[a-z0-9-]+/g)||[])}
}
return shown;
}

function store(palette,mode){
try{
localStorage.setItem('theme',palette+':'+mode);
var raw=localStorage.getItem('uuid.data');
if(!raw){return}
var held=JSON.parse(raw);
if(!held||typeof held!=='object'){return}
var at=Date.now();
held.settings=held.settings||{};
held.settings.palette={value:palette,at:at};
held.settings.theme={value:mode,at:at};
localStorage.setItem('uuid.data',JSON.stringify(held));
}catch(e){}
}

var current=read();
apply(current.palette,current.mode);

if(button){
button.addEventListener('click',function(){
current.mode=resolve(current.mode)==='dark'?'light':'dark';
apply(current.palette,current.mode);
store(current.palette,current.mode);
});
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){
if(current.mode==='system'){apply(current.palette,current.mode)}
});

window.addEventListener('storage',function(e){
if(e.key!=='theme'&&e.key!=='uuid.data'){return}
current=read();apply(current.palette,current.mode);
});

document.addEventListener('click',function(e){
var b=e.target.closest?e.target.closest('.doc-copy'):null;
if(!b){return}
var box=b.closest('.doc-case')||b.closest('.code');
var el=box&&(box.querySelector('.doc-case-out')||box.querySelector('pre code'));
if(!el||!navigator.clipboard){return}
navigator.clipboard.writeText(el.textContent).then(function(){
b.classList.add('is-done');setTimeout(function(){b.classList.remove('is-done')},1400);});
});

var links=[].slice.call(document.querySelectorAll('.doc-toc a'));
if(!links.length||!('IntersectionObserver' in window)){return}
var byId={};links.forEach(function(a){byId[a.getAttribute('href').slice(1)]=a});
var seen=[];
var io=new IntersectionObserver(function(entries){
entries.forEach(function(e){
var id=e.target.id;var at=seen.indexOf(id);
if(e.isIntersecting){if(at<0){seen.push(id)}}else if(at>=0){seen.splice(at,1)}
});
if(!seen.length){return}
var first=links.map(function(a){return a.getAttribute('href').slice(1)}).filter(function(id){return seen.indexOf(id)>=0})[0];
links.forEach(function(a){a.classList.toggle('is-here',a.getAttribute('href').slice(1)===first)});
},{rootMargin:'-80px 0px -70% 0px'});
Object.keys(byId).forEach(function(id){var el=document.getElementById(id);if(el){io.observe(el)}});
})();`;

function hueClass(page) {
    const to = page.cta?.to ?? page.example?.cta?.to;

    return to === undefined ? '' : ` ${HUE_CLASS[to] ?? ''}`.trimEnd();
}

function ctaLabel(cta) {
    const reading = cta.int ? ` (${cta.int})` : '';

    return `Open the converter: ${formatName(cta.to)}${reading}`;
}

function ctaButton(page, extra = '', short = false) {
    const href = page.cta ? toolLink(page.cta) : '../';
    const label = short ? 'Converter' : (page.cta ? ctaLabel(page.cta) : 'Open the converter');

    return `<a class="doc-open${extra}" href="${escape(href)}">${text(label)}` +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
        '<path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
}

function renderTryIt(page) {
    if (!page.example) {
        return `<p class="doc-cta">${ctaButton(page)}` +
            '<span class="doc-try-note">Nothing you paste leaves the browser.</span></p>';
    }

    const label = exampleColumn(page.example);
    const rows = (page.example?.cases ?? []).map(item => {
        const out = exampleValue(item.uuid, page.example);

        return '<div class="doc-case">' +
            `<span class="doc-case-tag">in</span><code class="doc-case-in">${escape(item.uuid)}</code>` +
            `<span class="doc-case-tag is-out">out</span><code class="doc-case-out">${escape(out)}</code>` +
            copyButton('this value') +
            (item.note ? `<p class="doc-case-note">${text(item.note)}</p>` : '') +
            '</div>';
    }).join('');

    const head = '<div class="doc-try-head">' +
        `<span class="doc-chip">${escape(label)}</span>` +
        '<span class="doc-try-hint">computed by the converter itself</span>' +
        '</div>';

    return '<section class="doc-try" id="worked-example" aria-label="Worked example">' +
        head + `<div class="doc-cases">${rows}</div>` +
        `<div class="doc-try-foot">${ctaButton(page)}` +
        '<span class="doc-try-note">Nothing you paste leaves the browser.</span></div>' +
        '</section>';
}

function sectionHeading(title) {
    const id = anchor(title);

    return `<h2 id="${escape(id)}">${text(title)}` +
        `<a class="doc-anchor" href="#${escape(id)}" aria-label="Link to this section">#</a></h2>`;
}

function renderPlayground(page) {
    const to = page.cta?.to;

    if (to === undefined || (page.body ?? []).some(block => block.type === 'widget')) {
        return '';
    }

    const chips = formatSlugs().map(slug =>
        `<button type="button" class="doc-play-chip${slug === to ? ' is-on' : ''}" data-format="${escape(slug)}"` +
        ` aria-pressed="${slug === to}">${escape(slug)}</button>`
    ).join('');

    const reading = page.cta.int ? ` data-int="${escape(page.cta.int)}"` : '';

    return `<section class="doc-play" data-play data-to="${escape(to)}"${reading} hidden>` +
        '<div class="doc-play-head"><span class="doc-chip">Playground</span>' +
        '<span class="doc-play-hint">runs here in the page; nothing is sent anywhere</span></div>' +
        `<div class="doc-play-formats" role="group" aria-label="Format">${chips}</div>` +
        '<label class="sr-only" for="doc-play-input">Identifier</label>' +
        '<input id="doc-play-input" class="doc-play-input" spellcheck="false" autocomplete="off"' +
        ' placeholder="paste a UUID, a ULID, a byte array, a pair of longs…">' +
        '<div class="doc-play-row"><button type="button" class="doc-play-fill" data-fill="v4">Random v4</button>' +
        '<button type="button" class="doc-play-fill" data-fill="v7">Time-ordered v7</button></div>' +
        '<p class="doc-play-out"><code></code></p>' +
        '<p class="doc-play-note"></p>' +
        '</section>';
}

function renderFaq(page) {
    if (!Array.isArray(page.faq) || page.faq.length === 0) {
        return '';
    }

    const entries = page.faq
        .map(item => `<div class="doc-qa"><h3>${text(item.q)}</h3><p>${text(item.a)}</p></div>`)
        .join('');

    return `<section class="doc-faq">${sectionHeading('Questions people actually ask')}${entries}</section>`;
}

function renderRelated(page, titleOf) {
    if (!Array.isArray(page.related) || page.related.length === 0) {
        return '';
    }

    const items = page.related.map(slug => {
        const title = titleOf(slug);

        if (title === undefined) {
            throw new Error(`${page.slug} links to a page that does not exist: ${slug}`);
        }

        return `<li><a href="${escape(docLink(slug))}">${text(title)}</a></li>`;
    }).join('');

    return '<nav class="doc-related" aria-label="Related pages">' +
        `${sectionHeading('Related')}<ul>${items}</ul></nav>`;
}

function renderIndex(page) {
    if (!Array.isArray(page.index) || page.index.length === 0) {
        return '';
    }

    return page.index.map(group => {
        const items = group.items.map(item =>
            `<li><a href="${escape(docLink(item.slug))}"><span class="doc-card-title">${text(item.title)}</span>` +
            `<span class="doc-card-note">${text(item.note)}</span></a></li>`
        ).join('');

        return `<section class="doc-group"><h2 id="${escape(group.id)}">${text(group.title)}` +
            `<a class="doc-anchor" href="#${escape(group.id)}" aria-label="Link to this section">#</a></h2>` +
            `<ul class="doc-cards">${items}</ul></section>`;
    }).join('\n');
}

function tocEntries(page) {
    const entries = [];

    if (page.example) {
        entries.push({ id: anchor('Worked example'), label: 'Worked example' });
    }

    for (const heading of headings(page.body ?? [])) {
        entries.push({ id: anchor(heading), label: heading });
    }

    for (const group of page.index ?? []) {
        entries.push({ id: group.id, label: group.title });
    }

    if (Array.isArray(page.faq) && page.faq.length > 0) {
        entries.push({ id: anchor('Questions people actually ask'), label: 'Questions people actually ask' });
    }

    if (Array.isArray(page.related) && page.related.length > 0) {
        entries.push({ id: anchor('Related'), label: 'Related' });
    }

    return entries;
}

function tocList(page, className) {
    const items = tocEntries(page)
        .map(entry => `<li><a href="#${escape(entry.id)}">${text(entry.label)}</a></li>`)
        .join('');

    return `<ul class="${className}">${items}</ul>`;
}

function railList(page, groups) {
    const sections = groups.map(group => {
        const items = group.items.map(item => {
            const here = item.slug === page.slug;

            return `<li><a href="${escape(docLink(item.slug))}"${here ? ' class="is-here" aria-current="page"' : ''}>` +
                `${text(item.title)}</a></li>`;
        }).join('');

        return `<li class="doc-rail-group"><p class="doc-rail-title">${text(group.title)}</p><ul>${items}</ul></li>`;
    }).join('');

    return `<ul class="doc-rail-list">${sections}</ul>`;
}

function renderRail(page, groups, hubTitle) {
    const hubHere = page.slug === HUB_SLUG;

    return '<nav class="doc-rail" aria-label="Reference">' +
        `<a class="doc-rail-hub${hubHere ? ' is-here' : ''}" href="${escape(docLink(HUB_SLUG))}"` +
        `${hubHere ? ' aria-current="page"' : ''}>${escape(hubTitle)}</a>` +
        railList(page, groups) + '</nav>';
}

function renderSteps(page, order, titleOf) {
    const at = order.indexOf(page.slug);

    if (at < 0) {
        return '';
    }

    const make = (slug, kind, label) => {
        const title = titleOf(slug);

        return `<a class="doc-step is-${kind}" href="${escape(docLink(slug))}">` +
            `<span class="doc-step-kind">${label}</span>` +
            `<span class="doc-step-title">${text(title)}</span></a>`;
    };

    const parts = [];

    if (at > 0) {
        parts.push(make(order[at - 1], 'prev', 'Previous'));
    }

    if (at < order.length - 1) {
        parts.push(make(order[at + 1], 'next', 'Next'));
    }

    return parts.length === 0 ? '' : `<nav class="doc-steps" aria-label="Reference order">${parts.join('')}</nav>`;
}

function crumbs(page, hubTitle) {
    const parts = [];

    if (page.slug !== HUB_SLUG) {
        parts.push(`<a href="${escape(docLink(HUB_SLUG))}">${escape(hubTitle)}</a>`);
    }

    parts.push(`<span aria-current="page">${text(page.h1)}</span>`);

    return '<nav class="doc-crumbs" aria-label="Breadcrumb">' +
        parts.join('<span class="doc-crumb-sep" aria-hidden="true">/</span>') +
        '</nav>';
}

function header(page, hubTitle) {
    return `<nav class="app-header backdrop-blur-sm shadow-md border-b sticky top-0 z-50" role="navigation" aria-label="main navigation">
    <div class="container mx-auto max-w-7xl">
        <div class="doc-bar">
            <a class="doc-brand" href="../">
                <img src="../android-chrome-192x192.png" class="h-9 w-9 rounded-lg brand-mark" alt="">
                <span class="brand-text font-bold text-lg gradient-animate">UUIDConv UI</span>
            </a>
            ${crumbs(page, hubTitle)}
            <div class="doc-bar-actions">
                ${ctaButton(page, ' is-bar', true)}
                <a href="${escape(REPO_URL)}" target="_blank" rel="noopener noreferrer" class="doc-icon" aria-label="Open project on GitHub" title="Open project on GitHub">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${GITHUB_PATH}"/></svg>
                </a>
                <button type="button" id="doc-theme" class="doc-icon" aria-label="Toggle theme" title="Toggle theme">
                    <svg class="doc-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                    <svg class="doc-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
                </button>
            </div>
        </div>
    </div>
</nav>`;
}

function footer() {
    return `<footer class="footer-main">
    <div class="footer-container">
        <div class="footer-content">
            <span class="footer-brand">uuid-ui</span>
            <span class="footer-text">by</span>
            <a href="${escape(AUTHOR_URL)}" class="footer-link" target="_blank" rel="noopener noreferrer">${escape(AUTHOR_NAME)}</a>
            <span class="footer-separator" aria-hidden="true">•</span>
            <a href="../" class="footer-link">Converter</a>
            <span class="footer-separator" aria-hidden="true">•</span>
            <a href="${escape(docLink(HUB_SLUG))}" class="footer-link">UUID reference</a>
            <span class="footer-separator" aria-hidden="true">•</span>
            <a href="../llms.txt" class="footer-link">llms.txt</a>
            <span class="footer-separator" aria-hidden="true">•</span>
            <a href="${escape(REPO_URL)}" class="footer-link" target="_blank" rel="noopener noreferrer">Source Code</a>
            <span class="footer-separator" aria-hidden="true">•</span>
            <a href="${escape(REPO_URL)}/blob/master/LICENSE" class="footer-link" target="_blank" rel="noopener noreferrer">MIT License</a>
        </div>
    </div>
</footer>`;
}

export function renderPage(page, { hubTitle, titleOf, groups = [], order = [] }) {
    const sections = tocEntries(page);
    const meta = [
        page.cta ? `<span class="doc-chip">${escape(formatName(page.cta.to))}</span>` : '',
        sections.length > 0 ? `<span>${sections.length} sections</span>` : '',
        `<span>Updated <time datetime="${escape(page.updated)}">${escape(page.updated)}</time></span>`,
    ].filter(part => part !== '').join('');

    const article = [
        '<header class="doc-lead">',
        `<h1>${text(page.h1)}</h1>`,
        `<p class="doc-meta">${meta}</p>`,
        `<p class="doc-tldr">${text(page.tldr)}</p>`,
        `<p class="doc-lede">${text(page.lede)}</p>`,
        '</header>',
        renderTryIt(page),
        renderPlayground(page),
        sections.length >= 4
            ? `<details class="doc-toc-mobile"><summary>On this page (${sections.length})</summary>${tocList(page, 'doc-toc-mobile-list')}</details>`
            : '',
        '<div class="doc-prose">',
        renderBlocks(page.body ?? []),
        '</div>',
        renderIndex(page),
        renderFaq(page),
        renderRelated(page, titleOf),
        `<details class="doc-rail-mobile"><summary>Browse the reference</summary>${railList(page, groups)}</details>`,
        renderSteps(page, order, titleOf),
    ].filter(part => part !== '').join('\n');

    const side = sections.length >= 3
        ? '<aside class="doc-side"><nav class="doc-toc" aria-label="On this page">' +
          '<p class="doc-side-title">On this page</p>' + tocList(page, '') + '</nav></aside>'
        : '';

    return `<!DOCTYPE html>
${MARK}
<html lang="en">
<head>
${renderHead(page, hubTitle)}
</head>
<body class="doc${hueClass(page)}">
${header(page, hubTitle)}
<div class="doc-shell container mx-auto max-w-7xl">
${renderRail(page, groups, hubTitle)}
<main class="doc-main">
<article>
${article}
</article>
</main>
${side}
</div>
${footer()}
<script>${PAGE_SCRIPT}</script>
<script type="module" src="../docs.js"></script>
</body>
</html>
`;
}

export function render404() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page not found — UUIDConv</title>
    <meta name="robots" content="noindex">
    <style>
        :root { color-scheme: light dark; --ink: #101420; --muted: #5a6375; --bg: #f2f4f8; --accent: #1d4ed8; --line: #d7dbe4; }
        @media (prefers-color-scheme: dark) { :root { --ink: #e6e9f2; --muted: #97a0b5; --bg: #0e1320; --accent: #93c5fd; --line: #263047; } }
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: var(--bg); color: var(--ink);
            font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
        main { max-width: 32rem; padding: 2rem; }
        h1 { font-size: 1.6rem; letter-spacing: -0.02em; margin: 0 0 .5rem; }
        p { color: var(--muted); margin: 0 0 1.5rem; }
        ul { list-style: none; padding: 0; margin: 0; }
        li { padding: .6rem 0; border-top: 1px solid var(--line); }
        a { color: var(--accent); text-underline-offset: 3px; }
    </style>
</head>
<body>
<main>
    <h1>That page is not here</h1>
    <p>${escape(SITE_TAGLINE)}.</p>
    <ul>
        <li><a href="${escape(SITE_URL)}">Open the converter</a></li>
        <li><a href="${escape(pageUrl(HUB_SLUG))}">UUID reference</a></li>
        <li><a href="${escape(SITE_URL)}sitemap.xml">Every page on this site</a></li>
    </ul>
</main>
</body>
</html>
`;
}
