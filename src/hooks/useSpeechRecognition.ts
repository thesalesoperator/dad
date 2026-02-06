'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionOptions {
    onResult?: (transcript: string) => void;
    onError?: (error: string) => void;
}

// Comprehensive word to number mapping
const WORD_TO_NUMBER: Record<string, number> = {
    'zero': 0, 'oh': 0, 'o': 0,
    'one': 1, 'won': 1,
    'two': 2, 'to': 2, 'too': 2,
    'three': 3, 'tree': 3,
    'four': 4, 'for': 4, 'fore': 4,
    'five': 5,
    'six': 6, 'sicks': 6, 'sex': 6,
    'seven': 7,
    'eight': 8, 'ate': 8,
    'nine': 9, 'niner': 9,
    'ten': 10,
    'eleven': 11,
    'twelve': 12,
    'thirteen': 13,
    'fourteen': 14,
    'fifteen': 15,
    'sixteen': 16,
    'seventeen': 17,
    'eighteen': 18,
    'nineteen': 19,
    'twenty': 20,
    'thirty': 30,
    'forty': 40, 'fourty': 40,
    'fifty': 50,
    'sixty': 60,
    'seventy': 70,
    'eighty': 80,
    'ninety': 90,
    'hundred': 100,
    'thousand': 1000,
};

// Parse spoken numbers like "one thirty five" or "two hundred twenty five"
function parseSpokenNumber(transcript: string): string {
    // Clean up the transcript
    let text = transcript.toLowerCase().trim();

    // Remove common filler words and units
    text = text
        .replace(/^(i did |i got |it was |that's |that is |it's |)/gi, '')
        .replace(/(pounds?|lbs?|kilos?|kgs?|reps?|repetitions?|times?|sets?)\.?$/gi, '')
        .replace(/[.,!?]/g, '')
        .trim();

    // First, try to extract any pure numbers from the string
    const pureNumberMatch = text.match(/^\d+\.?\d*$/);
    if (pureNumberMatch) {
        return pureNumberMatch[0];
    }

    // Handle mixed format like "1 35" or "1 hundred 35"
    const mixedNumbers = text.match(/\d+/g);
    if (mixedNumbers && mixedNumbers.length >= 2) {
        // Check if it's a format like "1 35" meaning 135
        const first = parseInt(mixedNumbers[0]);
        const second = parseInt(mixedNumbers[1]);
        if (first < 10 && second < 100) {
            return (first * 100 + second).toString();
        }
    }

    // Split by spaces and hyphens
    const words = text.split(/[\s-]+/).filter(w => w.length > 0);

    // Try to parse word numbers
    let total = 0;
    let current = 0;
    let hasValidNumber = false;

    for (const word of words) {
        // Check if it's a direct digit
        const directNum = parseInt(word);
        if (!isNaN(directNum)) {
            // Handle sequences like "one three five" = 135
            if (directNum < 10 && hasValidNumber) {
                current = current * 10 + directNum;
            } else {
                current += directNum;
            }
            hasValidNumber = true;
            continue;
        }

        const num = WORD_TO_NUMBER[word];
        if (num !== undefined) {
            hasValidNumber = true;

            if (num === 1000) {
                current = (current === 0 ? 1 : current) * 1000;
            } else if (num === 100) {
                current = (current === 0 ? 1 : current) * 100;
            } else if (num >= 20 && num < 100) {
                // Tens place (twenty, thirty, etc.)
                if (current >= 100) {
                    current += num;
                } else {
                    current += num;
                }
            } else if (num < 20) {
                // Single digits and teens
                current += num;
            }
        }
    }

    total += current;

    // If we found valid numbers, return the total
    if (hasValidNumber && total > 0) {
        return total.toString();
    }

    // Last resort: extract any numbers from the string
    const anyNumbers = text.match(/\d+\.?\d*/);
    if (anyNumbers) {
        return anyNumbers[0];
    }

    return '';
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
            recognitionRef.current.maxAlternatives = 3; // Get multiple interpretations

            recognitionRef.current.onresult = (event: any) => {
                // Try all alternatives to find the best number
                let bestResult = '';

                for (let i = 0; i < event.results[0].length; i++) {
                    const rawTranscript = event.results[0][i].transcript;
                    const parsed = parseSpokenNumber(rawTranscript);

                    // Prefer results that parse to numbers
                    if (parsed && (!bestResult || parsed.length > bestResult.length)) {
                        bestResult = parsed;
                    }
                }

                // Fallback to first result if no number found
                if (!bestResult) {
                    bestResult = parseSpokenNumber(event.results[0][0].transcript);
                }

                setTranscript(bestResult);
                options.onResult?.(bestResult);
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
