package net.deckserver.jol.game.effect;

/** Moves the top count cards from a player's LIBRARY to HAND (replacement draw). */
public record DrawCardEffect(String playerName, int count) implements GameEffect {}
