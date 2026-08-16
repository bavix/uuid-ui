import React from 'preact/compat';
import { toast } from 'sonner';
import "@theme-toggles/react/css/Expand.css"
import { Expand } from "@theme-toggles/react"
import { v1, v4, v6, v7, NIL, MAX } from 'uuid';
import { uuidToUlid } from "./uuid-ulid.js";
import { hexWordUuid, randomPalindromeUuid } from './special-values.js';
import { isTimed, momentOptions } from './generate-at.js';
import { trackEgg } from './analytics.js';
import { createConfetti, spinElement } from './effects.js';
import { copyText } from './clipboard.js';

const uuidTypes = ['v1', 'v4', 'v6', 'v7', 'nil', 'max', 'ulid', 'deadbeef', 'cafebabe', 'palindrome'];

function readStoredUuidType() {
    try {
        const stored = localStorage.getItem('uuidType');
        return uuidTypes.includes(stored) ? stored : 'v4';
    } catch {
        return 'v4';
    }
}

export default class NavComponent extends React.Component {
    state = {
        selectedUuidType: readStoredUuidType(),
        // Empty means now. Only the versions that carry a clock can use it.
        moment: '',
        // The field is opt-in: an empty datetime input renders as
        // "dd.mm.yyyy, --:--:--,---", which is a lot of noise for a default.
        momentOpen: false,
        generatedUuid: '',
    }

    constructor(props) {
        super(props);
        this.isToggling = false;
        this.generateClickCount = 0;
        this.lastGenerateClick = null;
        this.lastSpinTime = 0;
        this.spinThrottle = 200;
    }

    selectUuidType = (selectedUuidType) => {
        this.setState({ selectedUuidType });

        try {
            localStorage.setItem('uuidType', selectedUuidType);
        } catch (e) {
        }
    }

    setGeneratedUuid = (generatedUuid) => {
        this.setState({ generatedUuid });
    }

    handleToggle = (value) => {
        if (this.isToggling) return;
        this.isToggling = true;
        this.props.setToggle(value);
        setTimeout(() => {
            this.isToggling = false;
        }, 100);
    };

    // Built one at a time on purpose: the old object literal called every
    // generator on every click, advancing the v1/v6 clock sequences for nothing.
    makeUuid = (type) => {
        // The chosen moment, or nothing at all, which the generators read as now.
        const at = isTimed(type) ? momentOptions(this.state.moment) : {};

        switch (type) {
            case 'v1': return v1(at);
            case 'v4': return v4();
            case 'v6': return v6(at);
            case 'v7': return v7(at);
            case 'nil': return NIL;
            case 'max': return MAX;
            case 'ulid': return uuidToUlid(v7(at));
            case 'deadbeef': return hexWordUuid('deadbeef');
            case 'cafebabe': return hexWordUuid('cafebabe');
            case 'palindrome': return randomPalindromeUuid();
            default: return null;
        }
    }

    generateUuid = (type, setUuid, copyToClipboard = true) => {
        if (!uuidTypes.includes(type)) {
            toast.error('Invalid type', {
                description: type
            });
            return;
        }

        const now = Date.now();
        
        if (this.lastGenerateClick && now - this.lastGenerateClick < 500) {
            this.generateClickCount++;
        } else {
            this.generateClickCount = 1;
        }
        
        this.lastGenerateClick = now;
        
        if (this.generateClickCount === 5) {
            trackEgg('rapid-generator', 'clicked');
            this.generateClickCount = 0;
            
            const now = Date.now();
            if (now - this.lastSpinTime >= this.spinThrottle) {
                this.lastSpinTime = now;
                const generateButton = document.querySelector('button[aria-label*="Generate"]');
                if (generateButton) {
                    spinElement('button[aria-label*="Generate"]', 5, 1000);
                }
            }
            
            setTimeout(() => createConfetti(window.innerWidth * 0.2, 100), 0);
            setTimeout(() => createConfetti(window.innerWidth * 0.4, 100), 100);
            setTimeout(() => createConfetti(window.innerWidth * 0.6, 100), 200);
            setTimeout(() => createConfetti(window.innerWidth * 0.8, 100), 300);
            setTimeout(() => createConfetti(window.innerWidth * 0.5, 100), 400);
            
            const uuids = [];
            for (let i = 0; i < 5; i++) {
                uuids.push(this.makeUuid(type));
            }

            copyText(uuids.join('\n'))
                .then(() => {
                    toast.success('🚀 Secret unlocked!', {
                        description: 'Rapid generator! 5 UUIDs copied to clipboard!',
                        duration: 5000,
                    });
                })
                .catch(error => {
                    toast.error('Error copying text', {
                        description: error.message
                    });
                });
            
            setUuid(uuids[0]);
            return;
        }

        const uuid = this.makeUuid(type);
        setUuid(uuid);

        // Picking a version in the dropdown must not overwrite whatever the
        // user is holding in their clipboard; only an explicit action copies.
        if (!copyToClipboard) {
            return;
        }

        copyText(uuid)
            .then(() => {
                toast.success('Text copied', {
                    description: uuid
                });
            })
            .catch(error => {
                toast.error('Error copying text', {
                    description: error.message
                });
            });
    }

    render() {
        const { selectedUuidType, generatedUuid } = this.state;
        const { isToggled } = this.props;

        return (
            <nav
                className="bg-white/95 backdrop-blur-sm text-gray-900 dark:bg-gray-900/95 dark:backdrop-blur-sm dark:text-gray-100 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50"
                role="navigation" 
                aria-label="main navigation" 
            >
                    <div className="container mx-auto max-w-7xl">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 min-h-16">
                            <div className="flex items-center space-x-3">
                                <a className="flex items-center group" href="./">
                                    <img src="./android-chrome-192x192.png" className="h-9 w-9 rounded-lg transition-transform group-hover:scale-110" alt="UUIDConv UI" /> 
                                </a>
                                <a className="font-bold text-lg bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity gradient-animate" href="./">
                                    UUIDConv UI
                                </a>
                            </div>
                            
                                <div className="ml-auto flex items-center order-2 lg:order-3">
                                    <a
                                        href="https://github.com/bavix/uuid-ui"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 mr-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 dark:text-gray-200"
                                        aria-label="Open project on GitHub"
                                        title="Open project on GitHub"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                            <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.07 3.29 9.37 7.86 10.88.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.38-3.88-1.38-.53-1.36-1.3-1.73-1.3-1.73-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.75-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.19.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.5 3.17-1.19 3.17-1.19.64 1.58.24 2.75.12 3.04.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.69.42.36.79 1.08.79 2.17 0 1.57-.01 2.84-.01 3.22 0 .31.21.68.8.56C20.71 21.37 24 17.07 24 12 24 5.73 18.27.5 12 .5z" />
                                        </svg>
                                    </a>
                                    <Expand 
                                        duration={750} 
                                        toggled={isToggled} 
                                        toggle={this.handleToggle}
                                        className="p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center bg-white hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50"
                                        aria-label="Toggle theme"
                                        title={isToggled ? "Switch to light theme" : "Switch to dark theme"}
                                    />
                                </div>
                            <div className="flex items-center gap-3 flex-1 min-w-0 order-3 basis-full lg:order-none lg:basis-auto">
                                <div className="flex flex-wrap items-center rounded-xl shadow-sm border flex-1 min-w-0 max-w-3xl bg-white border-gray-200 dark:bg-gray-800/50 dark:border-gray-700">
                                    <div className="relative flex items-center">
                                        <select
                                            aria-label="UUID version to generate"
                                            onChange={(e) => {
                                                this.selectUuidType(e.target.value)
                                                this.generateUuid(e.target.value, this.setGeneratedUuid, false)
                                            }}
                                            value={selectedUuidType}
                                            className="pl-2.5 pr-6 py-2 text-[13px] font-medium cursor-pointer transition-colors focus:outline-none border-0 bg-transparent appearance-none text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"
                                        >
                                            {uuidTypes.map(type => (
                                                <option key={type} value={type}>
                                                    {type.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2 pointer-events-none flex items-center text-gray-500 dark:text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    {isTimed(selectedUuidType) && (
                                      <>
                                        <div className="hidden lg:block w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                                        <div className="flex items-center gap-1 pl-1">
                                          {!this.state.momentOpen && (
                                            <button
                                              type="button"
                                              onClick={() => this.setState({ momentOpen: true })}
                                              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700/50"
                                              aria-label="Generate at a chosen moment"
                                              title="Generate at a chosen moment"
                                            >
                                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                              </svg>
                                            </button>
                                          )}
                                          {this.state.momentOpen && (
                                          <input
                                            type="datetime-local"
                                            step="0.001"
                                            value={this.state.moment}
                                            onInput={(e) => this.setState({ moment: e.target.value })}
                                            className="generator-moment"
                                            aria-label="Generate as if at this moment; empty means now"
                                            title="The clock written into the identifier. Empty means now."
                                            ref={(node) => { if (node && this.state.momentOpen && !this.momentFocused) { this.momentFocused = true; node.focus(); } }}
                                          />
                                          )}
                                          {this.state.momentOpen && (
                                            <button
                                              type="button"
                                              onClick={() => { this.momentFocused = false; this.setState({ moment: '', momentOpen: false }); }}
                                              className="p-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700/50"
                                              aria-label="Back to now"
                                              title="Back to now"
                                            >
                                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                      </>
                                    )}
                                    <div className="hidden lg:block w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="relative group order-last basis-full min-w-0 lg:order-none lg:basis-auto lg:flex-1">
                                        <input
                                            readOnly={true}
                                            className="w-full px-2 py-2 text-[12px] lg:px-3 lg:text-[13px] font-mono transition-colors cursor-pointer focus:outline-none border-0 bg-transparent text-gray-900 placeholder-gray-400 dark:text-gray-100 dark:placeholder-gray-500"
                                            type="text"
                                            value={generatedUuid}
                                            placeholder="UUID will appear here"
                                            onClick={(e) => {
                                                e.target.select();
                                                copyText(generatedUuid)
                                                    .then(() => {
                                                        toast.success('Copied to clipboard');
                                                    })
                                                    .catch(error => {
                                                        toast.error('Error copying text', {
                                                            description: error.message
                                                        });
                                                    });
                                            }}
                                            title={generatedUuid ? `${generatedUuid}\nClick to copy` : 'Click to copy'}
                                        />
                                        {generatedUuid && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-gray-500 dark:text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="hidden lg:block w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                                    <button 
                                        className="px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 whitespace-nowrap flex items-center gap-2 border-0 bg-transparent text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"
                                        onClick={() => this.generateUuid(selectedUuidType, this.setGeneratedUuid)}
                                        aria-label={`Generate ${selectedUuidType.toUpperCase()} UUID`}
                                    >
                                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        
                                    </button>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </nav>
        );
    }
}
