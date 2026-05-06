import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';

import {MessageLineView} from '../features/chat/MessageLineView.tsx';

const meta = {
    title: 'Chat/MessageLineView',
    component: MessageLineView,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof MessageLineView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        line: {
            id: '1',
            content: 'This is a regular message.',
            reactions: [],
            replyTo: null,
        },
        sender: 'Alex',
        currentUser: 'Alex',
        onReact: fn(),
        onReply: fn(),
        onJumpTo: fn(),
        disabled: false,
        enableReactions: true,
        enableReply: true,
        isFirst: true,
    },
};

export const WithReplyQuote: Story = {
    args: {
        line: {
            id: '2',
            content: 'Replying to your question.',
            reactions: [],
            replyTo: {
                id: '1',
                sender: 'Sam',
                content: 'What do you think?',
            },
        },
        sender: 'Alex',
        currentUser: 'Alex',
        onReact: fn(),
        onReply: fn(),
        onJumpTo: fn(),
        disabled: false,
        enableReactions: true,
        enableReply: true,
        isFirst: true,
    },
};

export const WithReactions: Story = {
    args: {
        line: {
            id: '3',
            content: 'I played [card:100266:Bum\'s Rush] and it worked.',
            reactions: [
                { emoji: '👍', senders: ['Alex', 'Jill'] },
                { emoji: '😂', senders: ['Sam'] },
            ],
            replyTo: null,
        },
        sender: 'Alex',
        currentUser: 'Alex',
        onReact: fn(),
        onReply: fn(),
        onJumpTo: fn(),
        disabled: false,
        enableReactions: true,
        enableReply: true,
        isFirst: true,
    },
};