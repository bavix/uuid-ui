export function storageOf(initial) {
    const store = new Map(Object.entries(initial ?? {}));

    return {
        get length() { return store.size; },
        key: i => [...store.keys()][i] ?? null,
        getItem: k => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, v),
        removeItem: k => store.delete(k),
        raw: k => store.get(k),
        has: k => store.has(k),
        _keys: () => Object.fromEntries(store),
    };
}

export const blockedStorage = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
    removeItem: () => { throw new Error('blocked'); },
};
