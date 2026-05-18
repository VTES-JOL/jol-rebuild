import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {TextBoard} from '../features/game/TextBoard.tsx';
import type {GameState} from '../features/game/types.ts';
import playerViewData from './fixtures/game-player-view.json';

const playerGame = playerViewData as unknown as GameState;

const allPlayers = playerGame.playerOrder
    .map(name => playerGame.players.find(p => p.name === name)!)
    .filter(Boolean);

const meta = {
    title: 'Game/TextBoard',
    component: TextBoard,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    args: {
        gameId: 'story-game',
        onCommand: fn(),
    },
} satisfies Meta<typeof TextBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FivePlayer: Story = {
    args: {
        orderedPlayers: allPlayers,
        cards: playerGame.cards,
        currentUser: 'Player5',
    },
};

export const SinglePlayer: Story = {
    args: {
        orderedPlayers: allPlayers.slice(0, 1),
        cards: playerGame.cards,
        currentUser: allPlayers[0]?.name ?? '',
    },
};

export const TwoPlayer: Story = {
    args: {
        orderedPlayers: allPlayers.slice(0, 2),
        cards: playerGame.cards,
        currentUser: 'Player5',
    },
};

export const WithDragDrop: Story = {
    args: {
        orderedPlayers: allPlayers,
        cards: playerGame.cards,
        currentUser: 'Player5',
    },
};
