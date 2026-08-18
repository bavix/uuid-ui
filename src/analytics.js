'use strict';

import { markFound } from './eggs-found.js';

/**
 * Both counters that this page already loads, behind one call.
 *
 * What goes out is the name of the thing that happened and, at most, a short
 * label describing it — never an identifier anyone pasted, never the contents
 * of the history. The point is to learn which of these are ever found, not to
 * watch what people convert.
 */

// The counter id the page initialises in index.html.
const METRIKA_ID = 94685288;

const EVENT = 'easter_egg';

function counters() {
    return typeof window === 'undefined' ? {} : window;
}

/**
 * @param {string} egg   which one, e.g. 'mines' or 'nil'
 * @param {string} [how] how it was reached, e.g. 'typed', 'clicked', 'converted'
 */
export function trackEgg(egg, how) {
    if (typeof egg !== 'string' || egg === '') {
        return;
    }

    markFound(egg);

    const payload = how ? { egg, how } : { egg };
    const { gtag, ym } = counters();

    try {
        if (typeof gtag === 'function') {
            gtag('event', EVENT, payload);
        }
    } catch (e) {
        // analytics must never break the thing it is measuring
    }

    try {
        if (typeof ym === 'function') {
            ym(METRIKA_ID, 'reachGoal', EVENT, payload);
        }
    } catch (e) {
        // as above
    }
}
