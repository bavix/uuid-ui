import React, { Suspense, lazy } from 'preact/compat';
import { toast } from 'sonner';
import { version as uuidVersion } from 'uuid';
import {
  TYPE_ULID,
  TYPE_BASE64,
  TYPE_HEX,
  TYPE_HIGH_LOW,
  TYPE_UUID,
  TYPE_BYTES,
  TYPE_WORDS,
  typeDetector,
} from './type-detector';
import { timestampFromUlid, timestampFromUuid } from './uuid-timestamp.js';
import { copyText } from './clipboard.js';
import { specialValues } from './special-values.js';
import { detectIntType, toUuid } from './to-uuid.js';
import { SIGNED } from './int-type.js';
import { INT_TYPE_NAMES } from './int-type.js';
// The easter egg is ~40% of the source and almost nobody opens it, so it is a
// separate chunk fetched on demand instead of a tax on every first paint.
const SpaceRunner = lazy(() => import('./space-runner.jsx'));
import { HISTORY_LIMIT, PAGE_SIZE } from './limits.js';
import { isTypingTarget } from './key-sequence.js';
import { searchItems } from './search.js';
import { trackEgg } from './analytics.js';

const TYPE_LABELS = {
  [TYPE_ULID]: 'ULID',
  [TYPE_BASE64]: 'Base64',
  [TYPE_HIGH_LOW]: 'HighLow',
  [TYPE_UUID]: 'UUID',
  [TYPE_BYTES]: 'Bytes',
  [TYPE_HEX]: 'Hex',
  [TYPE_WORDS]: 'Words',
};

const TYPE_CLASS_NAMES = {
  [TYPE_ULID]: 'type-ulid',
  [TYPE_UUID]: 'type-uuid',
  [TYPE_BASE64]: 'type-base64',
  [TYPE_HIGH_LOW]: 'type-highlow',
  [TYPE_BYTES]: 'type-bytes',
  [TYPE_HEX]: 'type-uuid',
  [TYPE_WORDS]: 'type-words',
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
      query: '',
      showTagPopup: false,
      tagPopupItem: null,
      tagSearchQuery: '',
      visibleCount: PAGE_SIZE,
    };
  }

  showMore = () => {
    this.setState(({ visibleCount }) => ({ visibleCount: visibleCount + PAGE_SIZE }));
  }

  componentDidUpdate(prevProps, prevState) {
    const { favorites } = this.props;
    const { activeFilter } = this.state;
    
    if (prevProps.favorites !== favorites || prevState.activeFilter !== activeFilter) {
      const favoriteListNames = Object.keys(favorites || {});
      
      if (activeFilter !== 'all' && !favoriteListNames.includes(activeFilter)) {
        this.setState({ activeFilter: 'all' });
      }
    }
  }

  handleFilterChange = (newFilter) => {
    const { favorites } = this.props;
    
    if (newFilter === 'all') {
      this.setState({ activeFilter: 'all', visibleCount: PAGE_SIZE });
      return;
    }

    if (!favorites || !(newFilter in favorites)) {
      this.setState({ activeFilter: 'all', visibleCount: PAGE_SIZE });
      return;
    }

    this.setState({ activeFilter: newFilter, visibleCount: PAGE_SIZE });
  }

  // One hue per tag, expressed three ways: a solid pill (white text), a tint,
  // and a readable label colour that flips with the theme.
  tagHue = (text) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hues = [210, 280, 340, 20, 160, 220, 300, 45, 140, 0, 260, 180, 30, 270, 190];
    return hues[Math.abs(hash) % hues.length];
  };

  getTagColor = (text) => `hsl(${this.tagHue(text)}, 65%, 38%)`;

  getTagTextColor = (text) => this.props.isToggled
    ? `hsl(${this.tagHue(text)}, 70%, 76%)`
    : `hsl(${this.tagHue(text)}, 68%, 30%)`;

  componentDidMount() {
    this.handleKeyDown = (e) => {
      if (this.showGame) return;

      if (isTypingTarget(document.activeElement)) return;
      
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
          trackEgg('space-runner', 'typed');
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
    window.addEventListener('keydown', this.handleSearchShortcut);
  }

  componentWillUnmount() {
    if (this.handleKeyDown) {
      window.removeEventListener('keydown', this.handleKeyDown);
    }
    window.removeEventListener('keydown', this.handleSearchShortcut);
    if (this.gameKeyTimeout) {
      clearTimeout(this.gameKeyTimeout);
    }
  }

  // Preact passes null on unmount; without the delete branch the map grew
  // one dead entry per removed row for the lifetime of the page.
  setTooltipRef = (tooltipId, element) => {
    if (element) {
      this.tooltipRefs.set(tooltipId, element);
    } else {
      this.tooltipRefs.delete(tooltipId);
    }
  };

  updateTooltipPosition = (e, tooltipId, placement = 'top') => {
    const tooltip = this.tooltipRefs.get(tooltipId);
    if (!tooltip) return;

    const rect = e.currentTarget.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;

    // The source row sits directly under the result; anchoring its tooltip
    // upwards hid the very value the user came to read.
    if (placement === 'bottom') {
      tooltip.style.top = `${rect.bottom + 8}px`;
      tooltip.style.transform = 'translate(-50%, 0)';
    } else {
      tooltip.style.top = `${rect.top - 8}px`;
      tooltip.style.transform = 'translate(-50%, -100%)';
    }

    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';
  };

  showTooltip = (e, tooltipId, placement = 'top') => {
    this.updateTooltipPosition(e, tooltipId, placement);
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

    copyText(text.trim())
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

  // Preact mounts the element, the browser opens it: showModal is what makes
  // it modal, and it must run once the node exists.
  openTagDialog = (node) => {
    this.tagDialog = node;

    if (node && !node.open) {
      node.showModal();
    }
  }

  // The lab chunk builds the game straight into this node. Preact never renders
  // children here, so the imperative DOM inside it survives re-renders.
  mountPanelGame = (node) => {
    this.gameMount = node;

    if (!node || !this.props.panelGame) {
      return;
    }

    const wanted = this.props.panelGame;
    this.mountedGame = wanted;

    import('./lab.js').then(lab => {
      // the panel may have changed its mind while the chunk was loading
      if (this.gameMount !== node || this.props.panelGame !== wanted) {
        return;
      }

      lab[wanted]({ mount: node, onDismiss: this.props.closePanelGame });
    });
  }

  // The bit view is part of the lazy lab chunk: it costs nothing until asked for.
  showBits = (e, uuid) => {
    e.stopPropagation();
    // The version, never the identifier: what it is, not what it says.
    trackEgg('bit-inspector', `v${parseInt(uuid[14], 16)}`);
    import('./lab.js').then(lab => lab.inspectBits(uuid));
  }

  copyTimestamp = (e, timestamp, label) => {
    e.stopPropagation();
    
    if (!timestamp) return;

    copyText(timestamp)
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

  // Removes from whatever collection the current view shows: history under
  // "All", that tag under a tag filter. The star button is what manages
  // favorites, so this no longer unstars an item behind the user's back.
  removeItem = (e, itemToRemove) => {
    e.stopPropagation();
    const { activeFilter } = this.state;

    if (activeFilter !== 'all') {
      this.props.removeFromFavorites(itemToRemove, activeFilter);
      toast.success('Removed from favorites', {
        description: `List: ${activeFilter}`,
        action: {
          label: 'Undo',
          onClick: () => this.props.addToFavorites(itemToRemove, activeFilter),
        },
      });
      return;
    }

    const { items } = this.props;
    const previousItems = [...items];
    this.props.setItems(
      items.filter(item => item.toString() !== itemToRemove.toString())
    );

    toast.success('Removed from history', {
      action: {
        label: 'Undo',
        onClick: () => this.props.setItems(previousItems),
      },
    });
  };

  clearHistory = () => {
    const previousItems = [...this.props.items];
    if (previousItems.length === 0) {
      return;
    }

    this.props.clearItems();
    toast.success(`Cleared ${previousItems.length} item${previousItems.length === 1 ? '' : 's'}`, {
      description: 'Favorites are kept.',
      duration: 8000,
      action: {
        label: 'Undo',
        onClick: () => this.props.setItems(previousItems),
      },
    });
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

  // Always opens the tag manager. It used to strip the item from every tag it
  // belonged to in one click, which is both destructive and the only reason the
  // multi-tag support in the data model was unreachable from the interface.
  handleFavoriteToggle = (e, item) => {
    e.stopPropagation();

    this.setState({
      showTagPopup: true,
      tagPopupItem: item,
      tagSearchQuery: '',
    });
  };

  // Inside the manager a tag row is a switch: on adds, off removes.
  toggleTagMembership = (listName) => {
    const { tagPopupItem } = this.state;
    if (!tagPopupItem) {
      return;
    }

    const itemKey = `${tagPopupItem.input}:${tagPopupItem.output}`;
    const list = this.props.favorites[listName] || [];
    const isMember = list.some(item => `${item.input}:${item.output}` === itemKey);

    if (isMember) {
      this.props.removeFromFavorites(tagPopupItem, listName);
      toast.success(`Removed from "${listName}"`);
      return;
    }

    this.props.addToFavorites(tagPopupItem, listName);
    toast.success(`Added to "${listName}"`);
  };

  deleteTag = (e, listName) => {
    e.stopPropagation();

    const items = this.props.favorites[listName] || [];
    this.props.deleteFavoriteList(listName);

    toast.success(`Tag "${listName}" deleted`, {
      description: items.length > 0 ? `${items.length} item${items.length === 1 ? '' : 's'} were in it` : undefined,
      action: {
        label: 'Undo',
        onClick: () => this.props.restoreFavoriteList(listName, items),
      },
    });
  };

  handleTagSelect = (listName) => {
    if (!this.state.tagPopupItem || !listName) {
      return;
    }

    this.toggleTagMembership(listName);
  };

  handleCreateNewTag = () => {
    const { tagPopupItem, tagSearchQuery } = this.state;
    const { createFavoriteList, addToFavorites } = this.props;
    
    if (tagPopupItem && tagSearchQuery.trim()) {
      const newTagName = tagSearchQuery.trim();
      createFavoriteList(newTagName);
      addToFavorites(tagPopupItem, newTagName);
      toast.success(`Added to "${newTagName}"`);
    }

    this.setState({ tagSearchQuery: '' });
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

  // Same rule as processItem, for the colour of the row.
  getTypeKind(value) {
    if (typeof value === 'string' && /^[0-9a-f]{32}$/i.test(value.trim())) {
      return TYPE_HEX;
    }

    return typeDetector(value);
  }

  getTypeClassName(kind) {
    return TYPE_CLASS_NAMES[kind] || '';
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
    // The two identifiers the standard singles out deserve their own name.
    // What is special about a value never replaces what the value *is*: the
    // type badge stays, the findings ride next to it. A value can be several
    // things at once — the nil UUID is also a palindrome.
    const NAMED_KINDS = ['nil', 'max', 'palindrome', 'non-rfc', 'time traveler'];
    const markers = specialValues(value).map(label => ({
      label: label.toUpperCase(),
      kind: NAMED_KINDS.includes(label) ? label.replace(' ', '-') : 'word',
    }));

    // A bare 32-hex string detects as a UUID, which is true but useless as a
    // label next to a "-> HEX" target: it is the dashless spelling.
    if (typeof value === 'string' && /^[0-9a-f]{32}$/i.test(value.trim())) {
      return { type: TYPE_LABELS[TYPE_HEX], timestamp: timestampFromUuid(value), markers };
    }

    const kind = typeDetector(value);
    const fullType = this.getTypeLabel(kind);
    let timestamp = null;

    try {
      if (kind === TYPE_UUID) {
        const version = uuidVersion(value);

        // RFC 9562 gives Nil (5.9) and Max (5.10) no version at all: their
        // nibbles read as 0 and 15, and calling the all-ones value "v15" is
        // reporting a field that the standard says is not there.
        const named = version >= 1 && version <= 8 ? `UUID v${version}` : 'UUID';

        return {
          type: named,
          timestamp: timestampFromUuid(value),
          markers,
        };
      } else if (kind === TYPE_ULID) {
        timestamp = timestampFromUlid(value);
      }
    } catch (err) {
    }

    return {
      type: fullType,
      timestamp,
      markers,
    };
  }

  getFilteredItems = () => {
    const { items, favorites } = this.props;
    const { activeFilter, query } = this.state;

    if (!items || !Array.isArray(items)) {
      return [];
    }

    let rows;

    if (activeFilter === 'all') {
      rows = [...items];
    } else {
      // Read the tag's own items rather than intersecting with history: a
      // favorite stays visible after its history entry is gone.
      const favoriteList = favorites && favorites[activeFilter] ? favorites[activeFilter] : [];

      rows = favoriteList
        .filter(item => item && item.input && item.output)
        .reverse();
    }

    return searchItems(rows, query);
  };

  handleQueryChange = (query) => {
    this.setState({ query, visibleCount: PAGE_SIZE });
  };

  // "/" is the search key everywhere else; it should be here too.
  handleSearchShortcut = (e) => {
    if (e.key !== '/' || isTypingTarget(e.target) || !this.searchInput) {
      return;
    }

    e.preventDefault();
    this.searchInput.focus();
    this.searchInput.select();
  };

  render() {
    const { items, favorites, panelGame } = this.props;
    const { activeFilter } = this.state;
    // Space Runner or one of the lab games; either way the panel is theirs.
    const expanded = this.showGame || !!panelGame;
    const favoriteListNames = Object.keys(favorites || {}).sort();
    const filteredItems = this.getFilteredItems();

    return (
      <section aria-label="Conversion results" className={`history-container ${expanded ? 'game-expanded' : ''}`}>
        {!expanded && (
          <>
          <div className="history-header">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h2 className="text-base font-bold history-header-title">History</h2>
              {filteredItems.length > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full history-count-badge"
                  title={items.length > HISTORY_LIMIT
                    ? `${items.length} conversions in this session; the newest ${HISTORY_LIMIT} are kept after a reload`
                    : undefined}
                >
                  {filteredItems.length}
                </span>
              )}
              <span className={`history-target ${this.getTypeClassName(this.props.resultType)}`} title="New conversions use this format">
                → {this.getTypeLabel(this.props.resultType)}
                {this.props.resultType === TYPE_HIGH_LOW && this.props.intTypeName ? ` · ${this.props.intTypeName}` : ''}
              </span>
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={this.clearHistory}
              className="px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Clear history"
              title="Clear history (favorites are kept)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm font-medium">Clear</span>
            </button>
          )}
        </div>
        {items.length > 0 && (
          <div className="px-4 pt-2">
            <div className="history-search">
              <svg className="history-search-icon" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.2 10.2L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                ref={(node) => { this.searchInput = node; }}
                type="search"
                value={this.state.query}
                onInput={(e) => this.handleQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && this.state.query !== '') {
                    e.stopPropagation();
                    this.handleQueryChange('');
                  }
                }}
                placeholder="Search these results"
                aria-label="Search the results"
              />
              {this.state.query !== '' && (
                <button
                  type="button"
                  className="history-search-clear"
                  onClick={() => { this.handleQueryChange(''); this.searchInput?.focus(); }}
                  aria-label="Clear the search"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
        {favoriteListNames.length > 0 && (
          <div className="px-4 py-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => this.handleFilterChange('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  activeFilter === 'all'
                    ? 'bg-blue-700 text-white dark:bg-blue-600 shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              {favoriteListNames.map((listName) => {
                const listItems = favorites[listName] || [];
                const tagColor = this.getTagColor(listName);
                const tagTextColor = this.getTagTextColor(listName);
                const currentActiveFilter = this.state.activeFilter;
                const isActive = currentActiveFilter === listName;

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
                      backgroundColor: isActive ? tagColor : 'transparent',
                      color: isActive ? '#ffffff' : tagTextColor,
                      ...(isActive ? {
                        border: `1.5px solid ${tagColor}`,
                      } : {
                        '--tag-border-color': tagTextColor,
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
                        backgroundColor: 'transparent',
                        color: tagTextColor,
                        border: `1px solid ${tagTextColor}`,
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

        <p className="sr-only" aria-live="polite">
          {filteredItems.length > 0
            ? `${filteredItems.length} result${filteredItems.length === 1 ? '' : 's'}, converted to ${this.getTypeLabel(this.props.resultType)}`
            : this.state.query.trim() !== ''
              ? `Nothing matches ${this.state.query.trim()}`
              : 'No results yet'}
        </p>

        <div className={`history-content ${expanded ? 'game-expanded' : ''}`}>
              {panelGame ? (
                   <div className="panel-game" key={panelGame} ref={this.mountPanelGame} />
                 ) : this.showGame ? (
                   <Suspense fallback={<div className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</div>}>
                     <SpaceRunner onClose={() => { this.showGame = false; this.forceUpdate(); }} />
                   </Suspense>
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
                    trackEgg('space-runner', 'clicked');
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
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {this.state.query.trim() !== ''
                  ? `Nothing matches "${this.state.query.trim()}"`
                  : activeFilter === 'all'
                    ? 'Nothing converted yet'
                    : `Nothing tagged "${activeFilter}"`}
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                {this.state.query.trim() !== ''
                  ? 'The search covers both sides of a row and its comment.'
                  : activeFilter === 'all'
                    ? 'Paste identifiers into the box on the left.'
                    : 'Star a result to add it to this tag.'}
              </p>
            </div>
          ) : (
            <div>
              {filteredItems.slice(0, this.state.visibleCount).map((item, idx) => {
                const inputResult = this.processItem(item.input);
                const outputResult = this.processItem(item.output);
                const itemId = item.toString();
                const outputTooltipId = `tooltip-${itemId}-output`;
                const inputTooltipId = `tooltip-${itemId}-input`;

                            const outputType = this.getTypeKind(item.output);
                const inputType = this.getTypeKind(item.input);
                const outputTypeClass = this.getTypeClassName(outputType);
                const inputTypeClass = this.getTypeClassName(inputType);
                
                // Derived, not stored: run both sides through both readings and
                // keep the one where they agree. Works for rows saved long before
                // this existed, and cannot fall out of sync with the converter.
                const rowIntType = detectIntType(item.input, item.output);
                const intTypeName = INT_TYPE_NAMES[rowIntType];
                // Either side may be the readable identifier; whichever parses
                // is the one whose bits are worth showing.
                const inspectable = toUuid(item.input, rowIntType ?? SIGNED)
                    ?? toUuid(item.output, rowIntType ?? SIGNED);

                const favoriteInfo = this.getItemFavoriteInfo(item);
                const isInFavorites = favoriteInfo.isInFavorites;
                const favoriteLists = favoriteInfo.lists;

                return (
                  <div 
                    key={itemId} 
                    className="history-item group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="history-label">
                          Output
                        </span>
                        <span className={`history-type-badge ${outputTypeClass}`}>
                          {outputResult.type}
                        </span>
                        {intTypeName && (outputType === TYPE_HIGH_LOW || outputType === TYPE_WORDS) && (
                          <span className="history-marker-badge marker-int" title="Integer type this pair was written with">
                            {intTypeName}
                          </span>
                        )}
                        {(outputResult.markers || []).map(marker => (
                          <span key={marker.label} className={`history-marker-badge marker-${marker.kind}`}>
                            {marker.label}
                          </span>
                        ))}
                        <div className={`ml-auto flex items-center gap-0.5 transition-opacity ${
                          isInFavorites ? 'opacity-100' : 'opacity-60 group-hover:opacity-100 focus-within:opacity-100'
                        }`}>

                      {inspectable && (
                        <button
                          onClick={(e) => this.showBits(e, inspectable)}
                          className="p-2 rounded-lg active:scale-95 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-300"
                          aria-label="Show the bits of this identifier"
                          title="Show the bits of this identifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v4H4zM10 6h4v4h-4zM16 6h4v4h-4zM4 14h4v4H4zM10 14h4v4h-4zM16 14h4v4h-4z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => this.handleFavoriteToggle(e, item)}
                        className={`p-2 rounded-lg active:scale-95 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${
                          isInFavorites 
                            ? 'text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400' 
                            : 'text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400'
                        }`}
                        aria-label={isInFavorites ? "Remove from favorites" : "Add to favorites"}
                        title={isInFavorites ? "Remove from favorites" : "Add to favorites"}
                      >
                        <svg className="w-4 h-4" fill={isInFavorites ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      {outputResult.timestamp && (
                      <button
                        onClick={(e) => this.copyTimestamp(e, outputResult.timestamp, 'Output')}
                        className="p-2 rounded-lg active:scale-95 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-300"
                        aria-label="Copy output timestamp"
                        title={`Copy output timestamp: ${outputResult.timestamp}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      )}
                      {inputResult.timestamp && (
                        <button
                          onClick={(e) => this.copyTimestamp(e, inputResult.timestamp, 'Input')}
                          className="p-2 rounded-lg active:scale-95 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-300"
                          aria-label="Copy input timestamp"
                          title={`Copy input timestamp: ${inputResult.timestamp}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => this.removeItem(e, item)}
                        className="ml-1 p-2 rounded-lg active:scale-95 transition-colors text-gray-500 hover:text-red-700 dark:text-gray-400 dark:hover:text-red-300"
                        aria-label={activeFilter === 'all' ? 'Remove from history' : `Remove from "${activeFilter}"`}
                        title={activeFilter === 'all' ? 'Remove from history' : `Remove from "${activeFilter}"`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                        </div>
                      </div>
                      <button
                        onClick={(e) => this.copy(e, item.output)}
                        onMouseEnter={(e) => this.showTooltip(e, outputTooltipId)}
                        onFocus={(e) => this.showTooltip(e, outputTooltipId)}
                        onBlur={() => this.hideTooltip(outputTooltipId)}
                        onMouseMove={(e) => this.updateTooltipPosition(e, outputTooltipId)}
                        onMouseLeave={() => this.hideTooltip(outputTooltipId)}
                        className={`history-value-button is-output ${outputTypeClass} ${outputResult.markers?.length ? `is-${outputResult.markers[0].kind}` : ''}`}
                        aria-label={`Copy result: ${outputResult.type}`}
                      >
                        <span className="break-all flex-1 text-left">{item.output}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
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
                          ref={(el) => this.setTooltipRef(outputTooltipId, el)}
                          className="tooltip tooltip-top"
                        >
                          <div className="min-w-[180px] max-w-[260px] text-left">
                            <div className={`${(outputResult.timestamp || item.info || (favoriteLists && favoriteLists.length > 0)) ? 'pb-1.5 mb-1.5 border-b border-gray-300 dark:border-gray-600' : ''}`}>
                              <div className="text-[10px] font-semibold text-left flex items-center gap-1.5">
                                <span className="text-gray-800 dark:text-gray-400">Output:</span>
                                {outputResult.type.startsWith('UUID v') ? (
                                  <>
                                    <span className="text-gray-900 dark:text-gray-100 font-bold">UUID</span>
                                    <span 
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold"
                                      style={{
                                        backgroundColor: 'rgb(21, 128, 61)',
                                        color: '#ffffff'
                                      }}
                                    >
                                      {outputResult.type.replace('UUID ', '')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-gray-900 dark:text-gray-100 font-bold">{outputResult.type}</span>
                                )}
                              </div>
                            </div>
                            {((outputResult.timestamp || item.info || (favoriteLists && favoriteLists.length > 0))) && (
                            <div className="space-y-1.5 pt-1.5">
                              {outputResult.timestamp && (
                                <div>
                                  <div className="text-[10px] font-medium mb-0.5">
                                    <span className="text-gray-800 dark:text-gray-400 font-semibold">Timestamp:</span> <span className="font-bold">{this.formatTimestamp(outputResult.timestamp)}</span>
                                  </div>
                                  <div className="text-[9px] font-mono text-gray-500 dark:text-gray-400 break-all pl-1">{outputResult.timestamp}</div>
                                </div>
                              )}
                              {item.info && (
                                <div>
                                  <div className="text-[10px] break-words font-medium leading-snug">
                                    <span className="text-gray-800 dark:text-gray-400 font-semibold">Comment:</span> <span className="font-bold">{item.info}</span>
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
                                            className="w-1.5 h-1.5 rounded-full shrink-0"
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

                      <div className="flex items-center gap-2 pt-1">
                        <span className="history-label">
                          Input
                        </span>
                        <span className={`history-type-badge ${inputTypeClass}`}>
                          {inputResult.type}
                        </span>
                        {intTypeName && (inputType === TYPE_HIGH_LOW || inputType === TYPE_WORDS) && (
                          <span className="history-marker-badge marker-int" title="Integer type this pair was read with">
                            {intTypeName}
                          </span>
                        )}
                        {(inputResult.markers || []).map(marker => (
                          <span key={marker.label} className={`history-marker-badge marker-${marker.kind}`}>
                            {marker.label}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={(e) => this.copy(e, item.input)}
                        onMouseEnter={(e) => this.showTooltip(e, inputTooltipId, 'bottom')}
                        onFocus={(e) => this.showTooltip(e, inputTooltipId, 'bottom')}
                        onBlur={() => this.hideTooltip(inputTooltipId)}
                        onMouseMove={(e) => this.updateTooltipPosition(e, inputTooltipId, 'bottom')}
                        onMouseLeave={() => this.hideTooltip(inputTooltipId)}
                        className={`history-value-button ${inputTypeClass} ${inputResult.markers?.length ? `is-${inputResult.markers[0].kind}` : ''}`}
                        aria-label={`Copy source: ${inputResult.type}`}
                      >
                        <span className="break-all flex-1 text-left">{item.input}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
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
                          ref={(el) => this.setTooltipRef(inputTooltipId, el)}
                          className="tooltip tooltip-bottom"
                        >
                          <div className="min-w-[180px] max-w-[260px] text-left">
                            <div className={`${(inputResult.timestamp || item.info || (favoriteLists && favoriteLists.length > 0)) ? 'pb-1.5 mb-1.5 border-b border-gray-300 dark:border-gray-600' : ''}`}>
                              <div className="text-[10px] font-semibold text-left flex items-center gap-1.5">
                                <span className="text-gray-800 dark:text-gray-400">Input:</span>
                                {inputResult.type.startsWith('UUID v') ? (
                                  <>
                                    <span className="text-gray-900 dark:text-gray-100 font-bold">UUID</span>
                                    <span 
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold"
                                      style={{
                                        backgroundColor: 'rgb(21, 128, 61)',
                                        color: '#ffffff'
                                      }}
                                    >
                                      {inputResult.type.replace('UUID ', '')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-gray-900 dark:text-gray-100 font-bold">{inputResult.type}</span>
                                )}
                              </div>
                            </div>
                            {((inputResult.timestamp || item.info || (favoriteLists && favoriteLists.length > 0))) && (
                            <div className="space-y-1.5 pt-1.5">
                              {inputResult.timestamp && (
                                <div>
                                  <div className="text-[10px] font-medium mb-0.5">
                                    <span className="text-gray-800 dark:text-gray-400 font-semibold">Timestamp:</span> <span className="font-bold">{this.formatTimestamp(inputResult.timestamp)}</span>
                                  </div>
                                  <div className="text-[9px] font-mono text-gray-500 dark:text-gray-400 break-all pl-1">{inputResult.timestamp}</div>
                                </div>
                              )}
                              {item.info && (
                                <div>
                                  <div className="text-[10px] break-words font-medium leading-snug">
                                    <span className="text-gray-800 dark:text-gray-400 font-semibold">Comment:</span> <span className="font-bold">{item.info}</span>
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
                                            className="w-1.5 h-1.5 rounded-full shrink-0"
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
              {filteredItems.length > this.state.visibleCount && (
                <div className="px-4 py-3 text-center">
                  <button
                    onClick={this.showMore}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105 active:scale-95 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    Show more ({filteredItems.length - this.state.visibleCount} left)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {this.state.showTagPopup && (
            // A native dialog: the focus trap, the inert page behind it and
            // Escape come from the browser rather than from three handlers.
            <dialog
              ref={this.openTagDialog}
              aria-labelledby="tag-dialog-title"
              className="modal-panel"
              onClose={this.closeTagPopup}
              onClick={(e) => { if (e.target === e.currentTarget) { this.closeTagPopup(); } }}
            >
              <div className="modal-head">
                <div>
                  <p id="tag-dialog-title" className="modal-title">Add to favorites</p>
                  <p className="modal-subtitle">Pick a tag, or type a name to make one.</p>
                </div>
                <button
                  onClick={this.closeTagPopup}
                  className="modal-close"
                  aria-label="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  value={this.state.tagSearchQuery}
                  onChange={(e) => this.setState({ tagSearchQuery: e.target.value })}
                  placeholder="Search or name a new tag"
                  className="modal-input"
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
                    }
                  }}
                />
                <div className="tag-list custom-scrollbar">
                  {(() => {
                    const { favorites } = this.props;
                    const { tagSearchQuery, tagPopupItem } = this.state;
                    const query = tagSearchQuery.trim();
                    const listNames = Object.keys(favorites || {});
                    const filtered = listNames.filter(name =>
                      name.toLowerCase().includes(tagSearchQuery.toLowerCase())
                    );
                    const showCreate = query && !favorites[query];

                    if (listNames.length === 0 && !query) {
                      return (
                        <p className="modal-empty">
                          No tags yet
                          <span>Type a name above to make the first one.</span>
                        </p>
                      );
                    }

                    return (
                      <>
                        {showCreate && (
                          <button
                            onClick={this.handleCreateNewTag}
                            className="tag-option is-create"
                          >
                            <svg className="tag-option-mark" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                            </svg>
                            <span className="tag-option-body">
                              <span className="tag-option-name">Create "{query}"</span>
                              <span className="tag-option-meta">A new tag with this item in it</span>
                            </span>
                          </button>
                        )}
                        {filtered.length === 0 && !showCreate && query && (
                          <p className="modal-empty">
                            Nothing matches "{query}"
                          </p>
                        )}
                        {filtered.map((listName) => {
                          const listItems = favorites[listName] || [];
                          const isItemInThisList = tagPopupItem && listItems.some(item =>
                            `${item.input}:${item.output}` === `${tagPopupItem.input}:${tagPopupItem.output}`
                          );

                          return (
                            <button
                              key={listName}
                              onClick={() => this.handleTagSelect(listName)}
                              className={`tag-option ${isItemInThisList ? 'is-active' : ''}`}
                            >
                              <span
                                className="tag-option-dot"
                                style={{ backgroundColor: this.getTagColor(listName) }}
                              />
                              <span className="tag-option-body">
                                <span className="tag-option-name">{listName}</span>
                                <span className="tag-option-meta">
                                  {listItems.length} {listItems.length === 1 ? 'item' : 'items'}
                                  {isItemInThisList ? ' · this one included' : ''}
                                </span>
                              </span>
                              {isItemInThisList && (
                                <svg className="tag-option-mark" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                  <path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              </div>
            </dialog>
        )}
      </section>
    );
  }
}
