import type {GameState, PlayerState} from '../../features/game/types.ts';

export function player(name: string, overrides: Partial<PlayerState> = {}): PlayerState {
    return {
        name, pool: 30, victoryPoints: 0, ousted: false, prey: null, predator: null, notes: null, choice: null,
        regions: {},
        ...overrides,
    };
}

/** A player whose READY region holds the given card ids (visible to all, as READY always is). */
export function playerWithReady(name: string, readyCards: string[], overrides: Partial<PlayerState> = {}): PlayerState {
    return player(name, {
        regions: {READY: {id: `${name}-READY`, type: 'READY', count: readyCards.length, visible: true, cardIds: readyCards}},
        ...overrides,
    });
}

export function makeState(overrides: Partial<GameState> = {}): GameState {
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
        rulesEnforced: false,
        ...overrides,
    };
}
