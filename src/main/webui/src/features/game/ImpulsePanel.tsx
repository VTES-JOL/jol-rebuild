import type {ImpulseState} from './types.ts';
import {claimImpulse, closeImpulseWindow, openImpulseWindow, passImpulse} from './gameCommands.ts';
import type {GameCommand, ImpulseContext} from './gameCommands.ts';

const CONTEXT_LABELS: Record<string, string> = {
    UNDIRECTED: 'Undirected Action',
    DIRECTED_SINGLE: 'Directed Action',
    DIRECTED_MULTI: 'Multi-Target Action',
    COMBAT: 'Combat',
};

export function ImpulsePanel({impulse, currentUser, gameId, onCommand}: {
    impulse: ImpulseState;
    currentUser: string;
    gameId: string;
    onCommand: (cmd: GameCommand) => void;
}) {
    const isHolder = impulse.currentImpulseHolder === currentUser;
    const holderIdx = impulse.passOrder.indexOf(impulse.currentImpulseHolder);
    const contextLabel = CONTEXT_LABELS[impulse.context] ?? impulse.context;

    return (
        <div className="flex flex-wrap items-center gap-1.5 px-2 py-1 rounded border border-arcane/30 bg-arcane/5 text-xs">
            <span className="font-semibold text-arcane/80 shrink-0">{contextLabel}</span>
            <span className="text-ink-muted/60 shrink-0">·</span>
            <span className="text-ink-muted shrink-0">
                Acting: <span className="text-ink font-medium">{impulse.actingPlayer}</span>
            </span>
            <span className="text-ink-muted/60 shrink-0">·</span>

            <div className="flex items-center gap-0.5 flex-wrap">
                {impulse.passOrder.map((name, i) => {
                    const isCurrent = name === impulse.currentImpulseHolder;
                    const hasPassed = i < holderIdx;
                    return (
                        <span
                            key={name}
                            title={isCurrent ? `${name} holds impulse` : hasPassed ? `${name} passed` : name}
                            className={[
                                'px-1.5 py-0.5 rounded leading-none transition-colors',
                                isCurrent
                                    ? 'bg-arcane/20 text-ink font-semibold ring-1 ring-arcane/40'
                                    : hasPassed
                                        ? 'text-ink-muted/30 line-through'
                                        : 'text-ink-muted/60',
                            ].join(' ')}
                        >
                            {name}
                        </span>
                    );
                })}
            </div>

            <div className="flex items-center gap-1 ml-auto shrink-0">
                <button
                    className={[
                        'px-1.5 py-0.5 rounded border leading-none transition-colors',
                        isHolder
                            ? 'border-arcane/40 text-arcane hover:bg-arcane/10 cursor-pointer'
                            : 'border-line/20 text-ink-muted/20 cursor-not-allowed',
                    ].join(' ')}
                    disabled={!isHolder}
                    onClick={() => onCommand(claimImpulse(gameId, currentUser))}
                    title={isHolder ? 'Use your impulse — impulse returns to acting player' : 'Not your impulse'}
                >
                    Claim
                </button>
                <button
                    className={[
                        'px-1.5 py-0.5 rounded border leading-none transition-colors',
                        isHolder
                            ? 'border-line/50 text-ink-muted hover:text-ink hover:border-line/80 cursor-pointer'
                            : 'border-line/20 text-ink-muted/20 cursor-not-allowed',
                    ].join(' ')}
                    disabled={!isHolder}
                    onClick={() => onCommand(passImpulse(gameId, currentUser))}
                    title={isHolder ? 'Pass your impulse to the next player' : 'Not your impulse'}
                >
                    Pass
                </button>
                <button
                    className="px-1.5 py-0.5 rounded border border-line/30 text-ink-muted/50 hover:text-ink-muted hover:border-line/50 leading-none transition-colors cursor-pointer"
                    onClick={() => onCommand(closeImpulseWindow(gameId))}
                    title="Close impulse window"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

export function OpenImpulseButton({gameId, currentUser, onCommand}: {
    gameId: string;
    currentUser: string;
    onCommand: (cmd: GameCommand) => void;
}) {
    return (
        <button
            className="text-[11px] px-1.5 py-0.5 rounded border border-arcane/30 text-arcane/60 hover:text-arcane hover:border-arcane/50 leading-none transition-colors cursor-pointer"
            onClick={() => onCommand(openImpulseWindow(gameId, 'UNDIRECTED' as ImpulseContext, currentUser, null))}
            title="Open an impulse window for sequencing"
        >
            Impulse
        </button>
    );
}
