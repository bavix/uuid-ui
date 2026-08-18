import React from 'preact/compat';
import { toast } from 'sonner';
import { createSyncState } from './state.js';

const DOT = {
    off: 'dot-off',
    on: 'dot-good',
    pending: 'dot-warn',
    busy: 'dot-busy animate-pulse',
    failed: 'dot-danger',
};

export default class SyncButton extends React.Component {
    constructor(props) {
        super(props);
        this.syncState = props.syncState || createSyncState();
        this.state = { open: false, Panel: null, busy: false, connected: false, pending: false, failed: false };
    }

    componentDidMount() {
        this.refresh();
        this.stopSync = this.props.bus.on('sync-state', this.onSyncState);
        this.stopData = [this.props.bus.on('data', this.onLocalWrite)];
        this.startLive();
    }

    startLive = () => {
        const id = this.syncState.activeProvider();

        if (this.stopAuto || !id || !this.syncState.readSecret(id)) {
            return;
        }

        import('./controller.js')
            .then(({ sharedController, startLive }) => {
                this.controller = sharedController({
                    store: this.props.store,
                    bus: this.props.bus,
                    state: this.syncState,
                });

                this.stopAuto = startLive({ controller: this.controller, bus: this.props.bus, state: this.syncState });
            })
            .catch(() => {});
    }

    componentWillUnmount() {
        if (this.stopSync) {
            this.stopSync();
        }

        this.stopLive();

        for (const stop of this.stopData || []) {
            stop();
        }
    }

    onSyncState = (payload) => {
        this.setState({ busy: payload.status === 'working' });

        if (payload.status === 'failed') {
            this.setState({ failed: true });
        }

        if (payload.status === 'synced' || payload.status === 'connected') {
            this.setState({ pending: false, failed: false });
        }

        if (payload.status === 'disconnected') {
            this.stopLive();
            this.setState({ pending: false, busy: false, failed: false });
        }

        this.refresh();
    }

    stopLive = () => {
        if (this.stopAuto) {
            this.stopAuto();
            this.stopAuto = null;
        }
    }

    // Only whether something is connected: working out what is still unsent
    // means building the whole snapshot, and that is too much to do on every
    // keystroke. A local write marks the dot; a finished sync clears it.
    refresh = () => {
        const id = this.syncState.activeProvider();

        this.setState({ connected: Boolean(id && this.syncState.readSecret(id)) });
    }

    onLocalWrite = (payload = {}) => {
        if (!this.state.connected) {
            return;
        }

        if (payload.origin !== 'remote') {
            this.setState({ pending: true });
        }
    }

    open = () => {
        if (this.state.Panel) {
            this.setState({ open: true });
            return;
        }

        import('./panel.jsx')
            .then(module => this.setState({ Panel: module.default, open: true }))
            .catch(() => toast.error('Could not load the sync panel', {
                description: 'Check the connection and try again.',
            }));
    }

    close = () => {
        this.setState({ open: false });
        this.refresh();
        this.startLive();
    }

    takeController = (controller) => {
        this.controller = controller;
        this.refresh();
        this.startLive();
    }

    title() {
        if (!this.state.connected) {
            return 'Sync between browsers';
        }

        if (this.state.busy) {
            return 'Syncing…';
        }

        if (this.state.failed) {
            return 'Sync needs attention';
        }

        return this.state.pending ? 'Changes waiting to go out' : 'In sync';
    }

    dot() {
        if (this.state.busy) {
            return DOT.busy;
        }

        if (!this.state.connected) {
            return DOT.off;
        }

        if (this.state.failed) {
            return DOT.failed;
        }

        return this.state.pending ? DOT.pending : DOT.on;
    }

    render() {
        const { Panel, open } = this.state;

        return (
            <>
                <button
                    type="button"
                    onClick={this.open}
                    className="relative p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center surface-raised-bg hover-surface ink"
                    aria-label="Sync history and favorites between browsers"
                    title={this.title()}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M6.5 18a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 17.7 8.2 3.9 3.9 0 0 1 21 12a4 4 0 0 1-4 4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9.5 14.5 12 12l2.5 2.5M12 12v8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${this.dot()}`} aria-hidden="true"></span>
                </button>
                {open && Panel && (
                    <Panel
                        store={this.props.store}
                        bus={this.props.bus}
                        data={this.props.data}
                        syncState={this.syncState}
                        onController={this.takeController}
                        onClose={this.close}
                    />
                )}
            </>
        );
    }
}
