import type {CardData, PlayerState, RegionState, RegionType} from './types.ts';
import {FieldRegion} from './FieldRegion.tsx';

type PlayerBoardProps = {
    player: PlayerState;
    cards: Record<string, CardData>;
    isCurrentPlayer?: boolean;
    onCardClick?: (regionType: RegionType, stackIndex: number, cardIndex: number) => void;
};

function regionToStacks(region: RegionState, cards: Record<string, CardData>, forceFaceDown = false): CardData[][] {
    const hidden = forceFaceDown || !region.visible;
    const cryptRegion = region.type === 'CRYPT' || region.type === 'UNCONTROLLED';
    return region.cardIds.map(id => {
        const card = cards[id] ?? {id};
        return [{
            ...card,
            faceDown: hidden || !!card.faceDown,
            crypt: card.crypt ?? (hidden && cryptRegion),
        }];
    });
}

function RegionBadge({label, count}: {label: string; count: number}) {
    return (
        <div className="flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-panel border border-line/75 text-ink-muted">
            <span>{label}</span>
            <span className="font-medium text-ink-secondary">{count}</span>
        </div>
    );
}

export function PlayerBoard({player, cards, isCurrentPlayer, onCardClick}: PlayerBoardProps) {
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

    return (
        <div className={[
            'flex items-start gap-3 rounded-lg border px-3 py-2',
            isCurrentPlayer
                ? 'bg-arcane/5 border-arcane/40'
                : 'bg-panel/50 border-line/75',
        ].join(' ')}>

            {/* Player info — fixed left column */}
            <div className="flex flex-col gap-0.5 w-20 shrink-0 pt-1">
                <span className={`text-sm leading-tight truncate ${isCurrentPlayer ? 'font-semibold text-ink' : 'font-medium text-ink-secondary'}`}>
                    {player.name}
                </span>
                <span className="text-xs text-blood font-medium">{player.pool} pool</span>
                {player.victoryPoints > 0 && (
                    <span className="text-xs text-gold font-medium">{player.victoryPoints} VP</span>
                )}
            </div>

            {/* Visible active regions — grow to fill available width */}
            <div className="flex gap-3 items-start flex-wrap flex-1 min-w-0">
                {ready && (
                    <FieldRegion
                        name="Ready"
                        stacks={regionToStacks(ready, cards)}
                        columns={5}
                        onCardClick={(si, ci) => onCardClick?.('READY', si, ci)}
                    />
                )}
                {uncontrolled && (
                    <FieldRegion
                        name="Uncontrolled"
                        stacks={regionToStacks(uncontrolled, cards)}
                        columns={4}
                        onCardClick={(si, ci) => onCardClick?.('UNCONTROLLED', si, ci)}
                    />
                )}
                {torpor && torpor.count > 0 && (
                    <FieldRegion
                        name="Torpor"
                        stacks={regionToStacks(torpor, cards)}
                        columns={2}
                        onCardClick={(si, ci) => onCardClick?.('TORPOR', si, ci)}
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
            </div>

            {/* Deck stacks and collapsed regions — pinned to the right */}
            <div className="flex flex-row gap-1 shrink-0 pt-1">
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
                {ashHeap && !ashHeap.visible && ashHeap.count > 0 && (
                    <RegionBadge label="Ash Heap" count={ashHeap.count} />
                )}
                {research && research.count > 0 && (
                    <RegionBadge label="Research" count={research.count} />
                )}
                {rfg && rfg.count > 0 && (
                    <RegionBadge label="RFG" count={rfg.count} />
                )}
            </div>
        </div>
    );
}
