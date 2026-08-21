'use strict';

const FENCE = /^```(\w*)\s*$/;
const DIRECTIVE = /^::(\w+)(?:\s+(.*))?$/;
const HEADING = /^(#{2,3})\s+(.+?)\s*$/;
const ROW = /^\|(.+)\|\s*$/;
const DIVIDER = /^\|[\s:|-]+\|\s*$/;
const ITEM = /^[-*]\s+(.+)$/;

function splitRow(line) {
    return line.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map(cell => cell.trim());
}

function frontMatter(lines) {
    if (lines[0] !== '---') {
        throw new Error('a page starts with front matter');
    }

    const end = lines.indexOf('---', 1);

    if (end < 0) {
        throw new Error('front matter is never closed');
    }

    const held = {};

    for (const line of lines.slice(1, end)) {
        if (line.trim() === '') {
            continue;
        }

        const at = line.indexOf(':');

        if (at < 0) {
            throw new Error(`front matter line without a key: ${line}`);
        }

        held[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    }

    return { head: held, rest: lines.slice(end + 1) };
}

function options(text) {
    const held = {};

    for (const match of (text ?? '').matchAll(/(\w+)=("[^"]*"|\S+)/g)) {
        held[match[1]] = match[2].replace(/^"|"$/g, '');
    }

    return held;
}

function readTable(lines, at) {
    const head = splitRow(lines[at]);
    const rows = [];
    let index = at + 2;

    while (index < lines.length && ROW.test(lines[index])) {
        rows.push(splitRow(lines[index]));
        index += 1;
    }

    return { block: { type: 'table', head, rows }, next: index };
}

function readList(lines, at) {
    const items = [];
    let index = at;

    while (index < lines.length) {
        const match = ITEM.exec(lines[index]);

        if (match === null) {
            break;
        }

        items.push(match[1].trim());
        index += 1;
    }

    return { block: { type: 'ul', items }, next: index };
}

function readCode(lines, at) {
    const lang = FENCE.exec(lines[at])[1];
    const body = [];
    let index = at + 1;

    while (index < lines.length && !FENCE.test(lines[index])) {
        body.push(lines[index]);
        index += 1;
    }

    if (index >= lines.length) {
        throw new Error('a code fence is never closed');
    }

    return { block: { type: 'code', lang: lang === '' ? undefined : lang, code: body.join('\n') }, next: index + 1 };
}

function readParagraph(lines, at) {
    const body = [];
    let index = at;

    while (index < lines.length
        && lines[index].trim() !== ''
        && !HEADING.test(lines[index])
        && !DIRECTIVE.test(lines[index])
        && !FENCE.test(lines[index])
        && !ROW.test(lines[index])
        && !ITEM.test(lines[index])) {
        body.push(lines[index].trim());
        index += 1;
    }

    if (body.length === 0) {
        return { block: { type: 'p', text: lines[at].trim() }, next: at + 1 };
    }

    return { block: { type: 'p', text: body.join(' ') }, next: index };
}

function readUntilEnd(lines, at) {
    const body = [];
    let index = at;

    while (index < lines.length && lines[index].trim() !== '::') {
        if (DIRECTIVE.test(lines[index].trim())) {
            throw new Error(`a block opened on line ${at} is never closed with :: before ${lines[index].trim()}`);
        }

        body.push(lines[index]);
        index += 1;
    }

    if (index >= lines.length) {
        throw new Error(`a block opened on line ${at} is never closed with ::`);
    }

    return { body, next: index + 1 };
}

function directive(name, rest, lines, at, page) {
    const opts = options(rest);

    if (name === 'example') {
        const { body, next } = readUntilEnd(lines, at + 1);
        const cases = [];
        let lede = '';

        for (const line of body) {
            if (line.startsWith('lede:')) {
                lede = line.slice(5).trim();
                continue;
            }

            const item = ITEM.exec(line);

            if (item === null) {
                continue;
            }

            const at = item[1].indexOf(' — ');

            if (at < 0) {
                cases.push({ uuid: item[1].trim() });
                continue;
            }

            cases.push({ uuid: item[1].slice(0, at).trim(), note: item[1].slice(at + 3).trim() });
        }

        page.example = { lede, cases };

        if (opts.kind !== undefined) {
            page.example.kind = opts.kind;
        }

        if (opts.column !== undefined) {
            page.example.column = opts.column;
        }

        if (opts.to !== undefined) {
            page.example.cta = { to: opts.to };

            for (const name of ['int', 'style']) {
                if (opts[name] !== undefined) {
                    page.example.cta[name] = opts[name];
                }
            }
        }

        return { block: null, next };
    }

    if (name === 'index') {
        const { body, next } = readUntilEnd(lines, at + 1);
        const items = body.map(line => ITEM.exec(line)).filter(Boolean).map(match => {
            const parts = match[1].split(' | ');

            return { slug: parts[0].trim(), title: (parts[1] ?? '').trim(), note: parts.slice(2).join(' | ').trim() };
        });

        page.index = (page.index ?? []).concat([{ id: opts.id, title: opts.title, items }]);

        return { block: null, next };
    }

    if (name === 'links') {
        const { body, next } = readUntilEnd(lines, at + 1);
        const items = body.map(line => ITEM.exec(line)).filter(Boolean).map(match => {
            const parts = match[1].split(' | ');
            const href = parts[0].trim();
            const label = (parts[1] ?? '').trim();
            const note = parts.slice(2).join(' | ').trim();

            return note === '' ? { href, label } : { href, label, note };
        });

        return { block: { type: 'links', items }, next };
    }

    if (name === 'faq') {
        const { body, next } = readUntilEnd(lines, at + 1);
        const entries = [];

        for (const line of body) {
            if (line.startsWith('Q:')) {
                entries.push({ q: line.slice(2).trim(), a: '' });
                continue;
            }

            if (line.startsWith('A:') && entries.length > 0) {
                entries[entries.length - 1].a = line.slice(2).trim();
            }
        }

        page.faq = entries;

        return { block: null, next };
    }

    if (name === 'rfc') {
        const parts = (rest ?? '').split(' ');
        const doc = Number(parts[0]);
        const section = parts[1] === '-' ? undefined : parts[1];
        const note = parts.slice(2).join(' ').trim();
        const block = { type: 'rfc', doc };

        if (section !== undefined) {
            block.section = section;
        }

        if (note !== '') {
            block.note = note;
        }

        return { block, next: at + 1 };
    }

    if (name === 'specimen') {
        const parts = (rest ?? '').split(' ');
        const block = { type: 'specimen', uuid: parts[0] };
        const note = parts.slice(1).join(' ').trim();

        if (note !== '') {
            block.note = note;
        }

        return { block, next: at + 1 };
    }

    if (name === 'widget') {
        return { block: { type: 'widget', name: (rest ?? '').trim() }, next: at + 1 };
    }

    if (name === 'note') {
        return { block: { type: 'note', text: (rest ?? '').trim() }, next: at + 1 };
    }

    if (name === 'table') {
        const parts = [...(rest ?? '').matchAll(/"([^"]*)"|(\S+)/g)].map(match => match[1] ?? match[2]);

        return { block: { type: 'generated', name: parts[0], args: parts.slice(1) }, next: at + 1 };
    }

    throw new Error(`unknown directive: ::${name}`);
}

export function parsePage(text, slug) {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const { head, rest } = frontMatter(lines);
    const page = { slug, body: [] };

    for (const [key, value] of Object.entries(head)) {
        if (key === 'related') {
            page.related = value.split(',').map(part => part.trim()).filter(part => part !== '');
            continue;
        }

        if (key === 'priority') {
            page.priority = Number(value);
            continue;
        }

        if (key === 'cta') {
            if (value === 'none') {
                page.cta = null;
                continue;
            }

            const [to, int, style] = value.split(' ');

            page.cta = { to };

            if (int !== undefined && int !== '-') {
                page.cta.int = int;
            }

            if (style !== undefined) {
                page.cta.style = style;
            }

            continue;
        }

        page[key] = value;
    }

    let at = 0;

    while (at < rest.length) {
        const line = rest[at];

        if (line.trim() === '') {
            at += 1;
            continue;
        }

        const heading = HEADING.exec(line);

        if (heading !== null) {
            page.body.push({ type: heading[1].length === 2 ? 'h2' : 'h3', text: heading[2] });
            at += 1;
            continue;
        }

        const found = DIRECTIVE.exec(line);

        if (found !== null) {
            const { block, next } = directive(found[1], found[2], rest, at, page);

            if (block !== null) {
                page.body.push(block);
            }

            at = next;
            continue;
        }

        if (FENCE.test(line)) {
            const { block, next } = readCode(rest, at);

            page.body.push(block);
            at = next;
            continue;
        }

        if (ROW.test(line) && at + 1 < rest.length && DIVIDER.test(rest[at + 1])) {
            const { block, next } = readTable(rest, at);

            page.body.push(block);
            at = next;
            continue;
        }

        if (ITEM.test(line)) {
            const { block, next } = readList(rest, at);

            page.body.push(block);
            at = next;
            continue;
        }

        const { block, next } = readParagraph(rest, at);

        page.body.push(block);
        at = next;
    }

    return page;
}
