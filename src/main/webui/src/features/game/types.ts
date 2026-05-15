export type RegionType =
    | 'READY' | 'UNCONTROLLED' | 'ASH_HEAP' | 'HAND'
    | 'LIBRARY' | 'CRYPT' | 'TORPOR' | 'RESEARCH' | 'REMOVED_FROM_GAME';

export type CardType =
    | 'VAMPIRE' | 'IMBUED'
    | 'MASTER' | 'ACTION' | 'MODIFIER' | 'REACTION' | 'COMBAT'
    | 'ALLY' | 'RETAINER' | 'POLITICAL' | 'EQUIPMENT' | 'EVENT'
    | 'LOCATION' | 'NONE';

export type CardData = {
    id: string;
    crypt?: boolean;
    faceDown?: boolean;
    locked?: boolean;
    cardId?: string;
    name?: string;
    type?: CardType;
    contested?: boolean;
    counters?: number;
    votes?: number;
    notes?: string | null;
    title?: string | null;
    advanced?: boolean;
    capacity?: number;
    minion?: boolean;
    unique?: boolean;
    disciplines?: string[];
    controllerName?: string | null;
    clan?: string | null;
    sect?: string | null;
    path?: string | null;
    regionId?: string;
    ownerName?: string;
    parentId?: string | null;
    childCardIds?: string[];
};

export type CardSlot = {
    index: number;
    counters: number;
    locked: boolean;
    childCount: number;
};

export type RegionState = {
    id: string;
    type: RegionType;
    count: number;
    visible: boolean;
    cardIds: string[];
    /** Positional slot data for hidden regions (e.g. UNCONTROLLED) — counters without UUID. */
    slots?: CardSlot[];
};

export type PlayerState = {
    name: string;
    pool: number;
    victoryPoints: number;
    ousted: boolean;
    prey: string | null;
    predator: string | null;
    notes: string | null;
    choice: string | null;
    regions: Partial<Record<RegionType, RegionState>>;
};

export type GameState = {
    gameId: string;
    gameName: string;
    turn: string;
    phase: string;
    currentPlayer: string;
    edgeHolder: string;
    orderReversed: boolean;
    playerOrder: string[];
    players: PlayerState[];
    cards: Record<string, CardData>;
};
