package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record CastPrisciBallot(
        String gameId,
        CardRef cardRef,
        String forOrAgainst
) implements GameCommand {
    @Override public boolean isImpulseExempt()    { return true; }
    @Override public boolean isSequencingExempt() { return true; }
    @Override public boolean isEnforcedOnly()      { return true; }
}
