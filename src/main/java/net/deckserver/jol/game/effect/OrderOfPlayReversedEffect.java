package net.deckserver.jol.game.effect;

/** The order of play was reversed or restored. */
public record OrderOfPlayReversedEffect(boolean reversed) implements GameEffect {}
