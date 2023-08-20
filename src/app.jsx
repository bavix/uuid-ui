import React from 'react'
import InputComponent from "./input.jsx"
import HistoryComponent from "./history.jsx"

export default class AppComponent extends React.Component {
    state = {
        items: [],
    }

    constructor(props) {
        super(props);
    }

    render({ }, { items }) {
        return (
            <div className="columns is-centered">
                <div className="column is-three-fifths" id="input-cp">
                    <InputComponent items={items} setItems={(items) => this.setState({items})} />
                </div>
                <div className="column is-two-fifths is-narrow" id="history-cp">
                    <HistoryComponent items={items} />
                </div>
            </div>
        );
    }
}
