import {useMemo} from 'react';
import type {CardData, PlayerState, RegionState} from './types.ts';
import type {FieldRegionConfig} from './FieldRegion.tsx';
import {FieldRegionDndGroup} from './FieldRegion.tsx';
import {RegionBadge} from './gameUtils.tsx';
import type {GameCommand} from './gameCommands.ts';
import {attachCard, cardRef, moveCard} from './gameCommands.ts';
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
};

function fieldRegionCbs(
    player: PlayerState,
    region: RegionState,
    gameId: string | undefined,
    onCommand: ((cmd: GameCommand) => void) | undefined,
) {
    if (!gameId || !onCommand) return {};
    return {
        onReorder: (from: number, to: number) => {
            const ref = cardRef(player.name, region.type, from);
            onCommand(moveCard(gameId, ref, player.name, region.type, to));
        },
        onCardMove: (fromStack: number, fromCard: number, toStack: number) => {
            const ref = cardRef(player.name, region.type, fromStack, fromCard === 0 ? -1 : fromCard - 1);
            const targetRef = cardRef(player.name, region.type, toStack);
            onCommand(attachCard(gameId, ref, targetRef));
        },
        onCardToNewStack: (fromStack: number, fromCard: number) => {
            const ref = cardRef(player.name, region.type, fromStack, fromCard === 0 ? -1 : fromCard - 1);
            onCommand(moveCard(gameId, ref, player.name, region.type));
        },
    };
}

export function PlayerColumn({player, cards, role, isFocused, isCurrentUser, gameId, onCommand}: PlayerColumnProps) {
    const {
        ready, torpor, research, uncontrolled, hand, library, crypt, ashHeap, rfg,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        handleCrossRegionMove, handleCrossCardMove,
    } = usePlayerRegions(player, cards, gameId, onCommand);

    // All regions share ONE DndContext so compact→active cross-region drags work.
    const allRegions = useMemo<FieldRegionConfig[]>(() => {
        const regions: FieldRegionConfig[] = [];
        if (ready) regions.push({
            regionKey: 'READY', name: 'Ready', stacks: readyStacks, columns: 4, minRows: 2,
            ...fieldRegionCbs(player, ready, gameId, onCommand),
        });
        if (torpor && torpor.count > 0) regions.push({
            regionKey: 'TORPOR', name: 'Torpor', stacks: torporStacks, columns: 4,
            ...fieldRegionCbs(player, torpor, gameId, onCommand),
        });
        if (research && research.count > 0) regions.push({
            regionKey: 'RESEARCH', name: 'Research', stacks: researchStacks, columns: 4, narrowGap: true,
            ...fieldRegionCbs(player, research, gameId, onCommand),
        });
        if (uncontrolled && uncontrolled.count > 0) regions.push({
            regionKey: 'UNCONTROLLED', name: 'Uncontrolled', stacks: uncontrolledStacks, columns: 4, narrowGap: true,
            ...fieldRegionCbs(player, uncontrolled, gameId, onCommand),
        });
        if (hand) regions.push({
            regionKey: 'HAND', name: 'Hand', stacks: handStacks, columns: 1, compact: true,
        });
        if (library) regions.push({
            regionKey: 'LIBRARY', name: 'Library', stacks: libraryStacks, columns: 1, compact: true,
        });
        if (crypt) regions.push({
            regionKey: 'CRYPT', name: 'Crypt', stacks: cryptStacks, columns: 1, compact: true,
        });
        if (ashHeap?.visible) regions.push({
            regionKey: 'ASH_HEAP', name: 'Ash Heap', stacks: ashHeapStacks, columns: 1, compact: true,
        });
        return regions;
    }, [ready, torpor, research, uncontrolled, hand, library, crypt, ashHeap,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        gameId, onCommand]);

    const hasBottom =
        !!hand || !!library || !!crypt || !!ashHeap ||
        (rfg && rfg.count > 0);

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
                <span className="text-xs text-blood font-medium shrink-0">{player.pool} pool</span>
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
                                <div className="flex flex-row flex-wrap gap-1">
                                    {hand && renderRegion('HAND')}
                                    {library && renderRegion('LIBRARY')}
                                    {crypt && renderRegion('CRYPT')}
                                    {ashHeap?.visible && renderRegion('ASH_HEAP')}
                                    {ashHeap && !ashHeap.visible && (
                                        <RegionBadge label="Ash Heap" count={ashHeap.count} />
                                    )}
                                    {rfg && rfg.count > 0 && (
                                        <RegionBadge label="RFG" count={rfg.count} />
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </FieldRegionDndGroup>
        </div>
    );
}
