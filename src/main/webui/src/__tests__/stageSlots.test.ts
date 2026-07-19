import {describe, expect, it} from 'vitest';
import {focusSuggestion, stageSlotCount, stageSlots} from '../features/game/stageSlots.ts';

const order = ['Ana', 'Ben', 'Cat', 'Dev', 'Eli']; // seat order: predator of Cat is Ben, prey is Dev

describe('stageSlots', () => {
    it('defaults to predator | viewer | prey at three slots', () => {
        expect(stageSlots(order, 'Cat', null, 3)).toEqual([
            {name: 'Ben', role: 'predator'},
            {name: 'Cat', role: 'you'},
            {name: 'Dev', role: 'prey'},
        ]);
    });

    it('shows only the viewer at one slot, or the focused player when set', () => {
        expect(stageSlots(order, 'Cat', null, 1)).toEqual([{name: 'Cat', role: 'you'}]);
        expect(stageSlots(order, 'Cat', 'Eli', 1)).toEqual([{name: 'Eli', role: 'cross-table'}]);
    });

    it('pairs the viewer with the focused opponent at two slots, seated by side', () => {
        // Default opponent is the prey, to the right.
        expect(stageSlots(order, 'Cat', null, 2).map(s => s.name)).toEqual(['Cat', 'Dev']);
        // A predator-side focus sits to the left.
        expect(stageSlots(order, 'Cat', 'Ben', 2).map(s => s.name)).toEqual(['Ben', 'Cat']);
        // A prey-side focus sits to the right.
        expect(stageSlots(order, 'Cat', 'Eli', 2).map(s => s.name)).toEqual(['Cat', 'Eli']);
    });

    it('swaps an off-stage focus into the slot on their side of the table', () => {
        // Eli is two seats toward prey → replaces the prey slot.
        expect(stageSlots(order, 'Cat', 'Eli', 3).map(s => s.name)).toEqual(['Ben', 'Cat', 'Eli']);
        // Ana is two seats toward predator → replaces the predator slot.
        expect(stageSlots(order, 'Cat', 'Ana', 3).map(s => s.name)).toEqual(['Ana', 'Cat', 'Dev']);
    });

    it('adds the grand-prey (or the focused player) as the fourth slot', () => {
        expect(stageSlots(order, 'Cat', null, 4).map(s => s.name)).toEqual(['Ben', 'Cat', 'Dev', 'Eli']);
        expect(stageSlots(order, 'Cat', 'Ana', 4).map(s => s.name)).toEqual(['Ben', 'Cat', 'Dev', 'Ana']);
    });

    it('shows the full table at five slots, seat order around the viewer', () => {
        expect(stageSlots(order, 'Cat', null, 5)).toEqual([
            {name: 'Ana', role: 'cross-table'},
            {name: 'Ben', role: 'predator'},
            {name: 'Cat', role: 'you'},
            {name: 'Dev', role: 'prey'},
            {name: 'Eli', role: 'cross-table'},
        ]);
        // Everyone is visible, so a focus never displaces anyone.
        expect(stageSlots(order, 'Cat', 'Ana', 5).map(s => s.name)).toEqual(['Ana', 'Ben', 'Cat', 'Dev', 'Eli']);
    });

    it('keeps a focused predator or prey in place instead of duplicating them', () => {
        expect(stageSlots(order, 'Cat', 'Dev', 3).map(s => s.name)).toEqual(['Ben', 'Cat', 'Dev']);
    });

    it('caps the slot count at the table size', () => {
        // Two players: the count caps to 2, viewer left, the lone opponent right.
        expect(stageSlots(['Ana', 'Ben'], 'Ana', null, 3)).toEqual([
            {name: 'Ana', role: 'you'},
            {name: 'Ben', role: 'prey'},
        ]);
        expect(stageSlots(['Ana', 'Ben', 'Cat'], 'Ana', null, 4).map(s => s.name)).toEqual(['Cat', 'Ana', 'Ben']);
    });

    it('anchors a spectator on the focused player with relational roles', () => {
        expect(stageSlots(order, 'watcher', 'Cat', 3)).toEqual([
            {name: 'Ben', role: 'predator'},
            {name: 'Cat', role: 'focused'},
            {name: 'Dev', role: 'prey'},
        ]);
        // No focus: anchor on the first seat.
        expect(stageSlots(order, 'watcher', null, 3).map(s => s.name)).toEqual(['Eli', 'Ana', 'Ben']);
    });

    it('handles an empty table', () => {
        expect(stageSlots([], 'Cat', null, 3)).toEqual([]);
    });
});

describe('focusSuggestion', () => {
    it('suggests the awaited player when their tableau is off-stage', () => {
        expect(focusSuggestion('Eli', ['Ben', 'Cat', 'Dev'], order)).toBe('Eli');
    });

    it('stays quiet when the awaited player is already on stage', () => {
        expect(focusSuggestion('Dev', ['Ben', 'Cat', 'Dev'], order)).toBeNull();
    });

    it('stays quiet with no awaited player or an unseated one', () => {
        expect(focusSuggestion(null, ['Ben', 'Cat', 'Dev'], order)).toBeNull();
        expect(focusSuggestion('someJudge', ['Ben', 'Cat', 'Dev'], order)).toBeNull();
    });
});

describe('stageSlotCount', () => {
    it('follows the blueprint breakpoints', () => {
        expect(stageSlotCount(500)).toBe(1);
        expect(stageSlotCount(640)).toBe(2);
        expect(stageSlotCount(1024)).toBe(3);
        expect(stageSlotCount(1599)).toBe(3);
        expect(stageSlotCount(1600)).toBe(4);
        expect(stageSlotCount(1879)).toBe(4);
        expect(stageSlotCount(1880)).toBe(5);
    });
});
