'use strict';

import { OG_IMAGE, SITE_NAME, pageUrl } from './site.mjs';
import { jsonLd, pageGraph } from './schema.mjs';
import { escape } from './blocks.mjs';

const THEME_SCRIPT = `(function(){try{
var s=localStorage.getItem('theme')||'';var p=s.split(':');
var palette=p.length===2?p[0]:'default';var m=p.length===2?p[1]:s;
if(m==='true'||m==='"true"'){m='dark'}if(m==='false'||m==='"false"'){m='light'}
if(m!=='dark'&&m!=='light'){m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
var r=document.documentElement;r.classList.add(m);r.style.colorScheme=m;
if(/^[a-z0-9][a-z0-9-]{0,31}$/.test(palette)&&palette!=='default'){r.setAttribute('data-theme',palette)}
if(palette==='custom'&&window.__docCustom){window.__docCustom(r,m)}
}catch(e){}})();`;

const CUSTOM_SCRIPT = `window.__docCustom=function(root,mode){try{
var raw=localStorage.getItem('uuid.data');if(!raw){return}
var held=JSON.parse(raw);var text=held&&held.settings&&held.settings.customTheme&&held.settings.customTheme.value;
if(typeof text!=='string'||text===''){return}
var theme=JSON.parse(text);
var tokens=(theme.variants&&(theme.variants[mode]||theme.variants[mode==='dark'?'light':'dark']))
||(theme[mode]&&(theme[mode].tokens||theme[mode]))||theme.tokens;
if(!tokens){return}
Object.keys(tokens).forEach(function(name){
var bare=String(name).replace(/^--/,'');var value=String(tokens[name]).trim();
if(!/^[a-z0-9-]{1,40}$/.test(bare)||/[;{}]|url\\(|expression|@import/i.test(value)){return}
root.style.setProperty('--'+bare,value);});
}catch(e){}};`;

export function renderHead(page, hubTitle) {
    const url = pageUrl(page.slug);

    return [
        '    <meta charset="utf-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1">',
        `    <title>${escape(page.title)}</title>`,
        `    <meta name="description" content="${escape(page.description)}">`,
        `    <link rel="canonical" href="${escape(url)}">`,
        '    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">',
        '    <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)">',
        '    <meta property="og:type" content="article">',
        `    <meta property="og:site_name" content="${escape(SITE_NAME)}">`,
        `    <meta property="og:title" content="${escape(page.h1)}">`,
        `    <meta property="og:description" content="${escape(page.description)}">`,
        `    <meta property="og:url" content="${escape(url)}">`,
        `    <meta property="og:image" content="${escape(OG_IMAGE)}">`,
        '    <meta name="twitter:card" content="summary_large_image">',
        `    <meta name="twitter:title" content="${escape(page.h1)}">`,
        `    <meta name="twitter:description" content="${escape(page.description)}">`,
        `    <meta name="twitter:image" content="${escape(OG_IMAGE)}">`,
        '    <link rel="icon" href="../favicon.ico" sizes="any">',
        '    <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">',
        '    <link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png">',
        '    <link rel="stylesheet" href="../theme.css">',
        '    <link rel="stylesheet" href="../docs.css">',
        `    <script>${CUSTOM_SCRIPT}${THEME_SCRIPT}</script>`,
        `    <script type="application/ld+json">${jsonLd(pageGraph(page, hubTitle))}</script>`,
    ].join('\n');
}
