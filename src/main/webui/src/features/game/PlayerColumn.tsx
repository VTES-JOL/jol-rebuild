import {useMemo} from 'react';
import type {CardData, PlayerState} from './types.ts';
import type {FieldRegionConfig} from './FieldRegion.tsx';
import {FieldRegionDndGroup} from './FieldRegion.tsx';
import {buildActiveRegionConfigs, CompactRegionRow, createCompactRegionConfigs} from './gameUtils.tsx';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {setPool} from './gameCommands.ts';
import {usePlayerRegions} from './usePlayerRegions.ts';

export type PlayerColumnRole = 'predator' | 'focused' | 'prey';

type PlayerColumnProps = {
    player: PlayerState;
    cards: Record<string, CardData>;
    role: PlayerColumnRole;
    isFocused?: boolean;
    isCurrentUser?: boolean;
    gameId?: string;
    onCommand?: (cmd: GameCommand) => void;
    onCardContextMenu?: (card: CardData, ref: CardRef, x: number, y: number) => void;
};

export function PlayerColumn({player, cards, role, isFocused, isCurrentUser, gameId, onCommand, onCardContextMenu}: PlayerColumnProps) {
    const {
        ready, torpor, research, uncontrolled, hand, library, crypt, ashHeap, rfg,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        handleCrossRegionMove, handleCrossCardMove,
    } = usePlayerRegions(player, cards, gameId, onCommand);

    // All regions share ONE DndContext so compact→active cross-region drags work.
    const allRegions = useMemo<FieldRegionConfig[]>(() => buildActiveRegionConfigs({
        player, gameId, onCommand, onCardContextMenu,
        ready, torpor, research, uncontrolled,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        readyMinRows: 2,
        requireUncontrolledCount: true,
    }), [ready, torpor, research, uncontrolled,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        gameId, onCommand, onCardContextMenu, player]);

    const allCompactRegions = useMemo(() => createCompactRegionConfigs({
        playerName: player.name,
        hand: isCurrentUser ? undefined : hand,
        library, crypt, ashHeap,
        handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        onCardContextMenu,
    }), [hand, isCurrentUser, library, crypt, ashHeap, handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        onCardContextMenu, player.name]);

    const hasBottom =
        (!isCurrentUser && !!hand) || !!library || !!crypt || !!ashHeap ||
        !!(rfg && rfg.count > 0);

    return (
        <div
            className={[
                'flex flex-col gap-2 rounded-lg border px-3 py-2 h-full',
                isFocused
                    ? 'bg-arcane/5 border-arcane/40'
                    : 'bg-panel/50 border-line/75',
                player.ousted ? 'opacity-50' : '',
            ].filter(Boolean).join(' ')}
        >
            {/* Player info header */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
                <span className="text-[9px] text-ink-muted/50 uppercase tracking-wide shrink-0">
                    {role}
                </span>
                <span className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-ink' : 'text-ink-secondary'}`}>
                    {player.name}
                </span>
                {gameId && onCommand ? (
                    <div className="flex items-center gap-0.5 shrink-0">
                        <button
                            className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-blood/50 hover:text-blood rounded transition-colors leading-none"
                            onClick={() => onCommand(setPool(gameId, player.name, player.pool - 1))}
                            title="Remove 1 pool"
                        >−</button>
                        <span className="text-xs text-blood font-medium tabular-nums">{player.pool}</span>
                        <button
                            className="w-3.5 h-3.5 flex items-center justify-center text-[10px] text-blood/50 hover:text-blood rounded transition-colors leading-none"
                            onClick={() => onCommand(setPool(gameId, player.name, player.pool + 1))}
                            title="Add 1 pool"
                        >+</button>
                        <span className="text-[10px] text-blood/60">pool</span>
                    </div>
                ) : (
                    <span className="text-xs text-blood font-medium shrink-0">{player.pool} pool</span>
                )}
                {player.victoryPoints > 0 && (
                    <span className="text-xs text-gold font-medium shrink-0">{player.victoryPoints} VP</span>
                )}
                {player.ousted && (
                    <span className="text-xs text-ink-muted shrink-0">ousted</span>
                )}
            </div>

            {/* All regions share ONE DndContext so compact→active cross-region DnD works */}
            <FieldRegionDndGroup
                regions={allRegions}
                compactRegions={allCompactRegions}
                onCrossRegionMove={handleCrossRegionMove}
                onCrossCardMove={handleCrossCardMove}
            >
                {renderRegion => (
                    <>
                        {/* Active field regions */}
                        <div className="flex flex-col gap-2 flex-1">
                            {ready && renderRegion('READY')}
                            {torpor && torpor.count > 0 && renderRegion('TORPOR')}
                            {research && research.count > 0 && renderRegion('RESEARCH')}
                            {uncontrolled && uncontrolled.count > 0 && renderRegion('UNCONTROLLED')}
                        </div>

                        {/* Compact stacks pinned to the bottom */}
                        {hasBottom && (
                            <div className="mt-auto flex flex-col gap-1 pt-1 border-t border-line/20">
                                <CompactRegionRow
                                    hand={hand}
                                    isCurrentUser={!!isCurrentUser}
                                    library={library}
                                    crypt={crypt}
                                    ashHeap={ashHeap}
                                    rfg={rfg}
                                    renderRegion={renderRegion}
                                />
                            </div>
                        )}
                    </>
                )}
            </FieldRegionDndGroup>
        </div>
    );
}
