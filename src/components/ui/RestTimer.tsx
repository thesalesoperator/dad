'use client';

import { useState, useEffect, useCallback } from 'react';

interface RestTimerProps {
    goal: 'strength' | 'hypertrophy' | 'general';
    onComplete?: () => void;
    autoStart?: boolean;
}

const GOAL_REST_TIMES: Record<string, { seconds: number; label: string }> = {
    strength: { seconds: 180, label: '3:00' },
    hypertrophy: { seconds: 90, label: '1:30' },
    general: { seconds: 60, label: '1:00' },
};

export function RestTimer({ goal, onComplete, autoStart = false }: RestTimerProps) {
    const defaultTime = GOAL_REST_TIMES[goal]?.seconds || 90;
    const [timeLeft, setTimeLeft] = useState(defaultTime);
    const [isRunning, setIsRunning] = useState(autoStart);
    const [isComplete, setIsComplete] = useState(false);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress percentage
    const progress = ((defaultTime - timeLeft) / defaultTime) * 100;

    // Reset timer
    const resetTimer = useCallback(() => {
        setTimeLeft(defaultTime);
        setIsRunning(false);
        setIsComplete(false);
    }, [defaultTime]);

    // Start/Pause toggle
    const toggleTimer = () => {
        if (isComplete) {
            resetTimer();
        } else {
            setIsRunning(!isRunning);
        }
    };

    // Skip timer
    const skipTimer = () => {
        setTimeLeft(0);
        setIsRunning(false);
        setIsComplete(true);
        onComplete?.();
    };

    // Add time
    const addTime = (seconds: number) => {
        setTimeLeft(prev => Math.max(0, prev + seconds));
    };

    // Countdown effect
    useEffect(() => {
        if (!isRunning || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsRunning(false);
                    setIsComplete(true);
                    onComplete?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, timeLeft, onComplete]);

    // Reset when goal changes
    useEffect(() => {
        resetTimer();
    }, [goal, resetTimer]);

    return (
        <div className="relative">
            {/* Collapsed State - Just show mini timer */}
            <div className={`bg-[var(--bg-card)] border border-white/10 rounded-2xl overflow-hidden transition-all ${isComplete ? 'border-[var(--accent-tertiary)]/50 shadow-[0_0_20px_-5px_var(--accent-tertiary)]' : ''}`}>
                {/* Progress bar */}
                <div className="h-1 bg-white/5">
                    <div
                        className={`h-full transition-all duration-1000 ease-linear ${isComplete ? 'bg-[var(--accent-tertiary)]' : 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="p-4">
                    <div className="flex items-center justify-between">
                        {/* Timer display */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTimer}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isComplete
                                        ? 'bg-[var(--accent-tertiary)]/20 text-[var(--accent-tertiary)]'
                                        : isRunning
                                            ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {isComplete ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                ) : isRunning ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                    </svg>
                                )}
                            </button>

                            <div>
                                <div className={`text-2xl font-bold font-mono tracking-tight ${isComplete ? 'text-[var(--accent-tertiary)]' : 'text-white'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                                <div className="text-[var(--text-tertiary)] text-[10px] uppercase tracking-wider font-bold">
                                    {isComplete ? 'REST COMPLETE' : isRunning ? 'RESTING' : 'REST TIMER'}
                                </div>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-2">
                            {!isComplete && (
                                <>
                                    <button
                                        onClick={() => addTime(-15)}
                                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-all text-xs font-bold"
                                    >
                                        -15
                                    </button>
                                    <button
                                        onClick={() => addTime(15)}
                                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-all text-xs font-bold"
                                    >
                                        +15
                                    </button>
                                    <button
                                        onClick={skipTimer}
                                        className="px-3 h-8 rounded-lg bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-all text-xs font-bold uppercase tracking-wide"
                                    >
                                        Skip
                                    </button>
                                </>
                            )}
                            {isComplete && (
                                <button
                                    onClick={resetTimer}
                                    className="px-3 h-8 rounded-lg bg-[var(--accent-tertiary)]/10 border border-[var(--accent-tertiary)]/30 text-[var(--accent-tertiary)] hover:bg-[var(--accent-tertiary)]/20 transition-all text-xs font-bold uppercase tracking-wide"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Goal info */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[var(--text-tertiary)] text-[10px] uppercase tracking-wider">
                            {goal} rest: {GOAL_REST_TIMES[goal]?.label}
                        </span>
                        <span className="text-[var(--text-tertiary)] text-[10px]">
                            Based on exercise science for optimal {goal === 'strength' ? 'strength gains' : goal === 'hypertrophy' ? 'muscle growth' : 'recovery'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Hook to use timer state externally
export function useRestTimer(goal: 'strength' | 'hypertrophy' | 'general') {
    const [shouldStart, setShouldStart] = useState(false);

    const startTimer = useCallback(() => {
        setShouldStart(true);
        // Reset after a tick to allow component to pick up the change
        setTimeout(() => setShouldStart(false), 100);
    }, []);

    return { shouldStart, startTimer };
}
