package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record PreventDamage(String gameId, CardRef combatantRef, int amount) implements GameCommand {
    @Override public boolean isSequencingExempt() { return true; }
    @Override public boolean isEnforcedOnly()     { return true; }
}
