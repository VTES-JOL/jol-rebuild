import React, {useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import type {CardData, GameState, PlayerState} from './types.ts';
import {PlayerColumn} from './PlayerColumn.tsx';
import type {CardRef, GameCommand} from './gameCommands.ts';

export type CircularBoardProps = {
    orderedPlayers: PlayerState[];
    cards: Record<string, CardData>;
    currentUser: string;
    gameState: GameState;
    gameId?: string;
    onCommand?: (cmd: GameCommand) => void;
    onCardContextMenu?: (card: CardData, ref: CardRef, x: number, y: number) => void;
};

export function CircularBoard({orderedPlayers, cards, currentUser, gameState, gameId, onCommand, onCardContextMenu}: CircularBoardProps) {
    const initialFocus =
        orderedPlayers.find(p => p.name === currentUser)?.name ??
        gameState.currentPlayer ??
        orderedPlayers[0]?.name;

    const [focusedName, setFocusedName] = useState(initialFocus);
    const boardRef  = useRef<HTMLDivElement>(null);
    const dragStart = useRef<{x: number; y: number} | null>(null);

    const navigate = (name: string, dir: 'left' | 'right') => {
        setFocusedName(name);
        const el = boardRef.current;
        if (!el) return;
        el.classList.remove('board-slide-left', 'board-slide-right');
        void el.offsetWidth; // force reflow to restart animation
        el.classList.add(dir === 'right' ? 'board-slide-right' : 'board-slide-left');
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button,a,input,[role="button"]')) return;
        e.preventDefault();
        dragStart.current = {x: e.clientX, y: e.clientY};
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const start = dragStart.current;
        dragStart.current = null;
        if (!start) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0 && prey)     navigate(prey.name,     'right');
        if (dx > 0 && predator) navigate(predator.name, 'left');
    };

    const focused  = orderedPlayers.find(p => p.name === focusedName);
    const predator = focused?.predator ? orderedPlayers.find(p => p.name === focused.predator) : undefined;
    const prey     = focused?.prey     ? orderedPlayers.find(p => p.name === focused.prey)     : undefined;

    return (
        <div
            ref={boardRef}
            className="flex gap-3 h-full select-none"
            style={{'--card-w': 'clamp(66px, 5.25vw, 84px)'} as CSSProperties}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={() => { dragStart.current = null; }}
            onAnimationEnd={() => boardRef.current?.classList.remove('board-slide-left', 'board-slide-right')}
        >
            {/* Predator column — nav arrow on inner edge */}
            <div className="flex-1 min-w-0 relative">
                {predator ? (
                    <>
                        <PlayerColumn
                            player={predator}
                            cards={cards}
                            role="predator"
                            isCurrentUser={predator.name === currentUser}
                            gameId={gameId}
                            onCommand={onCommand}
                            onCardContextMenu={onCardContextMenu}
                        />
                        <button
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                                       flex items-center justify-center w-7 h-20
                                       bg-surface/90 border border-line/60 rounded-l-full
                                       text-ink-muted hover:text-ink hover:bg-surface-raised
                                       transition-colors shadow-md text-lg cursor-pointer"
                            onClick={() => navigate(predator.name, 'left')}
                            aria-label="Focus predator"
                        >
                            ◀
                        </button>
                    </>
                ) : (
                    <div className="h-full rounded-lg border border-dashed border-line/30 flex items-center justify-center text-xs text-ink-muted/40">
                        no predator
                    </div>
                )}
            </div>

            {/* Focused player column */}
            <div className="flex-1 min-w-0">
                {focused && (
                    <PlayerColumn
                        player={focused}
                        cards={cards}
                        role="focused"
                        isFocused
                        isCurrentUser={focused.name === currentUser}
                        gameId={gameId}
                        onCommand={onCommand}
                        onCardContextMenu={onCardContextMenu}
                    />
                )}
            </div>

            {/* Prey column — nav arrow on inner edge */}
            <div className="flex-1 min-w-0 relative">
                {prey ? (
                    <>
                        <button
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                                       flex items-center justify-center w-7 h-20
                                       bg-surface/90 border border-line/60 rounded-r-full
                                       text-ink-muted hover:text-ink hover:bg-surface-raised
                                       transition-colors shadow-md text-lg cursor-pointer"
                            onClick={() => navigate(prey.name, 'right')}
                            aria-label="Focus prey"
                        >
                            ▶
                        </button>
                        <PlayerColumn
                            player={prey}
                            cards={cards}
                            role="prey"
                            isCurrentUser={prey.name === currentUser}
                            gameId={gameId}
                            onCommand={onCommand}
                            onCardContextMenu={onCardContextMenu}
                        />
                    </>
                ) : (
                    <div className="h-full rounded-lg border border-dashed border-line/30 flex items-center justify-center text-xs text-ink-muted/40">
                        no prey
                    </div>
                )}
            </div>
        </div>
    );
}
