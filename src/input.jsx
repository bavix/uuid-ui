import React from 'preact/compat';
import { SIGNED, intTypeList } from './int-type.js';

const SPLIT_ICON = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h5l6 10h5M4 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 4l3 3-3 3M17 14l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const JOIN_ICON = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h5l6 10h5M4 17h5l2-3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 14l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

import { toast } from 'sonner';
import { createConfetti, createMagneticFieldEffect, createPulseWaveEffect, formatHues, hueOf, startNumberGuessingGame, shakeElement, stillPreferred } from './effects.js';
import { trackEgg } from './analytics.js';
import { specialValues } from './special-values.js';
import { commentIndex, extractComment, stripComment } from './comment.js';
import { READ_CEILING, markText, readable } from './input-marks.js';
import { unquote } from './quotes.js';
import { HISTORY_LIMIT } from './limits.js';
import { normalizeInput } from './normalize-input.js';
import { takeGroups } from './fresh-lines.js';
import { MAX_BYTES, MAX_LINES, fileIsText, sizeIsFine, textOf } from './dropped-file.js';

const HEIGHT_KEY = 'uuid.inputHeight';
import { mergeItems } from './merge-items.js';
import { toUuid } from './to-uuid.js';
import { TYPE_BASE64, TYPE_UUID, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, TYPE_WORDS, typeDetector, uuidTypeList } from "./type-detector.js";
import { uuidToBytesString } from "./uuid-bytes.js";
import { uuidToWords } from "./uuid-words.js";
import { uuidToInts, uuidToUints } from "./uuid-high-low.js";
import { uuidToBase64Std } from "./base64.js";
import { STYLE_PLAIN, styleUuid } from './uuid-style.js';
import { hasCase, spell, spellingsOf, usesInts } from './spellings.js';
import { readingName } from './int-convention.js';
import { createCycle } from './placeholder-cycle.js';
import { makeExample } from './placeholder-examples.js';
import { uuidToUlid } from './uuid-ulid.js';

const FORMAT_CLASS = {
    [TYPE_UUID]: 'type-uuid',
    [TYPE_BASE64]: 'type-base64',
    [TYPE_HIGH_LOW]: 'type-highlow',
    [TYPE_BYTES]: 'type-bytes',
    [TYPE_ULID]: 'type-ulid',
    [TYPE_WORDS]: 'type-words',
};



export class Item {
    constructor(input, output, info, convention = null) {
        this.input = input;
        this.output = output;
        this.info = info;

        if (convention?.readAs) {
            this.readAs = convention.readAs;
        }

        if (convention?.writeAs) {
            this.writeAs = convention.writeAs;
        }
    }

    toString() {
        return `${this.input}:${this.output}`;
    }
}

function readInformerClosed() {
    try {
        return JSON.parse(localStorage.getItem('informerClosed') || 'false');
    } catch {
        return false;
    }
}

export default class InputComponent extends React.Component {
    state = {
        text: '',
        isClosedInformer: readInformerClosed(),
        ghost: '',
        typing: false,
    }

    componentDidMount() {
        this.startGhost();
        document.addEventListener('visibilitychange', this.onVisibility);
        this.watchHeight();
    }

    componentWillUnmount() {
        this.stopGhost();
        document.removeEventListener('visibilitychange', this.onVisibility);
        this.heights?.disconnect();
        clearTimeout(this.heightTimer);
    }

    watchHeight = () => {
        const box = document.getElementById('input-area');

        if (!box || typeof ResizeObserver === 'undefined') {
            return;
        }

        try {
            const held = Number(localStorage.getItem(HEIGHT_KEY));

            if (Number.isFinite(held) && held >= 120 && held <= 1600) {
                box.style.height = `${held}px`;
            }
        } catch (e) {
        }

        this.heights = new ResizeObserver(([entry]) => {
            const held = entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height;

            clearTimeout(this.heightTimer);

            this.heightTimer = setTimeout(() => {
                try {
                    localStorage.setItem(HEIGHT_KEY, String(Math.round(held)));
                } catch (e) {
                }
            }, 400);
        });

        this.heights.observe(box);
    }

    onVisibility = () => {
        if (document.visibilityState === 'visible') {
            this.startGhost();
        } else {
            this.stopGhost();
        }
    }

    startGhost = () => {
        this.setState({ typing: false });

        if (this.ghostTimer !== undefined || stillPreferred()) {
            return;
        }

        this.cycle = this.cycle ?? createCycle({ source: () => makeExample() });

        const tick = () => {
            const wait = this.cycle.step();

            this.setState({ ghost: this.cycle.text() });
            this.ghostTimer = setTimeout(tick, wait);
        };

        this.ghostTimer = setTimeout(tick, 400);
    }

    stopGhost = () => {
        this.setState({ typing: true });

        if (this.ghostTimer !== undefined) {
            clearTimeout(this.ghostTimer);
            this.ghostTimer = undefined;
        }
    }

    clearInput = () => {
        const box = document.getElementById('input-area');

        if (!box) {
            return;
        }

        box.focus();
        box.setSelectionRange(0, box.value.length);

        try {
            if (document.execCommand('delete') && box.value === '') {
                return;
            }
        } catch (e) {
        }

        this.setState({ text: '' });
    }

    onDragOver = (e) => {
        if (![...(e.dataTransfer?.types ?? [])].includes('Files')) {
            return;
        }

        e.preventDefault();

        if (!this.state.dropping) {
            this.setState({ dropping: true });
        }
    }

    onDragLeave = (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) {
            return;
        }

        this.setState({ dropping: false });
    }

    onDrop = (e) => {
        const file = e.dataTransfer?.files?.[0];

        if (!file) {
            return;
        }

        e.preventDefault();
        this.setState({ dropping: false });

        if (!fileIsText(file)) {
            toast.error('Only a text file', { description: `${file.name} is not a list of identifiers.` });

            return;
        }

        if (!sizeIsFine(file)) {
            toast.error('That file is too big', {
                description: `${Math.round(file.size / 1024)} KB — ${Math.round(MAX_BYTES / 1024)} KB is the most.`,
            });

            return;
        }

        const reader = new FileReader();

        reader.onerror = () => toast.error('That file could not be read');
        reader.onload = () => this.takeDropped(String(reader.result), file.name);
        reader.readAsText(file);
    }

    takeDropped = (raw, name) => {
        const { text, problem, dropped } = textOf(raw);

        if (problem) {
            toast.error(problem, { description: name });

            return;
        }

        if (dropped > 0) {
            toast.info(`Took the first ${MAX_LINES}`, {
                description: `${name} has ${dropped} more line${dropped === 1 ? '' : 's'}.`,
            });
        }

        const held = this.state.text;
        const joined = held.trim() === '' ? text : `${held.replace(/\n?$/, '\n')}${text}`;

        this.setState({ text: joined }, () => this.handle(joined, true));
    }

    marks(text) {
        if (this.marked?.text === text) {
            return this.marked.nodes;
        }

        const rows = markText(text);
        const nodes = rows === null ? null : rows.map((row, at) => (
            <span key={at}>
                {row.bad ? <mark className="input-bad">{row.code}</mark> : row.code}
                {row.note !== '' && <mark className="input-note">{row.note}</mark>}
                {at === rows.length - 1 ? '' : '\n'}
            </span>
        ));

        this.marked = { text, nodes };

        return nodes;
    }

    onTextareaScroll = (e) => {
        if (this.mirror) {
            this.mirror.scrollTop = e.target.scrollTop;
            this.mirror.scrollLeft = e.target.scrollLeft;
        }
    }

    onTextareaKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            this.convertNow();
        }
    }

    convertNow = () => {
        const { text } = this.state;
        if (!text.trim()) {
            return;
        }

        this.consumed = '';
        this.handle(text, true);
    }

    closeInformer = () => {
        this.setState({ isClosedInformer: true });

        try {
            localStorage.setItem('informerClosed', 'true');
        } catch (e) {
        }
    }

    constructor(props) {
        super(props);
        this.resultTypeClickCount = 0;
        this.intTypeClickCount = 0;
        this.lastResultTypeClick = null;
        this.lastIntTypeClick = null;
        this.lastConfettiTime = 0;
        this.confettiThrottle = 500;
        this.isPasting = false;
        this.consumed = '';
    }

    onKeyboardInput = (e) => {
        const text = e.target.value
        const pasted = this.isPasting
        this.isPasting = false

        this.setState({ text })

        // Typing converts on the closing newline; a paste converts as soon as
        // it contains one, even without a trailing newline.
        if (pasted ? text.includes('\n') : text.endsWith('\n')) {
            this.handle(text, pasted)
        }
    }

    // preact/compat maps onChange to the input event, so this always runs
    // before onKeyboardInput sees the pasted value.
    onPaste = () => {
        this.isPasting = true
    }

    handle = (text, whole = false) => {
        const { groups, consumed } = takeGroups(this.consumed, text, whole);

        this.consumed = consumed;

        if (groups.length === 0) {
            return;
        }

        this.addItems(groups.map(group => ({
            text: group.block ? this.moveCommentsToEnd(group.text) : group.text,
            line: group.line,
        })));
    }

    moveCommentsToEnd(block) {
        const lines = block.split('\n');
        const comments = [];
        const codeLines = [];

        for (const line of lines) {
            const comment = extractComment(line);
            if (comment !== null) {
                codeLines.push(stripComment(line).trimEnd());
                comments.push(comment);
            } else {
                codeLines.push(line.trimEnd());
            }
        }

        return codeLines.join('\n') + (comments.length ? ` // ${comments.join(' ')}` : '');
    }

    // The badges are the quiet half of the easter eggs. Reported once per kind
    // per session, and by kind only: which curiosity was met, never the value.
    seenMarkers = new Set()

    reportMarkers = (converted) => {
        for (const item of converted) {
            for (const marker of specialValues(item.input)) {
                if (!this.seenMarkers.has(marker)) {
                    this.seenMarkers.add(marker);
                    trackEgg(marker, 'converted');
                }
            }
        }
    }

    addGenerated = (values) => {
        const converted = []

        for (const value of values) {
            const obj = this.newItem(value, true)
            if (obj !== null) {
                converted.push(obj)
            }
        }

        if (converted.length === 0) {
            return
        }

        this.props.setItems(mergeItems(converted, this.props.items))
        this.reportMarkers(converted)
    }

    addItems = (items) => {
        const converted = []

        for (const item of items) {
            if (stripComment(item.text).trim() === '') {
                continue
            }

            const obj = this.newItem(item.text, false, item.line)
            if (obj !== null) {
                converted.push(obj)
            }
        }

        // The block goes on top of the list, and inside the block the lines keep
        // the order they were written in: reversing them put the first line of a
        // paste at the bottom, which is not where anybody looks for it.
        const merged = mergeItems(converted, this.props.items)

        this.props.setItems(merged)

        // A paste larger than the history can hold used to lose the oldest rows
        // without a word. They are dropped from this browser only — nothing is
        // deleted anywhere else.
        const dropped = merged.length - HISTORY_LIMIT

        if (dropped > 0) {
            toast.info(`History keeps the newest ${HISTORY_LIMIT}`, {
                description: `${dropped} older row${dropped === 1 ? '' : 's'} dropped from this browser.`,
                duration: 5000,
            });
        }

        this.reportMarkers(converted)

        // Below lg the history panel sits under a tall column of controls, so a
        // successful conversion used to produce no visible change at all.
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
            const panel = document.getElementById('history-cp');
            if (panel) {
                requestAnimationFrame(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            }
        }
    }

    newItem = (line, quiet = false, at = null) => {
        try {
            const { input, comment } = this.parse(line)

            const target = uuidTypeList()[this.props.resultType] || 'the selected format'
            const where = typeof at === 'number' ? `Line ${at}: ` : '';

            const nInput = normalizeInput(input)
            if (nInput === null) {
                // Naming the accepted shapes is the only documentation a failed
                // line ever gets; "Failed to process string" named none of them.
                if (!quiet) {
                    toast.error('Not a recognized identifier', {
                        description: `${where}${line} — expected a UUID, base64, ULID, high/low pair or byte array`
                    });
                }
                return null
            }

            const uuid = this.castToUuid(input)
            const output = uuid === null ? null : this.castFromUuid(uuid)
            const nOutput = output === null ? null : this.normalizeOutput(output)

            // Conversion helpers return null on malformed input; without this
            // the line used to disappear with no feedback at all.
            if (nOutput === null) {
                if (!quiet) {
                    toast.error(`Cannot convert to ${target}`, {
                        description: `${where}${line}`
                    });
                }
                return null
            }

            if (nInput === nOutput) {
                if (!quiet) {
                    toast.warning(`Already ${target}`, {
                        description: `${where}${line}`
                    });
                }
                return null
            }

            return new Item(nInput, nOutput, comment, this.conventionOf(input, nOutput))
        } catch (e) {
            return null
        }
    }

    parse = (line) => {
        const comment = extractComment(line);
        const input = unquote(stripComment(line));

        if (comment !== null) {
            return { input: input.toString(), comment: comment.toString() }
        }

        return { input: input.toString(), comment: undefined }
    }

    // The output is already in the shape the chosen format asks for; only the
    // formats that have several legal spellings go through the normalizer.
    normalizeOutput = (output) => {
        const { resultType } = this.props

        if (resultType === TYPE_UUID) {
            return output
        }

        return this.spellOutput(normalizeInput(output))
    }

    castToUuid = (input) => {
        return toUuid(input, this.props.intType)
    }

    castFromUuid = (uuid) => {
        const { resultType, writeIntType, intType } = this.props
        const outInt = writeIntType ?? intType

        switch (resultType) {
            case TYPE_BYTES:
                return uuidToBytesString(uuid);
            case TYPE_HIGH_LOW: {
                const u = outInt === SIGNED ? uuidToInts(uuid) : uuidToUints(uuid)
                return u === null ? null : JSON.stringify(u)
            }
            case TYPE_WORDS: {
                const words = uuidToWords(uuid, outInt === SIGNED)
                return words === null ? null : JSON.stringify(words)
            }
            case TYPE_BASE64:
                return uuidToBase64Std(uuid)
            case TYPE_ULID:
                return uuidToUlid(uuid)
        }

        return styleUuid(uuid, this.props.uuidStyle, this.props.uuidUpper)
    }

    conventionOf(input, output) {
        const { resultType, intType, writeIntType } = this.props;
        const held = {};

        if (usesInts(typeDetector(input))) {
            held.readAs = readingName(intType);
        }

        if (usesInts(resultType)) {
            held.writeAs = readingName(writeIntType ?? intType);
        }

        return held;
    }

    spellOutput = (output) => {
        return spell(this.props.resultType, output, this.props.uuidStyle, this.props.uuidUpper)
    }

    setResultType = (type, event) => {
        const { text } = this.state
        const { resultType } = this.props
        const now = Date.now();
        
        if (type === resultType) {
            if (this.lastResultTypeClick && now - this.lastResultTypeClick > 2000) {
                this.resultTypeClickCount = 0;
            }
            
            this.resultTypeClickCount++;
            this.lastResultTypeClick = now;
            
            if (this.resultTypeClickCount === 5) {
                trackEgg('magnetic-field', 'clicked');
                this.resultTypeClickCount = 0;
                
                const now = Date.now();
                if (now - this.lastConfettiTime >= this.confettiThrottle) {
                    this.lastConfettiTime = now;
                    
                    let targetElement = null;
                    if (event && event.target) {
                        targetElement = event.target.closest('.choice-cell, .custom-radio');
                    }
                    
                    if (!targetElement) {
                        const radioButtons = document.querySelectorAll('.fmt-chips .choice-cell, .custom-radio');
                        // uuidTypeList() is indexed by bitmask (1/2/4/8/16) while the
                        // rendered radios are a dense list, so count the entries before it.
                        const typeIndex = uuidTypeList().filter((_, idx) => idx < resultType).length;
                        if (radioButtons[typeIndex]) {
                            targetElement = radioButtons[typeIndex];
                        }
                    }
                    
                    if (targetElement) {
                        const hue = hueOf(targetElement);

                        createPulseWaveEffect(targetElement, 2000, hue);
                        setTimeout(() => {
                            createMagneticFieldEffect(targetElement, 3000);
                        }, 200);

                        const rect = targetElement.getBoundingClientRect();
                        const hues = formatHues();

                        createConfetti(
                            rect.left + rect.width / 2,
                            rect.top + rect.height / 2,
                            hue ? [hue, hue, ...hues] : hues,
                            24,
                        );
                    }
                    
                    toast.success('🧲 Secret unlocked!', {
                        description: 'Magnetic field activated! All types are attracted to your choice!',
                        duration: 5000,
                    });
                }
            }
        } else {
            this.resultTypeClickCount = 0;
            this.lastResultTypeClick = null;
        }
        
        this.props.setResultType(type, () => {
            if (text.trim()) {
                this.consumed = ''
                this.handle(text, true)
            }
        })
    }

    renderIntSegments(name, value, onPick, labelledBy = null) {
        const options = intTypeList().reduce((list, label, type) => [...list, { label, type }], []);
        const at = options.findIndex(option => option.type === value);

        return (
            <span
                className="int-seg"
                role="radiogroup"
                aria-labelledby={labelledBy || undefined}
                aria-label={labelledBy ? undefined : 'Integer type'}
                style={{ '--int-seg-count': options.length }}
            >
                <span
                    className="int-seg-thumb"
                    aria-hidden="true"
                    style={{ transform: `translateX(${Math.max(0, at) * 100}%)` }}
                ></span>
                {options.map(({ label, type }) => (
                    <label key={type} className={`int-seg-item choice-cell ${value === type ? 'is-on' : ''}`}>
                        <input
                            type="radio"
                            name={name}
                            checked={value === type}
                            onChange={(e) => onPick(type, e)}
                            onClick={(e) => { if (value === type) { onPick(type, e); } }}
                        />
                        <span>{label}</span>
                    </label>
                ))}
            </span>
        );
    }

    spelling() {
        const held = this.props.uuidStyle;
        const options = spellingsOf(this.props.resultType);

        return options.some(option => option.id === held) ? held : (options[0]?.id ?? STYLE_PLAIN);
    }

    setUuidStyle = (style) => {
        const { text } = this.state;

        this.props.setUuidStyle(style, () => {
            if (text.trim()) {
                this.consumed = '';
                this.handle(text, true);
            }
        });
    }

    setUuidCase = (upper) => {
        const { text } = this.state;

        this.props.setUuidUpper(upper, () => {
            if (text.trim()) {
                this.consumed = '';
                this.handle(text, true);
            }
        });
    }

    setWriteIntType = (type) => {
        const { text } = this.state

        this.props.setWriteIntType(type, () => {
            if (text.trim()) {
                this.consumed = ''
                this.handle(text, true)
            }
        })
    }

    swapIntTypes = () => {
        const { intType, writeIntType } = this.props;
        const { text } = this.state;
        const read = writeIntType ?? intType;

        this.props.setWriteIntType(intType, () => {
            this.props.setIntType(read, () => {
                if (text.trim()) {
                    this.consumed = '';
                    this.handle(text, true);
                }
            });
        });
    }

    toggleIntLink = () => {
        const { text } = this.state

        this.props.toggleIntLink(() => {
            if (text.trim()) {
                this.handle(text)
            }
        })
    }

    setIntType = (type, event) => {
        const { text } = this.state
        const { intType } = this.props
        const now = Date.now();
        
        if (type === intType) {
            if (this.lastIntTypeClick && now - this.lastIntTypeClick > 700) {
                this.intTypeClickCount = 0;
            }

            if (document.querySelector('dialog[data-modal="guess"]')) {
                this.intTypeClickCount = 0;
            }

            this.intTypeClickCount++;
            this.lastIntTypeClick = now;
            
            if (this.intTypeClickCount === 5) {
                trackEgg('guess-the-number', 'clicked');
                this.intTypeClickCount = 0;

                shakeElement('#input-cp', 15, 600);
                
                setTimeout(() => {
                    startNumberGuessingGame((won, attempts, targetNumber) => {
                        trackEgg('guess-the-number', won ? 'won' : 'lost');

                        if (won) {
                            toast.success('🎮 You won!', {
                                description: `Congratulations! You guessed the number in ${attempts} attempt${attempts > 1 ? 's' : ''}!`,
                                duration: 5000,
                            });
                            
                            createConfetti(window.innerWidth / 2, 100);
                        } else {
                            toast.info('🎮 Game Over', {
                                description: `The number was ${targetNumber}. Better luck next time!`,
                                duration: 5000,
                            });
                        }
                    });
                }, 300);
                
                toast.success('🔢 Secret unlocked!', {
                    description: 'Number guessing game activated!',
                    duration: 3000,
                });
            }
        } else {
            this.intTypeClickCount = 0;
            this.lastIntTypeClick = null;
        }
        
        this.props.setIntType(type, () => {
            if (text.trim()) {
                this.consumed = ''
                this.handle(text, true)
            }
        })
    }

    intHint(linked, readInt, writeInt, writes) {
        if (!writes) {
            return 'Reading applies to pairs and words in the input. This format writes no integers.';
        }

        if (linked) {
            return 'Pairs and words are read and written the same way.';
        }

        if (readInt === writeInt) {
            return 'Both ends agree — set them apart to convert between the two conventions.';
        }

        return 'The identifier stays the same; only the way it is written changes.';
    }

    render({ resultType, intType, writeIntType, intLinked }, { isClosedInformer, text }) {
        const writes = resultType === TYPE_HIGH_LOW || resultType === TYPE_WORDS;
        const rows = text.split('\n').filter(line => line.trim() !== '');
        const lines = rows.length;
        const ghostCut = commentIndex(this.state.ghost);
        const known = lines > 0 && lines <= READ_CEILING ? readable(rows) : lines;

        return (
            <div className="space-y-5">
                {!isClosedInformer && (
                    <div className="informer border rounded-xl p-4 relative shadow-sm">
                        <button 
                            className="informer-close absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110"
                            onClick={this.closeInformer}
                            aria-label="Close"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="flex items-start space-x-2 pr-8">
                            <svg className="informer-icon w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="informer-text text-sm leading-relaxed">
                                This project is provided "as is". Updates will only be made when absolutely necessary.
                            </p>
                        </div>
                    </div>
                )}

                <div className="relative">
                    <fieldset
                        className={`input-frame ${this.state.dropping ? 'is-dropping' : ''}`}
                        onDragOver={this.onDragOver}
                        onDragLeave={this.onDragLeave}
                        onDrop={this.onDrop}
                    >
                    <legend className="input-legend text-sm font-semibold flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Input</span>
                    </legend>
                    {text !== '' && (
                        <div
                            className={`input-mirror ${this.state.composing ? 'is-hidden' : ''}`}
                            aria-hidden="true"
                            ref={(node) => { this.mirror = node; }}
                        >
                            {this.marks(text)}
                        </div>
                    )}
                    {text === '' && !this.state.typing && (
                        <div className="input-ghost" aria-hidden="true">
                            <span className="input-ghost-lead">One identifier per line, in any of these:</span>
                            <span className="input-ghost-line">
                                {ghostCut === -1 ? this.state.ghost : this.state.ghost.slice(0, ghostCut)}
                                {ghostCut !== -1 && (
                                    <span className="input-ghost-note">{this.state.ghost.slice(ghostCut)}</span>
                                )}
                                <i className="input-caret"></i>
                            </span>
                        </div>
                    )}
                    <textarea
                        id="input-area"
                        className={`input-area ${this.state.composing ? 'is-composing' : ''}`}
                        value={this.state.text}
                        onChange={this.onKeyboardInput}
                        onPaste={this.onPaste}
                        onKeyDown={this.onTextareaKeyDown}
                        spellCheck={false}
                        autoComplete="off"
                        aria-label="Identifiers to convert"
                        aria-describedby="input-hint"
                        placeholder=""
                        rows="15"
                        onFocus={this.stopGhost}
                        onBlur={this.startGhost}
                        onScroll={this.onTextareaScroll}
                        onCompositionStart={() => this.setState({ composing: true })}
                        onCompositionEnd={() => this.setState({ composing: false })}
                    ></textarea>
                    {text !== '' && (
                        <button
                            type="button"
                            className="input-clear"
                            onClick={this.clearInput}
                            aria-label="Empty the box"
                            title="Empty the box"
                        >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}
                    </fieldset>

                    <p id="input-hint" className="int-hint px-1">
                        <span>
                            One identifier per line. Press <kbd className="px-1.5 py-0.5 rounded border font-mono text-[11px] line-strong-border surface-sunken-bg ink">Enter</kbd> or paste to convert; <kbd className="px-1.5 py-0.5 rounded border font-mono text-[11px] line-strong-border surface-sunken-bg ink">⌘ ↵</kbd> converts without a trailing newline.
                        </span>
                        {lines > 0 && (
                            <span className="int-hint-count">
                                {lines} {lines === 1 ? 'line' : 'lines'}
                                {known < lines && ` · ${lines - known} unread`}
                            </span>
                        )}
                    </p>
                </div>

                <fieldset className="control-card rounded-xl shadow-md border px-5 pb-5 pt-3 hover:shadow-lg transition-shadow">
                    <legend className="px-1 text-sm font-semibold flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Select result type</span>
                    </legend>
                    <div className="fmt-chips">
                        {uuidTypeList().map((v, k) => (
                            <label
                                key={k}
                                className={`fmt-chip choice-cell ${FORMAT_CLASS[k] || ''} ${resultType === k ? 'is-on' : ''}`}
                                onClick={(e) => {
                                    if (resultType === k) {
                                        this.setResultType(k, e);
                                    }
                                }}
                            >
                                <input
                                    type="radio"
                                    name="rtype"
                                    checked={resultType === k}
                                    onChange={(e) => this.setResultType(k, e)}
                                />
                                <span>{v}</span>
                            </label>
                        ))}
                    </div>
                    {spellingsOf(resultType).length > 1 && (
                        <div className="fmt-style">
                            <span className="int-lane-label">spelling</span>
                            <span className="int-seg" role="radiogroup" aria-label="Spelling of the result" style={{ '--int-seg-count': spellingsOf(resultType).length }}>
                                <span
                                    className="int-seg-thumb"
                                    aria-hidden="true"
                                    style={{ transform: `translateX(${Math.max(0, spellingsOf(resultType).findIndex(option => option.id === this.spelling())) * 100}%)` }}
                                ></span>
                                {spellingsOf(resultType).map(option => (
                                    <label key={option.id} className={`int-seg-item ${this.spelling() === option.id ? 'is-on' : ''}`}>
                                        <input
                                            type="radio"
                                            name="ustyle"
                                            checked={this.spelling() === option.id}
                                            onChange={() => this.setUuidStyle(option.id)}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </span>
                            {hasCase(resultType) && (
                            <span className="int-seg" role="radiogroup" aria-label="Letter case of the result" style={{ '--int-seg-count': 2 }}>
                                <span
                                    className="int-seg-thumb"
                                    aria-hidden="true"
                                    style={{ transform: `translateX(${this.props.uuidUpper ? 100 : 0}%)` }}
                                ></span>
                                {[false, true].map(upper => (
                                    <label
                                        key={upper ? 'upper' : 'lower'}
                                        className={`int-seg-item ${Boolean(this.props.uuidUpper) === upper ? 'is-on' : ''}`}
                                        title={upper ? 'Capitals, as the Windows registry writes them' : 'Lower case, as RFC 9562 writes it'}
                                    >
                                        <input
                                            type="radio"
                                            name="ucase"
                                            checked={Boolean(this.props.uuidUpper) === upper}
                                            onChange={() => this.setUuidCase(upper)}
                                        />
                                        <span className="fmt-case-label">{upper ? 'ABCDEF' : 'abcdef'}</span>
                                    </label>
                                ))}
                            </span>
                            )}
                        </div>
                    )}
                </fieldset>

                <fieldset className="control-card rounded-xl shadow-md border px-5 pb-5 pt-3 hover:shadow-lg transition-shadow">
                    <legend className="px-1 text-sm font-semibold flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span>Integer type</span>
                    </legend>
                    <div className={`int-choice ${intLinked ? 'is-linked' : 'is-split'} ${!intLinked && (writeIntType ?? intType) !== intType ? 'is-crossed' : ''}`}>
                        {intLinked
                            ? this.renderIntSegments('itype', intType, this.setIntType)
                            : (
                                <>
                                    <span className="int-lane">
                                        <span className="int-lane-label" id="int-read-label">read</span>
                                        {this.renderIntSegments('itype', intType, this.setIntType, 'int-read-label')}
                                    </span>
                                    <button
                                        type="button"
                                        className="int-flow"
                                        onClick={this.swapIntTypes}
                                        title="Swap the two ends"
                                        aria-label="Swap the two ends"
                                    >
                                        <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
                                            <path d="M1 6h18M15.5 1.5L20 6l-4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <span className={`int-lane ${writes ? '' : 'is-moot'}`}>
                                        <span className="int-lane-label" id="int-write-label">
                                            write
                                            {!writes && <em>unused here</em>}
                                        </span>
                                        {this.renderIntSegments('otype', writeIntType ?? intType, (type) => this.setWriteIntType(type), 'int-write-label')}
                                    </span>
                                </>
                            )}

                        <button
                            type="button"
                            className={`int-split ${intLinked ? '' : 'is-on'}`}
                            onClick={this.toggleIntLink}
                            aria-pressed={!intLinked}
                            title={intLinked
                                ? 'Read one way and write another'
                                : 'Read and write the same way'}
                        >
                            {intLinked ? SPLIT_ICON : JOIN_ICON}
                            <span>{intLinked ? 'Split' : 'Join'}</span>
                        </button>
                    </div>

                    <p className="int-hint">{this.intHint(intLinked, intType, writeIntType ?? intType, writes)}</p>
                </fieldset>
            </div>
        );
    }
}
