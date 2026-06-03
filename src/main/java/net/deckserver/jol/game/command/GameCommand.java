package net.deckserver.jol.game.command;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = AdvancePhase.class,      name = "ADVANCE_PHASE"),
    @JsonSubTypes.Type(value = NextTurn.class,          name = "NEXT_TURN"),
    @JsonSubTypes.Type(value = DrawCard.class,          name = "DRAW_CARD"),
    @JsonSubTypes.Type(value = DrawCrypt.class,         name = "DRAW_CRYPT"),
    @JsonSubTypes.Type(value = ShuffleLibrary.class,    name = "SHUFFLE_LIBRARY"),
    @JsonSubTypes.Type(value = ShuffleCrypt.class,      name = "SHUFFLE_CRYPT"),
    @JsonSubTypes.Type(value = DiscardCard.class,       name = "DISCARD_CARD"),
    @JsonSubTypes.Type(value = PlayCard.class,          name = "PLAY_CARD"),
    @JsonSubTypes.Type(value = MoveCard.class,          name = "MOVE_CARD"),
    @JsonSubTypes.Type(value = AttachCard.class,        name = "ATTACH_CARD"),
    @JsonSubTypes.Type(value = LockCard.class,          name = "LOCK_CARD"),
    @JsonSubTypes.Type(value = UnlockCard.class,        name = "UNLOCK_CARD"),
    @JsonSubTypes.Type(value = UnlockAll.class,         name = "UNLOCK_ALL"),
    @JsonSubTypes.Type(value = AddCounter.class,        name = "ADD_COUNTER"),
    @JsonSubTypes.Type(value = RemoveCounter.class,     name = "REMOVE_COUNTER"),
    @JsonSubTypes.Type(value = SetCardNotes.class,      name = "SET_CARD_NOTES"),
    @JsonSubTypes.Type(value = SetPool.class,           name = "SET_POOL"),
    @JsonSubTypes.Type(value = GainEdge.class,           name = "GAIN_EDGE"),
    @JsonSubTypes.Type(value = TransferBlood.class,      name = "TRANSFER_BLOOD"),
    @JsonSubTypes.Type(value = InfluenceCard.class,      name = "INFLUENCE_CARD"),
    @JsonSubTypes.Type(value = MoveToCrypt.class,       name = "MOVE_TO_CRYPT"),
    @JsonSubTypes.Type(value = MoveToTorpor.class,      name = "MOVE_TO_TORPOR"),
    @JsonSubTypes.Type(value = RescueFromTorpor.class,  name = "RESCUE_FROM_TORPOR"),
    @JsonSubTypes.Type(value = BurnMinion.class,        name = "BURN_MINION"),
    @JsonSubTypes.Type(value = ContestCard.class,       name = "CONTEST_CARD"),
    @JsonSubTypes.Type(value = ClearContestCard.class,  name = "CLEAR_CONTEST_CARD"),
    @JsonSubTypes.Type(value = SetTitle.class,          name = "SET_TITLE"),
    @JsonSubTypes.Type(value = OustPlayer.class,        name = "OUST_PLAYER"),
    @JsonSubTypes.Type(value = SetChoice.class,         name = "SET_CHOICE"),
    @JsonSubTypes.Type(value = ReverseOrder.class,      name = "REVERSE_ORDER"),
    @JsonSubTypes.Type(value = SetGameNotes.class,          name = "SET_GAME_NOTES"),
    @JsonSubTypes.Type(value = OpenImpulseWindow.class,         name = "OPEN_IMPULSE_WINDOW"),
    @JsonSubTypes.Type(value = PassImpulse.class,               name = "PASS_IMPULSE"),
    @JsonSubTypes.Type(value = ClaimImpulse.class,              name = "CLAIM_IMPULSE"),
    @JsonSubTypes.Type(value = CloseImpulseWindow.class,        name = "CLOSE_IMPULSE_WINDOW"),
    @JsonSubTypes.Type(value = DrawCryptToUncontrolled.class,   name = "DRAW_CRYPT_TO_UNCONTROLLED"),
    @JsonSubTypes.Type(value = MergeAdvanced.class,             name = "MERGE_ADVANCED"),
    @JsonSubTypes.Type(value = DeclareAction.class,             name = "DECLARE_ACTION"),
    @JsonSubTypes.Type(value = AttemptBlock.class,              name = "ATTEMPT_BLOCK"),
    @JsonSubTypes.Type(value = ResolveAction.class,             name = "RESOLVE_ACTION"),
    @JsonSubTypes.Type(value = AbortAction.class,               name = "ABORT_ACTION"),
    @JsonSubTypes.Type(value = PassSequencing.class,            name = "PASS_SEQUENCING"),
    @JsonSubTypes.Type(value = CloseSequencingWindow.class,     name = "CLOSE_SEQUENCING_WINDOW"),
})
public sealed interface GameCommand
    permits AdvancePhase, NextTurn,
            DrawCard, DrawCrypt, DrawCryptToUncontrolled, ShuffleLibrary, ShuffleCrypt,
            DiscardCard, PlayCard, MoveCard, AttachCard,
            LockCard, UnlockCard, UnlockAll,
            AddCounter, RemoveCounter, SetCardNotes,
            SetPool, GainEdge,
            TransferBlood, InfluenceCard, MoveToCrypt, MergeAdvanced,
            MoveToTorpor, RescueFromTorpor, BurnMinion,
            ContestCard, ClearContestCard, SetTitle,
            OustPlayer, SetChoice, ReverseOrder, SetGameNotes,
            OpenImpulseWindow, PassImpulse, ClaimImpulse, CloseImpulseWindow,
            DeclareAction, AttemptBlock, ResolveAction, AbortAction,
            PassSequencing, CloseSequencingWindow {

    String gameId();

    default boolean isImpulseExempt()    { return false; }
    default boolean isSequencingExempt() { return false; }
}
