import type {CSSProperties} from 'react';
import {useLayoutEffect, useRef, useState} from 'react';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {nowStatus} from './nowStatus.ts';
import {PlayerColumn} from './PlayerColumn.tsx';
import {focusSuggestion, STAGE_CARD_WIDTH, stageSlotCount, stageSlots} from './stageSlots.ts';
import type {CardData, GameState, PlayerState} from './types.ts';

export type StageBoardProps = {
    orderedPlayers: PlayerState[];
    cards: Record<string, CardData>;
    currentUser: string;
    gameState: GameState;
    gameId?: string;
    onCommand?: (cmd: GameCommand) => void;
    onCardContextMenu?: (card: CardData, ref: CardRef, x: number, y: number) => void;
    /** External focus request (a Ring strip chip tap); `seq` distinguishes repeats. */
    focusRequest?: {name: string; seq: number} | null;
    /** User card-size multiplier from the status-bar slider (default 1). */
    cardScale?: number;
};

/**
 * The manipulation layer of the board: one to four full tableaus at tabletop
 * fidelity, predator | viewer | prey by default, densities from the breakpoint
 * map in docs/implementation/board-design.md. Slot count follows the measured
 * container width, so the same component serves phone through ultrawide.
 */
export function StageBoard({orderedPlayers, cards, currentUser, gameState, gameId, onCommand, onCardContextMenu, focusRequest, cardScale = 1}: StageBoardProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    // ResizeObserver fires once on observe, so it also provides the initial measure.
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Adopt a focus request during render (same seq pattern as CircularBoard).
    const [focused, setFocused] = useState<string | null>(null);
    const [handledFocusSeq, setHandledFocusSeq] = useState(0);
    if (focusRequest && focusRequest.seq !== handledFocusSeq) {
        setHandledFocusSeq(focusRequest.seq);
        setFocused(focusRequest.name);
    }

    const slotCount = stageSlotCount(width);
    const order = orderedPlayers.map(p => p.name);
    const slots = stageSlots(order, currentUser, focused, slotCount);
    const byName = new Map(orderedPlayers.map(p => [p.name, p]));

    // When a timing window opens on an off-stage player, suggest — never force —
    // swapping them in. Dismissal is keyed to the window, so the chip stays away
    // until a different window opens.
    const status = nowStatus(gameState, currentUser);
    const awaited = status.kind === 'phase' ? null : status.awaited;
    const suggested = focusSuggestion(awaited, slots.map(s => s.name), order);
    const windowKey = `${status.kind}:${awaited ?? ''}:${gameState.pendingAction?.actorRef.playerName ?? ''}`;
    const [dismissedKey, setDismissedKey] = useState<string | null>(null);
    const showSuggestion = suggested !== null && dismissedKey !== windowKey;

    const baseCardWidth = STAGE_CARD_WIDTH[slots.length] ?? STAGE_CARD_WIDTH[3];
    const cardWidth = cardScale === 1 ? baseCardWidth : `calc(${baseCardWidth} * ${cardScale})`;

    return (
        <div
            ref={containerRef}
            className="relative h-full flex gap-3 overflow-hidden"
            style={{'--card-w': cardWidth} as CSSProperties}
        >
            {showSuggestion && (
                <div
                    className="absolute top-1 left-1/2 -translate-x-1/2 z-20 flex items-center rounded-full border border-gold/50 bg-panel/90 shadow-md backdrop-blur-sm"
                    aria-live="polite"
                >
                    <button
                        type="button"
                        className="text-[11px] leading-none text-gold hover:text-gold/80 pl-2.5 pr-1 py-1.5 cursor-pointer"
                        onClick={() => {
                            setFocused(suggested);
                            setDismissedKey(windowKey);
                        }}
                    >
                        Focus {suggested} ▸
                    </button>
                    <button
                        type="button"
                        aria-label="Dismiss focus suggestion"
                        className="text-ink-muted hover:text-ink text-[10px] leading-none pl-1 pr-2 py-1.5 cursor-pointer"
                        onClick={() => setDismissedKey(windowKey)}
                    >
                        ✕
                    </button>
                </div>
            )}
            {width > 0 && slots.map(slot => {
                const player = byName.get(slot.name);
                if (!player) return null;
                return (
                    <div key={slot.name} className="flex-1 min-w-0 h-full" data-player-section={slot.name}>
                        <PlayerColumn
                            player={player}
                            cards={cards}
                            role={slot.role}
                            isFocused={player.name === focused}
                            isTurn={player.name === gameState.currentPlayer}
                            isCurrentUser={player.name === currentUser}
                            gameId={gameId}
                            onCommand={onCommand}
                            onCardContextMenu={onCardContextMenu}
                        />
                    </div>
                );
            })}
        </div>
    );
}
