import {CheckCircle2, CircleX, Hash} from 'lucide-react';
import type {Tournament} from './types';

interface Props {
    tournament: Tournament;
}

export default function TournamentRulesSettings({tournament}: Props) {
    return (
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
    );
}
