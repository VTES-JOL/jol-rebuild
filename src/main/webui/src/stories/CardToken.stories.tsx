import type {Meta, StoryObj} from '@storybook/react-vite';

import {CardToken} from '../shared/components/CardToken.tsx';

const meta = {
    title: 'Shared/CardToken',
    component: CardToken,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof CardToken>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        id: 1,
        label: 'Fireball',
    },
};

export const LongLabel: Story = {
    args: {
        id: 42,
        label: 'Ancient Dragon',
    },
};