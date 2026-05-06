import {useCallback} from 'react';
import deckApi from '@/features/deck/api';
import type {Deck} from '@/features/deck/types';
import {parseSummary} from '@/features/deck/deckUtils';
import SummaryStats from '@/shared/components/SummaryStats';
import {FORMAT_LABELS} from '@/features/game/constants';
import {useAsyncState} from '@/hooks/useAsyncState';

interface Props {
    format: 'STANDARD' | 'DUEL' | 'V5';
    selectedId: string | null;
    onSelect: (deckId: string) => void;
}

export default function DeckSelector({format, selectedId, onSelect}: Props) {
    const fetchDecks = useCallback(() => deckApi.list({format}), [format]);
    const {data: decks, loading} = useAsyncState<Deck[]>(fetchDecks);

    if (loading) {
        return <p className="text-xs text-ink-muted p-3 animate-pulse">Loading decks…</p>;
    }

    if (!decks?.length) {
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
