import type {CardData, RegionState} from './types.ts';

export function regionToStacks(region: RegionState, cards: Record<string, CardData>, forceFaceDown = false): CardData[][] {
    const hidden = forceFaceDown || !region.visible;
    const cryptRegion = region.type === 'CRYPT' || region.type === 'UNCONTROLLED';
    // Only top-level cards (no parentId) become stack roots
    const topLevelIds = region.cardIds.filter(id => !cards[id]?.parentId);
    return topLevelIds.map(id => {
        const card = cards[id] ?? {id};
        const parentCard: CardData = {
            ...card,
            faceDown: hidden || !!card.faceDown,
            crypt: card.crypt ?? (hidden && cryptRegion),
        };
        const children: CardData[] = (card.childCardIds ?? [])
            .map(cid => cards[cid])
            .filter((c): c is CardData => c != null)
            .map(child => ({
                ...child,
                faceDown: hidden || !!child.faceDown,
                crypt: child.crypt ?? (hidden && cryptRegion),
            }));
        return [parentCard, ...children];
    });
}

export function RegionBadge({label, count}: {label: string; count: number}) {
    return (
        <div className="flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-panel border border-line/75 text-ink-muted">
            <span>{label}</span>
            <span className="font-medium text-ink-secondary">{count}</span>
        </div>
    );
}
