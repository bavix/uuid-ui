import React from 'react';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { version as uuidVersion } from 'uuid';

// Import constants
import {
  TYPE_ULID,
  TYPE_BASE64,
  TYPE_HIGH_LOW,
  TYPE_UUID,
  TYPE_BYTES,
  typeDetector,
} from './type-detector';

// Mapping of kind to human-readable type labels
const TYPE_LABELS = {
  [TYPE_ULID]: 'ULID',
  [TYPE_BASE64]: 'Base64',
  [TYPE_HIGH_LOW]: 'HighLow',
  [TYPE_UUID]: 'UUID',
  [TYPE_BYTES]: 'Bytes',
};

// Mapping of kind to Bulma color classes
const TYPE_COLORS = {
  [TYPE_ULID]: 'is-primary',
  [TYPE_UUID]: 'is-success',
  [TYPE_BASE64]: 'is-warning',
  [TYPE_HIGH_LOW]: 'is-info',
  [TYPE_BYTES]: 'is-info',
};

export default class HistoryComponent extends React.Component {
  /**
   * Copies the clicked text to the clipboard and displays a notification.
   *
   * @param {Event} e - The click event on an anchor tag.
   */
  copy = (e) => {
    const text = e.target.innerText;

    navigator.clipboard.writeText(text)
      .then(() => {
        Notify.success(`Text ${text} copied`);
      })
      .catch((error) => {
        Notify.failure(`Error copying text: ${error}`);
      });
  };

  /**
   * Returns a human-readable label for the given kind.
   *
   * @param {number} kind - The kind value from typeDetector.
   * @returns {string} - Human-readable type name.
   */
  getTypeLabel(kind) {
    return TYPE_LABELS[kind] || 'Unknown';
  }

  /**
   * Returns a Bulma color class based on the kind.
   *
   * @param {number} kind - The kind value from typeDetector.
   * @returns {string} - Bulma color class.
   */
  getTypeColor(kind) {
    return TYPE_COLORS[kind] || 'is-info';
  }

  /**
   * Extracts timestamp from ULID.
   *
   * @param {string} ulid - ULID string.
   * @returns {string} - ISO date string.
   */
  getTimestampFromULID(ulid) {
    const base32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const timestampPart = ulid.slice(0, 10);

    let time = 0;
    for (let i = 0; i < timestampPart.length; i++) {
      const char = timestampPart[i];
      const index = base32.indexOf(char);
      if (index === -1) throw new Error(`Invalid ULID character: ${char} at position ${i}`);
      time = (time * 32) + index;
    }

    return new Date(time).toISOString();
  }

  /**
   * Extracts the timestamp from a UUID of version 1, 6, or 7.
   *
   * @param {string} uuid - The UUID string to extract the timestamp from.
   * @returns {string|null} - Returns the ISO date string if the UUID is of a supported version, otherwise returns null.
   */
  getTimestampFromUUID(uuid) {
    const normalized = uuid.replace(/-/g, '').toLowerCase();

    // Get the version of UUID
    const versionHex = normalized[12];
    const version = parseInt(versionHex, 16);

    let timestampMs = null;

    switch (version) {
      case 1: {
        const timeLowStr = normalized.substring(0, 8);
        const timeMidStr = normalized.substring(8, 12);
        const timeHiStr = normalized.substring(13, 16);

        const uuidTime = ((BigInt(timeHiStr) << 32n) + (BigInt(timeMidStr) << 16n) + BigInt(timeLowStr)) * 10000n;

        const GregorianToUnixOffsetMicroseconds = 12219292800000000n;
        timestampMs = Number((uuidTime - GregorianToUnixOffsetMicroseconds) / 1000n);
        break;
      }

      case 6: {
        const timeHighStr = normalized.substring(0, 8);
        const timeMidStr = normalized.substring(8, 12);
        const timeLowStr = normalized.substring(13, 16) + normalized.substring(16, 20);

        const timeHigh = BigInt('0x' + timeHighStr);
        const timeMid = BigInt('0x' + timeMidStr);
        const timeLow = BigInt('0x' + timeLowStr);

        const totalTimestamp = (timeHigh << 28n) | (timeMid << 12n) | timeLow;

        const GregorianToUnixOffsetMs = 12219292800000n;
        timestampMs = Number((totalTimestamp / 10000n) - GregorianToUnixOffsetMs);
        break;
      }

      case 7: {
        const unixTimestamp = parseInt(normalized.substring(0, 12), 16);
        timestampMs = unixTimestamp;
        break;
      }

      default:
        return null;
    }

    // Check timestamp validity
    if (!timestampMs || isNaN(timestampMs) || timestampMs < 0) return null;

    const date = new Date(timestampMs);

    return date.toISOString();
  }

  /**
   * Processes input/output item to determine its type and optional timestamp.
   *
   * @param {string} value - Input or output value from history item.
   * @returns {{ type: string, timestamp: string | null }}
   */
  processItem(value) {
    const kind = typeDetector(value);
    const fullType = this.getTypeLabel(kind);
    let timestamp = null;

    try {
      if (kind === TYPE_UUID && uuidVersion(value)) {
        const version = uuidVersion(value);
        return {
          type: `UUID v${version}`,
          timestamp: this.getTimestampFromUUID(value),
        };
      } else if (kind === TYPE_ULID) {
        timestamp = this.getTimestampFromULID(value);
      }
    } catch (err) {
      // Ignore invalid formats
    }

    return {
      type: fullType,
      timestamp,
    };
  }

  render() {
    const { items, clearItems, isToggled } = this.props;

    return (
      <nav className={isToggled ? "panel is-dark" : "panel is-light"}>
        <p className="panel-heading">History</p>

        {/* Clear history button */}
        <div className={items.length === 0 ? "panel-block is-hidden" : "panel-block"}>
          <button
            onClick={clearItems}
            className="button is-danger is-outlined is-fullwidth is-small"
          >
            Clear the history
          </button>
        </div>

        {/* Items list */}
        {[...items].slice(0, 30).map(i => {
          const inputResult = this.processItem(i.input);
          const outputResult = this.processItem(i.output);

          return (
            <div key={i.toString()} className="panel-block">
              <div className="field">
                {/* Output */}
                <div className="tags has-addons">
                  <a
                    href="javascript:"
                    onClick={this.copy}
                    className="tag is-link is-light is-clickable"
                    data-tooltip={i.info}
                  >
                    {i.output}
                  </a>
                  <span className="tag is-rounded">{outputResult.type} (Output)</span>
                </div>

                {/* Input */}
                <div className="tags has-addons">
                  <a
                    href="javascript:"
                    onClick={this.copy}
                    className={`tag ${this.getTypeColor(typeDetector(i.input))} is-clickable`}
                    data-tooltip={i.info}
                  >
                    {i.input}
                  </a>
                  <span className="tag is-rounded">{inputResult.type} (Input)</span>
                </div>

                {/* Timestamps */}
                {(inputResult.timestamp || outputResult.timestamp) && (
                  <div className="mt-2">
                    {inputResult.timestamp && (
                      <p className="is-size-7 has-text-weight-normal mb-2">
                        <strong>Input TS:</strong> {inputResult.timestamp}
                      </p>
                    )}
                    {outputResult.timestamp && (
                      <p className="is-size-7 has-text-weight-normal mb-2">
                        <strong>Output TS:</strong> {outputResult.timestamp}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </nav>
    );
  }
}
