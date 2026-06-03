package net.deckserver.jol.game.effect;

/** A player was ousted (pool reached 0). */
public record PlayerOustedEffect(String playerName) implements GameEffect {}
