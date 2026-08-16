'use strict';

const STORAGE_KEY = 'uuidActiveSeconds';

/**
 * Counts time actually spent working, not time a tab was left open.
 *
 * A tick only counts when the page is visible *and* something happened in the
 * last `idleMs`. Leaving the tool open in a background tab over lunch adds
 * nothing; typing, pasting and clicking do.
 */
export class ActiveTime {
    constructor({ seconds = 0, idleMs = 60_000, maxStepMs = 30_000 } = {}) {
        this.seconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
        this.idleMs = idleMs;
        // A tab that was suspended reports one enormous gap on wake-up; a step
        // is capped so that gap cannot be banked as work.
        this.maxStepMs = maxStepMs;
        // null, not 0: zero is a perfectly good timestamp, and conflating the
        // two makes "never ticked" indistinguishable from "ticked at zero".
        this.lastActivityAt = null;
        this.lastTickAt = null;
    }

    markActivity(now) {
        this.lastActivityAt = now;
        if (this.lastTickAt === null) {
            this.lastTickAt = now;
        }
    }

    /** Adds the elapsed slice when it was earned. Returns the total seconds. */
    tick(now, visible) {
        const since = this.lastTickAt === null ? 0 : now - this.lastTickAt;
        this.lastTickAt = now;

        const active = visible
            && this.lastActivityAt !== null
            && now - this.lastActivityAt <= this.idleMs;

        if (active && since > 0) {
            this.seconds += Math.min(since, this.maxStepMs) / 1000;
        }

        return this.seconds;
    }

    /** Nothing is counted again after a pause; the next tick starts fresh. */
    suspend() {
        this.lastTickAt = null;
    }
}

export function readActiveSeconds(storage = localStorage) {
    try {
        const raw = Number(storage.getItem(STORAGE_KEY));
        return Number.isFinite(raw) && raw > 0 ? raw : 0;
    } catch (e) {
        return 0;
    }
}

/**
 * Never lowers the stored total. Two tabs each keep their own count, and the one
 * that closes last would otherwise overwrite the other's work with its own,
 * smaller number.
 */
export function writeActiveSeconds(seconds, storage = localStorage) {
    try {
        const kept = Math.max(readActiveSeconds(storage), Math.round(seconds));
        storage.setItem(STORAGE_KEY, String(kept));
    } catch (e) {
    }
}

/**
 * Binds an ActiveTime to the page. Calls onChange with the running total.
 * Returns the unsubscribe function.
 */
export function trackActiveTime(onChange, { tickMs = 5000, saveEvery = 6 } = {}) {
    const clock = new ActiveTime({ seconds: readActiveSeconds() });
    const events = ['keydown', 'pointerdown', 'paste', 'wheel'];
    const mark = () => clock.markActivity(Date.now());
    let ticksSinceSave = 0;

    events.forEach(type => window.addEventListener(type, mark, { passive: true }));

    const onVisibility = () => {
        if (document.visibilityState === 'visible') {
            clock.suspend();
        } else {
            writeActiveSeconds(clock.seconds);
        }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', () => writeActiveSeconds(clock.seconds));

    const timer = setInterval(() => {
        const total = clock.tick(Date.now(), document.visibilityState === 'visible');

        if (++ticksSinceSave >= saveEvery) {
            ticksSinceSave = 0;
            writeActiveSeconds(total);
        }

        onChange(total);
    }, tickMs);

    return () => {
        clearInterval(timer);
        events.forEach(type => window.removeEventListener(type, mark));
        document.removeEventListener('visibilitychange', onVisibility);
        writeActiveSeconds(clock.seconds);
    };
}
