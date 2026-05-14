import {useMemo} from 'react';
import type {CardData, PlayerState, RegionState, RegionType} from './types.ts';
import {FieldRegionDndGroup} from './FieldRegion.tsx';
import type {FieldRegionConfig} from './FieldRegion.tsx';
import {regionToStacks, RegionBadge} from './gameUtils.tsx';
import type {GameCommand} from './gameCommands.ts';
import {attachCard, moveCard} from './gameCommands.ts';

type PlayerBoardProps = {
    player: PlayerState;
    cards: Record<string, CardData>;
    isCurrentPlayer?: boolean;
    gameId?: string;
    onCommand?: (cmd: GameCommand) => void;
    onCardClick?: (regionType: RegionType, stackIndex: number, cardIndex: number) => void;
};

export function BleedConnector() {
    return (
        <div className="flex items-center gap-1.5 pl-[3.25rem] py-0.5 select-none" aria-hidden>
            <div className="flex flex-col items-center gap-0.5 text-blood/30">
                <div className="w-px h-1.5 bg-current" />
                <span className="text-[9px] leading-none">▼</span>
            </div>
            <span className="text-[9px] text-ink-muted/30 leading-none tracking-wide">bleeds</span>
        </div>
    );
}

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

export function PlayerBoard({player, cards, isCurrentPlayer, gameId, onCommand, onCardClick}: PlayerBoardProps) {
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
            regionKey: 'READY', name: 'Ready', stacks: readyStacks, columns: 5,
            onCardClick: (si, ci) => onCardClick?.('READY', si, ci),
            ...fieldRegionCbs(ready, readyStacks, gameId, onCommand),
        });
        if (torpor && torpor.count > 0) regions.push({
            regionKey: 'TORPOR', name: 'Torpor', stacks: torporStacks, columns: 4,
            onCardClick: (si, ci) => onCardClick?.('TORPOR', si, ci),
            ...fieldRegionCbs(torpor, torporStacks, gameId, onCommand),
        });
        if (research && research.count > 0) regions.push({
            regionKey: 'RESEARCH', name: 'Research', stacks: researchStacks, columns: 4, narrowGap: true,
            onCardClick: (si, ci) => onCardClick?.('RESEARCH', si, ci),
            ...fieldRegionCbs(research, researchStacks, gameId, onCommand),
        });
        if (uncontrolled) regions.push({
            regionKey: 'UNCONTROLLED', name: 'Uncontrolled', stacks: uncontrolledStacks, columns: 4, narrowGap: true,
            onCardClick: (si, ci) => onCardClick?.('UNCONTROLLED', si, ci),
            ...fieldRegionCbs(uncontrolled, uncontrolledStacks, gameId, onCommand),
        });
        if (hand) regions.push({
            regionKey: 'HAND', name: 'Hand', stacks: handStacks, columns: 1, compact: true,
            onCardClick: (si, ci) => onCardClick?.('HAND', si, ci),
        });
        if (library) regions.push({
            regionKey: 'LIBRARY', name: 'Library', stacks: libraryStacks, columns: 1, compact: true,
            onCardClick: (si, ci) => onCardClick?.('LIBRARY', si, ci),
        });
        if (crypt) regions.push({
            regionKey: 'CRYPT', name: 'Crypt', stacks: cryptStacks, columns: 1, compact: true,
            onCardClick: (si, ci) => onCardClick?.('CRYPT', si, ci),
        });
        if (ashHeap?.visible && ashHeap.count > 0) regions.push({
            regionKey: 'ASH_HEAP', name: 'Ash Heap', stacks: ashHeapStacks, columns: 1, compact: true,
            onCardClick: (si, ci) => onCardClick?.('ASH_HEAP', si, ci),
        });
        return regions;
    }, [ready, torpor, research, uncontrolled, hand, library, crypt, ashHeap,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        gameId, onCommand, onCardClick]);

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

    return (
        <div
            className={[
                'flex flex-wrap items-start gap-x-3 gap-y-1 rounded-lg border px-3 py-2',
                isCurrentPlayer
                    ? 'bg-arcane/5 border-arcane/40'
                    : 'bg-panel/50 border-line/75',
            ].join(' ')}
        >
            {/* Player info — fixed left column */}
            <div className="flex flex-col gap-0.5 w-20 shrink-0 pt-1">
                {player.predator && (
                    <span className="text-[10px] text-ink-muted/50 leading-none truncate" title={`Predator: ${player.predator}`}>
                        ▲ {player.predator}
                    </span>
                )}
                <span className={`text-sm leading-tight truncate ${isCurrentPlayer ? 'font-semibold text-ink' : 'font-medium text-ink-secondary'}`}>
                    {player.name}
                </span>
                <span className="text-xs text-blood font-medium">{player.pool} pool</span>
                {player.victoryPoints > 0 && (
                    <span className="text-xs text-gold font-medium">{player.victoryPoints} VP</span>
                )}
                {player.prey && (
                    <span className="text-[10px] text-ink-muted/50 leading-none truncate" title={`Prey: ${player.prey}`}>
                        ▼ {player.prey}
                    </span>
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
                        <div className="flex gap-3 items-start flex-wrap flex-1 min-w-0">
                            {ready && renderRegion('READY')}
                            {torpor && torpor.count > 0 && renderRegion('TORPOR')}
                            {research && research.count > 0 && renderRegion('RESEARCH')}
                            {uncontrolled && renderRegion('UNCONTROLLED')}
                        </div>

                        {/* Right column — compact region stacks */}
                        <div className="flex flex-col gap-1 pt-1 w-full lg:w-auto lg:shrink-0">
                            <div className="flex flex-row flex-wrap gap-1 justify-end lg:justify-start">
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
                    </>
                )}
            </FieldRegionDndGroup>
        </div>
    );
}
