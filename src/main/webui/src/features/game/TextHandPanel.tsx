import type {DragEndEvent, DragOverEvent} from '@dnd-kit/core';
import {DndContext, DragOverlay, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import {arrayMove, SortableContext, useSortable, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {CardData, RegionState} from './types.ts';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {cardRef, moveCard} from './gameCommands.ts';
import {regionToStacks} from './gameUtils.tsx';
import {TypeIcon} from '@/shared/components/TypeIcon.tsx';

type TextHandPanelProps = {
    playerName: string;
    hand: RegionState;
    cards: Record<string, CardData>;
    gameId?: string;
    onCommand?: (cmd: GameCommand) => void;
    onCardContextMenu?: (card: CardData, ref: CardRef, x: number, y: number) => void;
};

const getOriginalIdx = (id: string) => parseInt(id.slice('hand-'.length), 10);

function HandCardRow({card}: {card: CardData}) {
    const types = card.types ?? (card.type ? [card.type] : []);

    return (
        <div className="py-1.5 flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-xs truncate flex-1 text-ink-secondary leading-snug">
                {card.name ?? 'Unknown'}
            </span>
            {types.filter(Boolean).map(t => (
                <TypeIcon key={t} type={t} size={16} title={t} />
            ))}
        </div>
    );
}

function SortableHandCardRow({id, card, onContextMenu}: {
    id: string;
    card: CardData;
    onContextMenu?: (x: number, y: number) => void;
}) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id});
    return (
        <div
            ref={setNodeRef}
            style={{transform: CSS.Transform.toString(transform), transition}}
            className={[
                'border-b border-line/20 last:border-0 cursor-grab active:cursor-grabbing',
                isDragging && 'opacity-30',
            ].filter(Boolean).join(' ')}
            {...attributes}
            {...listeners}
            onContextMenu={onContextMenu ? e => { e.preventDefault(); onContextMenu(e.clientX, e.clientY); } : undefined}
        >
            <HandCardRow card={card} />
        </div>
    );
}

export function TextHandPanel({playerName, hand, cards, gameId, onCommand, onCardContextMenu}: TextHandPanelProps) {
    const stacks = useMemo(() => regionToStacks(hand, cards), [hand, cards]);
    const count = stacks.length;
    const [collapsed, setCollapsed] = useState(false);
    const [sortedIds, setSortedIds] = useState<string[]>(() => stacks.map((_, i) => `hand-${i}`));
    const [activeId, setActiveId] = useState<string | null>(null);

    const cardIdsKey = hand.cardIds.join(',');
    useEffect(() => {
        setSortedIds(stacks.map((_, i) => `hand-${i}`));
    }, [cardIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

    const handleDragOver = useCallback(({active, over}: DragOverEvent) => {
        if (!over || active.id === over.id) return;
        setSortedIds(prev => {
            const from = prev.indexOf(String(active.id));
            const to = prev.indexOf(String(over.id));
            if (from === -1 || to === -1 || from === to) return prev;
            return arrayMove(prev, from, to);
        });
    }, []);

    const handleDragEnd = useCallback(({active, over}: DragEndEvent) => {
        const draggedId = String(active.id);
        setActiveId(null);

        if (!over) {
            setSortedIds(stacks.map((_, i) => `hand-${i}`));
            return;
        }

        const fromOriginalIdx = getOriginalIdx(draggedId);
        const toPosition = sortedIds.indexOf(draggedId);
        if (fromOriginalIdx === toPosition || toPosition === -1 || !gameId || !onCommand) return;

        onCommand(moveCard(gameId, cardRef(playerName, 'HAND', fromOriginalIdx), playerName, 'HAND', toPosition));
    }, [sortedIds, stacks, gameId, onCommand, playerName]);

    const activeCard = activeId != null ? stacks[getOriginalIdx(activeId)]?.[0] ?? null : null;

    return (
        <div className="w-52 shrink-0 flex flex-col min-h-0 overflow-y-auto rounded-lg border px-2 py-2 bg-arcane/5 border-arcane/40">
            <div className="shrink-0 pb-1.5 border-b border-line/50 mb-0.5">
                <button
                    className="w-full flex items-center gap-1.5 text-left text-[13px] uppercase tracking-wide text-ink-muted/70 font-semibold hover:text-ink-muted transition-colors group"
                    onClick={() => setCollapsed(c => !c)}
                >
                    <span className="text-[11px] leading-none text-ink-muted/40 group-hover:text-ink-muted/70 transition-colors shrink-0">
                        {collapsed ? '▸' : '▾'}
                    </span>
                    <span>Hand ({count})</span>
                </button>
            </div>
            {!collapsed && (
                count === 0 ? (
                    <div className="h-8 flex items-center justify-center text-[11px] text-ink-muted/30 italic select-none">
                        empty
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        onDragStart={({active}) => setActiveId(String(active.id))}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDragCancel={() => {
                            setActiveId(null);
                            setSortedIds(stacks.map((_, i) => `hand-${i}`));
                        }}
                    >
                        <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
                            {sortedIds.map(id => {
                                const stackIdx = getOriginalIdx(id);
                                const card = stacks[stackIdx]?.[0];
                                if (!card) return null;
                                return (
                                    <SortableHandCardRow
                                        key={id}
                                        id={id}
                                        card={card}
                                        onContextMenu={(x, y) => {
                                            if (!onCardContextMenu) return;
                                            const ref = cardRef(playerName, 'HAND', stackIdx);
                                            onCardContextMenu(card, ref, x, y);
                                        }}
                                    />
                                );
                            })}
                        </SortableContext>
                        <DragOverlay dropAnimation={null}>
                            {activeCard && (
                                <div className="bg-panel border border-arcane/40 rounded px-2 py-1 text-xs font-mono text-ink-secondary shadow-lg pointer-events-none whitespace-nowrap">
                                    {activeCard.name ?? 'hidden'}
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>
                )
            )}
        </div>
    );
}
