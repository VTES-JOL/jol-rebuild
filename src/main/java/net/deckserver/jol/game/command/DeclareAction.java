package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.ActionType;

@RegisterForReflection
public record DeclareAction(
        String gameId,
        CardRef actorRef,
        ActionType actionType,
        String targetPlayerName
) implements GameCommand {
    @Override public boolean isImpulseExempt()    { return true; }
    @Override public boolean isSequencingExempt() { return true; }
}
