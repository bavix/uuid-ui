import React from 'preact/compat';
import { SIGNED, intTypeList } from './int-type.js';
import { toast } from 'sonner';
import { createConfetti, createMagneticFieldEffect, createPulseWaveEffect, startNumberGuessingGame, shakeElement } from './effects.js';
import { trackEgg } from './analytics.js';
import { specialValues } from './special-values.js';
import { extractComment, stripComment } from './comment.js';
import { mergeItems } from './merge-items.js';
import { toUuid } from './to-uuid.js';
import { TYPE_BASE64, TYPE_BYTES, TYPE_HEX, TYPE_HIGH_LOW, TYPE_ULID, TYPE_WORDS, typeDetector, uuidTypeList } from "./type-detector.js";
import { bytesToUuid, uuidToBytes, uuidToBytesString, uuidToHex } from "./uuid-bytes.js";
import { objectParse } from "./object-parser.js";
import { uuidToWords } from "./uuid-words.js";
import { uuidToInts, uuidToUints } from "./uuid-high-low.js";
import { normalizeBase64, uuidToBase64Std } from "./base64.js";
import { uuidFormatter } from "./uuid-formatter.js";
import { uuidToUlid } from './uuid-ulid.js';

const nrg = /"(-?\d+)"/g;

export class Item {
    constructor(input, output, info) {
        this.input = input;
        this.output = output;
        this.info = info;
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
        this.handle(text);
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
    }

    onKeyboardInput = (e) => {
        const text = e.target.value
        const pasted = this.isPasting
        this.isPasting = false

        this.setState({ text })

        // Typing converts on the closing newline; a paste converts as soon as
        // it contains one, even without a trailing newline.
        if (pasted ? text.includes('\n') : text.endsWith('\n')) {
            this.handle(text)
        }
    }

    // preact/compat maps onChange to the input event, so this always runs
    // before onKeyboardInput sees the pasted value.
    onPaste = () => {
        this.isPasting = true
    }

    handle = (text) => {
        const lines = text.split('\n');
        const result = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            if (line.trimStart().startsWith('{')) {
                let block = '';
                let openBraces = 0;
                let j = i;

                do {
                    const currentLine = lines[j];
                    block += currentLine;
                    const lineWithoutComment = stripComment(currentLine);

                    openBraces += (lineWithoutComment.match(/{/g) || []).length;
                    openBraces -= (lineWithoutComment.match(/}/g) || []).length;

                    j++;
                    if (j < lines.length) block += '\n';

                } while (j < lines.length && openBraces > 0);

                result.push(this.moveCommentsToEnd(block));
                i = j;
            } else {
                const trimmed = line.trim();
                if (trimmed) result.push(trimmed);
                i++;
            }
        }

        this.addItems(result);
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

    addItems = (items) => {
        const converted = []

        for (const line of items) {
            const obj = this.newItem(line)
            if (obj !== null) {
                converted.push(obj)
            }
        }

        // Newest on top, the same rule the rest of the list follows: the last
        // line of a paste is the most recent thing that happened.
        this.props.setItems(mergeItems(converted.reverse(), this.props.items))

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

    newItem = (line) => {
        try {
            const { input, comment } = this.parse(line)

            const target = uuidTypeList()[this.props.resultType] || 'the selected format'

            const nInput = this.normalize(input)
            if (nInput === null) {
                // Naming the accepted shapes is the only documentation a failed
                // line ever gets; "Failed to process string" named none of them.
                toast.error('Not a recognized identifier', {
                    description: `${line} — expected a UUID, base64, ULID, high/low pair or byte array`
                });
                return null
            }

            const uuid = this.castToUuid(input)
            const output = uuid === null ? null : this.castFromUuid(uuid)
            const nOutput = output === null ? null : this.normalizeOutput(output)

            // Conversion helpers return null on malformed input; without this
            // the line used to disappear with no feedback at all.
            if (nOutput === null) {
                toast.error(`Cannot convert to ${target}`, {
                    description: line
                });
                return null
            }

            if (nInput === nOutput) {
                toast.warning(`Already ${target}`, {
                    description: line
                });
                return null
            }

            return new Item(nInput, nOutput, comment)
        } catch (e) {
            return null
        }
    }

    parse = (line) => {
        const comment = extractComment(line);
        const input = stripComment(line).trim().replace(/,$/g, '').trimEnd();

        if (comment !== null) {
            return { input: input.toString(), comment: comment.toString() }
        }

        return { input: input.toString(), comment: undefined }
    }

    // The output is already in the shape the chosen format asks for; only the
    // formats that have several legal spellings go through the normalizer.
    normalizeOutput = (output) => {
        const { resultType } = this.props

        if (resultType === TYPE_HEX) {
            return output
        }

        return this.normalize(output)
    }

    normalize = (input) => {
        if (typeof input !== 'string') {
            return null;
        }

        switch (typeDetector(input)) {
            case TYPE_BYTES:
                return JSON.stringify(objectParse(input)).replace(/,$/g, '');
            case TYPE_HIGH_LOW:
            case TYPE_WORDS: {
                const result = JSON.stringify(objectParse(input)).replace(/,$/g, '');
                return result.replace(nrg, "$1");
            }
            case TYPE_BASE64:
                return normalizeBase64(input);
            case TYPE_ULID:
                return input;
        }

        if (input[0] === '{' && input[input.length - 1] === '}') {
            input = input.substring(1, input.length - 1);
        }

        const uuid = uuidFormatter(input);
        if (uuid.length === 36) {
            return uuid;
        }

        // Spellings the formatter cannot handle on its own — `urn:uuid:` above
        // all — still round-trip through the byte parser.
        const bytes = uuidToBytes(input);

        return bytes === null ? null : bytesToUuid(bytes);
    }

    castToUuid = (input) => {
        return toUuid(input, this.props.intType)
    }

    castFromUuid = (uuid) => {
        const { resultType, intType } = this.props

        switch (resultType) {
            case TYPE_BYTES:
                return uuidToBytesString(uuid);
            case TYPE_HIGH_LOW: {
                const u = intType === SIGNED ? uuidToInts(uuid) : uuidToUints(uuid)
                return u === null ? null : JSON.stringify(u)
            }
            case TYPE_WORDS: {
                const words = uuidToWords(uuid, intType === SIGNED)
                return words === null ? null : JSON.stringify(words)
            }
            case TYPE_BASE64:
                return uuidToBase64Std(uuid)
            case TYPE_ULID:
                return uuidToUlid(uuid)
            case TYPE_HEX:
                return uuidToHex(uuid)
        }

        return uuid
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
                        targetElement = event.target.closest('.custom-radio');
                    }
                    
                    if (!targetElement) {
                        const radioButtons = document.querySelectorAll('.custom-radio');
                        // uuidTypeList() is indexed by bitmask (1/2/4/8/16) while the
                        // rendered radios are a dense list, so count the entries before it.
                        const typeIndex = uuidTypeList().filter((_, idx) => idx < resultType).length;
                        if (radioButtons[typeIndex]) {
                            targetElement = radioButtons[typeIndex];
                        }
                    }
                    
                    if (targetElement) {
                        createPulseWaveEffect(targetElement, 2000);
                        setTimeout(() => {
                            createMagneticFieldEffect(targetElement, 3000);
                        }, 200);
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
                this.handle(text)
            }
        })
    }

    setIntType = (type, event) => {
        const { text } = this.state
        const { intType } = this.props
        const now = Date.now();
        
        if (type === intType) {
            if (this.lastIntTypeClick && now - this.lastIntTypeClick > 2000) {
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
                this.handle(text)
            }
        })
    }

    render({ resultType, intType }, { isClosedInformer, text }) {
        return (
            <div className="space-y-5">
                {!isClosedInformer && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/30 dark:to-indigo-900/30 dark:border-blue-800 border rounded-xl p-4 relative shadow-sm">
                        <button 
                            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-full transition-all hover:scale-110"
                            onClick={this.closeInformer}
                            aria-label="Close"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="flex items-start space-x-2 pr-8">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                                This project is provided "as is". Updates will only be made when absolutely necessary.
                            </p>
                        </div>
                    </div>
                )}

                <div className="relative">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Input</span>
                        </span>
                    </label>
                    <textarea
                        className="w-full px-4 py-3 border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-sm transition-colors transition-shadow shadow-sm hover:shadow-md min-h-[200px]"
                        value={this.state.text}
                        onChange={this.onKeyboardInput}
                        onPaste={this.onPaste}
                        onKeyDown={this.onTextareaKeyDown}
                        spellCheck={false}
                        autoComplete="off"
                        aria-label="Identifiers to convert"
                        aria-describedby="input-hint"
                        placeholder={`Enter UUID. Input examples:
0;1 // comment
0;1 # comment
{low: 0, high: 1}
71a46cec-4809-4cc5-9689-5b0441b46186
huW65O9YQDGzT16f+RTNVQ==
huW65O9YQDGzT16f+RTNVQ== //comment new
huW65O9YQDGzT16f+RTNVQ== # comment new
{ // Begin comment
    low: 0, // Lo UUID
    high: 1, # Hi UUID
} // End
`}
                        rows="15"
                    ></textarea>

                    <p id="input-hint" className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        One identifier per line. Press <kbd className="px-1.5 py-0.5 rounded border font-mono text-[11px] border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">Enter</kbd> or paste to convert; <kbd className="px-1.5 py-0.5 rounded border font-mono text-[11px] border-gray-300 bg-gray-100 text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">⌘↵</kbd> converts without a trailing newline.
                    </p>
                </div>

                <fieldset className="bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow-md border px-5 pb-5 pt-3 hover:shadow-lg transition-shadow">
                    <legend className="px-1 text-sm font-semibold flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Select result type</span>
                    </legend>
                    <div className="flex flex-wrap gap-3">
                        {uuidTypeList().map((v, k) => (
                            <label 
                                key={k} 
                                className="custom-radio group"
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
                                <span className="radio-check radio-link group-hover:scale-110 transition-transform"></span>
                                <span className="radio-label text-sm font-medium text-gray-700 group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400 transition-colors">{v}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <fieldset className="bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow-md border px-5 pb-5 pt-3 hover:shadow-lg transition-shadow">
                    <legend className="px-1 text-sm font-semibold flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span>Integer type</span>
                    </legend>
                    <div className="flex flex-wrap gap-3">
                        {intTypeList().map((v, k) => (
                            <label 
                                key={k} 
                                className="custom-radio group"
                                onClick={(e) => {
                                    if (intType === k) {
                                        this.setIntType(k, e);
                                    }
                                }}
                            >
                                <input
                                    type="radio"
                                    name="itype"
                                    checked={intType === k}
                                    onChange={(e) => this.setIntType(k, e)}
                                />
                                <span className="radio-check radio-info group-hover:scale-110 transition-transform"></span>
                                <span className="radio-label text-sm font-medium text-gray-700 group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400 transition-colors">{v}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            </div>
        );
    }
}
