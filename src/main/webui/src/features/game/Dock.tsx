import type {CSSProperties} from 'react';
import {Hand, LayoutGrid, MessageSquare, X} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useMediaQuery} from '@/hooks/useMediaQuery.ts';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {HandStrip} from './HandStrip.tsx';
import {NowActions} from './NowPanel.tsx';
import type {CardData, GameState, RegionState} from './types.ts';

// At max width, cards are ~200% taller than a normal 72px-wide card (72 * 7/5 ≈ 100px → 200px → 143px wide).
const MAX_CARD_W = 143;
const MIN_CARD_W = 44;
/** Fanned cards overlap by 30%, so each card past the first occupies 70% of a width. */
const FAN_ADVANCE = 0.7;

export type DockProps = {
    playerName: string;
    /** Null for spectators — the Dock then only offers the mobile tab bar. */
    hand: RegionState | null;
    cards: Record<string, CardData>;
    gameState: GameState;
    gameId: string;
    currentUser: string;
    onCommand: (cmd: GameCommand) => void;
    onCardContextMenu?: (card: CardData, ref: CardRef, x: number, y: number) => void;
    /** Opens the chat slide-over (GameChatRail's controlled drawer). */
    onOpenChat: () => void;
    chatUnread: number;
};

/**
 * The agency layer of the board (docs/implementation/board-design.md — Dock):
 * the viewer's hand as a fanned row of full-fidelity cards, plus — below sm,
 * where the Now panel collapses — a table/hand/chat tab bar with the hand as
 * a bottom sheet and the Now panel's action buttons repeated above it.
 */
export function Dock({playerName, hand, cards, gameState, gameId, currentUser, onCommand, onCardContextMenu, onOpenChat, chatUnread}: DockProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [cardW, setCardW] = useState(MAX_CARD_W);
    const [sheetOpen, setSheetOpen] = useState(false);
    const count = hand?.cardIds.length ?? 0;
    // Mirrors NowPanel's `showActionsHere` query so exactly one copy of the
    // stateful response panels (Impulse/ActionDeclaration/Sequencing) mounts.
    const isPhone = !useMediaQuery('(min-width: 640px)');

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const recompute = () => {
            if (count === 0) { setCardW(MAX_CARD_W); return; }
            const available = el.clientWidth - 16; // fan container padding
            setCardW(Math.min(MAX_CARD_W, Math.max(MIN_CARD_W, available / (1 + (count - 1) * FAN_ADVANCE))));
        };
        recompute();
        const obs = new ResizeObserver(recompute);
        obs.observe(el);
        return () => obs.disconnect();
    }, [count]);

    const handStrip = hand && (
        <HandStrip
            playerName={playerName}
            hand={hand}
            cards={cards}
            gameId={gameId}
            onCommand={onCommand}
            onCardContextMenu={onCardContextMenu}
            variant="fanned"
        />
    );

    const tabClass = (active: boolean) => [
        'relative flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10px] leading-none transition-colors',
        active ? 'text-gold' : 'text-ink-muted hover:text-ink',
    ].join(' ');

    return (
        <>
            {/* Desktop / tablet: the fanned hand rides below the board */}
            {hand && (
                <div
                    ref={containerRef}
                    className="hidden sm:block w-full shrink-0 border-t border-line/30 pt-1"
                    style={{'--card-w': `${cardW}px`} as CSSProperties}
                >
                    {handStrip}
                </div>
            )}

            {/* Phone: action buttons + tab bar where thumbs are */}
            <div className="sm:hidden shrink-0 flex flex-col gap-1 border-t border-line/30 pt-1">
                {isPhone && (
                    <div className="flex flex-col gap-1 empty:hidden">
                        <NowActions gameState={gameState} gameId={gameId} currentUser={currentUser} onCommand={onCommand} />
                    </div>
                )}
                <nav className="flex items-stretch" aria-label="Board sections">
                    <button type="button" className={tabClass(!sheetOpen)} onClick={() => setSheetOpen(false)}>
                        <LayoutGrid size={16} aria-hidden="true" />
                        Table
                    </button>
                    {hand && (
                        <button type="button" className={tabClass(sheetOpen)} onClick={() => setSheetOpen(true)}>
                            <Hand size={16} aria-hidden="true" />
                            Hand{count > 0 ? ` (${count})` : ''}
                        </button>
                    )}
                    <button
                        type="button"
                        className={tabClass(false)}
                        onClick={onOpenChat}
                        aria-label={chatUnread > 0 ? `Open table talk, ${chatUnread} unread` : 'Open table talk'}
                    >
                        <span className="relative">
                            <MessageSquare size={16} aria-hidden="true" />
                            {chatUnread > 0 && (
                                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-0.5 rounded-full bg-blood text-white text-[9px] font-bold flex items-center justify-center">
                                    {chatUnread > 99 ? '99+' : chatUnread}
                                </span>
                            )}
                        </span>
                        Chat
                    </button>
                </nav>
            </div>

            {sheetOpen && hand && createPortal(
                <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-label="Your hand">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSheetOpen(false)} />
                    <div
                        className="relative max-h-[70vh] overflow-y-auto rounded-t-xl border-t border-line/60 bg-base shadow-2xl px-3 pt-3 pb-4"
                        style={{'--card-w': '96px'} as CSSProperties}
                    >
                        <button
                            type="button"
                            className="absolute top-2 right-2 z-10 text-ink-muted hover:text-ink transition-colors"
                            onClick={() => setSheetOpen(false)}
                            aria-label="Close hand"
                        >
                            <X size={16} />
                        </button>
                        {handStrip}
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
}
