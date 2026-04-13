import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {MemoryRouter} from 'react-router';

import GameToken from '../shared/components/GameToken.tsx';
import {AuthContext} from '@/contexts/AuthContext';
import {LobbySocketProvider} from '@/contexts/LobbySocketContext';

const meta = {
    title: 'Shared/GameToken',
    component: GameToken,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <MemoryRouter>
                <AuthContext.Provider value={{
                    user: { username: 'TestUser' } as any,
                    loading: false,
                    login: fn(),
                    logout: fn(),
                    refresh: fn(),
                }}>
                    <LobbySocketProvider>
                        <div className="flex items-center justify-center p-8 bg-panel rounded-lg">
                            <Story />
                        </div>
                    </LobbySocketProvider>
                </AuthContext.Provider>
            </MemoryRouter>
        ),
    ],
} satisfies Meta<typeof GameToken>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        id: 10,
        label: 'Match #10',
    },
};

export const AnotherExample: Story = {
    args: {
        id: 99,
        label: 'Ranked Duel',
    },
};