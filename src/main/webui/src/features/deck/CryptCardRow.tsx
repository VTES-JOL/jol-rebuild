import {TriangleAlert} from 'lucide-react';
import {ClanIcon} from '@/shared/components/ClanIcon';
import {DisciplineIcon} from '@/shared/components/DisciplineIcon';
import CardRowShell from './CardRowShell';
import type {CardDetailData, DeckEntry} from './types';
import {CounterBadge} from "@/shared/components/CounterBadge.tsx";
import {PathIcon} from "@/shared/components/PathIcon.tsx";

interface Props {
    entry: DeckEntry;
    iconData?: CardDetailData;
    onIncrement: () => void;
    onDecrement: () => void;
}

function cryptGroupHint(entry: DeckEntry): string | null {
    const parts: string[] = [];
    if (entry.group && entry.group !== 'ANY') parts.push(`G${entry.group}`);
    if (entry.advanced) parts.push('ADV');
    return parts.length > 0 ? parts.join(' ') : null;
}

export default function CryptCardRow({entry, iconData, onIncrement, onDecrement}: Props) {
    return (
        <CardRowShell entry={entry} onIncrement={onIncrement} onDecrement={onDecrement}>
            <span className="w-4 shrink-0 flex items-center justify-center">
                {iconData?.path && <PathIcon path={iconData.path} size={16}/>}
            </span>

            {/* Fixed-width clan slot keeps names column-aligned across all crypt rows */}
            <span className="w-4 shrink-0 flex items-center justify-center">
                {iconData?.clan && <ClanIcon clan={iconData.clan} size={16}/>}
            </span>

            {/* Name + group/ADV hint + banned marker */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className={`text-xs truncate ${entry.banned ? 'text-blood-soft' : 'text-ink-secondary'}`}>
                    {entry.name}
                </span>
                {cryptGroupHint(entry) && (
                    <span className="text-[9px] text-ink-muted shrink-0 tabular-nums">
                        {cryptGroupHint(entry)}
                    </span>
                )}
                {entry.banned && <TriangleAlert className="w-3 h-3 text-blood-soft shrink-0"/>}
            </div>

            {/* Disciplines in order */}
            {iconData && iconData.disciplines.length > 0 && (
                <div className="flex items-center gap-0.5 shrink-0 ml-1">
                    {iconData.disciplines.map((d, i) => (
                        <DisciplineIcon key={i} discipline={d} size={16}/>
                    ))}
                </div>
            )}

            {iconData && iconData.capacity && (
                <CounterBadge type={"blood"} amount={iconData.capacity} size={20}/>
            )}
        </CardRowShell>
    );
}
