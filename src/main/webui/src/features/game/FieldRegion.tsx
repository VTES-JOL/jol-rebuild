import type {DragEndEvent, DragOverEvent, DragStartEvent} from '@dnd-kit/core';
import {DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors} from '@dnd-kit/core';
import {arrayMove, rectSortingStrategy, SortableContext, useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {GripHorizontal} from 'lucide-react';
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {CARD_WIDTH, CardStack} from './CardStack.tsx';
import type {CardData} from './CardStack.tsx';
import {FieldCard} from './FieldCard.tsx';


const GAP_WIDE = 32; // matches gap-x-8
const GAP_NARROW = 4;  // matches gap-x-1

// ── Compact stack ─────────────────────────────────────────────────────────────

const COMPACT_OFFSET = 3;
const MAX_GHOST_LAYERS = 3;

function CompactCardStack({cards, onClick}: {cards: CardData[]; onClick?: () => void}) {
    if (cards.length === 0) return null;
    const ghostCount = Math.min(cards.length - 1, MAX_GHOST_LAYERS);
    const offset = ghostCount * COMPACT_OFFSET;
    return (
        <div
            className="relative cursor-pointer"
            style={{
                width: `calc(var(--card-w, ${CARD_WIDTH}px) + ${offset}px)`,
                paddingTop: `${offset}px`,
                paddingRight: `${offset}px`,
            }}
            onClick={onClick}
        >
            {Array.from({length: ghostCount}, (_, gi) => (
                <div
                    key={gi}
                    className="absolute bottom-0 aspect-5/7 rounded-lg bg-panel border border-ink-muted/30 shadow-md"
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

// ── ID helpers ────────────────────────────────────────────────────────────────

const stackId = (index: number) => `stack-${index}`;
const idToIndex = (id: string) => parseInt(id.slice(6), 10);

// ── Draggable card item ────────────────────────────────────────────────────────

function DraggableCardItem({
    card,
    stackIndex,
    cardIndex,
    activeDragId,
    suppressTransition,
    style,
    onClick,
}: {
    card: CardData;
    stackIndex: number;
    cardIndex: number;
    activeDragId: string | null;
    suppressTransition: boolean;
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
            <FieldCard {...card} suppressTransition={suppressTransition} />
        </div>
    );
}

// ── Draggable card stack ───────────────────────────────────────────────────────

function DraggableCardStack({
    cards,
    stackIndex,
    onCardClick,
    activeDragId,
    suppressTransition,
}: {
    cards: CardData[];
    stackIndex: number;
    onCardClick?: (cardIndex: number) => void;
    activeDragId: string | null;
    suppressTransition: boolean;
}) {
    return (
        <CardStack
            cards={cards}
            renderCard={(card, i, style) => (
                <DraggableCardItem
                    card={card}
                    stackIndex={stackIndex}
                    cardIndex={i}
                    activeDragId={activeDragId}
                    suppressTransition={suppressTransition}
                    style={style}
                    onClick={() => onCardClick?.(i)}
                />
            )}
        />
    );
}

// ── Sortable stack slot ────────────────────────────────────────────────────────

function SortableStackSlot({
    id,
    stack,
    stackIndex,
    activeDragId,
    activeDragType,
    suppressTransition,
    onCardClick,
}: {
    id: string;
    stack: CardData[];
    stackIndex: number;
    activeDragId: string | null;
    activeDragType: 'stack' | 'card' | null;
    suppressTransition: boolean;
    onCardClick?: (cardIndex: number) => void;
}) {
    const {attributes, listeners, setNodeRef, transform, isDragging, isOver} = useSortable({
        id,
        data: {type: 'stack', stackIndex} satisfies StackDragData,
    });

    const style: CSSProperties = {transform: CSS.Transform.toString(transform)};
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
                suppressTransition={suppressTransition}
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
        <div className="flex flex-col gap-1">
            <div className="h-3.5" />
            <div
                ref={setNodeRef}
                className={[
                    'aspect-5/7 rounded-lg border border-dashed border-ink-muted/40 transition-colors',
                    isOver && 'border-arcane/50 bg-arcane/5',
                ].filter(Boolean).join(' ')}
            />
        </div>
    );
}

// ── FieldRegion ───────────────────────────────────────────────────────────────

type FieldRegionProps = {
    name: string;
    stacks: CardData[][];
    columns: number;
    compact?: boolean;
    narrowGap?: boolean;
    onCardClick?: (stackIndex: number, cardIndex: number) => void;
    onReorder?: (from: number, to: number) => void;
    onCardMove?: (fromStack: number, fromCard: number, toStack: number) => void;
};

export function FieldRegion({
    name,
    stacks,
    columns,
    compact = false,
    narrowGap = false,
    onCardClick,
    onReorder,
    onCardMove,
}: FieldRegionProps) {
    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));
    const count = useMemo(() => stacks.reduce((sum, s) => sum + s.length, 0), [stacks]);
    const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
    const [suppressTransition, setSuppressTransition] = useState(false);
    const gap = narrowGap ? GAP_NARROW : GAP_WIDE;

    // Measure the parent container to compute how many columns actually fit.
    // `columns` acts as the maximum; fewer are used when space is constrained.
    const fieldsetRef = useRef<HTMLFieldSetElement>(null);
    const [effectiveCols, setEffectiveCols] = useState(columns);
    useLayoutEffect(() => {
        const fieldset = fieldsetRef.current;
        const parent = fieldset?.parentElement;
        if (!fieldset || !parent) return;
        const measure = (parentWidth: number) => {
            const raw = getComputedStyle(fieldset).getPropertyValue('--card-w').trim();
            let cardW = parseFloat(raw);
            if (isNaN(cardW)) {
                // --card-w contains a complex expression (e.g. clamp()); resolve it via a temp element.
                const el = document.createElement('div');
                el.style.cssText = `position:absolute;visibility:hidden;width:var(--card-w,${CARD_WIDTH}px)`;
                fieldset.appendChild(el);
                cardW = el.getBoundingClientRect().width || CARD_WIDTH;
                fieldset.removeChild(el);
            }
            const fit = Math.max(1, Math.floor((parentWidth + gap) / (cardW + gap)));
            setEffectiveCols(Math.min(columns, fit));
        };
        const ro = new ResizeObserver(([entry]) => measure(entry.contentRect.width));
        ro.observe(parent);
        measure(parent.getBoundingClientRect().width);
        return () => ro.disconnect();
    }, [columns, gap]);

    // Keep suppressTransition true for one rAF after drag ends so cards render
    // in their final positions before transitions are re-enabled.
    useEffect(() => {
        if (activeDrag !== null) return;
        if (!suppressTransition) return;
        const id = requestAnimationFrame(() => setSuppressTransition(false));
        return () => cancelAnimationFrame(id);
    }, [activeDrag, suppressTransition]);

    // Stable IDs: "stack-{originalIndex}". Reordered live during drag so DOM
    // positions always match the visual preview — eliminating post-drop animation glitches.
    const [sortedIds, setSortedIds] = useState(() => stacks.map((_, i) => stackId(i)));
    useEffect(() => { setSortedIds(stacks.map((_, i) => stackId(i))); }, [stacks]);

    const emptySlotCount = useMemo(
        () => Math.max(1, Math.ceil(stacks.length / effectiveCols)) * effectiveCols - stacks.length,
        [effectiveCols, stacks.length],
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveDrag(event.active.data.current as DragData);
        setSuppressTransition(true);
    }, []);

    const handleDragOver = useCallback((event: DragOverEvent) => {
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
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const {active, over} = event;
        setActiveDrag(null);
        if (!over) return;
        const drag = active.data.current as DragData;
        const drop = over.data.current as DropTargetData;
        if (drag.type === 'stack') {
            const originalIdx = idToIndex(String(active.id));
            const finalPos    = sortedIds.indexOf(String(active.id));
            if (originalIdx !== finalPos) onReorder?.(originalIdx, finalPos);
        } else if (drag.type === 'card' && drop.type === 'stack') {
            const targetIdx = idToIndex(String(over.id));
            if (drag.stackIndex !== targetIdx) onCardMove?.(drag.stackIndex, drag.cardIndex, targetIdx);
        }
    }, [sortedIds, onReorder, onCardMove]);

    const handleDragCancel = useCallback(() => {
        setActiveDrag(null);
        setSortedIds(stacks.map((_, i) => stackId(i)));
    }, [stacks]);

    const activeDragType = activeDrag?.type ?? null;
    const activeDragId = activeDrag?.type === 'card'
        ? `card-${activeDrag.stackIndex}-${activeDrag.cardIndex}`
        : null;

    function renderOverlay() {
        if (!activeDrag) return null;
        if (activeDrag.type === 'stack') {
            return (
                <div style={{width: `calc(var(--card-w, ${CARD_WIDTH}px) * 1.33)`}} className="opacity-80 pointer-events-none">
                    <CardStack cards={stacks[activeDrag.stackIndex]} />
                </div>
            );
        }
        const card = stacks[activeDrag.stackIndex]?.[activeDrag.cardIndex];
        return card ? (
            <div style={{width: `var(--card-w, ${CARD_WIDTH}px)`}} className="opacity-80 pointer-events-none">
                <FieldCard {...card} suppressTransition />
            </div>
        ) : null;
    }

    const legend = (
        <legend className="ml-2 flex items-center gap-2 px-1 text-xs text-ink-muted">
            <span>{name}</span>
            <span className="font-medium text-ink-secondary">{count}</span>
        </legend>
    );

    if (compact) {
        return (
            <fieldset className="relative w-fit rounded-lg border border-ink-muted/25 px-3 pb-3">
                {legend}
                <CompactCardStack cards={stacks.flat()} onClick={() => onCardClick?.(0, 0)} />
            </fieldset>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <fieldset ref={fieldsetRef} className="relative w-fit rounded-lg border border-ink-muted/25 px-3 pb-3">
                {legend}
                <SortableContext items={sortedIds} strategy={rectSortingStrategy}>
                    <div
                        className={`grid ${narrowGap ? 'gap-x-1' : 'gap-x-8'} gap-y-2`}
                        style={{gridTemplateColumns: `repeat(${effectiveCols}, var(--card-w, ${CARD_WIDTH}px))`}}
                    >
                        {sortedIds.map(id => {
                            const originalIdx = idToIndex(id);
                            const stack = stacks[originalIdx];
                            return (
                                <SortableStackSlot
                                    key={id}
                                    id={id}
                                    stack={stack}
                                    stackIndex={originalIdx}
                                    activeDragId={activeDragId}
                                    activeDragType={activeDragType}
                                    suppressTransition={suppressTransition}
                                    onCardClick={cardIndex => onCardClick?.(originalIdx, cardIndex)}
                                />
                            );
                        })}
                        {Array.from({length: emptySlotCount}, (_, i) => (
                            <EmptySlot key={`empty-${i}`} index={stacks.length + i} />
                        ))}
                    </div>
                </SortableContext>
            </fieldset>
            <DragOverlay dropAnimation={null}>
                {renderOverlay()}
            </DragOverlay>
        </DndContext>
    );
}
