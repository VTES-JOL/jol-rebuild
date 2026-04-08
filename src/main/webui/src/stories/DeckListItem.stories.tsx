import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import DeckListItem from '../features/deck/DeckListItem';

const meta = {
    title: 'Deck/DeckListItem',
    component: DeckListItem,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    args: {
        onClick: fn(),
    },
} satisfies Meta<typeof DeckListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

const recentDeck = {
    id: 1,
    name: 'Weenie Animalism',
    summary: 'Crypt: 12  Library: 80  Groups: 4/5',
    comments: 'Fast aggravated damage with Gangrel and Nosferatu. Rush early, bleed late.',
    timestamp: new Date(Date.now() - 2 * 86_400_000).toISOString(),
};

const oldDeck = {
    id: 2,
    name: 'Political Ventrue',
    summary: 'Crypt: 13  Library: 77  Groups: 3/4',
    comments: 'Vote lock with Ventrue princes and Inner Circle members.',
    timestamp: new Date('2025-11-03').toISOString(),
};

export const Default: Story = {
    args: {
        deck: recentDeck,
        selected: false,
    },
};

export const Selected: Story = {
    args: {
        deck: recentDeck,
        selected: true,
    },
};

export const NoCommentsNoSummary: Story = {
    args: {
        deck: {
            id: 3,
            name: 'Untitled Deck',
            summary: null,
            comments: null,
            timestamp: new Date(Date.now() - 3_600_000).toISOString(),
        },
        selected: false,
    },
};

export const SummaryOnly: Story = {
    args: {
        deck: {
            id: 4,
            name: 'Ravnos Toolbox',
            summary: 'Crypt: 12  Library: 78  Groups: 5/6',
            comments: null,
            timestamp: new Date('2025-09-20').toISOString(),
        },
        selected: false,
    },
};

export const LongComments: Story = {
    args: {
        deck: {
            id: 5,
            name: 'Blood Brothers Wall',
            summary: 'Crypt: 12  Library: 80  Groups: 3',
            comments:
                'Defensive bloat with intercept and combat ends. Very hard to rush. ' +
                'Relies on forming a circle early — needs at least 3 Blood Brothers ready by turn 4.',
            timestamp: oldDeck.timestamp,
        },
        selected: false,
    },
};

export const OldDate: Story = {
    args: {
        deck: oldDeck,
        selected: false,
    },
};