package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.PressDecision;

@RegisterForReflection
public record DeclarePress(String gameId, CardRef combatantRef, PressDecision decision) implements GameCommand {
    @Override public boolean isImpulseExempt()    { return true; }
    @Override public boolean isSequencingExempt() { return true; }
    @Override public boolean isEnforcedOnly()     { return true; }
}
