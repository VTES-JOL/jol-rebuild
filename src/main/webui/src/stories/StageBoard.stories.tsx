import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, fn, waitFor, within} from 'storybook/test';
import {StageBoard} from '../features/game/StageBoard.tsx';
import type {PlayerState} from '../features/game/types.ts';
import {makeState, player, playerWithReady} from './fixtures/gameState.ts';

const seatOrder = ['Seraphina', 'Marcus', 'Alice', 'Isabel', 'Dmitri'];

const seatedPlayers: PlayerState[] = [
    player('Seraphina', {pool: 24, victoryPoints: 1}),
    player('Marcus', {pool: 11}),
    playerWithReady('Alice', ['m1'], {pool: 18}),
    player('Isabel'),
    player('Dmitri', {pool: 14}),
];

const gameState = makeState({
    playerOrder: seatOrder,
    players: seatedPlayers,
    currentPlayer: 'Seraphina',
    cards: {m1: {id: 'm1', cardId: '200183', name: 'Theo Bell', type: 'Vampire', crypt: true}},
});

const meta = {
    title: 'Game/StageBoard',
    component: StageBoard,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    args: {
        orderedPlayers: seatedPlayers,
        cards: gameState.cards,
        currentUser: 'Alice',
        gameState,
        gameId: 'g1',
        onCommand: fn(),
    },
} satisfies Meta<typeof StageBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

const atWidth = (width: number) => (Story: React.ComponentType) => (
    <div style={{width, height: 480}}>
        <Story />
    </div>
);

export const PhoneOneTableau: Story = {
    decorators: [atWidth(500)],
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByText('Alice')).toBeInTheDocument());
        await expect(canvas.getByText('you')).toBeInTheDocument();
        await expect(canvas.queryByText('Marcus')).not.toBeInTheDocument();
    },
};

export const TabletViewerPlusPrey: Story = {
    decorators: [atWidth(900)],
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByText('Isabel')).toBeInTheDocument());
        await expect(canvas.getByText('you')).toBeInTheDocument();
        await expect(canvas.getByText('prey')).toBeInTheDocument();
        await expect(canvas.queryByText('predator')).not.toBeInTheDocument();
    },
};

export const LaptopPredatorViewerPrey: Story = {
    decorators: [atWidth(1200)],
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(canvas.getByText('Marcus')).toBeInTheDocument());
        // Left to right: Marcus (predator) | Alice (you) | Isabel (prey).
        await expect(canvas.getByText('predator')).toBeInTheDocument();
        await expect(canvas.getByText('you')).toBeInTheDocument();
        await expect(canvas.getByText('prey')).toBeInTheDocument();
        await expect(canvas.queryByText('Dmitri')).not.toBeInTheDocument();
    },
};

export const UltrawideFourTableaus: Story = {
    decorators: [atWidth(1700)],
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // Grand-prey Dmitri joins as the fourth column.
        await waitFor(() => expect(canvas.getByText('Dmitri')).toBeInTheDocument());
        await expect(canvas.getByText('cross-table')).toBeInTheDocument();
        await expect(canvas.queryByText('Seraphina')).not.toBeInTheDocument();
    },
};

export const FullTableFiveTableaus: Story = {
    decorators: [atWidth(2100)],
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // Every seat on stage, viewer centered.
        await waitFor(() => expect(canvas.getByText('Seraphina')).toBeInTheDocument());
        for (const name of seatOrder) {
            await expect(canvas.getByText(name)).toBeInTheDocument();
        }
    },
};

export const FocusRequestSwapsSlot: Story = {
    decorators: [atWidth(1200)],
    args: {focusRequest: {name: 'Dmitri', seq: 1}},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // Dmitri is two seats toward prey from Alice → replaces the prey slot.
        await waitFor(() => expect(canvas.getByText('Dmitri')).toBeInTheDocument());
        await expect(canvas.getByText('Marcus')).toBeInTheDocument();
        await expect(canvas.queryByText('Isabel')).not.toBeInTheDocument();
    },
};

export const SpectatorView: Story = {
    decorators: [atWidth(1200)],
    args: {currentUser: 'someSpectator'},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // Spectators anchor on the first seat with a "focused" label.
        await waitFor(() => expect(canvas.getByText('focused')).toBeInTheDocument());
        await expect(canvas.queryByText('you')).not.toBeInTheDocument();
    },
};
