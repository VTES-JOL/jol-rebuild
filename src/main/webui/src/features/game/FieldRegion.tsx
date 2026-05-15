import type {DragEndEvent, DragOverEvent, DragStartEvent} from '@dnd-kit/core';
import {DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors} from '@dnd-kit/core';
import {arrayMove, rectSortingStrategy, SortableContext, useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {GripHorizontal} from 'lucide-react';
import type {CSSProperties, ReactNode} from 'react';
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {CardData} from './CardStack.tsx';
import {CARD_WIDTH, CardStack} from './CardStack.tsx';
import {FieldCard} from './FieldCard.tsx';


const GAP_WIDE = 32;
const GAP_NARROW = 4;

// ── Compact stack ─────────────────────────────────────────────────────────────

const COMPACT_OFFSET = 3;
const MAX_GHOST_LAYERS = 3;

function CompactCardStack({cards, onClick, onContextMenu}: {
    cards: CardData[];
    onClick?: () => void;
    onContextMenu?: (x: number, y: number) => void;
}) {
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
            onContextMenu={onContextMenu ? e => { e.preventDefault(); onContextMenu(e.clientX, e.clientY); } : undefined}
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

// regionKey is included so a shared DndContext can identify cross-region events.
type StackDragData = {type: 'stack'; regionKey: string; stackIndex: number};
type CardDragData  = {type: 'card';  regionKey: string; stackIndex: number; cardIndex: number};
export type DragData = StackDragData | CardDragData;
type DropTargetData = StackDragData | {type: 'empty-slot'; regionKey: string; index: number} | {type: 'compact-region'; regionKey: string};

// ── Region-scoped ID helpers ───────────────────────────────────────────────────
// Using "//" as separator — safe because regionKey values are enum names (no slashes).

const rStackId = (rk: string, i: number)              => `${rk}//s//${i}`;
const rEmptyId = (rk: string, i: number)              => `${rk}//e//${i}`;
const rCardId  = (rk: string, si: number, ci: number) => `${rk}//c//${si}//${ci}`;
const rGetIdx  = (id: string)                         => parseInt(id.split('//')[2], 10);

// ── Draggable card item ────────────────────────────────────────────────────────

function DraggableCardItem({
    card,
    regionKey,
    stackIndex,
    cardIndex,
    activeDragId,
    suppressTransition,
    style,
    onClick,
    onContextMenu,
}: {
    card: CardData;
    regionKey: string;
    stackIndex: number;
    cardIndex: number;
    activeDragId: string | null;
    suppressTransition: boolean;
    style: CSSProperties;
    onClick?: () => void;
    onContextMenu?: (x: number, y: number) => void;
}) {
    const id = rCardId(regionKey, stackIndex, cardIndex);
    const {attributes, listeners, setNodeRef} = useDraggable({
        id,
        data: {type: 'card', regionKey, stackIndex, cardIndex} satisfies CardDragData,
    });
    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`cursor-grab active:cursor-grabbing${activeDragId === id ? ' opacity-30' : ''}`}
            {...attributes}
            {...listeners}
            onClick={onClick}
            onContextMenu={onContextMenu ? e => { e.preventDefault(); onContextMenu(e.clientX, e.clientY); } : undefined}
        >
            <FieldCard {...card} suppressTransition={suppressTransition} />
        </div>
    );
}

// ── Draggable card stack ───────────────────────────────────────────────────────

function DraggableCardStack({
    cards,
    regionKey,
    stackIndex,
    onCardClick,
    onCardContextMenu,
    activeDragId,
    suppressTransition,
}: {
    cards: CardData[];
    regionKey: string;
    stackIndex: number;
    onCardClick?: (cardIndex: number) => void;
    onCardContextMenu?: (cardIndex: number, x: number, y: number) => void;
    activeDragId: string | null;
    suppressTransition: boolean;
}) {
    return (
        <CardStack
            cards={cards}
            renderCard={(card, i, style) => (
                <DraggableCardItem
                    card={card}
                    regionKey={regionKey}
                    stackIndex={stackIndex}
                    cardIndex={i}
                    activeDragId={activeDragId}
                    suppressTransition={suppressTransition}
                    style={style}
                    onClick={() => onCardClick?.(i)}
                    onContextMenu={(x, y) => onCardContextMenu?.(i, x, y)}
                />
            )}
        />
    );
}

// ── Sortable stack slot ────────────────────────────────────────────────────────

function SortableStackSlot({
    id,
    regionKey,
    stack,
    stackIndex,
    activeDragId,
    activeDragType,
    suppressTransition,
    onCardClick,
    onCardContextMenu,
}: {
    id: string;
    regionKey: string;
    stack: CardData[];
    stackIndex: number;
    activeDragId: string | null;
    activeDragType: 'stack' | 'card' | null;
    suppressTransition: boolean;
    onCardClick?: (cardIndex: number) => void;
    onCardContextMenu?: (cardIndex: number, x: number, y: number) => void;
}) {
    const {attributes, listeners, setNodeRef, transform, isDragging, isOver} = useSortable({
        id,
        data: {type: 'stack', regionKey, stackIndex} satisfies StackDragData,
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
                regionKey={regionKey}
                stackIndex={stackIndex}
                onCardClick={onCardClick}
                onCardContextMenu={onCardContextMenu}
                activeDragId={activeDragId}
                suppressTransition={suppressTransition}
            />
        </div>
    );
}

// ── Empty slot ────────────────────────────────────────────────────────────────

function EmptySlot({id, activeDragType, regionKey, index}: {
    id: string;
    regionKey: string;
    index: number;
    activeDragType: 'stack' | 'card' | null;
}) {
    const {setNodeRef, isOver} = useDroppable({
        id,
        data: {type: 'empty-slot', regionKey, index},
    });
    const isCardTarget = isOver && activeDragType === 'card';
    return (
        <div className="flex flex-col gap-1">
            <div className="h-3.5" />
            <div
                ref={setNodeRef}
                className={[
                    'aspect-5/7 rounded-lg border border-dashed border-ink-muted/40 transition-colors',
                    isCardTarget && 'border-arcane/50 bg-arcane/5',
                ].filter(Boolean).join(' ')}
            />
        </div>
    );
}

// ── Draggable compact stack ───────────────────────────────────────────────────
// Makes the top card of a compact pile draggable into another region.

function DraggableCompactStack({cards, regionKey, isBeingDragged, onClick, onContextMenu}: {
    cards: CardData[];
    regionKey: string;
    isBeingDragged: boolean;
    onClick?: () => void;
    onContextMenu?: (x: number, y: number) => void;
}) {
    const id = rCardId(regionKey, 0, 0);
    const {attributes, listeners, setNodeRef} = useDraggable({
        id,
        data: {type: 'card', regionKey, stackIndex: 0, cardIndex: 0} satisfies CardDragData,
    });
    return (
        <div
            ref={setNodeRef}
            className={isBeingDragged ? 'opacity-30 cursor-grabbing' : 'cursor-grab'}
            {...attributes}
            {...listeners}
        >
            <CompactCardStack cards={cards} onClick={onClick} onContextMenu={onContextMenu} />
        </div>
    );
}

// ── Droppable compact region ─────────────────────────────────────────────────
// Wraps the compact fieldset so other regions can drop cards onto it.

function DroppableCompactRegion({regionKey, activeDragType, isDragSource, children}: {
    regionKey: string;
    activeDragType: 'stack' | 'card' | null;
    isDragSource: boolean;
    children: ReactNode;
}) {
    const {setNodeRef, isOver} = useDroppable({
        id: `${regionKey}//compact-drop`,
        data: {type: 'compact-region', regionKey} satisfies {type: 'compact-region'; regionKey: string},
    });
    const highlight = isOver && activeDragType === 'card' && !isDragSource;
    return (
        <fieldset
            ref={setNodeRef}
            className={[
                'relative w-fit rounded-lg border px-3 pb-3 transition-colors',
                highlight ? 'border-arcane/60 bg-arcane/5' : 'border-ink-muted/25',
            ].join(' ')}
        >
            {children}
        </fieldset>
    );
}

// ── FieldRegionContent ────────────────────────────────────────────────────────
// Pure renderer — no DndContext. Must be inside an ancestor DndContext.

type FieldRegionContentProps = {
    regionKey: string;
    name: string;
    stacks: CardData[][];
    columns: number;
    minRows?: number;
    compact?: boolean;
    narrowGap?: boolean;
    onCardClick?: (stackIndex: number, cardIndex: number) => void;
    onCardContextMenu?: (stackIndex: number, cardIndex: number, x: number, y: number) => void;
    activeDragId: string | null;
    activeDragType: 'stack' | 'card' | null;
    sortedIds: string[];
    suppressTransition: boolean;
};

function FieldRegionContent({
    regionKey, name, stacks, columns, minRows = 1, compact = false, narrowGap = false,
    onCardClick, onCardContextMenu, activeDragId, activeDragType, sortedIds, suppressTransition,
}: FieldRegionContentProps) {
    const gap = narrowGap ? GAP_NARROW : GAP_WIDE;
    const count = useMemo(() => stacks.reduce((sum, s) => sum + s.length, 0), [stacks]);

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

    const emptySlotCount = useMemo(
        () => Math.max(minRows, Math.ceil(stacks.length / effectiveCols)) * effectiveCols - stacks.length,
        [effectiveCols, stacks.length, minRows],
    );

    const legend = (
        <legend className="ml-2 flex items-center gap-2 px-1 text-xs text-ink-muted">
            <span>{name}</span>
            <span className="font-medium text-ink-secondary">{count}</span>
        </legend>
    );

    if (compact) {
        const topCardId = rCardId(regionKey, 0, 0);
        const isDragSource = activeDragId !== null && activeDragId.startsWith(regionKey + '//');
        return (
            <DroppableCompactRegion regionKey={regionKey} activeDragType={activeDragType} isDragSource={isDragSource}>
                {legend}
                <DraggableCompactStack
                    cards={stacks.flat()}
                    regionKey={regionKey}
                    isBeingDragged={activeDragId === topCardId}
                    onClick={() => onCardClick?.(0, 0)}
                    onContextMenu={(x, y) => onCardContextMenu?.(0, 0, x, y)}
                />
            </DroppableCompactRegion>
        );
    }

    return (
        <fieldset ref={fieldsetRef} className="relative w-fit rounded-lg border border-ink-muted/25 px-3 pb-3">
            {legend}
            <SortableContext items={sortedIds} strategy={rectSortingStrategy}>
                <div
                    className={`grid ${narrowGap ? 'gap-x-1' : 'gap-x-8'} gap-y-2`}
                    style={{gridTemplateColumns: `repeat(${effectiveCols}, var(--card-w, ${CARD_WIDTH}px))`}}
                >
                    {sortedIds.map(id => {
                        const originalIdx = rGetIdx(id);
                        const stack = stacks[originalIdx];
                        if (!stack) return null;
                        return (
                            <SortableStackSlot
                                key={id}
                                id={id}
                                regionKey={regionKey}
                                stack={stack}
                                stackIndex={originalIdx}
                                activeDragId={activeDragId}
                                activeDragType={activeDragType}
                                suppressTransition={suppressTransition}
                                onCardClick={cardIndex => onCardClick?.(originalIdx, cardIndex)}
                                onCardContextMenu={(ci, x, y) => onCardContextMenu?.(originalIdx, ci, x, y)}
                            />
                        );
                    })}
                    {Array.from({length: emptySlotCount}, (_, i) => {
                        const idx = stacks.length + i;
                        const id = rEmptyId(regionKey, idx);
                        return <EmptySlot key={id} id={id} regionKey={regionKey} index={idx} activeDragType={activeDragType} />;
                    })}
                </div>
            </SortableContext>
        </fieldset>
    );
}

// ── FieldRegionProps ──────────────────────────────────────────────────────────

type FieldRegionProps = {
    name: string;
    stacks: CardData[][];
    columns: number;
    minRows?: number;
    compact?: boolean;
    narrowGap?: boolean;
    onCardClick?: (stackIndex: number, cardIndex: number) => void;
    onCardContextMenu?: (stackIndex: number, cardIndex: number, x: number, y: number) => void;
    onReorder?: (from: number, to: number) => void;
    onCardMove?: (fromStack: number, fromCard: number, toStack: number) => void;
    onCardToNewStack?: (fromStack: number, fromCard: number) => void;
};

// ── FieldRegion ───────────────────────────────────────────────────────────────
// Standalone component: manages its own DndContext. Use this for compact/isolated regions.

export function FieldRegion({
    name,
    stacks,
    columns,
    minRows = 1,
    compact = false,
    narrowGap = false,
    onCardClick,
    onCardContextMenu,
    onReorder,
    onCardMove,
    onCardToNewStack,
}: FieldRegionProps) {
    const regionKey = name.replace(/\s+/g, '_').toLowerCase();

    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));
    const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
    const [suppressTransition, setSuppressTransition] = useState(false);

    useEffect(() => {
        if (activeDrag !== null) return;
        if (!suppressTransition) return;
        const id = requestAnimationFrame(() => setSuppressTransition(false));
        return () => cancelAnimationFrame(id);
    }, [activeDrag, suppressTransition]);

    const [sortedIds, setSortedIds] = useState(() => stacks.map((_, i) => rStackId(regionKey, i)));
    useEffect(() => { setSortedIds(stacks.map((_, i) => rStackId(regionKey, i))); }, [stacks, regionKey]);

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
            const originalIdx = rGetIdx(String(active.id));
            const finalPos    = sortedIds.indexOf(String(active.id));
            if (originalIdx !== finalPos) onReorder?.(originalIdx, finalPos);
        } else if (drag.type === 'card') {
            if (drop.type === 'stack') {
                const targetIdx = rGetIdx(String(over.id));
                if (drag.stackIndex !== targetIdx) onCardMove?.(drag.stackIndex, drag.cardIndex, targetIdx);
            } else if (drop.type === 'empty-slot') {
                onCardToNewStack?.(drag.stackIndex, drag.cardIndex);
            }
        }
    }, [sortedIds, onReorder, onCardMove, onCardToNewStack]);

    const handleDragCancel = useCallback(() => {
        setActiveDrag(null);
        setSortedIds(stacks.map((_, i) => rStackId(regionKey, i)));
    }, [stacks, regionKey]);

    const activeDragType = activeDrag?.type ?? null;
    const activeDragId = activeDrag?.type === 'card'
        ? rCardId(regionKey, activeDrag.stackIndex, activeDrag.cardIndex)
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

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <FieldRegionContent
                regionKey={regionKey}
                name={name}
                stacks={stacks}
                columns={columns}
                minRows={minRows}
                compact={compact}
                narrowGap={narrowGap}
                onCardClick={onCardClick}
                onCardContextMenu={onCardContextMenu}
                activeDragId={activeDragId}
                activeDragType={activeDragType}
                sortedIds={sortedIds}
                suppressTransition={suppressTransition}
            />
            <DragOverlay dropAnimation={null}>
                {renderOverlay()}
            </DragOverlay>
        </DndContext>
    );
}

// ── FieldRegionDndGroup ───────────────────────────────────────────────────────
// Wraps multiple regions in ONE DndContext, enabling cross-region DnD.
// Use the `children` render prop to place region content in arbitrary layout positions.

export type FieldRegionConfig = {
    regionKey: string;
    name: string;
    stacks: CardData[][];
    columns: number;
    minRows?: number;
    compact?: boolean;
    narrowGap?: boolean;
    onCardClick?: (stackIndex: number, cardIndex: number) => void;
    onCardContextMenu?: (stackIndex: number, cardIndex: number, x: number, y: number) => void;
    onReorder?: (from: number, to: number) => void;
    onCardMove?: (fromStack: number, fromCard: number, toStack: number) => void;
    onCardToNewStack?: (fromStack: number, fromCard: number) => void;
};

type FieldRegionDndGroupProps = {
    regions: FieldRegionConfig[];
    /** Called when a whole stack is dragged to a different region. */
    onCrossRegionMove?: (fromKey: string, fromStackIdx: number, toKey: string) => void;
    /**
     * Called when a card is dragged to a different region.
     * `toStackIdx` is the target stack index when dropped on an existing stack,
     * `null` when dropped on an empty slot (append), or `'top'` when dropped
     * on a compact region (insert at position 0).
     */
    onCrossCardMove?: (fromKey: string, fromStackIdx: number, fromCardIdx: number, toKey: string, toStackIdx: number | null | 'top') => void;
    /**
     * Render prop — receives a `renderRegion(key)` helper that returns the
     * FieldRegionContent for the given regionKey. Use this to place regions in
     * custom layout positions while keeping them in the same DndContext.
     * When omitted, regions are rendered in a flat sequence.
     */
    children?: (renderRegion: (regionKey: string) => ReactNode) => ReactNode;
};

export function FieldRegionDndGroup({regions, onCrossRegionMove, onCrossCardMove, children}: FieldRegionDndGroupProps) {
    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));
    const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
    const [suppressTransition, setSuppressTransition] = useState(false);

    useEffect(() => {
        if (activeDrag !== null) return;
        if (!suppressTransition) return;
        const id = requestAnimationFrame(() => setSuppressTransition(false));
        return () => cancelAnimationFrame(id);
    }, [activeDrag, suppressTransition]);

    const buildSortedIds = useCallback(
        (rs: FieldRegionConfig[]) =>
            Object.fromEntries(rs.map(r => [r.regionKey, r.stacks.map((_, i) => rStackId(r.regionKey, i))])),
        [],
    );
    const [regionSortedIds, setRegionSortedIds] = useState<Record<string, string[]>>(() => buildSortedIds(regions));

    const resetSortedIds = useCallback(() => {
        setRegionSortedIds(buildSortedIds(regions));
    }, [regions, buildSortedIds]);

    useEffect(() => { resetSortedIds(); }, [resetSortedIds]);

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
        if (drag.regionKey !== drop.regionKey) return;
        setRegionSortedIds(prev => {
            const ids = prev[drag.regionKey] ?? [];
            const from = ids.indexOf(String(active.id));
            const to   = ids.indexOf(String(over.id));
            return from === -1 || to === -1 ? prev : {...prev, [drag.regionKey]: arrayMove(ids, from, to)};
        });
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const {active, over} = event;
        setActiveDrag(null);
        resetSortedIds();
        if (!over) return;

        const drag = active.data.current as DragData;
        const drop = over.data.current as DropTargetData;
        if (!drag || !drop) return;

        const regionCfg = regions.find(r => r.regionKey === drag.regionKey);

        if (drag.type === 'stack') {
            const toKey = drop.type === 'stack' || drop.type === 'empty-slot' ? drop.regionKey : null;
            if (!toKey) return;
            if (drag.regionKey === toKey) {
                const ids = regionSortedIds[drag.regionKey] ?? [];
                const finalPos = ids.indexOf(String(active.id));
                if (finalPos !== -1 && drag.stackIndex !== finalPos) {
                    regionCfg?.onReorder?.(drag.stackIndex, finalPos);
                }
            } else {
                onCrossRegionMove?.(drag.regionKey, drag.stackIndex, toKey);
            }
        } else if (drag.type === 'card') {
            if (drop.type === 'stack') {
                if (drag.regionKey === drop.regionKey) {
                    if (drag.stackIndex !== drop.stackIndex) {
                        regionCfg?.onCardMove?.(drag.stackIndex, drag.cardIndex, drop.stackIndex);
                    }
                } else {
                    onCrossCardMove?.(drag.regionKey, drag.stackIndex, drag.cardIndex, drop.regionKey, drop.stackIndex);
                }
            } else if (drop.type === 'empty-slot') {
                if (drag.regionKey === drop.regionKey) {
                    regionCfg?.onCardToNewStack?.(drag.stackIndex, drag.cardIndex);
                } else {
                    onCrossCardMove?.(drag.regionKey, drag.stackIndex, drag.cardIndex, drop.regionKey, null);
                }
            } else if (drop.type === 'compact-region') {
                if (drag.regionKey !== drop.regionKey) {
                    onCrossCardMove?.(drag.regionKey, drag.stackIndex, drag.cardIndex, drop.regionKey, 'top');
                }
            }
        }
    }, [regions, regionSortedIds, resetSortedIds, onCrossRegionMove, onCrossCardMove]);

    const handleDragCancel = useCallback(() => {
        setActiveDrag(null);
        resetSortedIds();
    }, [resetSortedIds]);

    const activeDragType = activeDrag?.type ?? null;
    const activeDragId = activeDrag?.type === 'card'
        ? rCardId(activeDrag.regionKey, activeDrag.stackIndex, activeDrag.cardIndex)
        : null;

    const renderRegion = useCallback((regionKey: string): ReactNode => {
        const r = regions.find(x => x.regionKey === regionKey);
        if (!r) return null;
        return (
            <FieldRegionContent
                key={r.regionKey}
                regionKey={r.regionKey}
                name={r.name}
                stacks={r.stacks}
                columns={r.columns}
                minRows={r.minRows}
                compact={r.compact}
                narrowGap={r.narrowGap}
                onCardClick={r.onCardClick}
                onCardContextMenu={r.onCardContextMenu}
                activeDragId={activeDragId}
                activeDragType={activeDragType}
                sortedIds={regionSortedIds[r.regionKey] ?? r.stacks.map((_, i) => rStackId(r.regionKey, i))}
                suppressTransition={suppressTransition}
            />
        );
    }, [regions, regionSortedIds, activeDragId, activeDragType, suppressTransition]);

    function renderOverlay() {
        if (!activeDrag) return null;
        const region = regions.find(r => r.regionKey === activeDrag.regionKey);
        if (!region) return null;
        if (activeDrag.type === 'stack') {
            return (
                <div style={{width: `calc(var(--card-w, ${CARD_WIDTH}px) * 1.33)`}} className="opacity-80 pointer-events-none">
                    <CardStack cards={region.stacks[activeDrag.stackIndex]} />
                </div>
            );
        }
        const card = region.stacks[activeDrag.stackIndex]?.[activeDrag.cardIndex];
        return card ? (
            <div style={{width: `var(--card-w, ${CARD_WIDTH}px)`}} className="opacity-80 pointer-events-none">
                <FieldCard {...card} suppressTransition />
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
            {children ? children(renderRegion) : regions.map(r => renderRegion(r.regionKey))}
            <DragOverlay dropAnimation={null}>
                {renderOverlay()}
            </DragOverlay>
        </DndContext>
    );
}
