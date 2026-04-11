import {useCallback, useEffect, useRef, useState} from 'react';
import {Pencil} from 'lucide-react';
import Panel from '@/shared/components/Panel';
import DeckSearchBar from './DeckSearchBar';
import DeckStatusBar from './DeckStatusBar';
import DeckComments from './DeckComments';
import DeckCardList from './DeckCardList';
import DeckHeaderControls from './DeckHeaderControls';
import type {CardDetailData, DeckEntry} from './types';

interface Props {
    title?:            string;
    saveLabel?:        string;
    saveError?:        boolean;
    comments?:         string | null;
    entriesLoading?:   boolean;
    deckId?:           number;
    formatValidity?:   Partial<Record<'STANDARD' | 'DUEL' | 'V5', boolean>>;
    onRename?:         (name: string) => void;
    onDelete?:         () => void;
    onRetrySave?:      () => void;
    onCommentsChange?: (comments: string | null) => void;
    entries:           DeckEntry[];
    detailMap?:        Map<string, CardDetailData>;
    onIncrement:       (cardId: string) => void;
    onDecrement:       (cardId: string) => void;
    onAddCard:         (result: CardDetailData) => void;
    onSearch:          (query: string) => Promise<CardDetailData[]>;
}

export default function DeckEditorPanel({
    title = 'Editor', saveLabel, saveError, comments, entriesLoading,
    deckId, formatValidity,
    onRename, onDelete, onRetrySave, onCommentsChange,
    entries, detailMap, onIncrement, onDecrement, onAddCard, onSearch,
}: Props) {
    const [editingName, setEditingName] = useState(false);
    const [nameValue,   setNameValue]   = useState(title);
    const nameInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { setNameValue(title); setEditingName(false); }, [title]);

    useEffect(() => {
        if (editingName) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [editingName]);

    const startEdit = useCallback(() => {
        if (!onRename) return;
        setEditingName(true);
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

    const titleSlot = editingName ? (
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
    );

    return (
        <Panel
            title={titleSlot}
            right={
                <DeckHeaderControls
                    saveLabel={saveLabel}
                    saveError={saveError}
                    onRetrySave={onRetrySave}
                    onDelete={onDelete}
                />
            }
        >
            <DeckSearchBar onSearch={onSearch} onAddCard={onAddCard} />
            <DeckStatusBar entries={entries} deckId={deckId} formatValidity={formatValidity} />
            <DeckComments  comments={comments} onCommentsChange={onCommentsChange} />
            <DeckCardList
                entries={entries}
                detailMap={detailMap}
                entriesLoading={entriesLoading}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
            />
        </Panel>
    );
}
