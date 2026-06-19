package net.deckserver.jol.game.effect;

import net.deckserver.jol.game.CombatPair;

import java.util.List;

/** The queue of pending combats changed. */
public record CombatQueueChangedEffect(List<CombatPair> queue) implements GameEffect {}
