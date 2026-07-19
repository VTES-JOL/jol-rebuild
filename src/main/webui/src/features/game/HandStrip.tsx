import type {DragEndEvent, DragOverEvent} from '@dnd-kit/core';
import {DndContext, DragOverlay, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import {arrayMove, horizontalListSortingStrategy, SortableContext, useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {CardData, RegionState} from './types.ts';
import type {CardRef, GameCommand} from './gameCommands.ts';
import {cardRef, moveCard} from './gameCommands.ts';
import {regionToStacks} from './gameUtils.tsx';
import {FieldCard} from './FieldCard.tsx';

type HandStripProps = {
    playerName: string;
    hand: RegionState;
    cards: Record<string, CardData>;
    gameId?: string;
    onCommand?: (cmd: GameCommand) => void;
    onCardContextMenu?: (card: CardData, ref: CardRef, x: number, y: number) => void;
    /** 'fanned' overlaps the cards in a shallow arc (the Dock); 'row' is a flat scrollable strip. */
    variant?: 'row' | 'fanned';
};

const getOriginalIdx = (id: string) => parseInt(id.slice('hand-'.length), 10);

/** Shallow physical arc: rotation and drop grow with distance from the hand's center. */
function fanGeometry(position: number, count: number) {
    const offset = position - (count - 1) / 2;
    return {
        rotate: `${Math.max(-10, Math.min(10, offset * 2.5))}deg`,
        drop: Math.abs(offset) * 3,
    };
}

function SortableHandCard({id, card, activeId, playerName, stackIndex, fanned, position, count, onCardContextMenu}: {
    id: string;
    card: CardData;
    activeId: string | null;
    playerName: string;
    stackIndex: number;
    fanned: boolean;
    position: number;
    count: number;
    onCardContextMenu?: HandStripProps['onCardContextMenu'];
}) {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id});
    const ref = cardRef(playerName, 'HAND', stackIndex, -1);
    const interact = (e: {preventDefault(): void; clientX: number; clientY: number}) => {
        e.preventDefault();
        onCardContextMenu?.(card, ref, e.clientX, e.clientY);
    };
    const fan = fanned ? fanGeometry(position, count) : null;
    return (
        <div
            ref={setNodeRef}
            data-flip-id={card.id}
            style={{
                width: 'var(--card-w, 72px)',
                transform: CSS.Transform.toString(transform),
                transition,
                // Tailwind 4's translate utilities use the independent `translate`
                // property, so the hover lift composes with the inline rotate/margins.
                ...(fan && {
                    rotate: fan.rotate,
                    marginTop: fan.drop,
                    marginLeft: position > 0 ? 'calc(var(--card-w, 72px) * -0.3)' : undefined,
                }),
            }}
            className={[
                'shrink-0 cursor-grab active:cursor-grabbing',
                activeId === id && 'opacity-30',
                fanned && 'transition-[translate,rotate] duration-150 motion-reduce:transition-none hover:-translate-y-3 focus-within:-translate-y-3 hover:z-10 focus-within:z-10',
            ].filter(Boolean).join(' ')}
            {...attributes}
            {...listeners}
            onClick={interact}
            onContextMenu={interact}
        >
            <FieldCard {...card} />
        </div>
    );
}

export function HandStrip({playerName, hand, cards, gameId, onCommand, onCardContextMenu, variant = 'row'}: HandStripProps) {
    const stacks = useMemo(() => regionToStacks(hand, cards), [hand, cards]);
    const count = stacks.length;

    const [sortedIds, setSortedIds] = useState<string[]>(() => stacks.map((_, i) => `hand-${i}`));
    const [activeId, setActiveId] = useState<string | null>(null);

    // Sync with server order whenever card IDs change (draw, discard, server reorder)
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

        if (!over || draggedId === String(over.id)) {
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
        <div>
            <div className="text-xs text-ink-muted mb-1.5">
                Hand <span className="font-medium text-ink-secondary">({count})</span>
            </div>
            {count === 0 ? (
                <p className="text-xs text-ink-muted/50 italic">Your hand is empty.</p>
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
                    <SortableContext items={sortedIds} strategy={horizontalListSortingStrategy}>
                        <div className={variant === 'fanned'
                            ? 'flex justify-center overflow-x-auto px-2 pt-3 pb-1'
                            : 'flex gap-2 overflow-x-auto pb-1'}>
                            {sortedIds.map((id, position) => {
                                const stackIdx = getOriginalIdx(id);
                                const card = stacks[stackIdx]?.[0];
                                if (!card) return null;
                                return (
                                    <SortableHandCard
                                        key={id}
                                        id={id}
                                        card={card}
                                        activeId={activeId}
                                        playerName={playerName}
                                        stackIndex={stackIdx}
                                        fanned={variant === 'fanned'}
                                        position={position}
                                        count={sortedIds.length}
                                        onCardContextMenu={onCardContextMenu}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                    <DragOverlay dropAnimation={null}>
                        {activeCard && (
                            <div className="opacity-80" style={{width: 'var(--card-w, 72px)'}}>
                                <FieldCard {...activeCard} suppressTransition />
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            )}
        </div>
    );
}
