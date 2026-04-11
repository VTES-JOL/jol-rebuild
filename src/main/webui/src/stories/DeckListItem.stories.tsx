import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
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
    summary: '12,80,4/5',
    comments: 'Fast aggravated damage with Gangrel and Nosferatu. Rush early, bleed late.',
    timestamp: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    formatValidity: {},
};

const oldDeck = {
    id: 2,
    name: 'Political Ventrue',
    summary: '13,77,3/4',
    comments: 'Vote lock with Ventrue princes and Inner Circle members.',
    timestamp: new Date('2025-11-03').toISOString(),
    formatValidity: {},
};

export const Default: Story = {
    args: { deck: recentDeck, selected: false },
};

export const Selected: Story = {
    args: { deck: recentDeck, selected: true },
};

export const NoCommentsNoSummary: Story = {
    args: {
        deck: {
            id: 3,
            name: 'Untitled Deck',
            summary: null,
            comments: null,
            timestamp: new Date(Date.now() - 3_600_000).toISOString(),
            formatValidity: {},
        },
        selected: false,
    },
};

export const SummaryOnly: Story = {
    args: {
        deck: {
            id: 4,
            name: 'Ravnos Toolbox',
            summary: '12,78,5/6',
            comments: null,
            timestamp: new Date('2025-09-20').toISOString(),
            formatValidity: {},
        },
        selected: false,
    },
};

export const OldDate: Story = {
    args: { deck: oldDeck, selected: false },
};

export const AllFormatsValid: Story = {
    name: 'All Formats Valid',
    args: {
        deck: {
            id: 10,
            name: 'Duel Legal Deck',
            summary: '12,60,4/5',
            comments: 'Standard + Duel + V5 legal build.',
            timestamp: new Date(Date.now() - 86_400_000).toISOString(),
            formatValidity: { STANDARD: true, DUEL: true, V5: true },
        },
        selected: false,
    },
};

export const StandardOnlyValid: Story = {
    name: 'Standard Valid, Duel/V5 Invalid',
    args: {
        deck: {
            id: 11,
            name: 'Classic Weenie',
            summary: '12,80,4/5',
            comments: 'Legal for Standard but uses old-set cards not on Duel/V5 lists.',
            timestamp: new Date(Date.now() - 3 * 86_400_000).toISOString(),
            formatValidity: { STANDARD: true, DUEL: false, V5: false },
        },
        selected: false,
    },
};

export const AllFormatsInvalid: Story = {
    name: 'All Formats Invalid',
    args: {
        deck: {
            id: 12,
            name: 'Work in Progress',
            summary: '7,45,1/3/5',
            comments: 'Early draft — crypt thin, library short, groups scattered.',
            timestamp: new Date(Date.now() - 3_600_000).toISOString(),
            formatValidity: { STANDARD: false, DUEL: false, V5: false },
        },
        selected: false,
    },
};

export const InvalidCrypt: Story = {
    args: {
        deck: {
            id: 6,
            name: 'Underbuilt Animalism',
            summary: '8,80,4/5',
            comments: 'Still filling out the crypt — needs 4 more vampires.',
            timestamp: new Date(Date.now() - 86_400_000).toISOString(),
            formatValidity: { STANDARD: false, DUEL: false, V5: false },
        },
        selected: false,
    },
};

export const InvalidLibrary: Story = {
    args: {
        deck: {
            id: 7,
            name: 'Bloated Ventrue',
            summary: '13,95,3/4',
            comments: 'Too many library cards — needs trimming.',
            timestamp: new Date(Date.now() - 3 * 86_400_000).toISOString(),
            formatValidity: { STANDARD: false, DUEL: false, V5: false },
        },
        selected: false,
    },
};

export const InvalidGroups: Story = {
    args: {
        deck: {
            id: 8,
            name: 'Mixed Groups',
            summary: '12,78,2/4',
            comments: 'Non-consecutive groups — G2 and G4 are not adjacent.',
            timestamp: new Date('2025-12-01').toISOString(),
            formatValidity: { STANDARD: true, DUEL: false, V5: false },
        },
        selected: false,
    },
};
