'use strict';

const runs = new Map();

/**
 * Counts repeated clicks that arrive close together, and says when a run is
 * complete. The count lives here rather than on a component, so a re-render
 * between two clicks cannot lose it.
 */
export function burst(key, { count = 5, withinMs = 500, now = Date.now() } = {}) {
    const held = runs.get(key);
    const started = held && now - held.at < withinMs ? held.hits : 0;
    const hits = started + 1;

    if (hits >= count) {
        runs.delete(key);

        return true;
    }

    runs.set(key, { hits, at: now });

    return false;
}

export function forgetBursts() {
    runs.clear();
}
