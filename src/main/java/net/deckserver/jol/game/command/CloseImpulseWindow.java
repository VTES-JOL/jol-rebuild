package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record CloseImpulseWindow(String gameId) implements GameCommand {
    @Override public boolean isImpulseExempt() { return true; }
}
