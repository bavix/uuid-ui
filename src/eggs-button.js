'use strict';

/**
 * The footer's easter-egg button. It lives in index.html, outside the Preact
 * root, so it is wired by hand rather than rendered: the footer is static
 * markup and should stay that way.
 *
 * Returns a function that reveals the button; calling it twice is harmless.
 */
export function mountEggsButton(onOpen) {
    const button = document.getElementById('eggs-help');

    if (button === null) {
        return () => {};
    }

    button.addEventListener('click', onOpen);

    return () => {
        for (const part of document.querySelectorAll('[data-eggs-part]')) {
            part.hidden = false;
        }
    };
}
