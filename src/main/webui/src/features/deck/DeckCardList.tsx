import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TypeIcon } from '@/shared/components/TypeIcon';
import DeckCardRow from './DeckCardRow';
import { groupEntries } from './deckUtils';
import type { CardGroup } from './deckUtils';
import type { CardIconData, DeckEntry } from './types';

interface Props {
    entries:        DeckEntry[];
    iconMap?:       Map<string, CardIconData>;
    entriesLoading?: boolean;
    onIncrement:    (cardId: string) => void;
    onDecrement:    (cardId: string) => void;
}

interface GroupSectionProps {
    group:      CardGroup;
    isOpen:     boolean;
    onToggle:   (key: string) => void;
    iconMap?:   Map<string, CardIconData>;
    onIncrement: (cardId: string) => void;
    onDecrement: (cardId: string) => void;
}

function GroupSection({ group, isOpen, onToggle, iconMap, onIncrement, onDecrement }: GroupSectionProps) {
    return (
        <div key={group.key}>
            <button
                onClick={() => onToggle(group.key)}
                className="w-full flex items-center gap-2 pl-3 pr-4 py-2 border-b border-line/50 sticky top-0 z-10 bg-panel/30 hover:bg-hover/40 transition-colors"
            >
                {isOpen
                    ? <ChevronDown  className="w-3 h-3 text-ink-muted shrink-0" />
                    : <ChevronRight className="w-3 h-3 text-ink-muted shrink-0" />
                }
                <span className="text-xs font-semibold text-ink">{group.key}</span>
                {group.key !== 'Crypt' && (
                    <span className="flex items-center gap-0.5 shrink-0">
                        {group.key.split('/').map(t => (
                            <TypeIcon key={t} type={t} size={16} />
                        ))}
                    </span>
                )}
                <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full bg-hover border border-line/60 text-[10px] font-semibold tabular-nums text-ink-secondary leading-none">
                    {group.total}
                </span>
            </button>
            {isOpen && group.entries.map(entry => (
                <DeckCardRow
                    key={entry.cardId}
                    entry={entry}
                    iconData={iconMap?.get(entry.cardId)}
                    onIncrement={() => onIncrement(entry.cardId)}
                    onDecrement={() => onDecrement(entry.cardId)}
                />
            ))}
        </div>
    );
}

export default function DeckCardList({ entries, iconMap, entriesLoading, onIncrement, onDecrement }: Props) {
    const [openGroups,      setOpenGroups]      = useState<Set<string>>(new Set());
    const groupsInitialized = useRef(false);
    const seenGroupsRef     = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (entries.length === 0) return;
        const currentKeys = groupEntries(entries).map(g => g.key);

        if (!groupsInitialized.current) {
            groupsInitialized.current = true;
            currentKeys.forEach(k => seenGroupsRef.current.add(k));
            setOpenGroups(new Set(currentKeys));
            return;
        }

        const newKeys = currentKeys.filter(k => !seenGroupsRef.current.has(k));
        if (newKeys.length === 0) return;
        newKeys.forEach(k => seenGroupsRef.current.add(k));
        setOpenGroups(prev => {
            const next = new Set(prev);
            newKeys.forEach(k => next.add(k));
            return next;
        });
    }, [entries]);

    const toggleGroup = useCallback((key: string) => {
        setOpenGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    }, []);

    if (entries.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 text-sm text-ink-muted">
                {entriesLoading ? 'Loading…' : 'Search above to add cards.'}
            </div>
        );
    }

    const groups      = groupEntries(entries);
    const cryptGroups = groups.filter(g => g.key === 'Crypt');
    const libGroups   = groups.filter(g => g.key !== 'Crypt');

    const sharedProps = { isOpen: false, onToggle: toggleGroup, iconMap, onIncrement, onDecrement };

    return (
        // At 2xl: split into two independently-scrolling columns (crypt left, library right).
        // Sticky group headers stay anchored within their own column's scroll context.
        <div className="flex-1 min-h-0 overflow-y-auto 2xl:overflow-hidden 2xl:flex">
            <div className="2xl:flex-1 2xl:overflow-y-auto 2xl:min-h-0">
                {cryptGroups.map(group => (
                    <GroupSection
                        key={group.key}
                        group={group}
                        {...sharedProps}
                        isOpen={openGroups.has(group.key)}
                    />
                ))}
                {/* At smaller viewports, library groups render in the single column after crypt */}
                <div className="2xl:hidden">
                    {libGroups.map(group => (
                        <GroupSection
                            key={group.key}
                            group={group}
                            {...sharedProps}
                            isOpen={openGroups.has(group.key)}
                        />
                    ))}
                </div>
            </div>

            {/* Library column — only rendered as a separate column at 2xl */}
            <div className="hidden 2xl:block 2xl:flex-1 2xl:overflow-y-auto 2xl:min-h-0 2xl:border-l 2xl:border-line/50">
                {libGroups.map(group => (
                    <GroupSection
                        key={group.key}
                        group={group}
                        {...sharedProps}
                        isOpen={openGroups.has(group.key)}
                    />
                ))}
            </div>
        </div>
    );
}
