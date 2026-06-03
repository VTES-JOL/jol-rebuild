package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record ClaimImpulse(String gameId, String playerName) implements GameCommand {
    @Override public boolean isImpulseExempt() { return true; }
}
