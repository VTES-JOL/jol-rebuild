import { useState, useCallback, useRef } from 'react';
import { encodedToDisplay, mapEncodedToDisplayIndex } from '../shared/utils/parseMessageTokens.ts';

export function useChatInput(initialValue = '') {
    const [draft, setDraft] = useState(initialValue); // The "true" encoded content: [card:123:Name]
    const [displayValue, setDisplayValue] = useState(encodedToDisplay(initialValue)); // What user sees: [Name]
    const cardMapRef = useRef<Map<string, number>>(new Map()); // name -> id

    const syncFromDisplay = useCallback((newDisplay: string, selectionStart: number) => {
        // Fragile part: trying to re-encode based on plain text [Name]
        // This is where we use the cardMapRef to try and recover IDs
        const newEncoded = newDisplay.replace(/\[([^\]]+)\]/g, (match, name) => {
            const id = cardMapRef.current.get(name);
            return id ? `[card:${id}:${name}]` : match;
        });

        setDraft(newEncoded);
        setDisplayValue(newDisplay);

        const encodedCursor = newDisplay.slice(0, selectionStart).replace(/\[([^\]]+)\]/g, (match, name) => {
            const id = cardMapRef.current.get(name);
            return id ? `[card:${id}:${name}]` : match;
        }).length;

        return { newEncoded, encodedCursor };
    }, []);

    const syncFromEncoded = useCallback((newEncoded: string, encodedCursor: number) => {
        // Extract new mappings
        for (const match of newEncoded.matchAll(/\[card:(\d+):([^\]]+)\]/g)) {
            cardMapRef.current.set(match[2], Number(match[1]));
        }

        const newDisplay = encodedToDisplay(newEncoded);
        const newDisplayCursor = mapEncodedToDisplayIndex(newEncoded, encodedCursor);

        setDraft(newEncoded);
        setDisplayValue(newDisplay);

        return { newDisplay, newDisplayCursor };
    }, []);

    const reset = useCallback(() => {
        setDraft('');
        setDisplayValue('');
    }, []);

    return {
        draft,
        displayValue,
        syncFromDisplay,
        syncFromEncoded,
        reset,
        cardMapRef
    };
}
