import { describe, it, expect } from 'vitest';
import {
    groupEntries,
    computeSummary,
    parseSummary,
    formatSummaryCompact,
    getBannedEntries,
    extractKrcgCards,
    enrichEntry,
} from '@/features/deck/deckUtils';
import type { DeckEntry, KrcgContents, CardDetailData } from '@/features/deck/types';

function entry(overrides: Partial<DeckEntry> & { name: string; isCrypt: boolean }): DeckEntry {
    return {
        cardId: overrides.cardId ?? '1',
        count: overrides.count ?? 1,
        types: overrides.types ?? [],
        banned: overrides.banned ?? false,
        ...overrides,
    };
}

describe('groupEntries', () => {
    it('returns empty array for empty input', () => {
        expect(groupEntries([])).toEqual([]);
    });

    it('puts all crypt cards in a single "Crypt" group', () => {
        const entries = [
            entry({ name: 'Vampire B', isCrypt: true, types: ['Vampire'] }),
            entry({ name: 'Vampire A', isCrypt: true, types: ['Vampire'] }),
        ];
        const groups = groupEntries(entries);
        expect(groups).toHaveLength(1);
        expect(groups[0].key).toBe('Crypt');
        expect(groups[0].entries.map(e => e.name)).toEqual(['Vampire A', 'Vampire B']);
    });

    it('groups library cards by type key', () => {
        const entries = [
            entry({ name: 'Action Card', isCrypt: false, types: ['Action'] }),
            entry({ name: 'Combat Card', isCrypt: false, types: ['Combat'] }),
        ];
        const groups = groupEntries(entries);
        expect(groups.map(g => g.key)).toEqual(['Action', 'Combat']);
    });

    it('places Crypt first regardless of alphabetical order', () => {
        const entries = [
            entry({ name: 'Zuul', isCrypt: false, types: ['Action'] }),
            entry({ name: 'Vampire', isCrypt: true, types: ['Vampire'] }),
        ];
        const groups = groupEntries(entries);
        expect(groups[0].key).toBe('Crypt');
    });

    it('creates a combined key for multi-type library cards', () => {
        const entries = [
            entry({ name: 'Dual Card', isCrypt: false, types: ['Action', 'Combat'] }),
        ];
        const groups = groupEntries(entries);
        expect(groups[0].key).toBe('Action/Combat');
    });

    it('sums counts within each group', () => {
        const entries = [
            entry({ name: 'Card A', isCrypt: false, types: ['Action'], count: 3 }),
            entry({ name: 'Card B', isCrypt: false, types: ['Action'], count: 2 }),
        ];
        const groups = groupEntries(entries);
        expect(groups[0].total).toBe(5);
    });

    it('sorts library groups alphabetically after Crypt', () => {
        const entries = [
            entry({ name: 'Z', isCrypt: false, types: ['Reaction'] }),
            entry({ name: 'A', isCrypt: false, types: ['Action'] }),
            entry({ name: 'M', isCrypt: false, types: ['Master'] }),
        ];
        const groups = groupEntries(entries);
        expect(groups.map(g => g.key)).toEqual(['Action', 'Master', 'Reaction']);
    });

    it('sorts entries within each group alphabetically', () => {
        const entries = [
            entry({ name: 'Zebra', isCrypt: false, types: ['Action'] }),
            entry({ name: 'Apple', isCrypt: false, types: ['Action'] }),
        ];
        const groups = groupEntries(entries);
        expect(groups[0].entries.map(e => e.name)).toEqual(['Apple', 'Zebra']);
    });
});

describe('computeSummary', () => {
    it('returns null for empty entries', () => {
        expect(computeSummary([])).toBeNull();
    });

    it('counts crypt and library cards correctly', () => {
        const entries = [
            entry({ name: 'V', isCrypt: true, count: 4 }),
            entry({ name: 'L', isCrypt: false, count: 10 }),
        ];
        const summary = computeSummary(entries)!;
        expect(summary.crypt).toBe(4);
        expect(summary.library).toBe(10);
    });

    it('derives groups from crypt card group numbers', () => {
        const entries = [
            entry({ name: 'V1', isCrypt: true, count: 1, group: '4' }),
            entry({ name: 'V2', isCrypt: true, count: 1, group: '5' }),
        ];
        const summary = computeSummary(entries)!;
        expect(summary.groups).toBe('4/5');
    });

    it('deduplicates and sorts group numbers', () => {
        const entries = [
            entry({ name: 'V1', isCrypt: true, count: 1, group: '5' }),
            entry({ name: 'V2', isCrypt: true, count: 1, group: '4' }),
            entry({ name: 'V3', isCrypt: true, count: 1, group: '4' }),
        ];
        const summary = computeSummary(entries)!;
        expect(summary.groups).toBe('4/5');
    });

    it('returns null groups when all crypt cards are ANY-group', () => {
        const entries = [
            entry({ name: 'V', isCrypt: true, count: 1, group: 'ANY' }),
        ];
        const summary = computeSummary(entries)!;
        expect(summary.groups).toBeNull();
    });

    it('works with only library cards', () => {
        const entries = [entry({ name: 'L', isCrypt: false, count: 5 })];
        const summary = computeSummary(entries)!;
        expect(summary.crypt).toBe(0);
        expect(summary.library).toBe(5);
    });
});

describe('parseSummary / formatSummaryCompact round-trip', () => {
    it('round-trips a complete summary', () => {
        const original = { crypt: 12, library: 80, groups: '4/5' };
        const compact = formatSummaryCompact(original);
        expect(parseSummary(compact)).toEqual(original);
    });

    it('round-trips a summary with null groups', () => {
        const original = { crypt: 12, library: 80, groups: null };
        const compact = formatSummaryCompact(original);
        expect(parseSummary(compact)).toEqual(original);
    });

    it('returns null for null input', () => {
        expect(parseSummary(null)).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(parseSummary('')).toBeNull();
    });
});

describe('getBannedEntries', () => {
    it('returns only banned entries', () => {
        const entries = [
            entry({ name: 'OK', isCrypt: false, banned: false }),
            entry({ name: 'Banned', isCrypt: false, banned: true }),
        ];
        const banned = getBannedEntries(entries);
        expect(banned).toHaveLength(1);
        expect(banned[0].name).toBe('Banned');
    });

    it('returns empty array when nothing is banned', () => {
        expect(getBannedEntries([entry({ name: 'OK', isCrypt: false })])).toEqual([]);
    });
});

describe('extractKrcgCards', () => {
    const krcg: KrcgContents = {
        crypt: {
            count: 2,
            cards: [
                { id: 'c1', count: 1, name: 'Vampire A' },
                { id: 'c2', count: 1, name: 'Vampire B' },
            ],
        },
        library: {
            count: 3,
            cards: [
                {
                    type: 'Action',
                    count: 2,
                    cards: [{ id: 'l1', count: 2, name: 'Action Card' }],
                },
                {
                    type: 'Master',
                    count: 1,
                    cards: [{ id: 'l2', count: 1, name: 'Master Card' }],
                },
            ],
        },
    };

    it('extracts crypt cards with isCrypt=true', () => {
        const cards = extractKrcgCards(krcg);
        const cryptCards = cards.filter(c => c.isCrypt);
        expect(cryptCards).toHaveLength(2);
        expect(cryptCards.map(c => c.id)).toEqual(['c1', 'c2']);
    });

    it('extracts library cards with isCrypt=false', () => {
        const cards = extractKrcgCards(krcg);
        const libCards = cards.filter(c => !c.isCrypt);
        expect(libCards).toHaveLength(2);
        expect(libCards.map(c => c.id)).toEqual(['l1', 'l2']);
    });

    it('preserves count values', () => {
        const cards = extractKrcgCards(krcg);
        expect(cards.find(c => c.id === 'l1')?.count).toBe(2);
    });

    it('handles empty crypt and library gracefully', () => {
        const empty: KrcgContents = {
            crypt: { count: 0, cards: [] },
            library: { count: 0, cards: [] },
        };
        expect(extractKrcgCards(empty)).toEqual([]);
    });
});

describe('enrichEntry', () => {
    const raw = { id: 'c1', count: 2, name: 'Antediluvian', isCrypt: true };

    it('merges detail data into the entry', () => {
        const detail: Partial<CardDetailData> = {
            types: ['Vampire'],
            group: '4',
            banned: false,
            advanced: false,
        };
        const result = enrichEntry(raw, detail as CardDetailData);
        expect(result.cardId).toBe('c1');
        expect(result.count).toBe(2);
        expect(result.types).toEqual(['Vampire']);
        expect(result.group).toBe('4');
        expect(result.banned).toBe(false);
    });

    it('falls back to defaults when detail is undefined', () => {
        const result = enrichEntry(raw, undefined);
        expect(result.types).toEqual(['Vampire']);
        expect(result.banned).toBe(false);
        expect(result.advanced).toBe(false);
    });

    it('uses empty types array for library card with no detail', () => {
        const libRaw = { ...raw, isCrypt: false };
        const result = enrichEntry(libRaw, undefined);
        expect(result.types).toEqual([]);
    });
});
