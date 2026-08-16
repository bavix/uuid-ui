'use strict';

/** True while the keystroke belongs to a field the user is typing into. */
export function isTypingTarget(target) {
    return !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
    );
}

/**
 * Calls onComplete when the given keys are pressed in order outside a text
 * field. A pause longer than resetAfterMs starts the sequence over, so a word
 * typed slowly does not accumulate across a whole session.
 *
 * Returns the unsubscribe function.
 */
export function watchSequence(sequence, onComplete, { resetAfterMs = 2000 } = {}) {
    const keys = sequence.map(key => key.toLowerCase());
    let progress = 0;
    let lastPressedAt = 0;

    const onKeyDown = (e) => {
        if (isTypingTarget(e.target) || typeof e.key !== 'string') {
            return;
        }

        const now = Date.now();
        if (progress > 0 && now - lastPressedAt > resetAfterMs) {
            progress = 0;
        }
        lastPressedAt = now;

        const key = e.key.toLowerCase();

        // A wrong key restarts the sequence, but may itself be its first step.
        progress = key === keys[progress]
            ? progress + 1
            : (key === keys[0] ? 1 : 0);

        if (progress === keys.length) {
            progress = 0;
            onComplete();
        }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
}
