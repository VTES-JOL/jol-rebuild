import {Calendar} from 'lucide-react';
import type {Tournament} from './types';

interface Props {
    tournament: Tournament;
}

function formatDate(dateStr?: string) {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleString();
}

export default function TournamentDates({tournament}: Props) {
    return (
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
    );
}
