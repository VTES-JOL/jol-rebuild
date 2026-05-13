import type {CardData, PlayerState, RegionState} from './types.ts';
import {FieldRegion} from './FieldRegion.tsx';
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

    const readyStacks        = ready        ? regionToStacks(ready, cards)        : [];
    const torporStacks       = torpor       ? regionToStacks(torpor, cards)       : [];
    const researchStacks     = research     ? regionToStacks(research, cards)     : [];
    const uncontrolledStacks = uncontrolled ? regionToStacks(uncontrolled, cards) : [];

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
                    stacks={readyStacks}
                    columns={4}
                    minRows={2}
                    {...fieldRegionCallbacks(ready, readyStacks, gameId, onCommand)}
                />
            )}
            {torpor && torpor.count > 0 && (
                <FieldRegion
                    name="Torpor"
                    stacks={torporStacks}
                    columns={4}
                    {...fieldRegionCallbacks(torpor, torporStacks, gameId, onCommand)}
                />
            )}
            {research && research.count > 0 && (
                <FieldRegion
                    name="Research"
                    stacks={researchStacks}
                    columns={4}
                    narrowGap
                    {...fieldRegionCallbacks(research, researchStacks, gameId, onCommand)}
                />
            )}

            {/* Uncontrolled + compact stacks pinned to the bottom */}
            {hasBottom && (
                <div className="mt-auto flex flex-col gap-1 pt-1 border-t border-line/20">
                    {uncontrolled && uncontrolled.count > 0 && (
                        <FieldRegion
                            name="Uncontrolled"
                            stacks={uncontrolledStacks}
                            columns={4}
                            narrowGap
                            {...fieldRegionCallbacks(uncontrolled, uncontrolledStacks, gameId, onCommand)}
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
