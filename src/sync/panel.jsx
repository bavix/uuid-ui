import React from 'preact/compat';
import { toast } from 'sonner';
import { sharedController } from './controller.js';
import { DEFAULT_PROVIDER, listProviders, loadProvider } from './registry.js';
import { describeError, needsOf } from './provider.js';
import SyncField, { selectField } from './field.jsx';
import { Icon } from './icons.jsx';
import { countOf } from './format.js';
import { BrowserSlot, Candidates, Chip, Live, Setup, SlotHead } from './slots.jsx';

const NOTES = {
    browser: 'Everything lives here. Take it out as a file, or bring one in.',
    gist: 'A private gist on your account. Needs a token.',
};

export default class SyncPanel extends React.Component {
    constructor(props) {
        super(props);

        this.controller = sharedController({ store: props.store, bus: props.bus, state: props.syncState });
        this.fileRef = { current: null };

        const status = this.controller.status();

        this.state = {
            providers: listProviders(),
            provider: null,
            openId: status.connected ? status.providerId : DEFAULT_PROVIDER,
            credentials: {},
            reveal: false,
            candidates: [],
            stage: null,
            error: null,
            errorFor: null,
            status,
            wave: false,
        };
    }

    componentDidMount() {
        if (this.props.onController) {
            this.props.onController(this.controller);
        }

        const active = this.state.status.providerId;

        if (active && active !== 'browser') {
            this.loadProvider(active);
        } else {
            this.loadProvider(DEFAULT_PROVIDER);
        }

        this.stopListening = [this.props.bus.on('sync-state', this.onSyncState)];
    }

    componentWillUnmount() {
        this.gone = true;

        for (const stop of this.stopListening || []) {
            stop();
        }

        if (this.waveTimer) {
            clearTimeout(this.waveTimer);
        }
    }

    onSyncState = (payload) => {
        if (payload.status === 'working') {
            this.startWave();
        }

        this.refresh();
    }

    startWave = () => {
        if (this.waveTimer) {
            clearTimeout(this.waveTimer);
        }

        this.setState({ wave: true });
        this.waveTimer = setTimeout(() => {
            this.waveTimer = null;
            this.setState({ wave: false });
        }, 800);
    }

    loadProvider = (providerId) => {
        loadProvider(providerId)
            .then(provider => this.setState({ provider }, this.settle))
            .catch(() => this.setState({ error: 'That store could not be loaded. Reload the page and try again.', errorFor: providerId }));
    }

    openDialog = (node) => {
        this.dialog = node;

        if (node && !node.open) {
            node.showModal();
            this.settle();
            node.addEventListener('click', (e) => {
                if (e.target === node) {
                    this.close();
                }
            });
            node.addEventListener('cancel', this.dismiss);
            node.addEventListener('close', this.dismiss);
            node.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.close();
                }
            });
        }
    }

    dismiss = () => {
        if (this.closing) {
            return;
        }

        this.closing = true;
        this.props.onClose();
    }

    settle = () => {
        const node = this.dialog;
        const held = document.activeElement;

        if (!node || this.gone) {
            return;
        }

        if (held && held !== node && held !== node.querySelector('.modal-close') && node.contains(held)) {
            return;
        }

        this.focusFirst(node);
    }

    focusFirst = (node) => {
        const field = node.querySelector('.sync-input');

        if (field) {
            field.focus();
            return;
        }

        node.focus();
    }

    close = () => {
        if (this.dialog && this.dialog.open) {
            this.dialog.close();
        }

        this.dismiss();
    }

    refresh = () => {
        if (this.gone) {
            return;
        }

        this.setState({ status: this.controller.status() });
    }

    pick = (providerId) => {
        if (this.state.openId === providerId) {
            this.setState({ openId: null });
            return;
        }

        this.setState({ openId: providerId, error: null, errorFor: null });

        const always = this.state.providers.find(item => item.id === providerId)?.always;

        if (!always && (!this.state.provider || this.state.provider.id !== providerId)) {
            this.loadProvider(providerId);
        }
    }

    setCredential = (name, value) => {
        this.setState(held => ({ credentials: { ...held.credentials, [name]: value }, error: null, errorFor: null }));
    }

    connect = () => {
        const { provider, credentials } = this.state;
        const filled = {};

        for (const need of needsOf(provider)) {
            filled[need.name] = (credentials[need.name] || '').trim();
        }

        this.setState({ stage: 'connect', error: null });

        this.controller.connect(provider.id, filled, true)
            .then(({ account, found }) => {
                if (this.gone) {
                    return;
                }

                this.setState({ stage: null, credentials: {}, candidates: found.length > 1 ? found : [] });
                this.refresh();

                if (this.props.onController) {
                    this.props.onController(this.controller);
                }

                toast.success(`Connected as ${account.name}`);
            })
            .catch(error => {
                if (this.gone) {
                    return;
                }

                this.setState({ stage: null, error: describeError(error, 'connect'), errorFor: provider.id });
                this.refresh();
            });
    }

    run = (what) => {
        this.setState({ stage: what, error: null, errorFor: null });
        this.startWave();

        this.controller[what]()
            .then(result => {
                if (this.gone) {
                    return;
                }

                this.setState({ stage: null });
                this.refresh();

                if (result.locked) {
                    toast.info('Another tab is syncing');
                    return;
                }

                if (result.skipped) {
                    toast.success('Already up to date');
                    return;
                }

                toast.success(result.merged || result.pushedBack ? 'Merged with the other browser' : 'Synced', {
                    description: countOf(result.summary),
                });
            })
            .catch(error => {
                if (this.gone) {
                    return;
                }

                this.setState({ stage: null, error: describeError(error), errorFor: this.state.status.providerId });
                this.refresh();
            });
    }

    choose = (targetId) => {
        this.controller.chooseTarget(targetId);
        this.setState({ candidates: [] });
        this.refresh();
    }

    disconnect = () => {
        this.controller.disconnect();
        this.setState({ credentials: {}, candidates: [], error: null, errorFor: null, openId: null });
        this.refresh();
        toast.success('Disconnected', { description: 'History and favorites stay in this browser.' });
    }

    exportFile = () => {
        try {
            const blob = new Blob([this.controller.exportSnapshot()], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = 'uuid-ui-backup.json';
            link.click();
            URL.revokeObjectURL(url);

            toast.success('Backup saved', { description: 'uuid-ui-backup.json' });
        } catch (error) {
            this.setState({ error: 'Could not build the backup file.', errorFor: 'browser' });
        }
    }

    importFile = (event) => {
        const file = event.target.files && event.target.files[0];

        event.target.value = '';

        if (!file) {
            return;
        }

        file.text()
            .then(text => this.controller.importSnapshot(text))
            .then(summary => {
                this.refresh();

                if (!this.gone) {
                    toast.success('Backup merged', { description: countOf(summary) });
                }
            })
            .catch(error => this.setState({ error: describeError(error, 'connect'), errorFor: 'browser' }));
    }

    renderStore(item, field) {
        const { status, provider, openId, candidates, stage, errorFor, credentials, reveal } = this.state;
        const live = status.connected && status.providerId === item.id;
        const open = openId === item.id;
        const ready = provider && provider.id === item.id;

        return (
            <div key={item.id} className={`sync-slot ${live ? 'is-live' : ''} ${open && !live ? 'is-open' : ''}`}>
                <SlotHead
                    id={item.id}
                    label={item.label}
                    note={live && status.account ? status.account : this.offer(item, field)}
                    open={open}
                    onPick={this.pick}
                    chip={open && !live
                        ? null
                        : <Chip live={live} busy={stage === 'sync' || status.busy} failing={errorFor === item.id} />}
                />
                {open && ready && (candidates.length > 0
                    ? <Candidates candidates={candidates} onChoose={this.choose} />
                    : (live
                        ? (
                            <Live
                                provider={provider}
                                status={status}
                                stage={stage}
                                pending={this.controller.pending()}
                                onSync={() => this.run('sync')}
                                onDisconnect={this.disconnect}
                            />
                        )
                        : (
                            <Setup
                                provider={provider}
                                credentials={credentials}
                                reveal={reveal}
                                stage={stage}
                                onInput={this.setCredential}
                                onReveal={() => this.setState({ reveal: !reveal })}
                                onConnect={this.connect}
                            />
                        )))}
            </div>
        );
    }

    offer(item, field) {
        if (field.total === 0) {
            return NOTES[item.id] || '';
        }

        const tags = field.tags > 0 ? ` · ${field.tags} ${field.tags === 1 ? 'tag' : 'tags'}` : '';

        return `${field.total} ${field.total === 1 ? 'row' : 'rows'}${tags} will go up`;
    }

    recovery() {
        const { errorFor, status } = this.state;

        if (!errorFor || errorFor === 'browser') {
            return null;
        }

        if (!status.connected) {
            return null;
        }

        if (!status.target) {
            return (
                <button type="button" className="sync-recover" onClick={() => this.run('sync')}>
                    Create a new store
                </button>
            );
        }

        return (
            <button type="button" className="sync-recover" onClick={this.reconnect}>
                Reconnect
            </button>
        );
    }

    reconnect = () => {
        this.controller.disconnect();
        this.setState({ credentials: {}, error: null, errorFor: null, openId: this.state.providers.find(item => !item.always)?.id || null });
        this.refresh();

        if (this.dialog) {
            this.focusFirst(this.dialog);
        }
    }

    render() {
        const { providers, error, status, wave, openId } = this.state;
        const field = selectField(this.props.data);

        return (
            <dialog ref={this.openDialog} aria-labelledby="sync-dialog-title" tabIndex={-1} className="modal-panel sync-modal">
                <div className="modal-head">
                    <div>
                        <p id="sync-dialog-title" className="modal-title">Sync</p>
                        <p className="modal-subtitle">
                            Each cell is one conversion, coloured by its format.
                        </p>
                    </div>
                    <button type="button" className="modal-close" onClick={this.close} aria-label="Close">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="sync-scroll">
                    <SyncField field={field} moving={wave || status.busy} />

                    <div className="sync-shelf">
                        {providers.map(item => (item.always
                            ? (
                                <BrowserSlot
                                    key={item.id}
                                    item={item}
                                    field={field}
                                    open={openId === item.id}
                                    onPick={this.pick}
                                    onExport={this.exportFile}
                                    onImport={this.importFile}
                                    fileRef={this.fileRef}
                                />
                            )
                            : this.renderStore(item, field)))}
                    </div>
                </div>

                {error && (
                    <p className="sync-alert" role="alert">
                        {error}
                        {this.recovery()}
                    </p>
                )}

                <div className="sync-foot">
                    <p>
                        {Icon.clock}
                        {status.connected
                            ? 'Syncs on every change and when you come back.'
                            : 'A connected store syncs on its own.'}
                    </p>
                    <button type="button" className="sync-btn is-quiet" onClick={this.close}>Done</button>
                </div>
            </dialog>
        );
    }
}
