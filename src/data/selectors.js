'use strict';

import { Item } from '../input.jsx';
import { selector } from './store.js';

export const selectItems = selector(rows => rows.map(row => new Item(row.input, row.output, row.info, row)));

export const selectFavorites = selector((favorites) => {
    const built = {};

    for (const [tag, list] of Object.entries(favorites)) {
        built[tag] = list.items.map(row => new Item(row.input, row.output, row.info, row));
    }

    return built;
});
