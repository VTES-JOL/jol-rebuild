package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record SetCardNotes(String gameId, CardRef ref, String notes) implements GameCommand {
    @Override public boolean isImpulseExempt() { return true; }
}
