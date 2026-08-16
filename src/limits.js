'use strict';

/**
 * How many conversions survive a reload. ~150 bytes per row, so 1000 rows cost
 * about 150 KB of the ~5 MB an origin gets — enough for a session's worth of
 * pasted columns. The old cap was 100, which a single paste blew past while the
 * counter kept promising the full number.
 */
export const HISTORY_LIMIT = 1000;

/** How many rows are rendered before "Show more" takes over. */
export const PAGE_SIZE = 30;
