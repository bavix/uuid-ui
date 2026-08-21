import assert from 'node:assert';
import test from 'node:test';
import { readFileSync, readdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = new URL('../content/', import.meta.url);
const scratch = mkdtempSync(join(tmpdir(), 'uuid-ui-snippets-'));

function blocks(lang) {
    const found = [];

    for (const name of readdirSync(dir).filter(file => file.endsWith('.md'))) {
        const text = readFileSync(new URL(name, dir), 'utf-8');

        for (const match of text.matchAll(/```(\w+)\n([\s\S]*?)\n```/g)) {
            if (match[1] === lang) {
                found.push({ page: name.slice(0, -3), code: match[2] });
            }
        }
    }

    return found;
}

test('every JavaScript snippet on the pages parses', async (t) => {
    const found = blocks('javascript');

    assert.ok(found.length > 0, 'no snippets to check');

    for (const { page, code } of found) {
        const file = join(scratch, 'snippet.mjs');

        writeFileSync(file, code);

        try {
            execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
        } catch (e) {
            assert.fail(`${page}: ${String(e.stderr).split('\n').slice(0, 3).join(' ')}`);
        }
    }
});
