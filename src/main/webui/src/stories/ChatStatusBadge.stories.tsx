import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChatStatusBadge } from '../features/chat/ChatStatusBadge.tsx';

const meta = {
    title: 'Chat/ChatStatusBadge',
    component: ChatStatusBadge,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ChatStatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Connecting: Story = {
    args: { status: 'connecting' },
};

export const Connected: Story = {
    args: { status: 'connected' },
};

export const Disconnected: Story = {
    args: { status: 'disconnected' },
};

export const Error: Story = {
    args: { status: 'error' },
};