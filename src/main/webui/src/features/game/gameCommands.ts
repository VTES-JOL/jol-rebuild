/** TypeScript mirror of the Java GameCommand sealed interface. */

import type {RegionType} from './types.ts';

/** Position-based card address. childIndex=-1 means the top-level card; >=0 is an attached child. */
export type CardRef = { playerName: string; regionType: RegionType; position: number; childIndex: number };

export function cardRef(playerName: string, regionType: RegionType, position: number, childIndex = -1): CardRef {
    return {playerName, regionType, position, childIndex};
}

export type AdvancePhaseCommand   = { type: 'ADVANCE_PHASE';   gameId: string };
export type NextTurnCommand       = { type: 'NEXT_TURN';       gameId: string };
export type DrawCardCommand       = { type: 'DRAW_CARD';       gameId: string };
export type ShuffleLibraryCommand = { type: 'SHUFFLE_LIBRARY'; gameId: string };
export type ShuffleCryptCommand   = { type: 'SHUFFLE_CRYPT';   gameId: string };
export type DiscardCardCommand    = { type: 'DISCARD_CARD';    gameId: string; ref: CardRef };
export type PlayCardCommand       = { type: 'PLAY_CARD';       gameId: string; ref: CardRef; targetPlayerName: string; targetRegionType: RegionType };
export type MoveCardCommand       = { type: 'MOVE_CARD';       gameId: string; ref: CardRef; targetPlayerName: string; targetRegionType: RegionType; position: number };
export type AttachCardCommand     = { type: 'ATTACH_CARD';     gameId: string; ref: CardRef; targetRef: CardRef };
export type LockCardCommand       = { type: 'LOCK_CARD';       gameId: string; ref: CardRef };
export type UnlockCardCommand     = { type: 'UNLOCK_CARD';     gameId: string; ref: CardRef };
export type UnlockAllCommand      = { type: 'UNLOCK_ALL';      gameId: string };
export type AddCounterCommand     = { type: 'ADD_COUNTER';     gameId: string; ref: CardRef; amount: number };
export type RemoveCounterCommand  = { type: 'REMOVE_COUNTER';  gameId: string; ref: CardRef; amount: number };
export type SetCardNotesCommand   = { type: 'SET_CARD_NOTES';  gameId: string; ref: CardRef; notes: string };
export type SetPoolCommand        = { type: 'SET_POOL';        gameId: string; playerName: string; amount: number };
export type TransferPoolCommand   = { type: 'TRANSFER_POOL';   gameId: string; playerName: string; ref: CardRef; amount: number };
export type GainEdgeCommand       = { type: 'GAIN_EDGE';       gameId: string };
export type InfluenceVampireCommand  = { type: 'INFLUENCE_VAMPIRE';   gameId: string; ref: CardRef; amount: number };
export type MoveToReadyCommand    = { type: 'MOVE_TO_READY';   gameId: string; ref: CardRef };
export type MoveToCryptCommand    = { type: 'MOVE_TO_CRYPT';   gameId: string; ref: CardRef };
export type MoveToTorporCommand   = { type: 'MOVE_TO_TORPOR';  gameId: string; ref: CardRef };
export type RescueFromTorporCommand = { type: 'RESCUE_FROM_TORPOR'; gameId: string; ref: CardRef };
export type BurnMinionCommand     = { type: 'BURN_MINION';     gameId: string; ref: CardRef };
export type ContestCardCommand    = { type: 'CONTEST_CARD';    gameId: string; ref: CardRef };
export type UncontestCardCommand  = { type: 'UNCONTEST_CARD';  gameId: string; ref: CardRef };
export type SetTitleCommand       = { type: 'SET_TITLE';       gameId: string; ref: CardRef; title: string };
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

export function moveCard(gameId: string, ref: CardRef, targetPlayerName: string, targetRegionType: RegionType, position = -1): MoveCardCommand {
    return {type: 'MOVE_CARD', gameId, ref, targetPlayerName, targetRegionType, position};
}

export function attachCard(gameId: string, ref: CardRef, targetRef: CardRef): AttachCardCommand {
    return {type: 'ATTACH_CARD', gameId, ref, targetRef};
}

export function lockCard(gameId: string, ref: CardRef): LockCardCommand {
    return {type: 'LOCK_CARD', gameId, ref};
}

export function unlockCard(gameId: string, ref: CardRef): UnlockCardCommand {
    return {type: 'UNLOCK_CARD', gameId, ref};
}

export function addCounter(gameId: string, ref: CardRef, amount = 1): AddCounterCommand {
    return {type: 'ADD_COUNTER', gameId, ref, amount};
}

export function removeCounter(gameId: string, ref: CardRef, amount = 1): RemoveCounterCommand {
    return {type: 'REMOVE_COUNTER', gameId, ref, amount};
}

export function discardCard(gameId: string, ref: CardRef): DiscardCardCommand {
    return {type: 'DISCARD_CARD', gameId, ref};
}

export function moveToTorpor(gameId: string, ref: CardRef): MoveToTorporCommand {
    return {type: 'MOVE_TO_TORPOR', gameId, ref};
}

export function rescueFromTorpor(gameId: string, ref: CardRef): RescueFromTorporCommand {
    return {type: 'RESCUE_FROM_TORPOR', gameId, ref};
}

export function moveToCrypt(gameId: string, ref: CardRef): MoveToCryptCommand {
    return {type: 'MOVE_TO_CRYPT', gameId, ref};
}

export function burnMinion(gameId: string, ref: CardRef): BurnMinionCommand {
    return {type: 'BURN_MINION', gameId, ref};
}

export function contestCard(gameId: string, ref: CardRef): ContestCardCommand {
    return {type: 'CONTEST_CARD', gameId, ref};
}

export function uncontestCard(gameId: string, ref: CardRef): UncontestCardCommand {
    return {type: 'UNCONTEST_CARD', gameId, ref};
}

export function setTitle(gameId: string, ref: CardRef, title: string): SetTitleCommand {
    return {type: 'SET_TITLE', gameId, ref, title};
}

export function setCardNotes(gameId: string, ref: CardRef, notes: string): SetCardNotesCommand {
    return {type: 'SET_CARD_NOTES', gameId, ref, notes};
}
