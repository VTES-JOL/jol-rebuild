package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.ActionType;

@RegisterForReflection
public record DeclareAction(
        String gameId,
        CardRef actorRef,
        ActionType actionType,
        String targetPlayerName,
        String referendumTerms
) implements GameCommand {
    public DeclareAction(String gameId, CardRef actorRef, ActionType actionType, String targetPlayerName) {
        this(gameId, actorRef, actionType, targetPlayerName, null);
    }

    @Override public boolean isImpulseExempt()    { return true; }
    @Override public boolean isSequencingExempt() { return true; }
    @Override public boolean isEnforcedOnly() { return true; }
}