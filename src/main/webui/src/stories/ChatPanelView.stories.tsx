import type {Meta, StoryObj} from '@storybook/react-vite';
import {MemoryRouter} from 'react-router';
import {fn} from 'storybook/test';

import {ChatPanelView, type ChatPanelViewProps} from '../features/chat/ChatPanelView.tsx';
import {AuthContext} from '@/contexts/AuthContext';
import {LobbySocketProvider} from '@/contexts/LobbySocketContext';

const meta = {
    title: 'Chat/ChatPanelView',
    component: ChatPanelView,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <MemoryRouter>
                <AuthContext.Provider value={{
                    user: { username: 'Alex' } as any,
                    loading: false,
                    login: fn(),
                    logout: fn(),
                    refresh: fn(),
                }}>
                    <LobbySocketProvider>
                        <Story />
                    </LobbySocketProvider>
                </AuthContext.Provider>
            </MemoryRouter>
        ),
    ],
} satisfies Meta<ChatPanelViewProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Connecting: Story = {
    args: {
        title: 'Chat',
        status: 'connecting',
        messages: [],
        currentUser: 'Alex',
        onCancelReply: () => {},
        onSend: () => {},
        onReact: () => {},
        placeholder: 'Type a message…',
        enableReactions: true,
        enableReply: true,
    },
};

export const EmptyConnected: Story = {
    args: {
        title: 'Chat',
        status: 'connected',
        messages: [],
        currentUser: 'Alex',
        onCancelReply: () => {},
        onSend: () => {},
        onReact: () => {},
        placeholder: 'Type a message…',
        enableReactions: true,
        enableReply: true,
    },
};

export const WithHistory: Story = {
    args: {
        title: 'Chat',
        status: 'connected',
        messages: [
            {
                type: 'CHAT',
                id: 1,
                sender: 'Alex',
                content: 'Hello everyone!',
                timestamp: '2026-04-07T10:02:00Z',
                reactions: [],
            },
            {
                type: 'CHAT',
                id: 2,
                sender: 'Sam',
                content: 'I played [card:100266:Bum\'s Rush] earlier.',
                timestamp: '2026-04-07T10:03:00Z',
                reactions: [],
            },
        ],
        currentUser: 'Alex',
        onCancelReply: () => {},
        onSend: () => {},
        onReact: () => {},
        placeholder: 'Type a message…',
        enableReactions: true,
        enableReply: true,
    },
};

export const WithGroupedMessages: Story = {
    args: {
        title: 'Chat',
        status: 'connected',
        messages: [
            {
                type: 'CHAT',
                id: 1,
                sender: 'Alex',
                content: 'First message in the group.',
                timestamp: '2026-04-07T10:02:00Z',
                reactions: [],
            },
            {
                type: 'CHAT',
                id: 2,
                sender: 'Alex',
                content: 'Second message in the same group.',
                timestamp: '2026-04-07T10:02:30Z',
                reactions: [],
            },
            {
                type: 'CHAT',
                id: 3,
                sender: 'Sam',
                content: 'A separate sender group.',
                timestamp: '2026-04-07T10:05:00Z',
                reactions: [],
            },
            {
                type: 'CHAT',
                id: 4,
                sender: 'Sam',
                content: 'Another line from Sam in the same group.',
                timestamp: '2026-04-07T10:05:20Z',
                reactions: [],
            },
        ],
        currentUser: 'Alex',
        onCancelReply: () => {},
        onSend: () => {},
        onReact: () => {},
        placeholder: 'Type a message…',
        enableReactions: true,
        enableReply: true,
    },
};

export const WithReplyState: Story = {
    args: {
        title: 'Chat',
        status: 'connected',
        messages: [
            {
                type: 'CHAT',
                id: 1,
                sender: 'Alex',
                content: 'What should I do next?',
                timestamp: '2026-04-07T10:02:00Z',
                reactions: [],
            },
        ],
        currentUser: 'Alex',
        onCancelReply: () => {},
        onSend: () => {},
        onReact: () => {},
        placeholder: 'Type a message…',
        enableReactions: true,
        enableReply: true,
    },
};