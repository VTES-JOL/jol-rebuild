import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, fn, userEvent, within} from 'storybook/test';

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
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('This is a regular message.')).toBeInTheDocument();
        await userEvent.hover(canvas.getByText('This is a regular message.'));
        const replyBtn = await canvas.findByRole('button', { name: 'Reply to message' });
        await userEvent.click(replyBtn);
        await expect(args.onReply).toHaveBeenCalledOnce();
        await expect(args.onReply).toHaveBeenCalledWith(
            expect.objectContaining({ id: '1', sender: 'Alex' })
        );
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
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('What do you think?')).toBeInTheDocument();
        const quoteBtn = canvas.getByText('What do you think?').closest('button')!;
        await userEvent.click(quoteBtn);
        await expect(args.onJumpTo).toHaveBeenCalledWith('1');
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
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        // Both reaction pills visible with correct counts
        await expect(canvas.getByTitle('Alex, Jill')).toBeInTheDocument();
        await expect(canvas.getByTitle('Sam')).toBeInTheDocument();
        // Click the 👍 pill — calls onReact with messageId and emoji
        await userEvent.click(canvas.getByTitle('Alex, Jill'));
        await expect(args.onReact).toHaveBeenCalledWith('3', '👍');
    },
};