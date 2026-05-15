import type {DragEndEvent, DragOverEvent, DragStartEvent} from '@dnd-kit/core';
import {DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors} from '@dnd-kit/core';
import {arrayMove, SortableContext, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {CardData, PlayerState, RegionState, RegionType} from './types.ts';
import {DisciplineIcon} from '@/shared/components/DisciplineIcon.tsx';
import {ClanIcon} from '@/shared/components/ClanIcon.tsx';

type TextBoardProps = {
    orderedPlayers: PlayerState[];
    cards: Record<string, CardData>;
    currentUser: string;
    onCardReorder?: (playerName: string, regionType: RegionType, fromIndex: number, toIndex: number) => void;
    onCardMove?: (playerName: string, fromRegion: RegionType, fromIndex: number, toRegion: RegionType, childIdx?: number) => void;
    onCardAttach?: (playerName: string, fromRegion: RegionType, fromTopIdx: number, fromChildIdx: number | null, toRegion: RegionType, toTopIdx: number) => void;
};

const REGION_ORDER: RegionType[] = [
    'READY', 'TORPOR', 'RESEARCH', 'UNCONTROLLED',
    'LIBRARY', 'CRYPT', 'ASH_HEAP', 'REMOVED_FROM_GAME',
];

const HIDE_WHEN_EMPTY = new Set<RegionType>(['TORPOR', 'RESEARCH', 'REMOVED_FROM_GAME']);

const REGION_LABELS: Record<RegionType, string> = {
    READY: 'Ready',
    UNCONTROLLED: 'Uncontrolled',
    TORPOR: 'Torpor',
    RESEARCH: 'Research',
    HAND: 'Hand',
    LIBRARY: 'Library',
    CRYPT: 'Crypt',
    ASH_HEAP: 'Ash Heap',
    REMOVED_FROM_GAME: 'Removed',
};

// ── Position-based ID scheme ──────────────────────────────────────────────────
// Top-level card at position p: "${regionType}:${p}"
// Child card at parent p, child index c: "${regionType}:${p}:child:${c}"
// RegionType names have no colons, so ":" is an unambiguous separator.

const topPosId = (rt: RegionType, p: number) => `${rt}:${p}`;
const childPosId = (rt: RegionType, p: number, c: number) => `${rt}:${p}:child:${c}`;

type ParsedPosId = {regionType: RegionType; topIdx: number; childIdx?: number};

function parsePosId(id: string): ParsedPosId | null {
    const parts = id.split(':');
    if (parts.length === 2) return {regionType: parts[0] as RegionType, topIdx: parseInt(parts[1], 10)};
    if (parts.length === 4 && parts[2] === 'child') return {regionType: parts[0] as RegionType, topIdx: parseInt(parts[1], 10), childIdx: parseInt(parts[3], 10)};
    return null;
}

// Returns the UUIDs of top-level (non-child) cards in a visible region.
function regionTopUuids(region: RegionState, cards: Record<string, CardData>): string[] {
    const cardSet = new Set(region.cardIds);
    const childSet = new Set(region.cardIds.filter(id => {
        const p = cards[id]?.parentId;
        return p != null && cardSet.has(p);
    }));
    return region.cardIds.filter(id => !childSet.has(id));
}

// ── CardRow ───────────────────────────────────────────────────────────────────

function CardRow({card, isHidden, isChild = false}: {card: CardData; isHidden: boolean; isChild?: boolean}) {
    if (isHidden) {
        return (
            <div className={`font-mono text-base text-ink-muted/40 py-1.5 flex items-center gap-1${isChild ? ' pl-5' : ''}`}>
                {isChild && <span className="text-sm text-ink-muted/30 shrink-0">└</span>}
                <span>***********</span>
            </div>
        );
    }

    const isCryptCard = card.crypt || card.minion;
    const name = card.name ?? 'Unknown';

    let counterDisplay: string | null = null;
    if (card.counters !== undefined) {
        counterDisplay = isCryptCard && card.capacity !== undefined
            ? `${card.counters}/${card.capacity}`
            : `${card.counters}`;
    }

    return (
        <div className={`py-1.5${isChild ? ' pl-5' : ''}`}>
            <div className="flex items-center gap-1.5 min-w-0">
                {isChild && <span className="text-sm text-ink-muted/40 shrink-0">└</span>}
                <span className="font-mono truncate flex-1 text-ink-secondary leading-snug">
                    {name}
                </span>
                {!isChild && card.locked && (
                    <span className="text-[13px] bg-line/40 text-ink-muted/70 rounded px-1 shrink-0 leading-none py-0.5">L</span>
                )}
                {counterDisplay && (
                    <span className="font-mono text-[15px] text-ink-muted shrink-0 tabular-nums">{counterDisplay}</span>
                )}
            </div>
            {isCryptCard && !isChild && (card.disciplines?.length || card.clan) && (
                <div className="flex items-center gap-1 pl-1 mt-1 flex-wrap">
                    {card.disciplines?.map(d => (
                        <DisciplineIcon key={d} discipline={d} size={18} />
                    ))}
                    {card.clan && <ClanIcon clan={card.clan} size={18} />}
                </div>
            )}
        </div>
    );
}

// ── SortableCardRow ───────────────────────────────────────────────────────────

function SortableCardRow({id, card, isHidden, isChild, isCrossRegionDrag, isAttachTarget}: {
    id: string; card: CardData; isHidden: boolean; isChild?: boolean;
    isCrossRegionDrag: boolean; isAttachTarget: boolean;
}) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging, isOver} = useSortable({id});
    const style = isCrossRegionDrag
        ? undefined
        : {transform: CSS.Transform.toString(transform), transition};
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={[
                'cursor-grab active:cursor-grabbing',
                isDragging && 'opacity-30',
                isCrossRegionDrag && isOver && 'ring-1 ring-arcane/60 rounded-sm bg-arcane/5',
                isAttachTarget && isOver && 'ring-2 ring-gold/60 rounded-sm bg-gold/5',
            ].filter(Boolean).join(' ')}
            {...attributes}
            {...listeners}
        >
            <CardRow card={card} isHidden={isHidden} isChild={isChild} />
        </div>
    );
}

// Children are drag-source only — not sortable targets.
function DraggableChildRow({id, card, isHidden}: {id: string; card: CardData; isHidden: boolean}) {
    const {attributes, listeners, setNodeRef, isDragging} = useDraggable({id});
    return (
        <div
            ref={setNodeRef}
            className={`cursor-grab active:cursor-grabbing${isDragging ? ' opacity-30' : ''}`}
            {...attributes}
            {...listeners}
        >
            <CardRow card={card} isHidden={isHidden} isChild />
        </div>
    );
}

// ── RegionSection ─────────────────────────────────────────────────────────────

function RegionSection({
    region, resolveCard, childCountAt, sortedIds, isDropTarget, activeDragFromRegion, activeDragPosId,
}: {
    region: RegionState;
    resolveCard: (posId: string) => CardData;
    childCountAt: (topIdx: number) => number;
    sortedIds: string[];
    isDropTarget: boolean;
    activeDragFromRegion: RegionType | null;
    activeDragPosId: string | null;
}) {
    const [collapsed, setCollapsed] = useState(!region.visible);
    const {setNodeRef} = useDroppable({id: `region-${region.type}`});
    const isCrossRegionDrag = activeDragFromRegion !== null && activeDragFromRegion !== region.type;

    const activeDragCard = activeDragPosId ? resolveCard(activeDragPosId) : null;
    const activeIsLib = activeDragCard && !(activeDragCard.crypt || activeDragCard.minion);

    return (
        <div
            ref={setNodeRef}
            className={`mt-4 rounded-md transition-colors${isDropTarget ? ' ring-2 ring-arcane/50 bg-arcane/5' : ''}`}
        >
            <button
                className="w-full flex items-center gap-1.5 text-left text-[13px] uppercase tracking-wide text-ink-muted/70 font-semibold border-b border-line/40 pb-0.5 mb-0.5 hover:text-ink-muted transition-colors group"
                onClick={() => setCollapsed(c => !c)}
            >
                <span className="text-[11px] leading-none text-ink-muted/40 group-hover:text-ink-muted/70 transition-colors shrink-0">
                    {collapsed ? '▸' : '▾'}
                </span>
                <span>{REGION_LABELS[region.type]} ({region.count})</span>
            </button>
            {!collapsed && (
                <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
                    {sortedIds.length === 0 && (
                        <div className="h-8 flex items-center justify-center text-[11px] text-ink-muted/30 italic select-none">
                            empty
                        </div>
                    )}
                    {sortedIds.map(posId => {
                        const parsed = parsePosId(posId);
                        const topIdx = parsed?.topIdx ?? 0;
                        const card = resolveCard(posId);
                        const hidden = !region.visible || !!card.faceDown;
                        const childCount = hidden ? 0 : childCountAt(topIdx);
                        const isMinion = !!(card.crypt || card.minion);
                        const isAttachTarget = !!(activeIsLib && isMinion);
                        return (
                            <div key={posId} className="border-b border-line/20 last:border-0">
                                <SortableCardRow
                                    id={posId}
                                    card={card}
                                    isHidden={hidden}
                                    isCrossRegionDrag={isCrossRegionDrag}
                                    isAttachTarget={isAttachTarget}
                                />
                                {Array.from({length: childCount}, (_, c) => {
                                    const cPosId = childPosId(region.type, topIdx, c);
                                    return (
                                        <DraggableChildRow
                                            key={cPosId}
                                            id={cPosId}
                                            card={resolveCard(cPosId)}
                                            isHidden={false}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </SortableContext>
            )}
        </div>
    );
}

// ── PlayerColumn ──────────────────────────────────────────────────────────────

function PlayerColumn({
    player, cards, isCurrentUser, onCardReorder, onCardMove, onCardAttach,
}: {
    player: PlayerState;
    cards: Record<string, CardData>;
    isCurrentUser: boolean;
    onCardReorder?: TextBoardProps['onCardReorder'];
    onCardMove?: TextBoardProps['onCardMove'];
    onCardAttach?: TextBoardProps['onCardAttach'];
}) {
    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

    const regions = useMemo(
        () => REGION_ORDER
            .map(type => player.regions[type])
            .filter((r): r is RegionState => r != null && (!HIDE_WHEN_EMPTY.has(r.type) || r.count > 0)),
        [player.regions],
    );

    // Resolve card data by position ID without using UUIDs as external identifiers.
    const resolveCard = useCallback((posId: string): CardData => {
        const parsed = parsePosId(posId);
        if (!parsed) return {id: posId, faceDown: true};

        const region = player.regions[parsed.regionType];
        if (!region) return {id: posId, faceDown: true};

        if (!region.visible) {
            if (parsed.childIdx !== undefined) return {id: posId, faceDown: true};
            const slot = region.slots?.[parsed.topIdx];
            if (slot) return {id: posId, faceDown: true, crypt: true, counters: slot.counters, locked: slot.locked};
            const isCryptType = parsed.regionType === 'CRYPT' || parsed.regionType === 'UNCONTROLLED';
            return {id: posId, faceDown: true, crypt: isCryptType};
        }

        const topUuids = regionTopUuids(region, cards);
        if (parsed.childIdx === undefined) {
            const uuid = topUuids[parsed.topIdx];
            return uuid ? (cards[uuid] ?? {id: posId}) : {id: posId, faceDown: true};
        }
        const parentUuid = topUuids[parsed.topIdx];
        if (!parentUuid) return {id: posId, faceDown: true};
        const parent = cards[parentUuid];
        if (!parent) return {id: posId, faceDown: true};
        const cardSet = new Set(region.cardIds);
        const childUuids = (parent.childCardIds ?? []).filter(cid => cardSet.has(cid));
        const childUuid = childUuids[parsed.childIdx];
        return childUuid ? (cards[childUuid] ?? {id: posId, faceDown: true}) : {id: posId, faceDown: true};
    }, [player.regions, cards]);

    const childCountAt = useCallback((regionType: RegionType, topIdx: number): number => {
        const region = player.regions[regionType];
        if (!region || !region.visible) return region?.slots?.[topIdx]?.childCount ?? 0;
        const topUuids = regionTopUuids(region, cards);
        const parentUuid = topUuids[topIdx];
        if (!parentUuid) return 0;
        const parent = cards[parentUuid];
        if (!parent) return 0;
        const cardSet = new Set(region.cardIds);
        return (parent.childCardIds ?? []).filter(cid => cardSet.has(cid)).length;
    }, [player.regions, cards]);

    const getTopLevel = useCallback((region: RegionState): string[] => {
        if (!region.visible) {
            const count = region.slots?.length ?? region.count;
            return Array.from({length: count}, (_, i) => topPosId(region.type, i));
        }
        const topUuids = regionTopUuids(region, cards);
        return topUuids.map((_, i) => topPosId(region.type, i));
    }, [cards]);

    const [sortedIds, setSortedIds] = useState<Partial<Record<RegionType, string[]>>>(() =>
        Object.fromEntries(regions.map(r => [r.type, getTopLevel(r)]))
    );

    useEffect(() => {
        setSortedIds(Object.fromEntries(regions.map(r => [r.type, getTopLevel(r)])));
    }, [regions, getTopLevel]);

    const [activePosId, setActivePosId] = useState<string | null>(null);
    const [activeDragFromRegion, setActiveDragFromRegion] = useState<RegionType | null>(null);
    const [dragOverRegion, setDragOverRegion] = useState<RegionType | null>(null);

    const resetSortedIds = useCallback(() => {
        setSortedIds(Object.fromEntries(regions.map(r => [r.type, getTopLevel(r)])));
    }, [regions, getTopLevel]);

    const handleDragStart = useCallback(({active}: DragStartEvent) => {
        const id = String(active.id);
        setActivePosId(id);
        setActiveDragFromRegion(parsePosId(id)?.regionType ?? null);
    }, []);

    const handleDragOver = useCallback(({active, over}: DragOverEvent) => {
        const activeId = String(active.id);
        const overId = over ? String(over.id) : null;
        const fromRegionType = parsePosId(activeId)?.regionType;
        if (!fromRegionType) return;

        if (!overId) { setDragOverRegion(null); return; }

        const currentOverRegion: RegionType | null = overId.startsWith('region-')
            ? overId.slice('region-'.length) as RegionType
            : parsePosId(overId)?.regionType ?? null;
        setDragOverRegion(currentOverRegion);
        if (currentOverRegion !== fromRegionType) return;

        // Suppress sort preview when dragging a library card over a vampire (attach intent).
        const activeCard = resolveCard(activeId);
        const overCard = !overId.startsWith('region-') ? resolveCard(overId) : null;
        if (activeCard && overCard
            && !(activeCard.crypt || activeCard.minion)
            && (overCard.crypt || overCard.minion)) return;

        setSortedIds(prev => {
            const ids = prev[fromRegionType] ?? [];
            const from = ids.indexOf(activeId);
            const to = ids.indexOf(overId);
            if (from === -1 || to === -1 || from === to) return prev;
            return {...prev, [fromRegionType]: arrayMove(ids, from, to)};
        });
    }, [resolveCard]);

    const handleDragEnd = useCallback(({active, over}: DragEndEvent) => {
        const activeId = String(active.id);
        const activeParsed = parsePosId(activeId);
        const fromRegionType = activeParsed?.regionType;
        const currentSortedIds = sortedIds;

        setActivePosId(null);
        setActiveDragFromRegion(null);
        setDragOverRegion(null);
        resetSortedIds();

        if (!over || !fromRegionType || !activeParsed) return;
        const overId = String(over.id);

        const toRegionType: RegionType | null = overId.startsWith('region-')
            ? overId.slice('region-'.length) as RegionType
            : parsePosId(overId)?.regionType ?? null;
        if (!toRegionType) return;

        const overPosId = !overId.startsWith('region-') ? overId : null;
        const overParsed = overPosId ? parsePosId(overPosId) : null;
        const activeCard = resolveCard(activeId);
        const overCard = overPosId ? resolveCard(overPosId) : null;
        const activeIsChild = activeParsed.childIdx !== undefined;
        const activeIsLib = activeCard && !(activeCard.crypt || activeCard.minion);
        const overIsMinion = !!(overCard?.crypt || overCard?.minion);

        if (fromRegionType !== toRegionType) {
            if (overParsed && overParsed.childIdx === undefined && overIsMinion) {
                onCardAttach?.(player.name, fromRegionType, activeParsed.topIdx, activeParsed.childIdx ?? null, toRegionType, overParsed.topIdx);
            } else {
                onCardMove?.(player.name, fromRegionType, activeParsed.topIdx, toRegionType, activeParsed.childIdx);
            }
            return;
        }

        // Same region
        if (activeIsChild) {
            if (overParsed && overParsed.childIdx === undefined && overIsMinion && overParsed.topIdx !== activeParsed.topIdx) {
                onCardAttach?.(player.name, fromRegionType, activeParsed.topIdx, activeParsed.childIdx!, toRegionType, overParsed.topIdx);
            } else {
                // Detach: become top-level in same region
                onCardMove?.(player.name, fromRegionType, activeParsed.topIdx, fromRegionType, activeParsed.childIdx);
            }
            return;
        }

        if (activeIsLib && overParsed && overParsed.childIdx === undefined && overIsMinion) {
            onCardAttach?.(player.name, fromRegionType, activeParsed.topIdx, null, toRegionType, overParsed.topIdx);
            return;
        }

        // Within-region reorder
        const liveOrder = currentSortedIds[fromRegionType] ?? [];
        const toIndex = liveOrder.indexOf(activeId);
        const fromIndex = activeParsed.topIdx;
        if (toIndex === -1 || fromIndex === toIndex) return;
        onCardReorder?.(player.name, fromRegionType, fromIndex, toIndex);
    }, [sortedIds, resetSortedIds, player.name, resolveCard, onCardReorder, onCardMove, onCardAttach]);

    const handleDragCancel = useCallback(() => {
        setActivePosId(null);
        setActiveDragFromRegion(null);
        setDragOverRegion(null);
        resetSortedIds();
    }, [resetSortedIds]);

    const activeCard = activePosId ? resolveCard(activePosId) : null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className={[
                'flex-1 min-w-52 flex flex-col min-h-0 overflow-y-auto rounded-lg border px-2 py-2',
                isCurrentUser ? 'bg-arcane/5 border-arcane/40' : 'bg-panel/50 border-line/75',
            ].join(' ')}>
                <div className="shrink-0 pb-1.5 border-b border-line/50 mb-0.5">
                    <div className={`text-sm leading-tight truncate ${isCurrentUser ? 'font-semibold text-ink' : 'font-medium text-ink-secondary'}`}>
                        {player.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-blood font-medium">{player.pool} pool</span>
                        {player.victoryPoints > 0 && (
                            <span className="text-xs text-gold font-medium">{player.victoryPoints} VP</span>
                        )}
                        {player.ousted && (
                            <span className="text-[10px] text-ink-muted/50 italic">ousted</span>
                        )}
                    </div>
                </div>
                {regions.map(region => (
                    <RegionSection
                        key={region.id}
                        region={region}
                        resolveCard={resolveCard}
                        childCountAt={topIdx => childCountAt(region.type, topIdx)}
                        sortedIds={sortedIds[region.type] ?? getTopLevel(region)}
                        activeDragFromRegion={activeDragFromRegion}
                        activeDragPosId={activePosId}
                        isDropTarget={
                            activeDragFromRegion !== null &&
                            activeDragFromRegion !== region.type &&
                            dragOverRegion === region.type
                        }
                    />
                ))}
            </div>
            <DragOverlay dropAnimation={null}>
                {activeCard && (
                    <div className="bg-panel border border-arcane/40 rounded px-2 py-1 text-xs font-mono text-ink-secondary shadow-lg pointer-events-none whitespace-nowrap">
                        {activeCard.name ?? 'hidden'}
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}

// ── TextBoard ─────────────────────────────────────────────────────────────────

export function TextBoard({orderedPlayers, cards, currentUser, onCardReorder, onCardMove, onCardAttach}: TextBoardProps) {
    return (
        <div className="flex gap-2 h-full min-h-0 overflow-x-auto">
            {orderedPlayers.map(player => (
                <PlayerColumn
                    key={player.name}
                    player={player}
                    cards={cards}
                    isCurrentUser={player.name === currentUser}
                    onCardReorder={onCardReorder}
                    onCardMove={onCardMove}
                    onCardAttach={onCardAttach}
                />
            ))}
        </div>
    );
}
