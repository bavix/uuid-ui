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
    this.state = {
      activeFilter: 'all',
      showTagPopup: false,
      tagPopupItem: null,
      tagSearchQuery: '',
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const { favorites } = this.props;
    const { activeFilter } = this.state;
    
    if (prevProps.favorites !== favorites || prevState.activeFilter !== activeFilter) {
      const favoriteListNames = Object.keys(favorites || {}).filter(listName => {
        const list = favorites[listName];
        return list && Array.isArray(list) && list.length > 0;
      });
      
      if (activeFilter !== 'all') {
        if (!favoriteListNames.includes(activeFilter)) {
          this.setState({ activeFilter: 'all' });
        } else {
          const currentList = favorites[activeFilter];
          if (!currentList || currentList.length === 0) {
            this.setState({ activeFilter: 'all' });
          }
        }
      }
    }
  }

  handleFilterChange = (newFilter) => {
    const { favorites } = this.props;
    
    if (newFilter === 'all') {
      this.setState({ activeFilter: 'all' });
      return;
    }
    
    const favoriteList = favorites && favorites[newFilter] ? favorites[newFilter] : [];
    if (!favoriteList || favoriteList.length === 0) {
      this.setState({ activeFilter: 'all' });
      return;
    }
    
    this.setState({ activeFilter: newFilter });
  }

  getTagColor = (text) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      'hsl(210, 70%, 55%)',  // Blue
      'hsl(280, 65%, 60%)',  // Purple
      'hsl(340, 70%, 60%)',  // Pink
      'hsl(20, 80%, 58%)',   // Orange
      'hsl(160, 65%, 52%)',  // Teal
      'hsl(220, 70%, 58%)',  // Light Blue
      'hsl(300, 60%, 60%)',  // Magenta
      'hsl(45, 85%, 58%)',   // Yellow/Gold
      'hsl(140, 60%, 52%)',  // Green
      'hsl(0, 70%, 58%)',    // Red
      'hsl(260, 65%, 60%)',  // Indigo
      'hsl(180, 70%, 52%)',  // Cyan
      'hsl(30, 75%, 58%)',   // Amber
      'hsl(270, 65%, 60%)',  // Violet
      'hsl(190, 70%, 55%)',  // Sky Blue
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

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
    
    const isInFavorites = this.isItemInFavorites(itemToRemove);
    if (isInFavorites) {
      const lists = this.getItemFavoriteLists(itemToRemove);
      if (lists.length > 0) {
        lists.forEach(listName => {
          this.props.removeFromFavorites(itemToRemove, listName);
        });
      }
    }
    
    toast.success('Removed');
  };

  getItemFavoriteInfo = (item) => {
    const { favorites } = this.props;
    const itemKey = `${item.input}:${item.output}`;
    const lists = [];
    
    for (const listName of Object.keys(favorites || {})) {
      const listItems = favorites[listName] || [];
      if (listItems.some(favItem => 
        `${favItem.input}:${favItem.output}` === itemKey
      )) {
        lists.push(listName);
      }
    }
    return { isInFavorites: lists.length > 0, lists };
  };

  isItemInFavorites = (item) => {
    return this.getItemFavoriteInfo(item).isInFavorites;
  };

  getItemFavoriteLists = (item) => {
    return this.getItemFavoriteInfo(item).lists;
  };

  handleFavoriteToggle = (e, item) => {
    e.stopPropagation();
    const isInFavorites = this.isItemInFavorites(item);
    
    if (isInFavorites) {
      const lists = this.getItemFavoriteLists(item);
      if (lists.length > 0) {
        lists.forEach(listName => {
          this.props.removeFromFavorites(item, listName);
        });
        toast.success('Removed from favorites', { 
          description: lists.length > 1 ? `Removed from ${lists.length} lists` : `Removed from "${lists[0]}"`
        });
      }
    } else {
      this.setState({
        showTagPopup: true,
        tagPopupItem: item,
        tagSearchQuery: '',
      });
    }
  };

  handleTagSelect = (listName) => {
    const { tagPopupItem } = this.state;
    const { favorites, addToFavorites, createFavoriteList } = this.props;
    
    if (!tagPopupItem || !listName) {
      return;
    }
    
    const itemKey = `${tagPopupItem.input}:${tagPopupItem.output}`;
    const existingList = favorites[listName];
    const alreadyInList = existingList && existingList.some(item => 
      `${item.input}:${item.output}` === itemKey
    );
    
    if (alreadyInList) {
      toast.info('Already in favorites', { description: `Item is already in "${listName}"` });
      this.setState({
        showTagPopup: false,
        tagPopupItem: null,
        tagSearchQuery: '',
      });
      return;
    }
    
    if (!favorites[listName]) {
      createFavoriteList(listName);
    }
    addToFavorites(tagPopupItem, listName);
    toast.success('Added to favorites', { description: `List: ${listName}` });
    
    this.setState({
      showTagPopup: false,
      tagPopupItem: null,
      tagSearchQuery: '',
    });
  };

  handleCreateNewTag = () => {
    const { tagPopupItem, tagSearchQuery } = this.state;
    const { createFavoriteList, addToFavorites } = this.props;
    
    if (tagPopupItem && tagSearchQuery.trim()) {
      const newTagName = tagSearchQuery.trim();
      createFavoriteList(newTagName);
      addToFavorites(tagPopupItem, newTagName);
      toast.success('Added to favorites', { description: `List: ${newTagName}` });
    }
    
    this.setState({
      showTagPopup: false,
      tagPopupItem: null,
      tagSearchQuery: '',
    });
  };

  closeTagPopup = () => {
    this.setState({
      showTagPopup: false,
      tagPopupItem: null,
      tagSearchQuery: '',
    });
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

  getFilteredItems = () => {
    const { items, favorites } = this.props;
    const { activeFilter } = this.state;
    
    if (!items || !Array.isArray(items)) {
      return [];
    }
    
    if (activeFilter === 'all') {
      return [...items];
    }
    
    const favoriteList = favorites && favorites[activeFilter] ? favorites[activeFilter] : [];
    
    if (favoriteList.length === 0) {
      return [];
    }
    
    const favoriteItemKeys = new Set(
      favoriteList
        .filter(item => item && item.input && item.output)
        .map(item => `${item.input}:${item.output}`)
    );
    
    if (favoriteItemKeys.size === 0) {
      return [];
    }
    
    const itemsMap = new Map();
    items.forEach((item, index) => {
      if (item && item.input && item.output) {
        const itemKey = `${item.input}:${item.output}`;
        if (favoriteItemKeys.has(itemKey)) {
          itemsMap.set(itemKey, { item, index });
        }
      }
    });
    
    const filtered = items
      .filter(item => {
        if (!item || !item.input || !item.output) {
          return false;
        }
        const itemKey = `${item.input}:${item.output}`;
        return favoriteItemKeys.has(itemKey);
      })
      .reverse();
    
    return filtered;
  };

  render() {
    const { items, clearItems, favorites } = this.props;
    const { activeFilter } = this.state;
    const favoriteListNames = Object.keys(favorites || {}).filter(listName => {
      const list = favorites[listName];
      return list && Array.isArray(list) && list.length > 0;
    }).sort();
    const filteredItems = this.getFilteredItems();

    return (
      <nav className={`history-container ${this.showGame ? 'game-expanded' : ''}`}>
        {!this.showGame && (
          <>
          <div className="history-header">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold history-header-title">History</h3>
              {filteredItems.length > 0 && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full history-count-badge">
                  {filteredItems.length}
                </span>
              )}
            </div>
          </div>
          {filteredItems.length > 0 && (
            <button
              onClick={clearItems}
              className="px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Clear history"
              title={activeFilter === 'all' ? "Clear history (favorites will remain)" : "Clear filtered items"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm font-medium">Clear</span>
            </button>
          )}
        </div>
        {favoriteListNames.length > 0 && (
          <div className="px-4 py-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => this.handleFilterChange('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white dark:bg-blue-500 shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              {favoriteListNames.map((listName) => {
                const listItems = favorites[listName] || [];
                const tagColor = this.getTagColor(listName);
                const currentActiveFilter = this.state.activeFilter;
                const isActive = currentActiveFilter === listName;
                const isDarkTheme = this.props.isToggled;
                
                return (
                  <button
                    key={`filter-${listName}-${currentActiveFilter}`}
                    onClick={() => {
                      const newFilter = isActive ? 'all' : listName;
                      this.handleFilterChange(newFilter);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 favorite-filter-tag ${
                      isActive ? 'favorite-filter-tag-active shadow-md' : 'hover:shadow-sm hover:opacity-90'
                    }`}
                    style={{
                      backgroundColor: isActive ? tagColor : `${tagColor}15`,
                      color: isActive ? '#ffffff' : tagColor,
                      ...(isActive ? {
                        border: `1.5px solid ${tagColor}`,
                      } : {
                        '--tag-border-color': tagColor,
                      }),
                    }}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span>{listName}</span>
                    <span 
                      className={`inline-flex items-center justify-center text-[10px] font-bold rounded-full ${
                        isActive ? 'min-w-[20px] h-5 px-1.5' : 'w-5 h-5'
                      }`}
                      style={isActive ? {
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        color: '#ffffff',
                        border: 'none',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                      } : {
                        backgroundColor: `${tagColor}30`,
                        color: tagColor,
                        border: `1.5px dashed ${tagColor}`,
                        boxShadow: `0 1px 3px ${tagColor}40`,
                      }}
                    >
                      {listItems.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        </>
        )}

        <div className={`history-content ${this.showGame ? 'game-expanded' : ''}`}>
              {this.showGame ? (
                   <SpaceRunner onClose={() => { this.showGame = false; this.forceUpdate(); }} />
                 ) : filteredItems.length === 0 ? (
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activeFilter === 'all' ? 'No history yet' : `No items in "${activeFilter}"`}
              </p>
            </div>
          ) : (
            <div>
              {filteredItems.slice(0, 30).map((item, idx) => {
                const inputResult = this.processItem(item.input);
                const outputResult = this.processItem(item.output);
                const itemId = item.toString();
                const outputTooltipId = `tooltip-${itemId}-output`;
                const inputTooltipId = `tooltip-${itemId}-input`;

                const outputType = typeDetector(item.output);
                const inputType = typeDetector(item.input);
                const outputTypeClass = this.getTypeClassName(outputType);
                const inputTypeClass = this.getTypeClassName(inputType);
                
                const favoriteInfo = this.getItemFavoriteInfo(item);
                const isInFavorites = favoriteInfo.isInFavorites;
                const favoriteLists = favoriteInfo.lists;

                return (
                  <div 
                    key={itemId} 
                    className="history-item group"
                  >
                    <div className={`absolute top-2.5 right-2 flex items-center gap-1 transition-all z-10 ${
                      isInFavorites ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <button
                        onClick={(e) => this.handleFavoriteToggle(e, item)}
                        className={`p-1.5 rounded-lg hover:scale-110 active:scale-95 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 ${
                          isInFavorites 
                            ? 'text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400' 
                            : 'text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400'
                        }`}
                        aria-label={isInFavorites ? "Remove from favorites" : "Add to favorites"}
                        title={isInFavorites ? "Remove from favorites" : "Add to favorites"}
                      >
                        <svg className="w-3 h-3" fill={isInFavorites ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
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
                          <div className="min-w-[180px] max-w-[260px] text-left">
                            <div className={`${(outputResult.timestamp || item.info || (favoriteLists && favoriteLists.length > 0)) ? 'pb-1.5 mb-1.5 border-b border-gray-300 dark:border-gray-600' : ''}`}>
                              <div className="text-[10px] font-semibold text-left flex items-center gap-1.5">
                                <span className="text-gray-800 dark:text-gray-400">Output:</span>
                                {outputResult.type.startsWith('UUID v') ? (
                                  <>
                                    <span className="text-gray-900 dark:text-gray-100 font-bold" style={{ color: 'rgb(17, 24, 39)' }}>UUID</span>
                                    <span 
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold"
                                      style={{
                                        backgroundColor: 'rgb(34, 197, 94)',
                                        color: '#ffffff'
                                      }}
                                    >
                                      {outputResult.type.replace('UUID ', '')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-gray-900 dark:text-gray-100 font-bold" style={{ color: 'rgb(17, 24, 39)' }}>{outputResult.type}</span>
                                )}
                              </div>
                            </div>
                            {((outputResult.timestamp || item.info || (favoriteLists && favoriteLists.length > 0))) && (
                            <div className="space-y-1.5 pt-1.5">
                              {outputResult.timestamp && (
                                <div>
                                  <div className="text-[10px] font-medium mb-0.5">
                                    <span className="text-gray-800 dark:text-gray-400 font-semibold">Timestamp:</span> <span className="font-bold" style={{ color: 'rgb(17, 24, 39)' }}>{this.formatTimestamp(outputResult.timestamp)}</span>
                                  </div>
                                  <div className="text-[9px] font-mono text-gray-500 dark:text-gray-400 break-all pl-1" style={{ color: 'rgb(107, 114, 128)' }}>{outputResult.timestamp}</div>
                                </div>
                              )}
                              {item.info && (
                                <div>
                                  <div className="text-[10px] break-words font-medium leading-snug">
                                    <span className="text-gray-800 dark:text-gray-400 font-semibold">Comment:</span> <span className="font-bold" style={{ color: 'rgb(17, 24, 39)' }}>{item.info}</span>
                                  </div>
                                </div>
                              )}
                              {favoriteLists && favoriteLists.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-medium">
                                    <span className="text-gray-800 dark:text-gray-400 font-semibold">Tag:</span>{' '}
                                    {favoriteLists.map((listName, idx) => {
                                      const tagColor = this.getTagColor(listName);
                                      return (
                                        <span 
                                          key={idx} 
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ml-1"
                                          style={{ 
                                            backgroundColor: tagColor,
                                            color: '#ffffff'
                                          }}
                                        >
                                          <div 
                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: '#ffffff', opacity: 0.9 }}
                                          />
                                          <span>{listName}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
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
                          <div className="min-w-[180px] max-w-[260px] text-left">
                            <div className={`${(inputResult.timestamp || item.info || (favoriteLists && favoriteLists.length > 0)) ? 'pb-1.5 mb-1.5 border-b border-gray-300 dark:border-gray-600' : ''}`}>
                              <div className="text-[10px] font-semibold text-left flex items-center gap-1.5">
                                <span className="text-gray-800 dark:text-gray-400">Input:</span>
                                {inputResult.type.startsWith('UUID v') ? (
                                  <>
                                    <span className="text-gray-900 dark:text-gray-100 font-bold" style={{ color: 'rgb(17, 24, 39)' }}>UUID</span>
                                    <span 
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold"
                                      style={{
                                        backgroundColor: 'rgb(34, 197, 94)',
                                        color: '#ffffff'
                                      }}
                                    >
                                      {inputResult.type.replace('UUID ', '')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-gray-900 dark:text-gray-100 font-bold" style={{ color: 'rgb(17, 24, 39)' }}>{inputResult.type}</span>
                                )}
                              </div>
                            </div>
                            {((inputResult.timestamp || item.info || (favoriteLists && favoriteLists.length > 0))) && (
                            <div className="space-y-1.5 pt-1.5">
                              {inputResult.timestamp && (
                                <div>
                                  <div className="text-[10px] font-medium mb-0.5">
                                    <span className="text-gray-800 dark:text-gray-400 font-semibold">Timestamp:</span> <span className="font-bold" style={{ color: 'rgb(17, 24, 39)' }}>{this.formatTimestamp(inputResult.timestamp)}</span>
                                  </div>
                                  <div className="text-[9px] font-mono text-gray-500 dark:text-gray-400 break-all pl-1" style={{ color: 'rgb(107, 114, 128)' }}>{inputResult.timestamp}</div>
                                </div>
                              )}
                              {item.info && (
                                <div>
                                  <div className="text-[10px] break-words font-medium leading-snug">
                                    <span className="text-gray-800 dark:text-gray-400 font-semibold">Comment:</span> <span className="font-bold" style={{ color: 'rgb(17, 24, 39)' }}>{item.info}</span>
                                  </div>
                                </div>
                              )}
                              {favoriteLists && favoriteLists.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-medium">
                                    <span className="text-gray-800 dark:text-gray-400 font-semibold">Tag:</span>{' '}
                                    {favoriteLists.map((listName, idx) => {
                                      const tagColor = this.getTagColor(listName);
                                      return (
                                        <span 
                                          key={idx} 
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ml-1"
                                          style={{ 
                                            backgroundColor: tagColor,
                                            color: '#ffffff'
                                          }}
                                        >
                                          <div 
                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: '#ffffff', opacity: 0.9 }}
                                          />
                                          <span>{listName}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
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
        {this.state.showTagPopup && (
          <div 
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={this.closeTagPopup}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add to favorites</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Select a tag or create a new one</p>
                    </div>
                  </div>
                  <button
                    onClick={this.closeTagPopup}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-hidden flex flex-col">
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={this.state.tagSearchQuery}
                    onChange={(e) => this.setState({ tagSearchQuery: e.target.value })}
                    placeholder="Search tags or type to create..."
                    className="w-full pl-10 pr-4 py-3 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && this.state.tagSearchQuery.trim()) {
                        const { favorites } = this.props;
                        const query = this.state.tagSearchQuery.trim();
                        if (favorites[query]) {
                          this.handleTagSelect(query);
                        } else {
                          this.handleCreateNewTag();
                        }
                      } else if (e.key === 'Escape') {
                        this.closeTagPopup();
                      }
                    }}
                  />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {(() => {
                    const { favorites } = this.props;
                    const { tagSearchQuery } = this.state;
                    const listNames = Object.keys(favorites || {}).filter(name => {
                      const list = favorites[name];
                      return list && Array.isArray(list) && list.length > 0;
                    });
                    const filtered = listNames.filter(name => 
                      name.toLowerCase().includes(tagSearchQuery.toLowerCase())
                    );
                    
                    const showCreate = tagSearchQuery.trim() && !favorites[tagSearchQuery.trim()];
                    
                    if (listNames.length === 0 && !tagSearchQuery.trim()) {
                      return (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No tags yet</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Type a name above to create your first tag</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-2">
                        {showCreate && (
                          <button
                            onClick={this.handleCreateNewTag}
                            className="w-full px-4 py-3 text-left rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/70 transition-colors">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">Create new tag</div>
                                <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">"{tagSearchQuery.trim()}"</div>
                              </div>
                            </div>
                          </button>
                        )}
                        {filtered.length === 0 && !showCreate && tagSearchQuery.trim() && (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No tags found</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Press Enter to create "{tagSearchQuery.trim()}"</p>
                          </div>
                        )}
                        {filtered.length > 0 && (
                          <div className="space-y-1">
                            {filtered.map((listName) => {
                              const listItems = favorites[listName] || [];
                              const tagColor = this.getTagColor(listName);
                              const { tagPopupItem } = this.state;
                              const isItemInThisList = tagPopupItem && listItems.some(item => 
                                `${item.input}:${item.output}` === `${tagPopupItem.input}:${tagPopupItem.output}`
                              );
                              
                              return (
                                <button
                                  key={listName}
                                  onClick={() => this.handleTagSelect(listName)}
                                  className={`w-full px-4 py-3 text-left rounded-xl border transition-all group ${
                                    isItemInThisList
                                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                                        style={{ backgroundColor: tagColor }}
                                      />
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{listName}</div>
                                          {isItemInThisList && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                                              Added
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                          {listItems.length} {listItems.length === 1 ? 'item' : 'items'}
                                        </div>
                                      </div>
                                    </div>
                                    {isItemInThisList ? (
                                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    );
  }
}
