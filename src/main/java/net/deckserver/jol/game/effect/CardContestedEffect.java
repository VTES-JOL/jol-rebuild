package net.deckserver.jol.game.effect;

/** A card's contested state changed. */
public record CardContestedEffect(String cardId, boolean contested) implements GameEffect {}
