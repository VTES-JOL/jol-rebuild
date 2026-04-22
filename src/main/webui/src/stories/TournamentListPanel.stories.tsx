import {useState} from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import TournamentListPanel from '../features/tournament/TournamentListPanel';
import type {Tournament} from '../features/tournament/types';

const meta = {
    title: 'Tournament/TournamentListPanel',
    component: TournamentListPanel,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    args: {
        onSelect: fn(),
        onCreate: fn(),
    },
} satisfies Meta<typeof TournamentListPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Fixture data ──────────────────────────────────────────────────────────────

const sampleTournaments: Tournament[] = [
    {
        id: '1',
        name: 'Spring Standard Open',
        format: 'SINGLE_DECK',
        gameFormat: 'STANDARD',
        numberOfRounds: 3,
    originalNumberOfRounds: 3,
        finalRound: true,
        requiresId: false,
        rules: [],
        conditions: [],
        status: 'REGISTRATION',
        registrationStart: '2026-04-01T00:00:00Z',
        registrationEnd: '2026-04-20T23:59:00Z',
        playingStart: '2026-04-21T10:00:00Z',
    },
    {
        id: '2',
        name: 'Duel Championship Series',
        format: 'SINGLE_DECK',
        gameFormat: 'DUEL',
        numberOfRounds: 2,
    originalNumberOfRounds: 3,
        finalRound: true,
        requiresId: true,
        rules: [],
        conditions: [],
        status: 'ACTIVE',
        playingStart: '2026-04-10T09:00:00Z',
    },
    {
        id: '3',
        name: 'V5 Invitational',
        format: 'MULTI_DECK',
        gameFormat: 'V5',
        numberOfRounds: 3,
    originalNumberOfRounds: 3,
        finalRound: false,
        requiresId: true,
        rules: [],
        conditions: [],
        status: 'SETUP',
    },
    {
        id: '4',
        name: 'Autumn Sealed Tournament',
        format: 'SINGLE_DECK',
        gameFormat: 'STANDARD',
        numberOfRounds: 2,
    originalNumberOfRounds: 3,
        finalRound: false,
        requiresId: false,
        rules: [],
        conditions: [],
        status: 'COMPLETED',
        registrationStart: '2025-10-01T00:00:00Z',
        registrationEnd: '2025-10-14T23:59:00Z',
        playingStart: '2025-10-15T10:00:00Z',
        playingEnd: '2025-10-15T20:00:00Z',
    },
    {
        id: '5',
        name: 'Finals Qualifier Round',
        format: 'SINGLE_DECK',
        gameFormat: 'STANDARD',
        numberOfRounds: 3,
    originalNumberOfRounds: 3,
        finalRound: true,
        requiresId: false,
        rules: [],
        conditions: [],
        status: 'FINALS',
    },
    {
        id: '6',
        name: 'Seating Phase Test',
        format: 'SINGLE_DECK',
        gameFormat: 'STANDARD',
        numberOfRounds: 2,
    originalNumberOfRounds: 3,
        finalRound: false,
        requiresId: false,
        rules: [],
        conditions: [],
        status: 'SEATING',
    },
];

// ── Stories ───────────────────────────────────────────────────────────────────

export const EmptyAdmin: Story = {
    name: 'Empty — Admin',
    args: {
        tournaments: [],
        selectedId: null,
        loading: false,
        isTournamentAdmin: true,
    },
};

export const EmptyPlayer: Story = {
    name: 'Empty — Player',
    args: {
        tournaments: [],
        selectedId: null,
        loading: false,
        isTournamentAdmin: false,
    },
};

export const LoadingState: Story = {
    name: 'Loading',
    args: {
        tournaments: [],
        selectedId: null,
        loading: true,
        isTournamentAdmin: false,
    },
};

export const AdminView: Story = {
    name: 'With Tournaments — Admin',
    args: {
        tournaments: sampleTournaments,
        selectedId: null,
        loading: false,
        isTournamentAdmin: true,
    },
};

export const PlayerView: Story = {
    name: 'With Tournaments — Player',
    args: {
        tournaments: sampleTournaments,
        selectedId: null,
        loading: false,
        isTournamentAdmin: false,
    },
};

export const WithSelection: Story = {
    args: {
        tournaments: sampleTournaments,
        selectedId: '2',
        loading: false,
        isTournamentAdmin: false,
    },
};

export const Interactive: Story = {
    render: (args) => {
        const [selectedId, setSelectedId] = useState<string | null>(null);
        return (
            <div style={{width: 320, height: 560}}>
                <TournamentListPanel
                    {...args}
                    tournaments={sampleTournaments}
                    selectedId={selectedId}
                    onSelect={t => setSelectedId(t.id)}
                />
            </div>
        );
    },
    args: {
        tournaments: sampleTournaments,
        isTournamentAdmin: true,
    },
};

const manyTournaments: Tournament[] = Array.from({length: 18}, (_, i) => ({
    id: String(100 + i),
    name: `Tournament ${i + 1} — ${'ABCDEFGHIJKLMNOPQR'[i]}`,
    format: i % 2 === 0 ? 'SINGLE_DECK' : 'MULTI_DECK',
    gameFormat: ['STANDARD', 'DUEL', 'V5'][i % 3],
    numberOfRounds: i % 3 === 0 ? 3 : 2,
    originalNumberOfRounds: i % 3 === 0 ? 3 : 2,
    finalRound: i % 4 === 0,
    requiresId: i % 5 === 0,
    rules: [],
    conditions: [],
    status: (['SETUP', 'REGISTRATION', 'ACTIVE', 'COMPLETED', 'FINALS', 'SEATING', 'SEEDING'] as const)[i % 7],
} satisfies Tournament));

export const LongList: Story = {
    name: 'Long List — Admin',
    render: (args) => (
        <div style={{width: 320, height: 560}}>
            <TournamentListPanel {...args} tournaments={manyTournaments} />
        </div>
    ),
    args: {
        tournaments: manyTournaments,
        selectedId: null,
        loading: false,
        isTournamentAdmin: true,
    },
};
