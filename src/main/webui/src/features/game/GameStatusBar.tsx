import {createPortal} from 'react-dom';
import {useState} from 'react';
import type {GameState} from './types.ts';
import {drawCard, drawCrypt, gainEdge, oustPlayer, shuffleCrypt, shuffleLibrary} from './gameCommands.ts';
import type {GameCommand} from './gameCommands.ts';
import {ImpulsePanel, OpenImpulseButton} from './ImpulsePanel.tsx';

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

function PhaseTracker({phase, isMyTurn, gameId, onCommand, disabled, transfersRemaining}: {
    phase: string;
    isMyTurn: boolean;
    gameId: string;
    onCommand: (cmd: GameCommand) => void;
    disabled: boolean;
    transfersRemaining: number;
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
            {phase === 'INFLUENCE' && isMyTurn && (
                <span
                    className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-blood/10 text-blood/80 font-mono leading-none"
                    title={`${transfersRemaining} influence transfer${transfersRemaining !== 1 ? 's' : ''} remaining`}
                >
                    {transfersRemaining}T
                </span>
            )}
            <button
                className={[
                    'ml-1 text-xs px-1.5 py-0.5 rounded border transition-colors leading-none',
                    disabled
                        ? 'border-line/20 text-ink-muted/20 cursor-not-allowed'
                        : isMyTurn
                            ? 'border-arcane/40 text-arcane hover:bg-arcane/10 cursor-pointer'
                            : 'border-line/30 text-ink-muted/40 cursor-pointer hover:text-ink-muted hover:border-line/50',
                ].join(' ')}
                onClick={() => !disabled && onCommand({type: 'ADVANCE_PHASE', gameId})}
                disabled={disabled}
                title={isMyTurn ? 'Advance phase' : 'Advance phase (not your turn)'}
            >
                →
            </button>
        </div>
    );
}

const ACTION_BTN = 'text-[11px] px-1.5 py-0.5 rounded border transition-colors leading-none border-line/40 text-ink-muted hover:text-ink hover:border-line/70 cursor-pointer';

type OustModalState = { step: 'select' } | { step: 'confirm'; playerName: string };

function OustPlayerModal({
    players,
    currentUser,
    gameId,
    onCommand,
    onClose,
}: {
    players: GameState['players'];
    currentUser: string;
    gameId: string;
    onCommand: (cmd: GameCommand) => void;
    onClose: () => void;
}) {
    const [state, setState] = useState<OustModalState>({step: 'select'});
    const eligible = players.filter(p => p.pool > 0 && p.name !== currentUser);

    const confirm = (name: string) => {
        onCommand(oustPlayer(gameId, name));
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-surface border border-line/60 rounded-xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-line/40">
                    <span className="text-sm font-semibold text-ink">
                        {state.step === 'confirm' ? `Oust ${state.playerName}?` : 'Oust Player'}
                    </span>
                    <button
                        className="text-ink-muted hover:text-ink transition-colors leading-none"
                        onClick={onClose}
                        aria-label="Close"
                    >✕</button>
                </div>

                {state.step === 'select' ? (
                    eligible.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-ink-muted text-center italic">No eligible players to oust.</p>
                    ) : (
                        <ul className="divide-y divide-line/20">
                            {eligible.map(p => (
                                <li key={p.name}>
                                    <button
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-ink hover:bg-hover transition-colors text-left"
                                        onClick={() => setState({step: 'confirm', playerName: p.name})}
                                    >
                                        <span className="font-medium">{p.name}</span>
                                        <span className="text-xs text-blood font-mono">{p.pool} pool</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )
                ) : (
                    <div className="px-4 py-4 space-y-4">
                        <p className="text-xs text-ink-muted">
                            Their predator gains <span className="text-online font-semibold">+6 pool</span> and <span className="text-gold font-semibold">+1 VP</span>.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                className="text-xs px-3 py-1.5 rounded border border-line/40 text-ink-muted hover:text-ink transition-colors"
                                onClick={() => setState({step: 'select'})}
                            >Back</button>
                            <button
                                className="text-xs px-3 py-1.5 rounded bg-blood/20 border border-blood/40 text-blood hover:bg-blood/30 transition-colors font-medium"
                                onClick={() => confirm((state as {step: 'confirm'; playerName: string}).playerName)}
                            >Confirm Oust</button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

type GameStatusBarProps = {
    gameState: GameState | null;
    gameId: string;
    currentUser: string;
    boardLayout: BoardLayout;
    onLayoutChange: (layout: BoardLayout) => void;
    onCommand: (cmd: GameCommand) => void;
    isSpectator: boolean;
};

export function GameStatusBar({gameState, gameId, currentUser, boardLayout, onLayoutChange, onCommand, isSpectator}: GameStatusBarProps) {
    const isMyTurn = gameState?.currentPlayer === currentUser;
    const hasEdge = gameState?.edgeHolder != null;
    const [oustOpen, setOustOpen] = useState(false);
    const eligibleToOust = gameState?.players.filter(p => p.pool > 0 && p.name !== currentUser) ?? [];
    const hasImpulse = !gameState?.impulseWindow?.active || gameState.impulseWindow.currentImpulseHolder === currentUser;

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
                                disabled={isSpectator}
                                transfersRemaining={gameState.transfersRemaining ?? 0}
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
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-0.5 rounded border border-line/50 p-0.5">
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
            </div>

            {gameState && (
                <div className="flex items-center gap-1">
                    <button className={ACTION_BTN} disabled={isSpectator || !hasImpulse} onClick={() => onCommand(drawCard(gameId))} title={hasImpulse ? 'Draw a card from your library' : 'Not your impulse'}>
                        Draw
                    </button>
                    <button className={ACTION_BTN} disabled={isSpectator || !hasImpulse} onClick={() => onCommand(drawCrypt(gameId))} title={hasImpulse ? 'Draw a card from your crypt to uncontrolled' : 'Not your impulse'}>
                        Draw Crypt
                    </button>
                    <button className={ACTION_BTN} disabled={isSpectator || !hasImpulse} onClick={() => onCommand(shuffleLibrary(gameId))} title={hasImpulse ? 'Shuffle your library' : 'Not your impulse'}>
                        ↺ Library
                    </button>
                    <button className={ACTION_BTN} disabled={isSpectator || !hasImpulse} onClick={() => onCommand(shuffleCrypt(gameId))} title={hasImpulse ? 'Shuffle your crypt' : 'Not your impulse'}>
                        ↺ Crypt
                    </button>
                    {!hasEdge && (
                        <button className={ACTION_BTN} disabled={isSpectator || !hasImpulse} onClick={() => onCommand(gainEdge(gameId))} title={hasImpulse ? 'Gain the Edge' : 'Not your impulse'}>
                            Gain Edge
                        </button>
                    )}
                    <button
                        className={[ACTION_BTN, 'border-blood/30 text-blood/60 hover:text-blood hover:border-blood/50', (isSpectator || !hasImpulse || eligibleToOust.length === 0) ? 'opacity-40 cursor-not-allowed' : ''].join(' ')}
                        disabled={isSpectator || !hasImpulse || eligibleToOust.length === 0}
                        onClick={() => setOustOpen(true)}
                        title={!hasImpulse ? 'Not your impulse' : 'Oust a player'}
                    >
                        Oust Player
                    </button>
                    {!isSpectator && !gameState.impulseWindow?.active && (
                        <OpenImpulseButton gameId={gameId} currentUser={currentUser} onCommand={onCommand} />
                    )}
                </div>
            )}
            {gameState?.impulseWindow?.active && (
                <ImpulsePanel
                    impulse={gameState.impulseWindow}
                    currentUser={currentUser}
                    gameId={gameId}
                    onCommand={onCommand}
                />
            )}
            {oustOpen && gameState && (
                <OustPlayerModal
                    players={gameState.players}
                    currentUser={currentUser}
                    gameId={gameId}
                    onCommand={onCommand}
                    onClose={() => setOustOpen(false)}
                />
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
