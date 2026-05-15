import type {CardData, RegionState} from './types.ts';

export function regionToStacks(region: RegionState, cards: Record<string, CardData>, forceFaceDown = false): CardData[][] {
    const hidden = forceFaceDown || !region.visible;
    const cryptRegion = region.type === 'CRYPT' || region.type === 'UNCONTROLLED';

    // Non-owner viewer: no UUIDs transmitted, so synthesise placeholder stacks from count/slots
    // so that the correct number of face-down card backs are rendered.
    if (hidden && region.cardIds.length === 0 && region.count > 0) {
        if (region.slots) {
            return region.slots.map(slot => {
                const parent: CardData = {
                    id: `${region.id}:slot:${slot.index}`,
                    faceDown: true,
                    crypt: true,
                    counters: slot.counters,
                    locked: slot.locked,
                };
                const children: CardData[] = Array.from({length: slot.childCount}, (_, ci) => ({
                    id: `${region.id}:slot:${slot.index}:child:${ci}`,
                    faceDown: true,
                }));
                return [parent, ...children];
            });
        }
        return Array.from({length: region.count}, (_, i): CardData[] => [{
            id: `${region.id}:placeholder:${i}`,
            faceDown: true,
            crypt: cryptRegion,
        }]);
    }

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
