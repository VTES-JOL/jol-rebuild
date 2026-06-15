package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.StrikeType;

@RegisterForReflection
public record DeclareStrike(String gameId, CardRef combatantRef, StrikeType strikeType, CardRef weaponRef) implements GameCommand {
    @Override public boolean isImpulseExempt()    { return true; }
    @Override public boolean isSequencingExempt() { return true; }
    @Override public boolean isEnforcedOnly()     { return true; }
}
