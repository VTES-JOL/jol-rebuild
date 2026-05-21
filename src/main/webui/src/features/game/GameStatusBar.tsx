import type {GameState} from './types.ts';
import {drawCard, drawCrypt, gainEdge, shuffleCrypt, shuffleLibrary} from './gameCommands.ts';
import type {GameCommand} from './gameCommands.ts';

export type BoardLayout = 'linear' | 'circular' | 'text';

export const LAYOUT_LABELS: Record<BoardLayout, string> = {
    linear: 'Strip',
    circular: 'Table',
    text: 'Text',
};

const PHASES = ['UNLOCK', 'MASTER', 'MINION', 'INFLUENCE', 'DISCARD'] as const;
type GamePhase = typeof PHASES[number];

const PHASE_LABELS: Record<GamePhase, string> = {
    UNLOCK: 'Unlock',
    MASTER: 'Master',
    MINION: 'Minion',
    INFLUENCE: 'Influence',
    DISCARD: 'Discard',
};

function PhaseTracker({phase, isMyTurn, gameId, onCommand}: {
    phase: string;
    isMyTurn: boolean;
    gameId: string;
    onCommand: (cmd: GameCommand) => void;
}) {
    const currentIdx = PHASES.indexOf(phase as GamePhase);

    return (
        <div className="flex items-center gap-0.5">
            {PHASES.map((p, i) => {
                const isPast    = i < currentIdx;
                const isCurrent = i === currentIdx;
                return (
                    <span
                        key={p}
                        className={[
                            'text-[11px] px-1.5 py-0.5 rounded leading-none',
                            isCurrent ? 'bg-arcane/20 text-ink font-semibold' :
                            isPast    ? 'text-ink-muted/30' :
                                        'text-ink-muted/50',
                        ].join(' ')}
                    >
                        {PHASE_LABELS[p]}
                    </span>
                );
            })}
            <button
                className={[
                    'ml-1 text-xs px-1.5 py-0.5 rounded border transition-colors leading-none',
                    isMyTurn
                        ? 'border-arcane/40 text-arcane hover:bg-arcane/10 cursor-pointer'
                        : 'border-line/30 text-ink-muted/40 cursor-pointer hover:text-ink-muted hover:border-line/50',
                ].join(' ')}
                onClick={() => onCommand({type: 'ADVANCE_PHASE', gameId})}
                title={isMyTurn ? 'Advance phase' : 'Advance phase (not your turn)'}
            >
                →
            </button>
        </div>
    );
}

const ACTION_BTN = 'text-[11px] px-1.5 py-0.5 rounded border transition-colors leading-none border-line/40 text-ink-muted hover:text-ink hover:border-line/70 cursor-pointer';

type GameStatusBarProps = {
    gameState: GameState | null;
    gameId: string;
    currentUser: string;
    boardLayout: BoardLayout;
    onLayoutChange: (layout: BoardLayout) => void;
    onCommand: (cmd: GameCommand) => void;
};

export function GameStatusBar({gameState, gameId, currentUser, boardLayout, onLayoutChange, onCommand}: GameStatusBarProps) {
    const isMyTurn = gameState?.currentPlayer === currentUser;
    const hasEdge = gameState?.edgeHolder != null;

    return (
        <div className="flex flex-col pb-2 shrink-0 gap-1 min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 text-xs min-w-0 overflow-hidden">
                    {gameState && (
                        <>
                            <span className="text-ink-muted shrink-0">Turn {gameState.turn}</span>
                            <PhaseTracker
                                phase={gameState.phase}
                                isMyTurn={isMyTurn}
                                gameId={gameId}
                                onCommand={onCommand}
                            />
                            {gameState.currentPlayer && (
                                <>
                                    <span className="text-ink-muted/40 shrink-0">·</span>
                                    <span className="text-ink font-medium truncate">▶ {gameState.currentPlayer}</span>
                                </>
                            )}
                            {gameState.edgeHolder && (
                                <>
                                    <span className="text-ink-muted/40 shrink-0">·</span>
                                    <span className="text-ink-muted truncate">Edge: {gameState.edgeHolder}</span>
                                </>
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-0.5 rounded border border-line/50 p-0.5 shrink-0">
                    {(['linear', 'circular', 'text'] as const).map(l => (
                        <button
                            key={l}
                            className={[
                                'text-xs px-2 py-0.5 rounded transition-colors',
                                boardLayout === l
                                    ? 'bg-arcane/20 text-ink'
                                    : 'text-ink-muted hover:text-ink',
                            ].join(' ')}
                            onClick={() => onLayoutChange(l)}
                        >
                            {LAYOUT_LABELS[l]}
                        </button>
                    ))}
                </div>
            </div>

            {gameState && (
                <div className="flex items-center gap-1">
                    <button className={ACTION_BTN} onClick={() => onCommand(drawCard(gameId))} title="Draw a card from your library">
                        Draw
                    </button>
                    <button className={ACTION_BTN} onClick={() => onCommand(drawCrypt(gameId))} title="Draw a card from your crypt to uncontrolled">
                        Draw Crypt
                    </button>
                    <button className={ACTION_BTN} onClick={() => onCommand(shuffleLibrary(gameId))} title="Shuffle your library">
                        ↺ Library
                    </button>
                    <button className={ACTION_BTN} onClick={() => onCommand(shuffleCrypt(gameId))} title="Shuffle your crypt">
                        ↺ Crypt
                    </button>
                    {!hasEdge && (
                        <button className={ACTION_BTN} onClick={() => onCommand(gainEdge(gameId))} title="Gain the Edge">
                            Gain Edge
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export function ConnectionBanner({status}: {status: string}) {
    return (
        <div className="shrink-0 mb-1.5 flex items-center gap-2 rounded border border-gold/30 bg-gold/5 px-3 py-1.5 text-xs text-gold">
            <span className="animate-pulse">●</span>
            <span>{status === 'connecting' ? 'Connecting…' : 'Connection lost — reconnecting…'}</span>
        </div>
    );
}

export function CommandErrorBanner({error, onDismiss}: {error: string; onDismiss: () => void}) {
    return (
        <div className="shrink-0 mb-1.5 flex items-center gap-2 rounded border border-blood/30 bg-blood/5 px-3 py-1.5 text-xs text-blood">
            <span className="flex-1">{error}</span>
            <button
                className="text-blood/60 hover:text-blood transition-colors leading-none"
                onClick={onDismiss}
                aria-label="Dismiss"
            >
                ✕
            </button>
        </div>
    );
}
