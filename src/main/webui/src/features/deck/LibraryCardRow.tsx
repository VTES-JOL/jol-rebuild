import { Fragment } from 'react';
import { TriangleAlert } from 'lucide-react';
import { ClanIcon } from '@/shared/components/ClanIcon';
import { CostIcon } from '@/shared/components/CostIcon';
import { DisciplineIcon } from '@/shared/components/DisciplineIcon';
import CardRowShell from './CardRowShell';
import type { CardIconData, DeckEntry } from './types';

interface Props {
    entry: DeckEntry;
    iconData?: CardIconData;
    onIncrement: () => void;
    onDecrement: () => void;
}

const SEP = 'text-[9px] text-ink-muted leading-none select-none';

export default function LibraryCardRow({ entry, iconData, onIncrement, onDecrement }: Props) {
    const orDiscs  = iconData?.orDisciplines   ?? [];
    const andDiscs = iconData?.andDisciplines  ?? [];
    const reqClans = iconData?.requirementClans ?? [];
    const hasRightIcons = reqClans.length > 0 || orDiscs.length > 0 || andDiscs.length > 0;

    return (
        <CardRowShell entry={entry} onIncrement={onIncrement} onDecrement={onDecrement}>
            {/* Name + banned marker + costs */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className={`text-xs truncate ${entry.banned ? 'text-blood-soft' : 'text-ink-secondary'}`}>
                    {entry.name}
                </span>
                {entry.banned && <TriangleAlert className="w-3 h-3 text-blood-soft shrink-0" />}
                {iconData?.poolCost  != null && (
                    <CostIcon type="pool"  amount={iconData.poolCost  === -1 ? 'x' : iconData.poolCost}  size={20} />
                )}
                {iconData?.bloodCost != null && (
                    <CostIcon type="blood" amount={iconData.bloodCost === -1 ? 'x' : iconData.bloodCost} size={20} />
                )}
            </div>

            {/* Requirement clans, or-disciplines, and-disciplines */}
            {hasRightIcons && (
                <div className="flex items-center gap-0.5 shrink-0 ml-1">
                    {reqClans.map((c, i) => (
                        <ClanIcon key={i} clan={c} size={16} />
                    ))}

                    {orDiscs.map((d, i) => (
                        <Fragment key={i}>
                            {i > 0 && <span className={SEP}>/</span>}
                            <DisciplineIcon discipline={d} size={16} />
                        </Fragment>
                    ))}

                    {andDiscs.map((d, i) => (
                        <Fragment key={i}>
                            {i > 0 && <span className={SEP}>&amp;</span>}
                            <DisciplineIcon discipline={d} size={16} />
                        </Fragment>
                    ))}
                </div>
            )}
        </CardRowShell>
    );
}
