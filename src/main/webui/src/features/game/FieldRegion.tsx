import type {DragEndEvent, DragOverEvent, DragStartEvent} from '@dnd-kit/core';
import {DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors} from '@dnd-kit/core';
import {arrayMove, rectSortingStrategy, SortableContext, useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {GripHorizontal} from 'lucide-react';
import type {CSSProperties} from 'react';
import {useEffect, useState} from 'react';
import type {CardData} from './CardStack.tsx';
import {CardStack} from './CardStack.tsx';
import {FieldCard} from './FieldCard.tsx';

// ── Compact stack ─────────────────────────────────────────────────────────────

const COMPACT_OFFSET = 4;
const MAX_GHOST_LAYERS = 3;

function CompactCardStack({cards, onClick}: {cards: CardData[]; onClick?: () => void}) {
    if (cards.length === 0) return null;
    const ghostCount = Math.min(cards.length - 1, MAX_GHOST_LAYERS);
    return (
        <div
            className="relative cursor-pointer"
            style={{
                paddingTop: `${ghostCount * COMPACT_OFFSET}px`,
                paddingRight: `${ghostCount * COMPACT_OFFSET}px`,
            }}
            onClick={onClick}
        >
            {Array.from({length: ghostCount}, (_, gi) => (
                <div
                    key={gi}
                    className="absolute bottom-0 aspect-5/7 rounded-lg bg-panel/80 border border-surface/30 shadow-sm"
                    style={{
                        left: 0,
                        right: `${ghostCount * COMPACT_OFFSET}px`,
                        transform: `translate(${(gi + 1) * COMPACT_OFFSET}px, ${-(gi + 1) * COMPACT_OFFSET}px)`,
                        zIndex: ghostCount - gi,
                    }}
                />
            ))}
            <div className="relative" style={{zIndex: ghostCount + 1}}>
                <FieldCard {...cards[0]} />
            </div>
        </div>
    );
}

// ── DnD types ─────────────────────────────────────────────────────────────────

type StackDragData = {type: 'stack'; stackIndex: number};
type CardDragData = {type: 'card'; stackIndex: number; cardIndex: number};
type DragData = StackDragData | CardDragData;
type DropTargetData = StackDragData | {type: 'empty-slot'; index: number};

// ── Draggable card item ────────────────────────────────────────────────────────

const CARD_WIDTH = 96;
const OFFSET_X = Math.round(CARD_WIDTH * 0.09); // 9px
const OFFSET_Y = Math.round(CARD_WIDTH * 0.17); // 16px
const MAX_VISIBLE = 3;

function DraggableCardItem({
    card,
    stackIndex,
    cardIndex,
    activeDragId,
    style,
    onClick,
}: {
    card: CardData;
    stackIndex: number;
    cardIndex: number;
    activeDragId: string | null;
    style: CSSProperties;
    onClick?: () => void;
}) {
    const id = `card-${stackIndex}-${cardIndex}`;
    const {attributes, listeners, setNodeRef} = useDraggable({
        id,
        data: {type: 'card', stackIndex, cardIndex} satisfies CardDragData,
    });
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`cursor-grab active:cursor-grabbing${activeDragId === id ? ' opacity-30' : ''}`}
            {...attributes}
            {...listeners}
            onClick={onClick}
        >
            <FieldCard {...card} />
        </div>
    );
}

// ── Draggable card stack ───────────────────────────────────────────────────────

function DraggableCardStack({
    cards,
    stackIndex,
    onCardClick,
    activeDragId,
}: {
    cards: CardData[];
    stackIndex: number;
    onCardClick?: (cardIndex: number) => void;
    activeDragId: string | null;
}) {
    if (cards.length === 0) return null;
    const n = cards.length;
    const depth = Math.min(n - 1, MAX_VISIBLE);
    return (
        <div
            className="relative"
            style={{paddingTop: `${depth * OFFSET_Y}px`}}
        >
            <DraggableCardItem
                stackIndex={stackIndex}
                cardIndex={0}
                card={cards[0]}
                activeDragId={activeDragId}
                style={{position: 'relative', zIndex: n}}
                onClick={() => onCardClick?.(0)}
            />
            {cards.slice(1).map((card, sliceIndex) => {
                const i = sliceIndex + 1;
                const vi = Math.min(i, MAX_VISIBLE);
                return (
                    <DraggableCardItem
                        key={i}
                        stackIndex={stackIndex}
                        cardIndex={i}
                        card={card}
                        activeDragId={activeDragId}
                        style={{
                            position: 'absolute',
                            top: `${(depth - vi) * OFFSET_Y}px`,
                            left: `${vi * OFFSET_X}px`,
                            right: `${-(vi * OFFSET_X)}px`,
                            zIndex: n - i,
                        }}
                        onClick={() => onCardClick?.(i)}
                    />
                );
            })}
        </div>
    );
}

// ── Sortable stack slot ────────────────────────────────────────────────────────

function SortableStackSlot({
    id,
    stack,
    stackIndex,
    activeDragId,
    activeDragType,
    onCardClick,
}: {
    id: string;
    stack: CardData[];
    stackIndex: number;
    activeDragId: string | null;
    activeDragType: 'stack' | 'card' | null;
    onCardClick?: (cardIndex: number) => void;
}) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging, isOver} = useSortable({
        id,
        data: {type: 'stack', stackIndex} satisfies StackDragData,
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isCardTarget = isOver && activeDragType === 'card';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={[
                'flex flex-col gap-1 rounded-lg',
                isDragging && 'opacity-30',
                isCardTarget && 'ring-2 ring-arcane/50',
            ].filter(Boolean).join(' ')}
        >
            <div
                className="flex justify-center text-ink-muted/40 hover:text-ink-muted/70 transition-colors cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <GripHorizontal size={14} />
            </div>
            <DraggableCardStack
                cards={stack}
                stackIndex={stackIndex}
                onCardClick={onCardClick}
                activeDragId={activeDragId}
            />
        </div>
    );
}

// ── Empty slot ────────────────────────────────────────────────────────────────

function EmptySlot({index}: {index: number}) {
    const {setNodeRef, isOver} = useDroppable({
        id: `empty-${index}`,
        data: {type: 'empty-slot', index},
    });
    return (
        <div
            ref={setNodeRef}
            className={[
                'aspect-5/7 rounded-lg border border-dashed border-surface/30 transition-colors',
                isOver && 'border-arcane/50 bg-arcane/5',
            ].filter(Boolean).join(' ')}
        />
    );
}

// ── FieldRegion ───────────────────────────────────────────────────────────────

type FieldRegionProps = {
    name: string;
    stacks: CardData[][];
    columns: number;
    rows?: number;
    compact?: boolean;
    onCardClick?: (stackIndex: number, cardIndex: number) => void;
    onReorder?: (from: number, to: number) => void;
    onCardMove?: (fromStack: number, fromCard: number, toStack: number) => void;
};

export function FieldRegion({
    name,
    stacks,
    columns,
    rows,
    compact = false,
    onCardClick,
    onReorder,
    onCardMove,
}: FieldRegionProps) {
    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));
    const count = stacks.reduce((sum, s) => sum + s.length, 0);
    const [activeDrag, setActiveDrag] = useState<DragData | null>(null);

    // Stable IDs: "stack-{originalIndex}". Reordered live during drag so DOM
    // positions always match the visual preview — eliminating post-drop animation glitches.
    const [sortedIds, setSortedIds] = useState(() => stacks.map((_, i) => `stack-${i}`));
    useEffect(() => { setSortedIds(stacks.map((_, i) => `stack-${i}`)); }, [stacks]);

    const totalSlots = rows != null
        ? rows * columns
        : Math.ceil(stacks.length / columns) * columns;
    const emptySlotCount = Math.max(0, totalSlots - stacks.length);

    function handleDragStart(event: DragStartEvent) {
        setActiveDrag(event.active.data.current as DragData);
    }

    function handleDragOver(event: DragOverEvent) {
        const {active, over} = event;
        if (!over || active.id === over.id) return;
        const drag = active.data.current as DragData;
        const drop = over.data.current as DropTargetData;
        if (drag.type !== 'stack' || drop.type !== 'stack') return;
        setSortedIds(prev => {
            const from = prev.indexOf(String(active.id));
            const to   = prev.indexOf(String(over.id));
            return from === -1 || to === -1 ? prev : arrayMove(prev, from, to);
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event;
        setActiveDrag(null);
        if (!over) return;

        const drag = active.data.current as DragData;
        const drop = over.data.current as DropTargetData;

        if (drag.type === 'stack') {
            const originalIdx = +String(active.id).slice(6);
            const finalPos    = sortedIds.indexOf(String(active.id));
            if (originalIdx !== finalPos) onReorder?.(originalIdx, finalPos);
        } else if (drag.type === 'card' && drop.type === 'stack') {
            const targetIdx = +String(over.id).slice(6);
            if (drag.stackIndex !== targetIdx) onCardMove?.(drag.stackIndex, drag.cardIndex, targetIdx);
        }
    }

    function handleDragCancel() {
        setActiveDrag(null);
        setSortedIds(stacks.map((_, i) => `stack-${i}`));
    }

    const activeDragType = activeDrag?.type ?? null;
    const activeDragId = activeDrag?.type === 'card'
        ? `card-${activeDrag.stackIndex}-${activeDrag.cardIndex}`
        : null;

    function renderOverlay() {
        if (!activeDrag) return null;
        if (activeDrag.type === 'stack') {
            const stack = stacks[activeDrag.stackIndex];
            return (
                <div className="w-32 opacity-80 pointer-events-none">
                    {compact ? <CompactCardStack cards={stack} /> : <CardStack cards={stack} />}
                </div>
            );
        }
        const card = stacks[activeDrag.stackIndex]?.[activeDrag.cardIndex];
        return card ? (
            <div className="w-24 opacity-80 pointer-events-none">
                <FieldCard {...card} />
            </div>
        ) : null;
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <fieldset className="w-fit rounded-lg border border-surface border-2 px-3 pb-3">
                <legend className="ml-2 flex items-center gap-2 px-1 text-xs text-ink-muted">
                    <span>{name}</span>
                    <span className="font-medium text-ink-secondary">{count}</span>
                </legend>
                {compact ? (
                    <CompactCardStack
                        cards={stacks.flat()}
                        onClick={() => onCardClick?.(0, 0)}
                    />
                ) : (
                    <SortableContext items={sortedIds} strategy={rectSortingStrategy}>
                        <div
                            className="grid gap-x-8 gap-y-10"
                            style={{
                                gridTemplateColumns: `repeat(${columns}, ${CARD_WIDTH}px)`,
                                ...(rows ? {gridTemplateRows: `repeat(${rows}, auto)`} : {}),
                            }}
                        >
                            {sortedIds.map(id => {
                                const originalIdx = +id.slice(6);
                                const stack = stacks[originalIdx];
                                return (
                                    <SortableStackSlot
                                        key={id}
                                        id={id}
                                        stack={stack}
                                        stackIndex={originalIdx}
                                        activeDragId={activeDragId}
                                        activeDragType={activeDragType}
                                        onCardClick={cardIndex => onCardClick?.(originalIdx, cardIndex)}
                                    />
                                );
                            })}
                            {Array.from({length: emptySlotCount}, (_, i) => (
                                <EmptySlot key={`empty-${i}`} index={stacks.length + i} />
                            ))}
                        </div>
                    </SortableContext>
                )}
            </fieldset>
            <DragOverlay dropAnimation={null}>
                {renderOverlay()}
            </DragOverlay>
        </DndContext>
    );
}
