import React from 'react';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

export default class HistoryComponent extends React.Component {
    /**
     * Constructor for the HistoryComponent.
     *
     * @param {Object} props - The properties passed to the component.
     */
    constructor(props) {
        super(props);
        // Call the parent class constructor with the passed props
    }

    /**
     * Copies the text of the clicked <a> tag to the clipboard and displays a success message.
     *
     * @param {Event} e - The event object containing the clicked <a> tag.
     */
    copy = (e) => {
        // Get the text content of the clicked <a> tag
        const text = e.target.innerText;

        // Copy the text to the clipboard
        navigator.clipboard.writeText(text)
            .then(() => {
                // Display a success message
                Notify.success('Text ' + text + ' copied');
            })
            .catch((error) => {
                // Display an error message if the copy operation fails
                Notify.failure('Error copying text: ' + error);
            });
    }

    /**
     * Render method for the HistoryComponent.
     * It returns a navigation panel (<nav>) with a heading "History" and a list of items.
     * Each item is a panel block (<div>) with a field (<div>) containing two tags (<a>).
     * 
     * @returns {JSX.Element} The rendered HistoryComponent.
     */
    render({ items }, { }) {
        return (
            <nav className="panel is-dark">
                {/* Panel heading */}
                <p className="panel-heading">History</p>
                {/* List of items */}
                { [...items].slice(0, 30).map(i =>
                    <div key={i.toString()} className="panel-block">
                        {/* Field containing two tags */}
                        <div className="field">
                            {/* Output tag */}
                            <div className="tags">
                                <a href="javascript:" onClick={this.copy} className="tag is-link is-light" data-tooltip={i.info}>{ i.output }</a>
                            </div>
                            {/* Input tag */}
                            <div className="tags">
                                <a href="javascript:" onClick={this.copy} className="tag is-primary is-light" data-tooltip={i.info}>{ i.input }</a>
                            </div>
                        </div>
                    </div>
                ) }
            </nav>
        );
    }
}
