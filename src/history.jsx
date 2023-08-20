import React from 'react';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

export default class HistoryComponent extends React.Component {
    constructor(props) {
        super(props)
    }

    copy = (e) => {
        navigator.clipboard.writeText(e.target.innerText)
        Notify.success('Text ' + e.target.innerText + ' copied');
    }

    render({ items }, { }) {
        return (
            <nav className="panel">
                <p className="panel-heading">History</p>
                { items.map(i =>
                    <div className="panel-block">
                        <div className="field">
                            <a href="javascript:" onClick={this.copy} className="tag is-link is-light">{ i.output }</a>

                            <div className="tags">
                                <a href="javascript:" onClick={this.copy} className="tag is-primary is-light">{ i.input }</a>
                            </div>
                        </div>
                    </div>
                ) }
            </nav>
        );
    }
}
