import {useCallback, useEffect, useState} from 'react';
import {ChevronDown, ChevronRight, PlusCircle, Users, X} from 'lucide-react';
import Button from '@/shared/components/Button';
import type {SeatingDto, Tournament, UnseatedPlayer} from './types';
import tournamentApi from './api';

interface Props {
    tournament: Tournament;
    onActivated: () => void;
    onChanged: () => void;
}

export default function TournamentSeatingPanel({tournament, onActivated, onChanged}: Props) {
    const [seating, setSeating] = useState<SeatingDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1]));
    const [activating, setActivating] = useState(false);

    const loadSeating = useCallback(async () => {
        try {
            const data = await tournamentApi.getSeating(tournament.id);
            setSeating(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [tournament.id]);

    useEffect(() => {
        loadSeating();
    }, [loadSeating]);

    const toggleRound = (r: number) => {
        setExpandedRounds(prev => {
            const next = new Set(prev);
            next.has(r) ? next.delete(r) : next.add(r);
            return next;
        });
    };

    const handleAddTable = async (roundNumber: number) => {
        setSaving(true);
        setError(null);
        try {
            await tournamentApi.addTable(tournament.id, roundNumber);
            await loadSeating();
        } catch (e: any) {
            setError(e.message ?? 'Failed to add table');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveTable = async (tableId: number) => {
        setSaving(true);
        setError(null);
        try {
            await tournamentApi.removeTable(tournament.id, tableId);
            await loadSeating();
        } catch (e: any) {
            setError(e.message ?? 'Failed to remove table');
        } finally {
            setSaving(false);
        }
    };

    const handleAssignSeat = async (tableId: number, registrationId: number, seatPosition: number) => {
        setSaving(true);
        setError(null);
        try {
            await tournamentApi.addSeat(tournament.id, tableId, registrationId, seatPosition);
            await loadSeating();
        } catch (e: any) {
            setError(e.message ?? 'Failed to assign seat');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveSeat = async (tableId: number, seatId: number) => {
        setSaving(true);
        setError(null);
        try {
            await tournamentApi.removeSeat(tournament.id, tableId, seatId);
            await loadSeating();
        } catch (e: any) {
            setError(e.message ?? 'Failed to remove seat');
        } finally {
            setSaving(false);
        }
    };

    const handleAddBye = async (roundNumber: number, registrationId: number) => {
        setSaving(true);
        setError(null);
        try {
            await tournamentApi.addBye(tournament.id, roundNumber, registrationId);
            await loadSeating();
        } catch (e: any) {
            setError(e.message ?? 'Failed to assign bye');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveBye = async (seatId: number) => {
        setSaving(true);
        setError(null);
        try {
            await tournamentApi.removeSeatOrBye(tournament.id, seatId);
            await loadSeating();
        } catch (e: any) {
            setError(e.message ?? 'Failed to remove bye');
        } finally {
            setSaving(false);
        }
    };

    const handleAddExtraRound = async () => {
        setSaving(true);
        setError(null);
        try {
            await tournamentApi.addExtraRound(tournament.id);
            onChanged();
            await loadSeating();
        } catch (e: any) {
            setError(e.message ?? 'Failed to add extra round');
        } finally {
            setSaving(false);
        }
    };

    const handleActivate = async () => {
        setActivating(true);
        setError(null);
        try {
            await tournamentApi.activate(tournament.id);
            onActivated();
        } catch (e: any) {
            setError(e.message ?? 'Failed to activate tournament');
        } finally {
            setActivating(false);
        }
    };

    if (loading) return <div className="p-4 text-sm text-ink-muted">Loading seating...</div>;
    if (!seating) return null;

    const allSeated = seating.unseated.length === 0;

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-blood/10 border border-blood/30 rounded-lg px-4 py-3 text-sm text-blood">
                    {error}
                </div>
            )}

            {/* Per-round seating */}
            {seating.rounds.map(round => {
                const isExpanded = expandedRounds.has(round.roundNumber);
                const hasUnseated = round.unseated.length > 0;
                return (
                    <div key={round.roundNumber} className="border border-line/30 rounded-xl overflow-hidden">
                        {/* Round header */}
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
                            <div className="p-4 space-y-4">
                                {/* Tables */}
                                {round.tables.map((table, tableIdx) => {
                                    const occupiedPositions = new Set(table.seats.filter(s => !s.bye).map(s => s.seatPosition));
                                    return (
                                        <div key={table.id} className="border border-line/20 rounded-lg overflow-hidden">
                                            <div className="flex items-center justify-between px-3 py-2 bg-hover/10">
                                                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                                                    Table {tableIdx + 1}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveTable(table.id)}
                                                    disabled={saving}
                                                    className="p-1 rounded hover:bg-blood/10 text-ink-muted hover:text-blood transition-colors"
                                                    title="Remove table"
                                                >
                                                    <X className="w-3 h-3"/>
                                                </button>
                                            </div>
                                            <div className="p-3 space-y-1.5">
                                                {[1, 2, 3, 4, 5].map(pos => {
                                                    const seat = table.seats.find(s => s.seatPosition === pos && !s.bye);
                                                    return (
                                                        <div key={pos} className="flex items-center gap-2">
                                                            <span className="text-[10px] text-ink-muted w-4 text-right shrink-0">{pos}</span>
                                                            {seat ? (
                                                                <div className="flex-1 flex items-center justify-between bg-accent/10 border border-accent/20 rounded px-2 py-1">
                                                                    <span className="text-xs text-ink">{seat.username}</span>
                                                                    <button
                                                                        onClick={() => handleRemoveSeat(table.id, seat.id)}
                                                                        disabled={saving}
                                                                        className="p-0.5 rounded hover:bg-blood/10 text-ink-muted hover:text-blood transition-colors"
                                                                    >
                                                                        <X className="w-3 h-3"/>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <UnseatedDropdown
                                                                    unseated={round.unseated}
                                                                    onAssign={regId => handleAssignSeat(table.id, regId, pos)}
                                                                    disabled={saving}
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Add table button */}
                                {round.unseated.length >= 4 && (
                                    <button
                                        onClick={() => handleAddTable(round.roundNumber)}
                                        disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 border border-dashed border-line/50 rounded-lg py-2 text-xs text-ink-muted hover:text-accent hover:border-accent/50 transition-colors"
                                    >
                                        <PlusCircle className="w-3 h-3"/> Add Table
                                    </button>
                                )}

                                {/* Bye section */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Byes This Round</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {round.byes.map(bye => (
                                            <div key={bye.id} className="flex items-center gap-1 bg-hover/30 border border-line/20 rounded px-2 py-1">
                                                <span className="text-xs text-ink-muted">{bye.username}</span>
                                                <button
                                                    onClick={() => handleRemoveBye(bye.id)}
                                                    disabled={saving}
                                                    className="p-0.5 rounded hover:bg-blood/10 text-ink-muted hover:text-blood transition-colors"
                                                >
                                                    <X className="w-3 h-3"/>
                                                </button>
                                            </div>
                                        ))}
                                        {round.unseated.length > 0 && (
                                            <UnseatedByeDropdown
                                                unseated={round.unseated}
                                                onAssign={regId => handleAddBye(round.roundNumber, regId)}
                                                disabled={saving}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Unallocated players */}
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
                        )}
                    </div>
                );
            })}

            {/* Add extra round */}
            {tournament.numberOfRounds < 3 && (
                <button
                    onClick={handleAddExtraRound}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-line/50 rounded-lg py-2 text-xs text-ink-muted hover:text-accent hover:border-accent/50 transition-colors"
                >
                    <PlusCircle className="w-3 h-3"/> Add Extra Round
                </button>
            )}

            {/* Activate button */}
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
                    disabled={!allSeated || activating || saving}
                >
                    <Users className="w-3 h-3 mr-1"/>
                    {activating ? 'Activating…' : 'Activate Tournament'}
                </Button>
            </div>
        </div>
    );
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function UnseatedDropdown({unseated, onAssign, disabled}: {
    unseated: UnseatedPlayer[];
    onAssign: (regId: number) => void;
    disabled: boolean;
}) {
    const [open, setOpen] = useState(false);
    if (unseated.length === 0) {
        return <span className="flex-1 text-xs text-ink-muted italic px-2 py-1">No available players</span>;
    }
    return (
        <div className="relative flex-1">
            <button
                onClick={() => setOpen(o => !o)}
                disabled={disabled}
                className="w-full flex items-center gap-1 border border-dashed border-line/40 rounded px-2 py-1 text-xs text-ink-muted hover:border-accent/50 hover:text-accent transition-colors"
            >
                <PlusCircle className="w-3 h-3"/> Assign player
            </button>
            {open && (
                <div className="absolute z-10 top-full left-0 w-48 mt-1 bg-panel border border-line rounded-lg shadow-lg overflow-hidden">
                    {unseated.map(p => (
                        <button
                            key={p.registrationId}
                            onClick={() => { onAssign(p.registrationId); setOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-hover transition-colors"
                        >
                            {p.username}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function UnseatedByeDropdown({unseated, onAssign, disabled}: {
    unseated: UnseatedPlayer[];
    onAssign: (regId: number) => void;
    disabled: boolean;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                disabled={disabled}
                className="flex items-center gap-1 border border-dashed border-line/40 rounded px-2 py-1 text-xs text-ink-muted hover:border-accent/50 hover:text-accent transition-colors"
            >
                <PlusCircle className="w-3 h-3"/> Assign bye
            </button>
            {open && (
                <div className="absolute z-10 top-full left-0 w-48 mt-1 bg-panel border border-line rounded-lg shadow-lg overflow-hidden">
                    {unseated.map(p => (
                        <button
                            key={p.registrationId}
                            onClick={() => { onAssign(p.registrationId); setOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-hover transition-colors"
                        >
                            {p.username}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
