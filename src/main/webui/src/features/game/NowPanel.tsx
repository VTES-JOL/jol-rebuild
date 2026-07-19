import type {GameCommand} from './gameCommands.ts';
import {ActionDeclarationPanel} from './ActionDeclarationPanel.tsx';
import {ImpulsePanel} from './ImpulsePanel.tsx';
import type {GamePhase} from './nowStatus.ts';
import {nowStatus, PHASE_LABELS, PHASES} from './nowStatus.ts';
import {SequencingPanel} from './SequencingPanel.tsx';
import type {GameState} from './types.ts';

function PhaseTrack({gameState, gameId, currentUser, onCommand, isSpectator}: {
    gameState: GameState;
    gameId: string;
    currentUser: string;
    onCommand: (cmd: GameCommand) => void;
    isSpectator: boolean;
}) {
    const currentIdx = PHASES.indexOf(gameState.phase as GamePhase);
    const isMyTurn = gameState.currentPlayer === currentUser;
    const transfersRemaining = gameState.transfersRemaining ?? 0;

    return (
        <div className="flex items-center gap-0.5 min-w-0" role="group" aria-label={`Turn ${gameState.turn}, ${gameState.phase} phase`}>
            <span className="text-[11px] text-ink-muted font-mono shrink-0 mr-1">T{gameState.turn}</span>
            {PHASES.map((p, i) => {
                const isPast = i < currentIdx;
                const isCurrent = i === currentIdx;
                return (
                    <span
                        key={p}
                        aria-current={isCurrent ? 'step' : undefined}
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
            {gameState.phase === 'INFLUENCE' && isMyTurn && (
                <span
                    className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-blood/10 text-blood/80 font-mono leading-none"
                    title={`${transfersRemaining} influence transfer${transfersRemaining !== 1 ? 's' : ''} remaining`}
                >
                    {transfersRemaining}T
                </span>
            )}
            {/* Phase advancement is a player call in permissive mode only — enforced mode advances via protocol */}
            {!gameState.rulesEnforced && (
                <button
                    className={[
                        'ml-1 text-xs px-1.5 py-0.5 rounded border transition-colors leading-none',
                        isSpectator
                            ? 'border-line/20 text-ink-muted/20 cursor-not-allowed'
                            : isMyTurn
                                ? 'border-arcane/40 text-arcane hover:bg-arcane/10 cursor-pointer'
                                : 'border-line/30 text-ink-muted/40 cursor-pointer hover:text-ink-muted hover:border-line/50',
                    ].join(' ')}
                    onClick={() => !isSpectator && onCommand({type: 'ADVANCE_PHASE', gameId})}
                    disabled={isSpectator}
                    aria-label="Advance phase"
                    title={isMyTurn ? 'Advance phase' : 'Advance phase (not your turn)'}
                >
                    →
                </button>
            )}
        </div>
    );
}

/**
 * The active timing window's controls — the actionable block of the Now
 * panel. Rendered by NowPanel from sm up and repeated by the Dock below sm,
 * per the blueprint: "the Now panel's action buttons repeat in the Dock on
 * breakpoints where the Now panel collapses."
 *
 * Legal-command buttons for enforced mode arrive with the server-side
 * legal-command enumeration (blueprint Gaps table); until then the composed
 * window panels carry the available responses.
 */
export function NowActions({gameState, gameId, currentUser, onCommand}: {
    gameState: GameState;
    gameId: string;
    currentUser: string;
    onCommand: (cmd: GameCommand) => void;
}) {
    if (!gameState.rulesEnforced) return null;
    return (
        <>
            {gameState.impulseWindow?.active && (
                <ImpulsePanel
                    impulse={gameState.impulseWindow}
                    currentUser={currentUser}
                    gameId={gameId}
                    onCommand={onCommand}
                />
            )}
            {gameState.pendingAction && (
                <ActionDeclarationPanel
                    pending={gameState.pendingAction}
                    currentUser={currentUser}
                    gameId={gameId}
                    players={gameState.players}
                    onCommand={onCommand}
                />
            )}
            {gameState.sequencingWindow?.active && (
                <SequencingPanel
                    seq={gameState.sequencingWindow}
                    currentUser={currentUser}
                    gameId={gameId}
                    onCommand={onCommand}
                />
            )}
        </>
    );
}

/**
 * The persistent answer to "what is happening, and can I act?" — phase track,
 * a viewer-relative headline for the open situation, and the active timing
 * window's controls. See docs/implementation/board-design.md — Now panel.
 */
export function NowPanel({gameState, gameId, currentUser, onCommand, isSpectator}: {
    gameState: GameState;
    gameId: string;
    currentUser: string;
    onCommand: (cmd: GameCommand) => void;
    isSpectator: boolean;
}) {
    const status = nowStatus(gameState, currentUser);
    const attention = status.yourMove && !isSpectator;

    return (
        <div className="flex flex-col gap-1 pb-1.5 shrink-0 min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                <PhaseTrack
                    gameState={gameState}
                    gameId={gameId}
                    currentUser={currentUser}
                    onCommand={onCommand}
                    isSpectator={isSpectator}
                />
                <div
                    aria-live="polite"
                    className={[
                        'flex items-center gap-1.5 text-xs min-w-0 px-2 py-0.5 rounded border-l-2',
                        attention
                            ? 'border-blood bg-blood/5 text-ink font-medium'
                            : 'border-line/40 text-ink-muted',
                    ].join(' ')}
                >
                    {attention && (
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-blood shrink-0 animate-pulse motion-reduce:animate-none"
                            aria-hidden="true"
                        />
                    )}
                    <span className="truncate">{status.headline}</span>
                </div>
                {gameState.edgeHolder && (
                    <span className="text-xs text-ink-muted shrink-0" title={`${gameState.edgeHolder} holds the Edge`}>
                        Edge: <span className="text-gold/80 font-medium">{gameState.edgeHolder === currentUser ? 'you' : gameState.edgeHolder}</span>
                    </span>
                )}
            </div>

            {/* Below sm the Dock repeats these next to the thumbs — see Dock.tsx */}
            <div className="hidden sm:flex flex-col gap-1 empty:hidden">
                <NowActions gameState={gameState} gameId={gameId} currentUser={currentUser} onCommand={onCommand} />
            </div>
        </div>
    );
}
