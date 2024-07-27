import React from 'react'
import InputComponent, {Item} from "./input.jsx"
import HistoryComponent from "./history.jsx"
import NavComponent from './nav.jsx'
import '@creativebulma/bulma-tooltip/dist/bulma-tooltip.css'
import 'bulma/css/bulma.css'
import './app.css'

export default class AppComponent extends React.Component {
    /**
     * The state of the AppComponent.
     * It contains an array of items, which represents the history of conversions.
     * @type {Object}
     */
    state = {
        /**
         * The array of items representing the history of conversions.
         * @type {Array}
         */
        items: [],
    }

    /**
     * Constructor for the AppComponent.
     * It calls the constructor of the parent class.
     * @param {Object} props - The properties passed to the component.
     */
    constructor(props) {
        super(props);
    }

    /**
     * ComponentDidMount lifecycle hook.
     * It gets the items from localStorage and sets the state.
     */
    componentDidMount() {
        const itemsFromLocalStorage = JSON.parse(localStorage.getItem('uuidItems')) || [];

        let newItem
        const items = {}
        for (const item of itemsFromLocalStorage) {
            newItem = new Item(item.input, item.output, item.info)
            items[newItem.toString()] = newItem
        }

        this.setState({ items: Object.values(items) });
    }

    /**
     * ComponentDidUpdate lifecycle hook.
     * It saves the items to localStorage when the state changes.
     * @param {Object} prevProps - The previous props.
     * @param {Object} prevState - The previous state.
     */
    componentDidUpdate(prevProps, prevState) {
        let newState = [...this.state.items].slice(0, 100) 
        if (prevState.items !== newState) {
            localStorage.setItem('uuidItems', JSON.stringify(newState));
        }
    }

    /**
     * Render method for the AppComponent.
     *
     * This method returns a div containing two columns: the input and history components.
     * The input component is contained in a column with class 'is-three-fifths' and id 'input-cp'.
     * The history component is contained in a column with class 'is-two-fifths is-narrow' and id 'history-cp'.
     *
     * @returns {JSX.Element} The rendered AppComponent.
     */
    render() {
        // Get the items from the component's state
        const { items } = this.state;
        
        return (
            // Wrapper div for the AppComponent
            <div className="uuid-ui--wrapper">
                {/* Navigation component */}
                <NavComponent />
                {/* Container div with a margin-top class */}
                <div className="container margin-top">
                    {/* Columns div with a centered layout */}
                    <div className="columns is-centered">
                        {/* Input column */}
                        <div className="column is-three-fifths" id="input-cp">
                            {/* Input component with items and setItems props */}
                            <InputComponent 
                                items={items} 
                                setItems={(items) => this.setState({items})} 
                            />
                        </div>
                        {/* History column */}
                        <div className="column is-two-fifths is-narrow" id="history-cp">
                            {/* History component with items prop */}
                            <HistoryComponent items={items} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
