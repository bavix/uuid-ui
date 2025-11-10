import { useState, useEffect } from 'preact/hooks';
import React from 'preact/compat';
import { toast } from 'sonner';
import "@theme-toggles/react/css/Expand.css"
import { Expand } from "@theme-toggles/react"
import { v1, v4, v6, v7, NIL, MAX } from 'uuid';
import { uuidToUlid } from "./uuid-ulid.js";
import { createConfetti, spinElement } from './effects.js';

const uuidTypes = ['v1','v4', 'v6', 'v7', 'nil', 'max', 'ulid'];

export default class NavComponent extends React.Component {
    constructor(props) {
        super(props);
        this.isToggling = false;
        this.generateClickCount = 0;
        this.lastGenerateClick = null;
        this.lastSpinTime = 0;
        this.spinThrottle = 200;
    }
    
    handleToggle = (value) => {
        if (this.isToggling) return;
        this.isToggling = true;
        this.props.setToggle(value);
        setTimeout(() => {
            this.isToggling = false;
        }, 100);
    };

    generateUuid = (type, setUuid) => {
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
                const uuid = {
                    'v1': v1(),
                    'v4': v4(),
                    'v6': v6(),
                    'v7': v7(),
                    'nil': NIL,
                    'max': MAX,
                    'ulid': uuidToUlid(v7()),
                }[type];
                uuids.push(uuid);
            }
            
            const allUuids = uuids.join('\n');
            navigator.clipboard.writeText(allUuids)
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

        const uuid = {
            'v1': v1(),
            'v4': v4(),
            'v6': v6(),
            'v7': v7(),
            'nil': NIL,
            'max': MAX,
            'ulid': uuidToUlid(v7()),
        }[type];

        navigator.clipboard.writeText(uuid)
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

        setUuid(uuid);
    }

    render() {
        const [selectedUuidType, setSelectedUuidType] = useState(() => {
            try {
                return localStorage.getItem('uuidType') || 'v4';
            } catch {
                return 'v4';
            }
        });

        useEffect(() => {
            try {
                localStorage.setItem('uuidType', selectedUuidType);
            } catch (e) {
            }
        }, [selectedUuidType]);

        const [generatedUuid, setGeneratedUuid] = useState('');
        const { isToggled, setToggle } = this.props;

        return (
            <nav
                className={`${isToggled ? 'bg-gray-900/95 backdrop-blur-sm text-gray-100' : 'bg-white/95 backdrop-blur-sm text-gray-900'} shadow-md border-b ${isToggled ? 'border-gray-700' : 'border-gray-200'} sticky top-0 z-50`}
                role="navigation" 
                aria-label="main navigation" 
            >
                    <div className="container mx-auto max-w-7xl">
                        <div className="flex items-center h-16 gap-4 px-4">
                            <div className="flex items-center space-x-3">
                                <a className="flex items-center group" href="./">
                                    <img src="./android-chrome-192x192.png" className="h-9 w-9 rounded-lg transition-transform group-hover:scale-110" alt="UUIDConv UI" /> 
                                </a>
                                <a className="font-bold text-lg bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity gradient-animate" href="./">
                                    UUIDConv UI 
                                </a>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-1">
                                <div className={`hidden md:flex items-center rounded-xl shadow-sm border flex-1 max-w-xl ${
                                    isToggled 
                                        ? 'bg-gray-800/50 border-gray-700' 
                                        : 'bg-white border-gray-200'
                                }`}>
                                    <div className="relative flex items-center">
                                        <select 
                                            onChange={(e) => {
                                                setSelectedUuidType(e.target.value)
                                                this.generateUuid(e.target.value, setGeneratedUuid)
                                            }}
                                            value={selectedUuidType}
                                            className={`pl-3 pr-7 py-2 text-sm font-medium cursor-pointer transition-colors focus:outline-none border-0 bg-transparent appearance-none ${
                                                isToggled 
                                                    ? 'text-gray-200 hover:bg-gray-700/50' 
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {uuidTypes.map(type => (
                                                <option key={type} value={type}>
                                                    {type.toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                        <div className={`absolute right-2 pointer-events-none flex items-center ${
                                            isToggled ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className={`w-px h-6 ${
                                        isToggled ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                    <div className="relative group flex-1 min-w-0">
                                        <input
                                            readOnly={true}
                                            className={`w-full px-3 py-2 text-sm font-mono transition-colors cursor-pointer focus:outline-none border-0 bg-transparent ${
                                                isToggled 
                                                    ? 'text-gray-100 placeholder-gray-500' 
                                                    : 'text-gray-900 placeholder-gray-400'
                                            }`}
                                            type="text"
                                            value={generatedUuid}
                                            placeholder="UUID will appear here"
                                            onClick={(e) => {
                                                e.target.select();
                                                navigator.clipboard.writeText(generatedUuid).then(() => {
                                                    toast.success('Copied to clipboard');
                                                });
                                            }}
                                            title="Click to copy"
                                        />
                                        {generatedUuid && (
                                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                                                isToggled ? 'text-gray-400' : 'text-gray-500'
                                            }`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`w-px h-6 hidden md:block ${
                                        isToggled ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}></div>
                                    <button 
                                        className={`px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 whitespace-nowrap hidden md:flex items-center space-x-2 border-0 bg-transparent ${
                                            isToggled 
                                                ? 'text-gray-200 hover:bg-gray-700/50' 
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                        onClick={() => this.generateUuid(selectedUuidType, setGeneratedUuid)}
                                        aria-label={`Generate ${selectedUuidType.toUpperCase()} UUID`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Generate</span>
                                    </button>
                                </div>
                                
                                <div className="ml-auto flex items-center">
                                    <Expand 
                                        duration={750} 
                                        toggled={isToggled} 
                                        toggle={this.handleToggle}
                                        className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center ${
                                            isToggled 
                                                ? 'bg-gray-800/50 hover:bg-gray-700/50' 
                                                : 'bg-white hover:bg-gray-50'
                                        }`}
                                        aria-label="Toggle theme"
                                        title={isToggled ? "Switch to light theme" : "Switch to dark theme"}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
        );
    }
}
