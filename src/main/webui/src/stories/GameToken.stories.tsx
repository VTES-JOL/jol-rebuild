import type {Meta, StoryObj} from '@storybook/react-vite';

import GameToken from '../shared/components/GameToken.tsx';

const meta = {
    title: 'Shared/GameToken',
    component: GameToken,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
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