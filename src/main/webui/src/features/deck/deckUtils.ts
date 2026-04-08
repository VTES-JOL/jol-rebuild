import type { DeckEntry, DeckSummary, KrcgContents } from './types';

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
 * Computes a live DeckSummary from the current entries.
 * Returns null only when the deck is completely empty.
 * Always includes crypt+library counts (even 0) so validation chips remain visible.
 */
export function computeSummary(entries: DeckEntry[]): DeckSummary | null {
    if (entries.length === 0) return null;

    const cryptEntries = entries.filter(e => e.isCrypt);
    const libEntries   = entries.filter(e => !e.isCrypt);

    const crypt   = cryptEntries.reduce((sum, e) => sum + e.count, 0);
    const library = libEntries.reduce((sum, e) => sum + e.count, 0);

    const groups = [
        ...new Set(
            cryptEntries
                .filter(e => e.group && e.group !== 'ANY')
                .map(e => e.group!)
        ),
    ]
        .sort((a, b) => parseInt(a) - parseInt(b))
        .join('/') || null;

    return { crypt, library, groups };
}

/**
 * Parses the compact storage format "{crypt},{library},{groups}" into a DeckSummary.
 * e.g. "12,80,4/5" → { crypt: 12, library: 80, groups: "4/5" }
 *      "12,80,"    → { crypt: 12, library: 80, groups: null }
 */
export function parseSummary(compact: string | null): DeckSummary | null {
    if (!compact) return null;
    const [cryptStr, libraryStr, groupsStr] = compact.split(',');
    return {
        crypt:   parseInt(cryptStr,   10),
        library: parseInt(libraryStr, 10),
        groups:  groupsStr || null,
    };
}

/**
 * Serialises a DeckSummary to the compact storage format.
 * e.g. { crypt: 12, library: 80, groups: "4/5" } → "12,80,4/5"
 */
export function formatSummaryCompact(summary: DeckSummary): string {
    return `${summary.crypt},${summary.library},${summary.groups ?? ''}`;
}

export function getBannedEntries(entries: DeckEntry[]): DeckEntry[] {
    return entries.filter(e => e.banned);
}

// ── KRCG serialisation ────────────────────────────────────────────────────────

/** Serialises current entries to KRCG format (with metadata extensions for round-tripping). */
export function toKrcgContents(entries: DeckEntry[]): KrcgContents {
    const cryptCards = entries
        .filter(e => e.isCrypt)
        .map(e => ({ id: e.cardId, count: e.count, name: e.name, group: e.group, banned: e.banned, types: e.types }));

    const libGroups = groupEntries(entries.filter(e => !e.isCrypt))
        .map(g => ({
            type: g.key,
            count: g.total,
            cards: g.entries.map(e => ({ id: e.cardId, count: e.count, name: e.name, banned: e.banned, types: e.types })),
        }));

    return {
        crypt:   { count: cryptCards.reduce((s, c) => s + c.count, 0), cards: cryptCards },
        library: { count: libGroups.reduce((s, g) => s + g.count, 0), cards: libGroups },
    };
}

/** Deserialises KRCG contents back into DeckEntry[]. */
export function fromKrcgContents(contents: KrcgContents): DeckEntry[] {
    const entries: DeckEntry[] = [];

    for (const c of (contents.crypt?.cards ?? [])) {
        entries.push({
            cardId: c.id, name: c.name, count: c.count,
            isCrypt: true,
            types:  c.types ?? ['Vampire'],
            group:  c.group,
            banned: c.banned ?? false,
        });
    }

    for (const group of (contents.library?.cards ?? [])) {
        for (const c of group.cards) {
            entries.push({
                cardId: c.id, name: c.name, count: c.count,
                isCrypt: false,
                types:  c.types ?? [group.type],
                banned: c.banned ?? false,
            });
        }
    }

    return entries;
}