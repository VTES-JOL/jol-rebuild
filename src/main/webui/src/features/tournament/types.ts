export type TournamentStatus = 'SETUP' | 'REGISTRATION' | 'SEATING' | 'ACTIVE' | 'SEEDING' | 'FINALS' | 'COMPLETED';
export type TournamentFormat = 'SINGLE_DECK' | 'MULTI_DECK';

export interface Rule {
    text: string;
    conditionId?: string;
}

export interface Condition {
    id: string;
    text: string;
}

export interface Tournament {
    id: number;
    name: string;
    registrationStart?: string;
    registrationEnd?: string;
    playingStart?: string;
    playingEnd?: string;
    format: TournamentFormat;
    gameFormat: string;
    numberOfRounds: number;
    finalRound: boolean;
    requiresId: boolean;
    rules: Rule[];
    conditions: Condition[];
    status: TournamentStatus;
}

export interface DeckEntry {
    deckName: string;
    summary: string;
}

export interface TournamentRegistration {
    id: number;
    userId: string;
    username: string;
    decks: DeckEntry[];
}

export interface Seat {
    id: number;
    registrationId: number;
    username: string;
    seatPosition: number;
    bye: boolean;
}

export interface SeatingTable {
    id: number;
    seats: Seat[];
}

export interface UnseatedPlayer {
    registrationId: number;
    username: string;
}

export interface SeatingRound {
    roundNumber: number;
    tables: SeatingTable[];
    byes: Seat[];
    unseated: UnseatedPlayer[];
}

export interface SeatingDto {
    rounds: SeatingRound[];
    unseated: UnseatedPlayer[];
}

export interface TournamentGamePlayer {
    username: string;
    seatPosition: number;
}

export interface TournamentGame {
    tableId: number;
    roundNumber: number;
    gameId: number;
    gameName: string;
    players: TournamentGamePlayer[];
}
