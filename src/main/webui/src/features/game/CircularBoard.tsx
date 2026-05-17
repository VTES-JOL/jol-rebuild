import type {CSSProperties} from 'react';
import {useState} from 'react';
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

    const focused  = orderedPlayers.find(p => p.name === focusedName);
    const predator = focused?.predator ? orderedPlayers.find(p => p.name === focused.predator) : undefined;
    const prey     = focused?.prey     ? orderedPlayers.find(p => p.name === focused.prey)     : undefined;

    return (
        <div
            className="flex flex-col gap-3 h-full"
            style={{'--card-w': 'clamp(44px, 3.5vw, 56px)'} as CSSProperties}
        >
            {/* Top bar: game info left, navigation right */}
            <div className="flex items-center justify-between shrink-0 px-1">
                <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-ink">Turn {gameState.turn}</span>
                    <span className="text-ink-muted">{gameState.phase}</span>
                    {gameState.edgeHolder !== 'no one' && (
                        <span className="text-ink-muted">
                            Edge: <span className="text-gold">{gameState.edgeHolder}</span>
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink border border-line/50 rounded px-2 py-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => predator && setFocusedName(predator.name)}
                        disabled={!predator}
                        aria-label="Focus predator"
                    >
                        ◀ {focused?.predator ?? '—'}
                    </button>
                    <button
                        className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink border border-line/50 rounded px-2 py-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => prey && setFocusedName(prey.name)}
                        disabled={!prey}
                        aria-label="Focus prey"
                    >
                        {focused?.prey ?? '—'} ▶
                    </button>
                </div>
            </div>

            {/* Three equal columns: predator | focused player | prey */}
            <div className="flex gap-3 min-h-0 flex-1">
                <div className="flex-1 min-w-0">
                    {predator ? (
                        <PlayerColumn
                            player={predator}
                            cards={cards}
                            role="predator"
                            isCurrentUser={predator.name === currentUser}
                            gameId={gameId}
                            onCommand={onCommand}
                            onCardContextMenu={onCardContextMenu}
                        />
                    ) : (
                        <div className="h-full rounded-lg border border-dashed border-line/30 flex items-center justify-center text-xs text-ink-muted/40">
                            no predator
                        </div>
                    )}
                </div>

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

                <div className="flex-1 min-w-0">
                    {prey ? (
                        <PlayerColumn
                            player={prey}
                            cards={cards}
                            role="prey"
                            isCurrentUser={prey.name === currentUser}
                            gameId={gameId}
                            onCommand={onCommand}
                            onCardContextMenu={onCardContextMenu}
                        />
                    ) : (
                        <div className="h-full rounded-lg border border-dashed border-line/30 flex items-center justify-center text-xs text-ink-muted/40">
                            no prey
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
