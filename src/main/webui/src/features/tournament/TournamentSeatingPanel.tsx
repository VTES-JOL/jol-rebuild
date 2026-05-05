import {useCallback, useEffect, useState} from 'react';
import {ChevronDown, ChevronRight, GripVertical, PlusCircle, Users, X} from 'lucide-react';
import {DndContext, DragOverlay, useDraggable, useDroppable} from '@dnd-kit/core';
import type {DragEndEvent, Modifier} from '@dnd-kit/core';
import Button from '@/shared/components/Button';
import Spinner from '@/shared/components/Spinner';
import type {Seat, SeatingDto, Tournament, UnseatedPlayer} from './types';
import tournamentApi from './api';
import {useAsyncState} from '@/hooks/useAsyncState';

type DragData =
    | {type: 'UNALLOCATED'; registrationId: string; username: string}
    | {type: 'SEATED'; seatId: string; tableId: string; seatPosition: number; registrationId: string; username: string};

type SeatDropData = {type: 'seat'; tableId: string; position: number; occupiedBy?: {seatId: string; registrationId: string; username: string}};
type ByeDropData = {type: 'bye'};
type DropData = SeatDropData | ByeDropData;

// Positions the DragOverlay so its centre tracks the cursor, regardless of where within
// the element the drag was initiated.
const snapCenterToCursor: Modifier = ({activatorEvent, draggingNodeRect, transform}) => {
    if (!draggingNodeRect || !activatorEvent) return transform;
    const event = activatorEvent as PointerEvent;
    return {
        ...transform,
        x: transform.x + event.clientX - (draggingNodeRect.left + draggingNodeRect.width / 2),
        y: transform.y + event.clientY - (draggingNodeRect.top + draggingNodeRect.height / 2),
    };
};
const DRAG_MODIFIERS = [snapCenterToCursor];

interface Props {
    tournament: Tournament;
    onActivated: () => void;
    onChanged: () => void;
    onSeatingChanged?: () => void;
}

export default function TournamentSeatingPanel({tournament, onActivated, onChanged, onSeatingChanged}: Props) {
    const fetchSeating = useCallback(() => tournamentApi.getSeating(tournament.id), [tournament.id]);
    const {data: seating, loading, error: loadError, refetch: reloadSeating} = useAsyncState<SeatingDto>(fetchSeating);

    const [localSeating, setLocalSeating] = useState<SeatingDto | null>(null);
    const [mutating, setMutating] = useState(false);
    const [mutationError, setMutationError] = useState<string | null>(null);
    const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1]));
    const [activating, setActivating] = useState(false);
    const [activeDrag, setActiveDrag] = useState<DragData | null>(null);

    useEffect(() => {
        if (seating) setLocalSeating(seating);
    }, [seating]);

    const displayError = mutationError ?? loadError;

    const mutate = async (action: () => Promise<unknown>, errorMsg: string) => {
        setMutating(true);
        setMutationError(null);
        try {
            await action();
            reloadSeating();
            onSeatingChanged?.();
        } catch (e: unknown) {
            setMutationError(e instanceof Error ? e.message : errorMsg);
        } finally {
            setMutating(false);
        }
    };

    const handleRemoveSeat = async (tableId: string, seatId: string, roundNumber: number) => {
        if (!localSeating) return;
        const snapshot = localSeating;
        setLocalSeating(applyRemoveSeat(localSeating, roundNumber, tableId, seatId));
        try {
            await tournamentApi.removeSeat(tournament.id, tableId, seatId);
            reloadSeating();
            onSeatingChanged?.();
        } catch (e) {
            setLocalSeating(snapshot);
            setMutationError(e instanceof Error ? e.message : 'Failed to remove seat');
        }
    };

    const handleDragEnd = async (event: DragEndEvent, roundNumber: number) => {
        setActiveDrag(null);
        // Blur before state updates so the browser doesn't scroll to top when the
        // focused draggable element is removed from the DOM by the optimistic update.
        (document.activeElement as HTMLElement)?.blur();
        const {active, over} = event;
        if (!over || !localSeating) return;

        const source = active.data.current as DragData;
        const target = over.data.current as DropData;
        if (!source || !target) return;

        const snapshot = localSeating;
        setMutationError(null);

        try {
            if (source.type === 'UNALLOCATED' && target.type === 'bye') {
                setLocalSeating(applyUnallocatedToBye(localSeating, roundNumber, source));
                await tournamentApi.addBye(tournament.id, roundNumber, source.registrationId);
                reloadSeating();
                onSeatingChanged?.();
            } else if (source.type === 'UNALLOCATED' && target.type === 'seat' && !target.occupiedBy) {
                setLocalSeating(applyUnallocatedToSeat(localSeating, roundNumber, source, target));
                await tournamentApi.addSeat(tournament.id, target.tableId, source.registrationId, target.position, roundNumber);
                reloadSeating();
                onSeatingChanged?.();
            } else if (source.type === 'SEATED' && target.type === 'seat' && source.tableId === target.tableId) {
                if (source.seatPosition === target.position) return;
                if (!target.occupiedBy) {
                    setLocalSeating(applyMoveSeat(localSeating, roundNumber, source, target));
                    await tournamentApi.removeSeat(tournament.id, source.tableId, source.seatId);
                    await tournamentApi.addSeat(tournament.id, target.tableId, source.registrationId, target.position, roundNumber);
                    reloadSeating();
                    onSeatingChanged?.();
                } else {
                    setLocalSeating(applySwapSeats(localSeating, roundNumber, source, target));
                    await tournamentApi.removeSeat(tournament.id, source.tableId, source.seatId);
                    await tournamentApi.removeSeat(tournament.id, target.tableId, target.occupiedBy.seatId);
                    await tournamentApi.addSeat(tournament.id, target.tableId, source.registrationId, target.position, roundNumber);
                    await tournamentApi.addSeat(tournament.id, source.tableId, target.occupiedBy.registrationId, source.seatPosition, roundNumber);
                    reloadSeating();
                    onSeatingChanged?.();
                }
            }
        } catch (e) {
            setLocalSeating(snapshot);
            setMutationError(e instanceof Error ? e.message : 'Failed to update seating');
        }
    };

    const toggleRound = (r: number) => {
        setExpandedRounds(prev => {
            const next = new Set(prev);
            next.has(r) ? next.delete(r) : next.add(r);
            return next;
        });
    };

    const handleActivate = async () => {
        setActivating(true);
        setMutationError(null);
        try {
            await tournamentApi.activate(tournament.id);
            onActivated();
        } catch (e: unknown) {
            setMutationError(e instanceof Error ? e.message : 'Failed to activate tournament');
        } finally {
            setActivating(false);
        }
    };

    if (loading && !localSeating) return <Spinner message="Loading seating..." />;
    if (!localSeating) return null;

    const allSeated = localSeating.rounds.every(r => r.unseated.length === 0);

    return (
        <div className="space-y-6">
            {displayError && (
                <div className="bg-blood/10 border border-blood/30 rounded-lg px-4 py-3 text-sm text-blood">
                    {displayError}
                </div>
            )}

            {localSeating.rounds.map(round => {
                const isExpanded = expandedRounds.has(round.roundNumber);
                const hasUnseated = round.unseated.length > 0;
                return (
                    <div key={round.roundNumber} className="border border-line/30 rounded-xl overflow-hidden">
                        <button
                            className="w-full flex items-center justify-between px-4 py-3 bg-hover/20 hover:bg-hover/30 transition-colors"
                            onClick={() => toggleRound(round.roundNumber)}
                        >
                            <div className="flex items-center gap-2">
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-ink-muted"/> : <ChevronRight className="w-4 h-4 text-ink-muted"/>}
                                <span className="text-sm font-semibold text-ink">Round {round.roundNumber}</span>
                                {hasUnseated && (
                                    <span className="text-[10px] bg-blood/10 text-blood px-2 py-0.5 rounded-full">
                                        {round.unseated.length} unallocated
                                    </span>
                                )}
                            </div>
                            <div className="text-[10px] text-ink-muted">
                                {round.tables.length} table{round.tables.length !== 1 ? 's' : ''}
                                {round.byes.length > 0 && ` · ${round.byes.length} bye${round.byes.length !== 1 ? 's' : ''}`}
                            </div>
                        </button>

                        {isExpanded && (
                            <DndContext
                                modifiers={DRAG_MODIFIERS}
                                accessibility={{restoreFocus: false}}
                                onDragStart={e => setActiveDrag(e.active.data.current as DragData)}
                                onDragEnd={e => handleDragEnd(e, round.roundNumber)}
                                onDragCancel={() => setActiveDrag(null)}
                            >
                                <div className="p-4 space-y-4">
                                    {round.unseated.length > 0 && (
                                        <div className="flex items-start gap-3 flex-wrap">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-1.5 shrink-0">
                                                Drag to assign:
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {round.unseated.map(p => (
                                                    <UnallocatedChip key={p.registrationId} player={p}/>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {round.tables.map((table, tableIdx) => (
                                            <div key={table.id}>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                                                        Table {tableIdx + 1}
                                                    </span>
                                                    <button
                                                        onClick={() => mutate(() => tournamentApi.removeTable(tournament.id, table.id), 'Failed to remove table')}
                                                        disabled={mutating}
                                                        className="p-1 rounded hover:bg-blood/10 text-ink-muted hover:text-blood transition-colors"
                                                        title="Remove table"
                                                    >
                                                        <X className="w-3 h-3"/>
                                                    </button>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3, 4, 5].map(pos => {
                                                        const seat = table.seats.find(s => s.seatPosition === pos && !s.bye);
                                                        return (
                                                            <SeatSlot
                                                                key={pos}
                                                                tableId={table.id}
                                                                position={pos}
                                                                seat={seat}
                                                                onRemove={seatId => handleRemoveSeat(table.id, seatId, round.roundNumber)}
                                                                saving={mutating}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {round.unseated.length >= 4 && (
                                        <button
                                            onClick={() => mutate(() => tournamentApi.addTable(tournament.id), 'Failed to add table')}
                                            disabled={mutating}
                                            className="w-full flex items-center justify-center gap-2 border border-dashed border-line/50 rounded-lg py-2 text-xs text-ink-muted hover:text-accent hover:border-accent/50 transition-colors"
                                        >
                                            <PlusCircle className="w-3 h-3"/> Add Table
                                        </button>
                                    )}

                                    <ByeZone
                                        byes={round.byes}
                                        hasUnseated={round.unseated.length > 0}
                                        onRemoveBye={byeId => mutate(() => tournamentApi.removeSeatOrBye(tournament.id, byeId), 'Failed to remove bye')}
                                        saving={mutating}
                                    />

                                    {round.unseated.length > 0 && (
                                        <div className="bg-blood/5 border border-blood/20 rounded-lg p-3">
                                            <p className="text-[10px] font-bold uppercase text-blood mb-2">Unallocated</p>
                                            <div className="flex flex-wrap gap-1">
                                                {round.unseated.map(p => (
                                                    <span key={p.registrationId} className="text-xs bg-blood/10 text-blood px-2 py-0.5 rounded">
                                                        {p.username}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <DragOverlay>
                                    {activeDrag && (
                                        <div className="flex items-center gap-1.5 bg-panel border border-accent/40 shadow-lg rounded px-2 py-1 text-xs text-ink pointer-events-none">
                                            <GripVertical className="w-3 h-3 text-ink-muted"/>
                                            {activeDrag.username}
                                        </div>
                                    )}
                                </DragOverlay>
                            </DndContext>
                        )}
                    </div>
                );
            })}

            {tournament.originalNumberOfRounds > 0 && tournament.numberOfRounds < tournament.originalNumberOfRounds + 1 && (
                <button
                    onClick={() => mutate(async () => { await tournamentApi.addExtraRound(tournament.id); onChanged(); }, 'Failed to add extra round')}
                    disabled={mutating}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-line/50 rounded-lg py-2 text-xs text-ink-muted hover:text-accent hover:border-accent/50 transition-colors"
                >
                    <PlusCircle className="w-3 h-3"/> Add Extra Round
                </button>
            )}

            <div className="pt-2 border-t border-line/30">
                {!allSeated && (
                    <p className="text-xs text-blood mb-3">
                        All players must be allocated to a seat or bye before activating.
                    </p>
                )}
                <Button
                    variant="accent-ghost"
                    size="sm"
                    onClick={handleActivate}
                    disabled={!allSeated || activating || mutating}
                >
                    <Users className="w-3 h-3 mr-1"/>
                    {activating ? 'Activating…' : 'Activate Tournament'}
                </Button>
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeatSlot({tableId, position, seat, onRemove, saving}: {
    tableId: string;
    position: number;
    seat: Seat | undefined;
    onRemove: (seatId: string) => void;
    saving: boolean;
}) {
    const {setNodeRef, isOver} = useDroppable({
        id: `slot-${tableId}-${position}`,
        data: {
            type: 'seat',
            tableId,
            position,
            occupiedBy: seat ? {seatId: seat.id, registrationId: seat.registrationId, username: seat.username} : undefined,
        } as DropData,
    });

    return (
        <div ref={setNodeRef} className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-[10px] text-ink-muted text-center">{position}</span>
            {seat
                ? <SeatChip seat={seat} tableId={tableId} onRemove={onRemove} saving={saving} isDropTarget={isOver}/>
                : <EmptySeat isOver={isOver}/>
            }
        </div>
    );
}

function SeatChip({seat, tableId, onRemove, saving, isDropTarget}: {
    seat: Seat;
    tableId: string;
    onRemove: (seatId: string) => void;
    saving: boolean;
    isDropTarget: boolean;
}) {
    const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
        id: `seat-${seat.id}`,
        data: {
            type: 'SEATED',
            seatId: seat.id,
            tableId,
            seatPosition: seat.seatPosition,
            registrationId: seat.registrationId,
            username: seat.username,
        } as DragData,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={[
                'flex items-center gap-1 bg-accent/10 border border-accent/20 rounded px-1.5 py-1 cursor-grab select-none transition-colors',
                isDragging ? 'opacity-40' : '',
                isDropTarget ? 'ring-1 ring-accent/60 bg-accent/20' : '',
            ].join(' ')}
        >
            <GripVertical className="w-2.5 h-2.5 text-ink-muted shrink-0"/>
            <span className="text-xs text-ink truncate flex-1 min-w-0">{seat.username}</span>
            <button
                onClick={e => { e.stopPropagation(); onRemove(seat.id); }}
                disabled={saving}
                onPointerDown={e => e.stopPropagation()}
                className="p-0.5 rounded hover:bg-blood/10 text-ink-muted hover:text-blood transition-colors shrink-0"
            >
                <X className="w-2.5 h-2.5"/>
            </button>
        </div>
    );
}

function EmptySeat({isOver}: {isOver: boolean}) {
    return (
        <div className={[
            'h-7 rounded border border-dashed transition-colors',
            isOver ? 'bg-accent/20 border-accent/50' : 'bg-hover/20 border-line/30 animate-pulse',
        ].join(' ')}/>
    );
}

function UnallocatedChip({player}: {player: UnseatedPlayer}) {
    const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
        id: `unallocated-${player.registrationId}`,
        data: {
            type: 'UNALLOCATED',
            registrationId: player.registrationId,
            username: player.username,
        } as DragData,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={[
                'flex items-center gap-1 bg-hover/40 border border-line/30 rounded px-2 py-1 cursor-grab select-none hover:border-accent/40 hover:bg-accent/10 transition-colors',
                isDragging ? 'opacity-40' : '',
            ].join(' ')}
        >
            <GripVertical className="w-3 h-3 text-ink-muted"/>
            <span className="text-xs text-ink">{player.username}</span>
        </div>
    );
}

function ByeZone({byes, hasUnseated, onRemoveBye, saving}: {
    byes: Seat[];
    hasUnseated: boolean;
    onRemoveBye: (byeId: string) => void;
    saving: boolean;
}) {
    const {setNodeRef, isOver} = useDroppable({
        id: 'bye-zone',
        data: {type: 'bye'} as DropData,
    });

    return (
        <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Byes This Round</span>
            <div
                ref={setNodeRef}
                className={[
                    'flex flex-wrap gap-2 min-h-[2.25rem] rounded border border-dashed p-1.5 transition-colors',
                    isOver ? 'border-accent/50 bg-accent/5' : hasUnseated ? 'border-line/40' : 'border-transparent',
                ].join(' ')}
            >
                {byes.map(bye => (
                    <div key={bye.id} className="flex items-center gap-1 bg-hover/30 border border-line/20 rounded px-2 py-1">
                        <span className="text-xs text-ink-muted">{bye.username}</span>
                        <button
                            onClick={() => onRemoveBye(bye.id)}
                            disabled={saving}
                            onPointerDown={e => e.stopPropagation()}
                            className="p-0.5 rounded hover:bg-blood/10 text-ink-muted hover:text-blood transition-colors"
                        >
                            <X className="w-3 h-3"/>
                        </button>
                    </div>
                ))}
                {byes.length === 0 && hasUnseated && (
                    <span className={`text-[10px] self-center italic ${isOver ? 'text-accent' : 'text-ink-muted'}`}>
                        Drop here to assign bye
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Optimistic state updaters ────────────────────────────────────────────────

type UnallocatedDrag = Extract<DragData, {type: 'UNALLOCATED'}>;
type SeatedDrag = Extract<DragData, {type: 'SEATED'}>;

function applyUnallocatedToBye(seating: SeatingDto, roundNumber: number, source: UnallocatedDrag): SeatingDto {
    return {
        ...seating,
        rounds: seating.rounds.map(r => r.roundNumber !== roundNumber ? r : {
            ...r,
            byes: [...r.byes, {
                id: `opt-bye-${Date.now()}`,
                registrationId: source.registrationId,
                username: source.username,
                seatPosition: 0,
                bye: true,
            }],
            unseated: r.unseated.filter(u => u.registrationId !== source.registrationId),
        }),
    };
}

function applyUnallocatedToSeat(seating: SeatingDto, roundNumber: number, source: UnallocatedDrag, target: SeatDropData): SeatingDto {
    return {
        ...seating,
        rounds: seating.rounds.map(r => r.roundNumber !== roundNumber ? r : {
            ...r,
            tables: r.tables.map(t => t.id !== target.tableId ? t : {
                ...t,
                seats: [...t.seats, {
                    id: `opt-${Date.now()}`,
                    registrationId: source.registrationId,
                    username: source.username,
                    seatPosition: target.position,
                    bye: false,
                }],
            }),
            unseated: r.unseated.filter(u => u.registrationId !== source.registrationId),
        }),
    };
}

function applyMoveSeat(seating: SeatingDto, roundNumber: number, source: SeatedDrag, target: SeatDropData): SeatingDto {
    return {
        ...seating,
        rounds: seating.rounds.map(r => r.roundNumber !== roundNumber ? r : {
            ...r,
            tables: r.tables.map(t => t.id !== source.tableId ? t : {
                ...t,
                seats: t.seats.map(s => s.id === source.seatId ? {...s, seatPosition: target.position} : s),
            }),
        }),
    };
}

function applySwapSeats(seating: SeatingDto, roundNumber: number, source: SeatedDrag, target: SeatDropData): SeatingDto {
    return {
        ...seating,
        rounds: seating.rounds.map(r => r.roundNumber !== roundNumber ? r : {
            ...r,
            tables: r.tables.map(t => t.id !== source.tableId ? t : {
                ...t,
                seats: t.seats.map(s => {
                    if (s.id === source.seatId) return {...s, seatPosition: target.position};
                    if (s.id === target.occupiedBy!.seatId) return {...s, seatPosition: source.seatPosition};
                    return s;
                }),
            }),
        }),
    };
}

function applyRemoveSeat(seating: SeatingDto, roundNumber: number, tableId: string, seatId: string): SeatingDto {
    let removedPlayer: UnseatedPlayer | undefined;

    const rounds = seating.rounds.map(r => {
        if (r.roundNumber !== roundNumber) return r;
        const tables = r.tables.map(t => {
            if (t.id !== tableId) return t;
            const removed = t.seats.find(s => s.id === seatId);
            if (removed) removedPlayer = {registrationId: removed.registrationId, username: removed.username};
            return {...t, seats: t.seats.filter(s => s.id !== seatId)};
        });
        return {
            ...r,
            tables,
            unseated: removedPlayer && !r.unseated.find(u => u.registrationId === removedPlayer!.registrationId)
                ? [...r.unseated, removedPlayer]
                : r.unseated,
        };
    });

    return {...seating, rounds};
}
