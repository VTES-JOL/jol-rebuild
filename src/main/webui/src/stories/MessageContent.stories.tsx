import type {Meta, StoryObj} from '@storybook/react-vite';

import {MessageContent} from '../features/chat/MessageContent.tsx';

const meta = {
    title: 'Chat/MessageContent',
    component: MessageContent,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof MessageContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlainText: Story = {
    args: {
        content: 'Hello, this is a plain message.',
    },
};

export const WithTokens: Story = {
    args: {
        content: 'I played [card:100266:Bum\'s Rush] and then joined [game:10:Match #10].',
    },
};

export const LongMessage: Story = {
    args: {
        content:
            'This message is longer and includes multiple references like [card:200349:Dmitra Ilyanova] plus [game:7:Ranked Duel] to show wrapping behavior.',
    },
};