import { Fragment } from 'react';
import { Minus, Plus, TriangleAlert } from 'lucide-react';
import { useCardPreview } from '@/hooks/useCardPreview.tsx';
import { ClanIcon } from '@/shared/components/ClanIcon';
import { CostIcon } from '@/shared/components/CostIcon';
import { DisciplineIcon } from '@/shared/components/DisciplineIcon';
import type { CardIconData, DeckEntry } from './types';

interface Props {
    entry: DeckEntry;
    iconData?: CardIconData;
    onIncrement: () => void;
    onDecrement: () => void;
}

const SEP_CLASS = 'text-[9px] text-ink-muted leading-none select-none';

export default function DeckCardRow({ entry, iconData, onIncrement, onDecrement }: Props) {
    const willRemove = entry.count === 1;
    const { anchorRef, onMouseEnter, onMouseLeave, tooltip } = useCardPreview<HTMLDivElement>(entry.cardId);

    const isCrypt    = iconData?.crypt ?? false;
    const orDiscs    = isCrypt ? [] : (iconData?.orDisciplines  ?? []);
    const andDiscs   = isCrypt ? [] : (iconData?.andDisciplines ?? []);
    const reqClans   = isCrypt ? [] : (iconData?.requirementClans ?? []);

    return (
        <div
            ref={anchorRef}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="flex items-center px-4 py-1.5 gap-1.5 hover:bg-hover/50 transition-colors"
        >
            {/* Crypt: fixed-width clan slot so names stay column-aligned */}
            {entry.isCrypt && (
                <span className="w-4 shrink-0 flex items-center justify-center">
                    {iconData?.clan && <ClanIcon clan={iconData.clan} size={16} />}
                </span>
            )}

            {/* Name + banned marker + cost (library only) */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
                <span className={`text-xs truncate ${entry.banned ? 'text-blood-soft' : 'text-ink-secondary'}`}>
                    {entry.name}
                </span>
                {entry.banned && <TriangleAlert className="w-3 h-3 text-blood-soft shrink-0" />}
                {iconData && !iconData.crypt && iconData.poolCost != null && (
                    <CostIcon type="pool" amount={iconData.poolCost === -1 ? 'x' : iconData.poolCost} size={20} />
                )}
                {iconData && !iconData.crypt && iconData.bloodCost != null && (
                    <CostIcon type="blood" amount={iconData.bloodCost === -1 ? 'x' : iconData.bloodCost} size={20} />
                )}
            </div>

            {/* Right-side icons — pushed right by flex-1 on the name section */}
            {iconData && (
                <div className="flex items-center gap-0.5 shrink-0 ml-1">

                    {/* Crypt: disciplines in order */}
                    {isCrypt && iconData.disciplines.map((d, i) => (
                        <DisciplineIcon key={i} discipline={d} size={16} />
                    ))}

                    {/* Library: clan requirements */}
                    {!isCrypt && reqClans.map((c, i) => (
                        <ClanIcon key={i} clan={c} size={16} />
                    ))}

                    {/* Library: or-disciplines separated by / */}
                    {!isCrypt && orDiscs.length > 0 && orDiscs.map((d, i) => (
                        <Fragment key={i}>
                            {i > 0 && <span className={SEP_CLASS}>/</span>}
                            <DisciplineIcon discipline={d} size={16} />
                        </Fragment>
                    ))}

                    {/* Library: and-disciplines separated by & */}
                    {!isCrypt && andDiscs.length > 0 && andDiscs.map((d, i) => (
                        <Fragment key={i}>
                            {i > 0 && <span className={SEP_CLASS}>&amp;</span>}
                            <DisciplineIcon discipline={d} size={16} />
                        </Fragment>
                    ))}

                </div>
            )}

            {/* Count controls */}
            <div className="flex items-center gap-0.5 shrink-0">
                <button
                    onClick={onDecrement}
                    title={willRemove ? 'Remove card' : 'Decrease count'}
                    className={[
                        'w-5 h-5 flex items-center justify-center rounded transition-colors',
                        willRemove
                            ? 'text-blood-soft hover:text-blood hover:bg-blood/10'
                            : 'text-ink-muted hover:text-ink hover:bg-hover',
                    ].join(' ')}
                >
                    <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-xs text-ink text-center tabular-nums w-5">{entry.count}</span>
                <button
                    onClick={onIncrement}
                    title="Increase count"
                    className="w-5 h-5 flex items-center justify-center rounded text-ink-muted hover:text-ink hover:bg-hover transition-colors"
                >
                    <Plus className="w-2.5 h-2.5" />
                </button>
            </div>

            {tooltip}
        </div>
    );
}