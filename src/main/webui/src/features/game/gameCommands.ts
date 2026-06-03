/** TypeScript mirror of the Java GameCommand sealed interface. */

import type {RegionType} from './types.ts';

/** Position-based card address. childIndex=-1 means the top-level card; >=0 is an attached child. */
export type CardRef = { playerName: string; regionType: RegionType; position: number; childIndex: number };

export function cardRef(playerName: string, regionType: RegionType, position: number, childIndex = -1): CardRef {
    return {playerName, regionType, position, childIndex};
}

export type AdvancePhaseCommand = { type: 'ADVANCE_PHASE'; gameId: string };
export type NextTurnCommand = { type: 'NEXT_TURN'; gameId: string };
export type DrawCardCommand = { type: 'DRAW_CARD'; gameId: string; count: number };
export type DrawCryptCommand = { type: 'DRAW_CRYPT'; gameId: string; count: number };
export type ShuffleLibraryCommand = { type: 'SHUFFLE_LIBRARY'; gameId: string };
export type ShuffleCryptCommand = { type: 'SHUFFLE_CRYPT'; gameId: string };
export type DiscardCardCommand = { type: 'DISCARD_CARD'; gameId: string; ref: CardRef };
export type PlayCardCommand = {
    type: 'PLAY_CARD';
    gameId: string;
    ref: CardRef;
    targetPlayerName: string;
    targetRegionType: RegionType
};
export type MoveCardCommand = {
    type: 'MOVE_CARD';
    gameId: string;
    ref: CardRef;
    targetPlayerName: string;
    targetRegionType: RegionType;
    position: number
};
export type AttachCardCommand = { type: 'ATTACH_CARD'; gameId: string; ref: CardRef; targetRef: CardRef };
export type LockCardCommand = { type: 'LOCK_CARD'; gameId: string; ref: CardRef };
export type UnlockCardCommand = { type: 'UNLOCK_CARD'; gameId: string; ref: CardRef };
export type UnlockAllCommand = { type: 'UNLOCK_ALL'; gameId: string };
export type AddCounterCommand = { type: 'ADD_COUNTER'; gameId: string; ref: CardRef; amount: number };
export type RemoveCounterCommand = { type: 'REMOVE_COUNTER'; gameId: string; ref: CardRef; amount: number };
export type SetCardNotesCommand = { type: 'SET_CARD_NOTES'; gameId: string; ref: CardRef; notes: string };
export type SetPoolCommand = { type: 'SET_POOL'; gameId: string; playerName: string; amount: number };
export type GainEdgeCommand = { type: 'GAIN_EDGE'; gameId: string };
export type TransferBloodCommand = { type: 'TRANSFER_BLOOD'; gameId: string; ref: CardRef; amount: number };
export type InfluenceCardCommand = { type: 'INFLUENCE_CARD'; gameId: string; ref: CardRef };
export type MoveToCryptCommand = { type: 'MOVE_TO_CRYPT'; gameId: string; ref: CardRef };
export type MoveToTorporCommand = { type: 'MOVE_TO_TORPOR'; gameId: string; ref: CardRef };
export type RescueFromTorporCommand = { type: 'RESCUE_FROM_TORPOR'; gameId: string; ref: CardRef };
export type BurnMinionCommand = { type: 'BURN_MINION'; gameId: string; ref: CardRef };
export type ContestCardCommand = { type: 'CONTEST_CARD'; gameId: string; ref: CardRef };
export type ClearContestCardCommand = { type: 'CLEAR_CONTEST_CARD'; gameId: string; ref: CardRef };
export type SetTitleCommand = { type: 'SET_TITLE'; gameId: string; ref: CardRef; title: string };
export type OustPlayerCommand = { type: 'OUST_PLAYER'; gameId: string; playerName: string };
export type SetChoiceCommand = { type: 'SET_CHOICE'; gameId: string; playerName: string; choice: string };
export type ReverseOrderCommand = { type: 'REVERSE_ORDER'; gameId: string };
export type SetGameNotesCommand = { type: 'SET_GAME_NOTES'; gameId: string; notes: string };

export type ImpulseContext = 'UNDIRECTED' | 'DIRECTED_SINGLE' | 'DIRECTED_MULTI' | 'COMBAT';
export type OpenImpulseWindowCommand = { type: 'OPEN_IMPULSE_WINDOW'; gameId: string; context: ImpulseContext; actingPlayer: string; targetPlayerName?: string | null };
export type PassImpulseCommand = { type: 'PASS_IMPULSE'; gameId: string; playerName: string };
export type ClaimImpulseCommand = { type: 'CLAIM_IMPULSE'; gameId: string; playerName: string };
export type CloseImpulseWindowCommand = { type: 'CLOSE_IMPULSE_WINDOW'; gameId: string };

export type DeclareActionCommand = {
    type: 'DECLARE_ACTION';
    gameId: string;
    actorRef: import('./types').CardRef;
    actionType: import('./types').ActionType;
    targetPlayerName?: string | null;
};
export type AttemptBlockCommand = {
    type: 'ATTEMPT_BLOCK';
    gameId: string;
    blockerRef: import('./types').CardRef;
};
export type ResolveActionCommand = { type: 'RESOLVE_ACTION'; gameId: string };
export type AbortActionCommand = { type: 'ABORT_ACTION'; gameId: string };
export type PassSequencingCommand = { type: 'PASS_SEQUENCING'; gameId: string; playerName: string };
export type CloseSequencingWindowCommand = { type: 'CLOSE_SEQUENCING_WINDOW'; gameId: string };

export type GameCommand =
    | AdvancePhaseCommand | NextTurnCommand
    | DrawCardCommand | DrawCryptCommand | ShuffleLibraryCommand | ShuffleCryptCommand
    | DiscardCardCommand | PlayCardCommand | MoveCardCommand | AttachCardCommand
    | LockCardCommand | UnlockCardCommand | UnlockAllCommand
    | AddCounterCommand | RemoveCounterCommand | SetCardNotesCommand
    | SetPoolCommand | GainEdgeCommand
    | TransferBloodCommand | InfluenceCardCommand | MoveToCryptCommand
    | MoveToTorporCommand | RescueFromTorporCommand | BurnMinionCommand
    | ContestCardCommand | ClearContestCardCommand | SetTitleCommand
    | OustPlayerCommand | SetChoiceCommand | ReverseOrderCommand | SetGameNotesCommand
    | OpenImpulseWindowCommand | PassImpulseCommand | ClaimImpulseCommand | CloseImpulseWindowCommand
    | DeclareActionCommand | AttemptBlockCommand | ResolveActionCommand | AbortActionCommand
    | PassSequencingCommand | CloseSequencingWindowCommand;

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

export function playCard(gameId: string, ref: CardRef, targetPlayerName: string, targetRegionType: RegionType = 'READY'): PlayCardCommand {
    return {type: 'PLAY_CARD', gameId, ref, targetPlayerName, targetRegionType};
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

export function clearContestCard(gameId: string, ref: CardRef): ClearContestCardCommand {
    return {type: 'CLEAR_CONTEST_CARD', gameId, ref};
}

export function setTitle(gameId: string, ref: CardRef, title: string): SetTitleCommand {
    return {type: 'SET_TITLE', gameId, ref, title};
}

export function setCardNotes(gameId: string, ref: CardRef, notes: string): SetCardNotesCommand {
    return {type: 'SET_CARD_NOTES', gameId, ref, notes};
}

/** Move blood from the controller's pool onto a card (READY, TORPOR, or UNCONTROLLED). */
export function transferBloodOn(gameId: string, ref: CardRef): TransferBloodCommand {
    return {type: 'TRANSFER_BLOOD', gameId, ref, amount: 1};
}

/** Move blood from a card back to the controller's pool (READY, TORPOR, or UNCONTROLLED). */
export function transferBloodOff(gameId: string, ref: CardRef): TransferBloodCommand {
    return {type: 'TRANSFER_BLOOD', gameId, ref, amount: -1};
}

/** Move a fully influenced vampire/imbued from UNCONTROLLED to the READY region. */
export function influenceCard(gameId: string, ref: CardRef): InfluenceCardCommand {
    return {type: 'INFLUENCE_CARD', gameId, ref};
}

export function drawCard(gameId: string, count = 1): DrawCardCommand {
    return {type: 'DRAW_CARD', gameId, count};
}

export function drawCrypt(gameId: string, count = 1): DrawCryptCommand {
    return {type: 'DRAW_CRYPT', gameId, count};
}

export function shuffleLibrary(gameId: string): ShuffleLibraryCommand {
    return {type: 'SHUFFLE_LIBRARY', gameId};
}

export function shuffleCrypt(gameId: string): ShuffleCryptCommand {
    return {type: 'SHUFFLE_CRYPT', gameId};
}

export function setPool(gameId: string, playerName: string, amount: number): SetPoolCommand {
    return {type: 'SET_POOL', gameId, playerName, amount};
}

export function gainEdge(gameId: string): GainEdgeCommand {
    return {type: 'GAIN_EDGE', gameId};
}

export function oustPlayer(gameId: string, playerName: string): OustPlayerCommand {
    return {type: 'OUST_PLAYER', gameId, playerName};
}

export function setChoice(gameId: string, playerName: string, choice: string): SetChoiceCommand {
    return {type: 'SET_CHOICE', gameId, playerName, choice};
}

export function reverseOrder(gameId: string): ReverseOrderCommand {
    return {type: 'REVERSE_ORDER', gameId};
}

export function unlockAll(gameId: string): UnlockAllCommand {
    return {type: 'UNLOCK_ALL', gameId};
}

export function openImpulseWindow(gameId: string, context: ImpulseContext, actingPlayer: string, targetPlayerName?: string | null): OpenImpulseWindowCommand {
    return {type: 'OPEN_IMPULSE_WINDOW', gameId, context, actingPlayer, targetPlayerName};
}

export function passImpulse(gameId: string, playerName: string): PassImpulseCommand {
    return {type: 'PASS_IMPULSE', gameId, playerName};
}

export function claimImpulse(gameId: string, playerName: string): ClaimImpulseCommand {
    return {type: 'CLAIM_IMPULSE', gameId, playerName};
}

export function closeImpulseWindow(gameId: string): CloseImpulseWindowCommand {
    return {type: 'CLOSE_IMPULSE_WINDOW', gameId};
}

export function declareAction(
    gameId: string,
    actorRef: import('./types').CardRef,
    actionType: import('./types').ActionType,
    targetPlayerName?: string | null,
): DeclareActionCommand {
    return {type: 'DECLARE_ACTION', gameId, actorRef, actionType, targetPlayerName};
}

export function attemptBlock(gameId: string, blockerRef: import('./types').CardRef): AttemptBlockCommand {
    return {type: 'ATTEMPT_BLOCK', gameId, blockerRef};
}

export function resolveAction(gameId: string): ResolveActionCommand {
    return {type: 'RESOLVE_ACTION', gameId};
}

export function abortAction(gameId: string): AbortActionCommand {
    return {type: 'ABORT_ACTION', gameId};
}

export function passSequencing(gameId: string, playerName: string): PassSequencingCommand {
    return {type: 'PASS_SEQUENCING', gameId, playerName};
}

export function closeSequencingWindow(gameId: string): CloseSequencingWindowCommand {
    return {type: 'CLOSE_SEQUENCING_WINDOW', gameId};
}
