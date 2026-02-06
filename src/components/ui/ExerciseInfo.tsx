'use client';

import { useState, useRef, useEffect } from 'react';

interface ExerciseInfoProps {
    name: string;
    muscleGroup: string;
    rationale?: string;
}

export function ExerciseInfo({ name, muscleGroup, rationale }: ExerciseInfoProps) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                popoverRef.current &&
                buttonRef.current &&
                !popoverRef.current.contains(e.target as Node) &&
                !buttonRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const defaultRationale = `${name} targets the ${muscleGroup} muscle group. This exercise is included to provide balanced development and progressive overload.`;

    return (
        <div className="relative inline-flex">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all ${isOpen
                        ? 'bg-[var(--accent-primary)] text-[var(--bg-darker)]'
                        : 'bg-white/10 text-[var(--text-tertiary)] hover:bg-white/20 hover:text-white'
                    }`}
                aria-label="Exercise information"
            >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
            </button>

            {/* Popover */}
            {isOpen && (
                <div
                    ref={popoverRef}
                    className="absolute bottom-full right-0 mb-2 w-72 sm:w-80 z-50 animate-scale-in origin-bottom-right"
                >
                    <div className="bg-[var(--bg-card)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-[var(--accent-primary)]/10 to-transparent">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-[var(--accent-primary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-bold text-white">Why This Exercise?</h3>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3">
                            <div>
                                <span className="text-[var(--text-tertiary)] text-[10px] uppercase tracking-wider font-bold">Target Muscle</span>
                                <p className="text-white text-sm font-medium mt-0.5">{muscleGroup}</p>
                            </div>

                            <div>
                                <span className="text-[var(--text-tertiary)] text-[10px] uppercase tracking-wider font-bold">Scientific Rationale</span>
                                <p className="text-[var(--text-secondary)] text-sm mt-1 leading-relaxed">
                                    {rationale || defaultRationale}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
                            <p className="text-[var(--text-tertiary)] text-[10px] flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                                </svg>
                                Based on exercise science research
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
