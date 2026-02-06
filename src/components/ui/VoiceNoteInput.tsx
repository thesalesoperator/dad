'use client';

import { useState, useEffect, useRef } from 'react';

interface VoiceNoteInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function VoiceNoteInput({ value, onChange, placeholder }: VoiceNoteInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition);

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                // Append to existing value or set new
                const newValue = value ? `${value} ${transcript}` : transcript;
                onChange(newValue);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [value, onChange]);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setIsListening(true);
            try {
                recognitionRef.current.start();
            } catch {
                setIsListening(false);
            }
        }
    };

    return (
        <div className={`flex items-center gap-2 bg-white/5 border rounded-lg px-3 py-2 transition-colors ${isListening
                ? 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10'
                : 'border-white/10 focus-within:border-[var(--accent-primary)]'
            }`}>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || "Add notes..."}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            {isSupported && (
                <button
                    type="button"
                    onClick={startListening}
                    disabled={isListening}
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${isListening
                            ? 'bg-[var(--accent-secondary)] text-white animate-pulse'
                            : 'bg-white/10 text-[var(--text-secondary)] hover:bg-white/20 hover:text-white active:scale-95'
                        }`}
                    aria-label={isListening ? 'Listening...' : 'Voice note'}
                >
                    {isListening ? (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="6" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
}
