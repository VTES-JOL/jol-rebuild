package net.deckserver.jol.game.effect;

/** A card's locked state changed. */
public record CardLockedEffect(String cardId, boolean locked) implements GameEffect {}
