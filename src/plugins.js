'use strict';

const actions = [];

export function registerNavAction(action) {
    if (!action || !action.id || typeof action.render !== 'function') {
        return () => {};
    }

    if (actions.some(held => held.id === action.id)) {
        return () => {};
    }

    actions.push(action);

    return () => {
        const at = actions.indexOf(action);

        if (at !== -1) {
            actions.splice(at, 1);
        }
    };
}

export function navActions() {
    return [...actions];
}
