export type TournamentStatus = 'STARTING' | 'ACTIVE' | 'SEEDING' | 'FINALS' | 'COMPLETED';
export type TournamentFormat = 'SINGLE_DECK' | 'MULTI_DECK';

export interface Rule {
    text: string;
    conditionId?: string; // Points to a ConditionGroup
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
