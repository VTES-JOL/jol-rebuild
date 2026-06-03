package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record SetChoice(String gameId, String playerName, String choice) implements GameCommand {
    @Override public boolean isImpulseExempt() { return true; }
}
