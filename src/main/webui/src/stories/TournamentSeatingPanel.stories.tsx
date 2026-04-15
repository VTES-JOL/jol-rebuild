import React from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import TournamentSeatingPanel from '../features/tournament/TournamentSeatingPanel';
import type {SeatingDto, Tournament} from '../features/tournament/types';
import tournamentApi from '../features/tournament/api';

// ── Fixture data ──────────────────────────────────────────────────────────────

const baseTournament: Tournament = {
    id: 42,
    name: 'Spring Standard Open',
    format: 'SINGLE_DECK',
    gameFormat: 'STANDARD',
    numberOfRounds: 2,
    finalRound: true,
    requiresId: false,
    rules: [],
    conditions: [],
    status: 'SEATING',
    registrationStart: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    registrationEnd: new Date(Date.now() - 86_400_000).toISOString(),
    playingStart: new Date(Date.now() + 86_400_000).toISOString(),
};

// All 9 players unallocated — no tables yet
const allUnseatedDto: SeatingDto = {
    rounds: [
        {
            roundNumber: 1,
            tables: [],
            byes: [],
            unseated: [
                {registrationId: 1, username: 'dracula'},
                {registrationId: 2, username: 'lasombra'},
                {registrationId: 3, username: 'malkav'},
                {registrationId: 4, username: 'brujah'},
                {registrationId: 5, username: 'tremere'},
                {registrationId: 6, username: 'gangrel'},
                {registrationId: 7, username: 'nosferatu'},
                {registrationId: 8, username: 'toreador'},
                {registrationId: 9, username: 'ventrue'},
            ],
        },
        {
            roundNumber: 2,
            tables: [],
            byes: [],
            unseated: [
                {registrationId: 1, username: 'dracula'},
                {registrationId: 2, username: 'lasombra'},
                {registrationId: 3, username: 'malkav'},
                {registrationId: 4, username: 'brujah'},
                {registrationId: 5, username: 'tremere'},
                {registrationId: 6, username: 'gangrel'},
                {registrationId: 7, username: 'nosferatu'},
                {registrationId: 8, username: 'toreador'},
                {registrationId: 9, username: 'ventrue'},
            ],
        },
    ],
    unseated: [
        {registrationId: 1, username: 'dracula'},
        {registrationId: 2, username: 'lasombra'},
        {registrationId: 3, username: 'malkav'},
        {registrationId: 4, username: 'brujah'},
        {registrationId: 5, username: 'tremere'},
        {registrationId: 6, username: 'gangrel'},
        {registrationId: 7, username: 'nosferatu'},
        {registrationId: 8, username: 'toreador'},
        {registrationId: 9, username: 'ventrue'},
    ],
};

// Round 1 has one full table seated + bye; round 2 still empty
const partiallySeatedDto: SeatingDto = {
    rounds: [
        {
            roundNumber: 1,
            tables: [
                {
                    id: 101,
                    seats: [
                        {id: 1001, registrationId: 1, username: 'dracula',   seatPosition: 1, bye: false},
                        {id: 1002, registrationId: 2, username: 'lasombra',  seatPosition: 2, bye: false},
                        {id: 1003, registrationId: 3, username: 'malkav',    seatPosition: 3, bye: false},
                        {id: 1004, registrationId: 4, username: 'brujah',    seatPosition: 4, bye: false},
                        {id: 1005, registrationId: 5, username: 'tremere',   seatPosition: 5, bye: false},
                    ],
                },
            ],
            byes: [
                {id: 1009, registrationId: 9, username: 'ventrue', seatPosition: 0, bye: true},
            ],
            unseated: [
                {registrationId: 6, username: 'gangrel'},
                {registrationId: 7, username: 'nosferatu'},
                {registrationId: 8, username: 'toreador'},
            ],
        },
        {
            roundNumber: 2,
            tables: [],
            byes: [],
            unseated: [
                {registrationId: 1, username: 'dracula'},
                {registrationId: 2, username: 'lasombra'},
                {registrationId: 3, username: 'malkav'},
                {registrationId: 4, username: 'brujah'},
                {registrationId: 5, username: 'tremere'},
                {registrationId: 6, username: 'gangrel'},
                {registrationId: 7, username: 'nosferatu'},
                {registrationId: 8, username: 'toreador'},
                {registrationId: 9, username: 'ventrue'},
            ],
        },
    ],
    unseated: [
        {registrationId: 6, username: 'gangrel'},
        {registrationId: 7, username: 'nosferatu'},
        {registrationId: 8, username: 'toreador'},
    ],
};

// All players seated across both rounds — activate button should be enabled
const allSeatedDto: SeatingDto = {
    rounds: [
        {
            roundNumber: 1,
            tables: [
                {
                    id: 101,
                    seats: [
                        {id: 1001, registrationId: 1, username: 'dracula',   seatPosition: 1, bye: false},
                        {id: 1002, registrationId: 2, username: 'lasombra',  seatPosition: 2, bye: false},
                        {id: 1003, registrationId: 3, username: 'malkav',    seatPosition: 3, bye: false},
                        {id: 1004, registrationId: 4, username: 'brujah',    seatPosition: 4, bye: false},
                        {id: 1005, registrationId: 5, username: 'tremere',   seatPosition: 5, bye: false},
                    ],
                },
                {
                    id: 102,
                    seats: [
                        {id: 1006, registrationId: 6, username: 'gangrel',   seatPosition: 1, bye: false},
                        {id: 1007, registrationId: 7, username: 'nosferatu', seatPosition: 2, bye: false},
                        {id: 1008, registrationId: 8, username: 'toreador',  seatPosition: 3, bye: false},
                        {id: 1009, registrationId: 9, username: 'ventrue',   seatPosition: 4, bye: false},
                    ],
                },
            ],
            byes: [],
            unseated: [],
        },
        {
            roundNumber: 2,
            tables: [
                {
                    id: 201,
                    seats: [
                        {id: 2001, registrationId: 3, username: 'malkav',    seatPosition: 1, bye: false},
                        {id: 2002, registrationId: 6, username: 'gangrel',   seatPosition: 2, bye: false},
                        {id: 2003, registrationId: 1, username: 'dracula',   seatPosition: 3, bye: false},
                        {id: 2004, registrationId: 8, username: 'toreador',  seatPosition: 4, bye: false},
                        {id: 2005, registrationId: 5, username: 'tremere',   seatPosition: 5, bye: false},
                    ],
                },
                {
                    id: 202,
                    seats: [
                        {id: 2006, registrationId: 7, username: 'nosferatu', seatPosition: 1, bye: false},
                        {id: 2007, registrationId: 4, username: 'brujah',    seatPosition: 2, bye: false},
                        {id: 2008, registrationId: 9, username: 'ventrue',   seatPosition: 3, bye: false},
                        {id: 2009, registrationId: 2, username: 'lasombra',  seatPosition: 4, bye: false},
                    ],
                },
            ],
            byes: [],
            unseated: [],
        },
    ],
    unseated: [],
};

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta = {
    title: 'Tournament/TournamentSeatingPanel',
    component: TournamentSeatingPanel,
    parameters: {layout: 'padded'},
    tags: ['autodocs'],
    args: {
        onActivated: fn(),
        onChanged: fn(),
    },
} satisfies Meta<typeof TournamentSeatingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Stories ───────────────────────────────────────────────────────────────────

export const AllUnseated: Story = {
    name: 'Fresh Start — all players unallocated',
    render: (args) => {
        tournamentApi.getSeating = () => Promise.resolve(allUnseatedDto);
        return <TournamentSeatingPanel {...args} />;
    },
    args: {tournament: baseTournament},
};

export const PartiallySeated: Story = {
    name: 'Partially Seated — round 1 in progress',
    render: (args) => {
        tournamentApi.getSeating = () => Promise.resolve(partiallySeatedDto);
        return <TournamentSeatingPanel {...args} />;
    },
    args: {tournament: baseTournament},
};

export const AllSeated: Story = {
    name: 'All Seated — ready to activate',
    render: (args) => {
        tournamentApi.getSeating = () => Promise.resolve(allSeatedDto);
        return <TournamentSeatingPanel {...args} />;
    },
    args: {tournament: baseTournament},
};

export const SingleRoundAllSeated: Story = {
    name: 'Single Round — all seated',
    render: (args) => {
        const singleRound: SeatingDto = {
            rounds: [allSeatedDto.rounds[0]],
            unseated: [],
        };
        tournamentApi.getSeating = () => Promise.resolve(singleRound);
        return <TournamentSeatingPanel {...args} />;
    },
    args: {
        tournament: {...baseTournament, numberOfRounds: 1},
    },
};

export const WithByesAndUnseated: Story = {
    name: 'With Byes — mixed allocation',
    render: (args) => {
        const mixedDto: SeatingDto = {
            rounds: [
                {
                    roundNumber: 1,
                    tables: [
                        {
                            id: 101,
                            seats: [
                                {id: 1001, registrationId: 1, username: 'dracula',   seatPosition: 1, bye: false},
                                {id: 1002, registrationId: 2, username: 'lasombra',  seatPosition: 2, bye: false},
                                {id: 1003, registrationId: 3, username: 'malkav',    seatPosition: 3, bye: false},
                                {id: 1004, registrationId: 4, username: 'brujah',    seatPosition: 4, bye: false},
                            ],
                        },
                    ],
                    byes: [
                        {id: 1009, registrationId: 9, username: 'ventrue',   seatPosition: 0, bye: true},
                        {id: 1010, registrationId: 8, username: 'toreador',  seatPosition: 0, bye: true},
                    ],
                    unseated: [
                        {registrationId: 5, username: 'tremere'},
                        {registrationId: 6, username: 'gangrel'},
                        {registrationId: 7, username: 'nosferatu'},
                    ],
                },
            ],
            unseated: [
                {registrationId: 5, username: 'tremere'},
                {registrationId: 6, username: 'gangrel'},
                {registrationId: 7, username: 'nosferatu'},
            ],
        };
        tournamentApi.getSeating = () => Promise.resolve(mixedDto);
        return <TournamentSeatingPanel {...args} />;
    },
    args: {
        tournament: {...baseTournament, numberOfRounds: 1},
    },
};
