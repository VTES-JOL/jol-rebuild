import {describe, expect, it} from 'vitest';
import {nowStatus} from '../features/game/nowStatus.ts';
import type {GameState, PlayerState} from '../features/game/types.ts';

function player(name: string): PlayerState {
    return {name, pool: 30, victoryPoints: 0, ousted: false, prey: null, predator: null, notes: null, choice: null, regions: {}};
}

function makeState(overrides: Partial<GameState> = {}): GameState {
    return {
        gameId: 'g1',
        gameName: 'Test Game',
        turn: '2.3',
        phase: 'MINION',
        currentPlayer: 'Seraphina',
        edgeHolder: '',
        orderReversed: false,
        playerOrder: ['Seraphina', 'Alice', 'Marcus'],
        players: [player('Seraphina'), player('Alice'), player('Marcus')],
        cards: {},
        transfersRemaining: 0,
        rulesEnforced: true,
        ...overrides,
    };
}

describe('nowStatus', () => {
    it('falls back to the turn phase, viewer-relative', () => {
        expect(nowStatus(makeState(), 'Alice')).toEqual({
            kind: 'phase',
            headline: "Seraphina's Minion phase",
            awaited: 'Seraphina',
            yourMove: false,
        });
        expect(nowStatus(makeState(), 'Seraphina')).toMatchObject({
            headline: 'Your Minion phase',
            yourMove: true,
        });
    });

    it('describes a pending action with block window and awaits the target', () => {
        const state = makeState({
            pendingAction: {
                actorRef: {playerName: 'Seraphina', regionType: 'READY', position: 0, childIndex: -1},
                actionType: 'BLEED',
                targetPlayerName: 'Alice',
                status: 'DURING_ACTION',
                blockerRef: null,
            },
        });
        expect(nowStatus(state, 'Alice')).toEqual({
            kind: 'action',
            headline: 'Seraphina bleeds → you — block window open',
            awaited: 'Alice',
            yourMove: true,
        });
        expect(nowStatus(state, 'Marcus')).toMatchObject({yourMove: false, awaited: 'Alice'});
    });

    it('uses second-person verb form when the viewer is the actor', () => {
        const state = makeState({
            pendingAction: {
                actorRef: {playerName: 'Alice', regionType: 'READY', position: 0, childIndex: -1},
                actionType: 'BLEED',
                targetPlayerName: 'Marcus',
                status: 'DURING_ACTION',
                blockerRef: null,
            },
        });
        expect(nowStatus(state, 'Alice').headline).toBe('you bleed → Marcus — block window open');
    });

    it('reports a blocked action with the blocker', () => {
        const state = makeState({
            pendingAction: {
                actorRef: {playerName: 'Seraphina', regionType: 'READY', position: 0, childIndex: -1},
                actionType: 'HUNT',
                targetPlayerName: null,
                status: 'BLOCKED',
                blockerRef: {playerName: 'Marcus', regionType: 'READY', position: 1, childIndex: -1},
            },
        });
        expect(nowStatus(state, 'Alice').headline).toBe('Seraphina hunts — blocked by Marcus');
        expect(nowStatus(state, 'Alice').awaited).toBe('Seraphina');
    });

    it('an active impulse window outranks the pending action and awaits the holder', () => {
        const state = makeState({
            pendingAction: {
                actorRef: {playerName: 'Seraphina', regionType: 'READY', position: 0, childIndex: -1},
                actionType: 'BLEED',
                targetPlayerName: 'Alice',
                status: 'DURING_ACTION',
                blockerRef: null,
            },
            impulseWindow: {
                active: true,
                context: 'DIRECTED_SINGLE',
                actingPlayer: 'Seraphina',
                currentImpulseHolder: 'Alice',
                passOrder: ['Seraphina', 'Alice', 'Marcus'],
                consecutivePasses: 0,
            },
        });
        expect(nowStatus(state, 'Alice')).toEqual({
            kind: 'impulse',
            headline: 'Your impulse — Seraphina bleeds → you — block window open',
            awaited: 'Alice',
            yourMove: true,
        });
        expect(nowStatus(state, 'Marcus').headline).toBe('Seraphina bleeds → Alice — block window open — waiting on Alice');
    });

    it('an impulse window without a pending action describes the acting player', () => {
        const state = makeState({
            impulseWindow: {
                active: true,
                context: 'COMBAT',
                actingPlayer: 'Marcus',
                currentImpulseHolder: 'Seraphina',
                passOrder: ['Marcus', 'Seraphina', 'Alice'],
                consecutivePasses: 1,
            },
        });
        expect(nowStatus(state, 'Alice').headline).toBe('Marcus acting (combat) — waiting on Seraphina');
    });

    it('a sequencing window outranks the phase fallback', () => {
        const state = makeState({
            sequencingWindow: {
                active: true,
                windowType: 'AFTER_RESOLUTION',
                passOrder: ['Seraphina', 'Alice', 'Marcus'],
                consecutivePasses: 0,
                currentHolder: 'Alice',
            },
        });
        expect(nowStatus(state, 'Alice')).toMatchObject({
            kind: 'sequencing',
            headline: 'Your sequencing priority (after resolution)',
            yourMove: true,
        });
        expect(nowStatus(state, 'Marcus').headline).toBe('Sequencing (after resolution) — waiting on Alice');
    });

    it('ignores inactive windows', () => {
        const state = makeState({
            impulseWindow: {active: false, context: 'UNDIRECTED', actingPlayer: 'Seraphina', currentImpulseHolder: 'Seraphina', passOrder: [], consecutivePasses: 0},
            sequencingWindow: {active: false, windowType: 'AS_ANNOUNCED', passOrder: [], consecutivePasses: 0, currentHolder: ''},
        });
        expect(nowStatus(state, 'Alice').kind).toBe('phase');
    });
});
