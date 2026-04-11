import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Check, Lock, X} from 'lucide-react';
import gameApi, {type GameDetail} from '@/features/game/api';
import DeckSelector from './DeckSelector';

interface Props {
    gameId: number;
    currentUsername: string;
    onClose: () => void;
    onChanged: () => void;
}

const FORMAT_LABELS: Record<string, string> = {STANDARD: 'Standard', DUEL: 'Duel', V5: 'V5'};

export default function GameRegistrationModal({gameId, currentUsername, onClose, onChanged}: Props) {
    const [detail, setDetail] = useState<GameDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
    const [inviteQuery, setInviteQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggest, setShowSuggest] = useState(false);
    const [suggestPos, setSuggestPos] = useState<{top: number; left: number; width: number} | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const inviteInputRef = useRef<HTMLInputElement>(null);

    const load = () => {
        setLoading(true);
        setError(null);
        gameApi.getGameDetail(gameId)
            .then(setDetail)
            .catch(() => setError('Failed to load game details.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [gameId]);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (inviteQuery.trim().length < 2) {
            setSuggestions([]);
            setShowSuggest(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            const res = await fetch(`/user/search?q=${encodeURIComponent(inviteQuery)}`, {credentials: 'include'});
            if (res.ok) {
                const names: string[] = await res.json();
                setSuggestions(names);
                if (names.length > 0 && inviteInputRef.current) {
                    const rect = inviteInputRef.current.getBoundingClientRect();
                    setSuggestPos({top: rect.bottom + 4, left: rect.left, width: rect.width});
                    setShowSuggest(true);
                } else {
                    setShowSuggest(false);
                }
            }
        }, 250);
        return () => clearTimeout(debounceRef.current);
    }, [inviteQuery]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-surface border border-line/75 rounded-lg p-6 text-xs text-ink-muted animate-pulse">
                    Loading…
                </div>
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <div className="bg-surface border border-line/75 rounded-lg p-6 text-xs text-blood">{error ?? 'Not found'}</div>
            </div>
        );
    }

    const isOwner = detail.owner === currentUsername;
    const myRegistration = detail.registrations.find(r => r.username === currentUsername);
    const myInvite = detail.invites.find(r => r.username === currentUsername);
    const isRegistered = !!myRegistration;
    const isInvited = !!myInvite;
    const isFull = detail.registrationCount >= detail.maxPlayers;
    const canChangeFormat = isOwner && detail.registrations.length === 0;

    const doAction = async (action: () => Promise<void>) => {
        setSubmitting(true);
        setActionError(null);
        try {
            await action();
            onChanged();
            load();
        } catch (e: unknown) {
            setActionError(e instanceof Error ? e.message : 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegister = () => {
        if (!selectedDeckId) return;
        doAction(() => gameApi.registerForGame(gameId, selectedDeckId));
    };

    const handleLeave = () => {
        doAction(() => gameApi.leaveGame(gameId));
    };

    const handleDelete = () => {
        doAction(async () => {
            await gameApi.deleteGame(gameId);
            onClose();
        });
    };

    const handleInvite = (username: string) => {
        const name = username.trim();
        if (!name) return;
        setInviteQuery('');
        setSuggestions([]);
        setShowSuggest(false);
        doAction(() => gameApi.invitePlayer(gameId, name));
    };

    const handleFormatChange = (f: 'STANDARD' | 'DUEL' | 'V5') => {
        doAction(() => gameApi.updateGameFormat(gameId, f).then(() => {}));
    };

    const showJoinPanel = !isRegistered && (detail.visibility === 'PUBLIC' || isInvited);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative flex flex-col w-full max-w-md rounded-lg border border-line/75 bg-surface shadow-xl max-h-[85dvh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-line/75 bg-panel/45 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        {detail.visibility === 'PRIVATE' && (
                            <Lock className="w-3 h-3 text-ink-muted shrink-0" />
                        )}
                        <h2 className="text-sm font-medium text-ink truncate">{detail.name}</h2>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-arcane/10 border border-arcane/20 text-arcane-soft uppercase tracking-tight shrink-0">
                            {FORMAT_LABELS[detail.format]}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-hover transition-colors cursor-pointer shrink-0 ml-2">
                        <X className="w-4 h-4 text-ink-muted" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="flex flex-col gap-4 px-4 py-4">

                        {/* Player roster */}
                        <div>
                            <div className="flex items-baseline justify-between mb-2">
                                <span className="text-xs text-ink-muted">Players</span>
                                <span className="text-xs text-ink font-medium tabular-nums">
                                    {detail.registrationCount} / {detail.maxPlayers}
                                </span>
                            </div>
                            <div className="border border-line/50 rounded overflow-hidden">
                                {detail.registrations.map(r => (
                                    <div key={r.username} className="flex items-center gap-2 px-3 py-1.5 border-b border-line/30 last:border-b-0 text-xs">
                                        <Check className="w-3 h-3 text-online shrink-0" />
                                        <span className={`font-medium ${r.username === currentUsername ? 'text-accent-soft' : 'text-ink'}`}>
                                            {r.username}
                                        </span>
                                    </div>
                                ))}
                                {detail.invites.map(r => (
                                    <div key={r.username} className="flex items-center gap-2 px-3 py-1.5 border-b border-line/30 last:border-b-0 text-xs opacity-60">
                                        <span className="w-3 h-3 shrink-0" />
                                        <span className={`font-medium ${r.username === currentUsername ? 'text-accent-soft' : 'text-ink'}`}>
                                            {r.username}
                                        </span>
                                        <span className="text-ink-muted italic ml-auto">invited</span>
                                    </div>
                                ))}
                                {detail.registrations.length === 0 && detail.invites.length === 0 && (
                                    <p className="px-3 py-2 text-xs text-ink-muted italic">No players yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Join / Register panel */}
                        {showJoinPanel && !isFull && (
                            <div>
                                <p className="text-xs text-ink-muted mb-2">Select a deck to register:</p>
                                <DeckSelector
                                    format={detail.format}
                                    selectedId={selectedDeckId}
                                    onSelect={setSelectedDeckId}
                                />
                            </div>
                        )}

                        {showJoinPanel && isFull && (
                            <p className="text-xs text-ink-muted italic">This game is full.</p>
                        )}

                        {/* Already registered */}
                        {isRegistered && (
                            <p className="text-xs text-ink-muted">You are registered for this game.</p>
                        )}

                        {/* Owner: format change */}
                        {canChangeFormat && (
                            <fieldset>
                                <legend className="text-xs text-ink-muted mb-2">Format</legend>
                                <div className="flex gap-1.5">
                                    {(['STANDARD', 'DUEL', 'V5'] as const).map(f => (
                                        <button
                                            key={f}
                                            type="button"
                                            disabled={submitting}
                                            onClick={() => handleFormatChange(f)}
                                            className={[
                                                'flex-1 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer border',
                                                detail.format === f
                                                    ? 'bg-accent/20 text-accent-soft border-accent/40'
                                                    : 'bg-hover text-ink-muted border-line/40 hover:text-ink hover:border-line',
                                            ].join(' ')}
                                        >
                                            {FORMAT_LABELS[f]}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>
                        )}

                        {/* Owner: invite with autocomplete */}
                        {isOwner && (
                            <div>
                                <label className="block text-xs text-ink-muted mb-2">Invite player</label>
                                <div className="flex gap-2">
                                    <input
                                        ref={inviteInputRef}
                                        type="text"
                                        value={inviteQuery}
                                        onChange={e => setInviteQuery(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleInvite(inviteQuery); if (e.key === 'Escape') setShowSuggest(false); }}
                                        onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                                        placeholder="Username…"
                                        className="flex-1 rounded border border-line/60 bg-panel/30 px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted outline-none focus:border-accent/60"
                                    />
                                    <button
                                        onClick={() => handleInvite(inviteQuery)}
                                        disabled={submitting || !inviteQuery.trim()}
                                        className="text-xs px-3 py-1.5 rounded border border-line/60 text-ink-muted hover:text-ink hover:bg-hover disabled:opacity-40 transition-colors cursor-pointer"
                                    >
                                        Invite
                                    </button>
                                </div>
                                {showSuggest && suggestPos && suggestions.length > 0 && createPortal(
                                    <ul
                                        className="fixed z-[9999] rounded border border-line/60 bg-surface shadow-lg overflow-hidden"
                                        style={{top: suggestPos.top, left: suggestPos.left, width: suggestPos.width}}
                                    >
                                        {suggestions.map(name => (
                                            <li key={name}>
                                                <button
                                                    type="button"
                                                    onMouseDown={() => handleInvite(name)}
                                                    className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-hover transition-colors cursor-pointer"
                                                >
                                                    {name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>,
                                    document.body
                                )}
                            </div>
                        )}

                        {actionError && <p className="text-xs text-blood">{actionError}</p>}
                    </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-line/75 shrink-0">
                    <div className="flex gap-2">
                        {isOwner && detail.status === 'OPEN' && (
                            <button
                                onClick={handleDelete}
                                disabled={submitting}
                                className="text-xs px-3 py-1.5 rounded border border-blood/40 text-blood hover:bg-blood/10 disabled:opacity-40 transition-colors cursor-pointer"
                            >
                                Delete Game
                            </button>
                        )}
                        {(isRegistered || isInvited) && (
                            <button
                                onClick={handleLeave}
                                disabled={submitting}
                                className="text-xs px-3 py-1.5 rounded border border-line/60 text-ink-muted hover:text-ink hover:bg-hover disabled:opacity-40 transition-colors cursor-pointer"
                            >
                                Leave
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="text-xs px-3 py-1.5 rounded border border-line/60 text-ink-muted hover:text-ink hover:bg-hover transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                        {showJoinPanel && !isFull && (
                            <button
                                onClick={handleRegister}
                                disabled={submitting || !selectedDeckId}
                                className="text-xs px-3 py-1.5 rounded bg-accent/80 text-white hover:bg-accent disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                {submitting ? 'Joining…' : isInvited ? 'Register' : 'Join Game'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
