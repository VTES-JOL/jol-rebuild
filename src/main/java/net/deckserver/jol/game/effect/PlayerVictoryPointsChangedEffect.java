package net.deckserver.jol.game.effect;

/** A player's victory points changed by the given delta. */
public record PlayerVictoryPointsChangedEffect(String playerName, float delta) implements GameEffect {}
