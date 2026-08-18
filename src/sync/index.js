'use strict';

import React from 'preact/compat';
import { registerNavAction } from '../plugins.js';
import SyncButton from './button.jsx';

export function registerSync() {
    return registerNavAction({
        id: 'sync',
        render: ({ store, bus, data }) => React.createElement(SyncButton, { store, bus, data }),
    });
}
