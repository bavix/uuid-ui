'use strict';

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { PAGES } from './pages/pages.data.mjs';
import { MARK, render404, renderPage } from './pages/render.mjs';
import { renderFacts, renderLlms, renderLlmsFull, renderRobots, renderSitemap } from './pages/derived.mjs';
import { HUB_SLUG } from './pages/site.mjs';

const here = dirname(fileURLToPath(import.meta.url));

function themeCss(publicDir, written) {
    const assets = join(publicDir, 'assets');
    const built = existsSync(assets)
        ? readdirSync(assets).filter(name => name.startsWith('index-') && name.endsWith('.css'))
        : [];

    if (built.length === 0) {
        if (existsSync(join(publicDir, 'theme.css'))) {
            return;
        }

        throw new Error('no built stylesheet in public/assets: run vite build before generating pages');
    }

    write(join(publicDir, 'theme.css'), readFileSync(join(assets, built[0]), 'utf-8'), written);
}

function titles() {
    return new Map(PAGES.map(page => [page.slug, page.h1]));
}

function write(path, content, written) {
    const dir = dirname(path);

    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    if (!existsSync(path) || readFileSync(path, 'utf-8') !== content) {
        writeFileSync(path, content);
    }

    written.add(path);
}

function prune(publicDir, keep) {
    for (const name of readdirSync(publicDir)) {
        const path = join(publicDir, name);

        if (name === 'assets' || keep.has(name) || !statSync(path).isDirectory()) {
            continue;
        }

        const index = join(path, 'index.html');

        if (!existsSync(index)) {
            continue;
        }

        if (readFileSync(index, 'utf-8').startsWith(`<!DOCTYPE html>\n${MARK}`)) {
            rmSync(path, { recursive: true, force: true });
        }
    }
}

async function buildRuntime(root) {
    const { build } = await import('vite');

    await build({
        configFile: false,
        logLevel: 'warn',
        resolve: { alias: { 'react': 'preact/compat', 'react-dom': 'preact/compat' } },
        build: {
            outDir: resolve(root, 'public'),
            emptyOutDir: false,
            copyPublicDir: false,
            minify: 'esbuild',
            lib: {
                entry: resolve(root, 'src/docs-runtime.js'),
                formats: ['es'],
                fileName: () => 'docs.js',
            },
        },
    });
}

export async function buildPages({ root = resolve(here, '..'), runtime = true } = {}) {
    const publicDir = resolve(root, 'public');

    if (runtime) {
        await buildRuntime(root);
    }

    const known = titles();
    const hub = known.get(HUB_SLUG);

    if (hub === undefined) {
        throw new Error(`the hub page "${HUB_SLUG}" is missing from pages.data.mjs`);
    }

    const groups = PAGES.find(page => page.slug === HUB_SLUG).index ?? [];
    const order = [HUB_SLUG, ...groups.flatMap(group => group.items.map(item => item.slug))];

    const seen = new Set();
    const written = new Set();

    for (const page of PAGES) {
        if (seen.has(page.slug)) {
            throw new Error(`duplicate slug: ${page.slug}`);
        }

        seen.add(page.slug);

        const html = renderPage(page, { hubTitle: hub, titleOf: slug => known.get(slug), groups, order });

        write(join(publicDir, page.slug, 'index.html'), html, written);
    }

    themeCss(publicDir, written);
    write(join(publicDir, 'robots.txt'), renderRobots(), written);
    write(join(publicDir, 'sitemap.xml'), renderSitemap(PAGES), written);
    write(join(publicDir, 'llms.txt'), renderLlms(PAGES), written);
    write(join(publicDir, 'llms-full.txt'), renderLlmsFull(PAGES), written);
    write(join(publicDir, 'uuid-facts.json'), renderFacts(PAGES), written);
    write(join(publicDir, '404.html'), render404(), written);
    write(join(publicDir, '.nojekyll'), '', written);

    prune(publicDir, seen);

    return { pages: PAGES.length, files: written.size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const held = await buildPages();

    console.log(`pages: ${held.pages}, files written: ${held.files}`);
}
