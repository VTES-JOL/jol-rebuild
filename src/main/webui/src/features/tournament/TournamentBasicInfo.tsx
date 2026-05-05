import {Info} from 'lucide-react';
import Badge from '@/shared/components/Badge';
import type {Tournament} from './types';

interface Props {
    tournament: Tournament;
}

export default function TournamentBasicInfo({tournament}: Props) {
    return (
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
    );
}
