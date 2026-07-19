import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, fn, userEvent, within} from 'storybook/test';
import {RingStrip} from '../features/game/RingStrip.tsx';
import type {CardData} from '../features/game/types.ts';
import {makeState, player, playerWithReady} from './fixtures/gameState.ts';

const fivePlayerOrder = ['Seraphina', 'Marcus', 'Alice', 'Isabel', 'Dmitri'];

function fivePlayerState(overrides = {}) {
    return makeState({
        playerOrder: fivePlayerOrder,
        players: [
            player('Seraphina', {pool: 24, victoryPoints: 1, regions: handRegion('Seraphina', 7)}),
            player('Marcus', {pool: 11, regions: handRegion('Marcus', 5)}),
            player('Alice', {pool: 18, regions: handRegion('Alice', 7)}),
            player('Isabel', {pool: 30, regions: handRegion('Isabel', 6)}),
            player('Dmitri', {pool: 0, ousted: true}),
        ],
        edgeHolder: 'Seraphina',
        ...overrides,
    });
}

function handRegion(name: string, count: number) {
    return {HAND: {id: `${name}-HAND`, type: 'HAND' as const, count, visible: false, cardIds: []}};
}

const meta = {
    title: 'Game/RingStrip',
    component: RingStrip,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    args: {
        currentUser: 'Alice',
        onFocusPlayer: fn(),
    },
} satisfies Meta<typeof RingStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FivePlayers: Story = {
    args: {gameState: fivePlayerState()},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        const chips = canvas.getAllByRole('button');
        // Viewer is centered: seat order Seraphina→Marcus→Alice→Isabel→Dmitri rotates so Alice sits at index 2.
        await expect(chips.map(c => c.getAttribute('aria-label')?.split(',')[0])).toEqual(
            ['Seraphina', 'Marcus', 'Alice (you)', 'Isabel', 'Dmitri'],
        );
    },
};

export const TurnAndEdgeMarkers: Story = {
    args: {gameState: fivePlayerState()},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', {name: /Seraphina.*holds the Edge.*current turn/})).toBeInTheDocument();
        await expect(canvas.getByText('EDGE')).toBeInTheDocument();
    },
};

export const OustedPlayer: Story = {
    args: {gameState: fivePlayerState()},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', {name: 'Dmitri, ousted'})).toBeInTheDocument();
    },
};

export const ChipTapFocusesPlayer: Story = {
    args: {gameState: fivePlayerState()},
    play: async ({args, canvasElement}) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', {name: /^Marcus/}));
        await expect(args.onFocusPlayer).toHaveBeenCalledWith('Marcus');
    },
};

export const AwaitedPlayerPulses: Story = {
    args: {
        gameState: fivePlayerState({
            rulesEnforced: true,
            impulseWindow: {
                active: true,
                context: 'DIRECTED_SINGLE',
                actingPlayer: 'Seraphina',
                currentImpulseHolder: 'Isabel',
                passOrder: fivePlayerOrder,
                consecutivePasses: 0,
            },
        }),
    },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', {name: /Isabel.*awaiting their action/})).toBeInTheDocument();
    },
};

export const ReversedOrder: Story = {
    args: {gameState: fivePlayerState({orderReversed: true})},
    play: async ({canvasElement}) => {
        await expect(within(canvasElement).getAllByTitle('play direction (reversed)').length).toBeGreaterThan(0);
    },
};

export const SpectatorView: Story = {
    args: {gameState: fivePlayerState(), currentUser: 'someSpectator'},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        const chips = canvas.getAllByRole('button');
        // No rotation for spectators — seat order as-is, nobody marked "you".
        await expect(chips.map(c => c.getAttribute('aria-label')?.split(',')[0])).toEqual(fivePlayerOrder);
    },
};

const minionCards: Record<string, CardData> = {
    m1: {id: 'm1', cardId: '200183', name: 'Theo Bell', type: 'Vampire', crypt: true},
    m2: {id: 'm2', cardId: '200584', name: 'Beast, The Leatherface', type: 'Vampire', crypt: true, locked: true},
    m3: {id: 'm3', cardId: '200905', name: 'Lucinde, Alastor', type: 'Vampire', crypt: true},
};

export const WithMinionStrips: Story = {
    args: {
        gameState: fivePlayerState({
            cards: minionCards,
            players: [
                player('Seraphina', {pool: 24}),
                playerWithReady('Marcus', ['m1', 'm2', 'm3'], {pool: 11}),
                player('Alice', {pool: 18}),
                player('Isabel'),
                player('Dmitri', {pool: 0, ousted: true}),
            ],
        }),
    },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // Tier-2 density: ready minions appear as name strips (lg+ viewports), locked ones marked.
        await expect(canvas.getByTitle('Theo Bell')).toBeInTheDocument();
        await expect(canvas.getByTitle('Beast, The Leatherface (locked)')).toBeInTheDocument();
    },
};

export const MiniTableauTier: Story = {
    args: {
        gameState: fivePlayerState({
            cards: {
                ...minionCards,
                m1: {...minionCards.m1, counters: 5},
                m2: {...minionCards.m2, counters: 2},
            },
            players: [
                player('Seraphina', {pool: 24}),
                playerWithReady('Marcus', ['m1', 'm2'], {
                    pool: 11,
                    regions: {
                        READY: {id: 'Marcus-READY', type: 'READY', count: 2, visible: true, cardIds: ['m1', 'm2']},
                        TORPOR: {id: 'Marcus-TORPOR', type: 'TORPOR', count: 1, visible: true, cardIds: ['m3']},
                        UNCONTROLLED: {id: 'Marcus-UNC', type: 'UNCONTROLLED', count: 3, visible: false, cardIds: []},
                    },
                }),
                player('Alice', {pool: 18}),
                player('Isabel'),
                player('Dmitri', {pool: 0, ousted: true}),
            ],
        }),
    },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // Tier-3 density (≥1600px): blood totals join the strips, torpor and
        // uncontrolled counts join the chip — all redundantly encoded for AT.
        await expect(canvas.getByTitle('Theo Bell, 5 blood')).toBeInTheDocument();
        await expect(canvas.getByTitle('Beast, The Leatherface, 2 blood (locked)')).toBeInTheDocument();
        await expect(canvas.getByRole('button', {name: /Marcus.*1 in torpor.*3 uncontrolled/})).toBeInTheDocument();
        await expect(canvas.getByTitle('minions in torpor')).toHaveTextContent('torpor 1');
        await expect(canvas.getByTitle('uncontrolled cards')).toHaveTextContent('uncontrolled 3');
    },
};
