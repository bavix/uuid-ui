import React from 'preact/compat';
import { toast } from 'sonner';
import { version as uuidVersion } from 'uuid';
import {
  TYPE_ULID,
  TYPE_BASE64,
  TYPE_HIGH_LOW,
  TYPE_UUID,
  TYPE_BYTES,
  typeDetector,
} from './type-detector';
import SpaceRunner from './space-runner.js';

const TYPE_LABELS = {
  [TYPE_ULID]: 'ULID',
  [TYPE_BASE64]: 'Base64',
  [TYPE_HIGH_LOW]: 'HighLow',
  [TYPE_UUID]: 'UUID',
  [TYPE_BYTES]: 'Bytes',
};

const TYPE_CLASS_NAMES = {
  [TYPE_ULID]: 'type-ulid',
  [TYPE_UUID]: 'type-uuid',
  [TYPE_BASE64]: 'type-base64',
  [TYPE_HIGH_LOW]: 'type-highlow',
  [TYPE_BYTES]: 'type-bytes',
};

export default class HistoryComponent extends React.Component {
  tooltipRefs = new Map();
  
  constructor(props) {
    super(props);
    this.emptyIconClickCount = 0;
    this.lastEmptyIconClick = null;
    this.showGame = false;
    this.gameKeySequence = '';
    this.gameKeyTimeout = null;
  }

  componentDidMount() {
    this.handleKeyDown = (e) => {
      if (this.showGame) return;
      
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      );
      
      if (isInputFocused) return;
      
      const key = e.key.toLowerCase();
      if (key.length === 1 && /[a-z]/.test(key)) {
        this.gameKeySequence += key;
        
        if (this.gameKeyTimeout) {
          clearTimeout(this.gameKeyTimeout);
        }
        
        this.gameKeyTimeout = setTimeout(() => {
          this.gameKeySequence = '';
        }, 2000);
        
        if (this.gameKeySequence === 'game') {
          this.gameKeySequence = '';
          if (this.gameKeyTimeout) {
            clearTimeout(this.gameKeyTimeout);
            this.gameKeyTimeout = null;
          }
          this.showGame = true;
          this.forceUpdate();
          toast.success('🚀 Secret unlocked!', {
            description: 'Space Runner game activated!',
            duration: 3000,
          });
        } else if (!'game'.startsWith(this.gameKeySequence)) {
          this.gameKeySequence = '';
        }
      }
    };
    
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    if (this.handleKeyDown) {
      window.removeEventListener('keydown', this.handleKeyDown);
    }
    if (this.gameKeyTimeout) {
      clearTimeout(this.gameKeyTimeout);
    }
  }

  updateTooltipPosition = (e, tooltipId) => {
    const tooltip = this.tooltipRefs.get(tooltipId);
    if (!tooltip) return;

    const rect = e.currentTarget.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 8}px`;
    tooltip.style.transform = 'translate(-50%, -100%)';
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';
  };

  showTooltip = (e, tooltipId) => {
    this.updateTooltipPosition(e, tooltipId);
  };

  hideTooltip = (tooltipId) => {
    const tooltip = this.tooltipRefs.get(tooltipId);
    if (!tooltip) return;
    tooltip.style.opacity = '0';
    tooltip.style.visibility = 'hidden';
  };

  copy = (e, text) => {
    e.stopPropagation();
    
    if (!text || text.trim() === '') return;

    navigator.clipboard.writeText(text.trim())
      .then(() => {
        toast.success('Copied', {
          description: text.length > 40 ? text.substring(0, 40) + '...' : text
        });
      })
      .catch((error) => {
        toast.error('Error copying', {
          description: error.message
        });
      });
  };

  copyTimestamp = (e, timestamp, label) => {
    e.stopPropagation();
    
    if (!timestamp) return;

    navigator.clipboard.writeText(timestamp)
      .then(() => {
        toast.success('Timestamp copied', {
          description: `${label}: ${this.formatTimestamp(timestamp)}`
        });
      })
      .catch((error) => {
        toast.error('Error copying timestamp', {
          description: error.message
        });
      });
  };

  removeItem = (e, itemToRemove) => {
    e.stopPropagation();
    const { items } = this.props;
    const updatedItems = items.filter(item => item.toString() !== itemToRemove.toString());
    this.props.setItems(updatedItems);
    toast.success('Removed');
  };

  getTypeLabel(kind) {
    return TYPE_LABELS[kind] || 'Unknown';
  }

  getTypeClassName(kind) {
    return TYPE_CLASS_NAMES[kind] || '';
  }

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

  getTimestampFromUUID(uuid) {
    const normalized = uuid.replace(/-/g, '').toLowerCase();
    const versionHex = normalized[12];
    const version = parseInt(versionHex, 16);

    let timestampMs = null;

    switch (version) {
      case 1: {
        const timeLowStr = normalized.substring(0, 8);
        const timeMidStr = normalized.substring(8, 12);
        const timeHiStr = normalized.substring(13, 16);

        const uuidTime = ((BigInt('0x' + timeHiStr) << 32n) + (BigInt('0x' + timeMidStr) << 16n) + BigInt('0x' + timeLowStr)) * 10000n;

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

    if (!timestampMs || isNaN(timestampMs) || timestampMs < 0) return null;

    const date = new Date(timestampMs);
    return date.toISOString();
  }

  formatTimestamp(isoString) {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    } catch {
      return isoString;
    }
  }

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
    }

    return {
      type: fullType,
      timestamp,
    };
  }

  render() {
    const { items, clearItems, setItems } = this.props;

    return (
      <nav className={`history-container ${this.showGame ? 'game-expanded' : ''}`}>
        {!this.showGame && (
          <div className="history-header">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">History</h3>
              {items.length > 0 && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {items.length}
                </span>
              )}
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearItems}
              className="px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Clear history"
              title="Clear all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm font-medium">Clear</span>
            </button>
          )}
        </div>
        )}

        <div className={`history-content ${this.showGame ? 'game-expanded' : ''}`}>
              {this.showGame ? (
                   <SpaceRunner onClose={() => { this.showGame = false; this.forceUpdate(); }} />
                 ) : items.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <svg 
                className="w-10 h-10 mx-auto mb-2 text-gray-400 dark:text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                onClick={(e) => {
                  const now = Date.now();
                  if (this.lastEmptyIconClick && now - this.lastEmptyIconClick > 2000) {
                    this.emptyIconClickCount = 0;
                  }
                  
                  this.emptyIconClickCount++;
                  this.lastEmptyIconClick = now;
                  
                  if (this.emptyIconClickCount === 10) {
                    this.emptyIconClickCount = 0;
                    this.showGame = true;
                    this.forceUpdate();
                           toast.success('🚀 Secret unlocked!', {
                             description: 'Space Runner game activated!',
                             duration: 3000,
                           });
                  }
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-xs text-gray-500 dark:text-gray-400">No history yet</p>
            </div>
          ) : (
            <div>
              {items.slice(0, 30).map((item, idx) => {
                const inputResult = this.processItem(item.input);
                const outputResult = this.processItem(item.output);
                const itemId = item.toString();
                const outputTooltipId = `tooltip-${itemId}-output`;
                const inputTooltipId = `tooltip-${itemId}-input`;

                const outputType = typeDetector(item.output);
                const inputType = typeDetector(item.input);
                const outputTypeClass = this.getTypeClassName(outputType);
                const inputTypeClass = this.getTypeClassName(inputType);
                
                return (
                  <div 
                    key={itemId} 
                    className="history-item group"
                  >
                    <div className="absolute top-2.5 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                      {outputResult.timestamp && (
                      <button
                        onClick={(e) => this.copyTimestamp(e, outputResult.timestamp, 'Output')}
                        className="p-1.5 rounded-lg hover:scale-110 active:scale-95 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        aria-label="Copy output timestamp"
                        title={`Copy output timestamp: ${outputResult.timestamp}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      )}
                      {inputResult.timestamp && (
                        <button
                          onClick={(e) => this.copyTimestamp(e, inputResult.timestamp, 'Input')}
                          className="p-1.5 rounded-lg hover:scale-110 active:scale-95 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          aria-label="Copy input timestamp"
                          title={`Copy input timestamp: ${inputResult.timestamp}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => this.removeItem(e, item)}
                        className="p-1.5 rounded-lg hover:scale-110 active:scale-95 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        aria-label="Remove item"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-2 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="history-label">
                          Output
                        </span>
                        <span className={`history-type-badge ${outputTypeClass}`}>
                          {outputResult.type}
                        </span>
                      </div>
                      <button
                        onClick={(e) => this.copy(e, item.output)}
                        onMouseEnter={(e) => this.showTooltip(e, outputTooltipId)}
                        onMouseMove={(e) => this.updateTooltipPosition(e, outputTooltipId)}
                        onMouseLeave={() => this.hideTooltip(outputTooltipId)}
                        className="history-value-button"
                        aria-label={`Copy ${item.output}`}
                      >
                        <span className="break-all flex-1 text-left">{item.output}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {(outputResult.timestamp || item.info) && (
                            <svg className={`history-info-icon ${outputTypeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          <svg className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div 
                          ref={(el) => el && this.tooltipRefs.set(outputTooltipId, el)}
                          className="tooltip tooltip-top tooltip-dark dark:tooltip-light"
                        >
                          <div className="space-y-1.5">
                            <div>
                              <div className="font-semibold mb-0.5">Output</div>
                              <div className="text-xs opacity-90">{outputResult.type}</div>
                            </div>
                            {outputResult.timestamp && (
                              <div className="pt-1 border-t border-gray-300 dark:border-gray-600">
                                <div className="text-xs font-medium mb-0.5">Timestamp:</div>
                                <div className="text-xs opacity-90">{this.formatTimestamp(outputResult.timestamp)}</div>
                                <div className="text-[10px] font-mono opacity-75 mt-0.5">{outputResult.timestamp}</div>
                              </div>
                            )}
                            {item.info && (
                              <div className="pt-1 border-t border-gray-300 dark:border-gray-600">
                                <div className="text-xs font-medium mb-0.5">Comment:</div>
                                <div className="text-xs break-words">{item.info}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="history-label">
                          Input
                        </span>
                        <span className={`history-type-badge ${inputTypeClass}`}>
                          {inputResult.type}
                        </span>
                      </div>
                      <button
                        onClick={(e) => this.copy(e, item.input)}
                        onMouseEnter={(e) => this.showTooltip(e, inputTooltipId)}
                        onMouseMove={(e) => this.updateTooltipPosition(e, inputTooltipId)}
                        onMouseLeave={() => this.hideTooltip(inputTooltipId)}
                        className="history-value-button"
                        aria-label={`Copy ${item.input}`}
                      >
                        <span className="break-all flex-1 text-left">{item.input}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {(inputResult.timestamp || item.info) && (
                            <svg className={`history-info-icon ${inputTypeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          <svg className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div 
                          ref={(el) => el && this.tooltipRefs.set(inputTooltipId, el)}
                          className="tooltip tooltip-top tooltip-dark dark:tooltip-light"
                        >
                          <div className="space-y-1.5">
                            <div>
                              <div className="font-semibold mb-0.5">Input</div>
                              <div className="text-xs opacity-90">{inputResult.type}</div>
                            </div>
                            {inputResult.timestamp && (
                              <div className="pt-1 border-t border-gray-300 dark:border-gray-600">
                                <div className="text-xs font-medium mb-0.5">Timestamp:</div>
                                <div className="text-xs opacity-90">{this.formatTimestamp(inputResult.timestamp)}</div>
                                <div className="text-[10px] font-mono opacity-75 mt-0.5">{inputResult.timestamp}</div>
                              </div>
                            )}
                            {item.info && (
                              <div className="pt-1 border-t border-gray-300 dark:border-gray-600">
                                <div className="text-xs font-medium mb-0.5">Comment:</div>
                                <div className="text-xs break-words">{item.info}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    );
  }
}
