import { useState, useEffect } from 'preact/hooks';
import React from 'preact/compat';
import { toast } from 'sonner';
import { v4 } from 'uuid';
import { createMagneticFieldEffect, createPulseWaveEffect, startNumberGuessingGame, shakeElement } from './effects.js';
import { TYPE_BASE64, TYPE_BYTES, TYPE_HIGH_LOW, TYPE_ULID, typeDetector, uuidTypeList } from "./type-detector.js";
import { bytesToUuid, uuidToBytesString } from "./uuid-bytes.js";
import { objectParse } from "./object-parser.js";
import { intsToUuid, uintsToUuid, uuidToInts, uuidToUints } from "./uuid-high-low.js";
import { base64StdToUuid, uuidToBase64Std } from "./base64.js";
import { uuidFormatter } from "./uuid-formatter.js";
import { ulidToUuid, uuidToUlid } from './uuid-ulid.js';

const SIGNED = 2 ** 0;
const UNSIGNED = 2 ** 1;
const nrg = /"(-?\d+)"/g;

export function intTypeList() {
    const list = []
    list[SIGNED] = 'signed'
    list[UNSIGNED] = 'unsigned'
    return list
}

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

export default class InputComponent extends React.Component {
    state = {
        resultType: TYPE_HIGH_LOW,
        intType: SIGNED,
        text: '',
    }

    constructor(props) {
        super(props);
        this.resultTypeClickCount = 0;
        this.intTypeClickCount = 0;
        this.lastResultTypeClick = null;
        this.lastIntTypeClick = null;
        this.lastConfettiTime = 0;
        this.confettiThrottle = 500;
    }

    onKeyboardInput = (e) => {
        const text = e.target.value
        this.setState({ text })

        if (text[text.length - 1] !== "\n") {
            return
        }

        this.handle(text)
    }

    onPaste = (e) => {
        setTimeout(() => {
            const text = e.target.value;
            if (text && text.includes('\n')) {
                this.handle(text);
                this.setState({ text: '' });
            }
        }, 10);
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
                    const lineWithoutComment = currentLine.split('//')[0];

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
            const idx = line.indexOf('//');
            if (idx !== -1) {
                codeLines.push(line.slice(0, idx).trimEnd());
                comments.push(line.slice(idx + 2).trim());
            } else {
                codeLines.push(line.trimEnd());
            }
        }

        return codeLines.join('\n') + (comments.length ? ` // ${comments.join(' ')}` : '');
    }

    addItems = (items) => {
        let result = new Map()

        for (let i = items.length - 1; i >= 0; i--) {
            const obj = this.newItem(items[i])
            if (obj !== null) {
                result.set(obj.toString(), obj)
            }
        }

        for (const item of this.props.items) {
            if (!result.has(item.toString())) {
                result.set(item.toString(), item)
            }
        }

        this.props.setItems([...result.values()])
    }

    newItem = (line) => {
        try {
            const { input, comment } = this.parse(line)
            const uuid = this.castToUuid(input)
            const output = this.castFromUuid(uuid)

            const nInput = this.normalize(input)
            if (nInput === null) {
                toast.error('Failed to process string', {
                    description: line
                });
                return null
            }

            const nOutput = this.normalize(output)
            if (nInput === nOutput) {
                toast.warning('The result of the conversion matches the entered value', {
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
        let results = line.split("//").map(s => s.trim().replace(/,$/g, '').trimRight())

        if (results.length > 1) {
            return { input: results[0].toString(), comment: results[1].toString() }
        }

        return { input: results[0].toString(), comment: undefined }
    }

    normalize = (input) => {
        switch (typeDetector(input)) {
            case TYPE_BYTES:
                return JSON.stringify(objectParse(input)).replace(/,$/g, '');
            case TYPE_HIGH_LOW:
                const result = JSON.stringify(objectParse(input)).replace(/,$/g, '');
                return result.replace(nrg, "$1");
            case TYPE_BASE64:
                return btoa(atob(input));
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

        return null;
    }

    castToUuid = (input) => {
        const { intType } = this.state

        switch (typeDetector(input)) {
            case TYPE_BYTES:
                return bytesToUuid(objectParse(input))
            case TYPE_HIGH_LOW:
                const u = objectParse(input)
                const fn = intType === SIGNED ? intsToUuid : uintsToUuid
                return fn(u.high, u.low)
            case TYPE_BASE64:
                return base64StdToUuid(input)
            case TYPE_ULID:
                return ulidToUuid(input)
        }

        return input
    }

    castFromUuid = (uuid) => {
        const { resultType, intType } = this.state

        switch (resultType) {
            case TYPE_BYTES:
                return uuidToBytesString(uuid);
            case TYPE_HIGH_LOW:
                const u = intType === SIGNED ? uuidToInts(uuid) : uuidToUints(uuid)
                return JSON.stringify(u)
            case TYPE_BASE64:
                return uuidToBase64Std(uuid)
            case TYPE_ULID:
                return uuidToUlid(uuid)
        }

        return uuid
    }

    setResultType = (type, event) => {
        const { text, resultType } = this.state
        const now = Date.now();
        
        if (type === resultType) {
            if (this.lastResultTypeClick && now - this.lastResultTypeClick > 2000) {
                this.resultTypeClickCount = 0;
            }
            
            this.resultTypeClickCount++;
            this.lastResultTypeClick = now;
            
            if (this.resultTypeClickCount === 5) {
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
                        const typeIndex = Array.from(uuidTypeList()).findIndex((_, idx) => idx === resultType);
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
        
        this.setState({ resultType: type }, () => {
            this.handle(text)
        })
    }

    setIntType = (type, event) => {
        const { text, intType } = this.state
        const now = Date.now();
        
        if (type === intType) {
            if (this.lastIntTypeClick && now - this.lastIntTypeClick > 2000) {
                this.intTypeClickCount = 0;
            }
            
            this.intTypeClickCount++;
            this.lastIntTypeClick = now;
            
            if (this.intTypeClickCount === 5) {
                this.intTypeClickCount = 0;
                
                shakeElement('#input-cp', 15, 600);
                
                setTimeout(() => {
                    startNumberGuessingGame((won, attempts, targetNumber) => {
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
        
        this.setState({ intType: type }, () => {
            this.handle(text)
        })
    }

    render({ items, isToggled }, { resultType, intType }) {
        const [isClosedInformer, setClosedInformer] = useState(() => {
            try {
                return JSON.parse(localStorage.getItem('informerClosed') || 'false');
            } catch {
                return false;
            }
        });

        useEffect(() => {
            try {
                localStorage.setItem('informerClosed', JSON.stringify(isClosedInformer));
            } catch (e) {
            }
        }, [isClosedInformer]);

        return (
            <div className="space-y-5">
                {!isClosedInformer && (
                    <div className={`bg-gradient-to-r ${isToggled ? 'from-blue-900/30 to-indigo-900/30 border-blue-800' : 'from-blue-50 to-indigo-50 border-blue-200'} border rounded-xl p-4 relative shadow-sm`}>
                        <button 
                            className={`absolute top-3 right-3 w-7 h-7 flex items-center justify-center ${isToggled ? 'text-blue-400 hover:bg-blue-900/50' : 'text-blue-600 hover:bg-blue-100'} rounded-full transition-all hover:scale-110`}
                            onClick={() => setClosedInformer(true)}
                            aria-label="Close"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="flex items-start space-x-2 pr-8">
                            <svg className={`w-5 h-5 ${isToggled ? 'text-blue-400' : 'text-blue-600'} mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className={`${isToggled ? 'text-blue-200' : 'text-blue-800'} text-sm leading-relaxed`}>
                                The project is provided "as is". Project revisions will only be made when absolutely necessary.
                            </p>
                        </div>
                    </div>
                )}

                <div className="relative">
                    <label className={`block mb-2 text-sm font-medium ${isToggled ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Input</span>
                        </span>
                    </label>
                    <textarea
                        className={`w-full px-4 py-3 border-2 ${isToggled ? 'border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-500 focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-sm transition-colors transition-shadow shadow-sm hover:shadow-md min-h-[200px]`}
                        onChange={this.onKeyboardInput}
                        onPaste={this.onPaste}
                        spellCheck={false}
                        autoComplete="off"
                        aria-label="UUID input field"
                        placeholder={`Enter UUID. Input examples:
0;1 // comment
{low: 0, high: 1}
71a46cec-4809-4cc5-9689-5b0441b46186
huW65O9YQDGzT16f+RTNVQ==
huW65O9YQDGzT16f+RTNVQ== //comment new
{ // Begin comment
    low: 0, // Lo UUID
    high: 1, // Hi UUID
} // End
`}
                        rows="15"
                    ></textarea>
                </div>

                <div className={`${isToggled ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-md border p-5 hover:shadow-lg transition-shadow`}>
                    <label className={`block text-sm font-semibold ${isToggled ? 'text-gray-300' : 'text-gray-700'} mb-4 flex items-center space-x-2`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Select result type</span>
                    </label>
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
                                <span className={`radio-label text-sm font-medium ${isToggled ? 'text-gray-300 group-hover:text-blue-400' : 'text-gray-700 group-hover:text-blue-600'} transition-colors`}>{v}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className={`${isToggled ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-md border p-5 hover:shadow-lg transition-shadow`}>
                    <label className={`block text-sm font-semibold ${isToggled ? 'text-gray-300' : 'text-gray-700'} mb-4 flex items-center space-x-2`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span>Integer type</span>
                    </label>
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
                                <span className={`radio-label text-sm font-medium ${isToggled ? 'text-gray-300 group-hover:text-blue-400' : 'text-gray-700 group-hover:text-blue-600'} transition-colors`}>{v}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}
