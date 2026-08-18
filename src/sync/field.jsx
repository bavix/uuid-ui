import React from 'preact/compat';
import {
    TYPE_BASE64,
    TYPE_BYTES,
    TYPE_HEX,
    TYPE_HIGH_LOW,
    TYPE_ULID,
    TYPE_UUID,
    TYPE_WORDS,
    typeDetector,
} from '../type-detector.js';
import { itemKey } from '../data/keys.js';
import { HISTORY_LIMIT } from '../limits.js';
import { selector } from '../data/store.js';

export const FIELD_COLUMNS = 24;
export const FIELD_MIN_ROWS = 2;
export const FIELD_MAX_ROWS = 5;
export const FIELD_SLOTS = FIELD_COLUMNS * FIELD_MAX_ROWS;

function slotsFor(total) {
    const rows = Math.min(FIELD_MAX_ROWS, Math.max(FIELD_MIN_ROWS, Math.ceil(total / FIELD_COLUMNS) + 1));

    return rows * FIELD_COLUMNS;
}

const FORMATS = [
    { type: TYPE_HIGH_LOW, key: 'highlow', label: 'high/low' },
    { type: TYPE_UUID, key: 'uuid', label: 'uuid' },
    { type: TYPE_BASE64, key: 'base64', label: 'base64' },
    { type: TYPE_ULID, key: 'ulid', label: 'ulid' },
    { type: TYPE_BYTES, key: 'bytes', label: 'bytes' },
    { type: TYPE_WORDS, key: 'words', label: 'words' },
    { type: TYPE_HEX, key: 'uuid', label: 'hex' },
];

function formatOf(output) {
    const detected = typeDetector(output);
    const found = FORMATS.find(format => format.type === detected);

    return found ? found : FORMATS[1];
}


export function buildField(data, limit = FIELD_SLOTS) {
    const history = data.items;
    const favorites = data.favorites;
    const starred = new Set();

    for (const tag of Object.values(favorites)) {
        for (const row of tag.items) {
            starred.add(itemKey(row));
        }
    }

    const cells = history.slice(0, limit).map(row => ({
        key: itemKey(row),
        format: formatOf(row.output),
        starred: starred.has(itemKey(row)),
    }));

    return {
        cells,
        slots: slotsFor(history.length),
        total: history.length,
        tags: Object.keys(favorites).length,
        starred: starred.size,
    };
}

export default class SyncField extends React.Component {
    legend() {
        const seen = new Map();

        for (const cell of this.props.field.cells) {
            if (!seen.has(cell.format.label)) {
                seen.set(cell.format.label, cell.format.key);
            }
        }

        return [...seen.entries()].map(([label, key]) => ({ label, key }));
    }

    render() {
        const { field, moving } = this.props;
        const { cells, total, slots } = field;
        const voids = Math.max(0, slots - cells.length);

        if (total === 0) {
            return (
                <div className="sync-field is-empty">
                    <p>Nothing converted yet. What you do here is what travels.</p>
                </div>
            );
        }

        return (
            <div className="sync-field">
                <div className={`sync-grid ${moving ? 'is-moving' : ''}`} aria-hidden="true">
                    {cells.map((cell, index) => (
                        <span
                            key={`${cell.key}-${index}`}
                            className={`sync-cell k-${cell.format.key} ${cell.starred ? 'is-star' : ''}`}
                            style={{ '--i': index }}
                        ></span>
                    ))}
                    {Array.from({ length: voids }, (_, index) => (
                        <span key={`void-${index}`} className="sync-cell is-void"></span>
                    ))}
                </div>
                <div className="sync-meta">
                    <div className="sync-keys">
                        {this.legend().map(item => (
                            <span key={item.label} className="sync-key">
                                <span className={`sync-kbox k-${item.key}`}></span>
                                {item.label}
                            </span>
                        ))}
                    </div>
                    <span className="sync-count">
                        {cells.length < total ? `newest ${cells.length} of ` : ''}
                        {total} / {HISTORY_LIMIT}
                    </span>
                </div>
            </div>
        );
    }
}

export const selectField = selector(buildField);
