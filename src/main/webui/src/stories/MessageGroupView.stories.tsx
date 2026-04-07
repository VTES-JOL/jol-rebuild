import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';

import {MessageGroupView} from '../features/chat/MessageGroupView.tsx';

const meta = {
    title: 'Chat/MessageGroupView',
    component: MessageGroupView,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof MessageGroupView>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseGroup = {
    sender: 'Alex',
    shortTime: '10:02',
    lines: [
        {
            id: 1,
            content: 'Hello everyone!',
            reactions: [],
            replyTo: null,
        },
    ],
    dividerTimestamp: null,
    isSelf: false
};

export const SingleLine: Story = {
    args: {
        group: baseGroup,
        showLine: false,
        currentUser: 'Alex',
        onReact: fn(),
        onReply: fn(),
        onJumpTo: fn(),
        disabled: false,
        enableReactions: true,
        enableReply: true,
    },
};

export const WithReactions: Story = {
    args: {
        group: {
            ...baseGroup,
            lines: [
                {
                    id: 2,
                    content: 'I think [card:1:Fireball] is the play.',
                    reactions: [
                        {emoji: '👍', senders: ['Alex', 'Sam']},
                        {emoji: '❤️', senders: ['Jill']},
                    ],
                    replyTo: null,
                },
            ],
            dividerTimestamp: null,
            isSelf: false
        },
        showLine: true,
        currentUser: 'Alex',
        onReact: fn(),
        onReply: fn(),
        onJumpTo: fn(),
        disabled: false,
        enableReactions: true,
        enableReply: true,
    },
};

export const Disabled: Story = {
    args: {
        group: {
            ...baseGroup,
            sender: 'Sam',
            shortTime: '10:10',
            dividerTimestamp: null,
            isSelf: false
        },
        showLine: false,
        currentUser: 'Alex',
        onReact: fn(),
        onReply: fn(),
        onJumpTo: fn(),
        disabled: true,
        enableReactions: true,
        enableReply: true,
    },
};