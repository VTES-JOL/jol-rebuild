import {useState} from 'react';
import type {CardRef, PendingActionState, PlayerState} from './types.ts';
import type {GameCommand} from './gameCommands.ts';
import {abortAction, attemptBlock, resolveAction} from './gameCommands.ts';

const ACTION_LABELS: Record<string, string> = {
    BLEED: 'Bleed',
    HUNT: 'Hunt',
    EQUIP: 'Equip',
    EMPLOY_RETAINER: 'Employ Retainer',
    RECRUIT_ALLY: 'Recruit Ally',
    POLITICAL: 'Political Action',
    LEAVE_TORPOR: 'Leave Torpor',
    RESCUE: 'Rescue',
    DIABLERISE: 'Diablerise',
    CUSTOM: 'Custom Action',
};

const STATUS_LABELS: Record<string, string> = {
    DURING_ACTION: 'Waiting for block',
    BLOCKED: 'Blocked',
    AFTER_RESOLUTION: 'Resolving',
};

export function ActionDeclarationPanel({
    pending,
    currentUser,
    gameId,
    players,
    onCommand,
}: {
    pending: PendingActionState;
    currentUser: string;
    gameId: string;
    players: PlayerState[];
    onCommand: (cmd: GameCommand) => void;
}) {
    const [showBlockPicker, setShowBlockPicker] = useState(false);

    const actionLabel = ACTION_LABELS[pending.actionType] ?? pending.actionType;
    const statusLabel = STATUS_LABELS[pending.status] ?? pending.status;
    const isActingPlayer = pending.actorRef.playerName === currentUser;
    const isDuringAction = pending.status === 'DURING_ACTION';
    const isBlocked = pending.status === 'BLOCKED';

    const myReadyMinions: {name: string; ref: CardRef}[] = [];
    if (!isActingPlayer && isDuringAction) {
        const myPlayer = players.find(p => p.name === currentUser);
        if (myPlayer) {
            const readyIds = myPlayer.regions['READY']?.cardIds ?? [];
            readyIds.forEach((_, i) => {
                myReadyMinions.push({
                    name: `Minion ${i + 1}`,
                    ref: {playerName: currentUser, regionType: 'READY', position: i, childIndex: -1},
                });
            });
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-1.5 px-2 py-1 rounded border border-crimson/30 bg-crimson/5 text-xs">
            <span className="font-semibold text-crimson/80 shrink-0">{actionLabel}</span>
            <span className="text-ink-muted/60 shrink-0">·</span>
            <span className="text-ink-muted shrink-0">
                Actor: <span className="text-ink font-medium">{pending.actorRef.playerName}</span>
            </span>
            {pending.targetPlayerName && (
                <>
                    <span className="text-ink-muted/60 shrink-0">→</span>
                    <span className="text-ink-muted shrink-0">
                        Target: <span className="text-ink font-medium">{pending.targetPlayerName}</span>
                    </span>
                </>
            )}
            <span className="text-ink-muted/60 shrink-0">·</span>
            <span className={[
                'px-1.5 py-0.5 rounded font-medium',
                isBlocked ? 'bg-crimson/20 text-crimson' : 'text-ink-muted',
            ].join(' ')}>
                {statusLabel}
            </span>
            {isBlocked && pending.blockerRef && (
                <span className="text-ink-muted shrink-0">
                    Blocked by <span className="text-ink font-medium">{pending.blockerRef.playerName}</span>
                </span>
            )}

            <div className="flex items-center gap-1 ml-auto shrink-0">
                {isActingPlayer && isDuringAction && (
                    <button
                        className="px-1.5 py-0.5 rounded border border-line/50 text-ink-muted hover:text-ink hover:border-line/80 leading-none transition-colors cursor-pointer"
                        onClick={() => onCommand(resolveAction(gameId))}
                        title="Confirm action resolves unblocked"
                    >
                        Resolve
                    </button>
                )}
                {!isActingPlayer && isDuringAction && myReadyMinions.length > 0 && (
                    <>
                        <button
                            className="px-1.5 py-0.5 rounded border border-crimson/40 text-crimson/70 hover:text-crimson hover:border-crimson/60 leading-none transition-colors cursor-pointer"
                            onClick={() => setShowBlockPicker(v => !v)}
                            title="Attempt to block this action"
                        >
                            Block
                        </button>
                        {showBlockPicker && (
                            <div className="flex items-center gap-1">
                                {myReadyMinions.map(m => (
                                    <button
                                        key={m.ref.position}
                                        className="px-1.5 py-0.5 rounded border border-crimson/30 text-crimson/60 hover:text-crimson hover:border-crimson/50 leading-none transition-colors cursor-pointer"
                                        onClick={() => {
                                            onCommand(attemptBlock(gameId, m.ref));
                                            setShowBlockPicker(false);
                                        }}
                                    >
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
                <button
                    className="px-1.5 py-0.5 rounded border border-line/30 text-ink-muted/50 hover:text-ink-muted hover:border-line/50 leading-none transition-colors cursor-pointer"
                    onClick={() => onCommand(abortAction(gameId))}
                    title="Abort the current action"
                >
                    Abort
                </button>
            </div>
        </div>
    );
}
