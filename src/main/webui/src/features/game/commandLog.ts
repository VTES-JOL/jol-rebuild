export interface LogCardRef {
    cardId: string | null;
    cardName: string | null;
    owner: string | null;
    region: string;
    position: number;
    childIndex: number;
    hidden: boolean;
}

// ── Turn / Phase ───────────────────────────────────────────────────────────────
export interface AdvancePhaseLog   { commandType: 'ADVANCE_PHASE';  actor: string; nextPhase: string }
export interface NextTurnLog       { commandType: 'NEXT_TURN';      actor: string; turn: string; playerName: string }

// ── Deck ───────────────────────────────────────────────────────────────────────
export interface DrawCardLog       { commandType: 'DRAW_CARD';       actor: string; count: number }
export interface ShuffleLibraryLog { commandType: 'SHUFFLE_LIBRARY'; actor: string }
export interface ShuffleCryptLog   { commandType: 'SHUFFLE_CRYPT';   actor: string }

// ── Card Movement ──────────────────────────────────────────────────────────────
export interface PlayCardLog       { commandType: 'PLAY_CARD';       actor: string; card: LogCardRef }
export interface DiscardCardLog    { commandType: 'DISCARD_CARD';    actor: string; card: LogCardRef }
export interface MoveCardLog       { commandType: 'MOVE_CARD';       actor: string; card: LogCardRef; targetPlayer: string; targetRegion: string }
export interface AttachCardLog     { commandType: 'ATTACH_CARD';     actor: string; card: LogCardRef; target: LogCardRef }
export interface MoveToCryptLog    { commandType: 'MOVE_TO_CRYPT';   actor: string; card: LogCardRef }
export interface InfluenceCardLog  { commandType: 'INFLUENCE_CARD';  actor: string; card: LogCardRef }

// ── Card State ─────────────────────────────────────────────────────────────────
export interface AddCounterLog        { commandType: 'ADD_COUNTER';        actor: string; card: LogCardRef; amount: number }
export interface RemoveCounterLog     { commandType: 'REMOVE_COUNTER';     actor: string; card: LogCardRef; amount: number }
export interface MoveToTorporLog      { commandType: 'MOVE_TO_TORPOR';     actor: string; card: LogCardRef }
export interface RescueFromTorporLog  { commandType: 'RESCUE_FROM_TORPOR'; actor: string; card: LogCardRef }
export interface BurnMinionLog        { commandType: 'BURN_MINION';        actor: string; card: LogCardRef }
export interface ContestCardLog       { commandType: 'CONTEST_CARD';       actor: string; card: LogCardRef }
export interface ClearContestCardLog  { commandType: 'CLEAR_CONTEST_CARD'; actor: string; card: LogCardRef }
export interface SetTitleLog          { commandType: 'SET_TITLE';          actor: string; card: LogCardRef; title: string }

// ── Player / Economy ───────────────────────────────────────────────────────────
export interface SetPoolLog       { commandType: 'SET_POOL';       actor: string; targetPlayer: string; amount: number }
export interface GainEdgeLog      { commandType: 'GAIN_EDGE';      actor: string }
export interface TransferBloodLog { commandType: 'TRANSFER_BLOOD'; actor: string; card: LogCardRef; amount: number }
export interface OustPlayerLog    { commandType: 'OUST_PLAYER';    actor: string; oustedPlayer: string }
export interface ReverseOrderLog  { commandType: 'REVERSE_ORDER';  actor: string }

export type CommandLogData =
    | AdvancePhaseLog | NextTurnLog
    | DrawCardLog | ShuffleLibraryLog | ShuffleCryptLog
    | PlayCardLog | DiscardCardLog | MoveCardLog | AttachCardLog | MoveToCryptLog | InfluenceCardLog
    | AddCounterLog | RemoveCounterLog | MoveToTorporLog | RescueFromTorporLog
    | BurnMinionLog | ContestCardLog | ClearContestCardLog | SetTitleLog
    | SetPoolLog | GainEdgeLog | TransferBloodLog | OustPlayerLog | ReverseOrderLog;
