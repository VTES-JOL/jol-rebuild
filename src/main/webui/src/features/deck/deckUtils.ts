import type { DeckEntry } from './types';

export interface CardGroup {
    key: string;
    entries: DeckEntry[];
    total: number;
}

/**
 * Groups entries for display. Crypt cards form a single "Crypt" group.
 * Library cards are grouped by their type key — multi-type cards produce
 * a combined key (e.g. "Action/Combat") forming their own group.
 * Within each group cards are sorted alphabetically.
 * Order: Crypt first, then library groups alphabetically.
 */
export function groupEntries(entries: DeckEntry[]): CardGroup[] {
    const map = new Map<string, DeckEntry[]>();

    for (const entry of entries) {
        const key = entry.isCrypt ? 'Crypt' : entry.types.join('/');
        const existing = map.get(key) ?? [];
        existing.push(entry);
        map.set(key, existing);
    }

    return [...map.entries()]
        .sort(([a], [b]) => {
            if (a === 'Crypt') return -1;
            if (b === 'Crypt') return 1;
            return a.localeCompare(b);
        })
        .map(([key, groupEntries]) => ({
            key,
            entries: [...groupEntries].sort((a, b) => a.name.localeCompare(b.name)),
            total: groupEntries.reduce((sum, e) => sum + e.count, 0),
        }));
}

/**
 * Computes the summary string in the format used by SummaryStats chips.
 * Returns null when the deck is empty.
 */
export function computeSummary(entries: DeckEntry[]): string | null {
    if (entries.length === 0) return null;

    const cryptEntries = entries.filter(e => e.isCrypt);
    const libEntries   = entries.filter(e => !e.isCrypt);

    const cryptCount = cryptEntries.reduce((sum, e) => sum + e.count, 0);
    const libCount   = libEntries.reduce((sum, e) => sum + e.count, 0);

    const groups = [
        ...new Set(
            cryptEntries
                .filter(e => e.group && e.group !== 'ANY')
                .map(e => e.group!)
        ),
    ]
        .sort((a, b) => parseInt(a) - parseInt(b))
        .join('/');

    const parts: string[] = [];
    if (cryptCount > 0) parts.push(`Crypt: ${cryptCount}`);
    if (libCount > 0)   parts.push(`Library: ${libCount}`);
    if (groups)         parts.push(`Groups: ${groups}`);

    return parts.join('  ') || null;
}

export function getBannedEntries(entries: DeckEntry[]): DeckEntry[] {
    return entries.filter(e => e.banned);
}