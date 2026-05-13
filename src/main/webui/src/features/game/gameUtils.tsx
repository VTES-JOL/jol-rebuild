import type {CardData, RegionState} from './types.ts';

export function regionToStacks(region: RegionState, cards: Record<string, CardData>, forceFaceDown = false): CardData[][] {
    const hidden = forceFaceDown || !region.visible;
    const cryptRegion = region.type === 'CRYPT' || region.type === 'UNCONTROLLED';
    return region.cardIds.map(id => {
        const card = cards[id] ?? {id};
        return [{
            ...card,
            faceDown: hidden || !!card.faceDown,
            crypt: card.crypt ?? (hidden && cryptRegion),
        }];
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
