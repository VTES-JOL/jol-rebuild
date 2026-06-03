package net.deckserver.jol.game.effect;

/** A player's pool changed by delta (positive = gained, negative = lost). */
public record PlayerPoolChangedEffect(String playerName, int delta) implements GameEffect {}
