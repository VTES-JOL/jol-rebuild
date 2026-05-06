import {useState} from 'react';
import {Filter, Layers, Search, X} from 'lucide-react';
import Panel from '@/shared/components/Panel';
import Button from '@/shared/components/Button';
import EmptyState from '@/shared/components/EmptyState';
import DeckListItem from './DeckListItem';
import type {DeckFilter} from './DeckFilterModal';
import DeckFilterModal from './DeckFilterModal';
import type {Deck} from './types';

interface Props {
    decks: Deck[];
    selectedId?: string | null;
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
                        <Button variant="ghost" size="sm" onClick={onImport}>Import</Button>
                        <Button variant="accent-ghost" size="sm" onClick={onNew}>+ New</Button>
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
                    <EmptyState
                        title="Failed to load decks."
                        className="text-blood-soft"
                    />
                ) : decks.length === 0 && !hasActiveFilter ? (
                    <EmptyState
                        icon={Layers}
                        title="No decks yet."
                        action={
                            <Button variant="accent-ghost" size="sm" onClick={onNew}>
                                Create your first deck →
                            </Button>
                        }
                    />
                ) : decks.length === 0 && hasActiveFilter ? (
                    <EmptyState title="No decks match the current filter." />
                ) : visible.length === 0 ? (
                    <EmptyState title={`No decks match "${nameFilter}".`} />
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