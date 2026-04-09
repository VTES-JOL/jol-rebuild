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
        id: 100266,
        label: 'Bum\'s Rush',
    },
};

export const LongLabel: Story = {
    args: {
        id: 200349,
        label: 'Dmitra Ilyanova',
    },
};