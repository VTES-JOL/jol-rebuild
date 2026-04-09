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
    { cardId: '200183', name: 'Beckett',                   count: 2, isCrypt: true,  types: ['Vampire'],  group: '3', banned: false },
    { cardId: '200584', name: 'Hektor',                     count: 1, isCrypt: true,  types: ['Vampire'],  group: '2', banned: false },
    { cardId: '200905', name: 'Malgorzata',                count: 2, isCrypt: true,  types: ['Vampire'],  group: '2', banned: false },
    { cardId: '201362', name: 'Theo Bell',                 count: 2, isCrypt: true,  types: ['Vampire'],  group: '2', banned: false },
    { cardId: '200076', name: 'Anarch Convert',            count: 3, isCrypt: true,  types: ['Vampire'],  group: 'ANY', banned: false },
    { cardId: '201509', name: 'Zoe',                       count: 2, isCrypt: true,  types: ['Imbued'],   group: '4', banned: false },
];

const libraryEntries: DeckEntry[] = [
    { cardId: '100845',  name: 'Govern the Unaligned',     count: 4, isCrypt: false, types: ['Action'],              banned: false },
    { cardId: '100401',  name: 'Conditioning',             count: 3, isCrypt: false, types: ['Action Modifier'],     banned: false },
    { cardId: '100518',  name: 'Deflection',               count: 4, isCrypt: false, types: ['Reaction'],            banned: false },
    { cardId: '100788',  name: 'Freak Drive',              count: 3, isCrypt: false, types: ['Action Modifier'],     banned: false },
    { cardId: '101217',  name: 'Minion Tap',               count: 3, isCrypt: false, types: ['Master'],              banned: false },
    { cardId: '102121',  name: 'Villein',                  count: 5, isCrypt: false, types: ['Master'],              banned: false },
    { cardId: '101353',  name: 'Parity Shift',             count: 4, isCrypt: false, types: ['Political Action'],    banned: false },
    { cardId: '101056',  name: 'Kine Resources Contested', count: 3, isCrypt: false, types: ['Political Action'],    banned: false },
    { cardId: '101945',  name: 'Taste of Vitae',           count: 3, isCrypt: false, types: ['Combat'],              banned: false },
    { cardId: '100959', name: 'Immortal Grapple',         count: 2, isCrypt: false, types: ['Combat'],              banned: false },
    { cardId: '101518', name: 'Punish',                count: 2, isCrypt: false, types: ['Action', 'Combat'],    banned: false },
    { cardId: '101261', name: 'Mylan Horseed',            count: 2, isCrypt: false, types: ['Ally'],                banned: false },
];

const withBanned: DeckEntry[] = [
    ...cryptEntries,
    { cardId: '101620', name: 'Return to Innocence, The', count: 1, isCrypt: false, types: ['Action'], banned: true },
    ...libraryEntries,
];

// Stub search pool — field names match CardSuggestionDto from the backend
const searchPool: CardSearchResult[] = [
    { id: '200874', name: 'Lucita',               crypt: true,  group: '3',    cryptType: 'Vampire', types: [],         banned: false },
    { id: '200407', name: 'Elena Gutierrez',          crypt: true,  group: '6',    cryptType: 'Vampire', types: [],         banned: false },
    { id: '200858', name: 'Lorenzo Detuono',      crypt: true,  group: '3',    cryptType: 'Vampire', types: [],         banned: false },
    { id: '200076', name: 'Anarch Convert',       crypt: true,  group: 'ANY',  cryptType: 'Vampire', types: [],         banned: false },
    { id: '101089', name: 'Legal Manipulations',  crypt: false, group: null,   cryptType: null,       types: ['Action'], banned: false },
    { id: '101112', name: 'Liquidation',          crypt: false, group: null,   cryptType: null,       types: ['Master'], banned: false },
    { id: '101134', name: 'Lure of the Serpent', crypt: false, group: null,   cryptType: null,       types: ['Master'], banned: true  },
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
            const existing = prev.find(e => e.cardId === result.id);
            if (existing) return prev.map(e => e.cardId === result.id ? { ...e, count: e.count + 1 } : e);
            const newEntry: DeckEntry = {
                cardId:  result.id,
                name:    result.name,
                count:   1,
                isCrypt: result.crypt,
                types:   result.crypt ? [result.cryptType ?? 'Vampire'] : result.types,
                group:   result.group ?? undefined,
                banned:  result.banned,
            };
            return [...prev, newEntry];
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
    { cardId: '200183', name: 'Beckett',        count: 2, isCrypt: true,  types: ['Vampire'], group: '2', banned: false },
    { cardId: '200424', name: 'Enkidu, The Noah',          count: 2, isCrypt: true,  types: ['Vampire'], group: '4', banned: false },
    { cardId: '200905', name: 'Malgorzata',     count: 2, isCrypt: true,  types: ['Vampire'], group: '6', banned: false },
    { cardId: '100845', name: 'Govern the Unaligned', count: 8, isCrypt: false, types: ['Action'], banned: false },
    { cardId: '100518', name: 'Deflection',     count: 8, isCrypt: false, types: ['Reaction'], banned: false },
    { cardId: '100401', name: 'Conditioning',   count: 8, isCrypt: false, types: ['Action Modifier'], banned: false },
    { cardId: '102121', name: 'Villein',        count: 8, isCrypt: false, types: ['Master'], banned: false },
    { cardId: '101353', name: 'Parity Shift',   count: 8, isCrypt: false, types: ['Political Action'], banned: false },
    { cardId: '101945', name: 'Taste of Vitae', count: 8, isCrypt: false, types: ['Combat'], banned: false },
    { cardId: '100959', name: 'Immortal Grapple', count: 8, isCrypt: false, types: ['Combat'], banned: false },
    { cardId: '100788', name: 'Freak Drive',    count: 8, isCrypt: false, types: ['Action Modifier'], banned: false },
    { cardId: '101217', name: 'Minion Tap',     count: 8, isCrypt: false, types: ['Master'], banned: false },
    { cardId: '101056', name: 'Kine Resources Contested', count: 8, isCrypt: false, types: ['Political Action'], banned: false },
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
