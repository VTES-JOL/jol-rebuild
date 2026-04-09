import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, TriangleAlert, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import Panel from '@/shared/components/Panel';
import SummaryStats from '@/shared/components/SummaryStats';
import DeckCardRow from './DeckCardRow';
import { groupEntries, computeSummary, getBannedEntries } from './deckUtils';
import type { CardSearchResult, DeckEntry } from './types';

interface Props {
    title?:            string;
    saveLabel?:        string;
    saveError?:        boolean;
    comments?:         string | null;
    onRename?:         (name: string) => void;
    onDelete?:         () => void;
    onCommentsChange?: (comments: string | null) => void;
    entries:           DeckEntry[];
    onIncrement:       (cardId: string) => void;
    onDecrement:       (cardId: string) => void;
    onAddCard:         (result: CardSearchResult) => void;
    onSearch:          (query: string) => Promise<CardSearchResult[]>;
}

function cryptHint(r: CardSearchResult): string {
    if (!r.group || r.group === 'ANY') return 'Crypt';
    return `Crypt · G${r.group}`;
}


export default function DeckEditorPanel({ title = 'Editor', saveLabel, saveError, comments, onRename, onDelete, onCommentsChange, entries, onIncrement, onDecrement, onAddCard, onSearch }: Props) {
    const [query,       setQuery]       = useState('');
    const [results,     setResults]     = useState<CardSearchResult[]>([]);
    const [loading,     setLoading]     = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [editingName,   setEditingName]   = useState(false);
    const [nameValue,     setNameValue]     = useState(title);
    const [commentValue,  setCommentValue]  = useState(comments ?? '');
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Accordion: set of open group keys. Initialised once when entries first load.
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
    const groupsInitialized = useRef(false);

    useEffect(() => { setNameValue(title); setEditingName(false); }, [title]);

    // Populate accordion defaults once entries arrive (component is keyed by deck id,
    // so this ref + state reset automatically on deck switch).
    useEffect(() => {
        if (entries.length === 0 || groupsInitialized.current) return;
        groupsInitialized.current = true;
        setOpenGroups(new Set(groupEntries(entries).map(g => g.key)));
    }, [entries]);

    const toggleGroup = useCallback((key: string) => {
        setOpenGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    }, []);

    const startEdit = useCallback(() => {
        if (!onRename) return;
        setEditingName(true);
        setTimeout(() => nameInputRef.current?.select(), 0);
    }, [onRename]);

    const commitName = useCallback(() => {
        const trimmed = nameValue.trim() || title;
        setNameValue(trimmed);
        setEditingName(false);
        if (trimmed !== title) onRename?.(trimmed);
    }, [nameValue, title, onRename]);

    const handleNameKey = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter')  { e.preventDefault(); commitName(); }
        if (e.key === 'Escape') { setNameValue(title); setEditingName(false); }
    }, [commitName, title]);

    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const onSearchRef = useRef(onSearch);
    const searchRef   = useRef<HTMLDivElement>(null);
    useEffect(() => { onSearchRef.current = onSearch; });

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
        if (!value.trim()) { setResults([]); setLoading(false); return; }
        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const r = await onSearchRef.current(value);
                setResults(r);
                setActiveIndex(0);
            } finally {
                setLoading(false);
            }
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
        <Panel
            title={
                editingName ? (
                    <input
                        ref={nameInputRef}
                        value={nameValue}
                        onChange={e => setNameValue(e.target.value)}
                        onBlur={commitName}
                        onKeyDown={handleNameKey}
                        className="bg-transparent text-ink tracking-wide outline-none border-b border-line-accent w-full max-w-[220px]"
                    />
                ) : (
                    <span
                        onClick={startEdit}
                        className={`tracking-wide text-ink ${onRename ? 'cursor-pointer group flex items-center gap-1.5' : ''}`}
                    >
                        {nameValue}
                        {onRename && <Pencil className="w-2.5 h-2.5 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </span>
                )
            }
            right={
                <div className="flex items-center gap-2">
                    {saveLabel && (
                        <span className={`text-[10px] ${saveError ? 'text-blood-soft' : 'text-ink-muted'}`}>
                            {saveLabel}
                        </span>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); if (confirm('Delete this deck?')) onDelete(); }}
                            title="Delete deck"
                            className="p-1.5 rounded hover:bg-blood/10 text-ink-muted hover:text-blood transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            }
        >
            {/* Card search */}
            <div ref={searchRef} className="relative border-b border-line/50">
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                    {loading ? (
                        <div className="w-3 h-3 border border-accent/30 border-t-accent rounded-full animate-spin shrink-0" />
                    ) : (
                        <Search className="w-3 h-3 shrink-0 text-ink-muted" />
                    )}
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
                        className="absolute top-full left-0 right-0 z-20 bg-panel border border-line/60 border-t-0 rounded-b shadow-lg overflow-hidden"
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
                {query.trim() && !loading && results.length === 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 bg-panel border border-line/60 border-t-0 rounded-b shadow-lg px-3 py-2 text-xs text-ink-muted">
                        No cards found matching "{query}".
                    </div>
                )}
            </div>

            {/* Summary + banned warning */}
            <div className="px-3 py-1.5 border-b border-line/50 flex items-center justify-between gap-4 min-h-[28px]">
                <div className="flex items-center min-w-0">
                    {summary
                        ? <SummaryStats summary={summary} validate />
                        : <span className="text-[10px] text-ink-muted">Empty deck</span>
                    }
                </div>
                {banned.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-blood/30 bg-blood/10 text-[10px] text-blood-soft shrink-0">
                        <TriangleAlert className="w-3 h-3 shrink-0" />
                        <span>{banned.length} banned</span>
                    </div>
                )}
            </div>

            {/* Comments */}
            <div className="px-3 py-1.5 border-b border-line/50">
                <textarea
                    value={commentValue}
                    onChange={e => setCommentValue(e.target.value)}
                    onBlur={() => {
                        const trimmed = commentValue.trim() || null;
                        if (trimmed !== (comments ?? null)) onCommentsChange?.(trimmed);
                    }}
                    placeholder="Add a note…"
                    rows={2}
                    className="w-full bg-transparent text-xs text-ink-secondary placeholder:text-ink-muted outline-none resize-none leading-relaxed"
                />
            </div>

            {/* Card list with accordion groups */}
            {entries.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 text-sm text-ink-muted">
                    Search above to add cards.
                </div>
            ) : (
                <div className="overflow-y-auto flex-1 min-h-0">
                    {groups.map(group => {
                        const isOpen = openGroups.has(group.key);
                        return (
                            <div key={group.key}>
                                <button
                                    onClick={() => toggleGroup(group.key)}
                                    className="w-full flex items-center gap-2 pl-3 pr-4 py-2 border-b border-line/50 sticky top-0 z-10 bg-panel/30 hover:bg-hover/40 transition-colors"
                                >
                                    {isOpen
                                        ? <ChevronDown  className="w-3 h-3 text-ink-muted shrink-0" />
                                        : <ChevronRight className="w-3 h-3 text-ink-muted shrink-0" />
                                    }
                                    <span className="text-xs font-semibold text-ink">{group.key}</span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-hover border border-line/60 text-[10px] font-semibold tabular-nums text-ink-secondary leading-none">
                                        {group.total}
                                    </span>
                                    {!isOpen && (
                                        <span className="ml-auto text-[10px] text-ink-muted truncate max-w-[55%]">
                                            {group.entries.slice(0, 3).map(e => e.name).join(', ')}
                                            {group.entries.length > 3 ? '…' : ''}
                                        </span>
                                    )}
                                </button>
                                {isOpen && group.entries.map(entry => (
                                    <DeckCardRow
                                        key={entry.cardId}
                                        entry={entry}
                                        onIncrement={() => onIncrement(entry.cardId)}
                                        onDecrement={() => onDecrement(entry.cardId)}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </Panel>
    );
}
