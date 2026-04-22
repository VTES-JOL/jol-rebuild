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
    id: string;
    name: string;
    registrationStart?: string;
    registrationEnd?: string;
    playingStart?: string;
    playingEnd?: string;
    format: TournamentFormat;
    gameFormat: string;
    numberOfRounds: number;
    originalNumberOfRounds: number;
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
    id: string;
    userId: string;
    username: string;
    decks: DeckEntry[];
}

export interface Seat {
    id: string;
    registrationId: string;
    username: string;
    seatPosition: number;
    bye: boolean;
}

export interface SeatingTable {
    id: string;
    seats: Seat[];
}

export interface UnseatedPlayer {
    registrationId: string;
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
    tableId: string;
    roundNumber: number;
    gameId: string;
    gameName: string;
    players: TournamentGamePlayer[];
}
