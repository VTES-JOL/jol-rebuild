package net.deckserver.jol.game.command;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.Phase;

@RegisterForReflection(registerFullHierarchy = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "commandType")
@JsonSubTypes({
        @JsonSubTypes.Type(value = CommandLogData.AdvancePhaseLog.class,      name = "ADVANCE_PHASE"),
        @JsonSubTypes.Type(value = CommandLogData.NextTurnLog.class,           name = "NEXT_TURN"),
        @JsonSubTypes.Type(value = CommandLogData.DrawCardLog.class,           name = "DRAW_CARD"),
        @JsonSubTypes.Type(value = CommandLogData.DrawCryptLog.class,          name = "DRAW_CRYPT"),
        @JsonSubTypes.Type(value = CommandLogData.ShuffleLibraryLog.class,     name = "SHUFFLE_LIBRARY"),
        @JsonSubTypes.Type(value = CommandLogData.ShuffleCryptLog.class,       name = "SHUFFLE_CRYPT"),
        @JsonSubTypes.Type(value = CommandLogData.PlayCardLog.class,           name = "PLAY_CARD"),
        @JsonSubTypes.Type(value = CommandLogData.DiscardCardLog.class,        name = "DISCARD_CARD"),
        @JsonSubTypes.Type(value = CommandLogData.MoveCardLog.class,           name = "MOVE_CARD"),
        @JsonSubTypes.Type(value = CommandLogData.AttachCardLog.class,         name = "ATTACH_CARD"),
        @JsonSubTypes.Type(value = CommandLogData.MoveToCryptLog.class,        name = "MOVE_TO_CRYPT"),
        @JsonSubTypes.Type(value = CommandLogData.InfluenceCardLog.class,      name = "INFLUENCE_CARD"),
        @JsonSubTypes.Type(value = CommandLogData.AddCounterLog.class,         name = "ADD_COUNTER"),
        @JsonSubTypes.Type(value = CommandLogData.RemoveCounterLog.class,      name = "REMOVE_COUNTER"),
        @JsonSubTypes.Type(value = CommandLogData.MoveToTorporLog.class,       name = "MOVE_TO_TORPOR"),
        @JsonSubTypes.Type(value = CommandLogData.RescueFromTorporLog.class,   name = "RESCUE_FROM_TORPOR"),
        @JsonSubTypes.Type(value = CommandLogData.BurnMinionLog.class,         name = "BURN_MINION"),
        @JsonSubTypes.Type(value = CommandLogData.ContestCardLog.class,        name = "CONTEST_CARD"),
        @JsonSubTypes.Type(value = CommandLogData.ClearContestCardLog.class,   name = "CLEAR_CONTEST_CARD"),
        @JsonSubTypes.Type(value = CommandLogData.SetTitleLog.class,           name = "SET_TITLE"),
        @JsonSubTypes.Type(value = CommandLogData.SetPoolLog.class,            name = "SET_POOL"),
        @JsonSubTypes.Type(value = CommandLogData.GainEdgeLog.class,           name = "GAIN_EDGE"),
        @JsonSubTypes.Type(value = CommandLogData.TransferBloodLog.class,      name = "TRANSFER_BLOOD"),
        @JsonSubTypes.Type(value = CommandLogData.OustPlayerLog.class,         name = "OUST_PLAYER"),
        @JsonSubTypes.Type(value = CommandLogData.ReverseOrderLog.class,       name = "REVERSE_ORDER"),
        @JsonSubTypes.Type(value = CommandLogData.OpenImpulseLog.class,        name = "OPEN_IMPULSE_WINDOW"),
        @JsonSubTypes.Type(value = CommandLogData.PassImpulseLog.class,        name = "PASS_IMPULSE"),
        @JsonSubTypes.Type(value = CommandLogData.ClaimImpulseLog.class,       name = "CLAIM_IMPULSE"),
        @JsonSubTypes.Type(value = CommandLogData.CloseImpulseLog.class,       name = "CLOSE_IMPULSE_WINDOW"),
})
public sealed interface CommandLogData
        permits
        CommandLogData.AdvancePhaseLog, CommandLogData.NextTurnLog,
        CommandLogData.DrawCardLog, CommandLogData.DrawCryptLog, CommandLogData.ShuffleLibraryLog, CommandLogData.ShuffleCryptLog,
        CommandLogData.PlayCardLog, CommandLogData.DiscardCardLog, CommandLogData.MoveCardLog,
        CommandLogData.AttachCardLog, CommandLogData.MoveToCryptLog, CommandLogData.InfluenceCardLog,
        CommandLogData.AddCounterLog, CommandLogData.RemoveCounterLog,
        CommandLogData.MoveToTorporLog, CommandLogData.RescueFromTorporLog,
        CommandLogData.BurnMinionLog, CommandLogData.ContestCardLog, CommandLogData.ClearContestCardLog,
        CommandLogData.SetTitleLog,
        CommandLogData.SetPoolLog, CommandLogData.GainEdgeLog, CommandLogData.TransferBloodLog,
        CommandLogData.OustPlayerLog, CommandLogData.ReverseOrderLog,
        CommandLogData.OpenImpulseLog, CommandLogData.PassImpulseLog, CommandLogData.ClaimImpulseLog, CommandLogData.CloseImpulseLog {

    String actor();

    // ── Turn / Phase ──────────────────────────────────────────────────────────
    record AdvancePhaseLog(String actor, Phase nextPhase) implements CommandLogData {}
    record NextTurnLog(String actor, String turn, String playerName) implements CommandLogData {}

    // ── Deck ──────────────────────────────────────────────────────────────────
    record DrawCardLog(String actor, int count) implements CommandLogData {}
    record DrawCryptLog(String actor, int count) implements CommandLogData {}
    record ShuffleLibraryLog(String actor) implements CommandLogData {}
    record ShuffleCryptLog(String actor) implements CommandLogData {}

    // ── Card Movement ─────────────────────────────────────────────────────────
    record PlayCardLog(String actor, LogCardRef card) implements CommandLogData {}
    record DiscardCardLog(String actor, LogCardRef card) implements CommandLogData {}
    record MoveCardLog(String actor, LogCardRef card, String targetPlayer, String targetRegion) implements CommandLogData {}
    record AttachCardLog(String actor, LogCardRef card, LogCardRef target) implements CommandLogData {}
    record MoveToCryptLog(String actor, LogCardRef card) implements CommandLogData {}
    record InfluenceCardLog(String actor, LogCardRef card) implements CommandLogData {}

    // ── Card State ────────────────────────────────────────────────────────────
    record AddCounterLog(String actor, LogCardRef card, int amount) implements CommandLogData {}
    record RemoveCounterLog(String actor, LogCardRef card, int amount) implements CommandLogData {}
    record MoveToTorporLog(String actor, LogCardRef card) implements CommandLogData {}
    record RescueFromTorporLog(String actor, LogCardRef card) implements CommandLogData {}
    record BurnMinionLog(String actor, LogCardRef card) implements CommandLogData {}
    record ContestCardLog(String actor, LogCardRef card) implements CommandLogData {}
    record ClearContestCardLog(String actor, LogCardRef card) implements CommandLogData {}
    record SetTitleLog(String actor, LogCardRef card, String title) implements CommandLogData {}

    // ── Player / Economy ──────────────────────────────────────────────────────
    record SetPoolLog(String actor, String targetPlayer, int amount) implements CommandLogData {}
    record GainEdgeLog(String actor) implements CommandLogData {}
    /** amount > 0: pool → card; amount < 0: card → pool */
    record TransferBloodLog(String actor, LogCardRef card, int amount) implements CommandLogData {}
    record OustPlayerLog(String actor, String oustedPlayer) implements CommandLogData {}
    record ReverseOrderLog(String actor) implements CommandLogData {}

    // ── Impulse / Sequencing ──────────────────────────────────────────────────
    record OpenImpulseLog(String actor, String context, String actingPlayer) implements CommandLogData {}
    record PassImpulseLog(String actor) implements CommandLogData {}
    record ClaimImpulseLog(String actor) implements CommandLogData {}
    record CloseImpulseLog(String actor) implements CommandLogData {}
}
