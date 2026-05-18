import {useMemo} from 'react';
import type {CardData, PlayerState, RegionState, RegionType} from './types.ts';
import type {CompactRegionConfig, FieldRegionConfig} from './FieldRegion.tsx';
import {FieldRegionDndGroup} from './FieldRegion.tsx';
import {RegionBadge} from './gameUtils.tsx';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {attachCard, cardRef, moveCard} from './gameCommands.ts';
import {usePlayerRegions} from './usePlayerRegions.ts';

type PlayerBoardProps = {
    player: PlayerState;
    cards: Record<string, CardData>;
    isCurrentPlayer?: boolean;
    gameId?: string;
    onCommand?: (cmd: GameCommand) => void;
    onCardClick?: (regionType: RegionType, stackIndex: number, cardIndex: number) => void;
    onCardContextMenu?: (card: CardData, ref: CardRef, x: number, y: number) => void;
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

export function PlayerBoard({player, cards, isCurrentPlayer, gameId, onCommand, onCardClick, onCardContextMenu}: PlayerBoardProps) {
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
            regionKey: 'READY', name: 'Ready', stacks: readyStacks, columns: 5,
            onCardClick: (si, ci) => onCardClick?.('READY', si, ci),
            onCardContextMenu: (si, ci, x, y) => { const c = readyStacks[si]?.[ci]; if (c) onCardContextMenu?.(c, cardRef(player.name, 'READY', si, ci === 0 ? -1 : ci - 1), x, y); },
            ...fieldRegionCbs(player, ready, gameId, onCommand),
        });
        if (torpor && torpor.count > 0) regions.push({
            regionKey: 'TORPOR', name: 'Torpor', stacks: torporStacks, columns: 4,
            onCardClick: (si, ci) => onCardClick?.('TORPOR', si, ci),
            onCardContextMenu: (si, ci, x, y) => { const c = torporStacks[si]?.[ci]; if (c) onCardContextMenu?.(c, cardRef(player.name, 'TORPOR', si, ci === 0 ? -1 : ci - 1), x, y); },
            ...fieldRegionCbs(player, torpor, gameId, onCommand),
        });
        if (research && research.count > 0) regions.push({
            regionKey: 'RESEARCH', name: 'Research', stacks: researchStacks, columns: 4, narrowGap: true,
            onCardClick: (si, ci) => onCardClick?.('RESEARCH', si, ci),
            onCardContextMenu: (si, ci, x, y) => { const c = researchStacks[si]?.[ci]; if (c) onCardContextMenu?.(c, cardRef(player.name, 'RESEARCH', si, ci === 0 ? -1 : ci - 1), x, y); },
            ...fieldRegionCbs(player, research, gameId, onCommand),
        });
        if (uncontrolled) regions.push({
            regionKey: 'UNCONTROLLED', name: 'Uncontrolled', stacks: uncontrolledStacks, columns: 4, narrowGap: true,
            onCardClick: (si, ci) => onCardClick?.('UNCONTROLLED', si, ci),
            onCardContextMenu: (si, ci, x, y) => { const c = uncontrolledStacks[si]?.[ci]; if (c) onCardContextMenu?.(c, cardRef(player.name, 'UNCONTROLLED', si, ci === 0 ? -1 : ci - 1), x, y); },
            ...fieldRegionCbs(player, uncontrolled, gameId, onCommand),
        });
        return regions;
    }, [ready, torpor, research, uncontrolled,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        gameId, onCommand, onCardClick, onCardContextMenu, player]);

    const allCompactRegions = useMemo<CompactRegionConfig[]>(() => {
        const crs: CompactRegionConfig[] = [];
        if (hand) crs.push({
            regionKey: 'HAND', name: 'Hand', stacks: handStacks,
            onClick: () => onCardClick?.('HAND', 0, 0),
            onContextMenu: (x, y) => { const c = handStacks[0]?.[0]; if (c) onCardContextMenu?.(c, cardRef(player.name, 'HAND', 0, -1), x, y); },
        });
        if (library) crs.push({
            regionKey: 'LIBRARY', name: 'Library', stacks: libraryStacks,
            onClick: () => onCardClick?.('LIBRARY', 0, 0),
            onContextMenu: (x, y) => { const c = libraryStacks[0]?.[0]; if (c) onCardContextMenu?.(c, cardRef(player.name, 'LIBRARY', 0, -1), x, y); },
        });
        if (crypt) crs.push({
            regionKey: 'CRYPT', name: 'Crypt', stacks: cryptStacks,
            onClick: () => onCardClick?.('CRYPT', 0, 0),
            onContextMenu: (x, y) => { const c = cryptStacks[0]?.[0]; if (c) onCardContextMenu?.(c, cardRef(player.name, 'CRYPT', 0, -1), x, y); },
        });
        if (ashHeap) crs.push({
            regionKey: 'ASH_HEAP', name: 'Ash Heap', stacks: ashHeapStacks,
            onClick: () => onCardClick?.('ASH_HEAP', 0, 0),
            onContextMenu: (x, y) => { const c = ashHeapStacks[0]?.[0]; if (c) onCardContextMenu?.(c, cardRef(player.name, 'ASH_HEAP', 0, -1), x, y); },
        });
        return crs;
    }, [hand, library, crypt, ashHeap, handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        onCardClick, onCardContextMenu, player.name]);

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
                compactRegions={allCompactRegions}
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
                                {ashHeap?.visible && renderRegion('ASH_HEAP')}
                                {ashHeap && !ashHeap.visible && (
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
