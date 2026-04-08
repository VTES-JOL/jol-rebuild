import Panel from '@/shared/components/Panel';
import DeckListItem from './DeckListItem';
import type { Deck } from './types';

interface Props {
    decks: Deck[];
    selectedId?: number | null;
    onSelect?: (deck: Deck) => void;
    onNew?: () => void;
}

export default function DeckListPanel({ decks, selectedId = null, onSelect, onNew }: Props) {
    return (
        <Panel
            title="My Decks"
            right={
                <button
                    onClick={onNew}
                    className="text-xs px-2 py-1 rounded text-accent-soft hover:text-accent transition-colors cursor-pointer"
                >
                    + New
                </button>
            }
        >
            {decks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <p className="text-sm text-ink-muted">No decks yet.</p>
                    <button
                        onClick={onNew}
                        className="text-xs text-accent-soft hover:text-accent transition-colors"
                    >
                        Create your first deck →
                    </button>
                </div>
            ) : (
                <div className="overflow-y-auto flex-1 min-h-0">
                    {decks.map(deck => (
                        <DeckListItem
                            key={deck.id}
                            deck={deck}
                            selected={selectedId === deck.id}
                            onClick={() => onSelect?.(deck)}
                        />
                    ))}
                </div>
            )}
        </Panel>
    );
}