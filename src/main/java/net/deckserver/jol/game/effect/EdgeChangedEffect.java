package net.deckserver.jol.game.effect;

/** The Edge token changed hands. holderName is null when the edge is unclaimed. */
public record EdgeChangedEffect(String holderName) implements GameEffect {}
