'use strict';

import { boot } from './docs-play.js';

export * from './docs-runtime-core.js';

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
