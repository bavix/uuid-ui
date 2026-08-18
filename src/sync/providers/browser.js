'use strict';

import { buildSnapshot, mergeSnapshot, parseSnapshot } from '../snapshot.js';
import { fingerprint } from '../engine.js';

export const BROWSER_TARGET = 'this-browser';

export default {
    id: 'browser',
    label: 'This browser',
    always: true,
    needs: [],

    link() {
        return null;
    },

    create(credentials, deps = {}) {
        const store = deps.store;

        function snapshot(now) {
            return buildSnapshot(store.snapshot(), now);
        }

        return {
            async account() {
                return { name: 'This browser' };
            },

            async locate() {
                return [{ targetId: BROWSER_TARGET, label: 'This browser', updatedAt: '' }];
            },

            async read(target, cursor) {
                const held = snapshot(Date.now());
                const mark = fingerprint(held);

                if (cursor && cursor === mark) {
                    return { unchanged: true };
                }

                return {
                    unchanged: false,
                    content: JSON.stringify(held),
                    cursor: mark,
                    staleBase: cursor !== mark,
                };
            },

            async write(target, content) {
                const now = Date.now();
                const incoming = parseSnapshot(content, now);
                const held = snapshot(now);
                const merged = mergeSnapshot(held, incoming, now);
                const mark = fingerprint(merged);

                if (mark === fingerprint(held)) {
                    return { target: BROWSER_TARGET, cursor: mark, applied: false };
                }

                store.applyRemote(merged);

                return { target: BROWSER_TARGET, cursor: mark, applied: true };
            },
        };
    },
};
