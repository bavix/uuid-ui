'use strict';

import { mergeSnapshot, parseSnapshot, summarize } from './snapshot.js';

export function fingerprint(snapshot) {
    const copy = { ...snapshot };
    delete copy.timestamp;

    return JSON.stringify(copy);
}

function body(snapshot) {
    return JSON.stringify(snapshot, null, 2);
}

export async function exchange(here, there, { target, cursor, hereCursor, now = Date.now() }) {
    const mine = await here.read(null, target ? hereCursor : null);
    const local = mine.unchanged ? null : parseSnapshot(mine.content, now);

    if (!target) {
        const created = await there.write(null, body(local));

        return {
            ...created,
            snapshot: local,
            hereCursor: mine.cursor,
            merged: false,
            applied: false,
            skipped: false,
            summary: summarize(local, local),
        };
    }

    const theirs = await there.read(target, cursor);

    if (theirs.unchanged) {
        if (mine.unchanged) {
            return { target, cursor, hereCursor, skipped: true, merged: false, applied: false };
        }

        const written = await there.write(target, body(local));

        return {
            ...written,
            snapshot: local,
            hereCursor: mine.cursor,
            merged: false,
            applied: false,
            skipped: false,
            summary: summarize(local, local),
        };
    }

    const held = local || parseSnapshot((await here.read(null, null)).content, now);
    const remote = parseSnapshot(theirs.content, now);
    const merged = mergeSnapshot(held, remote, now);
    const outgoing = fingerprint(merged);

    const applied = outgoing === fingerprint(held)
        ? { cursor: mine.cursor ?? hereCursor, applied: false }
        : await here.write(null, body(merged));

    const written = outgoing === fingerprint(remote)
        ? { target, cursor: theirs.cursor }
        : await there.write(target, body(merged));

    return {
        target: written.target || target,
        cursor: written.cursor,
        hereCursor: applied.cursor,
        snapshot: merged,
        merged: Boolean(theirs.staleBase),
        applied: Boolean(applied.applied),
        skipped: false,
        summary: summarize(held, merged),
    };
}
