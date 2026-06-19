package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.Range;

@RegisterForReflection
public record Maneuver(String gameId, CardRef combatantRef, Range toRange) implements GameCommand {
    @Override public boolean isImpulseExempt()    { return true; }
    @Override public boolean isSequencingExempt() { return true; }
    @Override public boolean isEnforcedOnly()     { return true; }
}
