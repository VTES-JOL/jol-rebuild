import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import gameApi, {type GameDto} from '@/features/game/api';

export default function GameToken({ id, label }: { id: number; label: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [game, setGame] = useState<GameDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const isVisible = isOpen || isHovered;

    const POPUP_W = 320; // w-80 = 20rem = 320px
    const MARGIN = 8;

    useEffect(() => {
        if (isVisible && !game && !loading) {
            setLoading(true);
            gameApi.getGame(id)
                .then(setGame)
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [isVisible, id, game, loading]);

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
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-ink-muted">Players</span>
                                <span className="text-ink font-medium tabular-nums">
                                    {game.registrationCount ?? '—'} / {game.maxPlayers ?? '—'}
                                </span>
                            </div>
                            {game.owner && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-ink-muted">Host</span>
                                    <span className="text-ink">{game.owner}</span>
                                </div>
                            )}
                            {game.status === 'OPEN' && (
                                <a
                                    href={`/game/${game.id}`}
                                    className="mt-1 block text-center text-xs px-3 py-1.5 rounded border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    View Game
                                </a>
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