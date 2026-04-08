import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import DeckEditorPanel from '../features/deck/DeckEditorPanel';
import type { CardSearchResult, DeckEntry } from '../features/deck/types';

const meta = {
    title: 'Deck/DeckEditorPanel',
    component: DeckEditorPanel,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof DeckEditorPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Fixture data ──────────────────────────────────────────────────────────────

const cryptEntries: DeckEntry[] = [
    { cardId: 'c-1', name: 'Beckett',                   count: 2, isCrypt: true,  types: ['Vampire'],  group: '3', banned: false },
    { cardId: 'c-2', name: 'Enkil',                     count: 1, isCrypt: true,  types: ['Vampire'],  group: '2', banned: false },
    { cardId: 'c-3', name: 'Malgorzata',                count: 2, isCrypt: true,  types: ['Vampire'],  group: '2', banned: false },
    { cardId: 'c-4', name: 'Theo Bell',                 count: 2, isCrypt: true,  types: ['Vampire'],  group: '2', banned: false },
    { cardId: 'c-5', name: 'Anarch Convert',            count: 3, isCrypt: true,  types: ['Vampire'],  group: 'ANY', banned: false },
    { cardId: 'c-6', name: 'Zoe',                       count: 2, isCrypt: true,  types: ['Imbued'],   group: '4', banned: false },
];

const libraryEntries: DeckEntry[] = [
    { cardId: 'l-1',  name: 'Govern the Unaligned',     count: 4, isCrypt: false, types: ['Action'],              banned: false },
    { cardId: 'l-2',  name: 'Conditioning',             count: 3, isCrypt: false, types: ['Action Modifier'],     banned: false },
    { cardId: 'l-3',  name: 'Deflection',               count: 4, isCrypt: false, types: ['Reaction'],            banned: false },
    { cardId: 'l-4',  name: 'Freak Drive',              count: 3, isCrypt: false, types: ['Action Modifier'],     banned: false },
    { cardId: 'l-5',  name: 'Minion Tap',               count: 3, isCrypt: false, types: ['Master'],              banned: false },
    { cardId: 'l-6',  name: 'Villein',                  count: 5, isCrypt: false, types: ['Master'],              banned: false },
    { cardId: 'l-7',  name: 'Parity Shift',             count: 4, isCrypt: false, types: ['Political Action'],    banned: false },
    { cardId: 'l-8',  name: 'Kine Resources Contested', count: 3, isCrypt: false, types: ['Political Action'],    banned: false },
    { cardId: 'l-9',  name: 'Taste of Vitae',           count: 3, isCrypt: false, types: ['Combat'],              banned: false },
    { cardId: 'l-10', name: 'Immortal Grapple',         count: 2, isCrypt: false, types: ['Combat'],              banned: false },
    { cardId: 'l-11', name: 'Versatile',                count: 2, isCrypt: false, types: ['Action', 'Combat'],    banned: false },
    { cardId: 'l-12', name: 'Mylan Horseed',            count: 2, isCrypt: false, types: ['Ally'],                banned: false },
];

const withBanned: DeckEntry[] = [
    ...cryptEntries,
    { cardId: 'l-banned', name: 'Heart of Nizchetus', count: 1, isCrypt: false, types: ['Equipment'], banned: true },
    ...libraryEntries,
];

// Stub search pool
const searchPool: CardSearchResult[] = [
    { cardId: 'c-10', name: 'Lucita',                isCrypt: true,  types: ['Vampire'],         group: '3', banned: false },
    { cardId: 'c-11', name: 'Lena Ritter',           isCrypt: true,  types: ['Vampire'],         group: '6', banned: false },
    { cardId: 'c-12', name: 'Lorenzo Detuono',       isCrypt: true,  types: ['Vampire'],         group: '3', banned: false },
    { cardId: 'l-20', name: 'Legal Manipulations',   isCrypt: false, types: ['Action'],                      banned: false },
    { cardId: 'l-21', name: 'Liquidation',           isCrypt: false, types: ['Master'],                      banned: false },
    { cardId: 'l-22', name: 'Lure of the Darkside',  isCrypt: false, types: ['Master'],                      banned: true  },
];

function mockSearch(q: string): Promise<CardSearchResult[]> {
    return Promise.resolve(
        searchPool.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function useDeckState(initial: DeckEntry[]) {
    const [entries, setEntries] = useState<DeckEntry[]>(initial);

    const onAddCard = (result: CardSearchResult) =>
        setEntries(prev => {
            const existing = prev.find(e => e.cardId === result.cardId);
            if (existing) return prev.map(e => e.cardId === result.cardId ? { ...e, count: e.count + 1 } : e);
            return [...prev, { ...result, count: 1 }];
        });

    const onIncrement = (cardId: string) =>
        setEntries(prev => prev.map(e => e.cardId === cardId ? { ...e, count: e.count + 1 } : e));

    const onDecrement = (cardId: string) =>
        setEntries(prev => {
            const entry = prev.find(e => e.cardId === cardId);
            if (!entry) return prev;
            return entry.count === 1
                ? prev.filter(e => e.cardId !== cardId)
                : prev.map(e => e.cardId === cardId ? { ...e, count: e.count - 1 } : e);
        });

    return { entries, onAddCard, onIncrement, onDecrement };
}

// ── Stories ───────────────────────────────────────────────────────────────────

export const Empty: Story = {
    render: () => {
        const state = useDeckState([]);
        return (
            <div style={{ width: 400, height: 600 }}>
                <DeckEditorPanel {...state} onSearch={mockSearch} />
            </div>
        );
    },
    args: { entries: [], onAddCard: fn(), onIncrement: fn(), onDecrement: fn(), onSearch: fn() },
};

export const CryptOnly: Story = {
    render: () => {
        const state = useDeckState(cryptEntries);
        return (
            <div style={{ width: 400, height: 600 }}>
                <DeckEditorPanel {...state} onSearch={mockSearch} />
            </div>
        );
    },
    args: { entries: cryptEntries, onAddCard: fn(), onIncrement: fn(), onDecrement: fn(), onSearch: fn() },
};

export const FullDeck: Story = {
    render: () => {
        const state = useDeckState([...cryptEntries, ...libraryEntries]);
        return (
            <div style={{ width: 400, height: 600 }}>
                <DeckEditorPanel {...state} onSearch={mockSearch} />
            </div>
        );
    },
    args: { entries: [...cryptEntries, ...libraryEntries], onAddCard: fn(), onIncrement: fn(), onDecrement: fn(), onSearch: fn() },
};

export const WithBannedCard: Story = {
    render: () => {
        const state = useDeckState(withBanned);
        return (
            <div style={{ width: 400, height: 600 }}>
                <DeckEditorPanel {...state} onSearch={mockSearch} />
            </div>
        );
    },
    args: { entries: withBanned, onAddCard: fn(), onIncrement: fn(), onDecrement: fn(), onSearch: fn() },
};

// Deck with invalid summary — thin crypt, library over limit, non-consecutive groups
const invalidEntries: DeckEntry[] = [
    { cardId: 'c-1', name: 'Beckett',        count: 2, isCrypt: true,  types: ['Vampire'], group: '2', banned: false },
    { cardId: 'c-2', name: 'Enkil',          count: 2, isCrypt: true,  types: ['Vampire'], group: '4', banned: false },
    { cardId: 'c-3', name: 'Malgorzata',     count: 2, isCrypt: true,  types: ['Vampire'], group: '6', banned: false },
    { cardId: 'l-1', name: 'Govern the Unaligned', count: 8, isCrypt: false, types: ['Action'], banned: false },
    { cardId: 'l-2', name: 'Deflection',     count: 8, isCrypt: false, types: ['Reaction'], banned: false },
    { cardId: 'l-3', name: 'Conditioning',   count: 8, isCrypt: false, types: ['Action Modifier'], banned: false },
    { cardId: 'l-4', name: 'Villein',        count: 8, isCrypt: false, types: ['Master'], banned: false },
    { cardId: 'l-5', name: 'Parity Shift',   count: 8, isCrypt: false, types: ['Political Action'], banned: false },
    { cardId: 'l-6', name: 'Taste of Vitae', count: 8, isCrypt: false, types: ['Combat'], banned: false },
    { cardId: 'l-7', name: 'Immortal Grapple', count: 8, isCrypt: false, types: ['Combat'], banned: false },
    { cardId: 'l-8', name: 'Freak Drive',    count: 8, isCrypt: false, types: ['Action Modifier'], banned: false },
    { cardId: 'l-9', name: 'Minion Tap',     count: 8, isCrypt: false, types: ['Master'], banned: false },
    { cardId: 'l-10', name: 'Kine Resources Contested', count: 8, isCrypt: false, types: ['Political Action'], banned: false },
];

export const InvalidDeck: Story = {
    render: () => {
        const state = useDeckState(invalidEntries);
        return (
            <div style={{ width: 400, height: 600 }}>
                <DeckEditorPanel {...state} onSearch={mockSearch} />
            </div>
        );
    },
    args: { entries: invalidEntries, onAddCard: fn(), onIncrement: fn(), onDecrement: fn(), onSearch: fn() },
};

// Fully interactive — type "l" in the search box to see results
export const Interactive: Story = {
    render: () => {
        const state = useDeckState([...cryptEntries, ...libraryEntries]);
        return (
            <div style={{ width: 400, height: 600 }}>
                <DeckEditorPanel {...state} onSearch={mockSearch} />
            </div>
        );
    },
    args: { entries: [], onAddCard: fn(), onIncrement: fn(), onDecrement: fn(), onSearch: fn() },
};
