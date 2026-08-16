'use strict';

/**
 * Personal bests for the games hidden in here. One store per game, one entry
 * per difficulty, and a direction: a time is better when it is smaller, a score
 * when it is larger.
 */

const TIME_KEY = 'uuidMinesBest';
const SCORE_KEY = 'uuidGameScores';

function readRecords(key, storage) {
    try {
        const stored = JSON.parse(storage.getItem(key));

        if (stored === null || typeof stored !== 'object' || Array.isArray(stored)) {
            return {};
        }

        const clean = {};

        for (const [level, seconds] of Object.entries(stored)) {
            if (Number.isFinite(seconds) && seconds >= 0) {
                clean[level] = seconds;
            }
        }

        return clean;
    } catch (e) {
        return {};
    }
}

function writeRecord(key, name, value, better, storage) {
    const all = readRecords(key, storage);
    const previous = all[name];

    if (typeof previous === 'number' && !better(value, previous)) {
        return previous;
    }

    try {
        all[name] = value;
        storage.setItem(key, JSON.stringify(all));
    } catch (e) {
        // a full or blocked storage costs the record, not the game
    }

    return value;
}

/** Best times per board size. Corrupt or foreign data reads as no records. */
export function readBestTimes(storage = localStorage) {
    return readRecords(TIME_KEY, storage);
}

/**
 * Keeps the faster of the two and returns whichever now stands, so the caller
 * can tell a new record from a merely finished game.
 */
export function writeBestTime(level, seconds, storage = localStorage) {
    return writeRecord(TIME_KEY, level, seconds, (next, previous) => next < previous, storage);
}

/** Best scores per game. Same store shape, opposite direction. */
export function readBestScores(storage = localStorage) {
    return readRecords(SCORE_KEY, storage);
}

export function writeBestScore(game, score, storage = localStorage) {
    return writeRecord(SCORE_KEY, game, score, (next, previous) => next > previous, storage);
}
