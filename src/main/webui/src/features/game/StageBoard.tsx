import type {CSSProperties} from 'react';
import {useLayoutEffect, useRef, useState} from 'react';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {PlayerColumn} from './PlayerColumn.tsx';
import {STAGE_CARD_WIDTH, stageSlotCount, stageSlots} from './stageSlots.ts';
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
};

/**
 * The manipulation layer of the board: one to four full tableaus at tabletop
 * fidelity, predator | viewer | prey by default, densities from the breakpoint
 * map in docs/implementation/board-design.md. Slot count follows the measured
 * container width, so the same component serves phone through ultrawide.
 */
export function StageBoard({orderedPlayers, cards, currentUser, gameState, gameId, onCommand, onCardContextMenu, focusRequest}: StageBoardProps) {
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
    const slots = stageSlots(orderedPlayers.map(p => p.name), currentUser, focused, slotCount);
    const byName = new Map(orderedPlayers.map(p => [p.name, p]));

    return (
        <div
            ref={containerRef}
            className="h-full flex gap-3 overflow-hidden"
            style={{'--card-w': STAGE_CARD_WIDTH[slots.length] ?? STAGE_CARD_WIDTH[3]} as CSSProperties}
        >
            {width > 0 && slots.map(slot => {
                const player = byName.get(slot.name);
                if (!player) return null;
                return (
                    <div key={slot.name} className="flex-1 min-w-0 h-full" data-player-section={slot.name}>
                        <PlayerColumn
                            player={player}
                            cards={cards}
                            role={slot.role}
                            isFocused={player.name === gameState.currentPlayer}
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
