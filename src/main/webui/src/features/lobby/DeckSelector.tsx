import {useEffect, useState} from 'react';
import deckApi from '@/features/deck/api';
import type {Deck} from '@/features/deck/types';
import {parseSummary} from '@/features/deck/deckUtils';
import SummaryStats from '@/shared/components/SummaryStats';

interface Props {
    format: 'STANDARD' | 'DUEL' | 'V5';
    selectedId: number | null;
    onSelect: (deckId: number) => void;
}

const FORMAT_LABELS: Record<string, string> = {
    STANDARD: 'Standard',
    DUEL: 'Duel',
    V5: 'V5',
};

export default function DeckSelector({format, selectedId, onSelect}: Props) {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        deckApi.list({format})
            .then(setDecks)
            .catch(() => setDecks([]))
            .finally(() => setLoading(false));
    }, [format]);

    if (loading) {
        return <p className="text-xs text-ink-muted p-3 animate-pulse">Loading decks…</p>;
    }

    if (!decks.length) {
        return (
            <p className="text-xs text-ink-muted p-3">
                No decks valid for {FORMAT_LABELS[format]}. Build one in the Decks section first.
            </p>
        );
    }

    return (
        <div className="overflow-y-auto max-h-52 border border-line/50 rounded">
            {decks.map(deck => (
                <div
                    key={deck.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(deck.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(deck.id); }}
                    className={[
                        'w-full text-left px-3 py-2 border-b border-line/40 transition-colors cursor-pointer border-l-2',
                        selectedId === deck.id
                            ? 'bg-accent/10 border-l-accent'
                            : 'border-l-transparent hover:bg-hover',
                    ].join(' ')}
                >
                    <span className={`text-sm font-semibold truncate block ${selectedId === deck.id ? 'text-accent-soft' : 'text-ink'}`}>
                        {deck.name}
                    </span>
                    {parseSummary(deck.summary) && (
                        <SummaryStats summary={parseSummary(deck.summary)!} validate className="mt-1" />
                    )}
                </div>
            ))}
        </div>
    );
}
