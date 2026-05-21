import {useMemo} from 'react';
import type {CardData, PlayerState, RegionType} from './types.ts';
import type {FieldRegionConfig} from './FieldRegion.tsx';
import {FieldRegionDndGroup} from './FieldRegion.tsx';
import {buildActiveRegionConfigs, CompactRegionRow, createCompactRegionConfigs} from './gameUtils.tsx';
import type {CardRef, GameCommand} from './gameCommands.ts';
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

export function PlayerBoard({player, cards, isCurrentPlayer, gameId, onCommand, onCardClick, onCardContextMenu}: PlayerBoardProps) {
    const {
        ready, torpor, research, uncontrolled, hand, library, crypt, ashHeap, rfg,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        handleCrossRegionMove, handleCrossCardMove,
    } = usePlayerRegions(player, cards, gameId, onCommand);

    // All regions share ONE DndContext so compact→active cross-region drags work.
    const allRegions = useMemo<FieldRegionConfig[]>(() => buildActiveRegionConfigs({
        player, gameId, onCommand, onCardContextMenu, onCardClick,
        ready, torpor, research, uncontrolled,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
    }), [ready, torpor, research, uncontrolled,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        gameId, onCommand, onCardClick, onCardContextMenu, player]);

    const allCompactRegions = useMemo(() => createCompactRegionConfigs({
        playerName: player.name,
        hand: isCurrentPlayer ? undefined : hand,
        library, crypt, ashHeap,
        handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        onCardContextMenu, onCardClick,
    }), [hand, isCurrentPlayer, library, crypt, ashHeap, handStacks, libraryStacks, cryptStacks, ashHeapStacks,
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
                            <CompactRegionRow
                                hand={hand}
                                isCurrentUser={!!isCurrentPlayer}
                                library={library}
                                crypt={crypt}
                                ashHeap={ashHeap}
                                rfg={rfg}
                                renderRegion={renderRegion}
                                className="justify-end lg:justify-start"
                            />
                        </div>
                    </>
                )}
            </FieldRegionDndGroup>
        </div>
    );
}
