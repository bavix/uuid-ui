'use strict';

export const RUNNER = 'Space Runner';

/**
 * The score to start from: the shared records first, the key this game kept its
 * own score under before those records existed second, zero when neither says
 * anything.
 */
export function startingHighScore(records = {}, legacy = null) {
    const kept = records[RUNNER];

    if (typeof kept === 'number' && kept >= 0) {
        return kept;
    }

    const held = parseInt(legacy ?? '0', 10);

    return Number.isFinite(held) && held >= 0 ? held : 0;
}
