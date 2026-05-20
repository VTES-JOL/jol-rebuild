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
    @JsonSubTypes.Type(value = TransferPool.class,      name = "TRANSFER_POOL"),
    @JsonSubTypes.Type(value = GainEdge.class,          name = "GAIN_EDGE"),
    @JsonSubTypes.Type(value = TransferBlood.class,      name = "TRANSFER_BLOOD"),
    @JsonSubTypes.Type(value = MoveToReady.class,       name = "MOVE_TO_READY"),
    @JsonSubTypes.Type(value = MoveToCrypt.class,       name = "MOVE_TO_CRYPT"),
    @JsonSubTypes.Type(value = MoveToTorpor.class,      name = "MOVE_TO_TORPOR"),
    @JsonSubTypes.Type(value = RescueFromTorpor.class,  name = "RESCUE_FROM_TORPOR"),
    @JsonSubTypes.Type(value = BurnMinion.class,        name = "BURN_MINION"),
    @JsonSubTypes.Type(value = ContestCard.class,       name = "CONTEST_CARD"),
    @JsonSubTypes.Type(value = UncontestCard.class,     name = "UNCONTEST_CARD"),
    @JsonSubTypes.Type(value = SetTitle.class,          name = "SET_TITLE"),
    @JsonSubTypes.Type(value = OustPlayer.class,        name = "OUST_PLAYER"),
    @JsonSubTypes.Type(value = SetChoice.class,         name = "SET_CHOICE"),
    @JsonSubTypes.Type(value = ReverseOrder.class,      name = "REVERSE_ORDER"),
    @JsonSubTypes.Type(value = SetGameNotes.class,      name = "SET_GAME_NOTES"),
})
public sealed interface GameCommand
    permits AdvancePhase, NextTurn,
            DrawCard, ShuffleLibrary, ShuffleCrypt,
            DiscardCard, PlayCard, MoveCard, AttachCard,
            LockCard, UnlockCard, UnlockAll,
            AddCounter, RemoveCounter, SetCardNotes,
            SetPool, TransferPool, GainEdge,
            TransferBlood, MoveToReady, MoveToCrypt,
            MoveToTorpor, RescueFromTorpor, BurnMinion,
            ContestCard, UncontestCard, SetTitle,
            OustPlayer, SetChoice, ReverseOrder, SetGameNotes {

    String gameId();
}
