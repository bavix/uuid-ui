import React from 'preact/compat';
import { Toaster } from 'sonner';
import InputComponent from "./input.jsx"
import { INT_TYPE_NAMES, SIGNED, UNSIGNED } from './int-type.js'
import HistoryComponent from "./history.jsx"
import NavComponent from './nav.jsx'
import { TYPE_HEX, TYPE_HIGH_LOW, TYPE_UUID } from './type-detector.js'
import { readIntTypes, readTarget, readUuidStyle, readUuidUpper, writeState } from './url-state.js'
import { STYLE_HEX } from './uuid-style.js'
import { defaultSpelling, isSpelling, spellingLabel, usesInts } from './spellings.js'
import { watchSequence } from './key-sequence.js'
import { readActiveSeconds, trackActiveTime } from './active-time.js'
import { mountEggsButton } from './eggs-button.js'
import { foundEggs } from './eggs-found.js'
import AppearanceDrawer from './appearance.jsx'
import { CUSTOM_PALETTE, applyCustom, clearCustom, readTheme as readCustomTheme } from './themes/custom.js'
import { DARK, DEFAULT_PALETTE, SYSTEM, applyTheme, paintChrome, readTheme, variantOf } from './theme.js'
import { selectFavorites, selectItems } from './data/selectors.js'
import { trackEgg } from './analytics.js'
import { uuidRain } from './effects.js'
import { toast } from 'sonner'
import './app.css'

const EGGS_AFTER_SECONDS = 60 * 60;

// The inline script in index.html has already decided and applied this before
// first paint; the stored pair is what it read, so the two never disagree.
const startingTheme = () => readTheme();

const INT_BY_NAME = (value) => (value === 'unsigned' ? UNSIGNED : SIGNED);

function kept(data, name, fallback, read) {
    const held = data?.settings?.[name]?.value;

    return typeof held === 'string' ? read(held) : fallback;
}

function startingResultType(data) {
    const target = readTarget();

    if (target === TYPE_HEX) {
        return TYPE_UUID;
    }

    if (target !== null) {
        return target;
    }

    const held = Number(data?.settings?.resultType?.value);

    return Number.isFinite(held) && held > 0 ? held : TYPE_HIGH_LOW;
}

function startingSpelling(data) {
    if (readTarget() === TYPE_HEX) {
        return STYLE_HEX;
    }

    const held = readUuidStyle() ?? data?.settings?.spelling?.value ?? null;
    const type = startingResultType(data);

    return isSpelling(type, held) ? held : defaultSpelling(type);
}

export default class AppComponent extends React.Component {
    constructor(props) {
        super(props);

        const { read, write } = readIntTypes();

        this.state = {
            // Shown only once the tool has actually been worked in for an hour.
            eggsUnlocked: readActiveSeconds() >= EGGS_AFTER_SECONDS,
            // Light and dark stay on the switch in the header. The palettes are
            // the thing to find: type the word and the drawer arrives.
            themesFound: foundEggs().has('themes'),
            panelGame: null,
            resultType: startingResultType(props.data),
            intType: read ?? kept(props.data, 'intRead', SIGNED, INT_BY_NAME),
            writeIntType: write ?? kept(props.data, 'intWrite', SIGNED, INT_BY_NAME),
            uuidStyle: startingSpelling(props.data),
            uuidUpper: readUuidUpper() || kept(props.data, 'case', false, value => value === 'upper'),
            intLinked: read === null || write === null || read === write,
        };
    }

    setResultType = (resultType, onApplied) => {
        const spelling = isSpelling(resultType, this.state.uuidStyle)
            ? this.state.uuidStyle
            : defaultSpelling(resultType);

        this.setState({ resultType, uuidStyle: spelling }, () => {
            this.remember();
            writeState(this.state);
            if (onApplied) {
                onApplied();
            }
        });
    }

    // Someone editing #to= by hand, or following a second link, should land on
    // that format rather than on whatever was selected before.
    handleHashChange = () => {
        const held = readTarget();
        const target = held === TYPE_HEX ? TYPE_UUID : held;
        const { read, write } = readIntTypes();
        const style = held === TYPE_HEX ? STYLE_HEX : readUuidStyle();
        const upper = readUuidUpper();
        const next = {};

        if (style !== null && style !== this.state.uuidStyle) {
            next.uuidStyle = style;
        }

        if (upper !== this.state.uuidUpper) {
            next.uuidUpper = upper;
        }

        if (target !== null && target !== this.state.resultType) {
            next.resultType = target;
        }

        if (read !== null && read !== this.state.intType) {
            next.intType = read;
        }

        if (write !== null && write !== this.state.writeIntType) {
            next.writeIntType = write;
            next.intLinked = write === (read ?? this.state.intType);
        }

        if (Object.keys(next).length > 0) {
            this.setState(next);
        }
    }

    setIntType = (intType, onApplied) => {
        const next = this.state.intLinked ? { intType, writeIntType: intType } : { intType };

        this.setState(next, () => {
            this.remember();
            writeState(this.state);
            if (onApplied) {
                onApplied();
            }
        });
    }

    setUuidStyle = (uuidStyle, onApplied) => {
        this.setState({ uuidStyle }, () => {
            this.remember();
            writeState(this.state);
            if (onApplied) {
                onApplied();
            }
        });
    }

    setUuidUpper = (uuidUpper, onApplied) => {
        this.setState({ uuidUpper }, () => {
            this.remember();
            writeState(this.state);
            if (onApplied) {
                onApplied();
            }
        });
    }

    setWriteIntType = (writeIntType, onApplied) => {
        this.setState({ writeIntType, intLinked: false }, () => {
            this.remember();
            writeState(this.state);
            if (onApplied) {
                onApplied();
            }
        });
    }

    toggleIntLink = (onApplied) => {
        const { intLinked, intType } = this.state;
        const next = intLinked
            ? { intLinked: false }
            : { intLinked: true, writeIntType: intType };

        this.setState(next, () => {
            this.remember();
            writeState(this.state);
            if (onApplied) {
                onApplied();
            }
        });
    }

    remember = () => {
        const { resultType, intType, writeIntType, uuidStyle, uuidUpper } = this.state;
        const store = this.props.store;

        store.setSetting('resultType', String(resultType));
        store.setSetting('intRead', INT_TYPE_NAMES[intType]);
        store.setSetting('intWrite', INT_TYPE_NAMES[writeIntType]);
        store.setSetting('spelling', uuidStyle);
        store.setSetting('case', uuidUpper ? 'upper' : 'lower');
    }

    setToggle = (isToggled) => {
        this.props.store.setSetting('theme', isToggled ? 'dark' : 'light');
    }

    unlockThemes = (how) => {
        if (this.state.themesFound) {
            return;
        }

        trackEgg('themes', how);
        this.setState({ themesFound: true });
        toast.success('🎨 Secret unlocked!', {
            description: 'Palettes. The tab at the right edge opens them.',
            duration: 5000,
        });
    }

    setMode = (mode) => {
        this.props.store.setSetting('theme', mode);
    }

    setPalette = (palette) => {
        this.props.store.setSetting('palette', palette);
    }

    /** Which theme and which of its variants the settings come down to. */
    theme() {
        const { theme, palette } = this.props.data.settings;
        const kept = startingTheme();

        return {
            palette: palette?.value ?? kept.palette ?? DEFAULT_PALETTE,
            mode: theme?.value ?? kept.mode ?? SYSTEM,
        };
    }

    dark() {
        return variantOf(this.theme(), window) === DARK;
    }

    /** The theme somebody wrote, if this browser is holding one. */
    customTheme() {
        const held = this.props.data.settings.customTheme?.value;

        return held ? readCustomTheme(held).theme : null;
    }

    setCustomTheme = (text) => {
        this.props.store.setSetting('customTheme', text);
    }

    applyTheme = () => {
        const theme = this.theme();

        applyTheme(theme, document.documentElement, window);

        // A written theme is a set of values on the root, not a stylesheet, so
        // it is put on and taken off here rather than by a selector.
        if (theme.palette === CUSTOM_PALETTE) {
            applyCustom(this.customTheme(), document.documentElement);
            paintChrome(document.documentElement, window);

            return;
        }

        clearCustom(document.documentElement);
    }

    // Following the machine means following it while the page is open, not only
    // at load: the system switch at sunset has to reach an open tab.
    watchSystemTheme = () => {
        try {
            const query = window.matchMedia('(prefers-color-scheme: dark)');

            const onChange = () => {
                if (this.theme().mode === SYSTEM) {
                    this.applyTheme();
                    this.forceUpdate();
                }
            };

            query.addEventListener('change', onChange);

            return () => query.removeEventListener('change', onChange);
        } catch (e) {
            return () => {};
        }
    }

    componentDidUpdate() {
        this.applyTheme();
    }

    componentDidMount() {
        this.applyTheme();
        this.stopWatchingSystemTheme = this.watchSystemTheme();
        window.addEventListener('hashchange', this.handleHashChange);

        // Typed like the game's own trigger, and it says what it does.
        // The lab lives in its own chunk: typing the word is what pays for it.
        const openLab = (name) => import('./lab.js').then(lab => lab[name]());
        this.openLab = openLab;

        // The button sits in the footer, outside this tree; reveal it either at
        // mount (the hour was earned earlier) or the moment it is earned.
        const revealEggsButton = mountEggsButton(() => {
            trackEgg('help', 'clicked');
            openLab('eggsHelp');
        });

        if (this.state.eggsUnlocked) {
            revealEggsButton();
        }

        this.stopTrackingTime = trackActiveTime((seconds) => {
            if (seconds >= EGGS_AFTER_SECONDS && !this.state.eggsUnlocked) {
                this.setState({ eggsUnlocked: true });
                revealEggsButton();
            }
        });

        this.stopWatchingCollide = watchSequence(['c', 'o', 'l', 'l', 'i', 'd', 'e'], () => {
            trackEgg('collide', 'typed');
            openLab('birthdayParadox');
        });

        this.stopWatchingBits = watchSequence(['b', 'i', 't', 's'], () => {
            trackEgg('bits', 'typed');
            openLab('entropyView');
        });

        this.stopWatchingMines = watchSequence(['m', 'i', 'n', 'e', 's'], () => {
            trackEgg('mines', 'typed');
            this.setState({ panelGame: 'minesweeper' });
        });

        this.stopWatchingTiles = watchSequence(['2', '0', '4', '8'], () => {
            trackEgg('2048', 'typed');
            this.setState({ panelGame: 'tiles' });
        });

        this.stopWatchingLights = watchSequence(['l', 'i', 'g', 'h', 't', 's'], () => {
            trackEgg('lights', 'typed');
            this.setState({ panelGame: 'lightsOut' });
        });

        this.stopWatchingSudo = watchSequence(['s', 'u', 'd', 'o'], () => {
            trackEgg('sudo', 'typed');
            toast.success('🔓 Permission granted', {
                description: 'You already have root here. Nothing you paste leaves this browser.',
                duration: 6000,
            });
        });

        this.stopWatchingThemes = watchSequence(['p', 'a', 'l', 'e', 't', 't', 'e'], () => {
            this.unlockThemes('typed');
        });

        this.stopWatchingRain = watchSequence(['r', 'a', 'i', 'n'], () => {
            trackEgg('rain', 'typed');
            uuidRain(6000);
            toast.success('🕹️ Secret unlocked!', {
                description: 'Hex rain. It stops on its own.',
                duration: 4000,
            });
        });

        this.applyTheme();
    }

    items() {
        return selectItems(this.props.data.items);
    }

    favorites() {
        return selectFavorites(this.props.data.favorites);
    }

    setItems = (items, meta) => {
        this.props.store.setRows(items.map(item => ({
            input: item.input,
            output: item.output,
            info: item.info,
            readAs: item.readAs,
            writeAs: item.writeAs,
        })), meta);

        this.syncFavoritesWithHistory(items);
    }

    writeFavorites = (favorites) => {
        const serialized = {};

        for (const [listName, items] of Object.entries(favorites)) {
            serialized[listName] = {
                items: items.map(item => ({
                    input: item.input || '',
                    output: item.output || '',
                    info: item.info || '',
                    readAs: item.readAs,
                    writeAs: item.writeAs,
                })),
            };
        }

        this.props.store.setTags(serialized);
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this.handleHashChange);

        if (this.stopWatchingSystemTheme) {
            this.stopWatchingSystemTheme();
        }

        if (this.stopListening) {
            this.stopListening();
        }

        if (this.stopTrackingTime) {
            this.stopTrackingTime();
        }

        if (this.stopWatchingRain) {
            this.stopWatchingRain();
        }

        if (this.stopWatchingThemes) {
            this.stopWatchingThemes();
        }

        if (this.stopWatchingSudo) {
            this.stopWatchingSudo();
        }

        if (this.stopWatchingCollide) {
            this.stopWatchingCollide();
        }

        if (this.stopWatchingBits) {
            this.stopWatchingBits();
        }

        if (this.stopWatchingMines) {
            this.stopWatchingMines();
        }

        if (this.stopWatchingTiles) {
            this.stopWatchingTiles();
        }

        if (this.stopWatchingLights) {
            this.stopWatchingLights();
        }
    }

    clearItems = () => {
        this.props.store.clearRows();
    }

    // Favorites are their own collection, not a view over history. A starred
    // item survives "Clear history" and survives falling past the history cap;
    // only its comment follows the history entry it came from.
    syncFavoritesWithHistory = (currentItems) => {
        const favorites = this.favorites();
        let favoritesChanged = false;
        const newFavorites = { ...favorites };

        for (const [listName, favItems] of Object.entries(newFavorites)) {
            newFavorites[listName] = favItems.map(favItem => {
                const matchingHistoryItem = currentItems.find(histItem =>
                    histItem.input === favItem.input && histItem.output === favItem.output
                );

                if (matchingHistoryItem && matchingHistoryItem.info !== favItem.info) {
                    favoritesChanged = true;
                    return matchingHistoryItem;
                }

                return favItem;
            });
        }

        if (favoritesChanged) {
            this.writeFavorites(newFavorites);
        }
    }

    addToFavorites = (item, listName) => {
        if (!item || !listName || !listName.trim()) {
            console.warn('addToFavorites: invalid item or listName', { item, listName });
            return;
        }

        const favorites = this.favorites();
        const newFavorites = { ...favorites };
        const trimmedListName = listName.trim();
        
        if (!newFavorites[trimmedListName]) {
            newFavorites[trimmedListName] = [];
        }
        
        const itemKey = `${item.input}:${item.output}`;
        const list = newFavorites[trimmedListName];
        const exists = list.some(favItem => `${favItem.input}:${favItem.output}` === itemKey);

        // A new array either way: assigning into the old one would mutate the
        // array the previous state still holds.
        newFavorites[trimmedListName] = exists
            ? list.map(favItem => (`${favItem.input}:${favItem.output}` === itemKey ? item : favItem))
            : [...list, item];
        
        this.writeFavorites(newFavorites);
    }

    removeFromFavorites = (item, listName) => {
        if (!item || !listName || !listName.trim()) {
            console.warn('removeFromFavorites: invalid item or listName', { item, listName });
            return;
        }

        const favorites = this.favorites();
        const trimmedListName = listName.trim();
        
        if (!favorites[trimmedListName] || favorites[trimmedListName].length === 0) {
            return;
        }
        
        const newFavorites = { ...favorites };
        const itemKey = `${item.input}:${item.output}`;
        newFavorites[trimmedListName] = newFavorites[trimmedListName].filter(favItem => 
            `${favItem.input}:${favItem.output}` !== itemKey
        );
        
        this.writeFavorites(newFavorites);
    }

    // Deleting a tag is now something the user asks for, not a side effect of
    // unstarring the last item in it.
    deleteFavoriteList = (listName) => {
        const trimmedListName = (listName || '').trim();
        const favorites = this.favorites();

        if (!trimmedListName || !(trimmedListName in favorites)) {
            return;
        }

        const newFavorites = { ...favorites };
        delete newFavorites[trimmedListName];

        this.writeFavorites(newFavorites);

        if (this.historyComponentRef) {
            this.historyComponentRef.handleFilterChange('all');
        }
    }

    restoreFavoriteList = (listName, items) => {
        const trimmedListName = (listName || '').trim();
        if (!trimmedListName || !Array.isArray(items)) {
            return;
        }

        const newFavorites = { ...this.favorites(), [trimmedListName]: [...items] };
        this.writeFavorites(newFavorites);
    }

    createFavoriteList = (listName) => {
        if (!listName || !listName.trim()) {
            console.warn('createFavoriteList: invalid listName', listName);
            return;
        }

        const favorites = this.favorites();
        const trimmedListName = listName.trim();
        
        if (!favorites[trimmedListName]) {
            const newFavorites = { ...favorites, [trimmedListName]: [] };
            this.writeFavorites(newFavorites);
        }
    }

    render() {
        const { resultType, intType, writeIntType, intLinked, uuidStyle, uuidUpper } = this.state;
        const isToggled = this.dark();
        const items = this.items();

        return (
            <div className="uuid-ui--wrapper flex-1">
                {/* Bottom-right: at top-right it landed on the History header
                    and covered the newest result it was announcing. */}
                <Toaster
                    position="bottom-right"
                    richColors
                    closeButton
                    theme={isToggled ? "dark" : "light"}
                />
                {this.state.themesFound && (
                    <AppearanceDrawer
                        theme={this.theme()}
                        custom={this.customTheme()}
                        customText={this.props.data.settings.customTheme?.value || ''}
                        onMode={this.setMode}
                        onPalette={this.setPalette}
                        onCustom={this.setCustomTheme}
                    />
                )}
                <NavComponent
                    isToggled={isToggled}
                    setToggle={this.setToggle}
                    store={this.props.store}
                    bus={this.props.bus}
                    data={this.props.data}
                    onGenerated={this.keepGenerated}
                />
                <main className="container mx-auto py-6 max-w-7xl px-4 ink">
                    <h1 className="sr-only">Convert UUIDs between formats</h1>
                    <div className="flex flex-col lg:flex-row">
                        <div className="w-full lg:w-3/5 shrink-0" id="input-cp">
                            <InputComponent
                                ref={(node) => { this.inputComponentRef = node; }}
                                items={items}
                                setItems={this.setItems}
                                resultType={resultType}
                                intType={intType}
                                writeIntType={writeIntType}
                                intLinked={intLinked}
                                setResultType={this.setResultType}
                                setIntType={this.setIntType}
                                setWriteIntType={this.setWriteIntType}
                                toggleIntLink={this.toggleIntLink}
                                uuidStyle={uuidStyle}
                                uuidUpper={uuidUpper}
                                setUuidStyle={this.setUuidStyle}
                                setUuidUpper={this.setUuidUpper}
                            />
                        </div>
                        <div className="w-full lg:w-2/5 shrink-0 max-w-full overflow-hidden lg:pl-4 flex flex-col m-0 p-0 mt-4 lg:mt-0" id="history-cp">
                            <HistoryComponent 
                                ref={(ref) => { this.historyComponentRef = ref; }}
                                items={items} 
                                clearItems={this.clearItems}
                                setItems={this.setItems}
                                resultType={resultType}
                                spellingName={spellingLabel(resultType, uuidStyle, uuidUpper)}
                                readIntName={usesInts(resultType) && !intLinked ? INT_TYPE_NAMES[intType] : null}
                                writeIntName={usesInts(resultType) ? INT_TYPE_NAMES[intLinked ? intType : writeIntType] : null}
                                favorites={this.favorites()}
                                addToFavorites={this.addToFavorites}
                                removeFromFavorites={this.removeFromFavorites}
                                createFavoriteList={this.createFavoriteList}
                                deleteFavoriteList={this.deleteFavoriteList}
                                restoreFavoriteList={this.restoreFavoriteList}
                                panelGame={this.state.panelGame}
                                closePanelGame={() => this.setState({ panelGame: null })}
                                isToggled={isToggled}
                            />
                        </div>
                    </div>
                </main>
            </div>
        );
    }
}
