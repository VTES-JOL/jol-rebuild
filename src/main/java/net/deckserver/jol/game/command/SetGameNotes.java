package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record SetGameNotes(String gameId, String notes) implements GameCommand {
    @Override public boolean isImpulseExempt() { return true; }
}
