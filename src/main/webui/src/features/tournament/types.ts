export type TournamentStatus = 'Starting' | 'Active' | 'Seeding' | 'Finals' | 'Completed';
export type TournamentFormat = 'SINGLE_DECK' | 'MULTI_DECK';

export interface Rule {
    text: string;
    condition?: string;
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
    status: TournamentStatus;
}
