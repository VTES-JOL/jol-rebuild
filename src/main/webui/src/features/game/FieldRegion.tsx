import type {DragEndEvent} from '@dnd-kit/core';
import {DndContext, DragOverlay, useDraggable, useDroppable} from '@dnd-kit/core';
import {useState} from 'react';
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

type DragData = {type: 'stack'; index: number};
type DropData = {type: 'slot'; index: number};

// ── Stack slot ────────────────────────────────────────────────────────────────

function StackSlot({
    stack,
    index,
    isDragging,
    onCardClick,
}: {
    stack: CardData[];
    index: number;
    isDragging: boolean;
    onCardClick?: (cardIndex: number) => void;
}) {
    const {attributes, listeners, setNodeRef: setDragRef} = useDraggable({
        id: `stack-${index}`,
        data: {type: 'stack', index} satisfies DragData,
    });
    const {setNodeRef: setDropRef, isOver} = useDroppable({
        id: `slot-${index}`,
        data: {type: 'slot', index} satisfies DropData,
    });

    const setRef = (node: HTMLDivElement | null) => {
        setDragRef(node);
        setDropRef(node);
    };

    return (
        <div
            ref={setRef}
            className={[
                'rounded-lg transition-opacity',
                isDragging ? 'opacity-40' : '',
                isOver ? 'ring-2 ring-arcane/50' : '',
            ].join(' ')}
            {...attributes}
            {...listeners}
        >
            <CardStack cards={stack} onCardClick={onCardClick}/>
        </div>
    );
}

// ── Empty slot ────────────────────────────────────────────────────────────────

function EmptySlot({index}: {index: number}) {
    const {setNodeRef, isOver} = useDroppable({
        id: `slot-${index}`,
        data: {type: 'slot', index} satisfies DropData,
    });
    return (
        <div
            ref={setNodeRef}
            className={[
                'aspect-5/7 rounded-lg border border-dashed border-surface/30 transition-colors',
                isOver ? 'border-arcane/50 bg-arcane/5' : '',
            ].join(' ')}
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
};

export function FieldRegion({
    name,
    stacks,
    columns,
    rows,
    compact = false,
    onCardClick,
    onReorder,
}: FieldRegionProps) {
    const count = stacks.reduce((sum, s) => sum + s.length, 0);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const totalSlots = rows != null
        ? rows * columns
        : Math.ceil(stacks.length / columns) * columns;
    const emptySlotCount = Math.max(0, totalSlots - stacks.length);

    function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event;
        setActiveIndex(null);
        if (!over) return;
        const from = (active.data.current as DragData).index;
        const to = (over.data.current as DropData).index;
        if (from !== to) onReorder?.(from, to);
    }

    const activeStack = activeIndex != null ? stacks[activeIndex] : null;

    return (
        <DndContext
            onDragStart={e => setActiveIndex((e.active.data.current as DragData).index)}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveIndex(null)}
        >
            <fieldset className="rounded-lg border border-surface/40 px-3 pb-3">
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
                    <div
                        className="grid gap-x-4 gap-y-10"
                        style={{
                            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                            ...(rows ? {gridTemplateRows: `repeat(${rows}, auto)`} : {}),
                        }}
                    >
                        {stacks.map((stack, i) => (
                            <StackSlot
                                key={i}
                                stack={stack}
                                index={i}
                                isDragging={activeIndex === i}
                                onCardClick={cardIndex => onCardClick?.(i, cardIndex)}
                            />
                        ))}
                        {Array.from({length: emptySlotCount}, (_, i) => (
                            <EmptySlot key={`empty-${i}`} index={stacks.length + i}/>
                        ))}
                    </div>
                )}
            </fieldset>
            <DragOverlay>
                {activeStack != null && (
                    <div className="w-32 opacity-70 pointer-events-none">
                        {compact
                            ? <CompactCardStack cards={activeStack}/>
                            : <CardStack cards={activeStack}/>
                        }
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
