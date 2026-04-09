import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import DeckEditorPanel from '../features/deck/DeckEditorPanel';
import type { CardDetailData, DeckEntry } from '../features/deck/types';

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
    { cardId: '200183', name: 'Beckett',                   count: 2, isCrypt: true,  types: ['Vampire'],  group: '3',   banned: false },
    { cardId: '200584', name: 'Hektor',                    count: 1, isCrypt: true,  types: ['Vampire'],  group: '2',   banned: false },
    { cardId: '200905', name: 'Malgorzata',                count: 2, isCrypt: true,  types: ['Vampire'],  group: '2',   banned: false },
    { cardId: '201362', name: 'Theo Bell',                 count: 2, isCrypt: true,  types: ['Vampire'],  group: '2',   banned: false },
    { cardId: '200076', name: 'Anarch Convert',            count: 3, isCrypt: true,  types: ['Vampire'],  group: 'ANY', banned: false },
    { cardId: '201509', name: 'Zoe',                       count: 2, isCrypt: true,  types: ['Imbued'],   group: '4',   banned: false },
];

const libraryEntries: DeckEntry[] = [
    { cardId: '100845', name: 'Govern the Unaligned',      count: 4, isCrypt: false, types: ['Action'],           banned: false },
    { cardId: '100401', name: 'Conditioning',              count: 3, isCrypt: false, types: ['Action Modifier'],  banned: false },
    { cardId: '100518', name: 'Deflection',                count: 4, isCrypt: false, types: ['Reaction'],         banned: false },
    { cardId: '100788', name: 'Freak Drive',               count: 3, isCrypt: false, types: ['Action Modifier'],  banned: false },
    { cardId: '101217', name: 'Minion Tap',                count: 3, isCrypt: false, types: ['Master'],           banned: false },
    { cardId: '102121', name: 'Villein',                   count: 5, isCrypt: false, types: ['Master'],           banned: false },
    { cardId: '101353', name: 'Parity Shift',              count: 4, isCrypt: false, types: ['Political Action'], banned: false },
    { cardId: '101056', name: 'Kine Resources Contested',  count: 3, isCrypt: false, types: ['Political Action'], banned: false },
    { cardId: '101945', name: 'Taste of Vitae',            count: 3, isCrypt: false, types: ['Combat'],           banned: false },
    { cardId: '100959', name: 'Immortal Grapple',          count: 2, isCrypt: false, types: ['Combat'],           banned: false },
    { cardId: '101518', name: 'Punish',                    count: 2, isCrypt: false, types: ['Action', 'Combat'], banned: false },
    { cardId: '101261', name: 'Mylan Horseed',             count: 2, isCrypt: false, types: ['Ally'],             banned: false },
];

const withBanned: DeckEntry[] = [
    ...cryptEntries,
    { cardId: '101620', name: 'Return to Innocence, The',  count: 1, isCrypt: false, types: ['Action'], banned: true },
    ...libraryEntries,
];

// ── Icon fixture data ─────────────────────────────────────────────────────────
// Realistic icon data for each card used in the stories.
// Disciplines: lowercase = inferior, UPPERCASE = superior (matches DisciplineIcon convention).

const noIcons = (id: string, crypt: boolean): CardDetailData => ({
    id, name: id, crypt,
    types: [], group: null, banned: false,
    clan: null, path: null, capacity: null, disciplines: [],
    andDisciplines: [], orDisciplines: [], requirementClans: [],
    requirementPath: null, poolCost: null, bloodCost: null,
});

const cryptIconData: CardDetailData[] = [
    // Beckett — Gangrel, G3, cap 9: ANI AUS FOR PRO
    { id: '200183', name: 'Beckett', crypt: true, types: ['Vampire'], group: '3', banned: false,
      clan: 'Gangrel', path: null, capacity: 9,
      disciplines: ['ANI', 'AUS', 'FOR', 'PRO'],
      andDisciplines: [], orDisciplines: [], requirementClans: [],
      requirementPath: null, poolCost: null, bloodCost: null },

    // Hektor — Brujah antitribu, G2, cap 11: CEL POT PRE
    { id: '200584', name: 'Hektor', crypt: true, types: ['Vampire'], group: '2', banned: false,
      clan: 'Brujah antitribu', path: null, capacity: 11,
      disciplines: ['CEL', 'POT', 'PRE'],
      andDisciplines: [], orDisciplines: [], requirementClans: [],
      requirementPath: null, poolCost: null, bloodCost: null },

    // Malgorzata — Tzimisce, G2, cap 9: ANI AUS VIC
    { id: '200905', name: 'Malgorzata', crypt: true, types: ['Vampire'], group: '2', banned: false,
      clan: 'Tzimisce', path: null, capacity: 9,
      disciplines: ['ANI', 'AUS', 'VIC'],
      andDisciplines: [], orDisciplines: [], requirementClans: [],
      requirementPath: null, poolCost: null, bloodCost: null },

    // Theo Bell — Brujah antitribu, G2, cap 9: CEL POT PRE
    { id: '201362', name: 'Theo Bell', crypt: true, types: ['Vampire'], group: '2', banned: false,
      clan: 'Brujah antitribu', path: null, capacity: 9,
      disciplines: ['CEL', 'POT', 'PRE'],
      andDisciplines: [], orDisciplines: [], requirementClans: [],
      requirementPath: null, poolCost: null, bloodCost: null },

    // Anarch Convert — no clan, cap 1, no disciplines
    { id: '200076', name: 'Anarch Convert', crypt: true, types: ['Vampire'], group: 'ANY', banned: false,
      clan: null, path: null, capacity: 1,
      disciplines: [],
      andDisciplines: [], orDisciplines: [], requirementClans: [],
      requirementPath: null, poolCost: null, bloodCost: null },

    // Zoe — Imbued, G4, cap 4: inn jud
    { id: '201509', name: 'Zoe', crypt: true, types: ['Imbued'], group: '4', banned: false,
      clan: null, path: null, capacity: 4,
      disciplines: ['inn', 'jud'],
      andDisciplines: [], orDisciplines: [], requirementClans: [],
      requirementPath: null, poolCost: null, bloodCost: null },
];

const libraryIconData: CardDetailData[] = [
    // Govern the Unaligned — Action, 2 pool, DOM
    { id: '100845', name: 'Govern the Unaligned', crypt: false, types: ['Action'], group: null, banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: ['dom', 'DOM'],
      requirementClans: [], requirementPath: null, poolCost: 2, bloodCost: null },

    // Conditioning — Action Modifier, DOM
    { id: '100401', name: 'Conditioning', crypt: false, types: ['Action Modifier'], group: null, banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: ['DOM'],
      requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },

    // Deflection — Reaction, DOM
    { id: '100518', name: 'Deflection', crypt: false, types: ['Reaction'], group: null, banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: ['DOM'],
      requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },

    // Freak Drive — Action Modifier, CEL
    { id: '100788', name: 'Freak Drive', crypt: false, types: ['Action Modifier'], group: null, banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: ['CEL'],
      requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },

    // Minion Tap — Master, no discipline, 0 pool
    { id: '101217', name: 'Minion Tap', crypt: false, types: ['Master'], group: null, banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: [],
      requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },

    // Villein — Master, no discipline
    { id: '102121', name: 'Villein', crypt: false, types: ['Master'], group: null, banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: [],
      requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },

    // Parity Shift — Political Action, 2 pool
    { id: '101353', name: 'Parity Shift', crypt: false, types: ['Political Action'], group: null, banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: [],
      requirementClans: [], requirementPath: null, poolCost: 2, bloodCost: null },

    // Kine Resources Contested — Political Action, 1 pool
    { id: '101056', name: 'Kine Resources Contested', crypt: false, types: ['Political Action'], group: null, banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: [],
      requirementClans: [], requirementPath: null, poolCost: 1, bloodCost: null },

    // Taste of Vitae — Combat, no cost (gives blood)
    { id: '101945', name: 'Taste of Vitae', crypt: false, types: ['Combat'], group: null, banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: [],
      requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },

    // Immortal Grapple — Combat, POT
    { id: '100959', name: 'Immortal Grapple', crypt: false, types: ['Combat'], group: null, banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: ['POT'],
      requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },

    // Punish — Action/Combat, 1 blood
    { id: '101518', name: 'Punish', crypt: false, types: ['Action', 'Combat'], group: null, banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: [],
      requirementClans: [], requirementPath: null, poolCost: null, bloodCost: 1 },

    // Mylan Horseed — Ally, 3 pool
    { id: '101261', name: 'Mylan Horseed', crypt: false, types: ['Ally'], group: null, banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: [],
      requirementClans: [], requirementPath: null, poolCost: 3, bloodCost: null },
];

const bannedLibraryIconData: CardDetailData =
    noIcons('101620', false);

const invalidIconData: CardDetailData[] = [
    { id: '200183', name: 'Beckett', crypt: true, types: ['Vampire'], group: '3', banned: false,
      clan: 'Gangrel', path: null, capacity: 9,
      disciplines: ['ANI', 'AUS', 'FOR', 'PRO'],
      andDisciplines: [], orDisciplines: [], requirementClans: [],
      requirementPath: null, poolCost: null, bloodCost: null },
    { id: '200424', name: 'Enkidu, The Noah', crypt: true, types: ['Vampire'], group: '4', banned: false,
      clan: 'Gangrel', path: null, capacity: 11,
      disciplines: ['ANI', 'FOR', 'POT', 'PRO'],
      andDisciplines: [], orDisciplines: [], requirementClans: [],
      requirementPath: null, poolCost: null, bloodCost: null },
    { id: '200905', name: 'Malgorzata', crypt: true, types: ['Vampire'], group: '2', banned: false,
      clan: 'Tzimisce', path: null, capacity: 9,
      disciplines: ['ANI', 'AUS', 'VIC'],
      andDisciplines: [], orDisciplines: [], requirementClans: [],
      requirementPath: null, poolCost: null, bloodCost: null },
    // library cards from invalidEntries reuse existing fixtures
    ...[
        '100845', '100518', '100401', '102121', '101353', '101945',
        '100959', '100788', '101217', '101056',
    ].map(id => libraryIconData.find(d => d.id === id) ?? noIcons(id, false)),
];

function buildDetailMap(...sources: CardDetailData[][]): Map<string, CardDetailData> {
    return new Map(sources.flat().map(d => [d.id, d]));
}

const fullDetailMap    = buildDetailMap(cryptIconData, libraryIconData, [bannedLibraryIconData]);
const cryptDetailMap   = buildDetailMap(cryptIconData);
const invalidDetailMap = new Map(invalidIconData.map(d => [d.id, d]));

// ── Stub search pool ──────────────────────────────────────────────────────────

const searchPool: CardDetailData[] = [
    { id: '200874', name: 'Lucita',              crypt: true,  group: '3',   types: ['Vampire'], banned: false,
      clan: 'Lasombra', path: null, capacity: 8, disciplines: ['DOM', 'OBT', 'POT'],
      andDisciplines: [], orDisciplines: [], requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },
    { id: '200407', name: 'Elena Gutierrez',     crypt: true,  group: '6',   types: ['Vampire'], banned: false,
      clan: 'Tremere', path: null, capacity: 5, disciplines: ['aus', 'tha'],
      andDisciplines: [], orDisciplines: [], requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },
    { id: '200858', name: 'Lorenzo Detuono',     crypt: true,  group: '3',   types: ['Vampire'], banned: false,
      clan: 'Giovanni', path: null, capacity: 5, disciplines: ['dom', 'nec'],
      andDisciplines: [], orDisciplines: [], requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },
    { id: '200076', name: 'Anarch Convert',      crypt: true,  group: 'ANY', types: ['Vampire'], banned: false,
      clan: null, path: null, capacity: 1, disciplines: [],
      andDisciplines: [], orDisciplines: [], requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },
    { id: '101089', name: 'Legal Manipulations', crypt: false, group: null,  types: ['Action'],  banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: [], requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },
    { id: '101112', name: 'Liquidation',         crypt: false, group: null,  types: ['Master'],  banned: false,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: [], requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },
    { id: '101134', name: 'Lure of the Serpent', crypt: false, group: null,  types: ['Master'],  banned: true,
      clan: null, path: null, capacity: null, disciplines: [],
      andDisciplines: [], orDisciplines: [], requirementClans: [], requirementPath: null, poolCost: null, bloodCost: null },
];

function mockSearch(q: string): Promise<CardDetailData[]> {
    return Promise.resolve(
        searchPool.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function useDeckState(initial: DeckEntry[]) {
    const [entries, setEntries] = useState<DeckEntry[]>(initial);

    const onAddCard = (result: CardDetailData) =>
        setEntries(prev => {
            const existing = prev.find(e => e.cardId === result.id);
            if (existing) return prev.map(e => e.cardId === result.id ? { ...e, count: e.count + 1 } : e);
            const newEntry: DeckEntry = {
                cardId:  result.id,
                name:    result.name,
                count:   1,
                isCrypt: result.crypt,
                types:   result.types,
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
                <DeckEditorPanel {...state} detailMap={cryptDetailMap} onSearch={mockSearch} />
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
                <DeckEditorPanel {...state} detailMap={fullDetailMap} onSearch={mockSearch} />
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
                <DeckEditorPanel {...state} detailMap={fullDetailMap} onSearch={mockSearch} />
            </div>
        );
    },
    args: { entries: withBanned, onAddCard: fn(), onIncrement: fn(), onDecrement: fn(), onSearch: fn() },
};

// Deck with invalid summary — thin crypt, library over limit, non-consecutive groups
const invalidEntries: DeckEntry[] = [
    { cardId: '200183', name: 'Beckett',                   count: 2, isCrypt: true,  types: ['Vampire'], group: '2', banned: false },
    { cardId: '200424', name: 'Enkidu, The Noah',          count: 2, isCrypt: true,  types: ['Vampire'], group: '4', banned: false },
    { cardId: '200905', name: 'Malgorzata',                count: 2, isCrypt: true,  types: ['Vampire'], group: '6', banned: false },
    { cardId: '100845', name: 'Govern the Unaligned',      count: 8, isCrypt: false, types: ['Action'],           banned: false },
    { cardId: '100518', name: 'Deflection',                count: 8, isCrypt: false, types: ['Reaction'],         banned: false },
    { cardId: '100401', name: 'Conditioning',              count: 8, isCrypt: false, types: ['Action Modifier'],  banned: false },
    { cardId: '102121', name: 'Villein',                   count: 8, isCrypt: false, types: ['Master'],           banned: false },
    { cardId: '101353', name: 'Parity Shift',              count: 8, isCrypt: false, types: ['Political Action'], banned: false },
    { cardId: '101945', name: 'Taste of Vitae',            count: 8, isCrypt: false, types: ['Combat'],           banned: false },
    { cardId: '100959', name: 'Immortal Grapple',          count: 8, isCrypt: false, types: ['Combat'],           banned: false },
    { cardId: '100788', name: 'Freak Drive',               count: 8, isCrypt: false, types: ['Action Modifier'],  banned: false },
    { cardId: '101217', name: 'Minion Tap',                count: 8, isCrypt: false, types: ['Master'],           banned: false },
    { cardId: '101056', name: 'Kine Resources Contested',  count: 8, isCrypt: false, types: ['Political Action'], banned: false },
];

export const InvalidDeck: Story = {
    render: () => {
        const state = useDeckState(invalidEntries);
        return (
            <div style={{ width: 400, height: 600 }}>
                <DeckEditorPanel {...state} detailMap={invalidDetailMap} onSearch={mockSearch} />
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
                <DeckEditorPanel {...state} detailMap={fullDetailMap} onSearch={mockSearch} />
            </div>
        );
    },
    args: { entries: [], onAddCard: fn(), onIncrement: fn(), onDecrement: fn(), onSearch: fn() },
};