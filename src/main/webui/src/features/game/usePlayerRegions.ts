import {useCallback, useMemo} from 'react';
import type {CardData, PlayerState, RegionType} from './types.ts';
import type {GameCommand} from './gameCommands.ts';
import {attachCard, cardRef, moveCard} from './gameCommands.ts';
import {regionToStacks} from './gameUtils.tsx';

export function usePlayerRegions(
    player: PlayerState,
    cards: Record<string, CardData>,
    gameId: string | undefined,
    onCommand: ((cmd: GameCommand) => void) | undefined,
) {
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

    const allStacks = useMemo(() => ({
        READY: readyStacks, TORPOR: torporStacks, RESEARCH: researchStacks,
        UNCONTROLLED: uncontrolledStacks, HAND: handStacks, LIBRARY: libraryStacks,
        CRYPT: cryptStacks, ASH_HEAP: ashHeapStacks,
    }), [readyStacks, torporStacks, researchStacks, uncontrolledStacks,
         handStacks, libraryStacks, cryptStacks, ashHeapStacks]);

    const handleCrossRegionMove = useCallback((fromKey: string, fromStackIdx: number, toKey: string) => {
        if (!gameId || !onCommand) return;
        const toRegion = player.regions[toKey as RegionType];
        const fromRegion = player.regions[fromKey as RegionType];
        if (!fromRegion || !toRegion) return;
        const ref = cardRef(player.name, fromKey as RegionType, fromStackIdx);
        onCommand(moveCard(gameId, ref, player.name, toKey as RegionType));
    }, [gameId, onCommand, player.name, player.regions]);

    const handleCrossCardMove = useCallback((fromKey: string, fromStackIdx: number, fromCardIdx: number, toKey: string, toStackIdx: number | null | 'top') => {
        if (!gameId || !onCommand) return;
        const fromRegion = player.regions[fromKey as RegionType];
        if (!fromRegion) return;

        const ref = cardRef(player.name, fromKey as RegionType, fromStackIdx, fromCardIdx === 0 ? -1 : fromCardIdx - 1);

        if (typeof toStackIdx === 'number') {
            const targetStack = allStacks[toKey as keyof typeof allStacks]?.[toStackIdx];
            if (targetStack) {
                const targetCard = targetStack[0];
                const targetIsMinion = cards[targetCard.id]?.crypt || cards[targetCard.id]?.minion;
                const draggedCard = allStacks[fromKey as keyof typeof allStacks]?.[fromStackIdx]?.[fromCardIdx];
                const draggedIsLib = draggedCard ? (!cards[draggedCard.id]?.crypt && !cards[draggedCard.id]?.minion) : false;
                if (draggedIsLib && targetIsMinion) {
                    const targetRef = cardRef(player.name, toKey as RegionType, toStackIdx);
                    onCommand(attachCard(gameId, ref, targetRef));
                    return;
                }
            }
        }

        const toRegion = player.regions[toKey as RegionType];
        if (toRegion) onCommand(moveCard(gameId, ref, player.name, toKey as RegionType, toStackIdx === 'top' ? 0 : -1));
    }, [gameId, onCommand, player.name, player.regions, allStacks, cards]);

    return {
        ready, uncontrolled, torpor, hand, ashHeap, library, crypt, research, rfg,
        readyStacks, torporStacks, researchStacks, uncontrolledStacks,
        handStacks, libraryStacks, cryptStacks, ashHeapStacks,
        handleCrossRegionMove, handleCrossCardMove,
    };
}
