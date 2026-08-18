import React from 'preact/compat';
import { DARK, LIGHT, SYSTEM, applyTheme, variantOf } from './theme.js';
import { listThemes } from './themes/index.js';
import { FLOORS, gradeTheme } from './themes/contrast.js';
import {
    CUSTOM_PALETTE,
    applyCustom,
    clearCustom,
    readTheme as readCustom,
    writeTheme as writeCustom,
} from './themes/custom.js';

const MODES = [
    { id: SYSTEM, label: 'System' },
    { id: LIGHT, label: 'Light' },
    { id: DARK, label: 'Dark' },
];

/**
 * How the theme on screen scores against the floors the shipped themes clear.
 * Each pair has its own floor — an accent is a control, not body text — so a
 * single 4.5 across all of them called a perfectly readable theme low.
 */
function scoreOn(root = document.documentElement) {
    const style = getComputedStyle(root);
    const tokens = Object.fromEntries(FLOORS.flatMap(([ink, surface]) => [ink, surface])
        .map(name => [name, style.getPropertyValue(`--${name}`).trim()]));
    const { worstText, failures } = gradeTheme(tokens);

    return { worst: worstText, failed: failures.length > 0 };
}

/** A theme somebody wrote shows up in the list like any other. */
function customItem(theme) {
    const row = (tokens) => [
        tokens?.surface ?? 'var(--surface)',
        tokens?.accent ?? 'var(--accent)',
        tokens?.['fmt-uuid'] ?? 'var(--fmt-uuid)',
    ];
    const light = theme.variants?.light ?? theme.variants?.dark ?? theme.tokens;
    const dark = theme.variants?.dark ?? theme.variants?.light ?? theme.tokens;

    return {
        id: CUSTOM_PALETTE,
        name: theme.name,
        blurb: 'Yours, pasted in.',
        swatch: { light: row(light), dark: row(dark) },
    };
}

/**
 * The drawer of themes: a tab at the right edge, and a panel that slides out of
 * it. Not a modal — the page behind stays live, because the page *is* the
 * preview: hovering a theme paints the whole app in it, and moving away puts
 * the chosen one back.
 */
export default class AppearanceDrawer extends React.Component {
    state = { open: false, previewing: null, score: null, editing: false, draft: '', problems: [], note: '' };

    componentDidMount() {
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('pointerdown', this.onPointerDown, true);
        this.dialogs = new MutationObserver(() => {
            if (this.state.open && document.querySelector('dialog[open]')) {
                this.stopPreview();
                this.setState({ open: false });
            }
        });
        this.dialogs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
        this.measure();
    }

    componentWillUnmount() {
        this.dialogs?.disconnect();
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('pointerdown', this.onPointerDown, true);
        clearTimeout(this.signatureTimer);
        document.documentElement.classList.remove('theme-switching');
        this.stopPreview();
    }

    measure = () => {
        this.setState({ score: scoreOn() });
    };

    /** The built-in themes, plus the one somebody wrote if there is one. */
    themes = () => {
        const list = listThemes();

        return this.props.custom ? [...list, customItem(this.props.custom)] : list;
    };

    onKeyDown = (e) => {
        if (e.key === 'Escape' && this.state.open) {
            this.stopPreview();
            this.setState({ open: false });
            this.handle?.focus();
        }
    };

    onPointerDown = (e) => {
        if (!this.state.open || this.panel?.contains(e.target) || this.handle?.contains(e.target)) {
            return;
        }

        this.stopPreview();
        this.setState({ open: false });
    };

    toggle = () => {
        this.setState(({ open }) => ({ open: !open }));
    };

    /** Puts a theme on the page: the built-in part, then anything hand-written. */
    paint = (theme) => {
        applyTheme(theme, document.documentElement, window);

        if (theme.palette === CUSTOM_PALETTE && this.props.custom) {
            applyCustom(this.props.custom, document.documentElement);
        } else {
            clearCustom(document.documentElement);
        }

        this.measure();
    };

    /** Paints the page in a theme without keeping it. */
    preview = (palette) => {
        this.setState({ previewing: palette });
        this.paint({ palette, mode: this.props.theme.mode });
    };

    stopPreview = () => {
        if (this.state.previewing === null) {
            return;
        }

        this.setState({ previewing: null });
        this.paint(this.props.theme);
    };

    choose = (palette) => {
        this.setState({ previewing: null });
        this.props.onPalette(palette);
        this.signature();
        this.measure();
    };

    chooseMode = (mode) => {
        this.props.onMode(mode);
        this.signature();
        setTimeout(this.measure, 0);
    };

    /** Hands the theme on screen over as text, and opens it for editing. */
    copy = () => {
        const shown = this.state.previewing ?? this.props.theme.palette;
        const text = shown === CUSTOM_PALETTE && this.props.customText
            ? this.props.customText
            : writeCustom(document.documentElement, `${this.nameOfShown()} copy`);

        navigator.clipboard?.writeText(text).catch(() => {});
        this.setState({ editing: true, draft: text, problems: [], note: 'Copied. Edit the values and apply.' });
        setTimeout(this.toEditor, 0);
    };

    nameOfShown = () => {
        const shown = this.state.previewing ?? this.props.theme.palette;

        return this.themes().find(item => item.id === shown)?.name ?? 'Theme';
    };

    /** Opens the text at its start, not wherever the caret would land. */
    toEditor = () => {
        this.editor?.focus();
        this.editor?.setSelectionRange(0, 0);

        if (this.editor) {
            this.editor.scrollTop = 0;
        }
    };

    startEditing = () => {
        this.setState(({ editing }) => ({ editing: !editing, note: '', problems: [] }));
        setTimeout(this.toEditor, 0);
    };

    onDraft = (e) => {
        this.setState({ draft: e.target.value });
    };

    applyDraft = () => {
        const { theme, problems } = readCustom(this.state.draft);
        const said = [...problems];
        let kept = 0;

        for (const mode of theme?.modes ?? []) {
            kept += Object.keys(theme.variants[mode]).length;

            for (const fail of gradeTheme(theme.variants[mode]).failures) {
                said.push(`${theme.modes.length > 1 ? `${mode}: ` : ''}${fail.what}: ${fail.ratio.toFixed(1)}:1, ${fail.floor}:1 is the floor.`);
            }
        }

        this.setState({ problems: said, note: theme ? `Kept ${kept} tokens.` : '' });

        if (!theme) {
            return;
        }

        this.props.onCustom(this.state.draft);

        if (theme.modes.length === 1) {
            this.props.onMode(theme.mode);
        }

        this.choose(CUSTOM_PALETTE);
    };

    dropCustom = () => {
        this.props.onCustom('');
        this.setState({ editing: false, draft: '', problems: [], note: '' });

        if (this.props.theme.palette === CUSTOM_PALETTE) {
            this.choose('default');
        }
    };

    /** Lets the theme mark its own arrival, for as long as it asks. */
    signature = () => {
        const root = document.documentElement;

        clearTimeout(this.signatureTimer);
        root.classList.remove('theme-switching');
        // Reading offsetWidth restarts the animation; without it a second
        // choice in the same second plays nothing.
        void root.offsetWidth;
        root.classList.add('theme-switching');

        this.signatureTimer = setTimeout(() => root.classList.remove('theme-switching'), 600);
    };

    /** Up and down walk the list and try each theme on; Enter keeps it. */
    onListKeyDown = (e) => {
        const themes = this.themes();
        const shown = this.state.previewing ?? this.props.theme.palette;
        const at = Math.max(0, themes.findIndex(theme => theme.id === shown));

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();

            const next = themes[(at + (e.key === 'ArrowDown' ? 1 : themes.length - 1)) % themes.length];

            this.preview(next.id);
            this.list?.querySelector(`[data-theme-id="${next.id}"]`)?.focus();

            return;
        }

        if (e.key === 'Home' || e.key === 'End') {
            e.preventDefault();

            const next = e.key === 'Home' ? themes[0] : themes[themes.length - 1];

            this.preview(next.id);
            this.list?.querySelector(`[data-theme-id="${next.id}"]`)?.focus();
        }
    };

    render() {
        const { theme, custom } = this.props;
        const { open, previewing, score, editing, draft, problems, note } = this.state;
        const shown = previewing ?? theme.palette;
        const variant = variantOf(theme, window);
        const at = MODES.findIndex(mode => mode.id === theme.mode);

        return (
            <>
                <button
                    type="button"
                    ref={(node) => { this.handle = node; }}
                    className={`appearance-handle ${open ? 'is-open' : ''}`}
                    onClick={this.toggle}
                    aria-expanded={open}
                    aria-controls="appearance-drawer"
                    title="Themes"
                >
                    <span className="appearance-handle-swatch" aria-hidden="true">
                        <i style={{ background: 'var(--surface-raised)' }}></i>
                        <i style={{ background: 'var(--accent)' }}></i>
                        <i style={{ background: 'var(--fmt-uuid)' }}></i>
                    </span>
                    <span className="sr-only">Themes</span>
                </button>

                <aside
                    id="appearance-drawer"
                    ref={(node) => { this.panel = node; }}
                    className={`appearance-drawer ${open ? 'is-open' : ''}`}
                    aria-label="Appearance"
                    aria-hidden={!open}
                    onMouseLeave={this.stopPreview}
                >
                    <div className="appearance-head">
                        <p className="modal-title">Appearance</p>
                        <button type="button" className="modal-close" onClick={this.toggle} aria-label="Close">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className="appearance-body">
                        <p className="appearance-label">Mode</p>
                        <div className="appearance-modes" role="group" aria-label="Mode" style={{ '--mode-at': at }}>
                            <span className="appearance-mode-thumb" aria-hidden="true"></span>
                            {MODES.map(mode => (
                                <button
                                    key={mode.id}
                                    type="button"
                                    className={`appearance-mode ${theme.mode === mode.id ? 'is-on' : ''}`}
                                    aria-pressed={theme.mode === mode.id}
                                    onClick={() => this.chooseMode(mode.id)}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                        <p className="appearance-note">
                            {theme.mode === SYSTEM
                                ? `Following this machine — ${variant} right now.`
                                : `Held on ${theme.mode}, whatever the machine says.`}
                        </p>

                        <p className="appearance-label">Theme</p>
                        <div
                            className="appearance-list"
                            role="listbox"
                            aria-label="Theme"
                            ref={(node) => { this.list = node; }}
                            onKeyDown={this.onListKeyDown}
                        >
                            {this.themes().map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    role="option"
                                    data-theme-id={item.id}
                                    aria-selected={theme.palette === item.id}
                                    className={`appearance-item ${shown === item.id ? 'is-shown' : ''} ${theme.palette === item.id ? 'is-on' : ''}`}
                                    onMouseEnter={() => this.preview(item.id)}
                                    onFocus={() => this.preview(item.id)}
                                    onMouseLeave={this.stopPreview}
                                    onBlur={this.stopPreview}
                                    onClick={() => this.choose(item.id)}
                                >
                                    {/* Day over night: a theme is two things, and the
                                        choice should show both of them. */}
                                    <span className="appearance-swatch" aria-hidden="true">
                                        {['light', 'dark'].map(mode => (
                                            <span key={mode} className="appearance-swatch-row">
                                                {(item.swatch[mode] ?? item.swatch.dark ?? []).map((colour, i) => (
                                                    <i key={i} style={{ background: colour }}></i>
                                                ))}
                                            </span>
                                        ))}
                                    </span>
                                    <span className="appearance-name">
                                        {item.name}
                                        <span className="appearance-blurb">{item.blurb}</span>
                                    </span>
                                    {theme.palette === item.id && (
                                        <svg className="appearance-tick" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                            <path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>

                        <p className="appearance-label">Your own</p>
                        <div className="appearance-tools">
                            <button type="button" className="appearance-tool" onClick={this.copy}>
                                Copy this one
                            </button>
                            <button
                                type="button"
                                className="appearance-tool"
                                onClick={this.startEditing}
                                aria-expanded={editing}
                            >
                                {editing ? 'Hide editor' : 'Paste a theme'}
                            </button>
                        </div>

                        {editing && (
                            <div className="appearance-editor">
                                <textarea
                                    ref={(node) => { this.editor = node; }}
                                    className="appearance-draft"
                                    value={draft}
                                    onInput={this.onDraft}
                                    spellcheck={false}
                                    rows={8}
                                    aria-label="Theme as JSON"
                                    placeholder={'{ "name": "Mine", "mode": "dark", "tokens": { "accent": "#7dd3fc" } }'}
                                />
                                <div className="appearance-tools">
                                    <button type="button" className="appearance-tool is-strong" onClick={this.applyDraft}>
                                        Apply
                                    </button>
                                    {custom && (
                                        <button type="button" className="appearance-tool" onClick={this.dropCustom}>
                                            Remove
                                        </button>
                                    )}
                                </div>
                                {note !== '' && <p className="appearance-note">{note}</p>}
                                {problems.length > 0 && (
                                    <ul className="appearance-problems">
                                        {problems.map(problem => <li key={problem}>{problem}</li>)}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="appearance-foot-block">
                        <p className={`appearance-contrast ${score?.failed ? 'is-low' : ''}`}>
                            {score?.worst == null
                                ? ''
                                : score.failed
                                    ? `Below the floor · ${score.worst.toFixed(1)}:1`
                                    : score.worst >= 7
                                        ? `Contrast AAA · ${score.worst.toFixed(1)}:1`
                                        : `Contrast AA · ${score.worst.toFixed(1)}:1`}
                        </p>
                        <p className="appearance-foot">
                            {/* A phone has no hover and the sheet sits below the
                                page, so the sentence has to change with it. */}
                            <span className="on-hover">Hover a theme to try it on. The page behind is the preview.</span>
                            <span className="on-touch">Tap a theme to keep it. The page above is the preview.</span>
                        </p>
                    </div>
                </aside>
            </>
        );
    }
}
