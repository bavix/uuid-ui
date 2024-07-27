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
            /*
             * The outermost div for the AppComponent.
             * It has the class 'uuid-ui--wrapper' to style it.
             */
            <div className="uuid-ui--wrapper">
                {/* Navigation component */}
                {/* The navigation component at the top of the AppComponent. */}
                <NavComponent />
                {/* Container div with a margin-top class */}
                <div className="container margin-top">
                    {/* Columns div with a centered layout */}
                    {/* The div that contains two columns: input and history. */}
                    <div className="columns is-centered">
                        {/* Input column */}
                        /*
                         * The column that contains the input component.
                         * It has the classes 'column is-three-fifths' to style it.
                         * It has the id 'input-cp' to identify it.
                         */
                        <div className="column is-three-fifths" id="input-cp">
                            {/* Input component with items and setItems props */}
                            {/*
                             * The input component that allows users to enter UUIDs.
                             * It receives the items from the state and a function to update the state.
                             */}
                            <InputComponent 
                                items={items} 
                                setItems={(items) => this.setState({items})} 
                            />
                        </div>
                        {/* History column */}
                        /*
                         * The column that contains the history component.
                         * It has the classes 'column is-two-fifths is-narrow' to style it.
                         * It has the id 'history-cp' to identify it.
                         */
                        <div className="column is-two-fifths is-narrow" id="history-cp">
                            {/* History component with items prop */}
                            {/*
                             * The history component that displays the entered UUIDs.
                             * It receives the items from the state and a function to clear the state.
                             */}
                            <HistoryComponent items={items} clearItems={() => this.setState({items: []})} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
