import {useState} from 'react';
import {ChevronDown, ChevronRight} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {SeatingDto, TournamentGame} from './types';

interface Props {
    seating: SeatingDto | 'error' | null;
    games?: TournamentGame[];
}

export default function TournamentSeatingReadOnlyView({seating, games = []}: Props) {
    const gameByTable = new Map(games.map(g => [g.tableId, g]));
    const [expandedRounds, setExpandedRounds] = useState<Set<number>>(() =>
        new Set(seating && seating !== 'error' ? seating.rounds.map(r => r.roundNumber) : [])
    );

    if (!seating) {
        return (
            <div className="h-24 flex items-center justify-center border-2 border-dashed border-line rounded-xl text-ink-muted text-sm italic">
                Loading seating...
            </div>
        );
    }

    if (seating === 'error') {
        return (
            <div className="h-24 flex items-center justify-center border-2 border-dashed border-line rounded-xl text-ink-muted text-sm italic">
                Could not load seating information.
            </div>
        );
    }

    if (seating.rounds.length === 0) {
        return (
            <div className="h-24 flex items-center justify-center border-2 border-dashed border-line rounded-xl text-ink-muted text-sm italic">
                No seating information available.
            </div>
        );
    }

    const toggleRound = (r: number) => {
        setExpandedRounds(prev => {
            const next = new Set(prev);
            next.has(r) ? next.delete(r) : next.add(r);
            return next;
        });
    };

    return (
        <div className="space-y-4">
            {seating.rounds.map(round => {
                const isExpanded = expandedRounds.has(round.roundNumber);
                return (
                    <div key={round.roundNumber} className="border border-line/30 rounded-xl overflow-hidden">
                        <button
                            className="w-full flex items-center justify-between px-4 py-3 bg-hover/20 hover:bg-hover/30 transition-colors"
                            onClick={() => toggleRound(round.roundNumber)}
                        >
                            <div className="flex items-center gap-2">
                                {isExpanded
                                    ? <ChevronDown className="w-4 h-4 text-ink-muted"/>
                                    : <ChevronRight className="w-4 h-4 text-ink-muted"/>}
                                <span className="text-sm font-semibold text-ink">Round {round.roundNumber}</span>
                            </div>
                            <div className="text-[10px] text-ink-muted">
                                {round.tables.length} table{round.tables.length !== 1 ? 's' : ''}
                                {round.byes.length > 0 && ` · ${round.byes.length} bye${round.byes.length !== 1 ? 's' : ''}`}
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="p-4 space-y-3">
                                {round.tables.map((table, tableIdx) => {
                                    const game = gameByTable.get(table.id);
                                    return (
                                    <div key={table.id}>
                                        <div className="mb-1.5 flex items-center gap-2">
                                            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                                                Table {tableIdx + 1}
                                            </span>
                                            {game && (
                                                <Link
                                                    to={`/game/${game.gameId}`}
                                                    className="text-[10px] px-1.5 py-0.5 rounded border border-arcane/40 text-arcane hover:bg-arcane/10 transition-colors leading-none"
                                                >
                                                    Enter Game →
                                                </Link>
                                            )}
                                        </div>
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3, 4, 5].map(pos => {
                                                const seat = table.seats.find(s => s.seatPosition === pos && !s.bye);
                                                return (
                                                    <div key={pos} className="flex-1 min-w-0 flex flex-col gap-0.5">
                                                        <span className="text-[10px] text-ink-muted text-center">{pos}</span>
                                                        {seat ? (
                                                            <div className="bg-accent/10 border border-accent/20 rounded px-1.5 py-1">
                                                                <span className="text-xs text-ink truncate block">{seat.username}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="h-7 rounded border border-dashed border-line/30 bg-hover/10"/>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    );
                                })}

                                {round.byes.length > 0 && (
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Byes</span>
                                        <div className="flex flex-wrap gap-2">
                                            {round.byes.map(bye => (
                                                <div key={bye.id} className="bg-hover/30 border border-line/20 rounded px-2 py-1">
                                                    <span className="text-xs text-ink-muted">{bye.username}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
