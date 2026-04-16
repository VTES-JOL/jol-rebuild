import {Calendar, CheckCircle2, CircleX, Hash, Info, Layers} from 'lucide-react';
import Badge from '@/shared/components/Badge';
import type {SeatingDto, Tournament} from './types';
import TournamentRegistrationPanel from './TournamentRegistrationPanel';
import TournamentSeatingPanel from './TournamentSeatingPanel';
import TournamentSeatingReadOnlyView from './TournamentSeatingReadOnlyView';

interface Props {
    tournament: Tournament;
    isTournamentAdmin: boolean;
    seating: SeatingDto | 'error' | null;
    onChanged: () => void;
}

const ACTIVE_STATUSES = new Set(['ACTIVE', 'SEEDING', 'FINALS', 'COMPLETED']);

function formatDate(dateStr?: string) {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleString();
}

export default function TournamentInfoView({tournament, isTournamentAdmin, seating, onChanged}: Props) {
    const renderContextualContent = () => {
        if (tournament.status === 'REGISTRATION') {
            return <TournamentRegistrationPanel tournament={tournament} onChanged={onChanged} />;
        }
        if (tournament.status === 'SEATING' && isTournamentAdmin) {
            return (
                <TournamentSeatingPanel
                    tournament={tournament}
                    onActivated={onChanged}
                    onChanged={onChanged}
                />
            );
        }
        if (ACTIVE_STATUSES.has(tournament.status)) {
            return <TournamentSeatingReadOnlyView seating={seating} />;
        }
        return (
            <div className="h-24 flex items-center justify-center border-2 border-dashed border-line rounded-xl text-ink-muted text-sm italic">
                Player and Table information will appear here once the tournament begins.
            </div>
        );
    };

    return (
        <div className="p-6 space-y-8 overflow-y-auto flex-1 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                        <Info className="w-3 h-3"/> Basic Information
                    </h3>
                    <div className="bg-hover/30 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-ink-muted">Status</span>
                            <Badge variant={tournament.status === 'ACTIVE' ? 'online' : 'accent'}>
                                {tournament.status}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-ink-muted">Format</span>
                            <span className="text-sm text-ink">{tournament.format === 'SINGLE_DECK' ? 'Single Deck' : 'Multi Deck'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-ink-muted">Game Format</span>
                            <span className="text-sm text-ink">{tournament.gameFormat}</span>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                        <Hash className="w-3 h-3"/> Rules & Settings
                    </h3>
                    <div className="bg-hover/30 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-ink-muted">Number of Rounds</span>
                            <span className="text-sm text-ink font-mono">{tournament.numberOfRounds}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-ink-muted">Final Round</span>
                            {tournament.finalRound ? <CheckCircle2 className="w-4 h-4 text-online"/> : <CircleX className="w-4 h-4 text-ink-muted"/>}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-ink-muted">Requires ID</span>
                            {tournament.requiresId ? <CheckCircle2 className="w-4 h-4 text-online"/> : <CircleX className="w-4 h-4 text-ink-muted"/>}
                        </div>
                    </div>
                </section>
            </div>

            <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                    <Calendar className="w-3 h-3"/> Important Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-hover/30 rounded-lg p-4">
                        <p className="text-[10px] uppercase font-bold text-ink-muted mb-2">Registration Period</p>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs"><span className="text-ink-muted">Starts:</span><span className="text-ink">{formatDate(tournament.registrationStart)}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-ink-muted">Ends:</span><span className="text-ink">{formatDate(tournament.registrationEnd)}</span></div>
                        </div>
                    </div>
                    <div className="bg-hover/30 rounded-lg p-4">
                        <p className="text-[10px] uppercase font-bold text-ink-muted mb-2">Playing Period</p>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs"><span className="text-ink-muted">Starts:</span><span className="text-ink">{formatDate(tournament.playingStart)}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-ink-muted">Ends:</span><span className="text-ink">{formatDate(tournament.playingEnd)}</span></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                    <Layers className="w-3 h-3"/> Tournament Rules
                </h3>
                <div className="bg-hover/10 rounded-xl border border-line/30 overflow-hidden divide-y divide-line/20">
                    {tournament.rules && tournament.rules.length > 0 ? (
                        tournament.rules.map((rule, idx) => {
                            const condition = tournament.conditions?.find(c => c.id === rule.conditionId);
                            return (
                                <div key={idx} className="p-3 hover:bg-hover/20 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0"/>
                                        <div className="space-y-1">
                                            <p className="text-sm text-ink leading-tight">{rule.text}</p>
                                            {condition && (
                                                <p className="text-[10px] text-accent-soft font-medium flex items-center gap-1">
                                                    <span className="uppercase tracking-wider">Condition:</span> {condition.text}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-ink-muted italic p-4 text-center">No specific rules defined for this tournament.</p>
                    )}
                </div>
            </section>

            <div className="pt-4 border-t border-line/30">
                {renderContextualContent()}
            </div>
        </div>
    );
}
