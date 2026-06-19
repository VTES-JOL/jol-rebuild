package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record CastVotes(
        String gameId,
        String playerName,
        CardRef cardRef,
        int amount,
        String forOrAgainst
) implements GameCommand {
    @Override public boolean isImpulseExempt()    { return true; }
    @Override public boolean isSequencingExempt() { return true; }
    @Override public boolean isEnforcedOnly()      { return true; }
}
