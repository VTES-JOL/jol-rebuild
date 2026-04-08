import { useState } from 'react';
import AppLayout from '@/shared/layout/AppLayout';
import DeckListPanel from './DeckListPanel';
import type { Deck } from './types';

export default function DecksPage() {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Placeholder — will be replaced with API data
    const decks: Deck[] = [];

    return (
        <AppLayout>
            <div className="grid grid-cols-[280px_1fr] gap-6 h-[85dvh]">
                <DeckListPanel
                    decks={decks}
                    selectedId={selectedId}
                    onSelect={deck => setSelectedId(deck.id)}
                />
                <div className="flex items-center justify-center text-ink-muted text-sm">
                    {selectedId ? 'Select a deck to begin editing.' : 'Select a deck to begin editing.'}
                </div>
            </div>
        </AppLayout>
    );
}