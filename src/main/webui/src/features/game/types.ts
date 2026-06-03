export type RegionType =
    | 'READY' | 'UNCONTROLLED' | 'ASH_HEAP' | 'HAND'
    | 'LIBRARY' | 'CRYPT' | 'TORPOR' | 'RESEARCH' | 'REMOVED_FROM_GAME';

export type CardType =
    | 'Vampire' | 'Imbued'
    | 'Master' | 'Action' | 'Action Modifier' | 'Reaction' | 'Combat'
    | 'Ally' | 'Retainer' | 'Political Action' | 'Equipment' | 'Event'
    | 'Location' | '';

export type CardData = {
    id: string;
    crypt?: boolean;
    faceDown?: boolean;
    locked?: boolean;
    cardId?: string;
    name?: string;
    type?: CardType;
    types?: CardType[];
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

export type ImpulseState = {
    active: boolean;
    context: string;
    actingPlayer: string;
    currentImpulseHolder: string;
    passOrder: string[];
    consecutivePasses: number;
};

export type CardRef = {
    playerName: string;
    regionType: string;
    position: number;
    childIndex: number;
};

export type ActionType =
    | 'BLEED' | 'HUNT' | 'EQUIP' | 'EMPLOY_RETAINER' | 'RECRUIT_ALLY'
    | 'POLITICAL' | 'LEAVE_TORPOR' | 'RESCUE' | 'DIABLERISE' | 'CUSTOM';

export type ActionStatus = 'AS_ANNOUNCED' | 'DURING_ACTION' | 'BLOCKED' | 'AFTER_RESOLUTION';

export type PendingActionState = {
    actorRef: CardRef;
    actionType: ActionType;
    targetPlayerName: string | null;
    status: ActionStatus;
    blockerRef: CardRef | null;
};

export type SequencingWindowState = {
    active: boolean;
    windowType: 'AS_ANNOUNCED' | 'AFTER_RESOLUTION';
    passOrder: string[];
    consecutivePasses: number;
    currentHolder: string;
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
    /** Influence transfers remaining for the current player this turn (0 outside INFLUENCE phase). */
    transfersRemaining: number;
    /** Active impulse window, or null/undefined when no window is open. */
    impulseWindow?: ImpulseState | null;
    /** Active action declaration, or null/undefined when no action is in progress. */
    pendingAction?: PendingActionState | null;
    /** Active sequencing window (AS_ANNOUNCED or AFTER_RESOLUTION), or null/undefined. */
    sequencingWindow?: SequencingWindowState | null;
};
