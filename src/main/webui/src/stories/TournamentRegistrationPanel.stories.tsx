import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import TournamentRegistrationPanel from '../features/tournament/TournamentRegistrationPanel';
import type {Tournament, TournamentRegistration} from '../features/tournament/types';
import type {AuthContextType} from '../contexts/AuthContext';
import {AuthContext} from '../contexts/AuthContext';
import tournamentApi from '../features/tournament/api';
import deckApi from '../features/deck/api';
import type {Deck} from '../features/deck/types';

// ── Mock AuthContext ───────────────────────────────────────────────────────────

function withUser(username: string) {
    const ctx: AuthContextType = {
        user: {id: 1, username, roles: ['USER']},
        loading: false,
        login: fn(),
        logout: fn(),
        refresh: fn(),
    };
    return (Story: React.ComponentType) => (
        <AuthContext.Provider value={ctx}>
            <Story/>
        </AuthContext.Provider>
    );
}

// ── Fixture data ──────────────────────────────────────────────────────────────

const NOW = new Date();
const pastDate = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();
const futureDate = (days: number) => new Date(NOW.getTime() + days * 86_400_000).toISOString();

const baseTournament: Tournament = {
    id: 42,
    name: 'Spring Standard Open',
    format: 'SINGLE_DECK',
    gameFormat: 'STANDARD',
    numberOfRounds: 3,
    finalRound: true,
    requiresId: false,
    rules: [],
    conditions: [],
    status: 'REGISTRATION',
    registrationStart: pastDate(5),
    registrationEnd: futureDate(7),
};

const availableDecks: Deck[] = [
    {id: 1, name: 'Weenie Animalism', summary: '12,80,4/5', comments: 'Rush aggro', timestamp: pastDate(10), formatValidity: {STANDARD: true}},
    {id: 2, name: 'Political Ventrue', summary: '13,77,3/4', comments: null, timestamp: pastDate(3), formatValidity: {STANDARD: true}},
    {id: 3, name: 'Ravnos Toolbox', summary: '12,78,5/6', comments: null, timestamp: pastDate(20), formatValidity: {STANDARD: true}},
];

const myRegistration: TournamentRegistration = {
    id: 101, userId: 'user-1', username: 'dracula',
    decks: [{deckName: 'Weenie Animalism', summary: '12,80,4/5'}],
};

const otherRegistrations: TournamentRegistration[] = [
    {id: 102, userId: 'user-2', username: 'lasombra', decks: [{deckName: 'Political Ventrue', summary: '13,77,3/4'}]},
    {id: 103, userId: 'user-3', username: 'malkav', decks: [{deckName: 'Malkavian Madness', summary: '12,78,3/4'}]},
    {id: 104, userId: 'user-4', username: 'brujah', decks: [{deckName: 'Rush Brujah', summary: '12,80,3'}]},
];

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta = {
    title: 'Tournament/TournamentRegistrationPanel',
    component: TournamentRegistrationPanel,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    args: {onChanged: fn()},
} satisfies Meta<typeof TournamentRegistrationPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ───────────────────────────────────────────────────────────────────

export const NotRegistered: Story = {
    name: 'Not Registered — can register',
    decorators: [withUser('dracula')],
    render: (args) => {
        tournamentApi.getRegistrations = () => Promise.resolve(otherRegistrations);
        deckApi.list = () => Promise.resolve(availableDecks);
        return <TournamentRegistrationPanel {...args} />;
    },
    args: {tournament: baseTournament},
};

export const AlreadyRegistered: Story = {
    name: 'Already Registered — can leave',
    decorators: [withUser('dracula')],
    render: (args) => {
        tournamentApi.getRegistrations = () => Promise.resolve([myRegistration, ...otherRegistrations]);
        deckApi.list = () => Promise.resolve(availableDecks);
        return <TournamentRegistrationPanel {...args} />;
    },
    args: {tournament: baseTournament},
};

export const NoDecksAvailable: Story = {
    name: 'Not Registered — no decks',
    decorators: [withUser('dracula')],
    render: (args) => {
        tournamentApi.getRegistrations = () => Promise.resolve(otherRegistrations);
        deckApi.list = () => Promise.resolve([]);
        return <TournamentRegistrationPanel {...args} />;
    },
    args: {tournament: baseTournament},
};

export const RegistrationClosed: Story = {
    name: 'Registration Closed',
    decorators: [withUser('dracula')],
    render: (args) => {
        tournamentApi.getRegistrations = () => Promise.resolve([myRegistration, ...otherRegistrations]);
        deckApi.list = () => Promise.resolve(availableDecks);
        return <TournamentRegistrationPanel {...args} />;
    },
    args: {
        tournament: {
            ...baseTournament,
            registrationStart: pastDate(14),
            registrationEnd: pastDate(1),
        },
    },
};

export const RegistrationNotStarted: Story = {
    name: 'Registration Not Started',
    decorators: [withUser('dracula')],
    render: (args) => {
        tournamentApi.getRegistrations = () => Promise.resolve([]);
        deckApi.list = () => Promise.resolve(availableDecks);
        return <TournamentRegistrationPanel {...args} />;
    },
    args: {
        tournament: {
            ...baseTournament,
            registrationStart: futureDate(3),
            registrationEnd: futureDate(10),
        },
    },
};

export const MultiDeckNotRegistered: Story = {
    name: 'Multi-Deck — not registered',
    decorators: [withUser('dracula')],
    render: (args) => {
        tournamentApi.getRegistrations = () => Promise.resolve(otherRegistrations);
        deckApi.list = () => Promise.resolve(availableDecks);
        return <TournamentRegistrationPanel {...args} />;
    },
    args: {
        tournament: {
            ...baseTournament,
            format: 'MULTI_DECK',
            numberOfRounds: 3,
        },
    },
};

export const MultiDeckRegistered: Story = {
    name: 'Multi-Deck — registered with 3 decks',
    decorators: [withUser('dracula')],
    render: (args) => {
        const multiReg: TournamentRegistration = {
            id: 101, userId: 'user-1', username: 'dracula',
            decks: [
                {deckName: 'Weenie Animalism', summary: '12,80,4/5'},
                {deckName: 'Political Ventrue', summary: '13,77,3/4'},
                {deckName: 'Ravnos Toolbox', summary: '12,78,5/6'},
            ],
        };
        tournamentApi.getRegistrations = () => Promise.resolve([multiReg, ...otherRegistrations]);
        deckApi.list = () => Promise.resolve(availableDecks);
        return <TournamentRegistrationPanel {...args} />;
    },
    args: {
        tournament: {
            ...baseTournament,
            format: 'MULTI_DECK',
            numberOfRounds: 3,
        },
    },
};

export const NoPlayersYet: Story = {
    name: 'Empty — no players registered',
    decorators: [withUser('dracula')],
    render: (args) => {
        tournamentApi.getRegistrations = () => Promise.resolve([]);
        deckApi.list = () => Promise.resolve(availableDecks);
        return <TournamentRegistrationPanel {...args} />;
    },
    args: {tournament: baseTournament},
};
