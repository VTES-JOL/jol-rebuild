import { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '@/shared/layout/AppLayout';
import DeckListPanel from './DeckListPanel';
import DeckEditorPanel from './DeckEditorPanel';
import DeckAnalyticsPanel from './DeckAnalyticsPanel';
import DeckImportModal from './DeckImportModal';
import { computeSummary, formatSummaryCompact, toKrcgContents, extractKrcgCards, enrichEntry } from './deckUtils';
import deckApi from './api';
import type { CardDetailData, Deck, DeckEntry } from './types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function DecksPage() {
    const [decks,           setDecks]           = useState<Deck[]>([]);
    const [selectedId,      setSelectedId]      = useState<number | null>(null);
    const [entries,         setEntries]         = useState<DeckEntry[]>([]);
    const [detailMap,       setDetailMap]       = useState<Map<string, CardDetailData>>(new Map());
    const [saveStatus,      setSaveStatus]      = useState<SaveStatus>('idle');
    const [loadError,       setLoadError]       = useState<string | null>(null);
    const [entriesLoading,  setEntriesLoading]  = useState(false);
    const [showImport,      setShowImport]      = useState(false);

    const saveTimer    = useRef<ReturnType<typeof setTimeout>>(undefined);
    const isDirtyRef   = useRef(false);
    const entriesRef   = useRef<DeckEntry[]>([]);
    const detailMapRef = useRef<Map<string, CardDetailData>>(new Map());

    // ── Load deck list on mount ───────────────────────────────────────────────
    useEffect(() => {
        deckApi.list()
            .then(setDecks)
            .catch(e => setLoadError(String(e)));
    }, []);

    // ── Load contents when selection changes ─────────────────────────────────
    useEffect(() => {
        if (selectedId == null) {
            setEntries([]); entriesRef.current = [];
            setDetailMap(new Map()); detailMapRef.current = new Map();
            return;
        }
        setEntries([]);
        entriesRef.current = [];
        setDetailMap(new Map());
        setEntriesLoading(true);

        deckApi.getContents(selectedId)
            .then(async contents => {
                const raw     = extractKrcgCards(contents);
                const details = await deckApi.cardDetails(raw.map(c => c.id));
                const dmap    = new Map(details.map(d => [d.id, d]));
                const loaded  = raw.map(c => enrichEntry(c, dmap.get(c.id)));
                setDetailMap(dmap);
                detailMapRef.current = dmap;
                setEntries(loaded);
                entriesRef.current = loaded;
            })
            .catch(console.error)
            .finally(() => setEntriesLoading(false));
    }, [selectedId]);

    useEffect(() => { entriesRef.current   = entries;   }, [entries]);
    useEffect(() => { detailMapRef.current = detailMap; }, [detailMap]);

    // ── Auto-save on entries change ──────────────────────────────────────────
    useEffect(() => {
        clearTimeout(saveTimer.current);
        if (!isDirtyRef.current) return;
        setSaveStatus('saving');
        saveTimer.current = setTimeout(async () => {
            if (selectedId == null) return;
            try {
                const summary = computeSummary(entries);
                const updated = await deckApi.save(selectedId, {
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
        if (isDirtyRef.current && selectedId != null) {
            clearTimeout(saveTimer.current);
            const snapshot = entriesRef.current;
            const summary  = computeSummary(snapshot);
            deckApi.save(selectedId, {
                contents: toKrcgContents(snapshot),
                summary:  summary ? formatSummaryCompact(summary) : null,
            })
                .then(updated => setDecks(ds => ds.map(d => d.id === updated.id ? updated : d)))
                .catch(console.error);
        }
        isDirtyRef.current = false;
        setSelectedId(deck.id);
        setSaveStatus('idle');
    }, [selectedId]);

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

    const handleImport = useCallback(async (name: string, entries: { cardId: string; count: number }[]) => {
        const deck = await deckApi.importDeck(name, entries);
        setDecks(ds => [deck, ...ds]);
        isDirtyRef.current = false;
        setSelectedId(deck.id);
        setSaveStatus('idle');
        setShowImport(false);
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

    const handleRetrySave = useCallback(async () => {
        if (selectedId == null) return;
        setSaveStatus('saving');
        try {
            const snapshot = entriesRef.current;
            const summary  = computeSummary(snapshot);
            const updated  = await deckApi.save(selectedId, {
                contents: toKrcgContents(snapshot),
                summary:  summary ? formatSummaryCompact(summary) : null,
            });
            setDecks(ds => ds.map(d => d.id === updated.id ? updated : d));
            setSaveStatus('saved');
        } catch {
            setSaveStatus('error');
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

    const handleAddCard = useCallback((result: CardDetailData) => {
        isDirtyRef.current = true;
        setEntries(es => {
            const existing = es.find(e => e.cardId === result.id);
            if (existing) return es.map(e => e.cardId === result.id ? { ...e, count: e.count + 1 } : e);
            return [...es, {
                cardId:   result.id,
                name:     result.name,
                count:    1,
                isCrypt:  result.crypt,
                types:    result.types,
                group:    result.group ?? undefined,
                banned:   result.banned,
                advanced: result.advanced,
            }];
        });
        if (!detailMapRef.current.has(result.id)) {
            setDetailMap(m => new Map([...m, [result.id, result]]));
        }
    }, []);

    const selectedDeck = decks.find(d => d.id === selectedId);

    return (
        <AppLayout background={"/Locations23.jpg"}>
            <div className="grid grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_240px] xl:grid-cols-[280px_1fr_280px] 2xl:grid-cols-[320px_1fr_300px] grid-rows-1 gap-6 h-[85dvh]">
                <DeckListPanel
                    decks={decks}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    onNew={handleNew}
                    onImport={() => setShowImport(true)}
                    loadError={loadError ?? undefined}
                />
                {selectedId != null ? (
                    <DeckEditorPanel
                        key={selectedId}
                        title={selectedDeck?.name ?? 'Editor'}
                        saveLabel={saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : undefined}
                        saveError={saveStatus === 'error'}
                        comments={selectedDeck?.comments}
                        entriesLoading={entriesLoading}
                        onRename={handleRename}
                        onCommentsChange={handleCommentsChange}
                        onRetrySave={handleRetrySave}
                        onDelete={handleDelete}
                        entries={entries}
                        detailMap={detailMap}
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
                <div className="hidden lg:contents">
                    <DeckAnalyticsPanel entries={entries} detailMap={detailMap} />
                </div>
            </div>

            {showImport && (
                <DeckImportModal
                    onImport={handleImport}
                    onClose={() => setShowImport(false)}
                />
            )}
        </AppLayout>
    );
}
