import {useState} from 'react';
import {Filter, Search, X} from 'lucide-react';
import Panel from '@/shared/components/Panel';
import DeckListItem from './DeckListItem';
import DeckFilterModal from './DeckFilterModal';
import type {DeckFilter} from './DeckFilterModal';
import type {Deck} from './types';

interface Props {
    decks: Deck[];
    selectedId?: number | null;
    onSelect?: (deck: Deck) => void;
    onNew?: () => void;
    onImport?: () => void;
    onFilter?: (filter: DeckFilter) => void;
    activeFilter?: DeckFilter;
    loadError?: string;
}

export default function DeckListPanel({
    decks, selectedId = null, onSelect, onNew, onImport, onFilter, activeFilter = {}, loadError,
}: Props) {
    const [nameFilter,  setNameFilter]  = useState('');
    const [showFilter,  setShowFilter]  = useState(false);

    const hasActiveFilter = !!(activeFilter.format || activeFilter.cardId);

    const visible = nameFilter.trim()
        ? decks.filter(d => d.name.toLowerCase().includes(nameFilter.toLowerCase()))
        : decks;

    const handleApplyFilter = (filter: DeckFilter) => {
        onFilter?.(filter);
        setShowFilter(false);
    };

    const clearFilter = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFilter?.({});
    };

    return (
        <>
            <Panel
                title="My Decks"
                right={
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onImport}
                            className="text-xs px-2 py-1 rounded text-ink-muted hover:text-ink transition-colors cursor-pointer"
                        >
                            Import
                        </button>
                        <button
                            onClick={onNew}
                            className="text-xs px-2 py-1 rounded text-accent-soft hover:text-accent transition-colors cursor-pointer"
                        >
                            + New
                        </button>
                    </div>
                }
            >
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-line/50">
                    <Search className="w-3 h-3 shrink-0 text-ink-muted" />
                    <input
                        type="text"
                        placeholder="Filter by name…"
                        value={nameFilter}
                        onChange={e => setNameFilter(e.target.value)}
                        className="w-full bg-transparent text-xs text-ink placeholder:text-ink-muted outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => setShowFilter(true)}
                        className={[
                            'shrink-0 p-1 rounded transition-colors cursor-pointer relative',
                            hasActiveFilter
                                ? 'text-accent-soft hover:text-accent'
                                : 'text-ink-muted hover:text-ink',
                        ].join(' ')}
                        title="Advanced filter"
                    >
                        <Filter className="w-3 h-3" />
                        {hasActiveFilter && (
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
                        )}
                    </button>
                </div>

                {/* Active filter pills */}
                {hasActiveFilter && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-line/50 flex-wrap">
                        {activeFilter.format && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/15 text-accent-soft text-[10px]">
                                {activeFilter.format}
                            </span>
                        )}
                        {activeFilter.cardName && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/15 text-accent-soft text-[10px] max-w-[140px] truncate">
                                {activeFilter.cardName}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={clearFilter}
                            className="ml-auto p-0.5 rounded hover:bg-hover text-ink-muted hover:text-ink transition-colors cursor-pointer"
                            title="Clear filter"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {loadError ? (
                    <div className="flex-1 flex items-center justify-center p-8 text-center">
                        <p className="text-sm text-blood-soft">Failed to load decks.</p>
                    </div>
                ) : decks.length === 0 && !hasActiveFilter ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-center">
                        <p className="text-sm text-ink-muted">No decks yet.</p>
                        <button
                            onClick={onNew}
                            className="text-xs text-accent-soft hover:text-accent transition-colors"
                        >
                            Create your first deck →
                        </button>
                    </div>
                ) : decks.length === 0 && hasActiveFilter ? (
                    <div className="flex-1 flex items-center justify-center p-8 text-center">
                        <p className="text-sm text-ink-muted">No decks match the current filter.</p>
                    </div>
                ) : visible.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <p className="text-sm text-ink-muted">No decks match "{nameFilter}".</p>
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

            {showFilter && (
                <DeckFilterModal
                    current={activeFilter}
                    onApply={handleApplyFilter}
                    onClose={() => setShowFilter(false)}
                />
            )}
        </>
    );
}