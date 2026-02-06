'use client';

import { useState } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label: string;
}

export function VoiceInput({ value, onChange, placeholder, label }: VoiceInputProps) {
    const [localValue, setLocalValue] = useState(value);

    const { isListening, isSupported, startListening } = useSpeechRecognition({
        onResult: (transcript) => {
            setLocalValue(transcript);
            onChange(transcript);
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
        onChange(e.target.value);
    };

    return (
        <div className={`bg-white/5 rounded-[var(--radius-sm)] px-2 sm:px-3 py-2 sm:py-3 border transition-colors flex items-center gap-1 ${isListening
                ? 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 animate-pulse'
                : 'border-white/10 focus-within:border-[var(--accent-primary)]'
            }`}>
            <span className="text-[8px] sm:text-[10px] text-[var(--text-secondary)] uppercase font-semibold w-6 sm:w-8 shrink-0">
                {label}
            </span>
            <input
                type="number"
                inputMode="numeric"
                placeholder={placeholder || '-'}
                value={localValue}
                onChange={handleChange}
                className="w-full bg-transparent text-right text-base sm:text-lg text-white font-medium outline-none placeholder:text-white/20 min-w-0"
            />
            {isSupported && (
                <button
                    type="button"
                    onClick={startListening}
                    disabled={isListening}
                    className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${isListening
                            ? 'bg-[var(--accent-secondary)] text-white scale-110'
                            : 'bg-white/10 text-[var(--text-secondary)] hover:bg-white/20 hover:text-white active:scale-95'
                        }`}
                    aria-label={isListening ? 'Listening...' : 'Voice input'}
                >
                    {isListening ? (
                        <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="6" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
}
