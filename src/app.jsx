import React from 'preact/compat';
import { Toaster } from 'sonner';
import InputComponent, {Item} from "./input.jsx"
import { INT_TYPE_NAMES, SIGNED } from './int-type.js'
import HistoryComponent from "./history.jsx"
import NavComponent from './nav.jsx'
import { TYPE_HIGH_LOW } from './type-detector.js'
import { readIntType, readTarget, writeState } from './url-state.js'
import { HISTORY_LIMIT } from './limits.js'
import { watchSequence } from './key-sequence.js'
import { readActiveSeconds, trackActiveTime } from './active-time.js'
import { mountEggsButton } from './eggs-button.js'
import { readStoredTheme, writeStoredTheme } from './theme.js'
import { trackEgg } from './analytics.js'
import { uuidRain } from './effects.js'
import { toast } from 'sonner'
import './app.css'

const EGGS_AFTER_SECONDS = 60 * 60;

function currentTheme() {
    // The inline script in index.html has already decided and applied this
    // before first paint; read back what it did so the two never disagree.
    return readStoredTheme() ?? document.documentElement.classList.contains('dark');
}

export default class AppComponent extends React.Component {
    state = {
        items: [],
        favorites: {}, // { listName: [items] }
        isToggled: currentTheme(),
        // Shown only once the tool has actually been worked in for an hour.
        // Read at mount: someone who earned it yesterday should not have to wait
        // for the first tick of a timer today.
        eggsUnlocked: readActiveSeconds() >= EGGS_AFTER_SECONDS,
        // A game takes over the history panel, the way Space Runner always has:
        // it is something to play beside the converter, not on top of it.
        panelGame: null,
        // Lifted out of InputComponent so the history panel can name the format
        // it is showing. A result is meaningless without its target format.
        resultType: readTarget() ?? TYPE_HIGH_LOW,
        intType: readIntType() ?? SIGNED,
    }

    setResultType = (resultType, onApplied) => {
        this.setState({ resultType }, () => {
            writeState(this.state);
            if (onApplied) {
                onApplied();
            }
        });
    }

    // Someone editing #to= by hand, or following a second link, should land on
    // that format rather than on whatever was selected before.
    handleHashChange = () => {
        const target = readTarget();
        const int = readIntType();
        const next = {};

        if (target !== null && target !== this.state.resultType) {
            next.resultType = target;
        }

        if (int !== null && int !== this.state.intType) {
            next.intType = int;
        }

        if (Object.keys(next).length > 0) {
            this.setState(next);
        }
    }

    setIntType = (intType, onApplied) => {
        this.setState({ intType }, () => {
            writeState(this.state);
            if (onApplied) {
                onApplied();
            }
        });
    }

    setToggle = (isToggled) => {
        this.setState({ isToggled }, () => this.applyTheme());
    }

    applyTheme = () => {
        // Written on mount as well as on a toggle, so a value left by the old
        // build turns into a word the first time the page is opened.
        writeStoredTheme(this.state.isToggled);
        document.documentElement.classList.toggle('dark', this.state.isToggled);
    }

    componentDidMount() {
        this.applyTheme();
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

        this.stopWatchingRain = watchSequence(['r', 'a', 'i', 'n'], () => {
            trackEgg('rain', 'typed');
            uuidRain(6000);
            toast.success('🕹️ Secret unlocked!', {
                description: 'Hex rain. It stops on its own.',
                duration: 4000,
            });
        });

        try {
            const itemsFromLocalStorage = JSON.parse(localStorage.getItem('uuidItems') || '[]');
            const items = [];
            const seen = new Set();
            
            for (const item of itemsFromLocalStorage) {
                try {
                    if (!item || typeof item !== 'object') {
                        continue;
                    }
                    
                    const newItem = new Item(
                        item.input || '',
                        item.output || '',
                        item.info || ''
                    );
                    const uniqueKey = `${newItem.input}:${newItem.output}:${newItem.info || ''}`;
                    if (!seen.has(uniqueKey)) {
                        seen.add(uniqueKey);
                        items.push(newItem);
                    }
                } catch (e) {
                    console.warn('Error loading item from storage:', e, item);
                }
            }

            let favorites = {};
            try {
                const favoritesFromStorage = JSON.parse(localStorage.getItem('uuidFavorites') || '{}');
                if (favoritesFromStorage && typeof favoritesFromStorage === 'object') {
                    for (const [listName, regionItems] of Object.entries(favoritesFromStorage)) {
                        if (Array.isArray(regionItems)) {
                            const validItems = regionItems.map(item => {
                                try {
                                    if (!item || typeof item !== 'object') {
                                        return null;
                                    }
                                    return new Item(
                                        item.input || '',
                                        item.output || '',
                                        item.info || ''
                                    );
                                } catch (e) {
                                    console.warn('Error creating Item from favorites storage:', e, item);
                                    return null;
                                }
                            }).filter(item => item !== null);

                            favorites[listName] = validItems;
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading favorites from localStorage:', e);
            }

            this.setState({ items, favorites });
        } catch (e) {
            console.error('Error in componentDidMount:', e);
            this.setState({ items: [], favorites: {} });
        }
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this.handleHashChange);

        if (this.stopTrackingTime) {
            this.stopTrackingTime();
        }

        if (this.stopWatchingRain) {
            this.stopWatchingRain();
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

    componentDidUpdate(prevProps, prevState) {
        const itemsChanged = prevState.items.length !== this.state.items.length || 
            prevState.items.some((item, idx) => {
                const currentItem = this.state.items[idx];
                if (!currentItem) return true;
                return item.input !== currentItem.input || 
                       item.output !== currentItem.output || 
                       item.info !== currentItem.info;
            });
        
        if (itemsChanged) {
            try {
                const itemsToSave = this.state.items.slice(0, HISTORY_LIMIT).map(item => ({
                    input: item.input,
                    output: item.output,
                    info: item.info
                }));
                localStorage.setItem('uuidItems', JSON.stringify(itemsToSave));
            } catch (e) {
                console.error('Error saving items to localStorage:', e);
            }
            
            this.syncFavoritesWithHistory(this.state.items);
        }
    }

    // Favorites are their own collection, not a view over history. A starred
    // item survives "Clear history" and survives falling past the history cap;
    // only its comment follows the history entry it came from.
    syncFavoritesWithHistory = (currentItems) => {
        const { favorites } = this.state;
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
            this.setState({ favorites: newFavorites }, () => {
                this.saveFavoritesToStorage(newFavorites);
            });
        }
    }

    addToFavorites = (item, listName) => {
        if (!item || !listName || !listName.trim()) {
            console.warn('addToFavorites: invalid item or listName', { item, listName });
            return;
        }

        const { favorites } = this.state;
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
        
        this.setState({ favorites: newFavorites }, () => {
            this.saveFavoritesToStorage(newFavorites);
        });
    }

    removeFromFavorites = (item, listName) => {
        if (!item || !listName || !listName.trim()) {
            console.warn('removeFromFavorites: invalid item or listName', { item, listName });
            return;
        }

        const { favorites } = this.state;
        const trimmedListName = listName.trim();
        
        if (!favorites[trimmedListName] || favorites[trimmedListName].length === 0) {
            return;
        }
        
        const newFavorites = { ...favorites };
        const itemKey = `${item.input}:${item.output}`;
        newFavorites[trimmedListName] = newFavorites[trimmedListName].filter(favItem => 
            `${favItem.input}:${favItem.output}` !== itemKey
        );
        
        this.setState({ favorites: newFavorites }, () => {
            this.saveFavoritesToStorage(newFavorites);
        });
    }

    // Deleting a tag is now something the user asks for, not a side effect of
    // unstarring the last item in it.
    deleteFavoriteList = (listName) => {
        const trimmedListName = (listName || '').trim();
        const { favorites } = this.state;

        if (!trimmedListName || !(trimmedListName in favorites)) {
            return;
        }

        const newFavorites = { ...favorites };
        delete newFavorites[trimmedListName];

        this.setState({ favorites: newFavorites }, () => {
            this.saveFavoritesToStorage(newFavorites);

            if (this.historyComponentRef) {
                this.historyComponentRef.handleFilterChange('all');
            }
        });
    }

    restoreFavoriteList = (listName, items) => {
        const trimmedListName = (listName || '').trim();
        if (!trimmedListName || !Array.isArray(items)) {
            return;
        }

        const newFavorites = { ...this.state.favorites, [trimmedListName]: [...items] };
        this.setState({ favorites: newFavorites }, () => {
            this.saveFavoritesToStorage(newFavorites);
        });
    }

    createFavoriteList = (listName) => {
        if (!listName || !listName.trim()) {
            console.warn('createFavoriteList: invalid listName', listName);
            return;
        }

        const { favorites } = this.state;
        const trimmedListName = listName.trim();
        
        if (!favorites[trimmedListName]) {
            const newFavorites = { ...favorites, [trimmedListName]: [] };
            this.setState({ favorites: newFavorites }, () => {
                this.saveFavoritesToStorage(newFavorites);
            });
        }
    }

    saveFavoritesToStorage = (favoritesToSave) => {
        if (!favoritesToSave || typeof favoritesToSave !== 'object') {
            console.error('saveFavoritesToStorage: invalid favorites object', favoritesToSave);
            return;
        }

        try {
            const serialized = {};
            for (const [listName, items] of Object.entries(favoritesToSave)) {
                if (!Array.isArray(items)) {
                    console.warn(`saveFavoritesToStorage: items for list "${listName}" is not an array`, items);
                    continue;
                }
                
                {
                    serialized[listName] = items.map(item => {
                        if (!item || typeof item !== 'object') {
                            console.warn('saveFavoritesToStorage: invalid item', item);
                            return null;
                        }
                        return {
                            input: item.input || '',
                            output: item.output || '',
                            info: item.info || ''
                        };
                    }).filter(item => item !== null);
                }
            }
            
            localStorage.setItem('uuidFavorites', JSON.stringify(serialized));
        } catch (e) {
            console.error('Error saving favorites to localStorage:', e);
        }
    }

    render() {
        const { items, isToggled, resultType, intType } = this.state;

        return (
            <div className="uuid-ui--wrapper flex-1 bg-white dark:bg-gray-900">
                {/* Bottom-right: at top-right it landed on the History header
                    and covered the newest result it was announcing. */}
                <Toaster
                    position="bottom-right"
                    richColors
                    closeButton
                    theme={isToggled ? "dark" : "light"}
                />
                <NavComponent
                    isToggled={isToggled}
                    setToggle={this.setToggle}
                />
                <main className="container mx-auto py-6 max-w-7xl px-4 text-gray-900 dark:text-gray-100">
                    <h1 className="sr-only">Convert UUIDs between formats</h1>
                    <div className="flex flex-col lg:flex-row">
                        <div className="w-full lg:w-3/5 shrink-0" id="input-cp">
                            <InputComponent
                                items={items}
                                setItems={(items) => this.setState({items})}
                                resultType={resultType}
                                intType={intType}
                                setResultType={this.setResultType}
                                setIntType={this.setIntType}
                            />
                        </div>
                        <div className="w-full lg:w-2/5 shrink-0 max-w-full overflow-hidden lg:pl-4 flex flex-col m-0 p-0 mt-4 lg:mt-0" id="history-cp">
                            <HistoryComponent 
                                ref={(ref) => { this.historyComponentRef = ref; }}
                                items={items} 
                                clearItems={() => {
                                    this.setState({items: []});
                                }}
                                setItems={(items) => this.setState({items})}
                                resultType={resultType}
                                intTypeName={INT_TYPE_NAMES[intType]}
                                favorites={this.state.favorites}
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
