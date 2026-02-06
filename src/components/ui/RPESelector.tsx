'use client';

import { useState } from 'react';

interface RPESelectorProps {
    value?: number;
    onChange: (rpe: number) => void;
    compact?: boolean;
}

const RPE_DESCRIPTIONS: Record<number, { label: string; color: string; description: string }> = {
    6: { label: '6', color: 'bg-green-500', description: 'Could do 4+ more reps' },
    7: { label: '7', color: 'bg-green-400', description: 'Could do 3 more reps' },
    8: { label: '8', color: 'bg-yellow-400', description: 'Could do 2 more reps' },
    9: { label: '9', color: 'bg-orange-400', description: 'Could do 1 more rep' },
    10: { label: '10', color: 'bg-red-500', description: 'Maximum effort - failure' },
};

export function RPESelector({ value, onChange, compact = false }: RPESelectorProps) {
    const [hoveredRpe, setHoveredRpe] = useState<number | null>(null);

    const displayRpe = hoveredRpe ?? value;

    if (compact) {
        return (
            <div className="flex items-center gap-1">
                {[6, 7, 8, 9, 10].map((rpe) => (
                    <button
                        key={rpe}
                        onClick={() => onChange(rpe)}
                        onMouseEnter={() => setHoveredRpe(rpe)}
                        onMouseLeave={() => setHoveredRpe(null)}
                        className={`w-6 h-6 rounded-md text-[10px] font-bold transition-all ${value === rpe
                                ? `${RPE_DESCRIPTIONS[rpe].color} text-black`
                                : 'bg-white/10 text-[var(--text-tertiary)] hover:bg-white/20'
                            }`}
                    >
                        {rpe}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold">
                    RPE (Rate of Perceived Exertion)
                </label>
                {displayRpe && (
                    <span className="text-[var(--text-tertiary)] text-xs">
                        {RPE_DESCRIPTIONS[displayRpe]?.description}
                    </span>
                )}
            </div>

            <div className="flex gap-2">
                {[6, 7, 8, 9, 10].map((rpe) => (
                    <button
                        key={rpe}
                        onClick={() => onChange(rpe)}
                        onMouseEnter={() => setHoveredRpe(rpe)}
                        onMouseLeave={() => setHoveredRpe(null)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${value === rpe
                                ? `${RPE_DESCRIPTIONS[rpe].color} text-black shadow-lg`
                                : 'bg-white/10 text-[var(--text-secondary)] hover:bg-white/20 hover:text-white'
                            }`}
                    >
                        {rpe}
                    </button>
                ))}
            </div>

            <p className="text-[var(--text-tertiary)] text-[10px] text-center">
                How hard was this set? 6 = easy, 10 = max effort
            </p>
        </div>
    );
}
