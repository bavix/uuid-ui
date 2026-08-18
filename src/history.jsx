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
import { detectIntPair, toUuid } from './to-uuid.js';
import { readingOf, readingsFor } from './int-convention.js';
import { SIGNED } from './int-type.js';
import { INT_TYPE_NAMES } from './int-type.js';
// The easter egg is ~40% of the source and almost nobody opens it, so it is a
// separate chunk fetched on demand instead of a tax on every first paint.
const SpaceRunner = lazy(() => import('./space-runner.jsx'));
import { HISTORY_LIMIT, PAGE_SIZE } from './limits.js';
import { isTypingTarget } from './key-sequence.js';
import { searchItems } from './search.js';
import { trackEgg } from './analytics.js';
import { TAG_NAME_LIMIT, cleanTagName, findTag } from './tag-name.js';
import { tagColors, tagGround } from './tag-color.js';

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
  facts = new WeakMap();
  
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

  // Ten taps on the empty-state icon wakes the game up. A button, not the svg
  // itself, so the keyboard reaches it the same way the mouse does.
  handleEmptyIconClick = () => {
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
  };

  // The strip only fades where there is something past the edge. Faded ends on
  // a strip that fits made a single tag look half hidden.
  markStripEnds = () => {
    const strip = this.strip;

    if (!strip) {
      return;
    }

    const start = strip.scrollLeft <= 1;
    const end = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 1;

    strip.dataset.fade = start && end ? 'none' : start ? 'end' : end ? 'start' : 'both';
  };

  holdStrip = (node) => {
    if (this.stripWatch) {
      this.stripWatch.disconnect();
      this.stripWatch = null;
    }

    if (this.strip) {
      this.strip.removeEventListener('scroll', this.markStripEnds);
    }

    this.strip = node;

    if (!node) {
      return;
    }

    node.addEventListener('scroll', this.markStripEnds, { passive: true });

    if (typeof ResizeObserver === 'function') {
      this.stripWatch = new ResizeObserver(this.markStripEnds);
      this.stripWatch.observe(node);
    }

    this.markStripEnds();
  };

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

    // The chosen tag may be off the right end of the strip; bring it back into
    // sight rather than leaving the row looking unchanged.
    if (prevState.activeFilter !== activeFilter && this.strip) {
      const chosen = this.strip.querySelector('.tag-chip.is-on:not(.tag-chip-all)');

      if (chosen && chosen.scrollIntoView) {
        chosen.scrollIntoView({ inline: 'center', block: 'nearest' });
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
  // and a readable label colour that flips with the theme. The card the chip
  // lands on is read from the theme, not assumed to be white.
  tagGroundNow = () => {
    const mark = `${document.documentElement.getAttribute('data-theme') ?? ''}:${this.props.isToggled ? 'd' : 'l'}`;

    if (this.groundMark !== mark) {
      this.groundMark = mark;
      this.ground = tagGround();
    }

    return this.ground;
  };

  tagPaint = (text) => tagColors(text, Boolean(this.props.isToggled), this.tagGroundNow());

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
  // it modal, and it must run once the node exists. Dismissing on a backdrop
  // click is wired here too, next to the rest of the native dialog behaviour:
  // it is a mouse shortcut for what Escape and the Close button already do, so
  // it belongs with them rather than as a lone click handler in the markup.
  openTagDialog = (node) => {
    this.tagDialog = node;

    if (node && !node.open) {
      node.showModal();
      node.addEventListener('click', (e) => {
        if (e.target === node) {
          this.closeTagPopup();
        }
      });
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

    this.tagOpener = e.currentTarget;

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
      description: items.length > 0
        ? `${items.length} ${items.length === 1 ? 'row was' : 'rows were'} in it`
        : undefined,
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

  // A name typed here is cleaned before it becomes a tag, and a name that only
  // differs by case or spacing joins the tag already there rather than making a
  // near-twin of it.
  handleCreateNewTag = () => {
    const { tagPopupItem, tagSearchQuery } = this.state;
    const { createFavoriteList, addToFavorites, favorites } = this.props;
    const wanted = cleanTagName(tagSearchQuery);

    if (tagPopupItem && wanted !== '') {
      const held = findTag(Object.keys(favorites || {}), wanted);
      const name = held ?? wanted;

      if (!held) {
        createFavoriteList(name);
      }

      addToFavorites(tagPopupItem, name);
      toast.success(`Added to "${name}"`);
    }

    this.setState({ tagSearchQuery: '' });
  };

  closeTagPopup = () => {
    this.setState({
      showTagPopup: false,
      tagPopupItem: null,
      tagSearchQuery: '',
    });

    this.tagOpener?.focus();
    this.tagOpener = null;
  };

  holdTagDialog = (node) => {
    this.tagDialog = node;

    if (!node || node.open) {
      return;
    }

    node.showModal();
    node.addEventListener('click', (e) => {
      if (e.target === node) {
        this.closeTagPopup();
      }
    });
    node.querySelector('.tag-field')?.focus();
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

  factsOf(item) {
    const held = this.facts.get(item);

    if (held !== undefined) {
      return held;
    }

    const outputType = this.getTypeKind(item.output);
    const inputType = this.getTypeKind(item.input);
    const stored = { read: readingOf(item.readAs), write: readingOf(item.writeAs) };
    const rowInts = detectIntPair(item.input, item.output);
    const { read, write } = readingsFor(stored, rowInts);

    const facts = {
      itemId: item.toString(),
      inputResult: this.processItem(item.input),
      outputResult: this.processItem(item.output),
      outputType,
      inputType,
      outputTypeClass: this.getTypeClassName(outputType),
      inputTypeClass: this.getTypeClassName(inputType),
      outputIntName: INT_TYPE_NAMES[write],
      inputIntName: INT_TYPE_NAMES[read],
      inspectable: toUuid(item.input, read ?? SIGNED) ?? toUuid(item.output, write ?? SIGNED),
    };

    this.facts.set(item, facts);

    return facts;
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
    const favoriteListNames = Object.keys(favorites || {}).sort((a, b) => a.localeCompare(b));
    const filteredItems = this.getFilteredItems();

    return (
      <section aria-label="Conversion results" className={`history-container ${expanded ? 'game-expanded' : ''} ${this.showGame ? 'runner-expanded' : ''}`}>
        {!expanded && (
          <>
          <div className="history-header">
          <div className="flex items-center gap-3 min-w-0">
            <svg className="w-5 h-5 shrink-0 ink-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex items-baseline gap-x-2 min-w-0">
              <h2 className="font-bold history-header-title">History</h2>
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
              <span
                className={`history-target ${this.getTypeClassName(this.props.resultType)}`}
                title="How the next conversion is read and written"
                aria-label={[
                  this.props.readIntName ? `read ${this.props.readIntName}` : null,
                  `write ${this.getTypeLabel(this.props.resultType)}${this.props.writeIntName ? ` ${this.props.writeIntName}` : ''}`,
                  this.props.spellingName ? `spelled ${this.props.spellingName}` : null,
                ].filter(Boolean).join(', ').replace(/^/, 'New conversions ')}
              >
                → {this.getTypeLabel(this.props.resultType)}
                {this.props.writeIntName
                  ? ` · ${this.props.writeIntName}`
                  : (this.props.spellingName ? ` · ${this.props.spellingName}` : '')}
              </span>
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={this.clearHistory}
              className="px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ink-danger hover-danger-soft"
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
          <div className="px-5 pb-3">
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
          <div className="tag-strip-wrap px-5 pb-3" role="group" aria-label="Filter by tag">
            <button
              type="button"
              onClick={() => this.handleFilterChange('all')}
              className={`tag-chip tag-chip-all ${activeFilter === 'all' ? 'is-on' : ''}`}
              aria-pressed={activeFilter === 'all'}
            >
              All
            </button>
            <div className="tag-strip" data-fade="none" ref={this.holdStrip}>
              {favoriteListNames.map((listName) => {
                const listItems = favorites[listName] || [];
                const paint = this.tagPaint(listName);
                const isActive = this.state.activeFilter === listName;

                return (
                  <button
                    key={`filter-${listName}`}
                    type="button"
                    onClick={() => this.handleFilterChange(isActive ? 'all' : listName)}
                    className={`tag-chip ${isActive ? 'is-on' : ''}`}
                    style={{ '--tag': paint.fill, '--tag-ink': paint.ink, '--tag-on': paint.onFill, '--tag-dot': paint.dot }}
                    aria-pressed={isActive}
                    title={`${listName} — ${listItems.length} row${listItems.length === 1 ? '' : 's'}`}
                  >
                    <span className="tag-chip-dot" aria-hidden="true"></span>
                    <span className="tag-chip-name">{listName}</span>
                    <span className="tag-chip-count">{listItems.length}</span>
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
                   <Suspense fallback={<div className="px-4 py-12 text-center text-sm ink-muted">Loading…</div>}>
                     <SpaceRunner onClose={() => { this.showGame = false; this.forceUpdate(); }} />
                   </Suspense>
                 ) : filteredItems.length === 0 ? (
            <div className="history-empty px-4 py-12 text-center">
              <button
                type="button"
                aria-label="Empty history"
                className="block mx-auto mb-2 p-0 border-0 bg-transparent cursor-default"
                onClick={this.handleEmptyIconClick}
              >
                <svg
                  className="w-10 h-10 ink-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </button>
              <p className="text-sm font-medium ink">
                {this.state.query.trim() !== ''
                  ? `Nothing matches "${this.state.query.trim()}"`
                  : activeFilter === 'all'
                    ? 'Nothing converted yet'
                    : `Nothing tagged "${activeFilter}"`}
              </p>
              <p className="mt-1 text-xs ink-muted">
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
                const facts = this.factsOf(item);
                const { inputResult, outputResult, outputType, inputType, outputTypeClass, inputTypeClass,
                    outputIntName, inputIntName, inspectable, itemId } = facts;
                const outputTooltipId = `tooltip-${itemId}-output`;
                const inputTooltipId = `tooltip-${itemId}-input`;

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
                        {(outputType === TYPE_HIGH_LOW || outputType === TYPE_WORDS) && (outputIntName
                          ? (
                            <span className="history-marker-badge marker-int" title="Integer type this value is written in">
                              {outputIntName}
                            </span>
                          )
                          : (
                            <span className="history-marker-badge marker-int is-unknown" title="Two readings fit this row, so it cannot say which one it was written in">
                              ?
                            </span>
                          ))}
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
                          className="p-2 rounded-lg active:scale-95 transition-colors hover-surface ink-muted accent-hover"
                          aria-label="Show the bits of this identifier"
                          title="Show the bits of this identifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v4H4zM10 6h4v4h-4zM16 6h4v4h-4zM4 14h4v4H4zM10 14h4v4h-4zM16 14h4v4h-4z" />
                          </svg>
                        </button>
                      )}
                      {favoriteLists && favoriteLists.length > 0 && (
                        <span className="row-tags" title={`Tagged ${favoriteLists.join(', ')}`}>
                          {favoriteLists.slice(0, 3).map(listName => (
                            <span
                              key={listName}
                              className="row-tag-dot"
                              style={{ backgroundColor: this.tagPaint(listName).dot }}
                            ></span>
                          ))}
                          {favoriteLists.length > 3 && (
                            <span className="row-tag-more">+{favoriteLists.length - 3}</span>
                          )}
                          <span className="sr-only">{`Tagged ${favoriteLists.join(', ')}`}</span>
                        </span>
                      )}
                      <button
                        onClick={(e) => this.handleFavoriteToggle(e, item)}
                        className={`p-2 rounded-lg active:scale-95 transition-colors hover-surface ${
                          isInFavorites 
                            ? 'ink-star star-hover' 
                            : 'ink-muted star-hover'
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
                        className="p-2 rounded-lg active:scale-95 transition-colors hover-surface ink-muted accent-hover"
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
                          className="p-2 rounded-lg active:scale-95 transition-colors hover-surface ink-muted accent-hover"
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
                        className="ml-1 p-2 rounded-lg active:scale-95 transition-colors ink-muted danger-hover"
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
                            <div className={`${(outputResult.timestamp || item.info || (favoriteLists && favoriteLists.length > 0)) ? 'pb-1.5 mb-1.5 border-b line-strong-border' : ''}`}>
                              <div className="text-[10px] font-semibold text-left flex items-center gap-1.5">
                                <span className="ink-muted">Output:</span>
                                {outputResult.type.startsWith('UUID v') ? (
                                  <>
                                    <span className="ink font-bold">UUID</span>
                                    <span 
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold version-badge"
                                    >
                                      {outputResult.type.replace('UUID ', '')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="ink font-bold">{outputResult.type}</span>
                                )}
                              </div>
                            </div>
                            {((outputResult.timestamp || item.info || (favoriteLists && favoriteLists.length > 0))) && (
                            <div className="space-y-1.5 pt-1.5">
                              {outputResult.timestamp && (
                                <div>
                                  <div className="text-[10px] font-medium mb-0.5">
                                    <span className="ink-muted font-semibold">Timestamp:</span> <span className="font-bold">{this.formatTimestamp(outputResult.timestamp)}</span>
                                  </div>
                                  <div className="text-[9px] font-mono ink-muted break-all pl-1">{outputResult.timestamp}</div>
                                </div>
                              )}
                              {item.info && (
                                <div>
                                  <div className="text-[10px] break-words font-medium leading-snug">
                                    <span className="ink-muted font-semibold">Comment:</span> <span className="font-bold">{item.info}</span>
                                  </div>
                                </div>
                              )}
                              {favoriteLists && favoriteLists.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-medium">
                                    <span className="ink-muted font-semibold">Tag:</span>{' '}
                                    {favoriteLists.map((listName, idx) => {
                                      const paint = this.tagPaint(listName);
                                      return (
                                        <span 
                                          key={idx} 
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ml-1"
                                          style={{ 
                                            backgroundColor: paint.fill,
                                            color: paint.onFill
                                          }}
                                        >
                                          <div 
                                            className="w-1.5 h-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: paint.onFill, opacity: 0.9 }}
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
                        {(inputType === TYPE_HIGH_LOW || inputType === TYPE_WORDS) && (inputIntName
                          ? (
                            <span className="history-marker-badge marker-int" title="Integer type this value is written in">
                              {inputIntName}
                            </span>
                          )
                          : (
                            <span className="history-marker-badge marker-int is-unknown" title="Two readings fit this row, so it cannot say which one it was read in">
                              ?
                            </span>
                          ))}
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
                            <div className={`${(inputResult.timestamp || item.info || (favoriteLists && favoriteLists.length > 0)) ? 'pb-1.5 mb-1.5 border-b line-strong-border' : ''}`}>
                              <div className="text-[10px] font-semibold text-left flex items-center gap-1.5">
                                <span className="ink-muted">Input:</span>
                                {inputResult.type.startsWith('UUID v') ? (
                                  <>
                                    <span className="ink font-bold">UUID</span>
                                    <span 
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold version-badge"
                                    >
                                      {inputResult.type.replace('UUID ', '')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="ink font-bold">{inputResult.type}</span>
                                )}
                              </div>
                            </div>
                            {((inputResult.timestamp || item.info || (favoriteLists && favoriteLists.length > 0))) && (
                            <div className="space-y-1.5 pt-1.5">
                              {inputResult.timestamp && (
                                <div>
                                  <div className="text-[10px] font-medium mb-0.5">
                                    <span className="ink-muted font-semibold">Timestamp:</span> <span className="font-bold">{this.formatTimestamp(inputResult.timestamp)}</span>
                                  </div>
                                  <div className="text-[9px] font-mono ink-muted break-all pl-1">{inputResult.timestamp}</div>
                                </div>
                              )}
                              {item.info && (
                                <div>
                                  <div className="text-[10px] break-words font-medium leading-snug">
                                    <span className="ink-muted font-semibold">Comment:</span> <span className="font-bold">{item.info}</span>
                                  </div>
                                </div>
                              )}
                              {favoriteLists && favoriteLists.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-medium">
                                    <span className="ink-muted font-semibold">Tag:</span>{' '}
                                    {favoriteLists.map((listName, idx) => {
                                      const paint = this.tagPaint(listName);
                                      return (
                                        <span 
                                          key={idx} 
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ml-1"
                                          style={{ 
                                            backgroundColor: paint.fill,
                                            color: paint.onFill
                                          }}
                                        >
                                          <div 
                                            className="w-1.5 h-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: paint.onFill, opacity: 0.9 }}
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
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105 active:scale-95 ink-accent hover-accent-soft"
                  >
                    Show more ({filteredItems.length - this.state.visibleCount} left)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {this.state.showTagPopup && (
          <dialog
            className="modal-panel tag-pop"
            aria-label="Tags for this result"
            ref={this.holdTagDialog}
            onClose={this.closeTagPopup}
          >
            <div className="modal-head tag-pop-head">
              <div className="tag-pop-heading">
                <p className="modal-title">Tags</p>
                <p className="tag-pop-value" title={this.state.tagPopupItem?.output}>
                  {this.state.tagPopupItem?.output}
                </p>
              </div>
              <button type="button" className="modal-close" onClick={this.closeTagPopup} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {(() => {
              const { favorites } = this.props;
              const { tagSearchQuery, tagPopupItem } = this.state;
              const query = cleanTagName(tagSearchQuery);
              const holds = name => (favorites[name] || []).some(item =>
                `${item.input}:${item.output}` === `${tagPopupItem?.input}:${tagPopupItem?.output}`
              );
              const names = Object.keys(favorites || {}).sort((a, b) => {
                const mine = Number(holds(b)) - Number(holds(a));

                return mine === 0 ? a.localeCompare(b) : mine;
              });
              const shown = query === '' ? names : names.filter(name => name.toLowerCase().includes(query.toLowerCase()));
              const exact = findTag(names, query);

              return (
                <>
                  {names.length > 0 && (
                    <div className="tag-pop-chips">
                      {shown.map(name => (
                        <button
                          key={name}
                          type="button"
                          className={`tag-pop-chip ${holds(name) ? 'is-on' : ''}`}
                          style={{ '--tag': this.tagPaint(name).dot }}
                          aria-pressed={holds(name)}
                          onClick={() => this.handleTagSelect(name)}
                        >
                          <span className="tag-pop-dot" aria-hidden="true"></span>
                          <span className="tag-pop-name">{name}</span>
                          <span
                            className="tag-pop-drop"
                            role="button"
                            tabIndex={0}
                            aria-label={`Delete the tag ${name}`}
                            title={`Delete the tag "${name}"`}
                            onClick={(e) => this.deleteTag(e, name)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { this.deleteTag(e, name); } }}
                          >
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </span>
                        </button>
                      ))}
                      {shown.length === 0 && <p className="tag-pop-none">No tag matches that.</p>}
                    </div>
                  )}
                  <div className="tag-pop-make">
                    {names.length > 8 && (
                      <span className="tag-pop-count">{shown.length} of {names.length}</span>
                    )}
                    <input
                      type="text"
                      className="tag-field"
                      value={tagSearchQuery}
                      placeholder={names.length === 0 ? 'Name the first tag' : 'Filter, or name a new tag'}
                      maxLength={TAG_NAME_LIMIT}
                      onChange={(e) => this.setState({ tagSearchQuery: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter' || query === '') {
                          return;
                        }

                        if (exact) {
                          this.handleTagSelect(exact);
                          this.setState({ tagSearchQuery: '' });

                          return;
                        }

                        this.handleCreateNewTag();
                      }}
                    />
                    <button
                      type="button"
                      className="tag-add"
                      disabled={query === '' || Boolean(exact)}
                      onClick={this.handleCreateNewTag}
                    >
                      Add
                    </button>
                  </div>
                </>
              );
            })()}
          </dialog>
        )}
      </section>
    );
  }
}
