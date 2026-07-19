import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, fn, within} from 'storybook/test';
import {Dock} from '../features/game/Dock.tsx';
import type {CardData, RegionState} from '../features/game/types.ts';
import {makeState} from './fixtures/gameState.ts';

const handCards: Record<string, CardData> = {
    h1: {id: 'h1', cardId: '100518', name: 'Deflection', type: 'Reaction'},
    h2: {id: 'h2', cardId: '100845', name: 'Govern the Unaligned', type: 'Action'},
    h3: {id: 'h3', cardId: '101321', name: 'Conditioning', type: 'Action Modifier'},
    h4: {id: 'h4', cardId: '100109', name: 'Blood Doll', type: 'Master'},
    h5: {id: 'h5', cardId: '101010', name: 'On the Qui Vive', type: 'Reaction'},
};

const hand: RegionState = {
    id: 'Alice-HAND',
    type: 'HAND',
    count: 5,
    visible: true,
    cardIds: ['h1', 'h2', 'h3', 'h4', 'h5'],
};

const meta = {
    title: 'Game/Dock',
    component: Dock,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    args: {
        playerName: 'Alice',
        hand,
        cards: handCards,
        gameState: makeState({cards: handCards}),
        gameId: 'g1',
        currentUser: 'Alice',
        onCommand: fn(),
        onOpenChat: fn(),
        chatUnread: 0,
    },
} satisfies Meta<typeof Dock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FannedHand: Story = {
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // The viewer's hand rides below the board as a fanned full-fidelity row.
        await expect(canvas.getByText('(5)')).toBeInTheDocument();
        await expect(canvas.getByRole('img', {name: 'Deflection'})).toBeInTheDocument();
        await expect(canvas.getByRole('img', {name: 'On the Qui Vive'})).toBeInTheDocument();
    },
};

export const MobileTabBar: Story = {
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // Below sm the Dock is a table/hand/chat tab bar (hidden at test width, but present).
        await expect(canvas.getByText('Table')).toBeInTheDocument();
        await expect(canvas.getByText('Hand (5)')).toBeInTheDocument();
        await expect(canvas.getByText('Chat')).toBeInTheDocument();
    },
};

export const ChatUnreadBadge: Story = {
    args: {chatUnread: 3},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('3')).toBeInTheDocument();
        await expect(canvas.getByLabelText('Open table talk, 3 unread')).toBeInTheDocument();
    },
};

export const SpectatorNoHand: Story = {
    args: {hand: null},
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        // Spectators get no hand — only the table and chat entry points remain.
        await expect(canvas.queryByText(/^Hand/)).not.toBeInTheDocument();
        await expect(canvas.getByText('Chat')).toBeInTheDocument();
    },
};
