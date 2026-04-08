import { useState } from 'react';
import { Search } from 'lucide-react';
import Panel from '@/shared/components/Panel';
import DeckListItem from './DeckListItem';
import type { Deck } from './types';

interface Props {
    decks: Deck[];
    selectedId?: number | null;
    onSelect?: (deck: Deck) => void;
    onNew?: () => void;
    loadError?: string;
}

export default function DeckListPanel({ decks, selectedId = null, onSelect, onNew, loadError }: Props) {
    const [filter, setFilter] = useState('');

    const visible = filter.trim()
        ? decks.filter(d => d.name.toLowerCase().includes(filter.toLowerCase()))
        : decks;

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
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-line/50">
                <Search className="w-3 h-3 shrink-0 text-ink-muted" />
                <input
                    type="text"
                    placeholder="Filter…"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full bg-transparent text-xs text-ink placeholder:text-ink-muted outline-none"
                />
            </div>

            {loadError ? (
                <div className="flex-1 flex items-center justify-center p-8 text-center">
                    <p className="text-sm text-blood-soft">Failed to load decks.</p>
                </div>
            ) : decks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <p className="text-sm text-ink-muted">No decks yet.</p>
                    <button
                        onClick={onNew}
                        className="text-xs text-accent-soft hover:text-accent transition-colors"
                    >
                        Create your first deck →
                    </button>
                </div>
            ) : visible.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-sm text-ink-muted">No decks match "{filter}".</p>
                </div>
            ) : (
                <div className="overflow-y-auto flex-1 min-h-0">
                    {visible.map(deck => (
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