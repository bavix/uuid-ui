'use strict';

/**
 * navigator.clipboard only exists in secure contexts. The Docker image serves
 * plain HTTP on :8080, where reaching for it directly throws a TypeError, so
 * fall back to the legacy execCommand path there.
 *
 * The modern path can also *reject* on a page the browser does not consider
 * focused, which is not a reason to lose the copy: the legacy path still works
 * there, so a rejection falls through to it rather than to the user.
 *
 * @returns {Promise<void>} rejects when the text could not be copied
 */
export function copyText(text) {
    const value = typeof text === 'string' ? text : String(text ?? '');

    if (value === '') {
        return Promise.reject(new Error('Nothing to copy'));
    }

    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(value).catch(() => legacyCopy(value));
    }

    return legacyCopy(value);
}

function legacyCopy(value) {
    return new Promise((resolve, reject) => {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.opacity = '0';

        document.body.appendChild(textarea);

        try {
            textarea.select();
            if (document.execCommand('copy')) {
                resolve();
            } else {
                reject(new Error('Clipboard is unavailable in this context'));
            }
        } catch (e) {
            reject(e);
        } finally {
            textarea.remove();
        }
    });
}
