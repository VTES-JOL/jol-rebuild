import {describe, expect, it} from 'vitest';
import {regionToStacks} from '@/features/game/gameUtils';
import type {CardData, RegionState} from '@/features/game/types';

function region(overrides: Partial<RegionState> = {}): RegionState {
    return {
        id: 'r1',
        type: 'READY',
        count: 0,
        visible: true,
        cardIds: [],
        ...overrides,
    };
}

describe('regionToStacks', () => {
    describe('hidden region with count (no UUIDs transmitted)', () => {
        it('generates one placeholder stack per count', () => {
            const r = region({ visible: false, count: 3, cardIds: [] });
            const stacks = regionToStacks(r, {});
            expect(stacks).toHaveLength(3);
            expect(stacks.every(s => s.length === 1)).toBe(true);
        });

        it('marks placeholder cards as faceDown', () => {
            const r = region({ visible: false, count: 2, cardIds: [] });
            const stacks = regionToStacks(r, {});
            expect(stacks[0][0].faceDown).toBe(true);
        });

        it('sets crypt=true for CRYPT region placeholders', () => {
            const r = region({ type: 'CRYPT', visible: false, count: 1, cardIds: [] });
            const stacks = regionToStacks(r, {});
            expect(stacks[0][0].crypt).toBe(true);
        });

        it('uses slot data when provided (UNCONTROLLED region)', () => {
            const r = region({
                type: 'UNCONTROLLED',
                visible: false,
                count: 2,
                cardIds: [],
                slots: [
                    { index: 0, counters: 3, locked: false, childCount: 1 },
                    { index: 1, counters: 1, locked: true, childCount: 0 },
                ],
            });
            const stacks = regionToStacks(r, {});
            expect(stacks).toHaveLength(2);
            // First slot has 1 child → parent + 1 child = 2 cards
            expect(stacks[0]).toHaveLength(2);
            // Second slot has 0 children → just the parent
            expect(stacks[1]).toHaveLength(1);
            expect(stacks[0][0].counters).toBe(3);
            expect(stacks[1][0].locked).toBe(true);
        });
    });

    describe('visible region with cardIds', () => {
        it('returns an empty array when cardIds is empty', () => {
            const r = region({ visible: true, cardIds: [] });
            expect(regionToStacks(r, {})).toEqual([]);
        });

        it('creates one stack per top-level card', () => {
            const cards: Record<string, CardData> = {
                'a': { id: 'a', name: 'Card A' },
                'b': { id: 'b', name: 'Card B' },
            };
            const r = region({ visible: true, cardIds: ['a', 'b'] });
            const stacks = regionToStacks(r, cards);
            expect(stacks).toHaveLength(2);
        });

        it('places child cards in the parent stack after the parent', () => {
            const cards: Record<string, CardData> = {
                'parent': { id: 'parent', name: 'Parent', childCardIds: ['child'] },
                'child':  { id: 'child', name: 'Child', parentId: 'parent' },
            };
            const r = region({ visible: true, cardIds: ['parent', 'child'] });
            const stacks = regionToStacks(r, cards);
            // Only 'parent' is a top-level card (child has parentId)
            expect(stacks).toHaveLength(1);
            expect(stacks[0]).toHaveLength(2);
            expect(stacks[0][0].id).toBe('parent');
            expect(stacks[0][1].id).toBe('child');
        });

        it('does not force faceDown on visible region cards', () => {
            const cards: Record<string, CardData> = {
                'a': { id: 'a', faceDown: false },
            };
            const r = region({ visible: true, cardIds: ['a'] });
            const stacks = regionToStacks(r, cards);
            expect(stacks[0][0].faceDown).toBe(false);
        });
    });

    describe('forceFaceDown override', () => {
        it('forces all cards faceDown even on a visible region', () => {
            const cards: Record<string, CardData> = {
                'a': { id: 'a', faceDown: false },
            };
            const r = region({ visible: true, cardIds: ['a'] });
            const stacks = regionToStacks(r, cards, true);
            expect(stacks[0][0].faceDown).toBe(true);
        });
    });
});
