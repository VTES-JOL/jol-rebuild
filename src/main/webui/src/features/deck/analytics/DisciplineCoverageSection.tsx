import { DisciplineIcon } from '@/shared/components/DisciplineIcon';
import { BarRow } from './BarRow';
import { SectionHeader } from './SectionHeader';
import type { CardDetailData, DeckEntry } from '../types';

interface Props {
    entries: DeckEntry[];
    detailMap: Map<string, CardDetailData>;
}

/**
 * Shows how many crypt cards provide each discipline (weighted by count),
 * cross-referenced with how many library cards need it.
 * Disciplines are normalised to their canonical code: lowercase for
 * inferior, uppercase for superior — but we group inf+sup together
 * so "dom" and "DOM" both increment the same key.
 */
export function DisciplineCoverageSection({ entries, detailMap }: Props) {
    const cryptEntries = entries.filter(e => e.isCrypt);
    const libEntries   = entries.filter(e => !e.isCrypt);

    if (cryptEntries.length === 0) return null;

    // Crypt: how many cards (×count) carry each discipline (case-normalised to uppercase for grouping).
    const cryptDiscs = new Map<string, number>();
    for (const entry of cryptEntries) {
        const discs = detailMap.get(entry.cardId)?.disciplines ?? [];
        for (const d of discs) {
            const key = d.toUpperCase();
            cryptDiscs.set(key, (cryptDiscs.get(key) ?? 0) + entry.count);
        }
    }

    // Library: how many cards require each discipline.
    const libDiscs = new Map<string, number>();
    for (const entry of libEntries) {
        const icon = detailMap.get(entry.cardId);
        if (!icon) continue;
        for (const d of [...icon.orDisciplines, ...icon.andDisciplines]) {
            const key = d.toUpperCase();
            libDiscs.set(key, (libDiscs.get(key) ?? 0) + entry.count);
        }
    }

    if (cryptDiscs.size === 0 || libDiscs.size === 0) return null;

    // Only show disciplines the library actually requires, sorted by crypt frequency.
    const rows = [...cryptDiscs.entries()]
        .filter(([disc]) => libDiscs.has(disc))
        .sort((a, b) => b[1] - a[1]);

    if (rows.length === 0) return null;

    const cryptMax = rows[0][1];

    return (
        <div className="border-b border-line/50">
            <SectionHeader
                title="Discipline Coverage"
                subtitle="Crypt cards · library cards needed in ( )"
            />
            <div className="py-1">
                {rows.map(([disc, cryptCount]) => {
                    const libCount = libDiscs.get(disc) ?? 0;
                    // Display code: use the actual crypt discipline string (could be sup or inf).
                    // We stored uppercase keys, but display with SUP style (uppercase = superior).
                    const label = (
                        <span className="flex items-center gap-1">
                            <DisciplineIcon discipline={disc} size={12} />
                            <span>{disc}</span>
                            {libCount > 0 && (
                                <span className="text-ink-muted">({libCount})</span>
                            )}
                        </span>
                    );
                    return (
                        <BarRow key={disc} label={label} count={cryptCount} max={cryptMax} />
                    );
                })}
            </div>
        </div>
    );
}
