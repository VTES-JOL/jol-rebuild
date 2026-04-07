import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';

import {CardSuggestions} from '../features/chat/CardSuggestions.tsx';

const meta = {
    title: 'Chat/CardSuggestions',
    component: CardSuggestions,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof CardSuggestions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        suggestions: [
            {name: 'Fireball', id: 0},
            {name: 'Frost Nova', id: 1},
            {name: 'Ancient Dragon', id: 2},
        ],
        activeIndex: 0,
        onSelect: fn(),
    },
};

export const ActiveMiddle: Story = {
    args: {
        suggestions: [
            {name: 'Fireball', id: 0},
            {name: 'Frost Nova', id: 1},
            {name: 'Ancient Dragon', id: 2},
        ],
        activeIndex: 1,
        onSelect: fn(),
    },
};

export const EmptyState = {
    render: () => <div className="text-sm text-slate-400">No suggestions available.</div>,
};