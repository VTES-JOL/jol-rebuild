import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, fn, userEvent, within} from 'storybook/test';
import {NowPanel} from '../features/game/NowPanel.tsx';
import {makeState, player, playerWithReady} from './fixtures/gameState.ts';

const meta = {
    title: 'Game/NowPanel',
    component: NowPanel,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    args: {
        gameId: 'g1',
        currentUser: 'Alice',
        onCommand: fn(),
        isSpectator: false,
    },
} satisfies Meta<typeof NowPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpponentsTurn: Story = {
    args: {gameState: makeState()},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("Seraphina's Minion phase")).toBeInTheDocument();
    },
};

export const YourTurn: Story = {
    args: {gameState: makeState({currentPlayer: 'Alice'})},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Your Minion phase')).toBeInTheDocument();
    },
};

export const AdvancePhasePermissive: Story = {
    args: {gameState: makeState({currentPlayer: 'Alice'})},
    play: async ({args, canvasElement}) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', {name: 'Advance phase'}));
        await expect(args.onCommand).toHaveBeenCalledWith({type: 'ADVANCE_PHASE', gameId: 'g1'});
    },
};

export const EnforcedHidesAdvance: Story = {
    args: {gameState: makeState({rulesEnforced: true})},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('button', {name: /Advance phase/})).not.toBeInTheDocument();
    },
};

export const InfluenceTransfers: Story = {
    args: {gameState: makeState({currentPlayer: 'Alice', phase: 'INFLUENCE', transfersRemaining: 3})},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('3T')).toBeInTheDocument();
    },
};

export const BlockWindowOnYou: Story = {
    args: {
        gameState: makeState({
            rulesEnforced: true,
            players: [player('Seraphina'), playerWithReady('Alice', ['c1']), player('Marcus')],
            pendingAction: {
                actorRef: {playerName: 'Seraphina', regionType: 'READY', position: 0, childIndex: -1},
                actionType: 'BLEED',
                targetPlayerName: 'Alice',
                status: 'DURING_ACTION',
                blockerRef: null,
            },
        }),
    },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Seraphina bleeds → you — block window open')).toBeInTheDocument();
        // The composed action panel carries the responses.
        await expect(canvas.getByRole('button', {name: /Block/})).toBeInTheDocument();
    },
};

export const TargetedByServerFlag: Story = {
    args: {
        gameState: makeState({
            rulesEnforced: true,
            youAreAwaited: true,
            youAreTargeted: true,
            players: [player('Seraphina'), playerWithReady('Alice', ['c1']), player('Marcus')],
            pendingAction: {
                actorRef: {playerName: 'Seraphina', regionType: 'READY', position: 0, childIndex: -1},
                actionType: 'BLEED',
                targetPlayerName: 'Alice',
                status: 'DURING_ACTION',
                blockerRef: null,
            },
        }),
    },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // The server-derived flags drive the strongest treatment: red is semantic.
        await expect(canvas.getByText('targeted')).toBeInTheDocument();
    },
};

export const YourImpulse: Story = {
    args: {
        gameState: makeState({
            rulesEnforced: true,
            impulseWindow: {
                active: true,
                context: 'COMBAT',
                actingPlayer: 'Seraphina',
                currentImpulseHolder: 'Alice',
                passOrder: ['Seraphina', 'Alice', 'Marcus'],
                consecutivePasses: 0,
            },
        }),
    },
    play: async ({args, canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/Your impulse/)).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('button', {name: 'Pass'}));
        await expect(args.onCommand).toHaveBeenCalledWith({type: 'PASS_IMPULSE', gameId: 'g1', playerName: 'Alice'});
    },
};

export const WaitingOnAnotherPlayer: Story = {
    args: {
        gameState: makeState({
            rulesEnforced: true,
            impulseWindow: {
                active: true,
                context: 'UNDIRECTED',
                actingPlayer: 'Seraphina',
                currentImpulseHolder: 'Marcus',
                passOrder: ['Seraphina', 'Alice', 'Marcus'],
                consecutivePasses: 1,
            },
        }),
    },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/waiting on Marcus/)).toBeInTheDocument();
    },
};

export const SequencingWindow: Story = {
    args: {
        gameState: makeState({
            rulesEnforced: true,
            sequencingWindow: {
                active: true,
                windowType: 'AFTER_RESOLUTION',
                passOrder: ['Seraphina', 'Alice', 'Marcus'],
                consecutivePasses: 0,
                currentHolder: 'Alice',
            },
        }),
    },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Your sequencing priority (after resolution)')).toBeInTheDocument();
    },
};

export const WithEdgeHolder: Story = {
    args: {gameState: makeState({edgeHolder: 'Marcus'})},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByTitle('Marcus holds the Edge')).toBeInTheDocument();
    },
};
