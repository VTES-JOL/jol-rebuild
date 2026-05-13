import type {CardData, PlayerState, RegionState, RegionType} from './types.ts';
import {FieldRegion} from './FieldRegion.tsx';
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

function fieldRegionCallbacks(
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

    const readyStacks       = ready        ? regionToStacks(ready, cards)           : [];
    const torporStacks      = torpor       ? regionToStacks(torpor, cards)          : [];
    const researchStacks    = research     ? regionToStacks(research, cards)        : [];
    const uncontrolledStacks = uncontrolled ? regionToStacks(uncontrolled, cards)   : [];

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

            {/* Active field regions — grow to fill; on small screens: ready then torpor/research */}
            <div className="flex gap-3 items-start flex-wrap flex-1 min-w-0">
                {ready && (
                    <FieldRegion
                        name="Ready"
                        stacks={readyStacks}
                        columns={5}
                        onCardClick={(si, ci) => onCardClick?.('READY', si, ci)}
                        {...fieldRegionCallbacks(ready, readyStacks, gameId, onCommand)}
                    />
                )}
                {torpor && torpor.count > 0 && (
                    <FieldRegion
                        name="Torpor"
                        stacks={torporStacks}
                        columns={4}
                        onCardClick={(si, ci) => onCardClick?.('TORPOR', si, ci)}
                        {...fieldRegionCallbacks(torpor, torporStacks, gameId, onCommand)}
                    />
                )}
                {research && research.count > 0 && (
                    <FieldRegion
                        name="Research"
                        stacks={researchStacks}
                        columns={4}
                        narrowGap={true}
                        onCardClick={(si, ci) => onCardClick?.('RESEARCH', si, ci)}
                        {...fieldRegionCallbacks(research, researchStacks, gameId, onCommand)}
                    />
                )}
            </div>

            {/* Right column — full width on small (wraps below active), auto on large (pins right).
                Order: uncontrolled on top, then deck stacks. */}
            <div className="flex flex-col gap-1 pt-1 w-full lg:w-auto lg:shrink-0">
                {uncontrolled && (
                    <div className="flex justify-end lg:justify-start">
                        <FieldRegion
                            name="Uncontrolled"
                            stacks={uncontrolledStacks}
                            columns={4}
                            narrowGap={true}
                            onCardClick={(si, ci) => onCardClick?.('UNCONTROLLED', si, ci)}
                            {...fieldRegionCallbacks(uncontrolled, uncontrolledStacks, gameId, onCommand)}
                        />
                    </div>
                )}
                <div className="flex flex-row flex-wrap gap-1 justify-end lg:justify-start">
                    {hand && (
                        <FieldRegion
                            name="Hand"
                            stacks={regionToStacks(hand, cards, true)}
                            columns={1}
                            compact
                            onCardClick={(si, ci) => onCardClick?.('HAND', si, ci)}
                        />
                    )}
                    {library && (
                        <FieldRegion
                            name="Library"
                            stacks={regionToStacks(library, cards)}
                            columns={1}
                            compact
                            onCardClick={(si, ci) => onCardClick?.('LIBRARY', si, ci)}
                        />
                    )}
                    {crypt && (
                        <FieldRegion
                            name="Crypt"
                            stacks={regionToStacks(crypt, cards)}
                            columns={1}
                            compact
                            onCardClick={(si, ci) => onCardClick?.('CRYPT', si, ci)}
                        />
                    )}
                    {ashHeap?.visible && ashHeap.count > 0 && (
                        <FieldRegion
                            name="Ash Heap"
                            stacks={regionToStacks(ashHeap, cards)}
                            columns={1}
                            compact
                            onCardClick={(si, ci) => onCardClick?.('ASH_HEAP', si, ci)}
                        />
                    )}
                    {ashHeap && !ashHeap.visible && ashHeap.count > 0 && (
                        <RegionBadge label="Ash Heap" count={ashHeap.count} />
                    )}
                    {rfg && rfg.count > 0 && (
                        <RegionBadge label="RFG" count={rfg.count} />
                    )}
                </div>
            </div>
        </div>
    );
}
