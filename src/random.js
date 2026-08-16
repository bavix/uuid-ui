/**
 * Randomness for everything that is not an identifier: confetti, screen shake,
 * falling glyphs, obstacle spawns. None of it is a security decision, but the
 * app already has crypto.getRandomValues to hand, so there is no reason to keep
 * a second, weaker source around for the decorations.
 *
 * The draws come out of a refilled pool: one syscall per 256 numbers rather
 * than one per particle, which matters when a burst of confetti asks for a
 * couple of hundred in the same frame.
 */
const POOL_SIZE = 256;
const pool = new Uint32Array(POOL_SIZE);
let next = POOL_SIZE;

/** A float in [0, 1), the same contract Math.random() has. */
export function randomFloat() {
    if (next >= POOL_SIZE) {
        crypto.getRandomValues(pool);
        next = 0;
    }

    return pool[next++] / 4294967296;
}

/** An integer in [0, max). Returns 0 when there is nothing to pick from. */
export function randomInt(max) {
    return max > 0 ? Math.floor(randomFloat() * max) : 0;
}

/** A float in [min, max). */
export function randomRange(min, max) {
    return min + randomFloat() * (max - min);
}

/** One of the entries, or undefined when there are none. */
export function randomPick(items) {
    return items[randomInt(items.length)];
}
