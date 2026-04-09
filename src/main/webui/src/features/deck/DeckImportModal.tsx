import { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import deckApi from './api';
import type { ImportPreview } from './types';

interface Props {
    onImport: (name: string, entries: { cardId: string; count: number }[]) => Promise<void>;
    onClose: () => void;
}

export default function DeckImportModal({ onImport, onClose }: Props) {
    const [text,       setText]       = useState('');
    const [deckName,   setDeckName]   = useState('Imported Deck');
    const [preview,    setPreview]    = useState<ImportPreview | null>(null);
    const [loading,    setLoading]    = useState(false);
    const [creating,   setCreating]   = useState(false);
    const [error,      setError]      = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (!text.trim()) {
            setPreview(null);
            setError(null);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await deckApi.previewImport(text);
                setPreview(result);
                if (result.deckName) setDeckName(result.deckName);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Preview failed');
                setPreview(null);
            } finally {
                setLoading(false);
            }
        }, 500);
        return () => clearTimeout(debounceRef.current);
    }, [text]);

    async function handleCreate() {
        if (!preview || preview.resolved.length === 0 || creating) return;
        setCreating(true);
        setCreateError(null);
        try {
            const entries = preview.resolved.map(r => ({ cardId: r.card.id, count: r.count }));
            await onImport(deckName.trim() || 'Imported Deck', entries);
        } catch (e) {
            setCreateError(e instanceof Error ? e.message : 'Import failed');
            setCreating(false);
        }
    }

    const hasResolved = (preview?.resolved.length ?? 0) > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative flex flex-col w-full max-w-lg max-h-[85dvh] rounded-lg border border-line/75 bg-surface shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-line/75 bg-panel/45">
                    <h2 className="text-sm font-medium text-ink tracking-wide">Import Deck</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-hover transition-colors cursor-pointer">
                        <X className="w-4 h-4 text-ink-muted" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-3 p-4 min-h-0 overflow-y-auto flex-1">

                    {/* Paste area */}
                    <div>
                        <label className="block text-xs text-ink-muted mb-1">
                            Paste KRCG JSON or JOL deck list
                        </label>
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            rows={7}
                            spellCheck={false}
                            placeholder={"Paste deck list here…\n\nKRCG JSON: {\"crypt\": {…}, \"library\": {…}}\nJOL text:  2x Pentex Subversion\n           1x Govern the Unaligned"}
                            className="w-full rounded border border-line/60 bg-panel/30 px-3 py-2 text-xs text-ink placeholder:text-ink-muted outline-none focus:border-accent/60 resize-none font-mono"
                        />
                    </div>

                    {/* Format badge + loading */}
                    {(loading || preview) && (
                        <div className="flex items-center gap-2 text-xs text-ink-muted">
                            {loading ? (
                                <span className="animate-pulse">Parsing…</span>
                            ) : preview ? (
                                <>
                                    <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent-soft font-mono text-[10px] uppercase tracking-wider">
                                        {preview.format}
                                    </span>
                                    <span>
                                        {preview.resolved.length} card{preview.resolved.length !== 1 ? 's' : ''} resolved
                                        {preview.errors.length > 0 && `, ${preview.errors.length} error${preview.errors.length !== 1 ? 's' : ''}`}
                                    </span>
                                </>
                            ) : null}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-blood-soft flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {error}
                        </p>
                    )}

                    {/* Preview list */}
                    {preview && (preview.resolved.length > 0 || preview.errors.length > 0) && (
                        <div className="rounded border border-line/50 overflow-y-auto max-h-48 text-xs">
                            {preview.errors.map((e, i) => (
                                <div key={i} className="flex items-start gap-1.5 px-3 py-1.5 border-b border-line/30 text-blood-soft">
                                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                    <span className="font-mono">{e.line}</span>
                                    <span className="ml-auto shrink-0 text-ink-muted">{e.reason}</span>
                                </div>
                            ))}
                            {preview.resolved.map((r, i) => (
                                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 border-b border-line/30 last:border-b-0 text-ink-muted">
                                    <CheckCircle className="w-3 h-3 shrink-0 text-online/70" />
                                    <span className="tabular-nums w-5 text-right text-ink">{r.count}×</span>
                                    <span className="text-ink">{r.card.name}</span>
                                    <span className="ml-auto shrink-0 text-[10px]">
                                        {r.card.crypt ? 'crypt' : r.card.types.join(', ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Deck name */}
                    {hasResolved && (
                        <div>
                            <label className="block text-xs text-ink-muted mb-1">Deck name</label>
                            <input
                                type="text"
                                value={deckName}
                                onChange={e => setDeckName(e.target.value)}
                                className="w-full rounded border border-line/60 bg-panel/30 px-3 py-1.5 text-xs text-ink outline-none focus:border-accent/60"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-line/75">
                    {createError && (
                        <p className="mr-auto text-xs text-blood-soft flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {createError}
                        </p>
                    )}
                    <button
                        onClick={onClose}
                        disabled={creating}
                        className="text-xs px-3 py-1.5 rounded border border-line/60 text-ink-muted hover:text-ink hover:bg-hover disabled:opacity-40 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!hasResolved || creating}
                        className="text-xs px-3 py-1.5 rounded bg-accent/80 text-white hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        {creating ? 'Creating…' : 'Create Deck'}
                    </button>
                </div>
            </div>
        </div>
    );
}
