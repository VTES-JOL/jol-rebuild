import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, within} from 'storybook/test';

import {CommandLogContent} from '../features/chat/CommandLogContent.tsx';
import type {CommandContext, CommandLogData} from '../features/game/commandLog.ts';

const meta = {
    title: 'Chat/CommandLogContent',
    component: CommandLogContent,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof CommandLogContent>;

export default meta;

type Story = StoryObj<typeof meta>;

const visibleCard = {
    cardId: '200349',
    cardName: 'Dmitra Ilyanova',
    owner: 'Alice',
    region: 'UNCONTROLLED',
    position: 0,
    childIndex: -1,
    hidden: false,
};

const hiddenTopLevel = {
    cardId: null,
    cardName: null,
    owner: 'Alice',
    region: 'UNCONTROLLED',
    position: 4,
    childIndex: -1,
    hidden: true,
};

const hiddenChild = {
    cardId: null,
    cardName: null,
    owner: 'Bob',
    region: 'UNCONTROLLED',
    position: 2,
    childIndex: 0,
    hidden: true,
};

function ctx(command: CommandLogData, turn = '1.1', phase = 'HUNT', currentPlayer = 'Alice'): CommandContext {
    return {turn, phase, currentPlayer, command};
}

export const KnownCard: Story = {
    args: {
        log: ctx({ commandType: 'PLAY_CARD', actor: 'Alice', card: visibleCard } satisfies CommandLogData),
        detail: 'full',
    },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/Dmitra Ilyanova/)).toBeInTheDocument();
    },
};

export const HiddenCardTopLevel: Story = {
    args: {
        log: ctx({ commandType: 'PLAY_CARD', actor: 'Alice', card: hiddenTopLevel } satisfies CommandLogData),
        detail: 'full',
    },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/Alice's uncontrolled region \(#5\)/)).toBeInTheDocument();
    },
};

export const HiddenChildCard: Story = {
    args: {
        log: ctx({ commandType: 'ATTACH_CARD', actor: 'Bob', card: hiddenChild, target: hiddenTopLevel } satisfies CommandLogData),
        detail: 'full',
    },
    play: async ({canvasElement}) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/Bob's uncontrolled region \(#3\.1\)/)).toBeInTheDocument();
    },
};

export const BriefHidden: Story = {
    args: {
        log: ctx({ commandType: 'MOVE_CARD', actor: 'Alice', card: hiddenTopLevel, targetPlayer: 'Bob', targetRegion: 'ASH_HEAP' } satisfies CommandLogData),
        detail: 'brief',
    },
};
