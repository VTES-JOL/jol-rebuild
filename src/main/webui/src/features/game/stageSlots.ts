import type {PlayerColumnRole} from './PlayerColumn.tsx';

export type StageSlot = {name: string; role: PlayerColumnRole};

/**
 * Which tableaus the Stage shows, left to right, and each player's relation
 * to the viewer. Mirrors the Ring strip's geometry: predator to the left,
 * prey to the right, play proceeding left → right.
 *
 * - 1 slot: the focused player (default: the viewer).
 * - 2 slots: the viewer plus the focused opponent (default: prey), placed on
 *   the side matching their seat.
 * - 3 slots: predator | viewer | prey; focusing an off-stage player swaps
 *   them into the slot on their side of the table.
 * - 4 slots: adds the focused player (or grand-prey) as a fourth column.
 * - 5 slots: the full table, seat order around the viewer.
 *
 * `order` is the non-ousted seating order. A viewer who isn't playing
 * (spectator or ousted) anchors on the focused player instead.
 */
export function stageSlots(order: string[], viewer: string, focused: string | null, slotCount: number): StageSlot[] {
    const n = order.length;
    if (n === 0) return [];

    const at = (i: number) => order[((i % n) + n) % n];
    const has = (name: string | null): name is string => !!name && order.includes(name);

    const isPlayer = order.includes(viewer);
    const anchor = isPlayer ? viewer : (has(focused) ? focused : order[0]);
    const anchorIdx = order.indexOf(anchor);
    /** Forward (prey-direction) seat distance from the anchor. */
    const dist = (name: string) => (order.indexOf(name) - anchorIdx + n) % n;

    const roleOf = (name: string): PlayerColumnRole => {
        if (name === anchor) return isPlayer ? 'you' : 'focused';
        const d = dist(name);
        if (d === 1) return 'prey';
        if (d === n - 1) return 'predator';
        return 'cross-table';
    };

    const count = Math.min(slotCount, n);
    let names: string[];

    if (count <= 1) {
        names = [has(focused) ? focused : anchor];
    } else if (count === 2) {
        const opponent = has(focused) && focused !== anchor ? focused : at(anchorIdx + 1);
        // Predator-side opponents sit left of the viewer, prey-side right.
        names = dist(opponent) > n / 2 ? [opponent, anchor] : [anchor, opponent];
    } else {
        // Symmetric spread around the viewer, prey side taking the odd column:
        // 3 → [-1, 0, +1] · 4 → [-1, 0, +1, +2] · 5 → [-2, -1, 0, +1, +2].
        const left = Math.floor((count - 1) / 2);
        const base = Array.from({length: count}, (_, i) => at(anchorIdx - left + i));
        if (has(focused) && !base.includes(focused)) {
            if (count >= 4) {
                base[count - 1] = focused; // the outermost prey-side column is the focus slot
            } else if (dist(focused) <= n / 2) {
                base[2] = focused;
            } else {
                base[0] = focused;
            }
        }
        names = base;
    }

    const seen = new Set<string>();
    return names
        .filter(name => name && !seen.has(name) && (seen.add(name) || true))
        .map(name => ({name, role: roleOf(name)}));
}

/**
 * Suggest focusing the awaited player when their tableau is off-stage.
 * Suggest, never force: the caller renders this as a dismissible affordance.
 * Returns null when there is no awaited player, they aren't seated, or their
 * tableau is already on stage.
 */
export function focusSuggestion(awaited: string | null, slotNames: string[], order: string[]): string | null {
    if (!awaited || !order.includes(awaited)) return null;
    return slotNames.includes(awaited) ? null : awaited;
}

/** Stage density: how many tableaus fit at this container width (~400px each from 4 up). */
export function stageSlotCount(width: number): number {
    if (width < 640) return 1;
    if (width < 1024) return 2;
    if (width < 1600) return 3;
    if (width < 1880) return 4; // 1880 keeps the full table reachable on 1920px displays
    return 5;
}

/** Card width scales down as more tableaus share the container. */
export const STAGE_CARD_WIDTH: Record<number, string> = {
    1: 'clamp(90px, 10vw, 120px)',
    2: 'clamp(78px, 7vw, 104px)',
    3: 'clamp(66px, 5.25vw, 84px)',
    4: 'clamp(56px, 4.5vw, 76px)',
    5: 'clamp(50px, 3.8vw, 68px)',
};
