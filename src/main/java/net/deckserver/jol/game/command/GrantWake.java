package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record GrantWake(
        String gameId,
        CardRef minionRef
) implements GameCommand {
    @Override public boolean isImpulseExempt() { return true; }
    @Override public boolean isSequencingExempt() { return true; }
    @Override public boolean isEnforcedOnly() { return true; }
}
