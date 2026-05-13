import {useState} from 'react';
import type {CardData, PlayerState, RegionState, RegionType} from './types.ts';
import {DisciplineIcon} from '@/shared/components/DisciplineIcon.tsx';
import {ClanIcon} from '@/shared/components/ClanIcon.tsx';

type TextBoardProps = {
    orderedPlayers: PlayerState[];
    cards: Record<string, CardData>;
    currentUser: string;
};

const REGION_ORDER: RegionType[] = [
    'READY', 'TORPOR', 'RESEARCH', 'UNCONTROLLED',
    'LIBRARY', 'CRYPT', 'ASH_HEAP', 'REMOVED_FROM_GAME',
];

const REGION_LABELS: Record<RegionType, string> = {
    READY: 'Ready',
    UNCONTROLLED: 'Uncontrolled',
    TORPOR: 'Torpor',
    RESEARCH: 'Research',
    HAND: 'Hand',
    LIBRARY: 'Library',
    CRYPT: 'Crypt',
    ASH_HEAP: 'Ash Heap',
    REMOVED_FROM_GAME: 'Removed',
};

function CardRow({card, isHidden, isChild = false}: {card: CardData; isHidden: boolean; isChild?: boolean}) {
    if (isHidden) {
        return (
            <div className={`font-mono text-base text-ink-muted/40 py-1.5 flex items-center gap-1${isChild ? ' pl-5' : ''}`}>
                {isChild && <span className="text-sm text-ink-muted/30 shrink-0">└</span>}
                <span>***********</span>
            </div>
        );
    }

    const isCryptCard = card.crypt || card.minion;
    const name = card.name ?? 'Unknown';

    let counterDisplay: string | null = null;
    if (card.counters !== undefined) {
        counterDisplay = isCryptCard && card.capacity !== undefined
            ? `${card.counters}/${card.capacity}`
            : `${card.counters}`;
    }

    return (
        <div className={`py-1.5${isChild ? ' pl-5' : ''}`}>
            <div className="flex items-center gap-1.5 min-w-0">
                {isChild && <span className="text-sm text-ink-muted/40 shrink-0">└</span>}
                <span className="font-mono truncate flex-1 text-ink-secondary leading-snug">
                    {name}
                </span>
                {!isChild && card.locked && (
                    <span className="text-[13px] bg-line/40 text-ink-muted/70 rounded px-1 shrink-0 leading-none py-0.5">L</span>
                )}
                {counterDisplay && (
                    <span className="font-mono text-[15px] text-ink-muted shrink-0 tabular-nums">{counterDisplay}</span>
                )}
            </div>
            {isCryptCard && !isChild && (card.disciplines?.length || card.clan) && (
                <div className="flex items-center gap-1 pl-1 mt-1 flex-wrap">
                    {card.disciplines?.map(d => (
                        <DisciplineIcon key={d} discipline={d} size={18} />
                    ))}
                    {card.clan && <ClanIcon clan={card.clan} size={18} />}
                </div>
            )}
        </div>
    );
}

function RegionSection({region, cards}: {region: RegionState; cards: Record<string, CardData>}) {
    const [collapsed, setCollapsed] = useState(!region.visible);

    const regionCardSet = new Set(region.cardIds);

    const childSet = new Set(
        region.cardIds.filter(id => {
            const parentId = cards[id]?.parentId;
            return parentId != null && regionCardSet.has(parentId);
        })
    );

    const topLevel = region.cardIds.filter(id => !childSet.has(id));

    return (
        <div className="mt-4">
            <button
                className="w-full flex items-center gap-1.5 text-left text-[13px] uppercase tracking-wide text-ink-muted/70 font-semibold border-b border-line/40 pb-0.5 mb-0.5 hover:text-ink-muted transition-colors group"
                onClick={() => setCollapsed(c => !c)}
            >
                <span className="text-[11px] leading-none text-ink-muted/40 group-hover:text-ink-muted/70 transition-colors shrink-0">
                    {collapsed ? '▸' : '▾'}
                </span>
                <span>{REGION_LABELS[region.type]} ({region.count})</span>
            </button>
            {!collapsed && topLevel.map(id => {
                const card = cards[id] ?? {id};
                const hidden = !region.visible || !!card.faceDown;
                const children = hidden
                    ? []
                    : (card.childCardIds ?? [])
                        .filter(cid => regionCardSet.has(cid))
                        .map(cid => cards[cid])
                        .filter((c): c is CardData => c != null);

                return (
                    <div key={id} className="border-b border-line/20 last:border-0">
                        <CardRow card={card} isHidden={hidden} />
                        {children.map(child => (
                            <CardRow key={child.id} card={child} isHidden={false} isChild />
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

function PlayerColumn({player, cards, isCurrentUser}: {player: PlayerState; cards: Record<string, CardData>; isCurrentUser: boolean}) {
    const regions = REGION_ORDER
        .map(type => player.regions[type])
        .filter((r): r is RegionState => r != null && r.cardIds.length > 0);

    return (
        <div className={[
            'flex-1 min-w-52 flex flex-col min-h-0 overflow-y-auto rounded-lg border px-2 py-2',
            isCurrentUser ? 'bg-arcane/5 border-arcane/40' : 'bg-panel/50 border-line/75',
        ].join(' ')}>
            <div className="shrink-0 pb-1.5 border-b border-line/50 mb-0.5">
                <div className={`text-sm leading-tight truncate ${isCurrentUser ? 'font-semibold text-ink' : 'font-medium text-ink-secondary'}`}>
                    {player.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-blood font-medium">{player.pool} pool</span>
                    {player.victoryPoints > 0 && (
                        <span className="text-xs text-gold font-medium">{player.victoryPoints} VP</span>
                    )}
                    {player.ousted && (
                        <span className="text-[10px] text-ink-muted/50 italic">ousted</span>
                    )}
                </div>
            </div>
            {regions.map(region => (
                <RegionSection key={region.id} region={region} cards={cards} />
            ))}
        </div>
    );
}

export function TextBoard({orderedPlayers, cards, currentUser}: TextBoardProps) {
    return (
        <div className="flex gap-2 h-full min-h-0 overflow-x-auto">
            {orderedPlayers.map(player => (
                <PlayerColumn
                    key={player.name}
                    player={player}
                    cards={cards}
                    isCurrentUser={player.name === currentUser}
                />
            ))}
        </div>
    );
}
