import { useState, useCallback, useRef } from 'react';

interface UseCardAutocompleteOptions {
    onComplete: (newValue: string) => void;
}

export function useCardAutocomplete({ onComplete }: UseCardAutocompleteOptions) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [triggerIndex, setTriggerIndex] = useState<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const handleInputChange = useCallback(async (value: string, cursorPos: number) => {
        const textUpToCursor = value.slice(0, cursorPos);
        const lastOpen = textUpToCursor.lastIndexOf('[');

        // Close if no `[` found, or if it's already been closed with `]`
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
                `/cards/autocomplete?q=${encodeURIComponent(query)}`,
                { signal: abortRef.current.signal }
            );
            const data: string[] = await res.json();
            const limited = data.slice(0, 5);
            setSuggestions(limited);
            setIsOpen(limited.length > 0);
            setActiveIndex(0);
        } catch (err) {
            if ((err as Error).name !== 'AbortError') console.error(err);
        }
    }, []);

    const confirmSelection = useCallback((
        cardName: string,
        currentValue: string,
        cursorPos: number
    ) => {
        if (triggerIndex === null) return;
        const before = currentValue.slice(0, triggerIndex);
        const after = currentValue.slice(cursorPos);
        const completed = `${before}[${cardName}]${after}`;
        setIsOpen(false);
        setSuggestions([]);
        setTriggerIndex(null);
        onComplete(completed);
    }, [triggerIndex, onComplete]);

    // Returns true if the event was consumed (so the caller can skip its own handling)
    const handleKeyDown = useCallback((
        e: React.KeyboardEvent<HTMLInputElement>,
        currentValue: string,
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
                    confirmSelection(suggestions[activeIndex], currentValue, cursorPos);
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