package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record SetRulesMode(String gameId, boolean enforced) implements GameCommand {
    @Override public boolean isImpulseExempt()    { return true; }
    @Override public boolean isSequencingExempt() { return true; }
}
