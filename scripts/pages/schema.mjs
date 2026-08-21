'use strict';

import { AUTHOR_NAME, AUTHOR_URL, DOCKER_URL, HUB_SLUG, OG_IMAGE, REPO_URL, SITE_NAME, SITE_URL, pageUrl } from './site.mjs';
import { formatName, formatSlugs } from './examples.mjs';

const LICENSE = 'https://opensource.org/licenses/MIT';

function author() {
    return { '@type': 'Person', name: AUTHOR_NAME, url: AUTHOR_URL };
}

function website() {
    return {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: 'en',
        publisher: author(),
    };
}

function application() {
    return {
        '@type': 'SoftwareApplication',
        '@id': `${SITE_URL}#app`,
        name: SITE_NAME,
        alternateName: 'UUID converter and generator',
        url: SITE_URL,
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'Developer utility',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        image: OG_IMAGE,
        isAccessibleForFree: true,
        license: LICENSE,
        author: author(),
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: formatSlugs().map(slug => `Convert a UUID to ${formatName(slug)}`),
        sameAs: [REPO_URL, DOCKER_URL],
    };
}

function sourceCode() {
    return {
        '@type': 'SoftwareSourceCode',
        '@id': `${SITE_URL}#source`,
        name: 'bavix/uuid-ui',
        codeRepository: REPO_URL,
        url: REPO_URL,
        programmingLanguage: ['JavaScript', 'Go'],
        runtimePlatform: 'Docker',
        license: LICENSE,
        author: author(),
        about: { '@id': `${SITE_URL}#app` },
    };
}

export function siteGraph() {
    return { '@context': 'https://schema.org', '@graph': [website(), application(), sourceCode()] };
}

function breadcrumbs(page, hubTitle) {
    const items = [{ name: SITE_NAME, url: SITE_URL }];

    if (page.slug !== HUB_SLUG) {
        items.push({ name: hubTitle, url: pageUrl(HUB_SLUG) });
    }

    items.push({ name: page.h1, url: pageUrl(page.slug) });

    return {
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

function faqPage(page) {
    return {
        '@type': 'FAQPage',
        '@id': `${pageUrl(page.slug)}#faq`,
        mainEntity: page.faq.map(entry => ({
            '@type': 'Question',
            name: entry.q,
            acceptedAnswer: { '@type': 'Answer', text: entry.a },
        })),
    };
}

export function pageGraph(page, hubTitle) {
    const url = pageUrl(page.slug);
    const graph = [
        website(),
        {
            '@type': 'TechArticle',
            '@id': `${url}#article`,
            headline: page.h1,
            name: page.h1,
            description: page.description,
            abstract: page.tldr,
            url,
            mainEntityOfPage: url,
            inLanguage: 'en',
            datePublished: page.updated,
            dateModified: page.updated,
            author: author(),
            publisher: author(),
            isPartOf: { '@id': `${SITE_URL}#website` },
            about: { '@id': `${SITE_URL}#app` },
            proficiencyLevel: 'Beginner',
        },
        breadcrumbs(page, hubTitle),
    ];

    if (Array.isArray(page.faq) && page.faq.length >= 2) {
        graph.push(faqPage(page));
    }

    return { '@context': 'https://schema.org', '@graph': graph };
}

export function jsonLd(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}
