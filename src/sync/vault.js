'use strict';

const DB_NAME = 'uuid-ui-sync';
const STORE = 'keys';
const KEY_ID = 'secret';
const TAG = 'v1:';
const IV_BYTES = 12;

function toBase64(bytes) {
    let out = '';

    for (const byte of bytes) {
        out += String.fromCharCode(byte);
    }

    return btoa(out);
}

function fromBase64(text) {
    const raw = atob(text);
    const bytes = new Uint8Array(raw.length);

    for (let i = 0; i < raw.length; i += 1) {
        bytes[i] = raw.charCodeAt(i);
    }

    return bytes;
}

function openDatabase(factory) {
    return new Promise((resolve, reject) => {
        const request = factory.open(DB_NAME, 1);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('blocked'));
    });
}

function transact(db, mode, work) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = work(tx.objectStore(STORE));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export function createVault({ factory, subtle, random } = {}) {
    const usable = Boolean(factory && subtle && random);

    async function key() {
        const db = await openDatabase(factory);

        try {
            const held = await transact(db, 'readonly', store => store.get(KEY_ID));

            if (held) {
                return held;
            }

            const made = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

            await transact(db, 'readwrite', store => store.put(made, KEY_ID));

            return made;
        } finally {
            db.close();
        }
    }

    return {
        sealed(text) {
            return typeof text === 'string' && text.startsWith(TAG);
        },

        async seal(text) {
            if (!usable || typeof text !== 'string' || text === '') {
                return text;
            }

            try {
                const iv = random(new Uint8Array(IV_BYTES));
                const cipher = await subtle.encrypt(
                    { name: 'AES-GCM', iv },
                    await key(),
                    new TextEncoder().encode(text),
                );
                const body = new Uint8Array(iv.length + cipher.byteLength);

                body.set(iv, 0);
                body.set(new Uint8Array(cipher), iv.length);

                return TAG + toBase64(body);
            } catch (e) {
                return text;
            }
        },

        async open(text) {
            if (typeof text !== 'string' || text === '') {
                return null;
            }

            if (!text.startsWith(TAG)) {
                return text;
            }

            if (!usable) {
                return null;
            }

            try {
                const body = fromBase64(text.slice(TAG.length));
                const plain = await subtle.decrypt(
                    { name: 'AES-GCM', iv: body.slice(0, IV_BYTES) },
                    await key(),
                    body.slice(IV_BYTES),
                );

                return new TextDecoder().decode(plain);
            } catch (e) {
                return null;
            }
        },
    };
}

export function browserVault(win = typeof window === 'undefined' ? {} : window) {
    const crypto = win.crypto;

    return createVault({
        factory: win.indexedDB,
        subtle: crypto && crypto.subtle,
        random: crypto && crypto.getRandomValues ? bytes => crypto.getRandomValues(bytes) : null,
    });
}
