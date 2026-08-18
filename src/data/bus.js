'use strict';

export function createBus() {
    const listeners = new Map();

    return {
        on(name, listener) {
            if (!listeners.has(name)) {
                listeners.set(name, new Set());
            }

            listeners.get(name).add(listener);

            return () => {
                const group = listeners.get(name);

                if (group) {
                    group.delete(listener);
                }
            };
        },

        emit(name, payload) {
            const group = listeners.get(name);

            if (!group) {
                return;
            }

            for (const listener of [...group]) {
                try {
                    listener(payload);
                } catch (e) {
                    console.error(`Listener for "${name}" failed:`, e);
                }
            }
        },

        count(name) {
            const group = listeners.get(name);

            return group ? group.size : 0;
        },
    };
}
