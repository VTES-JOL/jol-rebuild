import {useMemo} from 'react';
import type {CardData, PlayerState, RegionState, RegionType} from './types.ts';
import {FieldRegionDndGroup} from './FieldRegion.tsx';
import type {FieldRegionConfig} from './FieldRegion.tsx';
import {regionToStacks, RegionBadge} from './gameUtils.tsx';
import type {GameCommand} from './gameCommands.ts';
import {attachCard, moveCard} from './gameCommands.ts';

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
    region: RegionState,
    stacks: CardData[][],
    gameId: string | undefined,
    onCommand: ((cmd: GameCommand) => void) | undefined,
) {
    if (!gameId || !onCommand) return {};
    return {
        onReorder: (from: number, to: number) => {
            const cardId = stacks[from]?.[0]?.id;
            if (cardId) onCommand(moveCard(gameId, cardId, region.id, to));
        },
        onCardMove: (fromStack: number, fromCard: number, toStack: number) => {
            const cardId = stacks[fromStack]?.[fromCard]?.id;
            const targetId = stacks[toStack]?.[0]?.id;
            if (cardId && targetId) onCommand(attachCard(gameId, cardId, targetId));
        },
        onCardToNewStack: (fromStack: number, fromCard: number) => {
            const cardId = stacks[fromStack]?.[fromCard]?.id;
            if (cardId) onCommand(moveCard(gameId, cardId, region.id));
        },
    };
}

export function PlayerColumn({player, cards, role, isFocused, isCurrentUser, gameId, onCommand}: PlayerColumnProps) {
    const r = player.regions;

    const ready        = r['READY'];
    const uncontrolled = r['UNCONTROLLED'];
    const torpor       = r['TORPOR'];
    const hand         = r['HAND'];
    const ashHeap      = r['ASH_HEAP'];
    const library      = r['LIBRARY'];
    const crypt        = r['CRYPT'];
    const research     = r['RESEARCH'];
    const rfg          = r['REMOVED_FROM_GAME'];

    const readyStacks        = useMemo(() => ready        ? regionToStacks(ready, cards)        : [], [ready, cards]);
    const torporStacks       = useMemo(() => torpor       ? regionToStacks(torpor, cards)       : [], [torpor, cards]);
    const researchStacks     = useMemo(() => research     ? regionToStacks(research, cards)     : [], [research, cards]);
    const uncontrolledStacks = useMemo(() => uncontrolled ? regionToStacks(uncontrolled, cards) : [], [uncontrolled, cards]);
    const handStacks         = useMemo(() => hand         ? regionToStacks(hand, cards, true)   : [], [hand, cards]);
    const libraryStacks      = useMemo(() => library      ? regionToStacks(library, cards)      : [], [library, cards]);
    const cryptStacks        = useMemo(() => crypt        ? regionToStacks(crypt, cards)        : [], [crypt, cards]);
    const ashHeapStacks      = useMemo(() => ashHeap      ? regionToStacks(ashHeap, cards)      : [], [ashHeap, cards]);

    // All regions share ONE DndContext so compact→active cross-region drags work.
    const allRegions = useMemo<FieldRegionConfig[]>(() => {
        const regions: FieldRegionConfig[] = [];
        if (ready) regions.push({
            regionKey: 'READY', name: 'Ready', stacks: readyStacks, columns: 4, minRows: 2,
            ...fieldRegionCbs(ready, readyStacks, gameId, onCommand),
        });
        if (torpor && torpor.count > 0) regions.push({
            regionKey: 'TORPOR', name: 'Torpor', stacks: torporStacks, columns: 4,
            ...fieldRegionCbs(torpor, torporStacks, gameId, onCommand),
        });
        if (research && research.count > 0) regions.push({
            regionKey: 'RESEARCH', name: 'Research', stacks: researchStacks, columns: 4, narrowGap: true,
            ...fieldRegionCbs(research, researchStacks, gameId, onCommand),
        });
        if (uncontrolled && uncontrolled.count > 0) regions.push({
            regionKey: 'UNCONTROLLED', name: 'Uncontrolled', stacks: uncontrolledStacks, columns: 4, narrowGap: true,
            ...fieldRegionCbs(uncontrolled, uncontrolledStacks, gameId, onCommand),
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
        if (ashHeap?.visible && ashHeap.count > 0) regions.push({
            regionKey: 'ASH_HEAP', name: 'Ash Heap', stacks: ashHeapStacks, columns: 1, compact: true,
        });
        return regions;
    }, [ready, torpor, research, uncontrolled, hand, library, crypt, ashHeap,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        gameId, onCommand]);

    const handleCrossRegionMove = (fromKey: string, fromStackIdx: number, toKey: string) => {
        if (!gameId || !onCommand) return;
        const toRegion = player.regions[toKey as RegionType];
        const allStacks = {READY: readyStacks, TORPOR: torporStacks, RESEARCH: researchStacks, UNCONTROLLED: uncontrolledStacks, HAND: handStacks, LIBRARY: libraryStacks, CRYPT: cryptStacks, ASH_HEAP: ashHeapStacks};
        const cardId = allStacks[fromKey as keyof typeof allStacks]?.[fromStackIdx]?.[0]?.id;
        if (cardId && toRegion) onCommand(moveCard(gameId, cardId, toRegion.id));
    };

    const handleCrossCardMove = (fromKey: string, fromStackIdx: number, fromCardIdx: number, toKey: string, toStackIdx: number | null | 'top') => {
        if (!gameId || !onCommand) return;
        const allStacks = {READY: readyStacks, TORPOR: torporStacks, RESEARCH: researchStacks, UNCONTROLLED: uncontrolledStacks, HAND: handStacks, LIBRARY: libraryStacks, CRYPT: cryptStacks, ASH_HEAP: ashHeapStacks};
        const cardId = allStacks[fromKey as keyof typeof allStacks]?.[fromStackIdx]?.[fromCardIdx]?.id;
        if (!cardId) return;

        if (typeof toStackIdx === 'number') {
            const targetCard = allStacks[toKey as keyof typeof allStacks]?.[toStackIdx]?.[0];
            if (targetCard) {
                const targetIsMinion = cards[targetCard.id]?.crypt || cards[targetCard.id]?.minion;
                const draggedIsLib = !cards[cardId]?.crypt && !cards[cardId]?.minion;
                if (draggedIsLib && targetIsMinion) {
                    onCommand(attachCard(gameId, cardId, targetCard.id));
                    return;
                }
            }
        }

        const toRegion = player.regions[toKey as RegionType];
        if (toRegion) onCommand(moveCard(gameId, cardId, toRegion.id, toStackIdx === 'top' ? 0 : -1));
    };

    const hasBottom =
        !!hand || !!library || !!crypt ||
        (ashHeap && ashHeap.count > 0) ||
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
                                    {ashHeap?.visible && ashHeap.count > 0 && renderRegion('ASH_HEAP')}
                                    {ashHeap && !ashHeap.visible && ashHeap.count > 0 && (
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
