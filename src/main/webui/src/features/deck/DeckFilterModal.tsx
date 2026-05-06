import {useEffect, useRef, useState} from 'react';
import {X} from 'lucide-react';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import deckApi from './api';
import type {CardDetailData} from './types';

export interface DeckFilter {
    format?: 'STANDARD' | 'DUEL' | 'V5';
    cardId?: string;
    cardName?: string;
}

interface Props {
    current: DeckFilter;
    onApply: (filter: DeckFilter) => void;
    onClose: () => void;
}

const FORMATS = [
    {key: 'STANDARD' as const, label: 'Standard'},
    {key: 'DUEL'     as const, label: 'Duel'},
    {key: 'V5'       as const, label: 'V5'},
];

export default function DeckFilterModal({current, onApply, onClose}: Props) {
    const [format,      setFormat]      = useState<DeckFilter['format']>(current.format);
    const [cardQuery,   setCardQuery]   = useState(current.cardName ?? '');
    const [cardId,      setCardId]      = useState<string | undefined>(current.cardId);
    const [suggestions, setSuggestions] = useState<CardDetailData[]>([]);
    const [showSuggest, setShowSuggest] = useState(false);
    const debounceRef   = useRef<ReturnType<typeof setTimeout>>(undefined);
    const inputRef      = useRef<HTMLInputElement>(null);
    const justSelected  = useRef(false); // set by selectCard to suppress the next effect run

    useEffect(() => { inputRef.current?.focus(); }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);

        // Selection just happened — cardQuery changed because we called setCardQuery(card.name).
        // Don't clear cardId or fire autocomplete.
        if (justSelected.current) {
            justSelected.current = false;
            return;
        }

        if (!cardQuery.trim()) {
            setCardId(undefined);
            setSuggestions([]);
            setShowSuggest(false);
            return;
        }

        // User is typing — clear any previously selected card and search
        setCardId(undefined);
        debounceRef.current = setTimeout(async () => {
            const results = await deckApi.autocomplete(cardQuery);
            setSuggestions(results.slice(0, 8));
            setShowSuggest(results.length > 0);
        }, 250);
        return () => clearTimeout(debounceRef.current);
    }, [cardQuery]);

    const selectCard = (card: CardDetailData) => {
        justSelected.current = true;
        setCardId(card.id);
        setCardQuery(card.name);
        setSuggestions([]);
        setShowSuggest(false);
    };

    const handleApply = () => {
        const filter: DeckFilter = {};
        if (format)          filter.format   = format;
        if (cardId)          filter.cardId   = cardId;
        if (cardId && cardQuery) filter.cardName = cardQuery;
        onApply(filter);
    };

    const handleClear = () => {
        setFormat(undefined);
        setCardQuery('');
        setCardId(undefined);
        setSuggestions([]);
    };

    const isEmpty = !format && !cardId;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative flex flex-col w-full max-w-xs rounded-lg border border-line/75 bg-surface shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-line/75 bg-panel/45">
                    <h2 className="text-sm font-medium text-ink tracking-wide">Filter Decks</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-hover transition-colors cursor-pointer">
                        <X className="w-4 h-4 text-ink-muted" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-4 px-4 py-4">

                    {/* Format */}
                    <fieldset>
                        <legend className="text-xs text-ink-muted mb-2">Valid for format</legend>
                        <div className="flex gap-1.5">
                            {FORMATS.map(f => (
                                <button
                                    key={f.key}
                                    type="button"
                                    onClick={() => setFormat(format === f.key ? undefined : f.key)}
                                    className={[
                                        'flex-1 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer border',
                                        format === f.key
                                            ? 'bg-accent/20 text-accent-soft border-accent/40'
                                            : 'bg-hover text-ink-muted border-line/40 hover:text-ink hover:border-line',
                                    ].join(' ')}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    {/* Card */}
                    <div className="relative">
                        <Input
                            id="filter-card"
                            ref={inputRef}
                            size="sm"
                            label="Contains card"
                            value={cardQuery}
                            onChange={e => { setCardQuery(e.target.value); setShowSuggest(true); }}
                            onFocus={() => { if (suggestions.length) setShowSuggest(true); }}
                            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                            placeholder="Search card name…"
                            right={cardId ? (
                                <button
                                    type="button"
                                    onClick={() => { setCardQuery(''); setCardId(undefined); }}
                                    className="p-0.5 rounded hover:bg-hover cursor-pointer"
                                >
                                    <X className="w-3 h-3 text-ink-muted" />
                                </button>
                            ) : undefined}
                        />
                        {showSuggest && suggestions.length > 0 && (
                            <ul className="absolute z-10 left-0 right-0 top-full mt-1 rounded border border-line/60 bg-surface shadow-lg overflow-y-auto max-h-48">
                                {suggestions.map(card => (
                                    <li key={card.id}>
                                        <button
                                            type="button"
                                            onMouseDown={() => selectCard(card)}
                                            className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-hover transition-colors flex items-center justify-between gap-2 cursor-pointer"
                                        >
                                            <span className="truncate">{card.name}</span>
                                            <span className="shrink-0 text-[10px] text-ink-muted">
                                                {card.crypt ? 'crypt' : (card.types[0] ?? '—')}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-line/75">
                    <Button variant="ghost" size="sm" onClick={handleClear} disabled={isEmpty}>Clear</Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={handleApply}>Apply</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
