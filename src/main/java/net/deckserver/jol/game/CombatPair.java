package net.deckserver.jol.game;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.game.command.CardRef;

@RegisterForReflection
public record CombatPair(CardRef attackerRef, CardRef defenderRef) {}
