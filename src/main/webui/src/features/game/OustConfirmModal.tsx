import {createPortal} from 'react-dom';
import {useState} from 'react';
import type {GameState} from './types.ts';
import type {GameCommand} from './gameCommands.ts';
import {oustPlayer} from './gameCommands.ts';

type OustModalState = {step: 'select'} | {step: 'confirm'; playerName: string};

/**
 * The one oust confirmation surface, shared by both entry points — the manual
 * "Oust Player" action and the automatic prompt when a pool hits 0 — so the
 * irreversible +6 pool / +1 VP consequence is always confirmed the same way.
 * Pass `initialPlayerName` to skip straight to the confirm step (the zero-pool
 * flow already knows who); omit it to show the select-a-player list.
 */
export function OustConfirmModal({
    players,
    currentUser,
    initialPlayerName,
    gameId,
    onCommand,
    onClose,
}: {
    players: GameState['players'];
    /** Excluded from the selection list — this modal doesn't oust yourself. */
    currentUser: string;
    /** Skips the selection step and opens directly on this player's confirmation. */
    initialPlayerName?: string;
    gameId: string;
    onCommand: (cmd: GameCommand) => void;
    onClose: () => void;
}) {
    const [state, setState] = useState<OustModalState>(
        initialPlayerName ? {step: 'confirm', playerName: initialPlayerName} : {step: 'select'},
    );
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
                className="bg-surface border border-blood/40 rounded-xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-blood/20 bg-blood/5">
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
                            {initialPlayerName && (
                                <>
                                    <span className="font-semibold text-blood">{state.playerName}</span>'s pool has reached 0.{' '}
                                </>
                            )}
                            Their predator gains <span className="text-online font-semibold">+6 pool</span> and{' '}
                            <span className="text-gold font-semibold">+1 VP</span>. This can't be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                            {!initialPlayerName && (
                                <button
                                    className="text-xs px-3 py-1.5 rounded border border-line/40 text-ink-muted hover:text-ink transition-colors"
                                    onClick={() => setState({step: 'select'})}
                                >Back</button>
                            )}
                            <button
                                className="text-xs px-3 py-1.5 rounded border border-line/40 text-ink-muted hover:text-ink transition-colors"
                                onClick={onClose}
                            >Dismiss</button>
                            <button
                                className="text-xs px-3 py-1.5 rounded bg-blood text-white hover:bg-blood/90 transition-colors font-semibold shadow-sm"
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
