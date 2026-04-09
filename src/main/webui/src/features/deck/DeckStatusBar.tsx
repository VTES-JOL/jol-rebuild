import { TriangleAlert } from 'lucide-react';
import SummaryStats from '@/shared/components/SummaryStats';
import { computeSummary, getBannedEntries } from './deckUtils';
import type { DeckEntry } from './types';

interface Props {
    entries: DeckEntry[];
}

export default function DeckStatusBar({ entries }: Props) {
    const summary = computeSummary(entries);
    const banned  = getBannedEntries(entries);

    return (
        <div className="px-3 py-1.5 border-b border-line/50 flex items-center justify-between gap-4 min-h-[28px]">
            <div className="flex items-center min-w-0">
                {summary
                    ? <SummaryStats summary={summary} validate />
                    : <span className="text-[10px] text-ink-muted">Empty deck</span>
                }
            </div>
            {banned.length > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-blood/30 bg-blood/10 text-[10px] text-blood-soft shrink-0">
                    <TriangleAlert className="w-3 h-3 shrink-0" />
                    <span>{banned.length} banned</span>
                </div>
            )}
        </div>
    );
}
