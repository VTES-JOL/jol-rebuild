import type {Meta, StoryObj} from '@storybook/react-vite';
import {CircularBoard} from '../features/game/CircularBoard.tsx';
import type {GameState} from '../features/game/types.ts';
import playerViewData from './fixtures/game-player-view.json';

const playerGame = playerViewData as unknown as GameState;

const allPlayers = playerGame.playerOrder
    .map(name => playerGame.players.find(p => p.name === name)!)
    .filter(Boolean);

const meta = {
    title: 'Game/CircularBoard',
    component: CircularBoard,
    parameters: {layout: 'centered'},
    tags: ['autodocs'],
} satisfies Meta<typeof CircularBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FivePlayer: Story = {
    args: {
        orderedPlayers: allPlayers,
        cards: playerGame.cards,
        currentUser: 'Player5',
        gameState: playerGame,
    },
};

export const FourPlayer: Story = {
    args: {
        orderedPlayers: allPlayers.slice(0, 4),
        cards: playerGame.cards,
        currentUser: 'Player5',
        gameState: {
            ...playerGame,
            playerOrder: playerGame.playerOrder.slice(0, 4),
        },
    },
};
