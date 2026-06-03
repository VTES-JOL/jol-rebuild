package net.deckserver.jol.game.effect;

/** The active turn advanced to a new player. */
public record TurnChangedEffect(String turn, String currentPlayerName) implements GameEffect {}
