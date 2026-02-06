'use client';

import { useState, useRef, useEffect } from 'react';

interface Exercise {
    id: string;
    name: string;
    muscle_group: string;
}

interface ExerciseSwapProps {
    currentExercise: Exercise;
    alternatives: Exercise[];
    onSwap: (newExerciseId: string) => void;
}

export function ExerciseSwap({ currentExercise, alternatives, onSwap }: ExerciseSwapProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (alternatives.length === 0) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--accent-secondary)] hover:text-white transition-colors flex items-center gap-1"
            >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                SWAP
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 sm:w-64 bg-[var(--bg-dark)] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-white/10">
                        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Swap to alternative</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {alternatives.map((alt) => (
                            <button
                                key={alt.id}
                                onClick={() => {
                                    onSwap(alt.id);
                                    setIsOpen(false);
                                }}
                                className="w-full px-3 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                            >
                                <p className="text-sm font-medium text-white">{alt.name}</p>
                                <p className="text-[10px] text-[var(--text-secondary)] uppercase">{alt.muscle_group}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
