'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionOptions {
    onResult?: (transcript: string) => void;
    onError?: (error: string) => void;
}

// Word to number mapping for common spoken numbers
const WORD_TO_NUMBER: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
    'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
    'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
    'hundred': 100,
};

function parseSpokenNumber(transcript: string): string {
    // Clean up the transcript
    let text = transcript.toLowerCase().trim();

    // Remove common filler words
    text = text.replace(/^(i did |i got |it was |that's |that is |)/gi, '');
    text = text.replace(/(pounds?|lbs?|reps?|repetitions?|times?)$/gi, '').trim();

    // If it's already a number, return it
    const directNumber = text.replace(/[^0-9.]/g, '');
    if (directNumber && !isNaN(parseFloat(directNumber))) {
        return directNumber;
    }

    // Try to parse spoken words to numbers
    const words = text.split(/[\s-]+/);
    let result = 0;
    let current = 0;

    for (const word of words) {
        const num = WORD_TO_NUMBER[word];
        if (num !== undefined) {
            if (num === 100) {
                current = current === 0 ? 100 : current * 100;
            } else if (num >= 20) {
                current += num;
            } else {
                current += num;
            }
        }
    }

    result += current;

    return result > 0 ? result.toString() : directNumber || '';
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition);

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const result = event.results[0][0].transcript;
                const parsedNumber = parseSpokenNumber(result);
                setTranscript(parsedNumber);
                options.onResult?.(parsedNumber);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                options.onError?.(event.error);
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
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            setIsListening(true);
            try {
                recognitionRef.current.start();
            } catch (e) {
                // Already started
                setIsListening(false);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    return {
        isListening,
        isSupported,
        transcript,
        startListening,
        stopListening,
    };
}
