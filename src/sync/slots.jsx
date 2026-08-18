import { HISTORY_LIMIT } from '../limits.js';
import { Icon, glyphOf } from './icons.jsx';
import { ago, expiryOf, verdictOf } from './format.js';
import { linkOf, needsOf } from './provider.js';

export function Need({ need, value, reveal, onInput, onReveal, onSubmit }) {
    const verdict = need.secret ? verdictOf(value) : { tone: '', text: '' };

    return (
        <div className="sync-need">
            <label className="sync-fl" htmlFor={`sync-${need.name}`}>{need.label}</label>
            <div className="sync-inputwrap">
                <input
                    id={`sync-${need.name}`}
                    className="sync-input"
                    type={need.secret && !reveal ? 'password' : 'text'}
                    value={value}
                    placeholder={need.placeholder || ''}
                    onInput={(e) => onInput(need.name, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { onSubmit(); } }}
                    autoComplete="off"
                    autoCorrect="off"
                    spellcheck={false}
                />
                {need.secret && (
                    <button
                        type="button"
                        className="sync-reveal"
                        onClick={onReveal}
                        aria-label={reveal ? 'Hide the token' : 'Show the token'}
                    >
                        {reveal ? Icon.eyeOff : Icon.eye}
                    </button>
                )}
            </div>
            <p className={`sync-verdict ${verdict.tone}`} aria-live="polite">
                {verdict.text
                    ? (
                        <>
                            {verdict.tone === 'is-good' && Icon.check}
                            {verdict.text}
                        </>
                    )
                    : need.hint}
                {need.link && (
                    <a className="sync-link" href={need.link.href} target="_blank" rel="noopener noreferrer">
                        {need.link.label}
                        {Icon.external}
                    </a>
                )}
            </p>
        </div>
    );
}

export function Setup({ provider, credentials, reveal, stage, onInput, onReveal, onConnect }) {
    const needs = needsOf(provider);
    const secret = needs.find(need => need.secret);
    const ready = needs.every(need => (credentials[need.name] || '').trim() !== '');

    return (
        <div className="sync-slot-body is-setup">
            {needs.map(need => (
                <Need
                    key={need.name}
                    need={need}
                    value={credentials[need.name] || ''}
                    reveal={reveal}
                    onInput={onInput}
                    onReveal={onReveal}
                    onSubmit={onConnect}
                />
            ))}
            {secret?.warning && (
                <p className="sync-guard">
                    {Icon.shield}
                    <span>
                        {secret.warning}
                        <em>Sealed here until you disconnect — safe from other sites, not from this page.</em>
                    </span>
                </p>
            )}
            <button
                type="button"
                className="sync-btn is-primary is-wide"
                onClick={onConnect}
                disabled={!ready || Boolean(stage)}
            >
                {stage === 'connect' && <span className="sync-spinner" aria-hidden="true"></span>}
                {stage === 'connect' ? 'Checking…' : 'Connect'}
            </button>
        </div>
    );
}

export function Live({ provider, status, stage, pending, onSync, onDisconnect }) {
    const link = linkOf(provider, status.target);
    const busy = Boolean(stage);
    const expiry = expiryOf(status.expires);

    return (
        <div className="sync-slot-body">
            <dl className="sync-rows">
                <div>
                    <dt>{provider.id === 'gist' ? 'Gist' : 'Store'}</dt>
                    <dd className="sync-mono">
                        {status.target
                            ? (link
                                ? <a href={link} target="_blank" rel="noopener noreferrer">{status.target}</a>
                                : status.target)
                            : 'created on the first sync'}
                    </dd>
                </div>
                <div>
                    <dt>Last sync</dt>
                    <dd>{ago(status.lastSync)}</dd>
                </div>
                <div>
                    <dt>Waiting here</dt>
                    <dd>{pending ? 'changes not sent yet' : 'nothing'}</dd>
                </div>
                {expiry && (
                    <div>
                        <dt>Key</dt>
                        <dd className={expiry.tone === 'is-warn' ? 'sync-warn' : ''}>{expiry.text}</dd>
                    </div>
                )}
            </dl>
            <div className="sync-acts">
                <button type="button" className="sync-btn is-quiet" onClick={onSync} disabled={busy}>
                    {stage === 'sync' ? <span className="sync-spinner" aria-hidden="true"></span> : Icon.sync}
                    {stage === 'sync' ? 'Syncing…' : 'Sync now'}
                </button>
                <button type="button" className="sync-btn is-danger" onClick={onDisconnect} disabled={busy}>
                    Disconnect
                </button>
            </div>
        </div>
    );
}

export function Candidates({ candidates, onChoose }) {
    return (
        <div className="sync-slot-body">
            <p className="sync-note">More than one store here holds UUIDConv UI data. Pick the one this browser should use.</p>
            <ul className="sync-targets">
                {candidates.map(candidate => (
                    <li key={candidate.targetId}>
                        <button type="button" className="sync-target" onClick={() => onChoose(candidate.targetId)}>
                            <span>{candidate.targetId}</span>
                            <small>{candidate.label}{candidate.updatedAt ? ` · ${candidate.updatedAt}` : ''}</small>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function Chip({ live, busy, failing }) {
    if (!live) {
        return <span className="sync-chip">Connect</span>;
    }

    if (busy) {
        return <span className="sync-chip"><span className="sync-spinner" aria-hidden="true"></span>Syncing</span>;
    }

    if (failing) {
        return <span className="sync-chip is-warn"><span className="sync-dot"></span>Needs attention</span>;
    }

    return <span className="sync-chip is-on"><span className="sync-dot"></span>In sync</span>;
}

export function SlotHead({ id, label, note, open, chip, onPick }) {
    return (
        <button type="button" className="sync-slot-top" onClick={() => onPick(id)} aria-expanded={open}>
            <span className="sync-glyph">{glyphOf(id)}</span>
            <span className="sync-slot-text">
                <span className="sync-slot-name">{label}</span>
                <span className="sync-slot-note">{note}</span>
            </span>
            {chip}
        </button>
    );
}

export function BrowserSlot({ item, field, open, onPick, onExport, onImport, fileRef }) {
    const tags = field.tags > 0 ? ` · ${field.tags} ${field.tags === 1 ? 'tag' : 'tags'}` : '';
    const full = field.total >= HISTORY_LIMIT;
    const note = field.total > 0
        ? `${field.total} ${field.total === 1 ? 'row' : 'rows'}${tags}${full ? ' · full' : ''}`
        : 'Everything lives here. Take it out as a file, or bring one in.';

    return (
        <div className={`sync-slot is-always ${open ? 'is-open' : ''}`}>
            <SlotHead
                id={item.id}
                label={item.label}
                note={note}
                open={open}
                onPick={onPick}
                chip={<span className="sync-chip is-on"><span className="sync-dot"></span>Always on</span>}
            />
            {open && (
                <div className="sync-slot-body">
                    <div className="sync-acts">
                        <button type="button" className="sync-btn is-quiet" onClick={onExport}>
                            {Icon.down}
                            Export
                        </button>
                        <button
                            type="button"
                            className="sync-btn is-quiet"
                            onClick={() => fileRef.current && fileRef.current.click()}
                        >
                            {Icon.up}
                            Import
                        </button>
                        <input
                            ref={(node) => { fileRef.current = node; }}
                            type="file"
                            accept="application/json,.json"
                            className="sr-only"
                            onChange={onImport}
                        />
                    </div>
                    <p className="sync-note">
                        {full
                            ? `The newest ${HISTORY_LIMIT} conversions are kept here and the oldest now fall off as you work. Starred rows stay whole, whatever the count.`
                            : `Keeps the newest ${HISTORY_LIMIT} conversions; past that the oldest fall off. Starred rows are kept whole.`}
                    </p>
                    <p className="sync-note">
                        Export writes everything here to uuid-ui-backup.json. Import merges a file back in — it never replaces.
                    </p>
                </div>
            )}
        </div>
    );
}
