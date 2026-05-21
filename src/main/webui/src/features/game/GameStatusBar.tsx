import type {GameState} from './types.ts';

export type BoardLayout = 'linear' | 'circular' | 'text';

export const LAYOUT_LABELS: Record<BoardLayout, string> = {
    linear: 'Strip',
    circular: 'Table',
    text: 'Text',
};

type GameStatusBarProps = {
    gameState: GameState | null;
    boardLayout: BoardLayout;
    onLayoutChange: (layout: BoardLayout) => void;
};

export function GameStatusBar({gameState, boardLayout, onLayoutChange}: GameStatusBarProps) {
    return (
        <div className="flex items-center justify-between pb-2 shrink-0 gap-2 min-w-0">
            <div className="flex items-center gap-2 text-xs min-w-0 overflow-hidden">
                {gameState && (
                    <>
                        <span className="text-ink-muted">Turn {gameState.turn}</span>
                        <span className="text-ink-muted/40">·</span>
                        <span className="text-ink-muted">{gameState.phase}</span>
                        {gameState.currentPlayer && (
                            <>
                                <span className="text-ink-muted/40">·</span>
                                <span className="text-ink font-medium truncate">▶ {gameState.currentPlayer}</span>
                            </>
                        )}
                        {gameState.edgeHolder && (
                            <>
                                <span className="text-ink-muted/40">·</span>
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
