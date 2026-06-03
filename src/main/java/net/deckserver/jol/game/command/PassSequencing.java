package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record PassSequencing(String gameId, String playerName) implements GameCommand {
    @Override public boolean isImpulseExempt()    { return true; }
    @Override public boolean isSequencingExempt() { return true; }
}
