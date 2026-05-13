import type {DragEndEvent, DragOverEvent, DragStartEvent} from '@dnd-kit/core';
import {DndContext, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors} from '@dnd-kit/core';
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
    onCardMove?: (playerName: string, cardId: string, fromRegionType: RegionType, toRegionType: RegionType) => void;
};

const REGION_ORDER: RegionType[] = [
    'READY', 'TORPOR', 'RESEARCH', 'UNCONTROLLED',
    'LIBRARY', 'CRYPT', 'ASH_HEAP', 'REMOVED_FROM_GAME',
];

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

function SortableCardRow({id, card, isHidden, isChild, isCrossRegionDrag}: {
    id: string; card: CardData; isHidden: boolean; isChild?: boolean; isCrossRegionDrag: boolean;
}) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging, isOver} = useSortable({id});
    // During a cross-region drag: suppress sortable transforms (prevents the card from shifting
    // away under the pointer) and instead highlight the card if it's the direct drop target.
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
            ].filter(Boolean).join(' ')}
            {...attributes}
            {...listeners}
        >
            <CardRow card={card} isHidden={isHidden} isChild={isChild} />
        </div>
    );
}

function RegionSection({
    region, cards, sortedIds, isDropTarget, activeDragFromRegion,
}: {
    region: RegionState;
    cards: Record<string, CardData>;
    sortedIds: string[];
    isDropTarget: boolean;
    activeDragFromRegion: RegionType | null;
}) {
    const [collapsed, setCollapsed] = useState(!region.visible);
    const {setNodeRef} = useDroppable({id: `region-${region.type}`});
    const isCrossRegionDrag = activeDragFromRegion !== null && activeDragFromRegion !== region.type;

    const regionCardSet = new Set(region.cardIds);
    const childSet = new Set(
        region.cardIds.filter(id => {
            const parentId = cards[id]?.parentId;
            return parentId != null && regionCardSet.has(parentId);
        })
    );

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
                    {sortedIds.map(id => {
                        const card = cards[id] ?? {id};
                        const hidden = !region.visible || !!card.faceDown;
                        const children = hidden || childSet.has(id)
                            ? []
                            : (card.childCardIds ?? [])
                                .filter(cid => regionCardSet.has(cid))
                                .map(cid => cards[cid])
                                .filter((c): c is CardData => c != null);
                        return (
                            <div key={id} className="border-b border-line/20 last:border-0">
                                <SortableCardRow id={id} card={card} isHidden={hidden} isCrossRegionDrag={isCrossRegionDrag} />
                                {children.map(child => (
                                    <CardRow key={child.id} card={child} isHidden={false} isChild />
                                ))}
                            </div>
                        );
                    })}
                </SortableContext>
            )}
        </div>
    );
}

function PlayerColumn({
    player, cards, isCurrentUser, onCardReorder, onCardMove,
}: {
    player: PlayerState;
    cards: Record<string, CardData>;
    isCurrentUser: boolean;
    onCardReorder?: TextBoardProps['onCardReorder'];
    onCardMove?: TextBoardProps['onCardMove'];
}) {
    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

    const regions = useMemo(
        () => REGION_ORDER
            .map(type => player.regions[type])
            .filter((r): r is RegionState => r != null && r.cardIds.length > 0),
        [player.regions],
    );

    const getTopLevel = useCallback((region: RegionState): string[] => {
        const regionCardSet = new Set(region.cardIds);
        const childIds = new Set(
            region.cardIds.filter(id => {
                const parentId = cards[id]?.parentId;
                return parentId != null && regionCardSet.has(parentId);
            })
        );
        return region.cardIds.filter(id => !childIds.has(id));
    }, [cards]);

    const [sortedIds, setSortedIds] = useState<Partial<Record<RegionType, string[]>>>(() =>
        Object.fromEntries(regions.map(r => [r.type, getTopLevel(r)]))
    );

    useEffect(() => {
        setSortedIds(Object.fromEntries(regions.map(r => [r.type, getTopLevel(r)])));
    }, [regions, getTopLevel]);

    const cardToRegion = useMemo(() => {
        const map = new Map<string, RegionType>();
        for (const region of Object.values(player.regions)) {
            if (region) {
                for (const id of region.cardIds) map.set(id, region.type);
            }
        }
        return map;
    }, [player.regions]);

    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [activeDragFromRegion, setActiveDragFromRegion] = useState<RegionType | null>(null);
    const [dragOverRegion, setDragOverRegion] = useState<RegionType | null>(null);

    const resetSortedIds = useCallback(() => {
        setSortedIds(Object.fromEntries(regions.map(r => [r.type, getTopLevel(r)])));
    }, [regions, getTopLevel]);

    const handleDragStart = useCallback(({active}: DragStartEvent) => {
        const id = String(active.id);
        setActiveCardId(id);
        setActiveDragFromRegion(cardToRegion.get(id) ?? null);
    }, [cardToRegion]);

    const handleDragOver = useCallback(({active, over}: DragOverEvent) => {
        const activeId = String(active.id);
        const overId = over ? String(over.id) : null;
        const fromRegionType = cardToRegion.get(activeId);
        if (!fromRegionType) return;

        if (!overId) {
            setDragOverRegion(null);
            return;
        }

        const currentOverRegion: RegionType | null = overId.startsWith('region-')
            ? overId.slice('region-'.length) as RegionType
            : cardToRegion.get(overId) ?? null;

        setDragOverRegion(currentOverRegion);

        if (currentOverRegion !== fromRegionType) return;

        setSortedIds(prev => {
            const ids = prev[fromRegionType] ?? [];
            const from = ids.indexOf(activeId);
            const to = ids.indexOf(overId);
            if (from === -1 || to === -1 || from === to) return prev;
            return {...prev, [fromRegionType]: arrayMove(ids, from, to)};
        });
    }, [cardToRegion]);

    const handleDragEnd = useCallback(({active, over}: DragEndEvent) => {
        const activeId = String(active.id);
        const fromRegionType = cardToRegion.get(activeId);
        const currentSortedIds = sortedIds;

        setActiveCardId(null);
        setActiveDragFromRegion(null);
        setDragOverRegion(null);
        resetSortedIds();

        if (!over || !fromRegionType) return;
        const overId = String(over.id);

        const toRegionType: RegionType | null = overId.startsWith('region-')
            ? overId.slice('region-'.length) as RegionType
            : cardToRegion.get(overId) ?? null;

        if (!toRegionType) return;

        if (fromRegionType !== toRegionType) {
            onCardMove?.(player.name, activeId, fromRegionType, toRegionType);
        } else {
            const liveOrder = currentSortedIds[fromRegionType] ?? [];
            const toIndex = liveOrder.indexOf(activeId);
            const fromRegion = player.regions[fromRegionType];
            if (!fromRegion) return;
            const originalOrder = getTopLevel(fromRegion);
            const fromIndex = originalOrder.indexOf(activeId);
            if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
            onCardReorder?.(player.name, fromRegionType, fromIndex, toIndex);
        }
    }, [cardToRegion, sortedIds, resetSortedIds, player, getTopLevel, onCardReorder, onCardMove]);

    const handleDragCancel = useCallback(() => {
        setActiveCardId(null);
        setActiveDragFromRegion(null);
        setDragOverRegion(null);
        resetSortedIds();
    }, [resetSortedIds]);

    const activeCard = activeCardId ? cards[activeCardId] : null;

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
                        cards={cards}
                        sortedIds={sortedIds[region.type] ?? getTopLevel(region)}
                        activeDragFromRegion={activeDragFromRegion}
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
                        {activeCard.name ?? activeCardId}
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}

export function TextBoard({orderedPlayers, cards, currentUser, onCardReorder, onCardMove}: TextBoardProps) {
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
                />
            ))}
        </div>
    );
}
