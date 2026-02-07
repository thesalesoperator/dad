'use client';

import { useState, useEffect } from 'react';

interface PRData {
    exercise_name: string;
    new_weight: number;
    previous_best: number;
    reps: number;
    improvement: number;
}

interface PRCelebrationProps {
    prs: PRData[];
    onDismiss: () => void;
}

export function PRCelebration({ prs, onDismiss }: PRCelebrationProps) {
    const [visible, setVisible] = useState(false);
    const [currentPR, setCurrentPR] = useState(0);

    useEffect(() => {
        // Stagger entrance
        requestAnimationFrame(() => setVisible(true));
        // Auto-dismiss after 5 seconds per PR
        const timeout = setTimeout(() => {
            if (currentPR < prs.length - 1) {
                setCurrentPR(prev => prev + 1);
            } else {
                setVisible(false);
                setTimeout(onDismiss, 500);
            }
        }, 4000);
        return () => clearTimeout(timeout);
    }, [currentPR, prs.length, onDismiss]);

    if (prs.length === 0) return null;

    const pr = prs[currentPR];

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            onClick={() => {
                if (currentPR < prs.length - 1) {
                    setCurrentPR(prev => prev + 1);
                } else {
                    setVisible(false);
                    setTimeout(onDismiss, 500);
                }
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

            {/* Particle bursts */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="pr-particle"
                        style={{
                            left: `${50 + (Math.random() - 0.5) * 60}%`,
                            top: `${50 + (Math.random() - 0.5) * 60}%`,
                            animationDelay: `${Math.random() * 0.5}s`,
                            animationDuration: `${1.5 + Math.random() * 1.5}s`,
                            width: `${4 + Math.random() * 8}px`,
                            height: `${4 + Math.random() * 8}px`,
                            backgroundColor: i % 3 === 0
                                ? 'var(--accent-primary)'
                                : i % 3 === 1
                                    ? 'var(--accent-secondary)'
                                    : 'var(--accent-tertiary)',
                        }}
                    />
                ))}
            </div>

            {/* PR Content */}
            <div className={`relative z-10 text-center transition-all duration-700 ${visible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-8'}`}>
                {/* Crown / Trophy */}
                <div className="mb-6 animate-bounce-slow">
                    <span className="text-7xl sm:text-8xl">🏆</span>
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-6xl font-black text-white mb-2 tracking-tight pr-title-glow">
                    NEW PR!
                </h1>

                {/* Exercise name */}
                <p className="text-xl sm:text-2xl font-bold gradient-text-shimmer mb-8 uppercase tracking-wider">
                    {pr.exercise_name}
                </p>

                {/* Weight comparison */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8">
                    <div className="text-center">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Previous</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white/50 font-mono line-through decoration-white/20">
                            {pr.previous_best}<span className="text-sm ml-1">lbs</span>
                        </p>
                    </div>
                    <div className="text-3xl text-[var(--accent-tertiary)] animate-pulse">→</div>
                    <div className="text-center">
                        <p className="text-[var(--accent-tertiary)] text-xs uppercase tracking-wider mb-1">New Best</p>
                        <p className="text-4xl sm:text-5xl font-black text-white font-mono pr-weight-glow">
                            {pr.new_weight}<span className="text-lg ml-1">lbs</span>
                        </p>
                    </div>
                </div>

                {/* Improvement badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-tertiary)]/20 border border-[var(--accent-tertiary)]/40 rounded-full">
                    <svg className="w-5 h-5 text-[var(--accent-tertiary)]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                    <span className="text-[var(--accent-tertiary)] font-bold text-sm">
                        +{pr.improvement} lbs × {pr.reps} reps
                    </span>
                </div>

                {/* Counter */}
                {prs.length > 1 && (
                    <p className="text-white/30 text-sm mt-6 font-mono">
                        {currentPR + 1} / {prs.length} PRs
                    </p>
                )}

                {/* Tap to continue */}
                <p className="text-white/20 text-xs mt-4 animate-pulse">Tap to continue</p>
            </div>
        </div>
    );
}
