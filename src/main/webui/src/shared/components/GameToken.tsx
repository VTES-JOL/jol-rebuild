import {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useNavigate} from 'react-router';
import {Check} from 'lucide-react';
import gameApi, {type GameDetail} from '@/features/game/api';
import DeckSelector from '@/features/lobby/DeckSelector';
import {useAuthContext} from "@/contexts/AuthContext.tsx";
import {useLobbySocket} from '@/contexts/LobbySocketContext';

type Phase = 'idle' | 'registering' | 'waiting';

export default function GameToken({ id, label }: { id: string; label: string }) {
    const {user} = useAuthContext();
    const currentUsername = user?.username ?? null;
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [game, setGame] = useState<GameDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const navigate = useNavigate();
    const {subscribeToGame} = useLobbySocket();

    const isVisible = isOpen || isHovered;

    const POPUP_W = 320; // w-80 = 20rem = 320px
    const MARGIN = 8;

    const gameLoadedRef = useRef(false);
    const loadDetailRef = useRef<() => void>(() => {});

    const loadDetail = useCallback(() => {
        setLoading(true);
        gameApi.getGameDetail(id)
            .then(data => { gameLoadedRef.current = true; setGame(data); })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => { loadDetailRef.current = loadDetail; }, [loadDetail]);

    // Refresh detail when this game's registration changes in the lobby —
    // only if the popup has already loaded data (i.e. it's been opened).
    useEffect(() => {
        gameLoadedRef.current = false;
        return subscribeToGame(id, () => {
            if (gameLoadedRef.current) loadDetailRef.current();
        });
    }, [id, subscribeToGame]);

    useEffect(() => {
        if (isVisible && !game && !loading) {
            loadDetail();
        }
    }, [isVisible, id, game, loading, loadDetail]);

    useEffect(() => {
        if (!isVisible || !buttonRef.current) return;

        const updatePosition = () => {
            if (!buttonRef.current) return;
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const centeredLeft = rect.left + rect.width / 2 - POPUP_W / 2;
            const left = Math.max(MARGIN, Math.min(centeredLeft, viewportWidth - POPUP_W - MARGIN));

            const spaceAbove = rect.top;
            if (spaceAbove > 150) {
                setPos({ bottom: viewportHeight - rect.top + MARGIN, left });
            } else {
                setPos({ top: rect.bottom + MARGIN, left });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isVisible]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Poll for ACTIVE status after registration
    useEffect(() => {
        if (phase !== 'waiting') {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            return;
        }
        pollRef.current = setInterval(async () => {
            try {
                const g = await gameApi.getGame(id);
                setGame(prev => prev ? {...prev, status: g.status, registrationCount: g.registrationCount} : null);
                if (g.status === 'ACTIVE') {
                    clearInterval(pollRef.current!);
                    pollRef.current = null;
                    navigate(`/game/${id}`);
                }
            } catch { /* ignore poll errors */ }
        }, 3000);
        return () => {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        };
    }, [phase, id, navigate]);

    const handleRegister = async () => {
        if (!selectedDeckId) return;
        setSubmitting(true);
        setActionError(null);
        try {
            await gameApi.registerForGame(id, selectedDeckId);
            loadDetail();
            setPhase('waiting');
        } catch (e: unknown) {
            setActionError(e instanceof Error ? e.message : 'Registration failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLeave = async () => {
        setSubmitting(true);
        setActionError(null);
        try {
            await gameApi.leaveGame(id);
            loadDetail();
            setPhase('idle');
        } catch (e: unknown) {
            setActionError(e instanceof Error ? e.message : 'Could not leave game.');
        } finally {
            setSubmitting(false);
        }
    };

    const isRegistered = !!game?.registrations.find(r => r.username === currentUsername);
    const isInvited = !!game?.invites.find(r => r.username === currentUsername);
    const isFull = game ? game.registrationCount >= game.maxPlayers : false;
    const canRegister = game?.status === 'OPEN' && game?.visibility === 'PUBLIC' && (isInvited || !isFull);

    const popup = isVisible && pos && createPortal(
        <div
            ref={popupRef}
            className={`fixed z-9999 w-80 bg-surface border border-gold/30 rounded-lg shadow-xl p-3 text-sm animate-in fade-in duration-200 ${!isOpen ? 'pointer-events-none' : ''}`}
            style={{
                top: pos.top,
                bottom: pos.bottom,
                left: pos.left,
            }}
        >
            <div className="flex flex-col gap-2">
                {loading && (
                    <div className="text-ink-muted text-xs animate-pulse">Loading...</div>
                )}
                {error && (
                    <div className="text-blood text-xs">{error}</div>
                )}
                {game && (
                    <>
                        <div className="flex flex-wrap items-center justify-between border-b border-gold/20 pb-1.5 mb-1.5 gap-y-1">
                            <span className="font-semibold text-gold mr-2">
                                {label ?? 'Game Details'}
                            </span>
                            <div className="flex gap-1 shrink-0 ml-auto">
                                <span className="px-1.5 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-[10px] font-bold text-gold uppercase tracking-tight">
                                    {game.status}
                                </span>
                                <span className="px-1.5 py-0.5 rounded-full bg-arcane/10 border border-arcane/20 text-[10px] font-bold text-arcane-soft uppercase tracking-tight">
                                    {game.format}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {/* Player roster */}
                            <div className="flex items-baseline justify-between mb-1">
                                <span className="text-xs text-ink-muted">Players</span>
                                <span className="text-xs text-ink font-medium tabular-nums">
                                    {game.registrationCount} / {game.maxPlayers}
                                </span>
                            </div>
                            <div className="border border-line/50 rounded overflow-hidden">
                                {game.registrations.map(r => (
                                    <div key={r.username} className="flex items-center gap-2 px-3 py-1.5 border-b border-line/30 last:border-b-0 text-xs">
                                        <Check className="w-3 h-3 text-online shrink-0" />
                                        <span className={`font-medium ${r.username === currentUsername ? 'text-accent-soft' : 'text-ink'}`}>
                                            {r.username}
                                        </span>
                                    </div>
                                ))}
                                {game.invites.map(r => (
                                    <div key={r.username} className="flex items-center gap-2 px-3 py-1.5 border-b border-line/30 last:border-b-0 text-xs opacity-60">
                                        <span className="w-3 h-3 shrink-0" />
                                        <span className={`font-medium ${r.username === currentUsername ? 'text-accent-soft' : 'text-ink'}`}>
                                            {r.username}
                                        </span>
                                        <span className="text-ink-muted italic ml-auto">invited</span>
                                    </div>
                                ))}
                                {game.registrations.length === 0 && game.invites.length === 0 && (
                                    <p className="px-3 py-2 text-xs text-ink-muted italic">No players yet.</p>
                                )}
                            </div>

                            {game.owner && (
                                <div className="flex items-center justify-between text-xs mt-0.5">
                                    <span className="text-ink-muted">Host</span>
                                    <span className="text-ink">{game.owner}</span>
                                </div>
                            )}

                            {actionError && <p className="text-xs text-blood">{actionError}</p>}

                            {/* Idle: offer registration or leave */}
                            {phase === 'idle' && (
                                <div className="flex gap-2 mt-1">
                                    {isRegistered && (
                                        <button
                                            className="flex-1 text-xs px-3 py-1.5 rounded border border-line/60 text-ink-muted hover:text-ink hover:bg-hover disabled:opacity-40 transition-colors cursor-pointer"
                                            disabled={submitting}
                                            onClick={handleLeave}
                                        >
                                            {submitting ? 'Leaving…' : 'Leave'}
                                        </button>
                                    )}
                                    {!isRegistered && canRegister && (
                                        <button
                                            className="flex-1 text-xs px-3 py-1.5 rounded bg-accent/80 text-white hover:bg-accent transition-colors cursor-pointer"
                                            onClick={() => { setIsOpen(true); setPhase('registering'); setActionError(null); }}
                                        >
                                            Register
                                        </button>
                                    )}
                                    {!isRegistered && isFull && game.status === 'OPEN' && (
                                        <span className="text-xs text-ink-muted italic">Game full</span>
                                    )}
                                </div>
                            )}

                            {/* Registering: deck selection */}
                            {phase === 'registering' && (
                                <div className="flex flex-col gap-2 mt-1">
                                    <p className="text-xs text-ink-muted">Select a deck to join:</p>
                                    <DeckSelector
                                        format={game.format}
                                        selectedId={selectedDeckId}
                                        onSelect={setSelectedDeckId}
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            className="text-xs px-3 py-1.5 rounded border border-line/60 text-ink-muted hover:text-ink hover:bg-hover transition-colors cursor-pointer"
                                            onClick={() => { setPhase('idle'); setSelectedDeckId(null); setActionError(null); }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="text-xs px-3 py-1.5 rounded bg-accent/80 text-white hover:bg-accent disabled:opacity-50 transition-colors cursor-pointer"
                                            disabled={!selectedDeckId || submitting}
                                            onClick={handleRegister}
                                        >
                                            {submitting ? 'Joining…' : 'Join Game'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Waiting: poll until ACTIVE */}
                            {phase === 'waiting' && (
                                <div className="mt-1 flex flex-col items-center gap-1.5 py-2">
                                    <span className="text-xs text-ink-muted animate-pulse">Waiting for game to start…</span>
                                    <span className="text-[10px] text-ink-muted/60">You'll be taken there automatically.</span>
                                    <button
                                        className="mt-1 text-xs px-3 py-1.5 rounded border border-line/60 text-ink-muted hover:text-ink hover:bg-hover disabled:opacity-40 transition-colors cursor-pointer"
                                        disabled={submitting}
                                        onClick={handleLeave}
                                    >
                                        {submitting ? 'Leaving…' : 'Leave'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            {pos.bottom !== undefined && (
                <>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-surface" />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[9px] border-transparent border-t-gold/30 -z-10" />
                </>
            )}
            {pos.top !== undefined && (
                <>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-surface" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[9px] border-transparent border-b-gold/30 -z-10" />
                </>
            )}
        </div>,
        document.body
    );

    return (
        <span className="relative inline-block mx-0.5">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="bg-gold/20 border border-gold/30 rounded-md px-1 text-xs text-gold cursor-pointer hover:bg-gold/30 transition-colors"
            >
                <span className={"inline-flex items-center gap-1 mx-0.5 rounded"}>{label}</span>
            </button>
            {popup}
        </span>
    );
}
