import React, {useCallback, useRef, useState} from 'react';

export interface CardSuggestion {
    id: string;
    name: string;
    crypt: boolean;
    group: string | null;
    advanced: boolean;
}

interface UseCardAutocompleteOptions {
    onComplete: (newValue: string, newCursorPos: number) => void;
}

export function useCardAutocomplete({ onComplete }: UseCardAutocompleteOptions) {
    const [suggestions, setSuggestions] = useState<CardSuggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [triggerIndex, setTriggerIndex] = useState<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // The hook only ever sees the encoded draft. triggerIndex points into it.
    const handleInputChange = useCallback(async (encoded: string, cursorPos: number) => {
        const textUpToCursor = encoded.slice(0, cursorPos);
        const lastOpen = textUpToCursor.lastIndexOf('[');

        if (lastOpen === -1 || textUpToCursor.indexOf(']', lastOpen) !== -1) {
            setIsOpen(false);
            setSuggestions([]);
            return;
        }

        const query = textUpToCursor.slice(lastOpen + 1);

        if (query.length === 0) {
            setIsOpen(false);
            setSuggestions([]);
            return;
        }

        setTriggerIndex(lastOpen);

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        try {
            const res = await fetch(
                `/api/cards/autocomplete?q=${encodeURIComponent(query)}`,
                { signal: abortRef.current.signal }
            );
            if (!res.ok) return;
            const data: CardSuggestion[] = await res.json();
            const limited = data.slice(0, 5);
            setSuggestions(limited);
            setIsOpen(limited.length > 0);
            setActiveIndex(0);
        } catch (err) {
            if ((err as Error).name !== 'AbortError') console.error(err);
        }
    }, []);

    const confirmSelection = useCallback((
        card: CardSuggestion,
        encoded: string,
        cursorPos: number
    ) => {
        if (triggerIndex === null) return;
        const before = encoded.slice(0, triggerIndex);
        const after = encoded.slice(cursorPos);
        const newCardEncoded = `[card:${card.id}:${card.name}]`;
        const newEncoded = `${before}${newCardEncoded}${after}`;

        setIsOpen(false);
        setSuggestions([]);
        setTriggerIndex(null);
        onComplete(newEncoded, before.length + newCardEncoded.length);
    }, [triggerIndex, onComplete]);

    const handleKeyDown = useCallback((
        e: React.KeyboardEvent<HTMLInputElement>,
        encoded: string,
        cursorPos: number
    ): boolean => {
        if (!isOpen) return false;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
                return true;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(i => Math.max(i - 1, 0));
                return true;
            case 'Tab':
            case 'Enter':
                if (suggestions[activeIndex]) {
                    e.preventDefault();
                    confirmSelection(suggestions[activeIndex], encoded, cursorPos);
                    return true;
                }
                return false;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                return true;
            default:
                return false;
        }
    }, [isOpen, suggestions, activeIndex, confirmSelection]);

    return { suggestions, isOpen, activeIndex, handleInputChange, handleKeyDown, confirmSelection };
}
