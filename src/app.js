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
    }

    componentDidMount() {
        try {
            const itemsFromLocalStorage = JSON.parse(localStorage.getItem('uuidItems') || '[]');
            const items = [];
            const seen = new Set();
            
            for (const item of itemsFromLocalStorage) {
                try {
                    const newItem = new Item(item.input, item.output, item.info);
                    const uniqueKey = `${newItem.input}:${newItem.output}:${newItem.info || ''}`;
                    if (!seen.has(uniqueKey)) {
                        seen.add(uniqueKey);
                        items.push(newItem);
                    }
                } catch (e) {
                }
            }

            this.setState({ items });
        } catch (e) {
            this.setState({ items: [] });
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
                const newState = [...this.state.items].slice(0, 100);
                localStorage.setItem('uuidItems', JSON.stringify(newState));
            } catch (e) {
            }
        }
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
                <NavComponent isToggled={isToggled} setToggle={setToggle} />
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
                                items={items} 
                                clearItems={() => this.setState({items: []})} 
                                setItems={(items) => this.setState({items})}
                                isToggled={isToggled}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
