import {useState} from 'react';
import type {GameState} from './types.ts';
import type {GameCommand} from './gameCommands.ts';
import {
    drawCard,
    drawCrypt,
    gainEdge,
    reverseOrder,
    setRulesMode,
    shuffleCrypt,
    shuffleLibrary,
    unlockAll
} from './gameCommands.ts';
import {OpenImpulseButton} from './ImpulsePanel.tsx';
import {OustConfirmModal} from './OustConfirmModal.tsx';
import type {BoardLayout} from './boardLayout.ts';
import {LAYOUT_LABELS} from './boardLayout.ts';
import {CARD_SCALE_MAX, CARD_SCALE_MIN, CARD_SCALE_STEP} from './useCardScale.ts';

const ACTION_BTN = 'text-[11px] px-1.5 py-0.5 rounded border transition-colors leading-none border-line/40 text-ink-muted hover:text-ink hover:border-line/70 cursor-pointer';

type GameStatusBarProps = {
    gameState: GameState | null;
    gameId: string;
    currentUser: string;
    boardLayout: BoardLayout;
    onLayoutChange: (layout: BoardLayout) => void;
    onCommand: (cmd: GameCommand) => void;
    isSpectator: boolean;
    /** Stage card-size slider value; the slider renders only when both props are set and the Stage is active. */
    cardScale?: number;
    onCardScaleChange?: (value: number) => void;
};

export function GameStatusBar({gameState, gameId, currentUser, boardLayout, onLayoutChange, onCommand, isSpectator, cardScale, onCardScaleChange}: GameStatusBarProps) {
    const hasEdge = gameState?.edgeHolder != null;
    const [oustOpen, setOustOpen] = useState(false);
    const eligibleToOust = gameState?.players.filter(p => p.pool > 0 && p.name !== currentUser) ?? [];
    const hasImpulse = !gameState?.impulseWindow?.active || gameState.impulseWindow.currentImpulseHolder === currentUser;
    const canAct = !isSpectator && hasImpulse;
    const rulesEnforced = gameState?.rulesEnforced ?? false;

    return (
        <div className="flex flex-col pb-1.5 shrink-0 gap-1 min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
                {/* Quick actions — turn/phase state and timing windows live in NowPanel */}
                <div className="flex items-center gap-1 min-w-0">
                    {gameState && (
                        <>
                            {!rulesEnforced && (
                                <>
                                    <button className={ACTION_BTN} disabled={!canAct} onClick={() => onCommand(drawCard(gameId))} title={hasImpulse ? 'Draw a card from your library' : 'Not your impulse'}>
                                        Draw
                                    </button>
                                    <button className={ACTION_BTN} disabled={!canAct} onClick={() => onCommand(drawCrypt(gameId))} title={hasImpulse ? 'Draw a card from your crypt to uncontrolled' : 'Not your impulse'}>
                                        Draw Crypt
                                    </button>
                                    <button className={ACTION_BTN} disabled={!canAct} onClick={() => onCommand(shuffleLibrary(gameId))} title={hasImpulse ? 'Shuffle your library' : 'Not your impulse'}>
                                        ↺ Library
                                    </button>
                                    <button className={ACTION_BTN} disabled={!canAct} onClick={() => onCommand(shuffleCrypt(gameId))} title={hasImpulse ? 'Shuffle your crypt' : 'Not your impulse'}>
                                        ↺ Crypt
                                    </button>
                                    <button className={ACTION_BTN} disabled={!canAct} onClick={() => onCommand(unlockAll(gameId))} title={hasImpulse ? 'Unlock all your cards' : 'Not your impulse'}>
                                        ↺ Unlock All
                                    </button>
                                    {!hasEdge && (
                                        <button className={ACTION_BTN} disabled={!canAct} onClick={() => onCommand(gainEdge(gameId))} title={hasImpulse ? 'Gain the Edge' : 'Not your impulse'}>
                                            Gain Edge
                                        </button>
                                    )}
                                    {/* Filled and set apart from the utility buttons — irreversible,
                                        affects every player's pool/VP, so it shouldn't read as a peer of "Draw". */}
                                    <button
                                        className={[
                                            'text-[11px] px-2 py-0.5 rounded transition-colors leading-none font-medium cursor-pointer ml-1',
                                            (!canAct || eligibleToOust.length === 0)
                                                ? 'bg-blood/20 text-blood/40 opacity-60 cursor-not-allowed'
                                                : 'bg-blood text-white hover:bg-blood/90 shadow-sm',
                                        ].join(' ')}
                                        disabled={!canAct || eligibleToOust.length === 0}
                                        onClick={() => setOustOpen(true)}
                                        title={!canAct ? 'Not your impulse' : 'Oust a player'}
                                    >
                                        Oust Player
                                    </button>
                                </>
                            )}
                            {rulesEnforced && (
                                <>
                                    <button className={ACTION_BTN} disabled={!canAct} onClick={() => onCommand(shuffleLibrary(gameId))} title={hasImpulse ? 'Shuffle your library' : 'Not your impulse'}>
                                        ↺ Library
                                    </button>
                                    <button className={ACTION_BTN} disabled={!canAct} onClick={() => onCommand(shuffleCrypt(gameId))} title={hasImpulse ? 'Shuffle your crypt' : 'Not your impulse'}>
                                        ↺ Crypt
                                    </button>
                                </>
                            )}
                            {!isSpectator && !gameState.impulseWindow?.active && rulesEnforced && (
                                <OpenImpulseButton gameId={gameId} currentUser={currentUser} onCommand={onCommand} />
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Mode toggle — TODO: restrict to judge/admin role when role system is implemented */}
                    {gameState && !isSpectator && (
                        <button
                            className={[
                                'text-[11px] px-2 py-0.5 rounded border transition-colors leading-none',
                                rulesEnforced
                                    ? 'border-gold/50 text-gold/80 bg-gold/10 hover:bg-gold/15'
                                    : 'border-line/40 text-ink-muted hover:text-ink hover:border-line/70',
                            ].join(' ')}
                            onClick={() => onCommand(setRulesMode(gameId, !rulesEnforced))}
                            title={rulesEnforced ? 'Rules enforced — click to switch to permissive mode' : 'Permissive mode — click to switch to rules-enforced mode'}
                        >
                            {rulesEnforced ? 'Enforced' : 'Permissive'}
                        </button>
                    )}
                    {gameState && !isSpectator && (
                        <button
                            className={[
                                ACTION_BTN,
                                gameState.orderReversed ? 'border-arcane/40 text-arcane/80' : '',
                            ].join(' ')}
                            onClick={() => onCommand(reverseOrder(gameId))}
                            title={gameState.orderReversed ? 'Turn order reversed — click to restore' : 'Reverse turn order'}
                        >
                            {gameState.orderReversed ? '←' : '→'}
                        </button>
                    )}
                    {boardLayout === 'stage' && cardScale != null && onCardScaleChange && (
                        <label className="flex items-center gap-1 shrink-0" title="Card size">
                            <span className="text-[10px] text-ink-muted" aria-hidden="true">🂠</span>
                            <input
                                type="range"
                                min={CARD_SCALE_MIN}
                                max={CARD_SCALE_MAX}
                                step={CARD_SCALE_STEP}
                                value={cardScale}
                                onChange={e => onCardScaleChange(parseFloat(e.target.value))}
                                aria-label="Card size"
                                className="w-16 accent-gold cursor-pointer"
                            />
                            <span className="text-[10px] text-ink-muted font-mono tabular-nums w-8 shrink-0" aria-hidden="true">
                                ×{cardScale.toFixed(2)}
                            </span>
                        </label>
                    )}
                    <div className="flex items-center gap-0.5 rounded border border-line/50 p-0.5">
                    {(['stage', 'text'] as const).map(l => (
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

            {oustOpen && gameState && !rulesEnforced && (
                <OustConfirmModal
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
