import type {SequencingWindowState} from './types.ts';
import {closeSequencingWindow, passSequencing} from './gameCommands.ts';
import type {GameCommand} from './gameCommands.ts';

const WINDOW_LABELS: Record<string, string> = {
    AS_ANNOUNCED:    'As Announced',
    AFTER_RESOLUTION: 'After Resolution',
};

export function SequencingPanel({seq, currentUser, gameId, onCommand}: {
    seq: SequencingWindowState;
    currentUser: string;
    gameId: string;
    onCommand: (cmd: GameCommand) => void;
}) {
    const isHolder = seq.currentHolder === currentUser;
    const holderIdx = seq.passOrder.indexOf(seq.currentHolder);
    const windowLabel = WINDOW_LABELS[seq.windowType] ?? seq.windowType;
    const passStart = holderIdx - seq.consecutivePasses;

    return (
        <div className="flex flex-wrap items-center gap-1.5 px-2 py-1 rounded border border-amber-500/30 bg-amber-500/5 text-xs">
            <span className="font-semibold text-amber-600/80 shrink-0">{windowLabel}</span>
            <span className="text-ink-muted/60 shrink-0">·</span>
            <span className="text-ink-muted shrink-0">Sequencing window</span>
            <span className="text-ink-muted/60 shrink-0">·</span>

            <div className="flex items-center gap-0.5 flex-wrap">
                {seq.passOrder.map((name, i) => {
                    const isCurrent = name === seq.currentHolder;
                    const hasPassed = seq.consecutivePasses > 0 && i >= passStart && i < holderIdx;
                    return (
                        <span
                            key={name}
                            title={isCurrent ? `${name} holds sequencing priority` : hasPassed ? `${name} passed` : name}
                            className={[
                                'px-1.5 py-0.5 rounded leading-none transition-colors',
                                isCurrent
                                    ? 'bg-amber-500/20 text-ink font-semibold ring-1 ring-amber-500/40'
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
                            ? 'border-line/50 text-ink-muted hover:text-ink hover:border-line/80 cursor-pointer'
                            : 'border-line/20 text-ink-muted/20 cursor-not-allowed',
                    ].join(' ')}
                    disabled={!isHolder}
                    onClick={() => onCommand(passSequencing(gameId, currentUser))}
                    title={isHolder ? 'Pass sequencing priority to next player' : 'Not your priority'}
                >
                    Pass
                </button>
                <button
                    className="px-1.5 py-0.5 rounded border border-line/30 text-ink-muted/50 hover:text-ink-muted hover:border-line/50 leading-none transition-colors cursor-pointer"
                    onClick={() => onCommand(closeSequencingWindow(gameId))}
                    title="Close sequencing window"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
