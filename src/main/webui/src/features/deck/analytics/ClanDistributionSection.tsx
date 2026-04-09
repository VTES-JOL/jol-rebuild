import { ClanIcon } from '@/shared/components/ClanIcon';
import { BarRow } from './BarRow';
import { SectionHeader } from './SectionHeader';
import type { CardIconData, DeckEntry } from '../types';

interface Props {
    entries: DeckEntry[];
    iconMap: Map<string, CardIconData>;
}

export function ClanDistributionSection({ entries, iconMap }: Props) {
    const cryptEntries = entries.filter(e => e.isCrypt);
    if (cryptEntries.length === 0) return null;

    const clanCounts = new Map<string, number>();
    for (const entry of cryptEntries) {
        const clan = iconMap.get(entry.cardId)?.clan ?? '—';
        clanCounts.set(clan, (clanCounts.get(clan) ?? 0) + entry.count);
    }

    const rows = [...clanCounts.entries()].sort((a, b) => b[1] - a[1]);
    const max  = rows[0]?.[1] ?? 1;

    return (
        <div className="border-b border-line/50">
            <SectionHeader title="Clan Distribution" />
            <div className="py-1">
                {rows.map(([clan, count]) => (
                    <BarRow
                        key={clan}
                        label={
                            clan === '—'
                                ? <span className="text-ink-muted">No clan</span>
                                : <span className="flex items-center gap-1">
                                    <ClanIcon clan={clan} size={12} />
                                    <span className="truncate">{clan}</span>
                                  </span>
                        }
                        count={count}
                        max={max}
                    />
                ))}
            </div>
        </div>
    );
}
