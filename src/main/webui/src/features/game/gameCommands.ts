/** TypeScript mirror of the Java GameCommand sealed interface. */

export type AdvancePhaseCommand   = { type: 'ADVANCE_PHASE';   gameId: string };
export type NextTurnCommand       = { type: 'NEXT_TURN';       gameId: string };
export type DrawCardCommand       = { type: 'DRAW_CARD';       gameId: string };
export type ShuffleLibraryCommand = { type: 'SHUFFLE_LIBRARY'; gameId: string };
export type ShuffleCryptCommand   = { type: 'SHUFFLE_CRYPT';   gameId: string };
export type DiscardCardCommand    = { type: 'DISCARD_CARD';    gameId: string; cardId: string };
export type PlayCardCommand       = { type: 'PLAY_CARD';       gameId: string; cardId: string };
export type MoveCardCommand       = { type: 'MOVE_CARD';       gameId: string; cardId: string; targetRegionId: string; position: number };
export type AttachCardCommand     = { type: 'ATTACH_CARD';     gameId: string; cardId: string; targetCardId: string };
export type LockCardCommand       = { type: 'LOCK_CARD';       gameId: string; cardId: string };
export type UnlockCardCommand     = { type: 'UNLOCK_CARD';     gameId: string; cardId: string };
export type UnlockAllCommand      = { type: 'UNLOCK_ALL';      gameId: string };
export type AddCounterCommand     = { type: 'ADD_COUNTER';     gameId: string; cardId: string };
export type RemoveCounterCommand  = { type: 'REMOVE_COUNTER';  gameId: string; cardId: string };
export type SetCardNotesCommand   = { type: 'SET_CARD_NOTES';  gameId: string; cardId: string; notes: string };
export type SetPoolCommand        = { type: 'SET_POOL';        gameId: string; playerName: string; amount: number };
export type TransferPoolCommand   = { type: 'TRANSFER_POOL';   gameId: string; fromPlayer: string; toPlayer: string; amount: number };
export type GainEdgeCommand       = { type: 'GAIN_EDGE';       gameId: string };
export type InfluenceVampireCommand  = { type: 'INFLUENCE_VAMPIRE';   gameId: string; cardId: string };
export type MoveToReadyCommand    = { type: 'MOVE_TO_READY';   gameId: string; cardId: string };
export type MoveToCryptCommand    = { type: 'MOVE_TO_CRYPT';   gameId: string; cardId: string };
export type MoveToTorporCommand   = { type: 'MOVE_TO_TORPOR';  gameId: string; cardId: string };
export type RescueFromTorporCommand = { type: 'RESCUE_FROM_TORPOR'; gameId: string; cardId: string };
export type BurnMinionCommand     = { type: 'BURN_MINION';     gameId: string; cardId: string };
export type ContestCardCommand    = { type: 'CONTEST_CARD';    gameId: string; cardId: string };
export type UncontestCardCommand  = { type: 'UNCONTEST_CARD';  gameId: string; cardId: string };
export type SetTitleCommand       = { type: 'SET_TITLE';       gameId: string; cardId: string; title: string };
export type OustPlayerCommand     = { type: 'OUST_PLAYER';     gameId: string; playerName: string };
export type SetChoiceCommand      = { type: 'SET_CHOICE';      gameId: string; choice: string };
export type ReverseOrderCommand   = { type: 'REVERSE_ORDER';   gameId: string };
export type SetGameNotesCommand   = { type: 'SET_GAME_NOTES';  gameId: string; notes: string };

export type GameCommand =
    | AdvancePhaseCommand | NextTurnCommand
    | DrawCardCommand | ShuffleLibraryCommand | ShuffleCryptCommand
    | DiscardCardCommand | PlayCardCommand | MoveCardCommand | AttachCardCommand
    | LockCardCommand | UnlockCardCommand | UnlockAllCommand
    | AddCounterCommand | RemoveCounterCommand | SetCardNotesCommand
    | SetPoolCommand | TransferPoolCommand | GainEdgeCommand
    | InfluenceVampireCommand | MoveToReadyCommand | MoveToCryptCommand
    | MoveToTorporCommand | RescueFromTorporCommand | BurnMinionCommand
    | ContestCardCommand | UncontestCardCommand | SetTitleCommand
    | OustPlayerCommand | SetChoiceCommand | ReverseOrderCommand | SetGameNotesCommand;

export function moveCard(gameId: string, cardId: string, targetRegionId: string, position = -1): MoveCardCommand {
    return {type: 'MOVE_CARD', gameId, cardId, targetRegionId, position};
}

export function attachCard(gameId: string, cardId: string, targetCardId: string): AttachCardCommand {
    return {type: 'ATTACH_CARD', gameId, cardId, targetCardId};
}
