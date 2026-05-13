import type {CardData, PlayerState, RegionState} from './types.ts';
import {FieldRegion} from './FieldRegion.tsx';

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

export type PlayerColumnRole = 'predator' | 'focused' | 'prey';

type PlayerColumnProps = {
    player: PlayerState;
    cards: Record<string, CardData>;
    role: PlayerColumnRole;
    isFocused?: boolean;
    isCurrentUser?: boolean;
};

export function PlayerColumn({player, cards, role, isFocused, isCurrentUser}: PlayerColumnProps) {
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

    const hasBottom =
        !!hand || !!library || !!crypt ||
        (ashHeap && ashHeap.count > 0) ||
        (rfg && rfg.count > 0) ||
        (uncontrolled && uncontrolled.count > 0);

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

            {/* Active field regions — grow into available space */}
            {ready && (
                <FieldRegion
                    name="Ready"
                    stacks={regionToStacks(ready, cards)}
                    columns={4}
                    minRows={2}
                />
            )}
            {torpor && torpor.count > 0 && (
                <FieldRegion
                    name="Torpor"
                    stacks={regionToStacks(torpor, cards)}
                    columns={4}
                />
            )}
            {research && research.count > 0 && (
                <FieldRegion
                    name="Research"
                    stacks={regionToStacks(research, cards)}
                    columns={4}
                    narrowGap
                />
            )}

            {/* Uncontrolled + compact stacks pinned to the bottom */}
            {hasBottom && (
                <div className="mt-auto flex flex-col gap-1 pt-1 border-t border-line/20">
                    {uncontrolled && uncontrolled.count > 0 && (
                        <FieldRegion
                            name="Uncontrolled"
                            stacks={regionToStacks(uncontrolled, cards)}
                            columns={4}
                            narrowGap
                        />
                    )}
                    <div className="flex flex-row flex-wrap gap-1">
                        {hand && (
                            <FieldRegion
                                name="Hand"
                                stacks={regionToStacks(hand, cards, true)}
                                columns={1}
                                compact
                            />
                        )}
                        {library && (
                            <FieldRegion
                                name="Library"
                                stacks={regionToStacks(library, cards)}
                                columns={1}
                                compact
                            />
                        )}
                        {crypt && (
                            <FieldRegion
                                name="Crypt"
                                stacks={regionToStacks(crypt, cards)}
                                columns={1}
                                compact
                            />
                        )}
                        {ashHeap?.visible && ashHeap.count > 0 && (
                            <FieldRegion
                                name="Ash Heap"
                                stacks={regionToStacks(ashHeap, cards)}
                                columns={1}
                                compact
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
            )}
        </div>
    );
}
