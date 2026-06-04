import type {ReactNode} from 'react';
import type {CardData, PlayerState, RegionState, RegionType} from './types.ts';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {attachCard, cardRef, moveCard} from './gameCommands.ts';
import type {CompactRegionConfig, FieldRegionConfig} from './FieldRegion.tsx';

export function fieldRegionCbs(
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

export function makeFieldContextMenuHandler(
    playerName: string,
    regionType: RegionType,
    stacks: CardData[][],
    onCardContextMenu: ((card: CardData, ref: CardRef, x: number, y: number) => void) | undefined,
) {
    return (si: number, ci: number, x: number, y: number) => {
        const c = stacks[si]?.[ci];
        if (c) onCardContextMenu?.(c, cardRef(playerName, regionType, si, ci === 0 ? -1 : ci - 1), x, y);
    };
}

export function createCompactRegionConfigs({
    playerName, hand, library, crypt, ashHeap,
    handStacks, libraryStacks, cryptStacks, ashHeapStacks,
    onCardContextMenu, onCardClick,
}: {
    playerName: string;
    hand: RegionState | undefined;
    library: RegionState | undefined;
    crypt: RegionState | undefined;
    ashHeap: RegionState | undefined;
    handStacks: CardData[][];
    libraryStacks: CardData[][];
    cryptStacks: CardData[][];
    ashHeapStacks: CardData[][];
    onCardContextMenu?: (card: CardData, ref: CardRef, x: number, y: number) => void;
    onCardClick?: (regionType: RegionType, stackIndex: number, cardIndex: number) => void;
}): CompactRegionConfig[] {
    const crs: CompactRegionConfig[] = [];
    if (hand) crs.push({
        regionKey: 'HAND', name: 'Hand', stacks: handStacks,
        onClick: onCardClick ? () => onCardClick('HAND', 0, 0) : undefined,
        onContextMenu: (x, y) => { const c = handStacks[0]?.[0]; if (c) onCardContextMenu?.(c, cardRef(playerName, 'HAND', 0, -1), x, y); },
    });
    if (library) crs.push({
        regionKey: 'LIBRARY', name: 'Library', stacks: libraryStacks,
        onClick: onCardClick ? () => onCardClick('LIBRARY', 0, 0) : undefined,
        onContextMenu: (x, y) => { const c = libraryStacks[0]?.[0]; if (c) onCardContextMenu?.(c, cardRef(playerName, 'LIBRARY', 0, -1), x, y); },
    });
    if (crypt) crs.push({
        regionKey: 'CRYPT', name: 'Crypt', stacks: cryptStacks,
        onClick: onCardClick ? () => onCardClick('CRYPT', 0, 0) : undefined,
        onContextMenu: (x, y) => { const c = cryptStacks[0]?.[0]; if (c) onCardContextMenu?.(c, cardRef(playerName, 'CRYPT', 0, -1), x, y); },
    });
    if (ashHeap?.visible) crs.push({
        regionKey: 'ASH_HEAP', name: 'Ash Heap', stacks: ashHeapStacks,
        onClick: onCardClick ? () => onCardClick('ASH_HEAP', 0, 0) : undefined,
        onContextMenu: (x, y) => { const c = ashHeapStacks[0]?.[0]; if (c) onCardContextMenu?.(c, cardRef(playerName, 'ASH_HEAP', 0, -1), x, y); },
    });
    return crs;
}

export function regionToStacks(region: RegionState, cards: Record<string, CardData>, forceFaceDown = false): CardData[][] {
    const hidden = forceFaceDown || !region.visible;
    const cryptRegion = region.type === 'CRYPT' || region.type === 'UNCONTROLLED';

    // Non-owner viewer: no UUIDs transmitted, so synthesise placeholder stacks from count/slots
    // so that the correct number of face-down card backs are rendered.
    if (hidden && region.cardIds.length === 0 && region.count > 0) {
        if (region.slots) {
            return region.slots.map(slot => {
                const parent: CardData = {
                    id: `${region.id}:slot:${slot.index}`,
                    faceDown: true,
                    crypt: true,
                    counters: slot.counters,
                    locked: slot.locked,
                };
                const children: CardData[] = Array.from({length: slot.childCount}, (_, ci) => ({
                    id: `${region.id}:slot:${slot.index}:child:${ci}`,
                    faceDown: true,
                }));
                return [parent, ...children];
            });
        }
        return Array.from({length: region.count}, (_, i): CardData[] => [{
            id: `${region.id}:placeholder:${i}`,
            faceDown: true,
            crypt: cryptRegion,
        }]);
    }

    // Only top-level cards (no parentId) become stack roots
    const topLevelIds = region.cardIds.filter(id => !cards[id]?.parentId);
    return topLevelIds.map(id => {
        const card = cards[id] ?? {id};
        const parentCard: CardData = {
            ...card,
            faceDown: hidden || !!card.faceDown,
            crypt: card.crypt ?? (hidden && cryptRegion),
        };
        const children: CardData[] = (card.childCardIds ?? [])
            .map(cid => cards[cid])
            .filter((c): c is CardData => c != null)
            .map(child => ({
                ...child,
                faceDown: hidden || !!child.faceDown,
                crypt: child.crypt ?? (hidden && cryptRegion),
            }));
        return [parentCard, ...children];
    });
}

export function RegionBadge({label, count}: {label: string; count: number}) {
    return (
        <div className="flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-panel border border-line/75 text-ink-muted">
            <span>{label}</span>
            <span className="font-medium text-ink-secondary">{count}</span>
        </div>
    );
}

type BuildActiveRegionConfigsOptions = {
    player: PlayerState;
    gameId: string | undefined;
    onCommand: ((cmd: GameCommand) => void) | undefined;
    onCardContextMenu: ((card: CardData, ref: CardRef, x: number, y: number) => void) | undefined;
    onCardClick?: (regionType: RegionType, si: number, ci: number) => void;
    ready: RegionState | undefined;
    torpor: RegionState | undefined;
    research: RegionState | undefined;
    uncontrolled: RegionState | undefined;
    readyStacks: CardData[][];
    torporStacks: CardData[][];
    researchStacks: CardData[][];
    uncontrolledStacks: CardData[][];
    readyMinRows?: number;
    requireUncontrolledCount?: boolean;
};

export function buildActiveRegionConfigs({
    player, gameId, onCommand, onCardContextMenu, onCardClick,
    ready, torpor, research, uncontrolled,
    readyStacks, torporStacks, researchStacks, uncontrolledStacks,
    readyMinRows, requireUncontrolledCount = false,
}: BuildActiveRegionConfigsOptions): FieldRegionConfig[] {
    const regions: FieldRegionConfig[] = [];
    if (ready) regions.push({
        regionKey: 'READY', name: 'Ready', stacks: readyStacks, columns: 5,
        ...(readyMinRows !== undefined && {minRows: readyMinRows}),
        ...(onCardClick && {onCardClick: (si: number, ci: number) => onCardClick('READY', si, ci)}),
        onCardContextMenu: makeFieldContextMenuHandler(player.name, 'READY', readyStacks, onCardContextMenu),
        ...fieldRegionCbs(player, ready, gameId, onCommand),
    });
    if (torpor && torpor.count > 0) regions.push({
        regionKey: 'TORPOR', name: 'Torpor', stacks: torporStacks, columns: 4,
        ...(onCardClick && {onCardClick: (si: number, ci: number) => onCardClick('TORPOR', si, ci)}),
        onCardContextMenu: makeFieldContextMenuHandler(player.name, 'TORPOR', torporStacks, onCardContextMenu),
        ...fieldRegionCbs(player, torpor, gameId, onCommand),
    });
    if (research && research.count > 0) regions.push({
        regionKey: 'RESEARCH', name: 'Research', stacks: researchStacks, columns: 4, narrowGap: true,
        ...(onCardClick && {onCardClick: (si: number, ci: number) => onCardClick('RESEARCH', si, ci)}),
        onCardContextMenu: makeFieldContextMenuHandler(player.name, 'RESEARCH', researchStacks, onCardContextMenu),
        ...fieldRegionCbs(player, research, gameId, onCommand),
    });
    if (uncontrolled && (!requireUncontrolledCount || uncontrolled.count > 0)) regions.push({
        regionKey: 'UNCONTROLLED', name: 'Uncontrolled', stacks: uncontrolledStacks, columns: 4, narrowGap: true,
        ...(onCardClick && {onCardClick: (si: number, ci: number) => onCardClick('UNCONTROLLED', si, ci)}),
        onCardContextMenu: makeFieldContextMenuHandler(player.name, 'UNCONTROLLED', uncontrolledStacks, onCardContextMenu),
        ...fieldRegionCbs(player, uncontrolled, gameId, onCommand),
    });
    return regions;
}

export function CompactRegionRow({
    hand, isCurrentUser, library, crypt, ashHeap, rfg, renderRegion, className,
}: {
    hand: RegionState | undefined;
    isCurrentUser: boolean;
    library: RegionState | undefined;
    crypt: RegionState | undefined;
    ashHeap: RegionState | undefined;
    rfg: RegionState | undefined;
    renderRegion: (key: string) => ReactNode;
    className?: string;
}) {
    return (
        <div className={`flex flex-row flex-wrap gap-1${className ? ` ${className}` : ''}`}>
            {hand && !isCurrentUser && renderRegion('HAND')}
            {library && renderRegion('LIBRARY')}
            {crypt && renderRegion('CRYPT')}
            {ashHeap?.visible && renderRegion('ASH_HEAP')}
            {ashHeap && !ashHeap.visible && <RegionBadge label="Ash Heap" count={ashHeap.count} />}
            {rfg && rfg.count > 0 && <RegionBadge label="RFG" count={rfg.count} />}
        </div>
    );
}
