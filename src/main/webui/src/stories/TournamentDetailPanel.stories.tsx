import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import TournamentDetailPanel from '../features/tournament/TournamentDetailPanel';
import type {Tournament, TournamentGame, TournamentRegistration} from '../features/tournament/types';
import {AuthContext} from '../contexts/AuthContext';
import type {AuthContextType} from '../contexts/AuthContext';
import tournamentApi from '../features/tournament/api';
import deckApi from '../features/deck/api';

// ── Mock AuthContext ───────────────────────────────────────────────────────────

const mockAuthCtx: AuthContextType = {
    user: {id: 1, username: 'dracula', roles: ['USER']},
    loading: false,
    login: fn(),
    logout: fn(),
    refresh: fn(),
};

const withAuth = (Story: React.ComponentType) => (
    <AuthContext.Provider value={mockAuthCtx}>
        <Story/>
    </AuthContext.Provider>
);

// ── Fixture data ──────────────────────────────────────────────────────────────

const baseTournament: Tournament = {
    id: 42,
    name: 'Spring Standard Open',
    format: 'SINGLE_DECK',
    gameFormat: 'STANDARD',
    numberOfRounds: 3,
    finalRound: true,
    requiresId: false,
    rules: [
        {text: 'No proxy cards allowed. Decks must use original printings or official reprints.'},
        {text: 'Tardiness penalty applies after a 5-minute grace period per round.', conditionId: 'cond-1'},
    ],
    conditions: [
        {id: 'cond-1', text: 'Player receives a game loss for the affected round'},
    ],
    status: 'SETUP',
    registrationStart: '2026-04-01T00:00:00Z',
    registrationEnd: '2026-04-20T23:59:00Z',
    playingStart: '2026-04-21T10:00:00Z',
    playingEnd: '2026-04-21T22:00:00Z',
};

const registrations: TournamentRegistration[] = [
    {id: 101, userId: 'user-1', username: 'dracula', decks: [{deckName: 'Weenie Animalism', summary: '12,80,4/5'}]},
    {id: 102, userId: 'user-2', username: 'lasombra', decks: [{deckName: 'Political Ventrue', summary: '13,77,3/4'}]},
    {id: 103, userId: 'user-3', username: 'malkav', decks: [{deckName: 'Malkavian Madness', summary: '12,78,3/4'}]},
];

const activeGames: TournamentGame[] = [
    {
        tableId: 1, roundNumber: 1, gameId: 201, gameName: 'Round 1 — Table A',
        players: [
            {username: 'dracula', seatPosition: 1},
            {username: 'lasombra', seatPosition: 2},
            {username: 'malkav', seatPosition: 3},
            {username: 'brujah', seatPosition: 4},
            {username: 'tremere', seatPosition: 5},
        ],
    },
    {
        tableId: 2, roundNumber: 1, gameId: 202, gameName: 'Round 1 — Table B',
        players: [
            {username: 'gangrel', seatPosition: 1},
            {username: 'nosferatu', seatPosition: 2},
            {username: 'toreador', seatPosition: 3},
            {username: 'ventrue', seatPosition: 4},
        ],
    },
    {
        tableId: 3, roundNumber: 2, gameId: 203, gameName: 'Round 2 — Table A',
        players: [
            {username: 'dracula', seatPosition: 1},
            {username: 'gangrel', seatPosition: 2},
            {username: 'tremere', seatPosition: 3},
            {username: 'nosferatu', seatPosition: 4},
            {username: 'toreador', seatPosition: 5},
        ],
    },
];

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta = {
    title: 'Tournament/TournamentDetailPanel',
    component: TournamentDetailPanel,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    decorators: [withAuth],
    args: {
        onChanged: fn(),
        onDelete: fn(),
    },
} satisfies Meta<typeof TournamentDetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ───────────────────────────────────────────────────────────────────

export const SetupAdmin: Story = {
    name: 'Setup — Admin (display)',
    args: {
        tournament: baseTournament,
        isTournamentAdmin: true,
        initialEdit: false,
    },
};

export const SetupAdminEditing: Story = {
    name: 'Setup — Admin (editing)',
    args: {
        tournament: baseTournament,
        isTournamentAdmin: true,
        initialEdit: true,
    },
};

export const SetupAdminNoRules: Story = {
    name: 'Setup — Admin (no rules)',
    args: {
        tournament: {...baseTournament, rules: [], conditions: []},
        isTournamentAdmin: true,
        initialEdit: false,
    },
};

export const SetupPlayer: Story = {
    name: 'Setup — Player (read-only)',
    args: {
        tournament: baseTournament,
        isTournamentAdmin: false,
        initialEdit: false,
    },
};

export const RegistrationOpen: Story = {
    name: 'Registration — Open',
    render: (args) => {
        tournamentApi.getRegistrations = () => Promise.resolve(registrations);
        deckApi.list = () => Promise.resolve([
            {id: 1, name: 'Weenie Animalism', summary: '12,80,4/5', comments: null, timestamp: new Date().toISOString(), formatValidity: {STANDARD: true}},
            {id: 2, name: 'Political Ventrue', summary: '13,77,3/4', comments: null, timestamp: new Date().toISOString(), formatValidity: {STANDARD: true}},
        ]);
        return <TournamentDetailPanel {...args} />;
    },
    args: {
        tournament: {
            ...baseTournament,
            status: 'REGISTRATION',
            registrationStart: new Date(Date.now() - 86_400_000).toISOString(),
            registrationEnd: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        },
        isTournamentAdmin: false,
        initialEdit: false,
    },
};

export const RegistrationAdminCanClose: Story = {
    name: 'Registration — Admin (registration closed, can begin seating)',
    render: (args) => {
        tournamentApi.getRegistrations = () => Promise.resolve(registrations);
        deckApi.list = () => Promise.resolve([]);
        return <TournamentDetailPanel {...args} />;
    },
    args: {
        tournament: {
            ...baseTournament,
            status: 'REGISTRATION',
            registrationStart: new Date(Date.now() - 14 * 86_400_000).toISOString(),
            registrationEnd: new Date(Date.now() - 86_400_000).toISOString(),
        },
        isTournamentAdmin: true,
        initialEdit: false,
    },
};

export const ActiveTournament: Story = {
    name: 'Active — with games',
    render: (args) => {
        tournamentApi.getTournamentGames = () => Promise.resolve(activeGames);
        return <TournamentDetailPanel {...args} />;
    },
    args: {
        tournament: {...baseTournament, status: 'ACTIVE'},
        isTournamentAdmin: false,
        initialEdit: false,
    },
};

export const ActiveNoGames: Story = {
    name: 'Active — no games yet',
    render: (args) => {
        tournamentApi.getTournamentGames = () => Promise.resolve([]);
        return <TournamentDetailPanel {...args} />;
    },
    args: {
        tournament: {...baseTournament, status: 'ACTIVE'},
        isTournamentAdmin: false,
        initialEdit: false,
    },
};

export const Finals: Story = {
    name: 'Finals',
    render: (args) => {
        tournamentApi.getTournamentGames = () => Promise.resolve(activeGames.slice(0, 1));
        return <TournamentDetailPanel {...args} />;
    },
    args: {
        tournament: {...baseTournament, status: 'FINALS'},
        isTournamentAdmin: false,
        initialEdit: false,
    },
};

export const Completed: Story = {
    name: 'Completed',
    render: (args) => {
        tournamentApi.getTournamentGames = () => Promise.resolve(activeGames);
        return <TournamentDetailPanel {...args} />;
    },
    args: {
        tournament: {...baseTournament, status: 'COMPLETED'},
        isTournamentAdmin: false,
        initialEdit: false,
    },
};
