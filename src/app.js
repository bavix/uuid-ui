import { useState, useEffect } from 'preact/hooks';
import React from 'preact/compat';
import { Toaster } from 'sonner';
import InputComponent, {Item} from "./input.js"
import HistoryComponent from "./history.js"
import NavComponent from './nav.js'
import './app.css'

export default class AppComponent extends React.Component {
    state = {
        items: [],
        favorites: {}, // { listName: [items] }
    }

    componentDidMount() {
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
                        if (Array.isArray(regionItems) && regionItems.length > 0) {
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
                            
                            if (validItems.length > 0) {
                                favorites[listName] = validItems;
                            }
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
                const itemsToSave = this.state.items.slice(0, 100).map(item => ({
                    input: item.input,
                    output: item.output,
                    info: item.info
                }));
                localStorage.setItem('uuidItems', JSON.stringify(itemsToSave));
            } catch (e) {
                console.error('Error saving items to localStorage:', e);
            }
            
            this.syncFavoritesWithHistory(prevState.items, this.state.items);
        }
    }

    syncFavoritesWithHistory = (prevItems, currentItems) => {
        const { favorites } = this.state;
        let favoritesChanged = false;
        const newFavorites = { ...favorites };
        
        const currentItemKeys = new Set(
            currentItems.map(item => `${item.input}:${item.output}`)
        );
        
        for (const [listName, favItems] of Object.entries(newFavorites)) {
            const updatedFavItems = favItems
                .map(favItem => {
                    const itemKey = `${favItem.input}:${favItem.output}`;
                    const matchingHistoryItem = currentItems.find(histItem => 
                        histItem.input === favItem.input && histItem.output === favItem.output
                    );
                    
                    if (!matchingHistoryItem) {
                        favoritesChanged = true;
                        return null;
                    }
                    
                    if (matchingHistoryItem.info !== favItem.info) {
                        favoritesChanged = true;
                        return matchingHistoryItem;
                    }
                    return favItem;
                })
                .filter(item => item !== null);
            
            if (updatedFavItems.length !== favItems.length) {
                favoritesChanged = true;
            }
            
            if (updatedFavItems.length === 0) {
                delete newFavorites[listName];
                favoritesChanged = true;
            } else {
                newFavorites[listName] = updatedFavItems;
            }
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
        const existingIndex = newFavorites[trimmedListName].findIndex(favItem => 
            `${favItem.input}:${favItem.output}` === itemKey
        );
        
        if (existingIndex >= 0) {
            newFavorites[trimmedListName][existingIndex] = item;
        } else {
            newFavorites[trimmedListName] = [...newFavorites[trimmedListName], item];
        }
        
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
        
        const listBecameEmpty = newFavorites[trimmedListName].length === 0;
        if (listBecameEmpty) {
            delete newFavorites[trimmedListName];
        }
        
        this.setState({ favorites: newFavorites }, () => {
            this.saveFavoritesToStorage(newFavorites);
            
            if (listBecameEmpty && this.historyComponentRef) {
                this.historyComponentRef.handleFilterChange('all');
            }
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

    deleteFavoriteList = (listName) => {
        if (!listName || !listName.trim()) {
            console.warn('deleteFavoriteList: invalid listName', listName);
            return;
        }

        const { favorites } = this.state;
        const trimmedListName = listName.trim();
        
        if (!favorites[trimmedListName]) {
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
                
                if (items.length > 0) {
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

    restoreFromGist = (restoredItems, restoredFavorites) => {
        const items = (restoredItems || []).map(item => {
            return new Item(
                item.input || '',
                item.output || '',
                item.info || ''
            );
        });

        const favorites = {};
        for (const [listName, listItems] of Object.entries(restoredFavorites || {})) {
            if (Array.isArray(listItems) && listItems.length > 0) {
                favorites[listName] = listItems.map(item => 
                    new Item(
                        item.input || '',
                        item.output || '',
                        item.info || ''
                    )
                );
            }
        }

        this.setState({ items, favorites }, () => {
            this.saveFavoritesToStorage(favorites);
        });
    }

    render() {
        const [isToggled, setToggle] = useState(() => {
            try {
                return JSON.parse(localStorage.getItem('theme') || 'false');
            } catch {
                return false;
            }
        });

        useEffect(() => {
            try {
                localStorage.setItem('theme', JSON.stringify(isToggled));
                document.documentElement.classList.toggle('dark', isToggled);
            } catch (e) {
            }
        }, [isToggled]);

        const { items } = this.state;
        
        return (
            <div className={`uuid-ui--wrapper flex-1 ${isToggled ? 'bg-gray-900' : 'bg-white'}`}>
                <Toaster 
                    position="top-right"
                    richColors
                    closeButton
                    theme={isToggled ? "dark" : "light"}
                />
                <NavComponent 
                    isToggled={isToggled} 
                    setToggle={setToggle}
                    items={items}
                    favorites={this.state.favorites}
                    onRestore={this.restoreFromGist}
                />
                <div className={`container mx-auto py-6 max-w-7xl px-4 ${isToggled ? 'text-gray-100' : 'text-gray-900'}`}>
                    <div className="flex flex-col lg:flex-row">
                        <div className="w-full lg:w-3/5 flex-shrink-0" id="input-cp">
                            <InputComponent 
                                items={items} 
                                setItems={(items) => this.setState({items})}
                                isToggled={isToggled}
                            />
                        </div>
                        <div className="w-full lg:w-2/5 flex-shrink-0 max-w-full overflow-hidden lg:pl-4 flex flex-col m-0 p-0 mt-4 lg:mt-0" id="history-cp">
                            <HistoryComponent 
                                ref={(ref) => { this.historyComponentRef = ref; }}
                                items={items} 
                                clearItems={() => {
                                    this.setState({items: []});
                                }} 
                                clearAll={() => {
                                    this.setState({items: [], favorites: {}});
                                }}
                                setItems={(items) => this.setState({items})}
                                favorites={this.state.favorites}
                                addToFavorites={this.addToFavorites}
                                removeFromFavorites={this.removeFromFavorites}
                                createFavoriteList={this.createFavoriteList}
                                deleteFavoriteList={this.deleteFavoriteList}
                                isToggled={isToggled}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
