import {useState} from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import DeckListPanel from '../features/deck/DeckListPanel';
import type {Deck} from '../features/deck/types';

const meta = {
    title: 'Deck/DeckListPanel',
    component: DeckListPanel,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    args: {
        onNew: fn(),
    },
} satisfies Meta<typeof DeckListPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleDecks: Deck[] = [
    {
        id: '1',
        name: 'Weenie Animalism',
        summary: '12,80,4/5',
        comments: 'Fast aggravated damage with Gangrel and Nosferatu. Rush early, bleed late.',
        timestamp: new Date(Date.now() - 2 * 86_400_000).toISOString(),
        formatValidity: { STANDARD: true, DUEL: false, V5: false },
    },
    {
        id: '2',
        name: 'Political Ventrue',
        summary: '13,77,3/4',
        comments: 'Vote lock with Ventrue princes and Inner Circle members.',
        timestamp: new Date(Date.now() - 86_400_000).toISOString(),
        formatValidity: { STANDARD: true, DUEL: true, V5: true },
    },
    {
        id: '3',
        name: 'Ravnos Toolbox',
        summary: '12,78,5/6',
        comments: null,
        timestamp: new Date('2025-11-03').toISOString(),
        formatValidity: { STANDARD: true, DUEL: false, V5: true },
    },
    {
        id: '4',
        name: 'Blood Brothers Wall',
        summary: '12,80,3',
        comments: 'Defensive bloat with intercept and combat ends. Very hard to rush.',
        timestamp: new Date('2025-08-14').toISOString(),
        formatValidity: {},
    },
    {
        id: '5',
        name: 'Untitled Deck',
        summary: null,
        comments: null,
        timestamp: new Date(Date.now() - 3_600_000).toISOString(),
        formatValidity: {},
    },
];

export const Empty: Story = {
    args: {
        decks: [],
        selectedId: null,
        onSelect: fn(),
    },
};

export const WithDecks: Story = {
    args: {
        decks: sampleDecks,
        selectedId: null,
        onSelect: fn(),
    },
};

export const WithSelection: Story = {
    args: {
        decks: sampleDecks,
        selectedId: '2',
        onSelect: fn(),
    },
};

// Interactive story — selection state lives inside the story
export const Interactive: Story = {
    render: (args) => {
        const [selectedId, setSelectedId] = useState<string | null>(null);
        return (
            <div style={{ width: 280, height: 500 }}>
                <DeckListPanel
                    {...args}
                    decks={sampleDecks}
                    selectedId={selectedId}
                    onSelect={deck => setSelectedId(deck.id)}
                />
            </div>
        );
    },
    args: {
        decks: sampleDecks,
    },
};

// Stress test — many decks to verify scroll behaviour
const manyDecks: Deck[] = Array.from({ length: 20 }, (_, i) => ({
    id: String(100 + i),
    name: `Deck ${i + 1} — ${'ABCDEFGHIJKLMNOPQRST'[i]}`,
    summary: i % 4 !== 3 ? `${10 + i % 4},${76 + i % 6},${(i % 6) + 1}` : null,
    comments: i % 3 === 0 ? `Notes for deck ${i + 1} with a bit of descriptive text.` : null,
    timestamp: new Date(Date.now() - i * 3 * 86_400_000).toISOString(),
    formatValidity: (i % 3 === 0
        ? { STANDARD: true, DUEL: i % 6 === 0, V5: true }
        : i % 3 === 1
            ? { STANDARD: false, DUEL: false, V5: false }
            : {}) as Partial<Record<'STANDARD' | 'DUEL' | 'V5', boolean>>,
}));

export const ManyDecks: Story = {
    render: (args) => (
        <div style={{ width: 280, height: 500 }}>
            <DeckListPanel {...args} decks={manyDecks} />
        </div>
    ),
    args: {
        decks: manyDecks,
        selectedId: null,
        onSelect: fn(),
        onFilter: fn(),
    },
};
