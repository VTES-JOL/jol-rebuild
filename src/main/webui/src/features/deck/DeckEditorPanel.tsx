import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, TriangleAlert } from 'lucide-react';
import Panel from '@/shared/components/Panel';
import SummaryStats from '@/shared/components/SummaryStats';
import DeckCardRow from './DeckCardRow';
import { groupEntries, computeSummary, getBannedEntries } from './deckUtils';
import type { CardSearchResult, DeckEntry } from './types';

interface Props {
    entries: DeckEntry[];
    onIncrement: (cardId: string) => void;
    onDecrement: (cardId: string) => void;
    onAddCard:  (result: CardSearchResult) => void;
    onSearch:   (query: string) => Promise<CardSearchResult[]>;
}

function cryptHint(r: CardSearchResult): string {
    if (!r.group || r.group === 'ANY') return 'Crypt';
    return `Crypt · G${r.group}`;
}

export default function DeckEditorPanel({ entries, onIncrement, onDecrement, onAddCard, onSearch }: Props) {
    const [query,       setQuery]       = useState('');
    const [results,     setResults]     = useState<CardSearchResult[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    const debounceRef  = useRef<ReturnType<typeof setTimeout>>(undefined);
    const onSearchRef  = useRef(onSearch);
    const searchRef    = useRef<HTMLDivElement>(null);
    useEffect(() => { onSearchRef.current = onSearch; });

    // Fix 1: close dropdown on outside click
    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setResults([]);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const summary = computeSummary(entries);
    const banned  = getBannedEntries(entries);
    const groups  = groupEntries(entries);

    const handleQueryChange = useCallback((value: string) => {
        setQuery(value);
        setActiveIndex(0);
        clearTimeout(debounceRef.current);
        if (!value.trim()) { setResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            const r = await onSearchRef.current(value);
            setResults(r);
            setActiveIndex(0);
        }, 180);
    }, []);

    const selectResult = useCallback((result: CardSearchResult) => {
        onAddCard(result);
        setQuery('');
        setResults([]);
    }, [onAddCard]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!results.length) return;
        if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)); }
        if (e.key === 'ArrowUp')    { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter')      { e.preventDefault(); selectResult(results[activeIndex]); }
        if (e.key === 'Escape')     { setQuery(''); setResults([]); }
    }, [results, activeIndex, selectResult]);

    return (
        <Panel title="Editor">
            {/* Card search — ref wraps input + dropdown for outside-click detection */}
            <div ref={searchRef} className="relative border-b border-line/50">
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                    <Search className="w-3 h-3 shrink-0 text-ink-muted" />
                    <input
                        type="text"
                        placeholder="Add card…"
                        value={query}
                        onChange={e => handleQueryChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent text-xs text-ink placeholder:text-ink-muted outline-none"
                    />
                </div>
                {results.length > 0 && (
                    <ul
                        role="listbox"
                        className="absolute top-full left-0 right-0 z-10 bg-panel/95 backdrop-blur-sm border border-line/60 border-t-0 rounded-b shadow-lg overflow-hidden"
                    >
                        {results.map((r, i) => (
                            <li
                                key={r.id}
                                role="option"
                                aria-selected={i === activeIndex}
                                onMouseDown={e => { e.preventDefault(); selectResult(r); }}
                                onMouseEnter={() => setActiveIndex(i)}
                                className={[
                                    'flex items-center justify-between gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors',
                                    i === activeIndex
                                        ? 'bg-accent/10 text-ink'
                                        : 'text-ink-secondary hover:bg-hover/50',
                                ].join(' ')}
                            >
                                <span className="truncate">{r.name}</span>
                                {/* Fix 2: ANY-group crypt cards render "Crypt", not "Crypt · GANY" */}
                                <span className="text-[10px] text-ink-muted shrink-0">
                                    {r.crypt ? cryptHint(r) : r.types.join('/')}
                                </span>
                            </li>
                        ))}
                        <li className="px-3 py-1 text-[10px] text-ink-muted border-t border-line/40 select-none">
                            ↑↓ navigate · Enter select · Esc dismiss
                        </li>
                    </ul>
                )}
            </div>

            {/* Live summary */}
            <div className="px-3 py-1.5 border-b border-line/50 flex items-center min-h-[28px]">
                {summary
                    ? <SummaryStats summary={summary} validate />
                    : <span className="text-[10px] text-ink-muted">Empty deck</span>
                }
            </div>

            {/* Banned warning */}
            {banned.length > 0 && (
                <div className="mx-3 my-2 flex items-center gap-2 px-2.5 py-1.5 rounded border border-blood/30 bg-blood/10 text-xs text-blood-soft">
                    <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>
                        {banned.length} banned card{banned.length > 1 ? 's' : ''} in this deck
                    </span>
                </div>
            )}

            {/* Grouped card list */}
            {entries.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 text-sm text-ink-muted">
                    Search above to add cards.
                </div>
            ) : (
                <div className="overflow-y-auto flex-1 min-h-0">
                    {groups.map(group => (
                        <div key={group.key}>
                            <div className="flex items-center gap-2 pl-3 pr-4 py-2 bg-panel border-y border-line/50 sticky top-0 z-1">
                                <span className="text-xs font-semibold text-ink">{group.key}</span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-hover border border-line/60 text-[10px] font-semibold tabular-nums text-ink-secondary leading-none">
                                    {group.total}
                                </span>
                            </div>
                            {group.entries.map(entry => (
                                <DeckCardRow
                                    key={entry.cardId}
                                    entry={entry}
                                    onIncrement={() => onIncrement(entry.cardId)}
                                    onDecrement={() => onDecrement(entry.cardId)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}
