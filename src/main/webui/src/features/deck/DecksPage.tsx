import { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '@/shared/layout/AppLayout';
import DeckListPanel from './DeckListPanel';
import DeckEditorPanel from './DeckEditorPanel';
import DeckAnalyticsPanel from './DeckAnalyticsPanel';
import { computeSummary, formatSummaryCompact, toKrcgContents, fromKrcgContents } from './deckUtils';
import deckApi from './api';
import type { Deck, DeckEntry, CardSearchResult } from './types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function DecksPage() {
    const [decks,      setDecks]      = useState<Deck[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [entries,    setEntries]    = useState<DeckEntry[]>([]);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [loadError,  setLoadError]  = useState<string | null>(null);

    const saveTimer    = useRef<ReturnType<typeof setTimeout>>(undefined);
    const isDirtyRef   = useRef(false);

    // ── Load deck list on mount ───────────────────────────────────────────────
    useEffect(() => {
        deckApi.list()
            .then(setDecks)
            .catch(e => setLoadError(String(e)));
    }, []);

    // ── Load contents when selection changes ─────────────────────────────────
    useEffect(() => {
        if (selectedId == null) { setEntries([]); return; }
        setEntries([]);
        deckApi.getContents(selectedId)
            .then(contents => setEntries(fromKrcgContents(contents)))
            .catch(console.error);
    }, [selectedId]);

    // ── Auto-save on entries change ──────────────────────────────────────────
    useEffect(() => {
        clearTimeout(saveTimer.current); // always cancel pending save first
        if (!isDirtyRef.current) return; // skip the initial load
        setSaveStatus('saving');
        saveTimer.current = setTimeout(async () => {
            if (selectedId == null) return;
            try {
                const summary  = computeSummary(entries);
                const updated  = await deckApi.save(selectedId, {
                    contents: toKrcgContents(entries),
                    summary:  summary ? formatSummaryCompact(summary) : null,
                });
                setDecks(ds => ds.map(d => d.id === updated.id ? updated : d));
                setSaveStatus('saved');
            } catch {
                setSaveStatus('error');
            }
        }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entries]);

    const handleSelect = useCallback((deck: Deck) => {
        isDirtyRef.current = false;
        setSelectedId(deck.id);
        setSaveStatus('idle');
    }, []);

    const handleNew = useCallback(async () => {
        try {
            const deck = await deckApi.create('New Deck');
            setDecks(ds => [deck, ...ds]);
            isDirtyRef.current = false;
            setSelectedId(deck.id);
            setSaveStatus('idle');
        } catch (e) {
            console.error('Failed to create deck', e);
        }
    }, []);

    const handleIncrement = useCallback((cardId: string) => {
        isDirtyRef.current = true;
        setEntries(es => es.map(e => e.cardId === cardId ? { ...e, count: e.count + 1 } : e));
    }, []);

    const handleDecrement = useCallback((cardId: string) => {
        isDirtyRef.current = true;
        setEntries(es => {
            const entry = es.find(e => e.cardId === cardId);
            if (!entry) return es;
            return entry.count <= 1
                ? es.filter(e => e.cardId !== cardId)
                : es.map(e => e.cardId === cardId ? { ...e, count: e.count - 1 } : e);
        });
    }, []);

    const handleRename = useCallback(async (name: string) => {
        if (selectedId == null) return;
        try {
            const updated = await deckApi.save(selectedId, { name });
            setDecks(ds => ds.map(d => d.id === updated.id ? updated : d));
        } catch (e) {
            console.error('Failed to rename deck', e);
        }
    }, [selectedId]);

    const handleCommentsChange = useCallback(async (comments: string | null) => {
        if (selectedId == null) return;
        try {
            const updated = await deckApi.save(selectedId, { comments });
            setDecks(ds => ds.map(d => d.id === updated.id ? updated : d));
        } catch (e) {
            console.error('Failed to save comments', e);
        }
    }, [selectedId]);

    const handleDelete = useCallback(async () => {
        if (selectedId == null) return;
        try {
            await deckApi.remove(selectedId);
            setDecks(ds => ds.filter(d => d.id !== selectedId));
            setSelectedId(null);
            setEntries([]);
            setSaveStatus('idle');
        } catch (e) {
            console.error('Failed to delete deck', e);
            setSaveStatus('error');
        }
    }, [selectedId]);

    const handleAddCard = useCallback((result: CardSearchResult) => {
        isDirtyRef.current = true;
        setEntries(es => {
            const existing = es.find(e => e.cardId === result.id);
            if (existing) return es.map(e => e.cardId === result.id ? { ...e, count: e.count + 1 } : e);
            return [...es, {
                cardId:  result.id,
                name:    result.name,
                count:   1,
                isCrypt: result.crypt,
                types:   result.crypt ? (result.cryptType ? [result.cryptType] : ['Vampire']) : result.types,
                group:   result.group ?? undefined,
                banned:  result.banned,
            }];
        });
    }, []);

    const selectedDeck = decks.find(d => d.id === selectedId);

    const saveLabel: Record<SaveStatus, string> = {
        idle: '', saving: 'Saving…', saved: 'Saved', error: 'Save failed',
    };

    return (
        <AppLayout background={"/Locations23.jpg"}>
            <div className="grid grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_280px] grid-rows-1 gap-6 h-[85dvh]">
                <DeckListPanel
                    decks={decks}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    onNew={handleNew}
                    loadError={loadError ?? undefined}
                />
                {selectedId != null ? (
                    <DeckEditorPanel
                        key={selectedId}
                        title={selectedDeck?.name ?? 'Editor'}
                        saveLabel={saveStatus !== 'idle' ? saveLabel[saveStatus] : undefined}
                        saveError={saveStatus === 'error'}
                        comments={selectedDeck?.comments}
                        onRename={handleRename}
                        onCommentsChange={handleCommentsChange}
                        onDelete={handleDelete}
                        entries={entries}
                        onIncrement={handleIncrement}
                        onDecrement={handleDecrement}
                        onAddCard={handleAddCard}
                        onSearch={deckApi.autocomplete}
                    />
                ) : (
                    <div className="flex items-center justify-center text-ink-muted text-sm">
                        Select a deck to begin editing.
                    </div>
                )}
                <div className="hidden xl:contents">
                    <DeckAnalyticsPanel entries={entries} />
                </div>
            </div>
        </AppLayout>
    );
}